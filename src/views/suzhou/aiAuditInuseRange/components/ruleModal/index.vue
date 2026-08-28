<!-- 适用审核规则 - 规则选择弹窗（vxe-grid；无操作按钮；批量编辑不回显） -->
<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="85%"
    height="85%"
    @close="handleClose"
    :loading="loading"
  >
    <div class="air-modal-body air-modal-body--table">
      <div v-if="echoCount > 0" class="air-modal-tip" role="status">
        <i class="el-icon-info air-modal-tip__icon" aria-hidden="true"></i>
        <span class="air-modal-tip__text"
          >已回显关联项 <em class="air-modal-tip__count">{{ echoCount }}</em> 个，翻页将自动勾选；未出现在当前页的项保存时仍会保留。</span
        >
        <span v-if="selectedNames" class="air-modal-tip__names" :title="selectedNames"> 已选中的规则名称：{{ selectedNames }} </span>
      </div>
      <div v-else-if="isBatchEdit" class="air-modal-tip" role="status">
        <i class="el-icon-warning-outline air-modal-tip__icon" aria-hidden="true"></i>
        <span class="air-modal-tip__text">批量编辑不回显已有关联，保存后将覆盖所选项目类型的配置。</span>
      </div>
      <div class="air-modal-table">
        <RangeVxeTable
          ref="proTableRef"
          row-key="ruleId"
          stripe
          :border="false"
          :columns="tableColumns"
          :search-columns="searchColumns"
          :data-callback="callBackHandle"
          :loading="tableLoading"
          :pagination="true"
          :request-api="getPageList"
          :request-error="handleRequestError"
          :request-auto="false"
          :search-col="4"
          :tool-button="false"
          row-click-mode="toggle"
          reserve-selection
        />
      </div>

      <div class="air-modal-footer">
        <el-button :loading="loading" :disabled="loading" size="mini" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
        <el-button :disabled="loading" size="mini" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'ruleModal'
}
</script>

<script setup lang="ts">
import { markRaw, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { rulManageGeGetRulePage } from '@/api/suzhou/aiAuditRuleManage'
import { aiAuditRuleEdit } from '@/api/suzhou/aiAuditInuseRange'
import { getPublicData } from '@/api/common'
import type { ColumnProps } from '@/components/ProTablePage/interface'

interface CodeItem {
  code: string
  name: string
}

interface ModalParams {
  type: string
  searchParams: {
    proTypeList: string[]
    selectedIds?: string[]
    /** 已关联规则名称（编辑回显） */
    selectedNames?: string
  }
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const tableLoading = ref(false)
const modalTitle = ref('选择适用规则')
const proTableRef = ref<any>(null)
const proTypeList = ref<string[]>([])
/** 尚未在分页列表中完成回显的关联 ID；命中后即移除，避免用户取消勾选后被再次选中。 */
const pendingSelectedIds = ref<string[]>([])
const echoCount = ref(0)
const isBatchEdit = ref(false)
/** 编辑回显的已关联规则名称 */
const selectedNames = ref('')
const ruleStatusMap = ref<Record<string, string>>({})

const formatRuleStatus = ({ cellValue }: { cellValue: any }) => {
  if (cellValue == null || cellValue === '') return ''
  return ruleStatusMap.value[String(cellValue)] ?? String(cellValue)
}

/**
 * 列配置对齐规则管理列表的查询/展示字段，但：
 * - 无新增/编辑/删除/关联/提示词等操作按钮
 * - 规则状态只读展示（无开关）
 * - 批量编辑不回显已关联规则
 */
const tableColumns = markRaw<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'ruleMajorName', title: '规则类型', width: 100 },
  { field: 'ruleCode', title: '规则编码', width: 150 },
  { field: 'ruleName', title: '规则名称', minWidth: 180 },
  { field: 'ruleDesc', title: '规则描述', minWidth: 180 },
  { field: 'ruleClassifyName', title: '规则分类', width: 120 },
  { field: 'ruleLevelName', title: '规则级别', width: 100 },
  { field: 'execStageName', title: '执行阶段', width: 100 },
  { field: 'sort', title: '排序', width: 60 },
  { field: 'ruleStatus', title: '规则状态', width: 90, formatter: formatRuleStatus }
])

const searchColumns = reactive<ColumnProps[]>([
  { prop: 'ruleCode', label: '规则编码', search: { el: 'input', order: 1 } },
  { prop: 'ruleName', label: '规则名称', search: { el: 'input', order: 2 } },
  { prop: 'ruleDesc', label: '规则描述', search: { el: 'input', order: 3 } },
  {
    prop: 'ruleClassify',
    label: '规则分类',
    enum: () => getPublicData('AI_AUDIT_RULE_CLASSIFY_COM'),
    search: { el: 'select', order: 4 },
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'ruleLevel',
    label: '规则级别',
    enum: () => getPublicData('AI_AUDIT_RULE_LEVEL_COM'),
    search: { el: 'select', order: 5 },
    fieldNames: { label: 'name', value: 'code' }
  },
  {
    prop: 'ruleStatus',
    label: '规则状态',
    enum: () => getPublicData('ZLYS_SFQY'),
    search: { el: 'select', order: 6 },
    fieldNames: { label: 'name', value: 'code' }
  }
])

const loadRuleStatusMap = async () => {
  try {
    const res = await getPublicData('ZLYS_SFQY')
    if (res.success && Array.isArray(res.data)) {
      const map: Record<string, string> = {}
      res.data.forEach((item: CodeItem) => {
        map[String(item.code)] = item.name
      })
      ruleStatusMap.value = map
    }
  } catch {
    // 展示层降级为原始 code，不阻断弹窗
  }
}

const callBackHandle = (data: any) => {
  tableLoading.value = false
  const selectedIdSet = new Set(pendingSelectedIds.value)
  const restoredIds = new Set<string>()
  nextTick(() => {
    data?.records?.forEach((row: any) => {
      if (selectedIdSet.has(String(row.ruleId))) {
        proTableRef.value?.setCheckboxRow?.(row, true)
        restoredIds.add(String(row.ruleId))
      }
    })
    pendingSelectedIds.value = pendingSelectedIds.value.filter((id) => !restoredIds.has(id))
  })
  return data
}

const handleRequestError = (error: unknown) => {
  tableLoading.value = false
  if ((error as Error)?.message === 'STALE_TABLE_REQUEST') return
  ElMessage.error((error as Error)?.message || '规则列表加载失败，请重试')
}

const getPageList = (params: any) => {
  tableLoading.value = true
  return rulManageGeGetRulePage(params)
}

const getSelectedRuleIds = (): string[] => {
  const selected = proTableRef.value?.selectedList || []
  const fromTable = selected.map((item: any) => String(item.ruleId)).filter(Boolean)
  // 未加载到当前分页的回显 ID 仍参与保存，避免跨页丢关联
  return Array.from(new Set([...fromTable, ...pendingSelectedIds.value]))
}

const handleClose = () => {
  proTypeList.value = []
  pendingSelectedIds.value = []
  echoCount.value = 0
  isBatchEdit.value = false
  selectedNames.value = ''
  isShowModal.value = false
}

const handleSave = async () => {
  if (loading.value) return
  if (!proTypeList.value.length) return ElMessage.warning('缺少项目类型！')
  const ruleIdList = getSelectedRuleIds()
  if (ruleIdList.length === 0) return ElMessage.warning('请选择规则！')

  try {
    const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', {
      status: 'warning'
    })
    if (type !== 'confirm') {
      ElMessage.info('已取消')
      return
    }
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await aiAuditRuleEdit({
      ruleIdList,
      proTypeList: proTypeList.value
    })
    if (res.success) {
      ElMessage.success('保存成功！')
      emit('searchHandle', { param: 'success' })
      handleClose()
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const acceptParams = (params: ModalParams) => {
  modalTitle.value = params.type || '选择适用规则'
  proTypeList.value = params.searchParams.proTypeList || []
  const selectedIds = [...(params.searchParams.selectedIds || [])]
  pendingSelectedIds.value = selectedIds
  echoCount.value = selectedIds.length
  selectedNames.value = String(params.searchParams.selectedNames || '').trim()
  isBatchEdit.value = params.type === '批量编辑'
  isShowModal.value = true
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.reset()
  })
}

onMounted(() => {
  loadRuleStatusMap()
})

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
