<template>
  <vxe-modal
    v-model="modalVisible"
    :title="modalTitle"
    width="78%"
    height="820"
    resize
    show-zoom
    show-close
    fullscreen
    destroy-on-close
    position="center"
    :before-hide-method="beforeModalHide"
    @hide="handleModalClosed"
  >
    <div class="offline-review-opinion-modal">
      <div class="offline-review-opinion-modal__actions">
        <el-button size="mini" type="primary" plain :loading="saving" :disabled="loading" @click="handleSave">保 存</el-button>
        <el-button size="mini" type="primary" plain :disabled="loading || saving" @click="handleImport">导 入</el-button>
        <el-button size="mini" plain :disabled="loading || saving" @click="requestClose">关 闭</el-button>
      </div>

      <div class="offline-review-opinion-modal__toolbar">
        <el-form :model="searchForm" label-suffix="：" label-width="110px" @submit.prevent>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="项目编码">
                <ReMultipleText v-model="searchForm.xmbms" />
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <div class="offline-review-opinion-modal__search-actions">
                <el-button size="mini" type="primary" plain :disabled="loading || saving" @click="searchTable">查 询</el-button>
                <el-button size="mini" plain :disabled="loading || saving" @click="resetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="offline-review-opinion-modal__table">
        <vxe-grid ref="gridRef" v-bind="gridOptions" :data="tableData" :loading="loading">
          <template #sdjeInput="{ row }">
            <el-input-number v-model="row.sdje" size="mini" :controls="false" :precision="6" style="width: 100%" />
          </template>
          <template #xxhsJlCwSelect="{ row }">
            <vxe-select
              v-model="row.xxhsJlCw"
              clearable
              size="mini"
              placeholder="请选择"
              transfer
              style="width: 100%"
              @change="(params:any) => handlexxhsJlCwChange(row, params.value)"
            >
              <vxe-option v-for="item in zpOpinionOptions" :key="item.code" :label="item.name" :value="item.code"></vxe-option>
            </vxe-select>
          </template>
          <template #xxhsJlFzSelect="{ row }">
            <vxe-select
              v-model="row.xxhsJlFz"
              clearable
              size="mini"
              placeholder="请选择"
              transfer
              style="width: 100%"
              @change="(params:any) => handlexxhsJlFzChange(row, params.value)"
            >
              <vxe-option v-for="item in zpOpinionOptions" :key="item.code" :label="item.name" :value="item.code"></vxe-option>
            </vxe-select>
          </template>
          <template #reviewOpinionSelect="{ row }">
            <vxe-select
              v-model="row.reviewOpinion"
              clearable
              size="mini"
              placeholder="请选择"
              transfer
              style="width: 100%"
              @change="(params:any) => handleReviewOpinionChange(row, params.value)"
            >
              <vxe-option v-for="item in reviewOpinionOptions" :key="item.code" :label="item.name" :value="item.code"></vxe-option>
            </vxe-select>
          </template>
          <template #reasonDefault="{ row }">
            <div
              class="offline-review-opinion-modal__reason-cell"
              :class="{ 'offline-review-opinion-modal__reason-cell--empty': !row.reason }"
              :title="row.reason || ''"
              role="button"
              tabindex="0"
              @click.stop="openReasonModal(row, 'reason')"
              @keydown.enter.prevent.stop="openReasonModal(row, 'reason')"
              @keydown.space.prevent.stop="openReasonModal(row, 'reason')"
            >
              <span class="offline-review-opinion-modal__reason-text">{{ row.reason || '点击编辑' }}</span>
              <i class="el-icon-edit offline-review-opinion-modal__reason-icon"></i>
            </div>
          </template>
          <template #fzbReasonDefault="{ row }">
            <div
              class="offline-review-opinion-modal__reason-cell"
              :class="{ 'offline-review-opinion-modal__reason-cell--empty': !row.fzbReason }"
              :title="row.fzbReason || ''"
              role="button"
              tabindex="0"
              @click.stop="openReasonModal(row, 'fzbReason')"
              @keydown.enter.prevent.stop="openReasonModal(row, 'fzbReason')"
              @keydown.space.prevent.stop="openReasonModal(row, 'fzbReason')"
            >
              <span class="offline-review-opinion-modal__reason-text">{{ row.fzbReason || '点击编辑' }}</span>
              <i class="el-icon-edit offline-review-opinion-modal__reason-icon"></i>
            </div>
          </template>
          <template #cwbReasonDefault="{ row }">
            <div
              class="offline-review-opinion-modal__reason-cell"
              :class="{ 'offline-review-opinion-modal__reason-cell--empty': !row.cwbReason }"
              :title="row.cwbReason || ''"
              role="button"
              tabindex="0"
              @click.stop="openReasonModal(row, 'cwbReason')"
              @keydown.enter.prevent.stop="openReasonModal(row, 'cwbReason')"
              @keydown.space.prevent.stop="openReasonModal(row, 'cwbReason')"
            >
              <span class="offline-review-opinion-modal__reason-text">{{ row.cwbReason || '点击编辑' }}</span>
              <i class="el-icon-edit offline-review-opinion-modal__reason-icon"></i>
            </div>
          </template>
        </vxe-grid>
      </div>

      <div class="offline-review-opinion-modal__pager">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page.size"
          :total="Number(page.total)"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="sizeChangeHandle"
          @current-change="pageChangeHandle"
        />
      </div>
    </div>
  </vxe-modal>

  <vxe-modal
    v-model="reasonModalVisible"
    :title="reasonModalTitle"
    width="560"
    height="360"
    resize
    show-close
    destroy-on-close
    position="center"
    @close="resetReasonEdit"
  >
    <div class="reason-edit-modal">
      <div class="reason-edit-modal__body">
        <el-input
          ref="reasonTextareaRef"
          v-model="editingReasonValue"
          type="textarea"
          :rows="10"
          maxlength="2000"
          show-word-limit
          resize="none"
          placeholder="请输入"
          class="reason-edit-modal__textarea"
        />
      </div>
      <div class="reason-edit-modal__actions">
        <el-button size="small" plain @click="cancelReasonEdit">取 消</el-button>
        <el-button size="small" type="primary" @click="confirmReasonEdit">确 定</el-button>
      </div>
    </div>
  </vxe-modal>
  <ImportExcel ref="importRef" />
</template>

<script setup lang="ts" name="OfflineReviewOpinionModal">
import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import { getXxyj, getXxyjTemplate, importXxyj, updateXxyj } from '@/api/service/approval/manager'
import { getPublicData } from '@/api/common'

interface ModalProps {
  row: Record<string, any>
  title?: string
}

interface OfflineReviewOpinionRow {
  cwbReason: string
  fzbReason: string
  id: string
  meetingCode: string
  meetingName: string
  reason: string
  reviewOpinion: string
  reviewOpinionName: string
  sdje: number | string | null
  xmbm: string
  xmmc: string
  xxhsJlCw: string
  xxhsJlCwName: string
  xxhsJlFz: string
  xxhsJlFzCwName: string
  [key: string]: any
}

interface ReviewOpinionOption {
  code: string
  name: string
}

type ReasonField = 'reason' | 'fzbReason' | 'cwbReason'

const modalVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const reasonModalVisible = ref(false)
const gridRef = ref<VxeGridInstance>()
const reasonTextareaRef = ref<any>()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const tableData = ref<OfflineReviewOpinionRow[]>([])
const editingReasonRow = ref<OfflineReviewOpinionRow>()
const editingReasonField = ref<ReasonField>('reason')
const editingReasonValue = ref('')
const modalProps = ref<ModalProps>({
  row: {},
  title: ''
})

const reviewOpinionOptions: ReviewOpinionOption[] = [
  { code: '1', name: '通过' },
  { code: '0', name: '不通过' }
]
const zpOpinionOptions = ref<any[]>([])

const reasonFieldTitleMap: Record<ReasonField, string> = {
  reason: '终审原因',
  fzbReason: '发展部意见',
  cwbReason: '财务部意见'
}

const searchForm = reactive({
  xmbms: ''
})

const page = reactive({
  page: 1,
  size: 20,
  total: 0
})

const modalTitle = computed(() => modalProps.value.title || '修改线下会审及终评意见')
const reasonModalTitle = computed(() => `编辑${reasonFieldTitleMap[editingReasonField.value]}`)

const centerConfig = { align: 'center', headerAlign: 'center' } as const
const gridOptions = reactive<VxeGridProps<OfflineReviewOpinionRow>>({
  border: true,
  keepSource: true,
  editConfig: { trigger: 'click', mode: 'cell', showStatus: true },
  height: '100%',
  showOverflow: true,
  showHeaderOverflow: true,
  rowConfig: { keyField: 'id', isHover: true, height: 32 },
  columnConfig: { resizable: true },
  columns: [
    { type: 'seq', width: 60, title: '序号', fixed: 'left', ...centerConfig },
    { field: 'meetingCode', title: '会议编号', fixed: 'left', width: 140, ...centerConfig },
    { field: 'meetingName', title: '会议名称', fixed: 'left', width: 260, showOverflow: true, ...centerConfig },
    { field: 'xmbm', title: '项目编码', fixed: 'left', width: 170, ...centerConfig },
    { field: 'xmmc', title: '项目名称', fixed: 'left', width: 260, showOverflow: true, ...centerConfig },
    {
      field: 'reviewOpinion',
      title: '终评意见',
      width: 160,
      cellRender: { name: 'VxeSelect' },
      slots: { default: 'reviewOpinionSelect' },
      ...centerConfig
    },
    {
      field: 'reason',
      title: '终审原因',
      width: 320,
      showOverflow: true,
      cellRender: { name: 'VxeInput' },
      slots: { default: 'reasonDefault' },
      ...centerConfig
    },
    {
      field: 'sdje',
      title: '审定金额(万元)',
      width: 160,
      align: 'right',
      headerAlign: 'center',
      slots: { default: 'sdjeInput' }
    },
    {
      field: 'fzbReason',
      title: '发展部意见',
      width: 260,
      showOverflow: true,
      cellRender: { name: 'VxeInput' },
      slots: { default: 'fzbReasonDefault' },
      ...centerConfig
    },
    {
      field: 'cwbReason',
      title: '财务部意见',
      width: 260,
      showOverflow: true,
      cellRender: { name: 'VxeInput' },
      slots: { default: 'cwbReasonDefault' },
      ...centerConfig
    },
    {
      field: 'xxhsJlCw',
      title: '新增财务线下会审结论',
      width: 160,
      cellRender: { name: 'VxeSelect' },
      slots: { default: 'xxhsJlCwSelect' },
      ...centerConfig
    },
    {
      field: 'xxhsJlFz',
      title: '发展线下会审结论',
      width: 160,
      cellRender: { name: 'VxeSelect' },
      slots: { default: 'xxhsJlFzSelect' },
      ...centerConfig
    }
  ]
})

const parseProjectCodes = (value: string) => {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeRecords = (data: any): OfflineReviewOpinionRow[] => {
  let records: any[] = []
  if (Array.isArray(data)) records = data
  if (Array.isArray(data?.records)) records = data.records
  if (Array.isArray(data?.list)) records = data.list
  return records.map(normalizeReviewOpinionRow)
}

const normalizeTotal = (data: any, records: OfflineReviewOpinionRow[]) => {
  if (data && typeof data === 'object' && 'total' in data) return Number(data.total ?? 0)
  return records.length
}

const getReviewOpinionOption = (row: OfflineReviewOpinionRow) => {
  const reviewOpinion = row.reviewOpinion == null ? '' : String(row.reviewOpinion)
  const reviewOpinionName = row.reviewOpinionName == null ? '' : String(row.reviewOpinionName)
  return (
    reviewOpinionOptions.find((item) => item.code === reviewOpinion) ||
    reviewOpinionOptions.find((item) => item.code === reviewOpinionName) ||
    reviewOpinionOptions.find((item) => item.name === reviewOpinion) ||
    reviewOpinionOptions.find((item) => item.name === reviewOpinionName)
  )
}

const getxxhsJlCwOption = (row: OfflineReviewOpinionRow) => {
  const xxhsJlCw = row.xxhsJlCw ?? row.xxhsJlCw
  const xxhsJlCwName = row.xxhsJlCwName ?? row.xxhsJlCwName
  const code = xxhsJlCw == null ? '' : String(xxhsJlCw)
  const name = xxhsJlCwName == null ? '' : String(xxhsJlCwName)
  return (
    zpOpinionOptions.value.find((item) => item.code === code) ||
    zpOpinionOptions.value.find((item) => item.code === name) ||
    zpOpinionOptions.value.find((item) => item.name === code) ||
    zpOpinionOptions.value.find((item) => item.name === name)
  )
}

const getxxhsJlFzOption = (row: OfflineReviewOpinionRow) => {
  const xxhsJlFz = row.xxhsJlFz ?? row.xxhsJlFz
  const xxhsJlFzCwName = row.xxhsJlFzCwName ?? row.xxhsJlFzCwName
  const code = xxhsJlFz == null ? '' : String(xxhsJlFz)
  const name = xxhsJlFzCwName == null ? '' : String(xxhsJlFzCwName)
  return (
    zpOpinionOptions.value.find((item) => item.code === code) ||
    zpOpinionOptions.value.find((item) => item.code === name) ||
    zpOpinionOptions.value.find((item) => item.name === code) ||
    zpOpinionOptions.value.find((item) => item.name === name)
  )
}

const normalizeReviewOpinionRow = (row: OfflineReviewOpinionRow): OfflineReviewOpinionRow => {
  const option = getReviewOpinionOption(row)
  const xxhsJlCwOption = getxxhsJlCwOption(row)
  const xxhsJlCw = row.xxhsJlCw ?? row.xxhsJlCw ?? ''
  const xxhsJlCwName = row.xxhsJlCwName ?? row.xxhsJlCwName ?? ''
  const xxhsJlFzOption = getxxhsJlFzOption(row)
  const xxhsJlFz = row.xxhsJlFz ?? row.xxhsJlFz ?? ''
  const xxhsJlFzCwName = row.xxhsJlFzCwName ?? row.xxhsJlFzCwName ?? ''
  return {
    ...row,
    cwbReason: row.cwbReason ?? '',
    fzbReason: row.fzbReason ?? '',
    reason: row.reason ?? '',
    reviewOpinion: option?.code || row.reviewOpinion || '',
    reviewOpinionName: option?.name || row.reviewOpinionName || '',
    sdje: row.sdje === undefined || row.sdje === null || row.sdje === '' ? null : Number(row.sdje),
    xxhsJlCw: xxhsJlCwOption?.code || xxhsJlCw,
    xxhsJlCwName: xxhsJlCwOption?.name || xxhsJlCwName,
    xxhsJlFz: xxhsJlFzOption?.code || xxhsJlFz,
    xxhsJlFzCwName: xxhsJlFzOption?.name || xxhsJlFzCwName
  }
}

const handleReviewOpinionChange = (row: OfflineReviewOpinionRow, value: string | number | null | undefined) => {
  const code = value == null ? '' : String(value)
  const option = reviewOpinionOptions.find((item) => item.code === code)
  row.reviewOpinion = option?.code || ''
  row.reviewOpinionName = option?.name || ''
}

const handlexxhsJlCwChange = (row: OfflineReviewOpinionRow, value: string | number | null | undefined) => {
  const code = value == null ? '' : String(value)
  const option = zpOpinionOptions.value.find((item) => item.code === code)
  row.xxhsJlCw = option?.code || ''
  row.xxhsJlCwName = option?.name || ''
}

const handlexxhsJlFzChange = (row: OfflineReviewOpinionRow, value: string | number | null | undefined) => {
  const code = value == null ? '' : String(value)
  const option = zpOpinionOptions.value.find((item) => item.code === code)
  row.xxhsJlFz = option?.code || ''
  row.xxhsJlFzCwName = option?.name || ''
}

const openReasonModal = async (row: OfflineReviewOpinionRow, field: ReasonField) => {
  editingReasonRow.value = row
  editingReasonField.value = field
  editingReasonValue.value = row[field] ?? ''
  reasonModalVisible.value = true
  await nextTick()
  reasonTextareaRef.value?.focus?.()
  const textarea = reasonTextareaRef.value?.textarea || reasonTextareaRef.value?.$el?.querySelector('textarea')
  textarea?.focus?.()
}

const resetReasonEdit = () => {
  editingReasonRow.value = undefined
  editingReasonField.value = 'reason'
  editingReasonValue.value = ''
}

const cancelReasonEdit = () => {
  reasonModalVisible.value = false
}

const confirmReasonEdit = () => {
  if (editingReasonRow.value) {
    editingReasonRow.value[editingReasonField.value] = editingReasonValue.value
  }
  gridRef.value?.updateData?.()
  reasonModalVisible.value = false
}

const syncGridSource = async () => {
  await nextTick()
  await (gridRef.value as any)?.reloadData?.(tableData.value)
}

const hasPendingReasonEdit = () => {
  if (!reasonModalVisible.value || !editingReasonRow.value) return false
  const currentValue = String(editingReasonRow.value[editingReasonField.value] ?? '')
  return String(editingReasonValue.value ?? '') !== currentValue
}

const hasUnsavedChanges = () => {
  const pendingGridChanges = (((gridRef.value as any)?.getUpdateRecords?.() || []) as OfflineReviewOpinionRow[]).filter(Boolean).length > 0
  return pendingGridChanges || hasPendingReasonEdit()
}

const confirmDiscardChanges = async () => {
  if (!hasUnsavedChanges()) return true
  try {
    await ElMessageBox.confirm('当前页有未保存的修改，继续操作将放弃这些修改，是否继续？', '提示', {
      confirmButtonText: '继续',
      cancelButtonText: '取消',
      type: 'warning'
    })
    return true
  } catch (error) {
    if (error === 'cancel' || error === 'close') return false
    ElMessage.error((error as Error).message || String(error))
    return false
  }
}

const getQueryParams = () => ({
  meetingId: modalProps.value.row?.meetingId,
  xmbms: parseProjectCodes(searchForm.xmbms),
  page: page.page,
  limit: page.size
})

const getTemplateParams = () => ({
  meetingId: modalProps.value.row?.meetingId,
  xmbms: parseProjectCodes(searchForm.xmbms)
})

const loadTable = async () => {
  const meetingId = modalProps.value.row?.meetingId
  if (!meetingId) {
    ElMessage.warning('未获取到会议ID')
    tableData.value = []
    page.total = 0
    await syncGridSource()
    return
  }
  loading.value = true
  try {
    const res = await getXxyj(getQueryParams())
    if (!res.success) throw new Error(res.msg)
    tableData.value = normalizeRecords(res.data)
    page.total = normalizeTotal(res.data, tableData.value)
    await syncGridSource()
  } catch (error) {
    ElMessage.error((error as Error).message)
    tableData.value = []
    page.total = 0
    await syncGridSource()
  } finally {
    loading.value = false
  }
}

const searchTable = async () => {
  if (!(await confirmDiscardChanges())) return
  page.page = 1
  loadTable()
}

const resetSearch = async () => {
  if (!(await confirmDiscardChanges())) return
  searchForm.xmbms = ''
  page.page = 1
  loadTable()
}

const pageChangeHandle = async (currentPage: number) => {
  if (currentPage === page.page) return
  if (!(await confirmDiscardChanges())) return
  page.page = currentPage
  loadTable()
}

const sizeChangeHandle = async (size: number) => {
  if (size === page.size) return
  if (!(await confirmDiscardChanges())) return
  page.page = 1
  page.size = size
  loadTable()
}

const refreshAfterImport = () => {
  page.page = 1
  loadTable()
}

const handleImport = async () => {
  if (!(await confirmDiscardChanges())) return
  const meetingId = modalProps.value.row?.meetingId
  if (!meetingId) {
    ElMessage.warning('未获取到会议ID')
    return
  }
  importRef.value?.acceptParams({
    tempApi: () => {
      return getXxyjTemplate(getTemplateParams())
    },
    importApi: (params: any) => {
      return importXxyj({
        excelFormData: params.excelFormData,
        meetingId
      })
    },
    title: '线下会审及终评意见',
    specialorgid: '',
    getTableList: refreshAfterImport
  })
}

const buildUpdateParams = (row: OfflineReviewOpinionRow) => ({
  cwbReason: row.cwbReason ?? '',
  fzbReason: row.fzbReason ?? '',
  id: row.id ?? '',
  meetingCode: row.meetingCode ?? '',
  meetingName: row.meetingName ?? '',
  reason: row.reason ?? '',
  reviewOpinion: row.reviewOpinion ?? '',
  reviewOpinionName: row.reviewOpinionName ?? '',
  sdje: Number(row.sdje ?? 0),
  xmbm: row.xmbm ?? '',
  xmmc: row.xmmc ?? '',
  xxhsJlCw: row.xxhsJlCw ?? '',
  xxhsJlCwName: row.xxhsJlCwName ?? '',
  xxhsJlFz: row.xxhsJlFz ?? '',
  xxhsJlFzCwName: row.xxhsJlFzCwName ?? ''
})

const handleSave = async () => {
  const records = (((gridRef.value as any)?.getUpdateRecords?.() || []) as OfflineReviewOpinionRow[]).filter(Boolean)
  if (records.length === 0) {
    ElMessage.warning('暂无修改内容')
    return
  }
  saving.value = true
  try {
    const res = await updateXxyj(records.map((row) => buildUpdateParams(row)))
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('保存成功')
    await loadTable()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    saving.value = false
  }
}

const resetModalState = () => {
  searchForm.xmbms = ''
  tableData.value = []
  page.page = 1
  page.size = 20
  page.total = 0
  reasonModalVisible.value = false
  resetReasonEdit()
}

const requestClose = () => {
  modalVisible.value = false
}

const beforeModalHide = async () => {
  const allowHide = await confirmDiscardChanges()
  return allowHide ? undefined : new Error('cancel')
}

const handleModalClosed = () => {
  resetModalState()
}

const getOpinionOptions = async () => {
  const item: any = await getPublicData('LHHS_XXHS_JL_COM')
  if (item.success) {
    zpOpinionOptions.value = item.data
  } else {
    ElMessage.error(item.msg)
  }
}

const acceptParams = async (params: ModalProps) => {
  resetModalState()
  modalProps.value = { ...modalProps.value, ...params }
  modalVisible.value = true
  await nextTick()
  await loadTable()
  await getOpinionOptions()
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.offline-review-opinion-modal {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__toolbar {
    padding: 10px 10px 0;
    border-radius: 4px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    margin-bottom: 10px;
  }

  &__search-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-bottom: 10px;
  }

  &__table {
    margin-top: 10px;
    flex: 1;
    min-height: 0;
  }

  &__pager {
    display: flex;
    justify-content: flex-end;
    padding-top: 10px;
  }

  &__reason-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-height: 24px;
    padding: 0 4px;
    overflow: hidden;
    color: inherit;
    line-height: 24px;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    box-sizing: border-box;

    &:focus {
      outline: 1px solid var(--el-color-primary, #409eff);
      outline-offset: -1px;
    }
  }

  &__reason-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__reason-icon {
    flex: none;
    color: var(--el-text-color-secondary, #909399);
    font-size: 14px;
  }

  &__reason-cell--empty {
    color: var(--el-text-color-placeholder, #c0c4cc);
  }
}

.reason-edit-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  box-sizing: border-box;

  &__body {
    flex: 1;
    min-height: 0;
  }

  &__textarea {
    height: 100%;

    :deep(.el-textarea__inner) {
      height: 100%;
      min-height: 220px;
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 12px;
  }
}
</style>
