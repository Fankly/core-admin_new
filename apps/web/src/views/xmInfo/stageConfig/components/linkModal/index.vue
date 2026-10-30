<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal link-process-modal"
    resize
    show-zoom
    fullscreen
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="1100px"
    height="600px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="air-modal-body air-modal-body--table">
      <div class="air-modal-tip">
        <i class="el-icon-info air-modal-tip__icon" aria-hidden="true"></i>
        <span class="air-modal-tip__text">
          勾选左侧步骤后点击
          <b class="air-modal-tip__count">→</b>
          加入已关联；保存时将以此列表为准<b>全量覆盖</b>该方案的关联步骤。
        </span>
        <span class="air-modal-tip__names" :title="schemeName">当前方案：{{ schemeName }}</span>
      </div>

      <div class="link-transfer">
        <!-- 左侧：未关联步骤 -->
        <div class="link-transfer__pane">
          <div class="link-transfer__header">
            <span class="link-transfer__title">未关联步骤</span>
            <el-input v-model.trim="leftKeyword" size="small" clearable placeholder="按步骤名称过滤" style="width: 180px" @input="handleLeftSearch">
              <template #prefix>
                <i class="el-icon-search" style="color: var(--color-primary, #00706b)"></i>
              </template>
            </el-input>
          </div>
          <div class="air-modal-table">
            <vxe-grid ref="leftGridRef" v-bind="leftGridOptions" v-on="leftGridEvents">
              <template #toolbar_actions>
                <span class="link-transfer__count">共 {{ leftFiltered.length }} 条</span>
              </template>
            </vxe-grid>
          </div>
        </div>

        <!-- 中间操作按钮 -->
        <div class="link-transfer__actions">
          <el-button plain size="small" type="primary" :disabled="!leftCheckedRows.length" @click="moveToRight" title="加入已关联">
            <i class="el-icon-right"></i>
          </el-button>
          <el-button plain size="small" type="primary" :disabled="!rightCheckedRows.length" @click="moveToLeft" title="移出已关联">
            <i class="el-icon-back"></i>
          </el-button>
        </div>

        <!-- 右侧：已关联步骤 -->
        <div class="link-transfer__pane">
          <div class="link-transfer__header">
            <span class="link-transfer__title">
              已关联步骤
              <b class="link-transfer__count-main">{{ rightData.length }}</b>
            </span>
            <el-input v-model.trim="rightKeyword" size="small" clearable placeholder="按步骤名称过滤" style="width: 180px" @input="handleRightSearch">
              <template #prefix>
                <i class="el-icon-search" style="color: var(--color-primary, #00706b)"></i>
              </template>
            </el-input>
          </div>
          <div class="air-modal-table">
            <vxe-grid ref="rightGridRef" v-bind="rightGridOptions" v-on="rightGridEvents">
              <template #toolbar_actions>
                <span class="link-transfer__count">共 {{ rightFiltered.length }} 条</span>
              </template>
            </vxe-grid>
          </div>
        </div>
      </div>

      <div class="air-modal-footer">
        <el-button :loading="loading" :disabled="loading" size="small" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
        <el-button :disabled="loading" size="small" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'linkModal'
}
</script>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps, VxeGridListeners } from 'vxe-table'
import { processGetPage, getAlreadyLinkProcess, linkProcess } from '@/api/xmInfo/stageConfig'

interface ProcessRow {
  id: string
  code?: string
  name?: string
  groupCode?: string
  groupName?: string
  operationRole?: string
  operationType?: number | string
  pslx?: number | string
  [key: string]: any
}

const emit = defineEmits<{
  (e: 'success'): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const modalTitle = ref('关联步骤')
const schemeName = ref('')
const dataId = ref('')

const leftGridRef = ref<any>(null)
const rightGridRef = ref<any>(null)

/** 全量步骤（左表数据源） */
const allProcesses = ref<ProcessRow[]>([])
/** 已关联步骤（右表数据源，全量） */
const rightData = ref<ProcessRow[]>([])
/** 左表未关联 = 全量 - 已关联 */
const leftData = ref<ProcessRow[]>([])

const leftKeyword = ref('')
const rightKeyword = ref('')

const leftCheckedRows = ref<ProcessRow[]>([])
const rightCheckedRows = ref<ProcessRow[]>([])

const operationTypeMap: Record<string, string> = { '1': '普通操作', '2': '工作流审批', '3': '评审意见' }
const pslxMap: Record<string, string> = { '1': '外围系统评审', '2': '联合会审评审', '3': '省专业预审退回', '4': '省财务、发展线下会审' }

const sharedColumns = [
  { type: 'checkbox', width: 48 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'code', title: '步骤编号', minWidth: 100 },
  { field: 'name', title: '步骤名称', minWidth: 160 },
  { field: 'groupName', title: '环节', width: 120 },
  {
    field: 'operationType',
    title: '操作类型',
    width: 110,
    formatter: ({ cellValue }: any) => operationTypeMap[String(cellValue)] || cellValue || '-'
  },
  {
    field: 'pslx',
    title: '评审类型',
    width: 120,
    formatter: ({ cellValue }: any) => pslxMap[String(cellValue)] || cellValue || '-'
  }
]

// ========== 左表（本地过滤） ==========
const leftFiltered = computed<ProcessRow[]>(() => {
  const kw = leftKeyword.value.trim().toLowerCase()
  if (!kw) return leftData.value
  return leftData.value.filter((r) => (r.name || '').toLowerCase().includes(kw) || (r.code || '').toLowerCase().includes(kw))
})

const leftGridOptions = reactive<VxeGridProps>({
  border: true,
  stripe: true,
  height: '100%',
  autoResize: true,
  showOverflow: true,
  headerAlign: 'center',
  align: 'center',
  rowConfig: { keyField: 'id', isHover: true, height: 36 },
  checkboxConfig: { highlight: true },
  toolbarConfig: {
    slots: { buttons: 'toolbar_actions' }
  },
  columns: sharedColumns,
  data: []
})

const leftGridEvents: VxeGridListeners = {
  checkboxChange: () => {
    leftCheckedRows.value = leftGridRef.value?.getCheckboxRecords?.() || []
  },
  checkboxAll: () => {
    leftCheckedRows.value = leftGridRef.value?.getCheckboxRecords?.() || []
  }
}

// ========== 右表（本地过滤） ==========
const rightFiltered = computed<ProcessRow[]>(() => {
  const kw = rightKeyword.value.trim().toLowerCase()
  if (!kw) return rightData.value
  return rightData.value.filter((r) => (r.name || '').toLowerCase().includes(kw) || (r.code || '').toLowerCase().includes(kw))
})

const rightGridOptions = reactive<VxeGridProps>({
  border: true,
  stripe: true,
  height: '100%',
  autoResize: true,
  showOverflow: true,
  headerAlign: 'center',
  align: 'center',
  rowConfig: { keyField: 'id', isHover: true, height: 36 },
  checkboxConfig: { highlight: true },
  toolbarConfig: {
    slots: { buttons: 'toolbar_actions' }
  },
  columns: sharedColumns,
  data: []
})

const rightGridEvents: VxeGridListeners = {
  checkboxChange: () => {
    rightCheckedRows.value = rightGridRef.value?.getCheckboxRecords?.() || []
  },
  checkboxAll: () => {
    rightCheckedRows.value = rightGridRef.value?.getCheckboxRecords?.() || []
  }
}

// ========== 数据加载 ==========
const loadData = async () => {
  if (!dataId.value) {
    ElMessage.warning('方案 ID 缺失')
    return
  }
  loading.value = true
  try {
    const [allRes, linkedRes] = await Promise.all([processGetPage({ page: 1, limit: 1000 }), getAlreadyLinkProcess({ dataId: dataId.value })])

    const records: ProcessRow[] = Array.isArray(allRes?.data?.records) ? allRes.data.records : Array.isArray(allRes?.data) ? allRes.data : []

    const linkedRaw = linkedRes?.data
    const linkedList: ProcessRow[] = Array.isArray(linkedRaw) ? linkedRaw : Array.isArray(linkedRaw?.records) ? linkedRaw.records : []

    const linkedIdSet = new Set(linkedList.map((r) => String(r.id)))

    rightData.value = records.filter((r) => linkedIdSet.has(String(r.id)))
    leftData.value = records.filter((r) => !linkedIdSet.has(String(r.id)))

    leftKeyword.value = ''
    rightKeyword.value = ''
    leftCheckedRows.value = []
    rightCheckedRows.value = []

    refreshLeftGrid()
    refreshRightGrid()
  } catch (e) {
    ElMessage.error((e as Error)?.message || '步骤数据加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const refreshLeftGrid = () => {
  const grid = leftGridRef.value
  if (!grid) return
  leftGridOptions.data = leftFiltered.value
  nextTick(() => {
    leftGridRef.value?.clearCheckboxRow?.()
    leftCheckedRows.value = []
  })
}

const refreshRightGrid = () => {
  const grid = rightGridRef.value
  if (!grid) return
  rightGridOptions.data = rightFiltered.value
  nextTick(() => {
    rightGridRef.value?.clearCheckboxRow?.()
    rightCheckedRows.value = []
  })
}

// ========== 搜索 ==========
const handleLeftSearch = () => {
  refreshLeftGrid()
}

const handleRightSearch = () => {
  refreshRightGrid()
}

// ========== 穿梭移动 ==========
const moveToRight = () => {
  if (!leftCheckedRows.value.length) return
  const moveIds = new Set(leftCheckedRows.value.map((r) => String(r.id)))
  const moving = leftData.value.filter((r) => moveIds.has(String(r.id)))
  leftData.value = leftData.value.filter((r) => !moveIds.has(String(r.id)))
  rightData.value = [...rightData.value, ...moving]
  leftCheckedRows.value = []
  refreshLeftGrid()
  refreshRightGrid()
}

const moveToLeft = () => {
  if (!rightCheckedRows.value.length) return
  const moveIds = new Set(rightCheckedRows.value.map((r) => String(r.id)))
  const moving = rightData.value.filter((r) => moveIds.has(String(r.id)))
  rightData.value = rightData.value.filter((r) => !moveIds.has(String(r.id)))
  leftData.value = [...leftData.value, ...moving]
  rightCheckedRows.value = []
  refreshLeftGrid()
  refreshRightGrid()
}

// ========== 保存 ==========
const handleSave = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const processIds = rightData.value.map((r) => String(r.id))
    const res = await linkProcess({
      onechartDataIds: [dataId.value],
      onechartProcessIds: processIds
    })
    if (res.success) {
      ElMessage.success('关联保存成功')
      emit('success')
      handleClose()
    } else {
      ElMessage.error(res.msg || '关联保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message || '关联保存失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  isShowModal.value = false
  allProcesses.value = []
  leftData.value = []
  rightData.value = []
  leftKeyword.value = ''
  rightKeyword.value = ''
  leftCheckedRows.value = []
  rightCheckedRows.value = []
}

const acceptParams = (params: { id: string; name: string }) => {
  dataId.value = params.id
  schemeName.value = params.name || ''
  modalTitle.value = `关联步骤${schemeName.value ? ` - ${schemeName.value}` : ''}`
  isShowModal.value = true
  nextTick(() => {
    loadData()
  })
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';

.link-process-modal {
  .vxe-modal--content {
    padding: 10px !important;
  }
}

.link-transfer {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 10px;
  overflow: hidden;
}

.link-transfer__pane {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.link-transfer__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px 8px;
}

.link-transfer__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1e293b);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.link-transfer__count-main {
  color: var(--color-primary, #00706b);
  font-size: 13px;
}

.link-transfer__count {
  font-size: 12px;
  color: var(--el-text-color-secondary, #64748b);
  font-weight: 400;
}

.link-transfer__actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 4px;

  .el-button {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 6px;
    font-size: 14px;
  }
}

.link-transfer .air-modal-table {
  flex: 1 1 0;
  min-height: 0;
}
</style>
