<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-range-modal"
    destroy-on-close
    resize
    show-zoom
    :loading="loading"
    :title="modalTitle"
    width="85%"
    height="85%"
    @close="handleClose"
  >
    <div class="air-modal-body air-modal-body--table">
      <div v-if="echoCount > 0" class="air-modal-tip" role="status">
        <i class="el-icon-info air-modal-tip__icon" aria-hidden="true"></i>
        <span class="air-modal-tip__text"
          >已回显关联项 <em class="air-modal-tip__count">{{ echoCount }}</em> 个，翻页将自动勾选；未出现在当前页的项保存时仍会保留。</span
        >
        <span v-if="selectedSchemaNames" class="air-modal-tip__names" :title="selectedSchemaNames">
          已选中的模版名称：{{ selectedSchemaNames }}
        </span>
      </div>
      <div v-else-if="isBatchEdit" class="air-modal-tip" role="status">
        <i class="el-icon-warning-outline air-modal-tip__icon" aria-hidden="true"></i>
        <span class="air-modal-tip__text">批量编辑不回显已有关联，保存后将覆盖所选项目类型的配置。</span>
      </div>
      <div class="air-modal-table">
        <RangeVxeTable
          ref="proTableRef"
          row-key="schemaId"
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
        <el-button :loading="loading" :disabled="loading" v-debounce="[handleSave, `click`, 300]" size="mini" type="primary">保 存</el-button>
        <el-button :disabled="loading" v-debounce="[handleClose, `click`, 300]" size="mini" plain>关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'schemaModal'
}
</script>

<script setup lang="ts">
import { markRaw, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { getXmAttachExtractSchemaMenu } from '@/api/ai/xmAttachExtractSchemaMenu'
import { schemaEdit } from '@/api/suzhou/aiAuditInuseRange'
import type { ColumnProps } from '@/components/ProTablePage/interface'

interface RoleContext {
  bmId: string
  dwId: string
  roleCode: string
  roleId: string
  userId: string
}

interface ModalParams {
  type: string
  searchParams: {
    proTypeList: string[]
    roleContext: RoleContext
    selectedIds?: string[]
    /** 已关联模版名称（编辑回显，多个以顿号等分隔） */
    selectedNames?: string
  }
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const tableLoading = ref(false)
const modalTitle = ref('选择提取Schema')
const proTableRef = ref<any>()
const proTypeList = ref<string[]>([])
/** 尚未在分页列表中完成回显的关联 ID；命中后即移除，避免用户取消勾选后被再次选中。 */
const pendingSelectedIds = ref<string[]>([])
const echoCount = ref(0)
const isBatchEdit = ref(false)
/** 编辑回显的已关联模版名称 */
const selectedSchemaNames = ref('')
const roleContext = ref<RoleContext>({ bmId: '', dwId: '', roleCode: '', roleId: '', userId: '' })

const tableColumns = markRaw<VxeGridProps['columns']>([
  { type: 'checkbox', width: 50 },
  { type: 'seq', width: 50, title: '序号' },
  { field: 'schemaName', title: '模版名称', minWidth: 220 },
  { field: 'fjTypeName', title: '附件类型', minWidth: 180 },
  { field: 'schemaJson', title: 'Schema内容', minWidth: 520, showOverflow: true }
])

const searchColumns = reactive<ColumnProps[]>([
  {
    prop: 'schemaName',
    label: '模版名称',
    search: { el: 'input', order: 1, props: { clearable: true, placeholder: '请输入模版名称' } }
  }
])

const callBackHandle = (data: any) => {
  tableLoading.value = false
  const selectedIdSet = new Set(pendingSelectedIds.value)
  const restoredIds = new Set<string>()
  nextTick(() => {
    data?.records?.forEach((row: any) => {
      if (selectedIdSet.has(String(row.schemaId))) {
        proTableRef.value?.setCheckboxRow?.(row, true)
        restoredIds.add(String(row.schemaId))
      }
    })
    pendingSelectedIds.value = pendingSelectedIds.value.filter((id) => !restoredIds.has(id))
  })
  return data
}

const handleRequestError = (error: unknown) => {
  tableLoading.value = false
  if ((error as Error)?.message === 'STALE_TABLE_REQUEST') return
  ElMessage.error((error as Error)?.message || 'Schema列表加载失败，请重试')
}

const getPageList = (params: any) => {
  tableLoading.value = true
  return getXmAttachExtractSchemaMenu({
    ...roleContext.value,
    fjType: params.fjType || '',
    limit: String(params.limit ?? ''),
    page: String(params.page ?? ''),
    schemaName: params.schemaName || ''
  })
}

const getSelectedSchemaIds = (): string[] => {
  const selected = proTableRef.value?.selectedList || []
  const fromTable = selected.map((item: any) => String(item.schemaId)).filter(Boolean)
  // 未加载到当前分页的回显 ID 仍参与保存，避免跨页丢关联
  return Array.from(new Set([...fromTable, ...pendingSelectedIds.value]))
}

const handleClose = () => {
  proTypeList.value = []
  pendingSelectedIds.value = []
  echoCount.value = 0
  isBatchEdit.value = false
  selectedSchemaNames.value = ''
  isShowModal.value = false
}

const handleSave = async () => {
  if (loading.value) return
  if (!proTypeList.value.length) return ElMessage.warning('缺少项目类型！')
  const schemaIdList = getSelectedSchemaIds()
  if (!schemaIdList.length) return ElMessage.warning('请选择提取Schema！')

  let confirmResult: string
  try {
    confirmResult = await VXETable.modal.confirm('是否保存，请确定！', '提示', { status: 'warning' })
  } catch {
    return
  }
  if (confirmResult !== 'confirm') return ElMessage.info('已取消')

  loading.value = true
  try {
    const res = await schemaEdit({ schemaIdList, proTypeList: proTypeList.value })
    if (!res.success) return ElMessage.error(res.msg || '保存失败')
    ElMessage.success('保存成功！')
    emit('searchHandle', { param: 'success' })
    handleClose()
  } catch (error) {
    ElMessage.error((error as Error).message || '保存失败')
  } finally {
    loading.value = false
  }
}

const acceptParams = (params: ModalParams) => {
  modalTitle.value = params.type || '选择提取Schema'
  proTypeList.value = params.searchParams.proTypeList || []
  const selectedIds = [...(params.searchParams.selectedIds || [])]
  pendingSelectedIds.value = selectedIds
  echoCount.value = selectedIds.length
  selectedSchemaNames.value = String(params.searchParams.selectedNames || '').trim()
  isBatchEdit.value = params.type === '批量编辑'
  roleContext.value = params.searchParams.roleContext || { bmId: '', dwId: '', roleCode: '', roleId: '', userId: '' }
  isShowModal.value = true
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.reset()
  })
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
