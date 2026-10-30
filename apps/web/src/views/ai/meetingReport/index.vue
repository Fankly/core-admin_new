<!-- 联合会审评审报告管理 -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <proTable
      :data-callback="dataList"
      ref="proTableRef"
      @search="searchHandle"
      @reset="resetHandle"
      :row-style="rowStyle"
      :cell-style="columnStyle"
      @cell-click="downloadReport"
      @row-click="handerClickTable"
      :request-api="pageMeeting"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="viewTable"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-dropdown placement="bottom" style="margin: 0 10px">
          <el-button size="small" v-permission="'XMXXGL'" plain type="primary">项目信息管理<i class="el-icon-arrow-down el-icon--right" /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-permission="'CKXMMX'" @click="handleViewXm(scope.selectedList)">查看项目明细</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown placement="bottom" style="margin: 0 10px">
          <el-button size="small" v-permission="'PSBGGL'" plain type="primary">评审报告管理<i class="el-icon-arrow-down el-icon--right" /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-permission="'SCBG'" @click="handleReportXm(scope.selectedList)">生成报告</el-dropdown-item>
              <el-dropdown-item v-permission="'CZBG'" @click="handleResetReportXm(scope.selectedList)">重置报告</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown placement="bottom" style="margin: 0 10px">
          <el-button size="small" v-permission="'LCSP'" plain type="primary">流程审批<i class="el-icon-arrow-down el-icon--right" /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-permission="'TJSP'" @click="handleConfirm(scope.selectedList)">提交审批</el-dropdown-item>
              <el-dropdown-item v-permission="'LCLL'" @click="handleProcess(scope.selectedList)">流程履历</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </proTable>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <xmTable ref="xmTableRef" />
  <component
    @closeDialog="closeDialogMsg"
    :isShowDialog="processData.isShowDialog"
    :meetingId="processData.meetingId"
    :is="processData.compName"
  ></component>
</template>
<script setup lang="ts">
defineOptions({ name: "/ai/meetingReport/index" })
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { downloadReviewReport } from '@/api/service/jointReview'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from '@/store/business'
import { useUser } from '@/hooks/useUser'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { apiExportHandle } from '@/utils/export'
import xmTable from './components/xmTable.vue'
import {
  generateReviewReportForCityLhhs,
  pageMeetingInfoForCityLhhs,
  submitWf,
  resetReviewReportForCityLhhs,
  getHasFzJys
} from '@/api/ai/reviewWorkBench'
import { getYjdwList } from '@/api/ai/smartTaskAudit'
import { getSgbm } from '@/api/service/requirement'
import { useMeeting } from '@/hooks/useMeeting'
import { VXETable } from 'vxe-table'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import baseService from '@/service/baseService'

// 初始化页面
const loading = ref(false) //接口调用加载中。。。
const isShowPage = ref(false) //未选择角色前不展示页面
const router = useRouter()
const specialOrgId = ref<string>('') //用户id
const store = useStore() //状态管理-联合会审用户信息
const tableRef = ref<any>()
const userDialogRef = ref() // 用户角色
const route = useRoute()
const userInfo = ref()
const proTableRef = ref()
const xmTableRef = ref()
const yjdwList = ref<any[]>([]) // 一级单位列表
const gkbmList = ref<any[]>([]) // 市归口部门列表
const processData = reactive({
  isShowDialog: false,
  compName: null,
  meetingId: ''
})
const wfParam = ref<WFParam>({
  XMIDS: '',
  FQZZ: '',
  FQBM: ''
})
// 重置
const resetHandle = () => {
  gkbmList.value.length = 0
  proTableRef.value?.clearSelection()
}
// 搜索
const searchHandle = (val: any) => {
  proTableRef.value?.clearSelection()
}
// 一级单位变更时联动加载市归口部门
const selectChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  params.zgkbmId = ''
  gkbmList.value.length = 0
  const param = {
    YJDW: val,
    bmId: userInfo.value?.deptId || '',
    dwId: userInfo.value?.dwId || '',
    parentCode: val
  }
  let gkbm: any = await getSgbm({ ...param })
  if (gkbm.success && gkbm.data.length !== 0) {
    gkbmList.value.push(...gkbm.data)
  }
}
// 初始化下拉选项
const initParamLists = async () => {
  yjdwList.value.length = 0
  let res: any = await getYjdwList({ bmId: userInfo.value?.deptId || '', dwId: userInfo.value?.dwId || '' })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }
}
// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  if (column.label == '评审意见报告') {
    return 'color:#00706b;cursor: pointer;'
  }
}
// 行颜色
const rowStyle = ({ row }: any) => {
  if (row.sfkqps == '1') {
    return 'backgroundColor:#E0F2F1'
  }
}
// 列表查询
const pageMeeting = (params: any) => {
  if (params.startTimeBegin) {
    let startTimeBegin: any = params.startTimeBegin
    params.startTimeBegin = startTimeBegin[0]
    params.startTimeEnd = startTimeBegin[1]
  }
  params.userId = store.getters.getUserMsg.id
  params.username = store.getters.getUserMsg.name
  params.bmId = userInfo.value?.deptId || ''
  params.dwId = userInfo.value?.dwId || ''
  params.roleCode = userInfo.value?.roleCode || ''
  params.roleId = userInfo.value?.roleId || ''
  return pageMeetingInfoForCityLhhs(params)
}
// 选中行
const handerClickTable = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
const dataList = (val: any) => {
  val.records.forEach((element: any) => {
    element.meetingStatusName = element.meetingStatus == '01' ? '评审中' : element.meetingStatus == '02' ? '已结束' : '未发布'
  })
  return val
}
// 下载附件
const downloadReport = async (row: any, column: any) => {
  if (column.label == '评审意见报告') {
    try {
      const uuid: any = row.reportUuid
      const fileName: any = `${row.meetingName}-${row.reportName}`
      const params: any = {
        uuid: uuid,
        fileName: fileName
      }
      if (!uuid) return ElMessage.warning('报告未维护，请勿重复点击！')
      apiExportHandle(params, fileName, downloadReviewReport)
    } catch (e: any) {
      console.error(e.toString())
    }
  }
}
// 查看项目信息
const handleViewXm = (selectedList: any[]) => {
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据')
  const selectedData = selectedList[0]
  const param = {
    meetingId: selectedData.meetingId,
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.specialorgid || '',
    spRoleId: userInfo.value.id || ''
  }
  xmTableRef.value.initParamLists({ ...param })
}

// 生成评审报告
const handleReportXm = async (selectedList: any[]) => {
  if (selectedList.length == 0) return ElMessage.warning('请选择数据！')
  const meetingInfoList: any[] = selectedList.map(({ meetingId, meetingName }: any) => ({ meetingId, meetingName }))
  const report: any = await generateReviewReportForCityLhhs({ meetingInfoList: meetingInfoList })
  if (!report.success) return ElMessage.error(report.msg)
  ElMessage({ type: 'success', message: `生成报告成功` })
  proTableRef.value?.clearSelection()
  proTableRef.value.getTableList()
}
// 重置评审报告
const handleResetReportXm = async (selectedList: any[]) => {
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据')
  try {
    const type = await VXETable.modal.confirm('重置后无法恢复，请确认', '提示', {
      status: 'warning'
    })
    if (type != 'confirm') return ElMessage.info('已取消')
    const selectedData = selectedList[0]
    const res: any = await resetReviewReportForCityLhhs({ meetingId: selectedData.meetingId })
    if (!res.success) return ElMessage.error(res.msg)
    ElMessage.success('重置报告成功')
    proTableRef.value?.clearSelection()
    proTableRef.value.getTableList()
  } catch (e: any) {
    if (e !== 'cancel' && e?.toString) ElMessage.info('已取消')
  }
}
//提交审批
const handleConfirm = async (selectedList: any[]) => {
  if (selectedList.length != 1) return ElMessage.warning('请选择一条数据！')
  const type = await VXETable.modal.confirm(`确认提交？`, '提示', {
    status: 'warning'
  })
  if (type != 'confirm') return ElMessage.info('已取消')
  const selectedData = selectedList[0]
  submitCbxqshWorkflowHandle(selectedData.meetingId)
}
// 流程履历
const handleProcess = (selectedList: any[]) => {
  useMeeting(selectedList, processData)
}
const closeDialogMsg = () => {
  processData.isShowDialog = false
}
// 提交工作流
const submitCbxqshWorkflowHandle = async (meetingId: string) => {
  const wfUserInfo: WFUserInfo = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.specialorgid || '',
    spRoleId: userInfo.value.id || ''
  }
  wfParam.value.MEETING_ID = meetingId
  wfParam.value.DW_ID = userInfo.value.dwId
  const res: any = await getHasFzJys({ meetingId })
  if (!res.success) return
  wfParam.value.HAS_FZ = res.data.HAS_FZ
  wfParam.value.HAS_JYS = res.data.HAS_JYS
  submitWorkflow(store.getters.getUserMsg.systemCode, 'WF_CITY_LHHS_REVIEW_REPORT', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
}

const submitWFCallback = async (nextPersonAndPath: string) => {
  let spfrom = {
    userId: store.getters.getUserMsg.id,
    spOrgId: userInfo.value.specialorgid || '',
    spRoleId: userInfo.value.id || '',
    wfCode: 'WF_CITY_LHHS_REVIEW_REPORT',
    wfData: wfParam.value,
    nextPersonAndPath: nextPersonAndPath
  }
  const res = await submitWf({
    ...spfrom
  })
  if (res.success) {
    ElMessage.success('提交成功')
    proTableRef.value?.clearSelection()
    proTableRef.value.getTableList()
  } else {
    let msg = res.msg.split('|').join('<br/>')
    ElMessage.error({
      type: 'error',
      dangerouslyUseHTMLString: true,
      message: msg
    })
  }
}
// 方法
onMounted(async () => {
  var isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    userInfo.value = store.getters.getJRGlobalInfo
    userInfo.value.id = userInfo.value.spRoleId
    userInfo.value.specialorgid = userInfo.value.deptId
    userInfo.value.id = userInfo.value.spRoleId
    await initParamLists()
    isShowPage.value = true
  } else {
    await userDialogRef.value.getUser()
  }
})
// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    userInfo.value.deptId = userInfo.value.specialorgid
    userInfo.value.dwId = userInfo.value.org_id
    userInfo.value.roleId = userInfo.value.role_id
    userInfo.value.roleCode = userInfo.value.code
    specialOrgId.value = userDialogRef.value.specialorgid
    if (isQuery) {
      await initParamLists()
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}
const tableColumns = reactive<any>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'meetingName',
    label: '会议名称',
    search: {
      el: 'input',
      order: 1
    },
    width: '280'
  },
  {
    prop: 'startTimeBegin',
    label: '评审时间从',
    isShow: false,
    search: {
      el: 'date-picker',
      order: 5,
      span: 2,
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        clearable: true
      }
    }
  },
  {
    prop: 'nd',
    label: '年度',
    width: '80',
    search: {
      el: 'date-picker',
      order: 2,
      props: { type: 'year', valueFormat: 'YYYY', clearable: false },
      defaultValue: new Date().getFullYear().toString()
    },
    isShow: false
  },
  { prop: 'nd', label: '年度', width: '100' },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: 150,
    search: { el: 'select', props: { onChange: selectChange, clearable: true, filterable: true }, order: 3 },
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'zgkbmId',
    label: '市归口部门',
    width: 150,
    search: { el: 'select', props: { clearable: true, filterable: true }, order: 4 },
    enum: gkbmList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'meetingStatus',
    label: '会议状态',
    tag: true,
    enum: [
      { label: '未发布', value: '00', tagType: 'info' },
      { label: '评审中', value: '01', tagType: 'warning' },
      { label: '已结束', value: '02', tagType: 'success' }
    ],
    width: '80'
  },
  { prop: 'yjdwName', label: '一级单位', width: '180' },
  { prop: 'zgkbmName', label: '市归口部门', width: '180' },
  { prop: 'isLeaderReview', label: '是否完成评审', width: '100' },
  { prop: 'reportStatus', label: '评审报告状态', width: '100' },
  { prop: 'reportFlowStatus', label: '报告流程状态', width: '150' },
  { prop: 'major', label: '评审专业' },
  { prop: 'createUserName', label: '组织人', width: '80' },
  { prop: 'startTime', label: '会议开始时间', width: '150' },
  { prop: 'endTime', label: '会议结束时间', width: '150' },
  { prop: 'reportName', label: '评审意见报告', width: '140' },
  { prop: 'totalCount', label: '评审总条目数', width: '100' },
  { prop: 'thCount', label: '退回条目数', width: '85' },
  { prop: 'passCount', label: '通过条目数', width: '85' },
  { prop: 'rejectCount', label: '驳回条目数', width: '85' }
])
</script>
<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  overflow: hidden;
  overflow-y: auto;
  .table {
    padding-top: 10px;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .opeartion {
    margin-bottom: 10px;
  }
  .searchBox {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.table-box {
  padding: 10px;
}
</style>
