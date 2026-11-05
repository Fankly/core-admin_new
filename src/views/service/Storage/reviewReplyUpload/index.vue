<template>
  <div class="home-container" v-if="isShowPage">
    <div v-loading="loading" class="content" element-loading-text="正在加载...">
      <service-general-report
        :button-permissions="buttonPermissions"
        :search-code="searchCode"
        :search-api="searchApi"
        :export-api="exportApi"
        :user-info="currentUserRole"
        :tabs="tabs"
        :keep-search-on-tab-change="false"
        :freeze-left-count="2"
        @tab-change="handleTabChange"
        @selection-change="handleSelectionChange"
        @drill-through="handleDrillThrough"
        ref="serviceGeneralReportRef"
      >
        <template #operation="{ selectedList, tabCode }">
          <template v-if="tabCode === 'PSYJSC_SJTC'">
            <el-button
              :disabled="selectedList.length === 0"
              v-if="isShowButton('PSYJSC_WH')"
              plain
              type="primary"
              size="mini"
              @click="handleUpload(tabCode)"
            >
              评审意见报告维护
            </el-button>
            <el-button v-if="isShowButton('PSYJSC_WHYXM')" plain type="primary" size="mini" @click="handleNoMeetingUpload"> 无会议项目 </el-button>
            <el-button
              :disabled="selectedList.length === 0"
              v-if="isShowButton('MEETINGEND')"
              plain
              type="primary"
              size="mini"
              @click="handleEndMeeting(tabCode)"
            >
              结束会议
            </el-button>
          </template>
          <template v-if="tabCode === 'PFYJSC_SJTC'">
            <el-button
              :disabled="selectedList.length === 0"
              v-if="isShowButton('PFYJSC_WH')"
              plain
              type="primary"
              size="mini"
              @click="handleUpload(tabCode)"
            >
              批复意见报告维护
            </el-button>
            <el-button
              :disabled="selectedList.length === 0"
              v-if="isShowButton('SUBMIT')"
              plain
              type="primary"
              size="mini"
              @click="handleSubmit(tabCode)"
            >
              提交
            </el-button>
          </template>
        </template>
      </service-general-report>
    </div>
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
  <UploadFileModal @submitAfter="handleUploadAfter" :allowed-file-types="[]" ref="uploadFileModalRef" />
  <PendingReportModal
    ref="pendingReportModalRef"
    :search-api="getDrillThroughPage"
    :export-api="exportDrillThrough"
    :columns="drillColumns"
    :default-params="drillDefaultParams"
  >
    <template #operation="{ selectedList }">
      <el-button
        :disabled="!pendingCurrentParams.meetingId"
        v-if="isShowButton('PSYJSC_WH')"
        plain
        type="primary"
        size="mini"
        @click="handlePendingUpload(selectedList)"
      >
        评审意见上传
      </el-button>
      <el-button
        :disabled="!pendingCurrentParams.meetingId"
        v-if="isShowButton('SUBMIT')"
        plain
        type="primary"
        size="mini"
        @click="handlePendingSubmit"
      >
        提交
      </el-button>
      <el-button
        :disabled="selectedList.length !== 1"
        v-if="isShowButton('VIEW')"
        plain
        type="primary"
        size="mini"
        @click="handlePendingView(selectedList)"
      >
        查看明细
      </el-button>
    </template>
    <template #search>
      <el-form style="width: 100%">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="项目编码：">
              <ReMultipleText
                v-model="pendingSearch.xmbm"
                placeholder="请输入项目编码"
                dialog-title="项目编码"
                tooltip-text="项目编码"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目名称：">
              <el-input v-model="pendingSearch.xmmc" placeholder="请输入项目名称" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div style="text-align: right; margin-bottom: 10px">
              <el-button size="mini" type="primary" plain @click="handlePendingSearch">查 询</el-button>
              <el-button size="mini" plain @click="handlePendingReset">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </template>
  </PendingReportModal>
  <BatchMaintenance
    @submit-after="handlePendingUploadAfter"
    input-key="wh"
    input-text="评审意见文号"
    modal-title="评审意见上传"
    :select-data="pendingUploadRows"
    :allowed-file-types="[]"
    :submit-api="submitPendingMaintenance"
    ref="pendingUploadModalRef"
  />
  <CentralizedModification ref="detailModalRef" :user-info="detailUserInfo" :form-data="detailRow" flag="VIEW" />
  <NoMeetingUpload
    ref="noMeetingUploadRef"
    :button-permissions="buttonPermissions"
    :default-params="drillDefaultParams"
    :user-info="currentUserRole"
    @submit-after="handleUploadAfter"
  />
  <DrillThroughModal
    ref="drillThroughModalRef"
    title="待省专业上传评审报告"
    :search-api="getDrillThroughPage"
    :export-api="exportDrillThrough"
    :columns="drillColumns"
    :default-params="drillDefaultParams"
  >
    <template #search>
      <el-form style="width: 100%">
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="项目编码：">
              <ReMultipleText
                v-model="drillSearch.xmbm"
                placeholder="请输入项目编码"
                dialog-title="项目编码"
                tooltip-text="项目编码"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目名称：">
              <el-input v-model="drillSearch.xmmc" placeholder="请输入项目名称" clearable style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div style="text-align: right; margin-bottom: 10px">
              <el-button size="mini" type="primary" plain @click="handleDrillSearch">查 询</el-button>
              <el-button size="mini" plain @click="handleDrillReset">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </template>
  </DrillThroughModal>
</template>

<script setup lang="ts" name="/service/Storage/reviewReplyUpload/index">
import { onMounted, ref, watch, provide, defineAsyncComponent, computed } from 'vue'
import { ServiceGeneralReport } from '@/components/service'
import type { UserInfo } from '@/components/service/ServiceGeneralReport/types'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import {
  getAttachAndWh,
  getPsyjAndPfwjPage,
  Params,
  submitData,
  uploadAttach,
  exportData,
  getDrillThroughPage,
  exportDrillThrough,
  maintainPsyj,
  submitPsyj,
  endMeeting
} from '@/api/service/Storage/reviewReplyUpload/index'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import DrillThroughModal from '@/components/DrillThroughModal/index.vue'
import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { formatNumValue } from '@/utils/utils'
import PendingReportModal from '@/views/service/Storage/reviewReplyUpload/components/pendingReportModal/index.vue'
import NoMeetingUpload from '@/views/service/Storage/reviewReplyUpload/components/noMeetingUpload/index.vue'
import BatchMaintenance from '@/views/service/Storage/components/BatchMaintenance/index.vue'
import CentralizedModification from '@/views/service/xq/components/CentralizedModification.vue'

const UploadFileModal = defineAsyncComponent(() => import('@/views/service/Storage/reviewReplyUpload/components/batchFile/index.vue'))

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const tabs = ref([
  { code: 'PSYJSC_SJTC', name: '评审意见上传', searchCode: 'PSYJSC_SJTC', showProcessBtn: false, showViewBtn: false, showExportBtn: true },
  { code: 'PFYJSC_SJTC', name: '批复意见上传', searchCode: 'PFYJSC_SJTC', showProcessBtn: true, showViewBtn: true, showExportBtn: true }
])
const serviceGeneralReportRef = ref<InstanceType<typeof ServiceGeneralReport>>()
const uploadFileModalRef = ref<InstanceType<typeof UploadFileModal>>()
const pendingReportModalRef = ref<InstanceType<typeof PendingReportModal>>()
const pendingUploadModalRef = ref<InstanceType<typeof BatchMaintenance>>()
const detailModalRef = ref<InstanceType<typeof CentralizedModification>>()
const noMeetingUploadRef = ref<InstanceType<typeof NoMeetingUpload>>()
const currentDetail = ref<any>(null)
const isShowPage = ref<boolean>(false)
const selectedRows = ref<any[]>([])
const buttonPermissions = ref<string[]>([])
const searchCode = ref('PSYJSC_SJTC')

const currentUserRole = ref<UserInfo>({
  bmName: '',
  dwName: '',
  bmId: '',
  roleId: '',
  roleCode: '',
  dwId: '',
  specialOrgCode: '',
  spRoleId: ''
})

const loading = ref(false)

const drillThroughModalRef = ref<InstanceType<typeof DrillThroughModal>>()
const drillCurrentParams = ref<{ meetingId?: any; searchType?: string }>({})
const pendingCurrentParams = ref<{ meetingId?: any; searchType?: string }>({})
const drillSearch = ref({ xmbm: '', xmmc: '' })
const pendingSearch = ref({ xmbm: '', xmmc: '' })
const pendingUploadRows = ref<any[]>([])
const detailRow = ref<any>({})
const PENDING_REPORT_SEARCH_TYPE = 'dshcl_num'
const drillDefaultParams = computed(() => ({
  bmId: currentUserRole.value.bmId,
  dwId: currentUserRole.value.dwId,
  roleCode: currentUserRole.value.roleCode,
  roleId: currentUserRole.value.roleId
}))
const detailUserInfo = computed(() => ({
  deptId: currentUserRole.value.bmId,
  deptName: currentUserRole.value.bmName,
  dwId: currentUserRole.value.dwId,
  dwName: currentUserRole.value.dwName,
  roleId: currentUserRole.value.roleId,
  roleCode: currentUserRole.value.roleCode,
  spRoleId: currentUserRole.value.spRoleId,
  specialorgcode: currentUserRole.value.specialOrgCode
}))
const drillColumns = [
  { field: 'meetingName', title: '会议名称', width: 400 },
  { field: 'meetingCode', title: '会议编码', width: 160 },
  { field: 'xmmc', title: '项目名称', width: 300 },
  { field: 'gwxmbm', title: '项目编码', width: 180 },
  { field: 'proType', title: '项目类型', width: 180 },
  { field: 'yssx', title: '预算事项', width: 200 },
  { field: 'kypswh', title: '可研评审文号', width: 180 },
  { field: 'yjdw', title: '一级单位', width: 200 },
  { field: 'ejdw', title: '二级单位', width: 200 },
  { field: 'yjfl', title: '一级分类', width: 200 },
  { field: 'ejfl', title: '二级分类', width: 200 },
  { field: 'sjfl', title: '三级分类', width: 200 },
  {
    field: 'amount',
    title: '当年预算(万元)',
    width: 180,
    headerAlign: 'center',
    align: 'right',
    formatter({ cellValue }: { cellValue: string }) {
      if (cellValue === null || cellValue === undefined || cellValue === '') {
        return '-'
      }
      return formatNumValue(cellValue, 6)
    }
  }
]

const getRoleHandle = async () => {
  if (userRoleSelectorRef.value) {
    isShowPage.value = userRoleSelectorRef.value.canRender
    buttonPermissions.value = await userRoleSelectorRef.value.getButtonPermissions()
  }
}

const searchApi = async (params: Params) => {
  const limit = Number.isFinite(Number(params?.limit)) && Number(params.limit) > 0 ? Math.floor(Number(params.limit)) : 20
  const page = Number.isFinite(Number(params?.page)) && Number(params.page) > 0 ? Math.floor(Number(params.page)) : 1
  params['limit'] = limit
  params['page'] = page
  return getPsyjAndPfwjPage(params)
}

const handleUploadAfter = async () => {
  serviceGeneralReportRef.value?.refresh()
}

const handlePendingUploadAfter = async () => {
  pendingReportModalRef.value?.refresh()
  serviceGeneralReportRef.value?.refresh()
}

const exportApi = async (params: any) => {
  const limit = Number.isFinite(Number(params?.limit)) && Number(params.limit) > 0 ? Math.floor(Number(params.limit)) : 20
  const page = Number.isFinite(Number(params?.page)) && Number(params.page) > 0 ? Math.floor(Number(params.page)) : 1
  params['limit'] = limit
  params['page'] = page
  return exportData(params)
}

const handleTabChange = (tab: any) => {}

const handleDrillThrough = ({ row, column }: any) => {
  if (column.field === PENDING_REPORT_SEARCH_TYPE) {
    openPendingReport(row)
    return
  }
  drillCurrentParams.value = { meetingId: row.meeting_id, searchType: column.field }
  drillSearch.value = { xmbm: '', xmmc: '' }
  drillThroughModalRef.value?.open(drillCurrentParams.value)
}

const handleDrillSearch = () => {
  drillThroughModalRef.value?.open({ ...drillCurrentParams.value, ...drillSearch.value })
}

const handleDrillReset = () => {
  drillSearch.value = { xmbm: '', xmmc: '' }
  drillThroughModalRef.value?.open(drillCurrentParams.value)
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const getFirstValue = (row: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

const getMeetingId = (row: Record<string, any>) => getFirstValue(row, ['meeting_id', 'meetingId', 'meetingID'])
const getXmId = (row: Record<string, any>) => getFirstValue(row, ['xmId', 'xmid', 'id'])

const openPendingReport = (row: any) => {
  const meetingId = getMeetingId(row)
  if (!meetingId) {
    ElMessage.warning('未找到会议ID，无法打开待省专业上传评审报告页面!')
    return
  }
  pendingCurrentParams.value = { meetingId, searchType: PENDING_REPORT_SEARCH_TYPE }
  pendingSearch.value = { xmbm: '', xmmc: '' }
  pendingReportModalRef.value?.open(pendingCurrentParams.value)
}

const handlePendingSearch = () => {
  pendingReportModalRef.value?.open({ ...pendingCurrentParams.value, ...pendingSearch.value })
}

const handlePendingReset = () => {
  pendingSearch.value = { xmbm: '', xmmc: '' }
  pendingReportModalRef.value?.open(pendingCurrentParams.value)
}

const handlePendingUpload = (records: any[]) => {
  const meetingId = pendingCurrentParams.value.meetingId
  if (!meetingId) {
    ElMessage.warning('未找到会议ID，无法进行评审意见上传!')
    return
  }
  const rows = (records[0] ? records : [{}]).map((row) => ({ ...row, id: meetingId })).filter(Boolean)
  if (rows.length === 0) return
  pendingUploadRows.value = rows
  pendingUploadModalRef.value?.openModal()
}

const handleNoMeetingUpload = () => {
  noMeetingUploadRef.value?.open()
}

const submitPendingMaintenance = (params: any) => {
  const { xmId, meetingId: paramsMeetingId, ...rest } = params
  const meetingId = pendingCurrentParams.value.meetingId || paramsMeetingId || xmId
  if (!meetingId) {
    return Promise.reject(new Error('未找到会议ID，无法保存!'))
  }
  return maintainPsyj({
    ...rest,
    meetingId
  })
}

const buildMeetingIdsParams = (records: any[]) => {
  const ids = records.map((item) => getMeetingId(item)).filter(Boolean)
  if (ids.length === 0) return { error: '未找到会议ID，请检查!' }
  return {
    params: {
      ids
    }
  }
}

const buildSingleMeetingParams = (meetingId?: any) => {
  if (!meetingId) return { error: '未找到会议ID，无法提交!' }
  return {
    params: {
      meetingId
    }
  }
}

const handlePendingSubmit = async () => {
  const submitParams = buildSingleMeetingParams(pendingCurrentParams.value.meetingId)
  if (submitParams.error) {
    ElMessage.warning(submitParams.error)
    return
  }
  try {
    loading.value = true
    const type = await VXETable.modal.confirm('是否提交评审意见报告？', '确认', {
      status: 'question',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return
    const res = await submitPsyj(submitParams.params)
    if (!res.success) throw new Error(res.msg)
    pendingReportModalRef.value?.refresh()
    serviceGeneralReportRef.value?.refresh()
    ElMessage.success('提交成功!')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const handlePendingView = (records: any[]) => {
  const row = records[0] || {}
  const id = getXmId(row)
  if (!id) {
    ElMessage.warning('未找到项目ID，无法查看明细!')
    return
  }
  detailRow.value = {
    ...row,
    id,
    xmlx: getFirstValue(row, ['proTypeId', 'protypeId', 'xmlx'])
  }
  if (detailModalRef.value) detailModalRef.value.isShowModal = true
}

const handleUpload = async (tabCode: string) => {
  if (tabCode === 'PSYJSC_SJTC') {
    if (selectedRows.value.length !== 1) {
      ElMessage.warning('请选择一条会议数据进行评审意见报告维护!')
      return
    }
    openPendingReport(selectedRows.value[0])
    return
  }
  const inputText = tabCode === 'PSYJSC_SJTC' ? '评审意见文号' : '批复意见文号'
  const params: any = {
    selectData: selectedRows,
    submitApi: uploadAttach,
    searchApi: getAttachAndWh,
    searchCode: tabCode,
    inputText: inputText,
    isView: false
  }
  if (tabCode === 'PFYJSC_SJTC') {
    params.selectText = '年度'
    const ztRes = selectedRows.value.some((record: any) => record.zt === '310')
    if (ztRes) {
      ElMessage.warning('【发展合规审核中】状态,无法进行批复意见报告维护操作!')
      return
    }
  }
  uploadFileModalRef.value?.acceptParams(params)
}

const handleEndMeeting = async (code: string) => {
  if (code !== 'PSYJSC_SJTC') return
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条会议数据进行结束会议!')
    return
  }
  const endParams = buildMeetingIdsParams(selectedRows.value)
  if (endParams.error) {
    ElMessage.warning(endParams.error)
    return
  }
  try {
    loading.value = true
    const type = await VXETable.modal.confirm('是否结束会议？', '确认', {
      status: 'question',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return
    const res = await endMeeting(endParams.params)
    if (!res.success) throw new Error(res.msg)
    serviceGeneralReportRef.value?.refresh()
    ElMessage.success('结束会议成功!')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (code: string) => {
  const info = code === 'PSYJSC_SJTC' ? '评审意见报告' : '批复意见报告'
  if (code === 'PFYJSC_SJTC') {
    const ztRes = selectedRows.value.some((record: any) => record.zt === '310')
    if (ztRes) {
      ElMessage.warning('非【待发展合规审核、发展合规审核驳回】状态,无法提交!')
      return
    }
  }
  try {
    loading.value = true
    const type = await VXETable.modal.confirm(`是否提交${info}？`, '确认', {
      status: 'question',
      cancelButtonText: '否',
      confirmButtonText: '是'
    })
    if (type !== 'confirm') return
    const ids = selectedRows.value.map((item) => item.id)
    const res = await submitData({
      ids: ids,
      searchCode: code
    })
    if (!res.success) throw new Error(res.msg)
    serviceGeneralReportRef.value?.refresh()
    ElMessage.success('提交成功!')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

const isShowButton = (btnRole: string) => {
  return buttonPermissions.value.includes(btnRole)
}

watch(
  () => selectedRows.value,
  (newVal) => {
    if (newVal.length === 1) {
      currentDetail.value = newVal[0]
    }
  }
)

onMounted(() => {
  userRoleSelectorRef.value?.getUser()
})
provide('currentUserRole', currentUserRole)
provide('buttonPermissions', buttonPermissions)
</script>

<style scoped lang="less">
.home-container {
  height: 100%;

  .content {
    height: 100%;
    padding: 10px;
  }
}
</style>
