<template>
  <!--
    THESIS: 自有房产把组织范围内的房产检索、核对和维护集中在同一工作台，拒绝将常用字段拆散成多张摘要卡片。
    OWN-WORLD: 继承 smartTaskAudit 的白色单层工作台、薄荷查询带和表头、#00706b 青绿操作色与细网格。
    STORY: 用户确认角色后按房产编号或名称查询，在高密度台账中完成新增、编辑、删除、导入和导出。
    FIRST VIEWPORT: 独立操作工具栏置顶，可折叠查询带紧随其后，主表与分页占满剩余空间，复杂字段进入分组弹窗。
    FORM: smartTaskAudit 同构四段式分页台账；精确业务扩展按 new-work.md 不运行 concept seed（seed: not-applicable-established-extension）；FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
  -->
  <div v-if="isShowPage" class="container">
    <section class="workbench-panel" aria-label="自有房产台账">
      <RealEstateToolbar
        :disabled="loading"
        :exporting="exporting"
        :search-visible="searchVisible"
        :selected-count="selectedRows.length"
        :permissions="buttonPermissions"
        @add="openAdd"
        @edit="openEdit(selectedRows)"
        @remove="removeSelected(selectedRows)"
        @import="openImport"
        @export="handleExport"
        @setting-click="openColSetting"
        @toggle-search="toggleSearchVisible"
        @help="openHelp"
      />

      <RealEstateSearch
        ref="searchFormRef"
        :visible="searchVisible"
        :loading="loading"
        :search-form="searchForm"
        @update:fcbh="searchForm.fcbh = $event"
        @update:fcmc="searchForm.fcmc = $event"
        @search="searchHandle"
        @reset="resetHandle"
      />

      <el-alert v-if="loadError" class="estate-alert" type="error" :closable="false" show-icon :title="loadError" />

      <div class="table-region">
        <RangeVxeTable
          ref="tableRef"
          :columns="tableColumns"
          :loading="loading"
          :request-api="requestApi"
          :request-error="handleRequestError"
          :page-size="20"
          :page-sizes="[10, 20, 50, 100, 500]"
          row-key="id"
          row-click-mode="exclusive"
          column-setting
          border
          stripe
          @selection-change="syncSelectedRows"
        >
          <template #operation="{ row }">
            <el-button
              v-if="hasPermission('EDIT')"
              class="row-edit-button"
              type="text"
              size="mini"
              title="编辑房产"
              aria-label="编辑房产"
              @click.stop="openEdit([row])"
            >
              编 辑
            </el-button>
          </template>
        </RangeVxeTable>
      </div>
    </section>
  </div>

  <HelpModal ref="helpModalRef" />
  <RealEstateFormDialog
    v-if="isShowPage"
    v-model="formVisible"
    :mode="formMode"
    :initial-data="editingData"
    :submitting="formSubmitting"
    @submit="saveEstate"
  />
  <ImportExcel ref="importRef" />
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="handleRoleLoaded" />
</template>

<script setup lang="ts" name="/xmInfo/ownRealEstate/index">
import { nextTick, onMounted, provide, reactive, ref, unref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import HelpModal from '@/components/HelpModal/index.vue'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import type { RangeVxeTableExpose } from '@/components/RangeVxeTable/interface'
import ImportExcel from '@/components/ImportExcel/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { apiExportHandle } from '@/utils/export'
import {
  addOwnRealEstate,
  exportOwnRealEstates,
  getOwnRealEstate,
  importOwnRealEstates,
  pageOwnRealEstate,
  removeOwnRealEstates
} from '@/api/xmInfo/ownRealEstate'
import type { OwnRealEstateParams, OwnRealEstateRowVO, RealEstateRecord } from '@/api/xmInfo/ownRealEstate'
import { createOwnRealEstateTableColumns } from './tableColumns'
import RealEstateFormDialog from './components/RealEstateFormDialog.vue'
import RealEstateSearch from './components/RealEstateSearch.vue'
import RealEstateToolbar from './components/RealEstateToolbar.vue'

const store = useStore()
const route = useRoute()
const tableRef = ref<RangeVxeTableExpose<OwnRealEstateRowVO>>()
const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const importRef = ref<InstanceType<typeof ImportExcel>>()
const helpModalRef = ref<any>()
const searchFormRef = ref<InstanceType<typeof RealEstateSearch>>()
const isShowPage = ref(false)
const loading = ref(false)
const exporting = ref(false)
const searchVisible = ref(true)
const loadError = ref('')
const buttonPermissions = ref<string[]>([])
const selectedRows = ref<OwnRealEstateRowVO[]>([])
const formVisible = ref(false)
const formMode = ref<'add' | 'edit'>('add')
const editingData = ref<RealEstateRecord>({})
const formSubmitting = ref(false)
const searchForm = reactive({ fcbh: '', fcmc: '' })

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

provide('currentUserRole', currentUserRole)

const hasPermission = (code: string) => buttonPermissions.value.includes(code)

const tableColumns = createOwnRealEstateTableColumns()

const buildQueryParams = (params: Record<string, any> = {}): OwnRealEstateParams => {
  const pageParam = tableRef.value?.pageable
  return {
    bmId: currentUserRole.value.bmId,
    dwId: currentUserRole.value.dwId,
    roleCode: currentUserRole.value.roleCode,
    roleId: currentUserRole.value.roleId,
    userId: String(store.getters.getUserMsg?.id || ''),
    fcbh: searchForm.fcbh.trim(),
    fcmc: searchForm.fcmc.trim(),
    page: params.page ?? pageParam?.current ?? 1,
    limit: params.limit ?? pageParam?.size ?? 20
  }
}

const normalizePageResult = (result: Awaited<ReturnType<typeof pageOwnRealEstate>>, params: Record<string, any>) => {
  if (!result.success) throw new Error(result.msg || '自有房产列表加载失败')
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
    const result = await pageOwnRealEstate(query)
    return normalizePageResult(result, query)
  } finally {
    loading.value = false
  }
}

const handleRequestError = (error: unknown) => {
  loadError.value = error instanceof Error ? error.message : '自有房产列表加载失败，请检查网络或服务状态后重试'
  ElMessage.error(loadError.value)
}

const syncSelectedRows = (rows: OwnRealEstateRowVO[]) => {
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
  searchForm.fcbh = ''
  searchForm.fcmc = ''
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
  editingData.value = {}
  formVisible.value = true
}

const openEdit = async (rows: OwnRealEstateRowVO[]) => {
  if (rows.length !== 1) {
    ElMessage.warning('请选择一条房产记录进行编辑')
    return
  }
  const selected = rows[0]
  const xmId = String(selected.id ?? '').trim()
  if (!xmId) {
    ElMessage.error(`房产“${selected.fcmc || selected.fcbh || selected.dataId || '-'}”缺少主键ID，无法编辑`)
    return
  }
  try {
    const result = await getOwnRealEstate(String(route.query.pageType || 'edit'), xmId)
    if (!result.success) throw new Error(result.msg || '自有房产详情加载失败')
    formMode.value = 'edit'
    const detail = result.data && typeof result.data === 'object' && !Array.isArray(result.data) ? result.data : {}
    editingData.value = { ...selected, ...detail }
    formVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '自有房产详情加载失败，请稍后重试')
  }
}

const removeSelected = async (rows: OwnRealEstateRowVO[]) => {
  if (!rows.length) return
  const invalidRecord = rows.find((item) => item.id === null || item.id === undefined || item.id === '')
  if (invalidRecord) {
    ElMessage.error(`房产“${invalidRecord.fcmc || invalidRecord.fcbh || '-'}”缺少主键ID，无法删除`)
    return
  }
  const confirm = await VXETable.modal.confirm(`删除后无法恢复，确定删除 ${rows.length} 条房产记录吗？`, '删除确认', { status: 'warning' })
  if (confirm !== 'confirm') return
  const first = rows[0] as OwnRealEstateRowVO & Record<string, any>
  try {
    const result = await removeOwnRealEstates({
      createDeptId: currentUserRole.value.bmId,
      ids: rows.map((item) => String(item.id)),
      nd: String(first.nd || route.query.nd || ''),
      searchCode: String(first.searchCode || route.query.searchCode || ''),
      shxx: String(first.shxx || route.query.shxx || ''),
      uuid: String(first.uuid || route.query.uuid || '')
    })
    if (!result.success) throw new Error(result.msg || '删除失败')
    ElMessage.success('删除成功')
    await tableRef.value?.getTableList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '删除失败，请确认记录状态后重试')
  }
}

const saveEstate = async (payload: RealEstateRecord) => {
  formSubmitting.value = true
  try {
    const result = await addOwnRealEstate(payload)
    if (!result.success) throw new Error(result.msg || '保存失败')
    ElMessage.success(formMode.value === 'add' ? '新增成功' : '保存成功')
    formVisible.value = false
    await tableRef.value?.getTableList()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '保存失败，请检查房产信息后重试')
  } finally {
    formSubmitting.value = false
  }
}

const openImport = () => {
  importRef.value?.acceptParams({
    title: '自有房产',
    specialorgid: currentUserRole.value.bmId,
    importTip: '请使用系统约定的房产台账字段与格式；导入失败时请按错误信息修正文件后重试。',
    importApi: ({ excelFormData }: { excelFormData: FormData }) => {
      excelFormData.append('bmId', currentUserRole.value.bmId)
      excelFormData.append('dwId', currentUserRole.value.dwId)
      excelFormData.append('roleCode', currentUserRole.value.roleCode)
      excelFormData.append('roleId', currentUserRole.value.roleId)
      excelFormData.append('userId', String(store.getters.getUserMsg?.id || ''))
      return importOwnRealEstates(excelFormData)
    },
    getTableList: () => tableRef.value?.getTableList()
  })
}

const handleExport = async () => {
  exporting.value = true
  try {
    await apiExportHandle(buildQueryParams(), '自有房产台账', exportOwnRealEstates)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败，请检查查询条件后重试')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
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
@text-primary: #1e293b;
@text-regular: #475569;
@text-muted: #64748b;

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

.estate-alert {
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
}

.row-edit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 28px;
  margin: 0;
  padding: 0 8px;
  border: 1px solid transparent !important;
  border-radius: 6px;
  color: @primary-color !important;
  background-color: transparent !important;

  &:hover,
  &:focus {
    border-color: @primary-border-soft !important;
    color: @primary-active !important;
    background-color: @primary-hover-fill !important;
  }
}

:deep(.el-pagination) {
  flex-shrink: 0;
  justify-content: flex-end;
  margin: 0 !important;
  padding: 8px 12px;
  border-top: 1px solid @border-faint;
  color: @text-muted;
  background-color: #ffffff;

  &.is-background .btn-prev,
  &.is-background .btn-next,
  &.is-background .el-pager li,
  .btn-prev,
  .btn-next,
  .el-pager li {
    min-width: 28px;
    height: 28px;
    margin: 0 2px;
    border: 1px solid transparent !important;
    border-radius: 6px;
    color: @text-primary !important;
    background-color: transparent !important;
    line-height: 28px;
  }

  &.is-background .el-pager li:not(.disabled):not(.is-active):hover,
  &.is-background .btn-prev:not(:disabled):hover,
  &.is-background .btn-next:not(:disabled):hover {
    border-color: @primary-border-soft !important;
    color: @primary-color !important;
    background-color: @primary-soft !important;
  }

  &.is-background .el-pager li:not(.disabled).is-active,
  &.is-background .el-pager li:not(.disabled).active {
    border-color: @primary-color !important;
    color: #ffffff !important;
    background-color: @primary-color !important;
    font-weight: 600;
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.el-button),
  :deep(.el-input__inner) {
    transition: none !important;
  }
}
</style>
