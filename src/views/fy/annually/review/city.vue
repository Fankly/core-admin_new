<template>
  <div v-show="userMsg.isShowPage" class="container">
    <fy-header
      @change-xsws="changeXswsHandle"
      @change-nd="changeNdHandle"
      ref="headerRef"
      :dw-name="userMsg.dwName"
      :tool-button="['dw', 'nd', 'xsws']"
    />
    <el-tabs type="border-card" v-model="tabMsg.name" @tab-click="isDisabledBtn">
      <el-tab-pane label="其他运营费用-主业" name="1">
        <div class="operation" v-if="userMsg.isShowPage">
          <div class="operation-left">
            <el-button type="primary" plain :disabled="isDisabled" @click="reviewHandle" v-permission="'AUDIT'">审 核 </el-button>
            <el-button type="primary" plain :disabled="isSbDisabled" @click="releaseHandle" v-permission="'REPORT'"> 审定上报 </el-button>
            <el-button type="primary" plain :disabled="isDisabled" @click="exportTableDataHandle('zy')" v-permission="'EXPORT'">导 出 </el-button>
            <el-button :disabled="isWfId" type="primary" plain @click="openTodoTaskDesc" v-permission="'VIEWWORKFLOW'"> 查看流转过程 </el-button>
          </div>
          <div class="operation-right">
            <span>当前状态：{{ userInfo?.statusInfo }}</span>
            <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table
            :row-config="tableMsg.rowConfig"
            show-overflow
            :loading="userMsg.loading"
            align="center"
            :header-cell-style="headerCellStyle"
            @header-cell-click="(tables: any) => headerCellClickHandle(tables)"
            @cell-click="(tables: any) => cellClickHandle(tables, '1')"
            :cell-style="cellStyle"
            height="100%"
            ref="treeTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :tree-config="tableMsg.zyTreeConfig"
            :data="tableMsg.tableData"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="item.visible"
                :fixed="item.fixed ? 'left' : ''"
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterData"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                width="180"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="item.visible"
                width="120"
                :fixed="item.fixed ? 'left' : ''"
                :formatter="formatterData"
                header-align="center"
                align="right"
                v-else
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
      <el-tab-pane label="其他运营费用-农电" name="2" v-if="isHidenTab">
        <div class="operation" v-if="userMsg.isShowPage">
          <div class="operation-left">
            <el-button type="primary" plain :disabled="isDisabled" @click="reviewHandle" v-permission="'AUDIT'">审 核 </el-button>
            <el-button type="primary" plain :disabled="isSbDisabled" @click="releaseHandle" v-permission="'REPORT'"> 审定上报 </el-button>
            <el-button type="primary" plain :disabled="isDisabled" @click="exportTableDataHandle('nd')" v-permission="'EXPORT'">导 出 </el-button>
            <el-button :disabled="isWfId" type="primary" plain @click="openTodoTaskDesc" v-permission="'VIEWWORKFLOW'"> 查看流转过程 </el-button>
          </div>
          <div class="operation-right">
            <span>当前状态：{{ userInfo?.statusInfo }}</span>
            <vxe-toolbar ref="toolbarTwoRef" custom class-name="toolbar"></vxe-toolbar>
          </div>
        </div>
        <div class="standrand-table">
          <vxe-table
            :row-config="tableMsg.rowConfig"
            show-overflow
            :loading="userMsg.loading"
            @cell-click="(tables: any) => cellClickHandle(tables, '2')"
            :cell-style="cellStyle"
            height="100%"
            ref="treeNdTableRef"
            :border="true"
            :column-config="{ resizable: true }"
            :tree-config="tableMsg.ndTreeConfig"
            :data="tableMsg.ndData"
          >
            <template v-for="item in tableMsg.columns" :key="item.columnKey">
              <vxe-column
                :visible="item.visible"
                :fixed="item.fixed ? 'left' : ''"
                :tree-node="item.columnKey === 'name'"
                :formatter="formatterData"
                header-align="center"
                align="left"
                v-if="['name', 'cnx'].includes(item.columnKey)"
                width="180"
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
              <vxe-column
                :visible="item.visible"
                width="120"
                :fixed="item.fixed ? 'left' : ''"
                :formatter="formatterData"
                header-align="center"
                align="right"
                v-else
                :field="item.columnKey"
                :title="item.columnValue"
              ></vxe-column>
            </template>
          </vxe-table>
        </div>
      </el-tab-pane>
    </el-tabs>
    <reviewLayout
      :xsws="tableMsg.xsws"
      busi-type="ND"
      ref="reviewLayoutRef"
      :row-config="{ isCurrent: true, height: 32 }"
      @close-dialog="closeDialog"
      :request-api="getTableList"
      :columns="reviewColumns"
      title="年度单位审核-单位状态"
      :nd="tableMsg.nd"
      :kmlx="userMsg.flag"
      :specialorgid="userMsg.specialorgid"
      :is-show-modal="reviewMsg.isShowModal"
    >
      <template #button>
        <el-button type="primary" plain @click="sdDataHandle('edit')" :disabled="isDiabledSd">审 定</el-button>
        <el-button type="primary" plain @click="sdDataHandle('view')">查看审定值</el-button>
        <el-button type="primary" plain @click="closeDialog">关闭</el-button>
      </template>
    </reviewLayout>
    <dwbzView
      :xsws="tableMsg.xsws"
      busi-type="ND"
      width="94%"
      height="800"
      :operation-flag="dwMsg.operationFlag"
      ref="dwbzViewRef"
      :save-api="saveByDwHandle"
      :sd-api="authorize"
      :title="dwMsg.title"
      :header-api="getCityDynamicColumnByDw"
      :table-api="getDataByDw"
      flag="CityReView"
      :kmlx="userMsg.flag"
      @update-table="updateTableData"
      :specialorgid="userMsg.specialorgid"
      :dw-id="dwMsg.dwId"
      :nd="tableMsg.nd"
      @close-dialog="(val: boolean) => closeModalHandle(val, 'dw')"
      :is-show-modal="dwMsg.isShowModal"
      :toolButton="dwMsg.toolButton"
      :busi-id="dwMsg.busiId"
      :showHeader="dwMsg.showHeader"
      :export-api="exportForDw"
      :templateApi="importTemplate"
      :importDataApi="importData"
    ></dwbzView>
    <yskmView
      :xsws="tableMsg.xsws"
      busi-type="ND"
      width="70%"
      height="800"
      :title="kmMsg.title"
      :header-api="getCityDynamicColumnByKm"
      :table-api="getDataByKm"
      flag="CityReView"
      :kmlx="userMsg.flag"
      @update-table="getTableData"
      :specialorgid="userMsg.specialorgid"
      :km-id="kmMsg.kmId"
      :nd="tableMsg.nd"
      @close-dialog="(val: boolean) => closeModalHandle(val, 'km')"
      :is-show-modal="kmMsg.isShowModal"
      :export-api="exportForKm"
    ></yskmView>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: '/fy/annually/review/city'
}
</script>

<script setup lang="ts">
import FyHeader from '@/views/fy/components/Header.vue'
import userDialog from '@/components/select/userDialog.vue'
import dwbzView from '@/views/fy/components/dwbzView.vue'
import reviewLayout from '@/views/fy/components/reviewLayout.vue'
import yskmView from '@/views/fy/components/yskmView.vue'
import type { TableMsg } from '@/views/fy/prearranged/interface'

import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  importData,
  importTemplate,
  exportForDw,
  exportForKm,
  authorize,
  getCityDataList,
  getCityDynamicColumn,
  getCityDynamicColumnByKm,
  getDataByKm,
  getDataByDw,
  getCityDynamicColumnByDw,
  getDwStatus,
  saveByDw,
  approvedAndIsssued,
  getCurrentPageData,
  exportData
} from '@/api/fy/annually/review/city'
import { VxeColumnProps } from 'vxe-table'
import { findPrevNode, formatValue } from '@/utils/utils'
import { containsNd } from '@/api/fy/common'
import { getWfTracking } from '@/api/workflow'

export type ToolButton = ('save' | 'import' | 'export' | 'download' | 'sd' | 'close')[] | boolean

const userDialogRef = ref()
const treeTableRef = ref()
const treeNdTableRef = ref()
const reviewLayoutRef = ref()
const dwbzViewRef = ref()
const headerRef = ref()
const toolbarOneRef = ref()
const toolbarTwoRef = ref()

const isCity = ref(true)
const isHidenTab = ref(false)

const isDisabled = computed(() => userMsg.loading)

const isWfId = computed(() => userInfo.value && !userInfo.value.wfId)

const isSbDisabled = computed(() => {
  return userInfo.value.status !== '11' || userMsg.loading
})

const isDiabledSd = computed(() => !(reviewLayoutRef.value.curChangeData?.row, reviewLayoutRef.value.curChangeData?.row.sbStatusbm === '1'))

const userMsg = reactive<any>({
  userData: null,
  specialorgid: '',
  dwName: '',
  isShowPage: false,
  loading: false,
  flag: '1'
})

const userInfo = ref<any>({
  statusInfo: '',
  status: ''
})

const reviewMsg = reactive({
  isShowModal: false
})

const dwMsg = reactive<{
  isShowModal: boolean
  dwId: string
  title: string
  toolButton: ToolButton
  showHeader: boolean
  operationFlag: string
  busiId: string
}>({
  isShowModal: false,
  dwId: '',
  title: '年度审定 - 单位查看',
  toolButton: ['export', 'download'],
  showHeader: false,
  operationFlag: '',
  busiId: ''
})

const tabMsg = reactive({
  name: '1',
  isDisabled: true
})

const kmMsg = reactive<{
  isShowModal: boolean
  kmId: any
  title: string
}>({
  isShowModal: false,
  kmId: [],
  title: '年度审定 - 科目查看'
})

const tableMsg = reactive<TableMsg>({
  rowConfig: {
    height: 32
  },
  nd: '',
  xsws: '',
  tableData: [],
  ndData: [],
  columns: [],
  ndColumns: [],
  zyTreeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      let params = {
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        specialorgid: userMsg.specialorgid,
        kmlx: '1',
        parentId: row.id,
        busiType: 'ND'
      }
      return new Promise((resolve: any) => {
        getCityDataList({
          ...params
        }).then((res: any) => {
          if (res.success) {
            resolve(res.data)
          } else {
            ElMessage.error(res.msg)
            resolve([])
          }
        })
      })
    }
  },
  ndTreeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      let params = {
        nd: tableMsg.nd,
        xsws: tableMsg.xsws,
        specialorgid: userMsg.specialorgid,
        kmlx: '2',
        parentId: row.id,
        busiType: 'ND'
      }
      return new Promise((resolve: any) => {
        getCityDataList({
          ...params
        }).then((res: any) => {
          if (res.success) {
            resolve(res.data)
          } else {
            ElMessage.error(res.msg)
            resolve([])
          }
        })
      })
    }
  }
})

const openTodoTaskDesc = () => {
  if (userInfo.value.wfId.wfId) {
    const winWidth = screen.width
    const winHeight = screen.height
    const width = 1200
    const height = 800
    let pageWidth = (winWidth - width) / 2
    let pageTop = (winHeight - height) / 2
    getWfTracking(userInfo.value.wfId.wfId).then((res: any) => {
      if (res.success) {
        window.open(res.data, '_blank', `width=${width},height=${height},top=${pageTop},left=${pageWidth}`)
      } else {
        ElMessage.error(res.msg)
      }
    })
  }
}

const getUserInfo = async () => {
  let res = await getCurrentPageData('ND', userMsg.flag, tableMsg.nd, userMsg.specialorgid)
  if (res.success) {
    isCity.value = true
    userInfo.value = { ...res.data }
  } else {
    isCity.value = false
    ElMessage.error(res.msg)
  }
}

const closeDialog = () => {
  reviewMsg.isShowModal = false
  getUserInfo()
}

const updateTableData = (val: string) => {
  reviewLayoutRef.value.getTableList()
  getUserInfo()
  getTableData()
  if (val === 'sd') closeModalHandle(false, 'dw')
}

const saveByDwHandle = (params: any) => {
  const records: any[] = dwbzViewRef.value.element.getUpdateRecords()
  const updateRecords = records.filter((item) => !item.leaf && item.id)
  let mxList = updateRecords.map((item) => {
    return {
      sdje: item.yapSdValue,
      yskmId: item.id,
      detailId: item.detailId ? item.detailId : ''
    }
  })
  params.mxList = mxList
  return saveByDw(params)
}

const linkTable = () => {
  const $table = Number(userMsg.flag) === 1 ? treeTableRef.value : treeNdTableRef.value
  const $toolBar = Number(userMsg.flag) === 1 ? toolbarOneRef.value : toolbarTwoRef.value
  if ($table && $toolBar) {
    $table.connect($toolBar)
  }
}

const getTableList = (params: any) => {
  return getDwStatus(params)
}

const isDisabledBtn = ({ props }: any) => {
  userMsg.flag = props.name
  getTableData()
  getUserInfo()
  linkTable()
}

// 关闭modal
const closeModalHandle = (val: boolean, flag: string) => {
  flag === 'dw' ? (dwMsg.isShowModal = val) : (kmMsg.isShowModal = val)
  dwMsg.dwId = ''
  kmMsg.kmId.length = 0
}

// 审核
const reviewHandle = () => {
  reviewMsg.isShowModal = true
}

// 审定
const sdDataHandle = (flag: string) => {
  let record = reviewLayoutRef.value.element.getCurrentRecord()
  if (!record) {
    ElMessage.warning('请选择一条数据进行操作！')
    return
  }
  dwMsg.isShowModal = true
  dwMsg.dwId = record.sbdwbm
  dwMsg.busiId = record.dwdetailId
  dwMsg.title = flag === 'edit' ? '年度审定 - 单位审定' : '年度审定 - 单位查看'
  dwMsg.toolButton = flag === 'edit' ? ['save', 'import', 'export', 'sd', 'download', 'close'] : ['download', 'close', 'export']
  dwMsg.operationFlag = flag
}

// 下达
const releaseHandle = async () => {
  ElMessageBox.confirm('确定是否审定上报？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    let params = {
      busiType: 'ND',
      kmlx: userMsg.flag,
      nd: tableMsg.nd,
      ejdw: userMsg.specialorgid
    }
    let res = await approvedAndIsssued(params)
    if (res.success) {
      ElMessage.success('审定上报成功！')
    } else {
      ElMessage.error(res.msg)
    }
  })
}

// 导出
const exportTableDataHandle = (flag: string) => {
  userMsg.loading = true
  exportData({
    busiType: 'ND',
    kmlx: userMsg.flag,
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    specialorgid: userMsg.specialorgid,
    parentId: '-1'
  }).then((res: any) => {
    const blob = res
    let dom = document.createElement('a')
    let url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    let filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
    dom.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
    userMsg.loading = false
  })
}

const cellClickHandle = async ({ row, columnIndex, column }: any, flag: string) => {
  if (!row.leaf && columnIndex === 0) {
    kmMsg.isShowModal = true
    const tableData = Number(userMsg.flag) === 1 ? tableMsg.tableData : tableMsg.ndData
    kmMsg.kmId = findPrevNode(tableData, row)
    userMsg.flag = flag
  }
}

// 判断表头是否可以点击
const isClickHeader = (columns: any[], field: string) => {
  let columnsData = columns.filter((item) => item.eidt)
  let column = columnsData.find((item) => item.columnKey === field)
  dwMsg.busiId = column?.dwDetailId as string
  if (column) return true
  return false
}

// 表头点击
const headerCellClickHandle = ({ column }: any) => {
  const isColumn = isClickHeader(tableMsg.columns as any[], column.field)
  if (isColumn) {
    dwMsg.isShowModal = true
    dwMsg.dwId = column.field
    dwMsg.operationFlag = 'view'
    dwMsg.title = '年度审定 - 单位查看'
    dwMsg.toolButton = ['download', 'close', 'export']
  }
}

const headerCellStyle = ({ column }: any) => {
  const isColumn = isClickHeader(tableMsg.columns as any[], column.field)
  if (isColumn) {
    return {
      cursor: 'pointer',
      color: 'rgb(0, 112, 107)',
      padding: '8px 0',
      lineHeight: '16px'
    }
  }
  return {
    cursor: 'auto',
    color: '#303133',
    padding: '8px 0',
    lineHeight: '16px'
  }
}

const cellStyle = ({ row, columnIndex }: any) => {
  if (row.id && !row.leaf && columnIndex === 0) {
    return {
      cursor: 'pointer',
      backgroundColor: 'rgba(232, 234, 236,0.5)',
      color: 'rgb(0, 112, 107)'
    }
  }
  return {
    cursor: 'auto',
    backgroundColor: 'rgba(232, 234, 236,0.5)',
    color: 'rgb(96, 98, 102)'
  }
}

const formatterData = ({ column, cellValue }: any) => {
  if (column.field === 'cnx' || column.field === 'name') {
    return cellValue
  }
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue, Number(tableMsg.xsws))
}

// 是否隐藏tab
const isHideTab = async (dwId: string) => {
  let res = await containsNd(dwId)
  if (res.success) {
    isHidenTab.value = res.data
  }
}

const getRoleHandle = async () => {
  userMsg.userData = { ...userDialogRef.value.userMsg }
  userMsg.dwName = userDialogRef.value.userMsg.org_name
  userMsg.specialorgid = userMsg.userData.org_id
  isHideTab(userMsg.userData.org_id)
  const isQuery = userDialogRef.value.isQuery
  tableMsg.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString()
  tableMsg.xsws = headerRef.value.formParams.xsws || '2'
  await getUserInfo()
  if (isQuery && isCity.value) {
    userMsg.isShowPage = true
    await getTableData()
    linkTable()
  }
}

const getTableData = async () => {
  clearTableData()
  userMsg.loading = true
  let params = {
    nd: tableMsg.nd,
    xsws: tableMsg.xsws,
    specialorgid: userMsg.specialorgid,
    kmlx: userMsg.flag,
    parentId: '-1',
    busiType: 'ND'
  }
  let res = await Promise.all([getCityDynamicColumn(params), getCityDataList(params)])
  if (res[0].success && res[1].success) {
    tableMsg.columns = res[0].data.filter((item: any) => item.visible)
    Number(userMsg.flag) === 1 ? (tableMsg.tableData = res[1].data) : (tableMsg.ndData = res[1].data)
    // compTableWidth();
  } else {
    ElMessage.error('请刷新页面进行重试！')
  }
  userMsg.loading = false
}

const initData = async () => {
  // 调用角色modal
  userDialogRef.value.getUser()
}

const changeNdHandle = (val: string) => {
  tableMsg.nd = val
  getTableData()
  getUserInfo()
}

const changeXswsHandle = (val: string) => {
  tableMsg.xsws = val
  getTableData()
  getUserInfo()
}

const clearTableData = () => {
  if (tableMsg.columns) tableMsg.columns.length = 0
  if (tableMsg.tableData) tableMsg.tableData.length = 0
  if (tableMsg.ndData) tableMsg.ndData.length = 0
}

const reviewColumns = reactive<VxeColumnProps[]>([
  {
    type: 'seq',
    title: '序号',
    width: 60
  },
  {
    field: 'sbdwmc',
    title: '上报单位'
  },
  {
    field: 'sbStatus',
    title: '上报状态',
    width: 120
  },
  {
    field: 'sdStatus',
    title: '审核状态',
    width: 120
  }
])

onMounted(initData)
</script>

<style scoped lang="less">
.container {
  height: 100%;
  position: relative;

  .el-tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      padding: 10px;
      height: calc(100% - 39px);
    }

    .el-tab-pane {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .operation {
      display: flex;
      margin-bottom: 10px;
      align-items: center;

      &-left,
      &-right {
        width: 50%;
      }

      &-right {
        text-align: right;
      }
    }

    .standrand-table {
      flex: 1;
      min-width: 0;
      min-height: 0;
    }
  }
}

.operation-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .toolbar {
    margin-left: 10px;
  }
}
</style>
