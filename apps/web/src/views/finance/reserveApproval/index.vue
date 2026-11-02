<template>
  <div class="reserveApproval pageStyle">
    <filter-config-box class="reserveApproval__filter" type="card" :options="filterOptions" v-model="formFilter" @search="refreshTable(true)" />
    <table-box
      id="tableBox"
      class="page-table"
      type="card"
      height="100%"
      :data="tableImpl.dataList"
      :size="defaultFormItemSize"
      @sort-change="onTableSortChange"
      @refresh="refreshTable(true)"
      @input="(value) => (checkboxValues = value)"
      :seq-config="{ startIndex: (tableImpl.currentPage - 1) * tableImpl.pageSize }"
    >
      <template #operator>
        <!-- <el-button icon="el-icon-download" :size="defaultFormItemSize" @click="handleExport()">导出</el-button>
        <el-button icon="el-icon-circle-check" :size="defaultFormItemSize" @click="handleConfirm()">全部通过</el-button>
        <el-button
          type="primary"
          v-if="['financeApproval'].includes($route.name)"
          icon="el-icon-setting"
          :size="defaultFormItemSize"
          @click="handleSetting()"
          >配置</el-button
        > -->
      </template>
      <vxe-column title="序号" type="seq" width="50px" />
      <vxe-column title="项目类型" :min-width="120" field="categoryName" />
      <vxe-column title="重点投向" :min-width="120" field="keyInvestName" />
      <vxe-column title="预算事项" :min-width="220" field="courseTitleName" />
      <vxe-column title="项目名称" :min-width="440" field="name" />
      <vxe-column title="申请总额(万元)" :min-width="120" field="applyTaxExclusive" />
      <vxe-column title="归口部门" :min-width="120" field="affiliateDeptName" />
      <vxe-column title="二级单位" :min-width="120" field="secondDeptName" />
      <vxe-column title="实施部门" :min-width="120" field="implDept" />
      <!--  <vxe-column title="招标方式" :min-width="120" field="biddingMethod">
        <template v-slot="scope">
          <span>{{ scope.row.biddingMethod != null ? (scope.row.biddingMethod == '1' ? '框架招标' : '单项招标') : '' }}</span>
        </template>
      </vxe-column> -->
      <vxe-column title="是否预安排" :min-width="120" field="preArranged">
        <template v-slot="scope">
          <span>{{ scope.row.preArranged != null ? (scope.row.preArranged == '1' ? '是' : '否') : '' }}</span>
        </template>
      </vxe-column>
      <!-- <vxe-column title="项目负责人" :min-width="120" field="projectLead" />
      <vxe-column title="分管主任" :min-width="120" field="sectionLead" />
      <vxe-column title="创建时间" :min-width="120">
        <template v-slot="scope">
          <span>{{ formatDateByStatsType(scope.row.createTime, 'day') }}</span>
        </template>
      </vxe-column>
       -->
      <vxe-column title="储备年份" :min-width="120" field="year" />
      <vxe-column title="储备批次" :min-width="120" field="batchName" />
      <!--   <vxe-column title="储备状态" fixed="right" :min-width="120" field="reserveStatus">
        <template v-slot="scope">
          <base-tag class="status--tag" :type="getType(scope.row.reserveStatus)" :size="defaultFormItemSize">{{
            reserveStatus.filter((item) => item.key == scope.row.reserveStatus)?.[0]?.value
          }}</base-tag>
        </template>
      </vxe-column> -->
      <!--   <vxe-column title="人工复审结论" fixed="right" :min-width="120" field="approveStatus">
        <template v-slot="scope">
          <base-tag :type="ApprovedTypeDict.getValue(+scope.row.approveStatus, 'type')" :size="defaultFormItemSize">{{
            ApprovedTypeDict.getValue(+scope.row.approveStatus)
          }}</base-tag>
        </template>
      </vxe-column> -->
      <vxe-column title="AI初评结论" fixed="right" :min-width="120" field="aiRiskLevel">
        <template v-slot="scope">
          <base-tag :type="AIRiskLevelDict.getList().filter((item) => item.id == scope.row.aiRiskLevel)?.[0]?.type" :size="defaultFormItemSize">{{
            AIRiskLevelDict.getList().filter((item) => item.id == scope.row.aiRiskLevel)?.[0]?.name
          }}</base-tag>
        </template>
      </vxe-column>
      <vxe-column title="操作" width="150px" fixed="right">
        <template v-slot="scope">
          <el-button type="primary" link :size="defaultFormItemSize" @click="onDetail(scope.row.approveId)"> 详情 </el-button>
        </template>
      </vxe-column>

      <template #pagination>
        <el-row type="flex" justify="space-between" style="margin-top: 16px">
          <span class="custom-total-extra" style="">列表金额总计（万元）：{{ amount }}</span>
          <el-pagination
            :total="tableImpl.totalCount"
            :current-page="tableImpl.currentPage"
            :page-size="tableImpl.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, prev, pager, next, sizes"
            @current-change="onTableCurrentPageChange"
            @size-change="onTablePageSizeChange"
          >
          </el-pagination>
        </el-row>
      </template>
    </table-box>
  </div>
</template>
<script setup>
import { DropdownWidget, TableWidget } from '@/utils/widget.js'
import '@/core/mixins'
import { CwProjectApprove, CwProjectApply, CwProject } from '@/api/mainController'
import DictionaryController from '@/api/Controller/DictionaryController'
import { treeDataTranslate } from '@/utils/index'
import '../mixin/categorysMixin.js'
import exportDialog from './exportDialog.vue'
import similarSetting from '../components/similarSetting.vue'
import { saveReserveApprovalReturnFilter, takeReserveApprovalReturnFilter } from './routeFilterState.mjs'
import { useUpload, useStatsDateRange, useCachedPage, useCachedSinglePage, useCategorys } from '@/core/composables/useWorkspace'
import { ElMessageBox, ElMessage } from 'element-plus'
import { proxyRefs, toRef, reactive, toRefs, computed, watch, onMounted, onActivated, getCurrentInstance } from 'vue'
import { useRoute, useRouter } from 'vue-router'
defineOptions({
  name: '/finance/reserveApproval/index'
})
const componentProps = defineProps({
  // originCallback: {
  //   type: [Function]
  // }
  _key: {
    type: [Number, String],
    default: undefined
  },
  _origin: {
    type: String
  }
})
const componentInstance = getCurrentInstance().proxy
const route = useRoute()
const router = useRouter()
const UploadState = proxyRefs(useUpload())
const parseUploadData = toRef(UploadState, 'parseUploadData')
const getPictureList = toRef(UploadState, 'getPictureList')
const fileListToJson = toRef(UploadState, 'fileListToJson')
const getUploadFileUrl = toRef(UploadState, 'getUploadFileUrl')
const filterEmptyValues = toRef(UploadState, 'filterEmptyValues')
const getUploadFileUrlByFetch = toRef(UploadState, 'getUploadFileUrlByFetch')
const getUploadActionUrl = toRef(UploadState, 'getUploadActionUrl')
const pictureFile = toRef(UploadState, 'pictureFile')
const getUploadHeaders = toRef(UploadState, 'getUploadHeaders')
const StatsDateRangeState = proxyRefs(useStatsDateRange())
const getDateRangeFilter = toRef(StatsDateRangeState, 'getDateRangeFilter')
const formatDateByStatsType = toRef(StatsDateRangeState, 'formatDateByStatsType')
const formatDateTime = toRef(StatsDateRangeState, 'formatDateTime')
const getStatsTypeShowName = toRef(StatsDateRangeState, 'getStatsTypeShowName')
const getAllowStatsTypeList = toRef(StatsDateRangeState, 'getAllowStatsTypeList')
const CachedPageState = proxyRefs(useCachedPage(undefined))
const addCachePage = toRef(CachedPageState, 'addCachePage')
const removeCachePage = toRef(CachedPageState, 'removeCachePage')
const onResume = toRef(CachedPageState, 'onResume')
const CachedSinglePageState = proxyRefs(useCachedSinglePage(componentProps))
const removeTag = toRef(CachedSinglePageState, 'removeTag')
const getCurrentMenuId = toRef(CachedSinglePageState, 'getCurrentMenuId')
const routerPush = toRef(CachedSinglePageState, 'routerPush')
const singlePageReload = toRef(CachedSinglePageState, 'singlePageReload')
const oncancel = toRef(CachedSinglePageState, 'oncancel')
const refreshUrlParams = toRef(CachedSinglePageState, 'refreshUrlParams')
const savedKey = toRef(CachedSinglePageState, 'savedKey')
const CategorysState = proxyRefs(useCategorys())
const handleCategoryEventChange = toRef(CategorysState, 'handleCategoryEventChange')
const handleCategoryChange = toRef(CategorysState, 'handleCategoryChange')
const getDefaultCategory = toRef(CategorysState, 'getDefaultCategory')
const yearList = toRef(CategorysState, 'yearList')
const getCategorys = toRef(CategorysState, 'getCategorys')
const getFinanceReserveNotice = toRef(CategorysState, 'getFinanceReserveNotice')
const getCwCategoryInvest = toRef(CategorysState, 'getCwCategoryInvest')
const getCwCategoryInvestItemsList = toRef(CategorysState, 'getCwCategoryInvestItemsList')
const getCategoryFilter = toRef(CategorysState, 'getCategoryFilter')
const categorysKeyValue = toRef(CategorysState, 'categorysKeyValue')
const selectImpl = toRef(CategorysState, 'selectImpl')
const componentData = reactive({
  tableImpl: new TableWidget(loadTableData, loadTableVerify, true, false, 'createTime', 1),
  formFilter: {},
  formFilterCopy: {},
  routeAiRiskLevelFilterKey: '',
  listKey: '',
  reserveStatus: [],
  amount: '',
  deptId: {
    impl: new DropdownWidget(loadDeptIdDropdownList)
  },
  pageRoleMap: {
    deptApproval: {
      apiSuffix: 'dept',
      detailPath: 'deptApprovalDetail',
      vtSource: 1
    },
    financeApproval: {
      apiSuffix: 'finance',
      detailPath: 'financeApprovalDetail',
      vtSource: 2
    },
    jysApproval: {
      apiSuffix: 'jys',
      detailPath: 'jysApprovalDetail',
      vtSource: 4
    },
    fzbApproval: {
      apiSuffix: 'fzb',
      detailPath: 'fzbApprovalDetail',
      vtSource: 3
    }
  }
})
const tableImpl = toRef(componentData, 'tableImpl')
const formFilter = toRef(componentData, 'formFilter')
const formFilterCopy = toRef(componentData, 'formFilterCopy')
const routeAiRiskLevelFilterKey = toRef(componentData, 'routeAiRiskLevelFilterKey')
const listKey = toRef(componentData, 'listKey')
const reserveStatus = toRef(componentData, 'reserveStatus')
const amount = toRef(componentData, 'amount')
const deptId = toRef(componentData, 'deptId')
const pageRoleMap = toRef(componentData, 'pageRoleMap')
function getReserveStatus() {
  CwProject.reserveStatus(componentInstance, {}).then((res) => {
    componentData.reserveStatus = res.data
  })
}
function getType(type) {
  let _type = 'primary'
  switch (+type) {
    case componentInstance.StatusReserveDict.PENDING_SUBMIT:
      _type = 'info'
      break
    case componentInstance.StatusReserveDict.REJECTED || componentInstance.StatusReserveDict.DELAYED:
      _type = 'warning'
      break
    case componentInstance.StatusReserveDict.PRE_REVIEW_COMPLETED:
      _type = 'success'
      break
  }
  return _type
}
async function handleApprove(projectId, approveId) {
  await ElMessageBox.confirm('确认审核通过?')
  CwProjectApprove[`${currentPageRole.value.apiSuffix}Approve`](componentInstance, {
    cwApproveDto: {
      projectId: projectId,
      id: approveId
    }
  }).then(() => {
    ElMessage.success('操作成功')
    refreshTable(true)
  })
}
async function handleConfirm() {
  await ElMessageBox.confirm('确认全部审核通过?')
  const { batchId, ...options } = componentData.formFilterCopy
  CwProjectApprove[`${currentPageRole.value.apiSuffix}ApproveBatch`](componentInstance, {
    cwProjectDtoFilter: {
      ...options,
      batchIds: batchId?.join(',')
    }
  }).then(() => {
    ElMessage.success('操作成功')
    refreshTable(true)
  })
}
async function initFormData(bool = true) {
  await onDeptIdVisibleChange(true)
  componentData.formFilter = {}
  const restoredFilter = takeDetailReturnFilter()
  if (restoredFilter) {
    componentData.formFilter = restoredFilter
    componentData.formFilterCopy = {
      ...restoredFilter
    }
    markRouteAiRiskLevelFilterConsumed()
    await CategorysState.getDefaultCategory(componentData.formFilter)
  } else {
    CategorysState.getDefaultCategory()
    applyRouteAiRiskLevelFilter()
  }
  refreshTable(bool)
}
function getRouteAiRiskLevel() {
  const rawValue = route.query?.aiRiskLevel
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue
  if (value == null || value === '') return null
  const aiRiskLevel = Number(value)
  const validRiskLevels = [
    componentInstance.AIRiskLevelDict.RISK_HIGH,
    componentInstance.AIRiskLevelDict.RISK_MEDIUM,
    componentInstance.AIRiskLevelDict.RISK_LOW
  ]
  return validRiskLevels.includes(aiRiskLevel) ? aiRiskLevel : null
}
function applyRouteAiRiskLevelFilter() {
  // 看板跳转带入的 aiRiskLevel 在当前页面实例上只消费一次，避免从详情页返回、
  // 切换页签后 activated() 再次用旧 query 覆盖用户手动修改后的查询条件。
  // 注意：不能用 router.replace 把 query 从 URL 移除——页签和 keep-alive 都以
  // fullPath 为 key，改 URL 会被框架当成新页面，产生第二个页签/实例
  const aiRiskLevel = getRouteAiRiskLevel()
  if (aiRiskLevel == null) return false
  const filterKey = getRouteAiRiskLevelFilterKey(aiRiskLevel)
  if (componentData.routeAiRiskLevelFilterKey === filterKey) return false
  componentData.routeAiRiskLevelFilterKey = filterKey
  componentData.formFilter = {
    aiRiskLevel
  }
  return true
}
function getRouteAiRiskLevelFilterKey(aiRiskLevel = getRouteAiRiskLevel()) {
  if (aiRiskLevel == null) return ''
  return `${route.path}|${route.query?._origin || ''}|${aiRiskLevel}`
}
function markRouteAiRiskLevelFilterConsumed() {
  const filterKey = getRouteAiRiskLevelFilterKey()
  if (filterKey) componentData.routeAiRiskLevelFilterKey = filterKey
}
function getReturnFilterStorage() {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch (e) {
    return null
  }
}
function takeDetailReturnFilter() {
  return takeReserveApprovalReturnFilter(getReturnFilterStorage(), route.fullPath)
}
function restoreDetailReturnFilter() {
  const restoredFilter = takeDetailReturnFilter()
  if (!restoredFilter) return false
  componentData.formFilter = restoredFilter
  componentData.formFilterCopy = {
    ...restoredFilter
  }
  markRouteAiRiskLevelFilterConsumed()
  return true
}
function saveDetailReturnFilter() {
  saveReserveApprovalReturnFilter(getReturnFilterStorage(), route.fullPath, componentData.formFilter)
}
function handleSetting() {
  componentInstance.$dialog
    .show(
      '配置',
      similarSetting,
      {
        area: ['800px']
      },
      {}
    )
    .then((res) => {
      refreshTable(true)
    })
    .catch(() => {})
}
function handleExport() {
  componentInstance.$dialog
    .show(
      '导出',
      exportDialog,
      {
        area: ['450px', 'auto']
      },
      {
        vtSource: currentPageRole.value.vtSource,
        exportOptions: ['financeApproval', 'deptApproval'].includes(route.name) ? [1, 5] : [1]
      }
    )
    .then((res) => {})
    .catch((e) => {})
}
function refreshTable(reloadData = false) {
  if (reloadData) {
    componentData.tableImpl.refreshTable(true, 1)
  } else {
    componentData.tableImpl.refreshTable()
  }
}
// Call TableWidget methods with the reactive proxy so pagination state updates render.
function onTableSortChange(sortInfo) {
  return TableWidget.prototype.onSortChange.call(componentData.tableImpl, sortInfo)
}
function onTableCurrentPageChange(newCurrentPage) {
  return TableWidget.prototype.onCurrentPageChange.call(componentData.tableImpl, newCurrentPage)
}
function onTablePageSizeChange(newPageSize) {
  return TableWidget.prototype.onPageSizeChange.call(componentData.tableImpl, newPageSize)
}
function loadTableData(params) {
  const { batchId, ...options } = componentData.formFilterCopy
  params.cwProjectApproveDtoFilter = {
    ...options,
    batchIds: batchId?.join(',')
  }
  return new Promise((resolve, reject) => {
    CwProjectApprove[`${currentPageRole.value.apiSuffix}List`](componentInstance, params)
      .then((res) => {
        componentData.amount = res.data.amount
        componentData.listKey = res.data.listKey
        resolve({
          dataList: res.data.dataList,
          totalCount: res.data.totalCount
        })
      })
      .catch((e) => {
        reject(e)
      })
  })
}
function loadTableVerify() {
  componentData.formFilterCopy = {
    ...componentData.formFilter
  }
  return true
}
function onDetail(approveId) {
  const jsonStr = JSON.stringify(componentData.listKey)
  const encodedStr = encodeURIComponent(jsonStr)
  saveDetailReturnFilter()
  router.push({
    name: '/finance/reserveApprovalDetail',
    query: {
      id: approveId,
      listKey: encodedStr,
      approvalRole: currentPageRole.value.detailPath
    }
  })
}
function loadDeptIdDropdownList() {
  return new Promise((resolve, reject) => {
    DictionaryController.dictSysDept(componentInstance, {})
      .then((res) => {
        const treeData = treeDataTranslate(res.getList(), 'id')
        const secondLevelData = []
        treeData.forEach((topNode) => {
          if (topNode.children && topNode.children.length > 0) {
            secondLevelData.push(...topNode.children)
          }
        })
        resolve(secondLevelData)
      })
      .catch((e) => {
        reject(e)
      })
  })
}
function onDeptIdVisibleChange() {
  return componentData.deptId?.impl?.onVisibleChange(true).catch((e) => {})
}
const currentPageRole = computed(() => {
  const routeName = route.name
  return componentData.pageRoleMap[routeName] || componentData.pageRoleMap.deptApproval
})
const isFinance = computed(() => {
  return route.name === 'financeApproval'
})
const filterOptions = computed(() => {
  return [
    {
      prop: 'name',
      label: '搜索',
      // labelPrompt: '可搜索项目名称、项目责任人、实施部门、归口部门、二级单位',
      labelPrompt: '可搜索项目名称、二级单位',
      attrs: {
        placeholder: '请输入搜索'
      }
    },
    /*  {
  tag: 'cascader',
  prop: 'affiliateDeptIdList',
  label: '归口部门',
  attrs: {
    props: { value: 'id', label: 'name', checkStrictly: true, multiple: true },
    filterable: true,
    'collapse-tags': true,
    loading: this.deptId?.impl?.loading,
    options: this.deptId?.impl?.dropdownList || [],
    placeholder: '请选择归口部门'
  }
  }, */
    ...CategorysState.getCategoryFilter(componentData.formFilter, (data) => (componentData.formFilter = data), null, {
      multiple: true,
      'collapse-tags': true
    }),
    {
      tag: 'select',
      prop: 'preArranged',
      label: '预安排',
      attrs: {
        options: [
          {
            value: '0',
            label: '否'
          },
          {
            value: '1',
            label: '是'
          }
        ]
      }
    },
    /* {
  tag: 'select',
  prop: 'reserveStatuses',
  label: '储备状态',
  attrs: {
    multiple: true,
    'collapse-tags': true,
    options: this.reserveStatus
      .map((item) => ({
        value: item.key,
        label: item.value
      }))
      .filter((item) => item.value != this.StatusReserveDict.PENDING_SUBMIT)
  }
  },
  {
  tag: 'select',
  prop: 'status',
  label: '人工复审结论',
  attrs: {
    options: this.ApprovedTypeDict.getList()
      .filter((item) => item.id != this.ApprovedTypeDict.UNSUBMIT)
      .map((item) => ({
        value: item.id,
        label: item.name
      }))
  }
  }, */
    {
      tag: 'select',
      prop: 'aiRiskLevel',
      label: 'AI初评结论',
      attrs: {
        options: componentInstance.AIRiskLevelDict.getList()
          .filter((item) => item.id != componentInstance.AIRiskLevelDict.UNANALYZED)
          .map((item) => ({
            value: item.id,
            label: item.name
          }))
      }
    }
  ]
})
watch(
  () => route.query.aiRiskLevel,
  function () {
    if (!restoreDetailReturnFilter() && applyRouteAiRiskLevelFilter()) {
      refreshTable(true)
    }
  }
)
onMounted(() => {
  getReserveStatus()
  initFormData()
})
onActivated(() => {
  if (!restoreDetailReturnFilter()) {
    applyRouteAiRiskLevelFilter()
  }
  refreshTable(true)
})
defineExpose({
  parseUploadData,
  getPictureList,
  fileListToJson,
  getUploadFileUrl,
  filterEmptyValues,
  getUploadFileUrlByFetch,
  getUploadActionUrl,
  pictureFile,
  getUploadHeaders,
  getDateRangeFilter,
  formatDateByStatsType,
  formatDateTime,
  getStatsTypeShowName,
  getAllowStatsTypeList,
  addCachePage,
  removeCachePage,
  onResume,
  removeTag,
  getCurrentMenuId,
  routerPush,
  singlePageReload,
  oncancel,
  refreshUrlParams,
  savedKey,
  handleCategoryEventChange,
  handleCategoryChange,
  getDefaultCategory,
  yearList,
  getCategorys,
  getFinanceReserveNotice,
  getCwCategoryInvest,
  getCwCategoryInvestItemsList,
  getCategoryFilter,
  categorysKeyValue,
  selectImpl,
  getReserveStatus,
  getType,
  handleApprove,
  handleConfirm,
  initFormData,
  getRouteAiRiskLevel,
  applyRouteAiRiskLevelFilter,
  getRouteAiRiskLevelFilterKey,
  markRouteAiRiskLevelFilterConsumed,
  getReturnFilterStorage,
  takeDetailReturnFilter,
  restoreDetailReturnFilter,
  saveDetailReturnFilter,
  handleSetting,
  handleExport,
  refreshTable,
  onTableSortChange,
  onTableCurrentPageChange,
  onTablePageSizeChange,
  loadTableData,
  loadTableVerify,
  onDetail,
  loadDeptIdDropdownList,
  onDeptIdVisibleChange,
  ...toRefs(componentData),
  currentPageRole,
  isFinance,
  filterOptions
})
</script>
<style lang="less">
.rr-view-ctx:has(.reserveApproval) {
  background-color: rgba(0, 168, 150, 0.08);
}

.rr-view-ctx-card:has(.reserveApproval) {
  background: transparent;
}

.reserveApproval {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.reserveApproval__filter {
  flex-shrink: 0;
}

.reserveApproval .page-table {
  min-width: 0;
  min-height: 0;
}

.reserveApproval .page-table .vxe-table-box {
  min-width: 0;
  min-height: 0;
}

.reserveApproval .page-table .table-card-style .vxe-table--body-wrapper {
  overflow-x: auto !important;
}
</style>
