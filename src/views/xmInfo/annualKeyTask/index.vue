<template>
  <!--
    THESIS: 年度重点任务管理把年度任务台账的查询、维护、查看、删除、导入和导出放在同一工作台，拒绝拆成多个低频入口。
    OWN-WORLD: 继承电网规则控制台的白色单层工作面、薄荷查询带和表头、#00706b 青绿操作色、桌面高密度表格。
    STORY: 用户按角色组织范围进入，筛选年度重点任务，在列表中完成单条新增/修改/查看与批量删除、导入、导出。
    FIRST VIEWPORT: 工具栏置顶、查询带紧随其后、主表格吃满剩余高度，编辑与查看进入同一个只读/可编辑弹窗。
    FORM: established-extension from ownRealEstate; seed: not-applicable; FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
  -->
  <div v-if="isShowPage" class="container">
    <section class="workbench-panel" aria-label="年度重点任务管理">
      <AnnualKeyTaskToolbar
        v-if="!selectionMode"
        :disabled="loading"
        :exporting="exporting"
        :search-visible="searchVisible"
        :selected-count="selectedRows.length"
        :permissions="buttonPermissions"
        @add="openAdd"
        @edit="openEdit(selectedRows)"
        @view="openView(selectedRows)"
        @remove="removeSelected(selectedRows)"
        @import="openImport"
        @export="handleExport"
        @setting-click="openColSetting"
        @toggle-search="toggleSearchVisible"
        @help="openHelp"
      />

      <AnnualKeyTaskSearch
        ref="searchFormRef"
        :visible="searchVisible"
        :loading="loading"
        :search-form="searchForm"
        :year-options="yearOptions"
        @update:nd="searchForm.nd = $event"
        @update:zdrwbms="searchForm.zdrwbms = $event"
        @update:zyfl="searchForm.zyfl = $event"
        @update:zyflZdrw="searchForm.zyflZdrw = $event"
        @search="searchHandle"
        @reset="resetHandle"
      />

      <el-alert v-if="loadError" class="task-alert" type="error" :closable="false" show-icon :title="loadError" />

      <div class="table-region">
        <RangeVxeTable
          ref="tableRef"
          :columns="tableColumns"
          :auto-column-width="selectionMode ? false : { minWidth: 100, maxWidth: 1200 }"
          :loading="loading"
          :request-api="requestApi"
          :request-error="handleRequestError"
          :page-size="20"
          :page-sizes="[10, 20, 50, 100, 500]"
          row-key="id"
          :row-click-mode="selectionMode ? 'toggle' : 'exclusive'"
          :reserve-selection="selectionMode"
          :column-setting="!selectionMode"
          border
          stripe
          @selection-change="syncSelectedRows"
        >
          <template v-if="!selectionMode" #operation="{ row }">
            <el-button
              v-if="hasPermission('VIEW')"
              class="row-action-button"
              type="text"
              size="mini"
              title="查看年度重点任务"
              aria-label="查看年度重点任务"
              @click.stop="openView([row])"
            >
              查 看
            </el-button>
            <el-button
              v-if="hasPermission('EDIT')"
              class="row-action-button"
              type="text"
              size="mini"
              title="修改年度重点任务"
              aria-label="修改年度重点任务"
              @click.stop="openEdit([row])"
            >
              修 改
            </el-button>
          </template>
        </RangeVxeTable>
      </div>
    </section>
  </div>

  <HelpModal v-if="!selectionMode" ref="helpModalRef" />
  <AnnualKeyTaskFormDialog
    v-if="isShowPage && !selectionMode"
    v-model="formVisible"
    :mode="formMode"
    :initial-data="editingData"
    :submitting="formSubmitting"
    :year-options="yearOptions"
    @submit="saveTask"
  />
  <ImportExcel v-if="!selectionMode" ref="importRef" />
  <UserRoleSelector v-if="!embedded" ref="userRoleSelectorRef" @loadCompany="handleRoleLoaded" />
</template>

<script setup lang="ts" name="/xmInfo/annualKeyTask/index">
import { nextTick, onMounted, provide, reactive, ref, unref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import HelpModal from '@/components/HelpModal/index.vue'
import ImportExcel from '@/components/ImportExcel/index.vue'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import type { RangeVxeTableExpose } from '@/components/RangeVxeTable/interface'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { apiExportHandle } from '@/utils/export'
import { getYearData } from '@/api/common'
import { exportAnnualKeyTasks, importAnnualKeyTasks, pageAnnualKeyTask, removeAnnualKeyTasks, saveAnnualKeyTask } from '@/api/xmInfo/annualKeyTask'
import type { AnnualKeyTaskPageData, AnnualKeyTaskParams, AnnualKeyTaskRowVO } from '@/api/xmInfo/annualKeyTask'
import { createAnnualKeyTaskTableColumns } from './tableColumns'
import AnnualKeyTaskFormDialog from './components/AnnualKeyTaskFormDialog.vue'
import AnnualKeyTaskSearch from './components/AnnualKeyTaskSearch.vue'
import AnnualKeyTaskToolbar from './components/AnnualKeyTaskToolbar.vue'

const props = withDefaults(
  defineProps<{
    embedded?: boolean
    initialUserRole?: Partial<UserRole>
    selectionMode?: boolean
  }>(),
  {
    embedded: false,
    initialUserRole: () => ({}),
    selectionMode: false
  }
)

const { embedded, selectionMode } = props

const store = useStore()
const tableRef = ref<RangeVxeTableExpose<AnnualKeyTaskRowVO>>()
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const helpModalRef = ref<any>()
const searchFormRef = ref<InstanceType<typeof AnnualKeyTaskSearch>>()
const isShowPage = ref(embedded)
const loading = ref(false)
const exporting = ref(false)
const searchVisible = ref(true)
const loadError = ref('')
const buttonPermissions = ref<string[]>([])
const selectedRows = ref<AnnualKeyTaskRowVO[]>([])
const formVisible = ref(false)
const formMode = ref<'add' | 'edit' | 'view'>('add')
const editingData = ref<Record<string, any>>({})
const formSubmitting = ref(false)
const yearOptions = ref<Array<{ yearCode: string; yearName: string }>>([])
const searchForm = reactive({
  nd: '',
  zdrwbms: '',
  zyfl: '',
  zyflZdrw: ''
})

const currentUserRole = ref<UserRole>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

if (embedded) Object.assign(currentUserRole.value, props.initialUserRole)

provide('currentUserRole', currentUserRole)

const hasPermission = (code: string) => buttonPermissions.value.includes(code)
const tableColumns = createAnnualKeyTaskTableColumns()
if (selectionMode) {
  const operationIndex = tableColumns.findIndex((column) => column.field === 'operation')
  if (operationIndex >= 0) tableColumns.splice(operationIndex, 1)
  const selectionColumnWidths: Record<string, string | number> = {
    nd: '8%',
    zdrwbm: '14%',
    zyfl: '16%',
    glbm: '16%',
    zyflZdrw: '42%'
  }
  tableColumns.forEach((column) => {
    if (column.type === 'checkbox') {
      column.width = 48
      return
    }
    if (!column.field || !selectionColumnWidths[column.field]) return
    // 弹窗选择场景用百分比宽度铺满，需清掉自动列宽用的 minWidth/maxWidth，否则会抬宽列导致横向溢出
    column.width = selectionColumnWidths[column.field]
    delete column.minWidth
    delete column.maxWidth
  })
}

const trimValue = (value: unknown) => String(value || '').trim()

const splitCodes = (value: string) =>
  value
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)

const getCurrentYear = () => String(new Date().getFullYear())

type AnnualKeyTaskPageResponse = {
  data: AnnualKeyTaskPageData | AnnualKeyTaskRowVO[]
  msg?: string
  success: boolean
  [key: string]: any
}

const buildQueryParams = (params: Record<string, any> = {}): AnnualKeyTaskParams => {
  const pageParam = tableRef.value?.pageable
  return {
    bmId: currentUserRole.value.bmId,
    dwId: currentUserRole.value.dwId,
    roleCode: currentUserRole.value.roleCode,
    roleId: currentUserRole.value.roleId,
    userId: String(store.getters.getUserMsg?.id || ''),
    nd: trimValue(searchForm.nd),
    zdrwbms: splitCodes(searchForm.zdrwbms),
    zyfl: trimValue(searchForm.zyfl),
    zyflZdrw: trimValue(searchForm.zyflZdrw),
    page: params.page ?? pageParam?.current ?? 1,
    limit: params.limit ?? pageParam?.size ?? 20
  }
}

const normalizePageResult = (result: AnnualKeyTaskPageResponse, params: Record<string, any>) => {
  if (!result.success) throw new Error(result.msg || '年度重点任务列表加载失败')
  if (Array.isArray(result.data)) {
    return {
      ...result,
      data: { records: result.data, total: result.data.length, current: Number(params.page || 1), size: Number(params.limit || 20) }
    }
  }
  return result
}

const requestApi = async (params: Record<string, any>) => {
  loading.value = true
  loadError.value = ''
  try {
    const query = buildQueryParams(params)
    const result = await pageAnnualKeyTask(query)
    return normalizePageResult(result, query)
  } finally {
    loading.value = false
  }
}

const handleRequestError = (error: unknown) => {
  loadError.value = error instanceof Error ? error.message : '年度重点任务列表加载失败，请检查网络或服务状态后重试'
  ElMessage.error(loadError.value)
}

const syncSelectedRows = (rows: AnnualKeyTaskRowVO[]) => {
  selectedRows.value = rows
}

const searchHandle = async () => {
  loadError.value = ''
  selectedRows.value = []
  tableRef.value?.clearSelection()
  if (tableRef.value?.pageable) tableRef.value.pageable.current = 1
  await tableRef.value?.getTableList()
}

const resetHandle = async () => {
  const currentYear = getCurrentYear()
  searchForm.nd = yearOptions.value.some((item) => item.yearCode === currentYear) ? currentYear : yearOptions.value[0]?.yearCode || ''
  searchForm.zdrwbms = ''
  searchForm.zyfl = ''
  searchForm.zyflZdrw = ''
  searchFormRef.value?.clearValidate()
  await nextTick()
  await searchHandle()
}

const toggleSearchVisible = () => {
  searchVisible.value = !searchVisible.value
}

const openColSetting = () => {
  tableRef.value?.openColSetting()
}

const openHelp = () => {
  if (helpModalRef.value) helpModalRef.value.showModal = true
}

const handleRoleLoaded = async () => {
  isShowPage.value = Boolean(userRoleSelectorRef.value?.canRender)
  if (!isShowPage.value) return
  const permissions = unref(userRoleSelectorRef.value?.permissions)
  buttonPermissions.value = Array.isArray(permissions) ? [...permissions] : []
  await nextTick()
  await tableRef.value?.getTableList()
}

const openAdd = () => {
  formMode.value = 'add'
  editingData.value = { nd: searchForm.nd }
  formVisible.value = true
}

const loadTaskDetail = async (rows: AnnualKeyTaskRowVO[], mode: 'edit' | 'view') => {
  if (rows.length !== 1) {
    ElMessage.warning(`请选择一条年度重点任务进行${mode === 'edit' ? '修改' : '查看'}`)
    return
  }
  const selected = rows[0]
  const id = trimValue(selected.id)
  if (!id) {
    ElMessage.error(`年度重点任务“${selected.zyflZdrw || selected.zyfl || '-'}”缺少主键ID，无法${mode === 'edit' ? '修改' : '查看'}`)
    return
  }
  formMode.value = mode
  editingData.value = { ...selected }
  formVisible.value = true
}

const openEdit = (rows: AnnualKeyTaskRowVO[]) => loadTaskDetail(rows, 'edit')

const openView = (rows: AnnualKeyTaskRowVO[]) => loadTaskDetail(rows, 'view')

const removeSelected = async (rows: AnnualKeyTaskRowVO[]) => {
  if (!rows.length) {
    ElMessage.warning('请选择要删除的年度重点任务')
    return
  }
  const invalidRecord = rows.find((item) => item.id === null || item.id === undefined || item.id === '')
  if (invalidRecord) {
    ElMessage.error(`年度重点任务“${invalidRecord.zyflZdrw || invalidRecord.zyfl || '-'}”缺少主键ID，无法删除`)
    return
  }
  const confirm = await VXETable.modal.confirm(`删除后无法恢复，确定删除 ${rows.length} 条年度重点任务吗？`, '删除确认', { status: 'warning' })
  if (confirm !== 'confirm') return
  try {
    const result = await removeAnnualKeyTasks({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      roleCode: currentUserRole.value.roleCode,
      roleId: currentUserRole.value.roleId,
      userId: String(store.getters.getUserMsg?.id || ''),
      ids: rows.map((item) => String(item.id))
    })
    if (!result.success) throw new Error(result.msg || '删除失败')
    ElMessage.success('删除成功')
    selectedRows.value = []
    tableRef.value?.clearSelection()
    await tableRef.value?.getTableList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败，请确认记录状态后重试')
  }
}

const saveTask = async (payload: Record<string, any>) => {
  formSubmitting.value = true
  try {
    const result = await saveAnnualKeyTask({
      ...payload,
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      roleCode: currentUserRole.value.roleCode,
      roleId: currentUserRole.value.roleId,
      userId: String(store.getters.getUserMsg?.id || '')
    })
    if (!result.success) throw new Error(result.msg || '保存失败')
    ElMessage.success(formMode.value === 'add' ? '新增成功' : '保存成功')
    formVisible.value = false
    await tableRef.value?.getTableList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败，请检查年度重点任务信息后重试')
  } finally {
    formSubmitting.value = false
  }
}

const openImport = () => {
  importRef.value?.acceptParams({
    title: '年度重点任务',
    specialorgid: currentUserRole.value.bmId,
    importTip: '请按后端年度重点任务模板字段填写；导入失败时请按错误信息修正文件后重试。',
    importApi: ({ excelFormData }: { excelFormData: FormData }) => {
      excelFormData.append('bmId', currentUserRole.value.bmId)
      excelFormData.append('dwId', currentUserRole.value.dwId)
      excelFormData.append('roleCode', currentUserRole.value.roleCode)
      excelFormData.append('roleId', currentUserRole.value.roleId)
      excelFormData.append('userId', String(store.getters.getUserMsg?.id || ''))
      return importAnnualKeyTasks(excelFormData)
    },
    getTableList: () => tableRef.value?.getTableList()
  })
}

const handleExport = async () => {
  exporting.value = true
  try {
    await apiExportHandle(buildQueryParams(), '年度重点任务管理', exportAnnualKeyTasks)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败，请检查查询条件后重试')
  } finally {
    exporting.value = false
  }
}

const loadYearOptions = async () => {
  const result = await getYearData()
  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(result.msg || '年度列表加载失败')
  }

  const options = result.data
    .map((item: any) => ({
      yearCode: String(item.yearCode || item.code || '').trim(),
      yearName: String(item.yearName || item.name || item.yearCode || item.code || '').trim()
    }))
    .filter((item: { yearCode: string }) => item.yearCode)

  if (!options.length) throw new Error('年度列表为空')
  yearOptions.value = options
  const currentYear = getCurrentYear()
  searchForm.nd = options.some((item) => item.yearCode === currentYear) ? currentYear : options[0].yearCode
}

const getSelectedRows = () => [...selectedRows.value]

const clearSelectedRows = () => {
  selectedRows.value = []
  tableRef.value?.clearSelection()
}

defineExpose({
  clearSelectedRows,
  getSelectedRows
})

onMounted(async () => {
  try {
    await loadYearOptions()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '年度列表加载失败，请检查网络或服务状态后重试'
    ElMessage.error(loadError.value)
  }
  if (!embedded) {
    userRoleSelectorRef.value?.getUser()
    return
  }
  await nextTick()
  await tableRef.value?.getTableList()
})
</script>

<style scoped lang="less">
@primary-color: #00706b;
@primary-hover: #2a9a92;
@primary-active: #005f5a;
@primary-disabled: #a8cfcb;
@primary-soft: #f2f9f8;
@primary-hover-fill: #e6f4f3;
@primary-border-soft: #b8ddd9;
@table-header: #dff3f0;
@table-stripe: #f7fcfb;
@table-current: #d8efec;
@border-soft: #e2e8f0;
@border-faint: #eef2f6;
@text-regular: #475569;

.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f5fbfb;

  :deep(.el-button) {
    height: 28px;
    min-height: 28px;
    margin-left: 0;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;

    &:focus-visible {
      outline: 2px solid @primary-color;
      outline-offset: 2px;
    }
  }

  :deep(.el-button--primary),
  :deep(.el-button--primary.is-plain) {
    border-color: @primary-border-soft !important;
    color: @primary-color !important;
    background-color: @primary-soft !important;
    background-image: none !important;
  }

  :deep(.el-button--primary:hover:not(.is-disabled)),
  :deep(.el-button--primary:focus:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:hover:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:focus:not(.is-disabled)) {
    border-color: @primary-color !important;
    color: @primary-color !important;
    background-color: @primary-hover-fill !important;
  }

  :deep(.el-button--primary:active:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:active:not(.is-disabled)) {
    border-color: @primary-active !important;
    color: @primary-active !important;
  }

  :deep(.el-button--primary.is-disabled),
  :deep(.el-button--primary.is-plain.is-disabled) {
    border-color: @primary-border-soft !important;
    color: @primary-disabled !important;
    background-color: @primary-soft !important;
  }

  :deep(.el-input__inner) {
    height: 32px;
    border-radius: 6px;
    color: @text-regular;

    &:hover {
      border-color: @primary-border-soft;
    }

    &:focus,
    &:focus-visible {
      border-color: @primary-color;
      outline: 2px solid @primary-color;
      outline-offset: 2px;
    }
  }
}

.workbench-panel {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  height: 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid @border-soft;
  border-radius: 12px;
  background-color: #ffffff;
}

.task-alert {
  flex-shrink: 0;
  margin: 10px 12px 0;
  border-radius: 6px;
}

.table-region {
  display: flex;
  flex: 1 1 0;
  height: 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;

  :deep(.vxe-grid),
  :deep(.vxe-table) {
    width: 100% !important;
    height: 100% !important;
    color: @text-regular;
    --vxe-font-color: @text-regular;
    --vxe-table-header-font-color: @primary-color;
    --vxe-table-header-background-color: @table-header;
    --vxe-table-header-font-weight: 600;
    --vxe-table-border-color: @border-soft;
    --vxe-table-row-hover-background-color: @primary-hover-fill;
    --vxe-table-row-striped-background-color: @table-stripe;
    --vxe-table-row-current-background-color: @table-current;
    --vxe-table-row-checkbox-checked-background-color: @table-current;
  }

  :deep(.vxe-table--header-wrapper),
  :deep(.vxe-table--header),
  :deep(.vxe-header--column) {
    background-color: @table-header !important;
  }

  :deep(.vxe-header--column) {
    height: 44px;
    color: @primary-color !important;
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.vxe-body--column) {
    color: @text-regular;
    font-size: 13px;
  }

  :deep(.vxe-body--row.row--stripe) {
    background-color: @table-stripe !important;
  }

  :deep(.vxe-body--row.row--checked),
  :deep(.vxe-body--row.row--current) {
    background-color: @table-current !important;
  }

  :deep(.vxe-body--row.row--hover),
  :deep(.vxe-body--row.row--hover.row--stripe),
  :deep(.vxe-body--row.row--hover.row--checked),
  :deep(.vxe-body--row.row--hover.row--current) {
    background-color: @primary-hover-fill !important;
  }

  :deep(.vxe-body--row.row--stripe .vxe-body--column),
  :deep(.vxe-body--row.row--checked .vxe-body--column),
  :deep(.vxe-body--row.row--hover .vxe-body--column),
  :deep(.vxe-body--row.row--current .vxe-body--column) {
    background-color: transparent !important;
  }

  :deep(.vxe-checkbox--icon),
  :deep(.vxe-cell--checkbox .vxe-checkbox--checked-icon),
  :deep(.vxe-cell--checkbox .vxe-checkbox--indeterminate-icon) {
    color: @primary-color !important;
  }

  :deep(.el-pagination) {
    border-top: 1px solid @border-faint;
    background-color: #ffffff;
    color: @text-regular;
    font-size: 12px;
  }

  :deep(.el-pager li.active) {
    background-color: @primary-color !important;
    color: #ffffff !important;
  }
}

.row-action-button {
  color: @primary-color;
  font-size: 12px;

  & + & {
    margin-left: 8px;
  }
}
</style>
