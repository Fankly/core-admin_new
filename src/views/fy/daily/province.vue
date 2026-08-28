<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="pageLoading">
    <FyHeader @change-xsws="changeXswsHandle" @changeNd="changeNdHandle" ref="headerRef" :dwName="initParams.dwName" />
    <el-tabs type="border-card" v-model="tabInfo.kmlx" @tab-click="tabClickHandle">
      <el-tab-pane label="其他运营费用-主业" name="1"> </el-tab-pane>
      <el-tab-pane label="其他运营费用-农电" name="2"> </el-tab-pane>
      <div class="operation" v-if="pageInfo.isShowPage">
        <div class="operation-left">
          <el-button type="primary" :disabled="isDisabled" size="mini" plain v-permission="'SAVE'" @click="saveHandle">保存国网目标值</el-button>
          <el-button type="primary" :disabled="isDwtz" size="mini" plain v-permission="'DWTZ'" @click="ystzHandle('dw')">按单位调整</el-button>
          <el-button type="primary" :disabled="isKmtz" size="mini" plain v-permission="'KMTZ'" @click="ystzHandle('km')">按科目调整</el-button>
          <el-button type="primary" :disabled="isRelease" size="mini" plain v-permission="'TZXD'" @click="tzReleaseHandle">调整下达</el-button>
          <el-button type="primary" size="mini" plain v-permission="'EXPORT'" @click="exportHandle">导 出</el-button>
          <el-button type="primary" size="mini" plain v-permission="'VIEW'" @click="tzDetailViewHandle">调整明细查看</el-button>
          <el-button :disabled="isWfId" type="primary" plain @click="openTodoTaskDesc" v-permission="'VIEWWORKFLOW'"> 查看流转过程 </el-button>
        </div>
        <div class="operation-right">
          <template v-if="!!initParams.statusInfo">
            <span>当前状态：{{ initParams.statusInfo }}</span>
            <vxe-toolbar ref="toolbarOneRef" custom class-name="toolbar"></vxe-toolbar>
          </template>
        </div>
      </div>
      <div class="table">
        <vxe-table
          :header-cell-style="headerCellStyle"
          :row-config="tableInfo.rowConfig"
          :cell-style="cellStyle"
          highlight-current-row
          @current-change="currentChangeHandle"
          ref="tableRef"
          :show-overflow="true"
          :data="tableInfo.tableData"
          border
          :column-config="{ resizable: true }"
          keep-source
          :tree-config="tableInfo.treeConfig"
          :edit-config="tableInfo.editConfig"
          header-align="center"
          height="100%"
          :loading="tableInfo.loading"
        >
          <template v-for="item in tableInfo.columns" :key="item.columnKey">
            <vxe-column
              header-align="center"
              :align="item.needSum ? 'right' : 'left'"
              :formatter="({ column, cellValue }:any) => formatterData(item, column, cellValue)"
              v-if="item.eidt"
              :field="item.columnKey"
              :title="item.columnValue"
              :edit-render="{ name: 'input', autofocus: '.my-input', autoselect: true }"
            >
              <template #edit="{ row }">
                <input
                  v-number-input="initParams.xsws"
                  class="my-input"
                  @change="sumhandle(row, item.columnKey)"
                  v-model="row[item.columnKey]"
                  maxlength="20"
                />
              </template>
            </vxe-column>
            <vxe-column
              :tree-node="item.columnKey === 'name'"
              header-align="center"
              :align="item.needSum ? 'right' : 'left'"
              :formatter="({ column, cellValue }:any) => formatterData(item, column, cellValue)"
              v-else
              :field="item.columnKey"
              :title="item.columnValue"
            ></vxe-column>
          </template>
        </vxe-table>
      </div>
      <ystz
        flag="PROVINCE"
        :xsws="initParams.xsws"
        @exportData="exportDataHandle"
        @updateValue="updateValueHandle"
        :title="ystzInfo.title"
        :ystzInfo="ystzInfo"
        height="800"
        :width="ystzInfo.width"
        ref="ystzRef"
      >
      </ystz>
      <tzsm ref="tzsmRef" @release="releaseHandle" @closeModal="closeModalHandle" :isShow="tzsmInfo.isShow"></tzsm>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <DetailView :tzType="'1'" :ystzInfo="ystzInfo" :initParams="initParams" :yskmName="yskmName" :bzdw="initParams.dwName" ref="detailViewRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/daily/province'
}
</script>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import FyHeader from '@/views/fy/components/Header.vue'
import ystz from '@/views/fy/daily/components/ystz.vue'
import tzsm from '@/views/fy/daily/components/tzsm.vue'
import DetailView from '@/views/fy/daily/components/DetailView.vue'
import { VXETable, VxeTableEvents } from 'vxe-table'
import { getGroupSummary } from '@/utils/prearranged'
import {
  getRcActiveInfo,
  saveByDw,
  saveByKm,
  getRecords,
  getDynamicColumn,
  saveGwmbz,
  getDataByDw,
  getDynamicColumnByDw,
  getDataByKm,
  getDynamicColumnByKm,
  xd,
  exportData,
  exportDataForKm,
  exportDataForDw
} from '@/api/fy/daily/province'
import { ElMessage } from 'element-plus'
import { YstzInfo, TableInfo, Columns, SaveData } from './components/interface/ystz'
import { Decimal } from 'decimal.js'
import { findPrevNode, formatValue, isNullOrUndefined } from '@/utils/utils'
import baseService from '@/service/baseService'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import { startRcProReportWf } from '@/api/workflow/fy'
import { getWfTracking } from '@/api/workflow'

const userDialogRef = ref()
const headerRef = ref()
const ystzRef = ref()
const tableRef = ref()
const tzsmRef = ref()
const detailViewRef = ref()
const toolbarOneRef = ref()

const store = useStore()

const tabInfo = reactive({
  kmlx: '1'
})

const pageInfo = reactive({
  isShowPage: false,
  isProvince: true
})

const tzsmInfo = reactive({
  isShow: false
})

const initParams = reactive({
  busiType: 'RQ',
  kmlx: '',
  nd: '',
  xsws: '',
  specialorgid: '',
  dwId: '',
  dwName: '',
  statusInfo: ''
})

const yskmName = ref('')

const pageLoading = ref(false)

const userInfo = ref()

const isDisabled = computed(() => (rcActiveInfo.value && !rcActiveInfo.value.ndYsSd) || tableInfo.loading)

const isRelease = computed(
  () => (rcActiveInfo.value && (rcActiveInfo.value.status !== '1' || rcActiveInfo.value.auditStatus === '2')) || tableInfo.loading
)

const isDwtz = computed(() => (rcActiveInfo.value && !rcActiveInfo.value.ndYsSd) || tableInfo.loading)

const isKmtz = computed(() => (rcActiveInfo.value && !rcActiveInfo.value.ndYsSd) || tableInfo.loading)

const isWfId = computed(() => rcActiveInfo.value && !rcActiveInfo.value.wfId)

const activeCellMethod = ({ row }: any) => {
  return row.id && !row.leaf
}

const tableInfo: TableInfo = reactive({
  rowConfig: {
    height: 32
  },
  columns: [],
  tableData: [],
  loading: false,
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    enabled: true,
    beforeEditMethod: activeCellMethod
  },
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      let params = {
        nd: initParams.nd,
        xsws: initParams.xsws,
        dwId: initParams.dwId,
        kmlx: initParams.kmlx,
        parentId: row.id
      }
      return new Promise((resolve: any) => {
        getRecords(params).then((res: any) => {
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

const headerCellStyle = () => {
  return {
    padding: '8px 0',
    lineHeight: '16px'
  }
}

const linkTable = async () => {
  const $table = tableRef.value
  const $toolBar = toolbarOneRef.value
  if ($table && $toolBar) {
    await $table.connect($toolBar)
  }
}

const ystzInfo = reactive<YstzInfo>({
  isCity: false,
  title: '',
  flag: '',
  nd: '',
  xsws: '',
  kmlx: '',
  dwId: '',
  width: '70%',
  busiType: 'RQ',
  requestApi: getDataByDw,
  dynamicColumnApi: getDynamicColumnByDw,
  yskmPath: [],
  operation: 'edit'
})

const rcActiveInfo = ref()

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  initParams.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString()
  initParams.xsws = headerRef.value.formParams.xsws || '2'
  ystzInfo.xsws = initParams.xsws
  initParams.kmlx = tabInfo.kmlx
  initParams.dwId = userInfo.value.org_id
  await initRcActiveInfo()
  if (isQuery && pageInfo.isProvince) {
    pageInfo.isShowPage = true
    await initTableData()
    await linkTable()
  }
}

const isClickHeader = (columns: any, field: string) => {
  let column = columns.findIndex((item: any) => item.eidt && item.columnKey === field)
  return column > -1
}

const cellStyle = ({ row, column }: any) => {
  if (tableInfo.editConfig && !tableInfo.editConfig.enabled) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
  if (!isClickHeader(tableInfo.columns, column.field)) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }

  if (!row.id || row.leaf) {
    return {
      cursor: 'auto',
      backgroundColor: 'rgba(232, 234, 236,0.5)'
    }
  }
}

const formatterData = (item: Columns, column: any, cellValue: any) => {
  if (!item.needSum) return cellValue
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue, Number(initParams.xsws))
}

const sumhandle = (row: any, key: string) => {
  row[key] = row[key] ? new Decimal(row[key]).toFixed(Number(initParams.xsws)) : new Decimal(0).toFixed(Number(initParams.xsws))
  getGroupSummary(tableInfo.tableData, tableInfo.treeConfig as any, key, Number(initParams.xsws), 'leaf', 'id')
}

const initTableData = async () => {
  tableInfo.loading = true
  let params = {
    parentId: '-1',
    dwId: initParams.dwId,
    kmlx: initParams.kmlx,
    nd: initParams.nd,
    xsws: initParams.xsws
  }
  let tableRes = await getRecords(params)
  let headerRes = await getDynamicColumn(params)
  if (tableRes.success && headerRes.success) {
    tableInfo.columns = headerRes.data.filter((item: Columns) => !item.hidden)
    tableInfo.tableData = tableRes.data
  } else {
    ElMessage.error('请重新再试!')
  }
  tableInfo.loading = false
}

const tabClickHandle = () => {
  initParams.kmlx = tabInfo.kmlx
  // 初始化初始用户状态
  initRcActiveInfo()
  // 重新获取表格数据
  initTableData()
  // 清空选择
  ystzInfo.yskm = ''
  yskmName.value = ''
}

const currentChangeHandle: VxeTableEvents.CurrentChange = ({ newValue }) => {
  ystzInfo.yskm = null
  if (newValue.id && !newValue.leaf && newValue.cnx) {
    ystzInfo.yskm = newValue
    yskmName.value = newValue.name
  }
}

const changeNdHandle = (val: string) => {
  initParams.nd = val
  // 初始化初始用户状态
  initRcActiveInfo()
  // 重新获取表格数据
  initTableData()
  if (ystzInfo.yskm) ystzInfo.yskm = null
  tableRef.value.clearCurrentRow()
}

const changeXswsHandle = (val: string) => {
  initParams.xsws = val
  // 初始化初始用户状态
  initRcActiveInfo()
  // 重新获取表格数据
  initTableData()
  if (ystzInfo.yskm) ystzInfo.yskm = null
  tableRef.value.clearCurrentRow()
}

const tzReleaseHandle = () => {
  tzsmInfo.isShow = true
}

const releaseHandle = async (val: string) => {
  // 判断是否走工作流
  let paramFLag = '1' //0走工作流  1不走工作流
  let isWorkFlowRes = await baseService.get('/workflow/declare/getParamValue?paramKey=RC_PRO_TZ_WORKFLOW')
  let wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.org_id,
    spRoleId: userInfo.value.id
  }
  let wfParam: WFParam = {
    KMLX: initParams.kmlx,
    ND: initParams.nd,
    DWID: userInfo.value.org_id,
    BUSITYPE: 'RC',
    DWNAME: initParams.dwName,
    ISZS: rcActiveInfo.value.iszs,
    SPECIALORGID: initParams.dwId,
    PAGETYPE: '1',
    SM: val
  }
  let res = null
  paramFLag = isWorkFlowRes.data
  switch (paramFLag) {
    case '0':
      submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_RCPROTZ', '', wfUserInfo, wfParam, {}, submitWFCallback)
      break
    case '1':
      res = await xd({
        kmlx: initParams.kmlx,
        nd: initParams.nd,
        xsws: initParams.xsws,
        sm: val,
        specialorgid: initParams.dwId
      })
      if (res.success) {
        ElMessage.success('下达成功！')
        closeModalHandle(false)
        initTableData()
        initRcActiveInfo()
      } else {
        ElMessage.error('请重新再试！')
      }
      break
  }
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: any) => {
  const list: any[] = JSON.parse(wfData).WorkFlowDataList.WorkFlowData
  let obj: any = {}
  list.forEach((item) => {
    obj[item.DataCode] = item.DataValue
  })
  tableInfo.loading = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.org_id,
    spRoleId: userInfo.value.id,
    wfCode: 'WF_RCPROTZ',
    wfData: obj,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await startRcProReportWf({
    ...spfrom
  })
  if (res.success) {
    tableInfo.loading = false
    ElMessage.success('提交成功')
    closeModalHandle(false)
    await initRcActiveInfo()
    await initTableData()
  } else {
    tableInfo.loading = false
    ElMessage.error(res.msg)
  }
}

const closeModalHandle = (val: boolean) => {
  tzsmRef.value.clearValue()
  tzsmInfo.isShow = val
  if (ystzInfo.yskm) ystzInfo.yskm = null
  tableRef.value.clearCurrentRow()
}

const ystzHandle = (flag: string) => {
  if ('km' === flag && !ystzInfo.yskm) {
    ElMessage.warning('请选择具有承诺项的数据!')
    return
  }
  isDwOrYskmInfo(flag)
  ystzInfo.flag = flag
  const isView = (rcActiveInfo.value.editType === '0' && flag === 'km') || (rcActiveInfo.value.editType === '1' && flag === 'dw')
  ystzInfo.operation = rcActiveInfo.value.auditStatus === '2' || isView ? 'view' : 'edit'
  ystzInfo.nd = initParams.nd
  ystzInfo.kmlx = initParams.kmlx
  ystzInfo.dwId = initParams.dwId
  ystzRef.value.isShowModal = true
}

const isDwOrYskmInfo = (flag: string) => {
  if (flag === 'dw') {
    ystzInfo.title = '单位调整'
    ystzInfo.requestApi = getDataByDw
    ystzInfo.dynamicColumnApi = getDynamicColumnByDw
    ystzInfo.width = '70%'
  } else {
    ystzInfo.title = '科目调整'
    ystzInfo.requestApi = getDataByKm
    ystzInfo.dynamicColumnApi = getDynamicColumnByKm
    ystzInfo.width = '40%'
    // 获取科目id
    ystzInfo.yskmPath = findPrevNode(tableInfo.tableData, ystzInfo.yskm)
  }
}

const saveHandle = async () => {
  const $table = tableRef.value.getUpdateRecords()
  if ($table.length === 0) {
    ElMessage.warning('未进行修改操作,请修改后再进行保存！')
    return
  }
  const updateRecords = $table.filter((item: any) => !item.leaf && item.id)
  const params = updateRecords.map((item: any) => {
    return {
      id: item.id,
      gwmbz: item.gwmbz
    }
  })
  const type = await VXETable.modal.confirm('确定保存修改的年度预算目标值吗？', '提示', {
    status: 'warning'
  })
  if ('confirm' === type) {
    let res = await saveGwmbz(params)
    if (res.success) {
      ElMessage.success('保存成功！')
      initTableData()
    } else {
      ElMessage.error(res.msg)
    }
  }
}

// 导出
const exportHandle = () => {
  tableInfo.loading = true
  exportData({
    busiType: 'RC',
    parentId: initParams.nd,
    dwId: initParams.dwId,
    kmlx: initParams.kmlx,
    xsws: initParams.xsws,
    nd: initParams.nd
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
    tableInfo.loading = false
  })
}

// 调整明细
const tzDetailViewHandle = () => {
  if (!ystzInfo.yskm) {
    ElMessage.warning('请选择具有承诺项的数据!')
    return
  }
  detailViewRef.value.showModal = true
}

const openTodoTaskDesc = () => {
  if (rcActiveInfo.value.wfId) {
    const winWidth = screen.width
    const winHeight = screen.height
    const width = 1200
    const height = 800
    let pageWidth = (winWidth - width) / 2
    let pageTop = (winHeight - height) / 2
    getWfTracking(rcActiveInfo.value.wfId).then((res: any) => {
      if (res.success) {
        window.open(res.data, '_blank', `width=${width},height=${height},top=${pageTop},left=${pageWidth}`)
      } else {
        ElMessage.error(res.msg)
      }
    })
  }
}

const updateValueHandle = (params: SaveData) => {
  saveData(params)
}

const exportDataHandle = async (params: SaveData) => {
  let res
  if (params.flag === 'km') {
    res = await exportDataForKm(params)
  } else {
    res = await exportDataForDw(params)
  }
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
  tableInfo.loading = false
  ystzRef.value.disabled = false
}

const saveData = async (params: SaveData) => {
  let newParams: any = { ...params }
  const $table = ystzRef.value.table
  const records = $table.getUpdateRecords()
  if (records.length === 0) {
    ElMessage.warning('未进行修改操作,请修改后再进行保存！')
    return
  }
  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    let resultData: any = []
    let res: any
    if (params.flag === 'dw') {
      const updateRecords = $table.getUpdateRecords().filter((item: any) => item.id && !item.leaf)
      const columns = ystzRef.value.tableInfo.columns
      updateRecords.forEach((rowData: any) => {
        let list: any = {
          yskmId: '',
          dwValue: {}
        }
        let columnKeys = columns?.filter((item: Columns) => item.eidt)
        columnKeys?.forEach((item: Columns) => {
          if (list.yskmId !== rowData.id) {
            list.yskmId = rowData.id
          }
          if (!isNullOrUndefined(rowData[item.columnKey])) {
            list.dwValue[item.columnKey] = rowData[item.columnKey]
          }
        })
        resultData.push(list)
      })
      newParams.mxLists = resultData
      res = await saveByDw(newParams)
    } else {
      const editValues = records.filter((item: any) => item.dwId)
      newParams.mxLists = editValues.map((item: any) => {
        return {
          dwId: item.dwId,
          value: item.bcxd
        }
      })
      newParams.yskmId = params.yskmId
      res = await saveByKm(newParams)
    }
    if (res.success) {
      ystzRef.value.getDataList()
      // 初始化初始用户状态
      initRcActiveInfo()
      // 重新获取表格数据
      initTableData()
      ystzInfo.yskm = null
      ElMessage.success('保存成功')
      ystzRef.value.disabled = false
      ystzRef.value.closeHandle()
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const initData = async () => {
  userDialogRef.value.getUser()
}

const initRcActiveInfo = async () => {
  let res = await getRcActiveInfo(initParams.dwId, initParams.kmlx, initParams.nd, initParams.xsws)
  if (res.success) {
    initParams.dwId = res.data.dwId
    initParams.dwName = res.data.dwName
    initParams.statusInfo = res.data.statusInfo
    rcActiveInfo.value = { ...res.data }
    tableInfo.editConfig.enabled = rcActiveInfo.value.ndYsSd
  } else {
    pageInfo.isProvince = false
    ElMessage.error(res.msg)
  }
}

onMounted(() => {
  initData()
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  position: relative;

  .el-tabs {
    height: 100%;
    flex-direction: column;
    display: flex;
    :deep(.el-tabs__content) {
      flex: 1;
      min-height: 0;
      padding: 10px;
      display: flex;
      flex-direction: column;

      .operation {
        width: 100%;
        display: flex;
        margin-bottom: 10px;
        align-items: center;

        &-left,
        &-right {
          width: 50%;
        }

        &-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }
        .toolbar {
          margin-left: 10px;
        }
      }

      .table {
        flex: 1;
        min-height: 0;
      }
    }
  }
}
</style>
