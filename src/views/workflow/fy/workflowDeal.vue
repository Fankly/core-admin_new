<script setup lang="ts">
import { getDataListByNdWf, getDynamicColumnByNdWf } from '@/api/fy/annually/breakdown/city'
import { getDataListByBm, getDynamicColumnByBm } from '@/api/fy/annually/breakdown/dept'
import { getDynamicColumnByWf as getNdReportCityHeaderData, getDataByWf as getNdReportCityTableData } from '@/api/fy/annually/report/city'
import { getDynamicColumn as getHeaderData, getData as getTableData } from '@/api/fy/breakdown/city'
import { getData, getDynamicColumn } from '@/api/fy/breakdown/dept'
import { getDataListByWf as getRCDataList, getDynamicColumnByWf as getRCDynamicColumn } from '@/api/fy/daily/common'
import { getDynamicColumnByWf as getReportCityHeaderData, getDataByWf as getReportCityTableData } from '@/api/fy/report/city'
import { loadUserWfInfo } from '@/api/workflow'
import {
  finishActivity,
  finishCityActivity,
  rejectActivity,
  rejectCityActivity,
  rejectNdCityActivity,
  rejectRcBmActivity,
  rejectRcCityActivity,
  rejectRcProActivity,
  rejectYapCityActivity,
  submitCityReportActivity,
  submitNdCityReportActivity,
  submitRcBmReportActivity,
  submitRcCityReportActivity,
  submitRcProReportActivity
} from '@/api/workflow/fy'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { formatValue } from '@/utils/utils'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { VxeTablePropTypes } from 'vxe-table'

interface Columns {
  columnKey: string
  columnValue: string
  eidt: boolean
  hidden: boolean
  fixed: boolean
  needSum: string
  visible: boolean
}

interface TableInfo {
  treeConfig: VxeTablePropTypes.TreeConfig
  columns: Columns[]
  tableData: any[]
}

interface Params {
  [key: string]: any
}

onMounted(() => {
  const workItemId = getQueryString('workItemId')
  loadUserWfInfo(workItemId).then((res: any) => {
    if (res.success) {
      let data = res.data
      userInfo.value = data.user
      wfDataString.value = { ...data.wfData }
      workItemIdString.value = workItemId
      wfInstIdString.value = data.wfInstId
      wfCodeString.value = data.wfCode
      searchHandle()
    } else {
      ElMessage({
        type: 'error',
        message: res.msg
      })
    }
  })
})

const tableInfo = reactive<any>({
  tableData: [],
  columns: [],
  treeConfig: {
    lazy: true,
    hasChildField: 'leaf',
    loadMethod({ row }: any) {
      let func: any = {
        ['WF_YAPBMFJ']: getData,
        ['WF_YAPCITYFJ']: getTableData,
        ['WF_YAPCITYSB']: getReportCityTableData,
        ['WF_NDCITYSB']: getNdReportCityTableData,
        ['WF_NDCITYFJ']: getDataListByNdWf,
        ['WF_NDBMFJ']: getDataListByBm,
        ['WF_RCPROTZ']: getRCDataList,
        ['WF_RCCITYTZ']: getRCDataList,
        ['WF_RCBMTZ']: getRCDataList
      }
      let params: any = {
        nd: wfDataString.value.ND,
        parentId: row.id,
        busiType: wfDataString.value.BUSITYPE,
        kmlx: wfDataString.value.KMLX,
        specialorgid: wfDataString.value.DWID
      }
      let flag = wfCodeString.value
      if (flag === 'WF_RCPROTZ' || flag === 'WF_RCCITYTZ' || flag === 'WF_RCBMTZ') {
        params.orgId = wfDataString.value.SPECIALORGID
        params.pageType = wfDataString.value.PAGETYPE
      }
      return new Promise((resolve: any) => {
        func[flag]({
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

const loading = ref(false)
const spyjDialog = ref({
  flag: '',
  showDialog: false
})
const spyjForm = ref({
  spyj: ''
})
const store = useStore()
const specialOrgId = ref<string>('')
const spRoleId = ref<string>('')
const workItemIdString = ref<string>('')
const wfInstIdString = ref<string>('')
const wfCodeString = ref<string>('')

//工作流用户信息
const userInfo = ref({
  id: '',
  spOrgId: '',
  spRoleId: '',
  cropId: ''
})
//工作流全局变量
const wfDataString = ref({
  KMLX: '',
  ND: '',
  DWID: '',
  DWNAME: '',
  BUSITYPE: '',
  PAGETYPE: '',
  SM: '',
  ISZS: '',
  SPECIALORGID: ''
})

const getQueryString = (name: string): string => {
  const allParams = window.location.href.split('?').reduce((acc, part) => {
    const params = new URLSearchParams(part.split('#')[0])
    params.forEach((value, k) => acc.set(k, value))
    return acc
  }, new Map())

  if (window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1]
    new URLSearchParams(hashQuery).forEach((value, k) => allParams.set(k, value))
  }
  return allParams.get(name)
}

// 查询
const searchHandle = async () => {
  await getTableHeader(wfCodeString.value)
  await getDataList(wfCodeString.value)
}

const getTableHeader = async (flag: string) => {
  loading.value = true
  let params: Params = {
    nd: wfDataString.value.ND,
    kmlx: wfDataString.value.KMLX,
    busiType: wfDataString.value.BUSITYPE,
    dwId: wfDataString.value.DWID
  }

  let func: any = {
    ['WF_YAPBMFJ']: getDynamicColumn,
    ['WF_YAPCITYFJ']: getHeaderData,
    ['WF_YAPCITYSB']: getReportCityHeaderData,
    ['WF_NDCITYSB']: getNdReportCityHeaderData,
    ['WF_NDCITYFJ']: getDynamicColumnByNdWf,
    ['WF_NDBMFJ']: getDynamicColumnByBm,
    ['WF_RCPROTZ']: getRCDynamicColumn,
    ['WF_RCCITYTZ']: getRCDynamicColumn,
    ['WF_RCBMTZ']: getRCDynamicColumn
  }
  let res: any
  if (flag === 'WF_YAPCITYSB') {
    res = await func[flag](wfDataString.value.ND)
  } else if (flag === 'WF_NDCITYSB' || flag === 'WF_NDCITYFJ' || flag === 'WF_NDBMFJ') {
    res = await func[flag]({ ...params })
  } else if (flag === 'WF_RCPROTZ' || flag === 'WF_RCCITYTZ' || flag === 'WF_RCBMTZ') {
    params.orgId = wfDataString.value.SPECIALORGID
    params.pageType = wfDataString.value.PAGETYPE
    res = await func[flag]({ ...params })
  } else {
    res = await func[flag](wfDataString.value.BUSITYPE, wfDataString.value.DWID, wfDataString.value.KMLX)
  }
  if (res.success) {
    loading.value = false
    tableInfo.columns = res.data
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const getDataList = async (flag: string) => {
  loading.value = true
  let func: any = {
    ['WF_YAPBMFJ']: getData,
    ['WF_YAPCITYFJ']: getTableData,
    ['WF_YAPCITYSB']: getReportCityTableData,
    ['WF_NDCITYSB']: getNdReportCityTableData,
    ['WF_NDCITYFJ']: getDataListByNdWf,
    ['WF_NDBMFJ']: getDataListByBm,
    ['WF_RCPROTZ']: getRCDataList,
    ['WF_RCCITYTZ']: getRCDataList,
    ['WF_RCBMTZ']: getRCDataList
  }
  let parmas: Params = {
    nd: wfDataString.value.ND,
    parentId: wfDataString.value.ND,
    dwId: wfDataString.value.DWID,
    busiType: wfDataString.value.BUSITYPE,
    kmlx: wfDataString.value.KMLX,
    specialorgid: wfDataString.value.DWID
  }
  if (flag === 'WF_RCPROTZ' || flag === 'WF_RCCITYTZ' || flag === 'WF_RCBMTZ') {
    parmas.orgId = wfDataString.value.SPECIALORGID
    parmas.pageType = wfDataString.value.PAGETYPE
  }
  let res = await func[flag]({ ...parmas })
  if (res.success) {
    loading.value = false
    tableInfo.tableData = res.data
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const submitDecWorkflowHandle = () => {
  loading.value = true
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.spOrgId,
    spRoleId: userInfo.value.spRoleId
  }
  specialOrgId.value = userInfo.value.spOrgId
  spRoleId.value = userInfo.value.spRoleId
  const wfNodeParam: WFParam = {
    IS_PASS: 'Y'
  }

  submitWorkflow(store.getters.getUserMsg.systemCode, wfCodeString.value, workItemIdString.value, wfUserInfo, {}, wfNodeParam, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
  const wfNodeParam: WFParam = {
    IS_PASS: 'Y'
  }
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: specialOrgId.value,
    spRoleId: spRoleId.value,
    spyj: spyjForm.value.spyj,
    spjg: wfNodeParam.IS_PASS,
    wfCode: wfCodeString.value,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    wfNodeData: wfNodeParam,
    nextPersonAndPath: nextPersonAndPath
  }
  let res: any
  if (wfCodeString.value === 'WF_YAPBMFJ' || wfCodeString.value === 'WF_NDBMFJ') {
    res = await finishActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_YAPCITYFJ' || wfCodeString.value === 'WF_NDCITYFJ') {
    res = await finishCityActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_YAPCITYSB') {
    res = await submitCityReportActivity({ ...spfrom })
  } else if (wfCodeString.value === 'WF_NDCITYSB') {
    res = await submitNdCityReportActivity({ ...spfrom })
  } else if (wfCodeString.value === 'WF_RCPROTZ') {
    res = await submitRcProReportActivity({ ...spfrom })
  } else if (wfCodeString.value === 'WF_RCCITYTZ') {
    res = await submitRcCityReportActivity({ ...spfrom })
  } else if (wfCodeString.value === 'WF_RCBMTZ') {
    res = await submitRcBmReportActivity({ ...spfrom })
  }
  if (res.success) {
    loading.value = false
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('提交成功！', '*')
    }
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}
const rejectDecWorkflowHandle = async () => {
  if (!spyjForm.value.spyj) {
    ElMessage.warning('审批意见不能为空!')
    return
  }
  loading.value = true
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    dwId: wfDataString.value.DWID,
    workItemId: workItemIdString.value,
    wfInstId: wfInstIdString.value,
    spyj: spyjForm.value.spyj,
    spjg: 'TH'
  }
  let res: any
  if (wfCodeString.value === 'WF_YAPBMFJ' || wfCodeString.value === 'WF_NDBMFJ') {
    res = await rejectActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_YAPCITYFJ' || wfCodeString.value === 'WF_NDCITYFJ') {
    res = await rejectCityActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_YAPCITYSB') {
    res = await rejectYapCityActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_NDCITYSB') {
    res = await rejectNdCityActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_RCPROTZ') {
    res = await rejectRcProActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_RCCITYTZ') {
    res = await rejectRcCityActivity({
      ...spfrom
    })
  } else if (wfCodeString.value === 'WF_RCBMTZ') {
    res = await rejectRcBmActivity({
      ...spfrom
    })
  }
  if (res && res.success) {
    loading.value = false
    try {
      window.parent.Appframe.closePopWindow(window)
    } catch (e) {
      window.parent.postMessage('驳回成功！', '*')
    }
  } else {
    loading.value = false
    ElMessage.error(res.msg)
  }
}

const isNeedNum = (columns: Columns[], field: string) => {
  let findIndex = columns.findIndex((item: Columns) => item.needSum && item.columnKey === field)
  return findIndex > -1
}

const formatterData = ({ column, cellValue }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  if (tableInfo.columns) {
    const isNum = isNeedNum(tableInfo.columns, column.field)
    if (isNum) {
      return formatValue(cellValue)
    }
  }
  return cellValue
}

const closeHandle = () => {
  spyjForm.value.spyj = ''
  spyjDialog.value.showDialog = false
}

const closeDialogHandle = () => {
  try {
    window.parent.Appframe.closePopWindow(window)
  } catch (e) {
    window.parent.postMessage('close', '*')
  }
}

const isShowDialogHandle = (flag: string) => {
  spyjDialog.value.showDialog = true
  spyjDialog.value.flag = flag
}

const detailHandle = () => {
  spyjDialog.value.flag === '0' ? submitDecWorkflowHandle() : rejectDecWorkflowHandle()
}
</script>

<template>
  <div class="table-container">
    <div class="operation">
      <div class="left">
        <el-button type="primary" size="mini" plain @click="isShowDialogHandle('0')">通 过</el-button>
        <el-button type="primary" size="mini" plain @click="isShowDialogHandle('1')">驳 回</el-button>
        <el-button type="primary" size="mini" plain @click="closeDialogHandle">关 闭</el-button>
      </div>
      <div class="right">
        <span>年度：{{ wfDataString.ND }}</span>
        <span style="margin-left: 30px">单位：{{ wfDataString.DWNAME }}</span>
      </div>
    </div>
    <div class="table">
      <vxe-table
        :row-config="{ height: 32 }"
        show-overflow
        :loading="loading"
        align="center"
        height="100%"
        ref="treeTableRef"
        :border="true"
        :column-config="{ resizable: true }"
        :tree-config="tableInfo.treeConfig"
        :data="tableInfo.tableData"
      >
        <template v-for="item in tableInfo.columns" :key="item.columnKey">
          <vxe-column
            :visible="!item.hidden"
            :formatter="formatterData"
            :fixed="item.fixed ? 'left' : ''"
            :tree-node="item.columnKey === 'name'"
            header-align="center"
            align="left"
            v-if="['name', 'cnx'].includes(item.columnKey)"
            width="340"
            :field="item.columnKey"
            :title="item.columnValue"
          ></vxe-column>
          <vxe-column
            :visible="!item.hidden"
            :formatter="formatterData"
            :fixed="item.fixed ? 'left' : ''"
            v-else-if="item.eidt"
            header-align="center"
            align="right"
            width="160"
            :field="item.columnKey"
            :title="item.columnValue"
          ></vxe-column>
          <vxe-column
            :visible="!item.hidden"
            :formatter="formatterData"
            :fixed="item.fixed ? 'left' : ''"
            v-else
            header-align="center"
            align="right"
            width="160px"
            :field="item.columnKey"
            :title="item.columnValue"
          ></vxe-column>
        </template>
      </vxe-table>
    </div>
  </div>
  <el-dialog
    v-model="spyjDialog.showDialog"
    title="审批意见"
    :destroy-on-close="true"
    :show-close="true"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form :disabled="loading" :model="spyjForm">
      <el-form-item label="审批意见：">
        <el-input maxlength="128" v-model="spyjForm.spyj" type="textarea" :rows="6" resize="none" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div style="text-align: center">
        <el-button :loading="loading" @click="detailHandle" type="primary" plain size="mini">确 定</el-button>
        <el-button :loading="loading" @click="closeHandle" type="primary" plain size="mini">关 闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.table-container {
  box-sizing: border-box;
  height: calc(100vh - 8px);
  outline: 1px solid red;

  .table {
    height: calc(100% - 30px);
  }

  .operation {
    padding-bottom: 10px;
    display: flex;
    align-items: center;
    background-color: #fff;

    .left,
    .right {
      width: 50%;
    }

    .right {
      text-align: right;
    }
  }
}
</style>
