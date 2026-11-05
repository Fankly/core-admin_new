<template>
  <ModalShell :visible="visible" title="审核要点列表" :subtitle="subtitle" width="1100px" height="700px" @close="emit('close')">
    <div class="aep-list-head">
      <div class="aep-filter__grid aep-filter__grid--list">
        <div>
          <label class="aep-label">文件名称</label>
          <input v-model="filters.sourceFile" class="aep-input" type="text" placeholder="请输入文件名称" />
        </div>
        <div>
          <label class="aep-label">是否已经确认</label>
          <select v-model="filters.isConfirm" class="aep-select">
            <option value="">全部</option>
            <option value="1">已确认</option>
            <option value="0">待确认</option>
          </select>
        </div>
        <div>
          <label class="aep-label">是否已转化AI审核要点</label>
          <select v-model="filters.isSolidify" class="aep-select">
            <option value="">全部</option>
            <option value="1">已转</option>
            <option value="0">未转</option>
          </select>
        </div>
      </div>
      <div class="aep-filter__foot">
        <button class="aep-btn aep-btn--plain" @click="loadPointList">查询</button>
        <button class="aep-btn aep-btn--ghost" @click="resetFilters">重置</button>
      </div>
    </div>

    <div v-loading="loading" class="aep-table-region">
      <table v-resizable-table class="aep-table">
        <thead>
          <tr>
            <th style="width: 48px">
              <input type="checkbox" :checked="allChecked" @change="toggleAll" />
            </th>
            <th style="width: 64px">序号</th>
            <th style="min-width: 180px">审核要点</th>
            <th style="min-width: 240px">审核要点判断规则</th>
            <th style="min-width: 140px">原文出处</th>
            <th style="min-width: 120px">审核要点来源</th>
            <th style="min-width: 180px">来源文件</th>
            <th style="min-width: 120px">审核要点生效状态</th>
            <th style="min-width: 96px">是否已确认</th>
            <th style="min-width: 112px">确认时间</th>
            <th style="min-width: 160px">是否已转化AI审核要点</th>
            <th style="min-width: 128px">系统是否已实现</th>
            <th style="min-width: 88px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!rows.length">
            <td class="aep-empty-cell" colspan="13">{{ loading ? '加载中…' : '暂无数据' }}</td>
          </tr>
          <tr v-for="(row, index) in rows" :key="row.pointId">
            <td>
              <input v-model="checked" type="checkbox" :value="row.pointId" />
            </td>
            <td class="aep-td--index">{{ index + 1 }}</td>
            <td class="aep-td--strong"><ClampText :text="row.pointName || '—'" /></td>
            <td><ClampText :text="row.judgementRuleDesc || '—'" /></td>
            <td><ClampText :text="row.originalEvidence || '—'" /></td>
            <td><ClampText class="aep-clamp--nowrap" :text="pointSourceName(row.pointSource) || '—'" /></td>
            <td><ClampText :text="row.sourceFile || '—'" /></td>
            <td>
              <span v-if="row.effectiveStatus === '1'" class="aep-badge aep-badge--danger">
                <span class="aep-dot" style="background: var(--aep-danger)"></span>{{ row.effectiveStatusName || '失效' }}
              </span>
              <span v-else class="aep-badge aep-badge--success">
                <span class="aep-dot" style="background: var(--aep-success)"></span>{{ row.effectiveStatusName || '生效中' }}
              </span>
            </td>
            <td>
              <span v-if="row.isConfirm === '1'" class="aep-state aep-state--done">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ row.isConfirmName || '已确认' }}
              </span>
              <span v-else class="aep-state">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ row.isConfirmName || '待确认' }}
              </span>
            </td>
            <td>{{ formatTime(row.confirmTime) }}</td>
            <td>
              <span v-if="row.isSolidify === '1'" class="aep-badge aep-badge--teal">
                <span class="aep-dot" style="background: var(--aep-primary)"></span>{{ solidifyText(row.isSolidifyName, '已转') }}
              </span>
              <span v-else class="aep-badge aep-badge--gray">
                <span class="aep-dot" style="background: #94a3b8"></span>{{ solidifyText(row.isSolidifyName, '未转') }}
              </span>
            </td>
            <td>
              <span v-if="row.isImplement === '1'" class="aep-badge aep-badge--success">
                <span class="aep-dot" style="background: var(--aep-success)"></span>{{ row.isImplementName || '已实现' }}
              </span>
              <span v-else class="aep-badge aep-badge--gray">
                <span class="aep-dot" style="background: #94a3b8"></span>{{ row.isImplementName || '未实现' }}
              </span>
            </td>
            <td>
              <button class="aep-link" title="查看审核要点详情（只读）" @click="emit('detail', row)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="aep-modal__foot" style="justify-content: flex-end">
      <button class="aep-btn aep-btn--ghost aep-btn--lg" @click="emit('close')">关闭</button>
    </div>
  </ModalShell>
</template>

<script lang="ts">
export default {
  name: 'AepKnowledgeListModal'
}
</script>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { KnowledgePointVO, getKnowledgePointPage } from '@/api/ai/automaticExtractionPoints'
import { usePointSourceDict } from '../hooks/usePointSourceDict'
import { KnowledgeListQuery } from '../types'
import { vResizableTable } from '../directives/resizableTable'
import ClampText from './ClampText.vue'
import ModalShell from './ModalShell.vue'

/** 弹窗内一次性取数上限（列表为文件维度，量不大） */
const LIST_LIMIT = 200

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    visible: boolean
    /** 打开时带入的查询条件（来源文件 + 点击列对应的状态条件） */
    query?: KnowledgeListQuery | null
  }>(),
  { query: null }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'detail', row: KnowledgePointVO): void
}>()

const rows = ref<KnowledgePointVO[]>([])
const loading = ref(false)
const checked = ref<Array<string | number>>([])

/** 弹窗内筛选（字段名与接口 pointPage 一致，1/0 编码） */
const filters = reactive({ sourceFile: '', isConfirm: '', isSolidify: '' })

/** 审核要点来源字典（列展示用名称：码值转名称，接口给名称则原样） */
const { pointSourceName } = usePointSourceDict()

/** 「系统是否已实现」没有对应筛选项：按带入条件直接过滤（该列无值时不过滤） */
const queryImplement = computed(() => (props.query?.field === 'isImplement' ? props.query.value : ''))

/** 副标题：来源文件 + 本次点击带入的条件 */
const subtitle = computed(() => {
  const source = props.query?.sourceFile
  const label = props.query?.label
  if (!source && !label) return ''
  return `（来源：${source || '全部'}${label ? ` · ${label}` : ''}）`
})

/**
 * 取数：文件维度 = 打开时带入的文件（名称过滤，attachId 一并透传），
 * 状态条件取弹窗内筛选项（打开时已按点击的列代入）
 */
const loadPointList = async (): Promise<void> => {
  loading.value = true
  try {
    const res = await getKnowledgePointPage({
      limit: LIST_LIMIT,
      attachId: props.query?.attachId,
      sourceFile: filters.sourceFile.trim() || props.query?.sourceFile || undefined,
      isConfirm: filters.isConfirm || undefined,
      isSolidify: filters.isSolidify || undefined,
      isImplement: queryImplement.value || undefined
    })
    rows.value = res?.data?.records || []
  } catch (error) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

const allChecked = computed(() => rows.value.length > 0 && checked.value.length === rows.value.length)

const toggleAll = (event: Event): void => {
  checked.value = (event.target as HTMLInputElement).checked ? rows.value.map((x) => x.pointId) : []
}

const resetFilters = (): void => {
  filters.sourceFile = ''
  filters.isConfirm = ''
  filters.isSolidify = ''
  loadPointList()
}

/** 时间格式化：取到日 */
const formatTime = (value: string): string => (value ? String(value).replace('T', ' ').slice(0, 10) : '—')

/** 转化文案：后端返回的「已转译 / 未转译」统一显示为「已转化 / 未转化」 */
const solidifyText = (name: string, fallback: string): string => (name || fallback).replace(/转译/g, '转化')

/** 打开时按点击的列代入条件并取数 */
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    const query = props.query
    filters.sourceFile = ''
    // 点击哪一列，就带上哪一列的条件（提取 = 全部；已实现无筛选项，由 queryImplement 带入）
    filters.isConfirm = query?.field === 'isConfirm' ? query.value : ''
    filters.isSolidify = query?.field === 'isSolidify' ? query.value : ''
    checked.value = []
    loadPointList()
  }
)
</script>
