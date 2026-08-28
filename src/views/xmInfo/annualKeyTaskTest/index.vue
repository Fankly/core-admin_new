<template>
  <!--
    THESIS: 年度重点任务管理把年度任务台账的查询、维护、查看、删除、导入和导出放在同一工作台，拒绝拆成多个低频入口。
    OWN-WORLD: 继承电网规则控制台的白色单层工作面、薄荷查询带和表头、#00706b 青绿操作色、桌面高密度表格。
    STORY: 用户按角色组织范围进入，筛选年度重点任务，在列表中完成单条新增/修改/查看与批量删除、导入、导出。
    FIRST VIEWPORT: 工具栏置顶、查询带紧随其后、主表格吃满剩余高度，编辑与查看进入同一个只读/可编辑弹窗。
    FORM: established-extension from ownRealEstate; seed: not-applicable; FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
    TEST COPY: 由 annualKeyTask 复制而来，仅用于测试；列表去掉操作列，查询条件只保留年度。
  -->
  <div v-if="isShowPage" class="container">
    <section class="workbench-panel" aria-label="年度重点任务管理">
      <AnnualKeyTaskToolbar
        v-if="!selectionMode"
        :search-visible="searchVisible"
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
        @search="searchHandle"
        @reset="resetHandle"
      />

      <el-alert v-if="loadError" class="task-alert" type="error" :closable="false" show-icon :title="loadError" />

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
          :row-click-mode="selectionMode ? 'toggle' : 'exclusive'"
          :reserve-selection="selectionMode"
          :column-setting="!selectionMode"
          border
          stripe
          @selection-change="syncSelectedRows"
        />
      </div>
    </section>
  </div>

  <HelpModal v-if="!selectionMode" ref="helpModalRef" />
  <UserRoleSelector v-if="!embedded" ref="userRoleSelectorRef" @loadCompany="handleRoleLoaded" />
</template>

<script setup lang="ts" name="/xmInfo/annualKeyTaskTest/index">
import { nextTick, onMounted, provide, reactive, ref, unref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import HelpModal from '@/components/HelpModal/index.vue'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import type { RangeVxeTableExpose } from '@/components/RangeVxeTable/interface'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { getYearData } from '@/api/common'
import { pageAnnualKeyTask } from '@/api/xmInfo/annualKeyTask'
import type { AnnualKeyTaskPageData, AnnualKeyTaskParams, AnnualKeyTaskRowVO } from '@/api/xmInfo/annualKeyTask'
import { createAnnualKeyTaskTableColumns } from './tableColumns'
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
const helpModalRef = ref<any>()
const searchFormRef = ref<InstanceType<typeof AnnualKeyTaskSearch>>()
const isShowPage = ref(embedded)
const loading = ref(false)
const searchVisible = ref(true)
const loadError = ref('')
const selectedRows = ref<AnnualKeyTaskRowVO[]>([])
const yearOptions = ref([{ yearCode: '2026', yearName: '2026年度' }])
const searchForm = reactive({
  nd: '2026'
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

const tableColumns = createAnnualKeyTaskTableColumns()
if (selectionMode) {
  const selectionColumnWidths: Record<string, string | number> = {
    nd: '8%',
    zdrwbm: '14%',
    zyfl: '16%',
    glbm: '16%',
    zyflZdrw: '42%'
  }
  tableColumns.forEach((column) => {
    if (column.type === 'checkbox') column.width = 48
    else if (column.field && selectionColumnWidths[column.field]) {
      column.minWidth = selectionColumnWidths[column.field]
      column.width = undefined
    }
  })
}

const trimValue = (value: unknown) => String(value || '').trim()

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
    zdrwbms: [],
    zyfl: '',
    zyflZdrw: '',
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
  searchForm.nd = '2026'
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
  await nextTick()
  await tableRef.value?.getTableList()
}

const loadYearOptions = async () => {
  try {
    const result = await getYearData()
    if (!result.success || !Array.isArray(result.data)) return
    const options = result.data
      .map((item: any) => ({
        yearCode: String(item.yearCode || item.code || '').trim(),
        yearName: String(item.yearName || item.name || item.yearCode || item.code || '').trim()
      }))
      .filter((item: { yearCode: string }) => item.yearCode)
    if (!options.some((item: { yearCode: string }) => item.yearCode === '2026')) {
      options.unshift({ yearCode: '2026', yearName: '2026年度' })
    }
    yearOptions.value = options
  } catch {
    yearOptions.value = [{ yearCode: '2026', yearName: '2026年度' }]
  }
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
  loadYearOptions()
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
</style>
