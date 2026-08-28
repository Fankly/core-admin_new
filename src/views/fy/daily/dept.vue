<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="pageLoading">
    <FyHeader @change-xsws="changeXswsHandle" @changeNd="changeNdHandle" ref="headerRef" :dwName="initParams.dwName" />
    <el-tabs type="border-card" v-model="tabInfo.kmlx" @tab-click="tabClickHandle">
      <template v-if="isOverYear">
        <el-tab-pane v-for="item in tabPages" :label="item.name" :name="item.code" :key="item.code"></el-tab-pane>
      </template>
      <template v-else>
        <el-tab-pane label="其他运营费用-主业" name="1"></el-tab-pane>
        <el-tab-pane label="其他运营费用-农电" name="2" v-if="isHidenTab"></el-tab-pane>
      </template>

      <div class="operation" v-if="pageInfo.isShowPage">
        <div class="operation-left">
          <el-button type="primary" :disabled="isDeptTz" size="mini" plain v-permission="'DWTZ'" @click="ystzHandle('bm')">按部门调整 </el-button>
          <el-button type="primary" :disabled="isKmTz" size="mini" plain v-permission="'KMTZ'" @click="ystzHandle('km')">按科目调整 </el-button>
          <el-button type="primary" :disabled="isRelease" size="mini" plain v-permission="'TZXD'" @click="tzReleaseHandle">调整下达 </el-button>
          <el-button type="primary" size="mini" plain v-permission="'EXPORT'" @click="exportHandle">导 出 </el-button>
          <el-button type="primary" size="mini" plain v-permission="'VIEW'" @click="tzDetailViewHandle">调整明细查看 </el-button>
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
                <input v-number-input="initParams.xsws" class="my-input" v-model="row[item.columnKey]" maxlength="20" />
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
        flag="DEPT"
        :xsws="initParams.xsws"
        @exportData="exportDataHandle"
        @updateValue="updateValueHandle"
        :title="ystzInfo.title"
        height="800"
        :ystzInfo="ystzInfo"
        :width="ystzInfo.width"
        ref="ystzRef"
      >
      </ystz>
      <tzsm ref="tzsmRef" @release="releaseHandle" @closeModal="closeModalHandle" :isShow="tzsmInfo.isShow"></tzsm>
    </el-tabs>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <DetailView :tzType="'3'" :ystzInfo="ystzInfo" :initParams="initParams" :yskmName="yskmName" :bzdw="initParams.dwName" ref="detailViewRef" />
</template>

<script lang="ts">
export default {
  name: '/fy/daily/dept'
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
import {
  getRcActiveInfo,
  saveByBm,
  saveByKm,
  exportData,
  exportDataForBm,
  exportDataForKm,
  getDataList,
  getDynamicColumn,
  getDataListByBm,
  getDynamicColumnByBm,
  getDataListByKm,
  getDynamicColumnByKm,
  xd
} from '@/api/fy/daily/dept'
import { ElMessage } from 'element-plus'
import { YstzInfo, Columns, SaveData } from './components/interface/ystz'
import { findPrevNode, formatValue, isNullOrUndefined } from '@/utils/utils'
import { useStore } from 'vuex'
import baseService from '@/service/baseService'
import { submitWorkflow, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { startRcBmReportWf } from '@/api/workflow/fy'
import { containsNd, getKmlxTabByDwId } from '@/api/fy/common'
import { getWfTracking } from '@/api/workflow'

const userDialogRef = ref()
const headerRef = ref()
const ystzRef = ref()
const tableRef = ref()
const tzsmRef = ref()
const detailViewRef = ref()
const toolbarOneRef = ref()

const isOverYear = computed(() => Number(initParams.nd) > 2025)

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
const isHidenTab = ref(false)

const isWfId = computed(() => rcActiveInfo.value && !rcActiveInfo.value.wfId)

const userInfo = ref()

const isRelease = computed(
  () => (rcActiveInfo.value && (rcActiveInfo.value.status !== '1' || rcActiveInfo.value.auditStatus === '2')) || tableInfo.loading
)

const isDeptTz = computed(() => (rcActiveInfo.value && !rcActiveInfo.value.ndYsSd) || tableInfo.loading)

const isKmTz = computed(() => (rcActiveInfo.value && !rcActiveInfo.value.ndYsSd) || tableInfo.loading)

const activeCellMethod = ({ row }: any) => {
  return row.id && !row.leaf
}

const tableInfo = reactive<any>({
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
        getDataList(params).then((res: any) => {
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
  isCity: false,
  title: '',
  flag: '',
  nd: '',
  xsws: '',
  kmlx: '',
  dwId: '',
  busiType: 'RQ',
  width: '70%',
  requestApi: getDataListByBm,
  dynamicColumnApi: getDynamicColumnByBm,
  yskmPath: []
})

const rcActiveInfo = ref()

const tabPages = ref<
  {
    code: string
    name: string
  }[]
>([])

// 是否隐藏tab
const isHideTab = async (dwId: string) => {
  let res = await containsNd(dwId)
  if (res.success) {
    isHidenTab.value = res.data
  }
}

const getKmlxTabByDwIdData = async (dwId: string) => {
  let res = await getKmlxTabByDwId(dwId)
  if (res.success) {
    tabPages.value = res.data
    tabInfo.kmlx = res.data[0]['code'] || '1'
  }
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  userInfo.value = { ...userDialogRef.value.userMsg }
  await getKmlxTabByDwIdData(userInfo.value.org_id)
  initParams.nd = headerRef.value.formParams.nd || new Date().getFullYear().toString()
  initParams.xsws = headerRef.value.formParams.xsws || '2'
  initParams.kmlx = tabInfo.kmlx
  initParams.dwId = userInfo.value.org_id
  await initRcActiveInfo()
  await isHideTab(userInfo.value.org_id)
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

const initTableData = async () => {
  tableInfo.loading = true
  let params = {
    parentId: initParams.nd,
    dwId: initParams.dwId,
    kmlx: initParams.kmlx,
    nd: initParams.nd,
    xsws: initParams.xsws
  }
  let tableRes = await getDataList(params)
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

const currentChangeHandle: VxeTableEvents.CurrentChange = ({ newValue }) => {
  ystzInfo.yskm = null
  if (newValue.id && !newValue.leaf && newValue.cnx) {
    ystzInfo.yskm = newValue
    yskmName.value = newValue.name
  }
}

const linkTable = async () => {
  const $table = tableRef.value
  const $toolBar = toolbarOneRef.value
  if ($table && $toolBar) {
    await $table.connect($toolBar)
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

const changeNdHandle = (val: string) => {
  if (Number(val) > 2025) {
    //   改变科目类型
    let mix = '1'
    if (tabPages.value.length !== 0) {
      mix = tabPages.value[0].code
    }
    initParams.kmlx = mix
    tabInfo.kmlx = mix
  } else {
    initParams.kmlx = '1'
    tabInfo.kmlx = '1'
  }
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
  let isWorkFlowRes = await baseService.get('/workflow/declare/getParamValue?paramKey=RC_DEPT_TZ_WORKFLOW')
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
    PAGETYPE: '3',
    SM: val
  }
  let res = null
  paramFLag = isWorkFlowRes.data
  switch (paramFLag) {
    case '0':
      submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_RCBMTZ', '', wfUserInfo, wfParam, {}, submitWFCallback)
      break
    case '1':
      res = await xd({
        id: rcActiveInfo.value.id,
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

const headerCellStyle = () => {
  return {
    padding: '8px 0',
    lineHeight: '16px'
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
    wfCode: 'WF_RCBMTZ',
    wfData: obj,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await startRcBmReportWf({
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
  const isView = (rcActiveInfo.value.editType === '0' && flag === 'km') || (rcActiveInfo.value.editType === '1' && flag === 'bm')
  ystzInfo.operation = rcActiveInfo.value.auditStatus === '2' || isView ? 'view' : 'edit'
  ystzInfo.flag = flag
  ystzInfo.nd = initParams.nd
  ystzInfo.kmlx = initParams.kmlx
  ystzInfo.dwId = initParams.dwId
  ystzRef.value.isShowModal = true
}

const isDwOrYskmInfo = (flag: string) => {
  if (flag === 'bm') {
    ystzInfo.title = '部门调整'
    ystzInfo.requestApi = getDataListByBm
    ystzInfo.dynamicColumnApi = getDynamicColumnByBm
    ystzInfo.width = '70%'
  } else {
    ystzInfo.title = '科目调整'
    ystzInfo.requestApi = getDataListByKm
    ystzInfo.dynamicColumnApi = getDynamicColumnByKm
    // 获取科目id
    ystzInfo.yskmPath = findPrevNode(tableInfo.tableData, ystzInfo.yskm)
    ystzInfo.width = '34%'
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

// 调整明细
const tzDetailViewHandle = () => {
  if (!ystzInfo.yskm) {
    ElMessage.warning('请选择具有承诺项的数据!')
    return
  }
  detailViewRef.value.showModal = true
}

const exportDataHandle = async (params: SaveData) => {
  let res
  if (params.flag === 'km') {
    res = await exportDataForKm(params)
  } else {
    res = await exportDataForBm(params)
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

const saveData = async (params: SaveData) => {
  let newParams: any = {
    dwId: params.specialorgid,
    kmlx: params.kmlx,
    nd: params.nd,
    id: rcActiveInfo.value.id ? rcActiveInfo.value.id : ''
  }
  const $table = ystzRef.value.table
  const records = $table.getUpdateRecords()
  if (records.length === 0) {
    ElMessage.warning('未进行修改操作,请修改后再进行保存！')
    return false
  }
  const type = await VXETable.modal.confirm('是否确定保存？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    let resultData: any[] = []
    let res: any
    if (params.flag === 'bm') {
      const updateRecords = $table.getUpdateRecords().filter((item: any) => item.id && !item.leaf)
      const columns = ystzRef.value.tableInfo.columns
      let columnKeys = columns?.filter((item: any) => item.eidt)
      updateRecords.forEach((rowData: any) => {
        let res = columnKeys?.map((item: any) => {
          if (!isNullOrUndefined(rowData[item.columnKey])) {
            return {
              yskmId: rowData.id,
              detailId: rowData['_' + item.columnKey] ? rowData['_' + item.columnKey] : '',
              dwId: item.columnKey,
              je: rowData[item.columnKey] ? rowData[item.columnKey] : '0'
            }
          }
          return ''
        })
        resultData.push(res)
      })
      newParams.mxList = resultData.flat().filter(Boolean)
      res = await saveByBm(newParams)
    } else {
      const updateRecords = $table.getUpdateRecords().filter((item: any) => item.cbzx)
      newParams.mxList = updateRecords.map((item: any) => {
        return {
          dwId: item.cbzx,
          je: item.je ? item.je : 0,
          yskmId: params.yskmId,
          detailId: item.detailId ? item.detailId : ''
        }
      })
      res = await saveByKm(newParams)
    }
    if (res.success) {
      ystzRef.value.getDataList()
      // 初始化初始用户状态
      initRcActiveInfo()
      // 重新获取表格数据
      initTableData()
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
