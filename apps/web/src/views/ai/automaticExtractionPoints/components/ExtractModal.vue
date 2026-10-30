<template>
  <ModalShell :visible="visible" title="文件智能解析与提取" width="900px" height="700px" @close="emit('close')">
    <!-- 步骤条 -->
    <div class="aep-steps">
      <div class="aep-steps__progress" :style="{ width: progressWidth }"></div>
      <div v-for="(step, index) in STEPS" :key="step" :class="['aep-step', { 'is-active': index < ACTIVE_STEP }]">
        <span class="aep-step__no">{{ index + 1 }}</span>
        <span class="aep-step__text">{{ step }}</span>
      </div>
    </div>

    <div class="aep-modal__body">
      <div class="aep-subcard">
        <div class="aep-subcard__head">
          <div class="aep-subcard__title">
            <span class="aep-subcard__num">①</span>
            查询并选择文件
            <span class="aep-danger-text" style="font-size: 12px; font-weight: 400">(来源于"预算业务文件共享"菜单已上传的文件)</span>
          </div>
          <div class="aep-subcard__search">
            <el-input
              v-model="filters.keyword"
              class="aep-search-keyword"
              placeholder="输入文件名称 / 文号 / 发布部门 快速搜索..."
              clearable
              @input="handleKeywordInput"
            >
              <template #prefix>
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </template>
            </el-input>
            <el-input v-model="filters.fwbm" class="aep-search-dept" placeholder="请输入发布部门" clearable @input="handleDeptInput" />
            <el-date-picker
              v-model="filters.fwYear"
              class="aep-year-picker"
              type="year"
              placeholder="选择年度"
              value-format="YYYY"
              format="YYYY"
              clearable
              @update:model-value="loadPickerList"
            />
          </div>
        </div>

        <div v-loading="loading" class="aep-table-region">
          <table v-resizable-table class="aep-table">
            <thead>
              <tr>
                <th style="width: 48px"></th>
                <th style="width: 64px">序号</th>
                <th>文件名称</th>
                <th>文号</th>
                <th>发布年度</th>
                <th>发布部门</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pagedFiles.length">
                <td class="aep-empty-cell" colspan="6">{{ loading ? '加载中…' : '暂无匹配的数据' }}</td>
              </tr>
              <tr
                v-for="(row, index) in pagedFiles"
                :key="row.attachId"
                :class="{ 'is-selected': selectedId === row.attachId }"
                style="cursor: pointer"
                @click="selectedId = row.attachId"
              >
                <td style="text-align: center">
                  <input v-model="selectedId" type="radio" name="aep-file-select" :value="row.attachId" />
                </td>
                <td class="aep-td--index">{{ (page - 1) * pageSize + index + 1 }}</td>
                <td>
                  <span class="tw-flex tw-items-center">
                    <span :class="['aep-filechip', (row.fileSuffix || '').toLowerCase() === 'pdf' ? 'aep-filechip--pdf' : 'aep-filechip--doc']">
                      {{ (row.fileSuffix || 'doc').toUpperCase() }}
                    </span>
                    <span class="aep-td--strong">{{ row.attachName || '—' }}</span>
                  </span>
                </td>
                <td>{{ row.wjzh || '—' }}</td>
                <td class="aep-td--num">{{ row.fwYear || '—' }}</td>
                <td>{{ row.fwbm || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="aep-subcard__foot">
          <span class="aep-subcard__hint">点击行或单选按钮选择文件</span>
          <el-pagination
            :current-page="page"
            background
            :page-sizes="[10, 20, 50, 100, 500]"
            :page-size="pageSize"
            :total="files.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
    </div>

    <div class="aep-modal__foot">
      <button class="aep-btn aep-btn--ghost aep-btn--lg" @click="emit('close')">关闭</button>
      <button class="aep-btn aep-btn--primary aep-btn--lg" @click="start">开始审核要点提取</button>
    </div>
  </ModalShell>
</template>

<script lang="ts">
export default {
  name: 'AepExtractModal'
}
</script>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { KnowledgePickerFileVO, getPickerFileList } from '@/api/ai/automaticExtractionPoints'
import { debounce } from 'lodash'
import { vResizableTable } from '../directives/resizableTable'
import ModalShell from './ModalShell.vue'

const props = defineProps<{
  /** 是否显示 */
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'start', attachIds: Array<string | number>): void
}>()

/** 处理步骤（当前处于第 2 步） */
const STEPS = ['文件智能解析', '审核要点提取', '审核要点确认', '审核要点应用']
const ACTIVE_STEP = 2

const progressWidth = computed(() => `${(100 * (ACTIVE_STEP - 1)) / (STEPS.length - 1)}%`)

const filters = reactive<{ keyword: string; fwbm: string; fwYear: string | null }>({ keyword: '', fwbm: '', fwYear: null })
/** 选中的来源文件 attachId（int64，保持字符串） */
const selectedId = ref<string | number | null>(null)

/** 可选文件（接口 picker/fileList 返回，已排除已建任务） */
const files = ref<KnowledgePickerFileVO[]>([])
const loading = ref(false)

/** 分页（接口一次性返回全部可选文件，前端分页） */
const page = ref(1)
const pageSize = ref(10)

/** 当前页数据 */
const pagedFiles = computed(() => files.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

/** 拉取可选文件列表 */
const loadPickerList = async (): Promise<void> => {
  loading.value = true
  try {
    const res = await getPickerFileList({
      keyword: filters.keyword.trim() || undefined,
      fwbm: filters.fwbm.trim() || undefined,
      fwYear: filters.fwYear || undefined
    })
    // 该接口 data 是数组，显式判断避免拿到非数组（如兜底的信封对象）导致渲染报错
    files.value = Array.isArray(res?.data) ? res.data : []
    page.value = 1
  } catch (error) {
    files.value = []
  } finally {
    loading.value = false
  }
}

/** 文本输入防抖刷新（300ms） */
const refreshDebounced = debounce(() => loadPickerList(), 300)
const handleKeywordInput = (): void => refreshDebounced()
const handleDeptInput = (): void => refreshDebounced()

/** 每页条数变化：回到第一页 */
const handleSizeChange = (size: number): void => {
  pageSize.value = size
  page.value = 1
}

/** 页码变化 */
const handleCurrentChange = (current: number): void => {
  page.value = current
}

/** 每次打开重置查询条件、分页与选中项，并拉取文件列表 */
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    filters.keyword = ''
    filters.fwbm = ''
    filters.fwYear = null
    selectedId.value = null
    page.value = 1
    loadPickerList()
  }
)

const start = (): void => emit('start', selectedId.value === null ? [] : [selectedId.value])
</script>
