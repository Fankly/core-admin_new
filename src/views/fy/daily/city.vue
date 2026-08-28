<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="pageLoading">
    <FyHeader @change-xsws="changeXswsHandle" @changeNd="changeNdHandle" ref="headerRef" :dwName="initParams.dwName" />
    <el-tabs type="border-card" v-model="tabInfo.kmlx" @tab-click="tabClickHandle">
      <el-tab-pane label="其他运营费用-主业" name="1"> </el-tab-pane>
      <el-tab-pane label="其他运营费用-农电" name="2" v-if="isHidenTab"> </el-tab-pane>
      <div class="operation" v-if="pageInfo.isShowPage">
        <div class="operation-left">
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
        :loading="loading"
        flag="CITY"
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
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <DetailView :tzType="'2'" :ystzInfo="ystzInfo" :initParams="initParams" :yskmName="yskmName" :bzdw="initParams.dwName" ref="detailViewRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/daily/city'
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
  exportData,
  exportDataForDw,
  exportDataForKm,
  saveByKm,
  getRecords,
  getDynamicColumn,
  getDataByDw,
  getDynamicColumnByDw,
  getDataByKm,
  getDynamicColumnByKm,
  xd
} from '@/api/fy/daily/city'
import { ElMessage } from 'element-plus'
import { YstzInfo, TableInfo, Columns, SaveData } from './components/interface/ystz'
import { Decimal } from 'decimal.js'
import { findPrevNode, formatValue, isNullOrUndefined } from '@/utils/utils'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import baseService from '@/service/baseService'
import { useStore } from 'vuex'
import { startRcCityReportWf } from '@/api/workflow/fy'
import { containsNd } from '@/api/fy/common'
import { getWfTracking } from '@/api/workflow'

const userDialogRef = ref()
const headerRef = ref()
const ystzRef = ref()
const tableRef = ref()
const tzsmRef = ref()
const detailViewRef = ref()
const toolbarOneRef = ref()

const store = useStore()

const isWfId = computed(() => rcActiveInfo.value && !rcActiveInfo.value.wfId)

const loading = ref(false)
const tabInfo = reactive({
  kmlx: '1'
})

const tzsmInfo = reactive({
  isShow: false
})

const pageInfo = reactive({
  isShowPage: false,
  isProvince: true
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
const isHidenTab = ref(false)

const userInfo = ref()

const isRelease = computed(
  () => (rcActiveInfo.value && (rcActiveInfo.value.status !== '1' || rcActiveInfo.value.auditStatus === '2')) || tableInfo.loading
)

const isDwtz = computed(() => (rcActiveInfo.value && !rcActiveInfo.value.ndYsSd) || tableInfo.loading)

const isKmtz = computed(() => (rcActiveInfo.value && !rcActiveInfo.value.ndYsSd) || tableInfo.loading)

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

const ystzInfo = reactive<YstzInfo>({
  operation: '',
  title: '',
  isCity: true,
  flag: '',
  nd: '',
  xsws: '',
  kmlx: '',
  dwId: '',
  width: '70%',
  busiType: 'RQ',
  requestApi: getDataByDw,
  dynamicColumnApi: getDynamicColumnByDw,
  yskmPath: []
})

const rcActiveInfo = ref()

// 是否隐藏tab
const isHideTab = async (dwId: string) => {
  let res = await containsNd(dwId)
  if (res.success) {
    isHidenTab.value = res.data
  }
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  initParams.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString()
  initParams.xsws = headerRef.value.formParams.xsws || '2'
  ystzInfo.xsws = initParams.xsws
  initParams.kmlx = tabInfo.kmlx
  initParams.dwId = userInfo.value.org_id
  await initRcActiveInfo()
  isHideTab(userInfo.value.org_id)
  if (isQuery && pageInfo.isProvince) {
    pageInfo.isShowPage = true
    await initTableData()
    await linkTable()
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
  ystzInfo.yskm = ''
  yskmName.value = ''
}

const isClickHeader = (columns: any[], field: string) => {
  let columnIndex = columns.findIndex((item: any) => item.eidt && item.columnKey === field)
  return columnIndex > -1
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

const headerCellStyle = () => {
  return {
    padding: '8px 0',
    lineHeight: '16px'
  }
}

const releaseHandle = async (val: string) => {
  // 判断是否走工作流
  let paramFLag = '1' //0走工作流  1不走工作流
  let isWorkFlowRes = await baseService.get('/workflow/declare/getParamValue?paramKey=RC_CITY_TZ_WORKFLOW')
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
    PAGETYPE: '2',
    SM: val
  }
  let res = null
  paramFLag = isWorkFlowRes.data
  switch (paramFLag) {
    case '0':
      submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_RCCITYTZ', '', wfUserInfo, wfParam, {}, submitWFCallback)
      break
    case '1':
      res = await xd({
        kmlx: initParams.kmlx,
        nd: initParams.nd,
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
    wfCode: 'WF_RCCITYTZ',
    wfData: obj,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await startRcCityReportWf({
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

// 导出
const exportHandle = () => {
  tableInfo.loading = true
  exportData({
    busiType: 'RC',
    parentId: initParams.nd,
    dwId: initParams.dwId,
    kmlx: initParams.kmlx,
    nd: initParams.nd,
    xsws: initParams.xsws
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

const linkTable = async () => {
  const $table = tableRef.value
  const $toolBar = toolbarOneRef.value
  if ($table && $toolBar) {
    await $table.connect($toolBar)
  }
}

// 调整明细
const tzDetailViewHandle = () => {
  if (!ystzInfo.yskm) {
    ElMessage.warning('请选择具有承诺项的数据!')
    return
  }
  detailViewRef.value.showModal = true
}

const exportDataHandle = async (params: SaveData) => {
  loading.value = true
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
  loading.value = false
}

const updateValueHandle = (params: SaveData) => {
  saveData(params)
}

const saveData = async (params: SaveData) => {
  let newParams: any = { ...params }
  const $table = ystzRef.value.table
  const tableInfo = ystzRef.value.tableInfo
  const records = $table.getUpdateRecords()
  if (records.length === 0) {
    ElMessage.warning('没有修改的数据！')
    return
  }
  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    loading.value = true
    let resultData: any = []
    let res = null
    if (params.flag === 'dw') {
      // 判断是否是平衡调整
      if (tableInfo.tableData) {
        const sumTableRecords = tableInfo.tableData.filter((item: any) => item.id && item.leaf && !item.cnx)
        let sumValue = new Decimal('0')
        sumTableRecords.forEach((item: any) => {
          let value = item.bcxd ? new Decimal(item.bcxd) : '0'
          sumValue = sumValue.add(value)
        })
        if (sumValue.comparedTo(new Decimal('0')) !== 0) {
          newParams.isBalance = '0'
        } else {
          newParams.isBalance = '1'
        }
      }
      // 判断是否是直属单位,如果是直属单位必须是
      // if (rcActiveInfo.value.iszs === "1" && newParams.isBalance !== "1") {
      //   ElMessage.warning("本次分解值合计不为0!");
      //   loading.value = false;
      //   return;
      // }
      // 系数为0或1的时候，不可以进行平衡调整
      const updateRecords = $table.getUpdateRecords().filter((item: any) => item.id && !item.leaf)
      const columns = ystzRef.value.tableInfo.columns
      const checkValue: any[] = []
      for (let i = 0; i < updateRecords.length; i++) {
        const rowData = updateRecords[i]
        const bcxdValue = rowData['bcxd'] ? new Decimal(rowData['bcxd']) : new Decimal('0')
        const dfjValue = rowData['dfj'] ? new Decimal(rowData['dfj']) : new Decimal('0')
        let columnKeys = columns?.filter((item: Columns) => item.eidt)
        // 判断是否平衡调整,如果不是平衡调整做校验
        if (newParams.isBalance === '1' && new Decimal(rowData['bcxd']).comparedTo(new Decimal('0')) !== 0) {
          for (let index = 0; index < columnKeys.length; index++) {
            const item = columnKeys[index]
            const colValue = new Decimal(rowData[item.columnKey])
            if (rowData['rcxs'] === '0') {
              if (!isNullOrUndefined(rowData[item.columnKey]) && colValue.comparedTo(new Decimal('0')) === 0) {
                ElMessage.warning(rowData['name'] + '：容差系数为0时,不能进行调增或者调减!')
                loading.value = false
                return
              }
            } else if (rowData['rcxs'] === '1') {
              if (!isNullOrUndefined(rowData[item.columnKey]) && colValue.comparedTo(new Decimal('0')) === 1) {
                ElMessage.warning(rowData['name'] + '：容差系数为1或者为空时,只能进行调减!')
                loading.value = false
                return
              }
            }
          }
        } else {
          // 校验可用值
          if (dfjValue.comparedTo(bcxdValue) === -1) {
            checkValue.push(rowData['name'])
          }
        }
        let list: any = {
          yskmId: '',
          dwValue: {}
        }

        columnKeys?.forEach((item: Columns) => {
          if (list.yskmId !== rowData.id) {
            list.yskmId = rowData.id
          }
          if (!isNullOrUndefined(rowData[item.columnKey])) {
            list.dwValue[item.columnKey] = rowData[item.columnKey]
          }
        })
        resultData.push(list)
      }
      if (checkValue.length !== 0) {
        const warnValue = checkValue.join(',')
        if (warnValue) ElMessage.error(warnValue + '：本次下达合计(万元)超过待分解(万元),请进行修改！')
        loading.value = false
        return
      }
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
      initTableData()
      initRcActiveInfo()
      ElMessage.success('保存成功')
      loading.value = false
      ystzRef.value.closeHandle()
    } else {
      loading.value = false
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
