<template>
  <div class="reserveApproval pageStyle">
    <table-box
      id="tableBox"
      class="page-table"
      type="card"
      height="100%"
      :data="tableImpl.dataList"
      :size="defaultFormItemSize"
      :loading="tableImpl.loading"
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
      <vxe-column title="是否预安排" :min-width="120" field="preArranged">
        <template v-slot="scope">
          <span>{{ scope.row.preArranged != null ? (scope.row.preArranged == '1' ? '是' : '否') : '' }}</span>
        </template>
      </vxe-column>
      <vxe-column title="储备年份" :min-width="120" field="year" />
      <vxe-column title="储备批次" :min-width="120" field="batchName" />
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
      </template>
    </table-box>

    <!-- 详情弹窗 -->
    <vxe-modal
      v-model="detailModalVisible"
      :title="`项目详情`"
      width="95vw"
      height="95vh"
      :mask-closable="false"
      :esc-closable="true"
      resize
      show-zoom
      fullscreen
      transfer
      destroy-on-close
      @close="handleDetailModalClose"
    >
      <ReserveApprovalDetail
        v-if="detailModalVisible && currentApproveId"
        :id="currentApproveId"
        :listKey="encodedListKey"
        :approvalRole="currentPageRole.detailPath"
        :embedded="true"
        @close="handleDetailModalClose"
      />
    </vxe-modal>
  </div>
</template>
<script setup>
import { DropdownWidget, TableWidget } from '@/utils/widget.js'
import '@/core/mixins'
import { CwProjectApprove, CwProjectApply, CwProject } from '@/api/mainController'
import DictionaryController from '@/api/Controller/DictionaryController'
import { treeDataTranslate } from '@/utils/index'
import '../mixin/categorysMixin.js'
import exportDialog from '../reserveApproval/exportDialog.vue'
import similarSetting from '../components/similarSetting.vue'
import ReserveApprovalDetail from './index.vue'
import { useUpload, useStatsDateRange, useCachedPage, useCachedSinglePage, useCategorys } from '@/core/composables/useWorkspace'
import { ElMessageBox, ElMessage } from 'element-plus'
import { proxyRefs, toRef, reactive, toRefs, computed, onMounted, onActivated, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
defineOptions({
  name: '/finance/reserveApprovalDetailTest/list'
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
  },
  // 详情弹窗相关
  detailModalVisible: false,
  currentApproveId: null,
  encodedListKey: ''
})
const tableImpl = toRef(componentData, 'tableImpl')
const formFilter = toRef(componentData, 'formFilter')
const formFilterCopy = toRef(componentData, 'formFilterCopy')
const listKey = toRef(componentData, 'listKey')
const reserveStatus = toRef(componentData, 'reserveStatus')
const amount = toRef(componentData, 'amount')
const deptId = toRef(componentData, 'deptId')
const pageRoleMap = toRef(componentData, 'pageRoleMap')
const detailModalVisible = toRef(componentData, 'detailModalVisible')
const currentApproveId = toRef(componentData, 'currentApproveId')
const encodedListKey = toRef(componentData, 'encodedListKey')
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
  componentData.formFilterCopy = {}
  refreshTable(bool)
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
// 修改为打开弹窗而不是跳转
function onDetail(approveId) {
  const jsonStr = JSON.stringify(componentData.listKey)
  componentData.encodedListKey = encodeURIComponent(jsonStr)
  componentData.currentApproveId = approveId
  componentData.detailModalVisible = true
}
// 关闭详情弹窗
function handleDetailModalClose() {
  componentData.detailModalVisible = false
  componentData.currentApproveId = null
  componentData.encodedListKey = ''
  // 刷新列表
  refreshTable(false)
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
onMounted(() => {
  getReserveStatus()
  initFormData()
})
onActivated(() => {
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
  handleSetting,
  handleExport,
  refreshTable,
  onTableSortChange,
  onTableCurrentPageChange,
  onTablePageSizeChange,
  loadTableData,
  loadTableVerify,
  onDetail,
  handleDetailModalClose,
  loadDeptIdDropdownList,
  onDeptIdVisibleChange,
  ...toRefs(componentData),
  currentPageRole,
  isFinance
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
