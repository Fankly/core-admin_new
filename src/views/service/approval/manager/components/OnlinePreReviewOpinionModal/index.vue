<template>
  <vxe-modal
    v-model="modalVisible"
    title="修改线上预审意见"
    width="70%"
    height="820"
    resize
    show-zoom
    show-close
    fullscreen
    destroy-on-close
    position="center"
    @close="closeHandle"
  >
    <div class="online-pre-review-opinion-modal">
      <div class="online-pre-review-opinion-modal__actions">
        <el-button size="mini" type="primary" plain :loading="saving" :disabled="loading" @click="handleSave">保 存</el-button>
        <el-button size="mini" type="primary" plain :disabled="loading || saving" @click="handleImport">导 入</el-button>
        <el-button size="mini" plain :disabled="loading || saving" @click="closeHandle">关 闭</el-button>
      </div>

      <div class="online-pre-review-opinion-modal__toolbar">
        <el-form :model="searchForm" label-suffix="：" label-width="110px" @submit.prevent>
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item label="专家姓名">
                <el-input v-model="searchForm.expertName" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目编码">
                <ReMultipleText v-model="searchForm.xmbms" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <div class="online-pre-review-opinion-modal__search-actions">
                <el-button size="mini" type="primary" plain :disabled="loading || saving" @click="searchTable">查 询</el-button>
                <el-button size="mini" plain :disabled="loading || saving" @click="resetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="online-pre-review-opinion-modal__table">
        <vxe-grid ref="gridRef" v-bind="gridOptions" :data="tableData" :loading="loading">
          <template #reviewOpinionSelect="{ row }">
            <vxe-select
              clearable
              v-model="row.reviewOpinion"
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
              class="online-pre-review-opinion-modal__reason-cell"
              :class="{ 'online-pre-review-opinion-modal__reason-cell--empty': !row.reason }"
              :title="row.reason || ''"
              role="button"
              tabindex="0"
              @click.stop="openReasonModal(row)"
              @keydown.enter.prevent.stop="openReasonModal(row)"
              @keydown.space.prevent.stop="openReasonModal(row)"
            >
              <span class="online-pre-review-opinion-modal__reason-text">{{ row.reason || '点击编辑' }}</span>
              <i class="el-icon-edit online-pre-review-opinion-modal__reason-icon"></i>
            </div>
          </template>
        </vxe-grid>
      </div>

      <div class="online-pre-review-opinion-modal__pager">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page.limit"
          :total="Number(page.total)"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle"
          @current-change="pageChangeHandle"
        />
      </div>
    </div>
  </vxe-modal>

  <vxe-modal
    v-model="reasonModalVisible"
    title="编辑终审原因"
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

<script setup lang="ts" name="OnlinePreReviewOpinionModal">
import { nextTick, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useStore } from 'vuex'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import { getXsyj, getXsyjTemplate, importXsyj, updateXsyj } from '@/api/service/approval/manager'

interface ModalProps {
  row: Record<string, any>
  userInfo?: {
    deptId?: string
    dwId?: string
    roleId?: string
    roleCode?: string
    [key: string]: any
  }
}

interface OnlinePreReviewOpinionRow {
  expertId: string
  expertName: string
  meetingId: string
  meetingCode: string
  meetingName: string
  reason: string
  reviewId: string
  reviewOpinion: string
  reviewOpinionName: string
  reviewXmid: string
  xmbm: string
  xmmc: string
  [key: string]: any
}

interface ReviewOpinionOption {
  code: string
  name: string
}

const modalVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const reasonModalVisible = ref(false)
const store = useStore()
const gridRef = ref<VxeGridInstance>()
const reasonTextareaRef = ref<any>()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const tableData = ref<OnlinePreReviewOpinionRow[]>([])
const editingReasonRow = ref<OnlinePreReviewOpinionRow>()
const editingReasonValue = ref('')
const modalProps = ref<ModalProps>({
  row: {}
})

const reviewOpinionOptions: ReviewOpinionOption[] = [
  { code: '1', name: '通过' },
  { code: '0', name: '不通过' }
]

const searchForm = reactive({
  expertName: '',
  xmbms: ''
})

const page = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const centerConfig = { align: 'center', headerAlign: 'center' } as const
const gridOptions = reactive<VxeGridProps<OnlinePreReviewOpinionRow>>({
  border: true,
  keepSource: true,
  editConfig: { trigger: 'click', mode: 'cell', showStatus: true },
  height: '100%',
  showOverflow: true,
  showHeaderOverflow: true,
  rowConfig: { keyField: 'reviewId', isHover: true, height: 32 },
  columnConfig: { resizable: true },
  columns: [
    { type: 'seq', width: 60, title: '序号', fixed: 'left', ...centerConfig },
    { field: 'meetingCode', title: '会议编号', fixed: 'left', width: 140, ...centerConfig },
    { field: 'meetingName', title: '会议名称', fixed: 'left', width: 260, showOverflow: true, ...centerConfig },
    { field: 'xmbm', title: '项目编码', fixed: 'left', width: 170, ...centerConfig },
    { field: 'xmmc', title: '项目名称', fixed: 'left', width: 260, showOverflow: true, ...centerConfig },
    { field: 'expertName', title: '专家姓名', fixed: 'left', width: 120, ...centerConfig },
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
      showOverflow: true,
      cellRender: { name: 'VxeInput' },
      slots: { default: 'reasonDefault' },
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

const normalizeRecords = (data: any): OnlinePreReviewOpinionRow[] => {
  let records: any[] = []
  if (Array.isArray(data)) records = data
  if (Array.isArray(data?.records)) records = data.records
  if (Array.isArray(data?.list)) records = data.list
  return records.map(normalizeReviewOpinionRow)
}

const normalizeTotal = (data: any, records: OnlinePreReviewOpinionRow[]) => {
  if (data && typeof data === 'object' && 'total' in data) return Number(data.total ?? 0)
  return records.length
}

const getReviewOpinionOption = (row: OnlinePreReviewOpinionRow) => {
  const reviewOpinion = row.reviewOpinion == null ? '' : String(row.reviewOpinion)
  const reviewOpinionName = row.reviewOpinionName == null ? '' : String(row.reviewOpinionName)
  return (
    reviewOpinionOptions.find((item) => item.code === reviewOpinion) ||
    reviewOpinionOptions.find((item) => item.code === reviewOpinionName) ||
    reviewOpinionOptions.find((item) => item.name === reviewOpinion) ||
    reviewOpinionOptions.find((item) => item.name === reviewOpinionName)
  )
}

const normalizeReviewOpinionRow = (row: OnlinePreReviewOpinionRow): OnlinePreReviewOpinionRow => {
  const option = getReviewOpinionOption(row)
  return {
    ...row,
    reason: row.reason ?? '',
    reviewOpinion: option?.code || row.reviewOpinion || '',
    reviewOpinionName: option?.name || row.reviewOpinionName || ''
  }
}

const handleReviewOpinionChange = (row: OnlinePreReviewOpinionRow, value: string | number | null | undefined) => {
  const code = value == null ? '' : String(value)
  const option = reviewOpinionOptions.find((item) => item.code === code)
  row.reviewOpinion = option?.code || ''
  row.reviewOpinionName = option?.name || ''
}

const openReasonModal = async (row: OnlinePreReviewOpinionRow) => {
  editingReasonRow.value = row
  editingReasonValue.value = row.reason ?? ''
  reasonModalVisible.value = true
  await nextTick()
  reasonTextareaRef.value?.focus?.()
  const textarea = reasonTextareaRef.value?.textarea || reasonTextareaRef.value?.$el?.querySelector('textarea')
  textarea?.focus?.()
}

const resetReasonEdit = () => {
  editingReasonRow.value = undefined
  editingReasonValue.value = ''
}

const cancelReasonEdit = () => {
  reasonModalVisible.value = false
}

const confirmReasonEdit = () => {
  if (editingReasonRow.value) {
    editingReasonRow.value.reason = editingReasonValue.value
  }
  gridRef.value?.updateData?.()
  reasonModalVisible.value = false
}

const syncGridSource = async () => {
  await nextTick()
  await (gridRef.value as any)?.reloadData?.(tableData.value)
}

const hasUnsavedChanges = () => {
  return (((gridRef.value as any)?.getUpdateRecords?.() || []) as OnlinePreReviewOpinionRow[]).filter(Boolean).length > 0
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

const buildQueryParams = () => ({
  meetingId: modalProps.value.row?.meetingId,
  expertName: searchForm.expertName.trim(),
  xmbms: parseProjectCodes(searchForm.xmbms),
  page: page.page,
  limit: page.limit,
  bmId: modalProps.value.userInfo?.deptId || '',
  dwId: modalProps.value.userInfo?.dwId || '',
  roleId: modalProps.value.userInfo?.roleId || '',
  roleCode: modalProps.value.userInfo?.roleCode || '',
  userId: store.getters.getUserMsg?.id || ''
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
  const queryParams = buildQueryParams()
  if (!queryParams.bmId || !queryParams.dwId || !queryParams.roleId || !queryParams.roleCode || !queryParams.userId) {
    ElMessage.warning('未获取到用户角色信息')
    tableData.value = []
    page.total = 0
    await syncGridSource()
    return
  }
  loading.value = true
  try {
    const res = await getXsyj(queryParams)
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
  searchForm.expertName = ''
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

const limitChangeHandle = async (limit: number) => {
  if (limit === page.limit) return
  if (!(await confirmDiscardChanges())) return
  page.page = 1
  page.limit = limit
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
  const queryParams = buildQueryParams()
  importRef.value?.acceptParams({
    tempApi: () => {
      return getXsyjTemplate(queryParams)
    },
    importApi: (params: any) => {
      return importXsyj({
        excelFormData: params.excelFormData,
        meetingId
      })
    },
    title: '线上预审意见',
    specialorgid: modalProps.value.userInfo?.deptId || '',
    getTableList: refreshAfterImport
  })
}

const buildUpdateParams = (row: OnlinePreReviewOpinionRow) => ({
  expertName: row.expertName ?? '',
  expertId: row.expertId ?? '',
  meetingCode: row.meetingCode ?? '',
  meetingId: row.meetingId ?? '',
  meetingName: row.meetingName ?? '',
  reason: row.reason ?? '',
  reviewId: row.reviewId ?? '',
  reviewOpinion: row.reviewOpinion ?? '',
  reviewOpinionName: row.reviewOpinionName ?? '',
  reviewXmid: row.reviewXmid ?? '',
  xmbm: row.xmbm ?? '',
  xmmc: row.xmmc ?? ''
})

const handleSave = async () => {
  const records = (((gridRef.value as any)?.getUpdateRecords?.() || []) as OnlinePreReviewOpinionRow[]).filter(Boolean)
  if (records.length === 0) {
    ElMessage.warning('暂无修改内容')
    return
  }
  saving.value = true
  try {
    const res = await updateXsyj(records.map((row) => buildUpdateParams(row)))
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
  searchForm.expertName = ''
  searchForm.xmbms = ''
  tableData.value = []
  page.page = 1
  page.limit = 20
  page.total = 0
  reasonModalVisible.value = false
  resetReasonEdit()
}

const closeHandle = () => {
  modalVisible.value = false
  resetModalState()
}

const acceptParams = async (params: ModalProps) => {
  resetModalState()
  modalProps.value = { ...modalProps.value, ...params }
  modalVisible.value = true
  await nextTick()
  await loadTable()
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.online-pre-review-opinion-modal {
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
