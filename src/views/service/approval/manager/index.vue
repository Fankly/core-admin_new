<template>
  <div v-if="isShowPage" class="container">
    <div class="operation">
      <div class="operation-left">
        <el-dropdown v-for="dropdown in visibleOperationDropdowns" :key="dropdown.permission" class="operation-dropdown" trigger="click">
          <el-button type="primary" size="mini" plain> {{ dropdown.label }}<i class="el-icon-arrow-down operation-arrow"></i> </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in dropdown.children" :key="item.permission" @click="handleOperationClick(item.permission)">
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="operation-right">
        <div class="operation-right-info">
          <div class="highlight">
            <dt>部门名称:</dt>
            <dd>{{ bmInfo.name }}</dd>
          </div>
        </div>
      </div>
    </div>

    <div class="container-search">
      <el-form ref="searchFormRef" :model="searchForm" label-suffix="：" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="会议名称" prop="meetingName">
              <el-input v-model="searchForm.meetingName" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="会议状态" prop="status">
              <el-select v-model="searchForm.status" clearable style="width: 100%">
                <el-option v-for="item in statusEnum" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="会议编号" prop="meetingCode">
              <el-input v-model="searchForm.meetingCode" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <div class="container-search__buttons">
              <el-button size="mini" type="primary" plain @click="searchMainPage">查 询</el-button>
              <el-button size="mini" type="primary" plain @click="resetSearch">重 置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="container-table">
      <div class="container-table__main">
        <vxe-grid
          ref="gridRef"
          v-bind="gridOptions"
          :data="tableData"
          :loading="loading"
          @checkbox-change="handleSelection"
          @checkbox-all="handleSelection"
          @cell-click="handleCellClick"
        >
          <template #statusSlot="{ row }">
            <el-tag :type="getStatusTag(row.status).type" effect="light">{{ getStatusTag(row.status).label }}</el-tag>
          </template>
          <template #amountSlot="{ row, column }">{{ formatMeetingAmount(row, column.field) }}</template>
          <template #psmsSlot="{ row }">
            <el-button type="text" @click.stop="psmsView(row)">
              {{ getPsmsName(row.psms) || '-' }}
            </el-button>
          </template>
        </vxe-grid>
      </div>
      <div class="container-table__pager">
        <el-pagination
          :current-page="page.page"
          background
          :page-sizes="[10, 20, 50, 100, 500]"
          :page-size="page.limit"
          :total="Number(page.total)"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="limitChangeHandle"
          @current-change="pageChangeHandle"
        />
      </div>
    </div>

    <MeetingStatusModal ref="meetingStatusModalRef" :status-options="statusEnum" @update="handleUpdateMeetingStatus" />
    <ExpertManagementModal ref="expertManagementModalRef" />
    <TaskAssignmentModal @allocated="searchData" ref="taskAssignmentModalRef" />
    <SelectModal
      ref="selectModalRef"
      @show-modal="showModal"
      :title="'评审模式'"
      :label="'评审模式'"
      :options="psmsOptions"
      :loading="psmsLoading"
      :disabled="psmsLoadFailed"
    />
    <ReviewExpertModal ref="reviewExpertModalRef" />
    <OnlinePreReviewOpinionModal ref="onlinePreReviewOpinionModalRef" />
    <OfflineReviewOpinionModal ref="offlineReviewOpinionModalRef" />
    <AutoMeetingModal ref="autoMeetingModalRef" />
  </div>
  <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/service/approval/manager/index">
import { computed, defineAsyncComponent, nextTick, onMounted, provide, reactive, ref } from 'vue'
import { ElForm, ElMessage, ElMessageBox } from 'element-plus'
import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { getBmInfo, getPublicData } from '@/api/common'
import { getLhhsMeetingPageData } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { deleteExpertProject, psfg, updateMeetingStatus, updatePsms } from '@/api/service/approval/manager'
import { checkPermission, formatNumValue } from '@/utils/utils'
import SelectModal from '@/views/service/approval/provinceLhhsMeeting/components/selectModal.vue'
import ReviewExpertModal from '@/views/service/approval/manager/components/reviewModal/ReviewExpertModal.vue'
import OnlinePreReviewOpinionModal from '@/views/service/approval/manager/components/OnlinePreReviewOpinionModal/index.vue'
import OfflineReviewOpinionModal from '@/views/service/approval/manager/components/OfflineReviewOpinionModal/index.vue'
import AutoMeetingModal from '@/views/service/approval/manager/components/AutoMeetingModal/index.vue'
import { REVIEW_MODE_ASSIGNED_CODE, useReviewModeCode } from '@/hooks/useReviewModeCode'

const ExpertManagementModal = defineAsyncComponent(
  () => import('@/views/service/approval/provinceLhhsMeeting/components/expertManagementModal/index.vue')
)

const TaskAssignmentModal = defineAsyncComponent(
  () => import('@/views/service/approval/provinceLhhsMeeting/components/taskAssignmentModal/index.vue')
)

const MeetingStatusModal = defineAsyncComponent(() => import('@/views/service/approval/manager/components/MeetingStatusModal/index.vue'))

interface OperationDropdown {
  label: string
  permission: string
  children: OperationDropdownItem[]
}

interface OperationDropdownItem {
  label: string
  permission: string
  permissions?: string[]
}

const PermissionCode = {
  meetingManage: 'MEETING_MANAGE',
  meetingStatusUpdate: 'MEET_STATUS_UP',
  meetingAssignmentAdjust: 'MEET_ASGN_ADJ',
  autoMeeting: 'AUTO_MEETING',
  reviewManage: 'REVIEW_MANAGE',
  reviewExpertAdjust: 'REVIEW_EXPERT_ADJ',
  opinionManage: 'OPINION_MANAGE',
  onlinePreReviewOpinionEdit: 'ON_PRE_OP_EDIT',
  offlineMeetingReviewOpinionEdit: 'OFF_MT_OP_EDIT',
  finalReviewOpinionEdit: 'FINAL_OP_EDIT',
  offlineFinalReviewOpinionEdit: 'OFFLINE_FINAL_OP_EDIT',
  attachmentManage: 'ATTACH_MANAGE',
  attachmentReplace: 'ATTACH_REPL'
} as const

const operationDropdowns: OperationDropdown[] = [
  {
    label: '会议管理',
    permission: PermissionCode.meetingManage,
    children: [
      { label: '会议状态更新', permission: PermissionCode.meetingStatusUpdate },
      { label: '会议分工调整', permission: PermissionCode.meetingAssignmentAdjust },
      { label: '自动纳会', permission: PermissionCode.autoMeeting }
    ]
  },
  {
    label: '评审管理',
    permission: PermissionCode.reviewManage,
    children: [{ label: '评审专家调整', permission: PermissionCode.reviewExpertAdjust }]
  },
  {
    label: '意见管理',
    permission: PermissionCode.opinionManage,
    children: [
      { label: '修改线上预审意见', permission: PermissionCode.onlinePreReviewOpinionEdit },
      {
        label: '修改线下会审及终评意见',
        permission: PermissionCode.offlineFinalReviewOpinionEdit,
        permissions: [PermissionCode.offlineMeetingReviewOpinionEdit, PermissionCode.finalReviewOpinionEdit]
      }
    ]
  },
  {
    label: '附件管理',
    permission: PermissionCode.attachmentManage,
    children: [{ label: '附件替换', permission: PermissionCode.attachmentReplace }]
  }
]

type MeetingRow = Record<string, any>

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const searchFormRef = ref<InstanceType<typeof ElForm>>()
const gridRef = ref<VxeGridInstance>()
const meetingStatusModalRef = ref<any>()
const expertManagementModalRef = ref<any>()
const taskAssignmentModalRef = ref<any>()
const selectModalRef = ref<any>()
const reviewExpertModalRef = ref<InstanceType<typeof ReviewExpertModal>>()
const onlinePreReviewOpinionModalRef = ref<InstanceType<typeof OnlinePreReviewOpinionModal>>()
const offlineReviewOpinionModalRef = ref<InstanceType<typeof OfflineReviewOpinionModal>>()
const autoMeetingModalRef = ref<InstanceType<typeof AutoMeetingModal>>()

const isShowPage = ref(false)
const loading = ref(false)
const tableData = ref<MeetingRow[]>([])
const selectedRows = ref<MeetingRow[]>([])
const statusEnum = ref<any[]>([])
const meetingId = ref('')
const psms = ref('')
const {
  reviewModeOptions: psmsOptions,
  reviewModeLoading: psmsLoading,
  reviewModeLoadFailed: psmsLoadFailed,
  loadReviewModeOptions,
  getReviewModeName: getPsmsName,
  getReviewModeUpdateMessage,
  checkReviewModeOptionsReady: checkPsmsOptionsReady
} = useReviewModeCode()
const bmInfo = ref({
  name: '',
  code: ''
})

const hasOperationPermission = (permission: string) => {
  return checkPermission(userRoleSelectorRef.value?.permissions || [], permission)
}

const hasOperationItemPermission = (item: OperationDropdownItem) => {
  const permissions = item.permissions || [item.permission]
  return permissions.some((permission) => hasOperationPermission(permission))
}

const visibleOperationDropdowns = computed(() => {
  return operationDropdowns
    .filter((dropdown) => hasOperationPermission(dropdown.permission))
    .map((dropdown) => ({
      ...dropdown,
      children: dropdown.children.filter((item) => hasOperationItemPermission(item))
    }))
    .filter((dropdown) => dropdown.children.length > 0)
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

const userInfo = computed(() => ({
  deptId: currentUserRole.value.bmId,
  deptName: currentUserRole.value.bmName,
  dwId: currentUserRole.value.dwId,
  dwName: currentUserRole.value.dwName,
  roleCode: currentUserRole.value.roleCode,
  spRoleId: currentUserRole.value.spRoleId,
  specialorgcode: currentUserRole.value.specialOrgCode,
  roleId: currentUserRole.value.roleId
}))

const searchForm = reactive<Record<string, any>>({
  meetingName: '',
  status: '',
  meetingCode: ''
})

const page = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const centerConfig = { align: 'center', headerAlign: 'center' } as const
const gridOptions = reactive<VxeGridProps<MeetingRow>>({
  border: true,
  height: '100%',
  showOverflow: true,
  showHeaderOverflow: true,
  checkboxConfig: { trigger: 'row', highlight: true, range: true },
  rowConfig: { isHover: true, height: 32 },
  columnConfig: { resizable: true },
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left', ...centerConfig },
    { type: 'seq', width: 60, title: '序号', fixed: 'left', ...centerConfig },
    { field: 'meetingName', title: '会议名称', width: 320, fixed: 'left', showOverflow: true, ...centerConfig },
    { field: 'status', title: '会议状态', width: 110, slots: { default: 'statusSlot' }, ...centerConfig },
    { field: 'meetingCode', title: '会议编号', width: 130, ...centerConfig },
    { field: 'bmName', title: '专业部门', width: 150, ...centerConfig },
    { field: 'sbje', title: '初始申报金额(万元)', width: 150, align: 'right', headerAlign: 'center', slots: { default: 'amountSlot' } },
    { field: 'nhje', title: '首次纳会金额（万元）', width: 150, align: 'right', headerAlign: 'center', slots: { default: 'amountSlot' } },
    { field: 'sdje', title: '审定金额(万元)', width: 140, align: 'right', headerAlign: 'center', slots: { default: 'amountSlot' } },
    { field: 'hjje', title: '会审核减（万元）', width: 140, align: 'right', headerAlign: 'center', slots: { default: 'amountSlot' } },
    { field: 'xmNum', title: '评审项目数量', width: 110, ...centerConfig },
    { field: 'sumJe', title: '评审项目金额(万元)', width: 150, align: 'right', headerAlign: 'center', slots: { default: 'amountSlot' } },
    { field: 'zjNum', title: '评审专家人数', width: 110, ...centerConfig },
    { field: 'psms', title: '评审模式', width: 100, slots: { default: 'psmsSlot' }, ...centerConfig },
    { field: 'pspcName', title: '评审批次', width: 320, showOverflow: true, ...centerConfig },
    { field: 'meetingAddr', title: '会议地点', width: 180, showOverflow: true, ...centerConfig },
    { field: 'organizer', title: '组织人', width: 90, ...centerConfig },
    { field: 'phone', title: '组织电话', width: 120, ...centerConfig },
    { field: 'yslyName', title: '预算来源', width: 110, ...centerConfig },
    { field: 'lhhsSkTime', title: '需求申请与提报截止日期', width: 190, ...centerConfig },
    { field: 'lhhsOneStartTime', title: '线上预审开始日期', width: 170, ...centerConfig },
    { field: 'lhhsOneEndTime', title: '线上预审结束日期', width: 170, ...centerConfig },
    { field: 'lhhsTwoStartTime', title: '线下会审开始日期', width: 170, ...centerConfig },
    { field: 'lhhsTwoEndTime', title: '线下会审结束日期', width: 170, ...centerConfig },
    { field: 'majorName', title: '评审专业', width: 220, showOverflow: true, ...centerConfig }
  ]
})

provide('currentUserRole', currentUserRole)
provide(PermissionInjectionKey, {
  get permissions() {
    return userRoleSelectorRef.value?.permissions || []
  },
  get isLoading() {
    return userRoleSelectorRef.value?.loading || false
  }
})

const statusMap = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  statusEnum.value.forEach((item) => {
    map[String(item.code)] = item
  })
  return map
})

const getStatusTag = (status: unknown) => {
  const item = statusMap.value[String(status)] || {}
  const index = statusEnum.value.findIndex((statusItem) => String(statusItem.code) === String(status))
  const tagTypes = ['info', 'warning', 'success', 'danger']
  return {
    label: item.name || '-',
    type: item.tagType || tagTypes[index] || 'info'
  }
}

const formatAmount = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  return formatNumValue(value as string | number, 6)
}

const formatMeetingAmount = (row: MeetingRow, field: string) => {
  const value = field === 'sbje' || field === 'sdje' ? row[field] ?? row.sumJe : row[field]
  return formatAmount(value)
}

const clearSelect = () => {
  selectedRows.value = []
  gridRef.value?.clearCheckboxRow()
}

const loadMeetingList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: page.page,
      limit: page.limit,
      current: page.page,
      size: page.limit,
      bmId: userInfo.value.deptId,
      roleId: userInfo.value.roleId
    }
    const res = await getLhhsMeetingPageData(params as any)
    if (!res.success) throw new Error(res.msg)
    tableData.value = Array.isArray(res.data?.records) ? res.data.records : []
    page.total = Number(res.data?.total ?? 0)
    clearSelect()
  } catch (error) {
    ElMessage.error((error as Error).message)
    tableData.value = []
    page.total = 0
  } finally {
    loading.value = false
  }
}

const searchMainPage = () => {
  page.page = 1
  loadMeetingList()
}

const resetSearch = () => {
  searchFormRef.value?.resetFields()
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = ''
  })
  page.page = 1
  page.limit = 20
  loadMeetingList()
}

const pageChangeHandle = (currentPage: number) => {
  page.page = currentPage
  loadMeetingList()
}

const limitChangeHandle = (limit: number) => {
  page.page = 1
  page.limit = limit
  loadMeetingList()
}

const handleSelection = ({ records }: any) => {
  selectedRows.value = records || []
}

const handleCellClick = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await gridRef.value?.clearCheckboxRow()
  await gridRef.value?.setCheckboxRow(row, true)
  selectedRows.value = [row]
}

const handleOperationClick = (permission: string) => {
  if (permission === PermissionCode.meetingStatusUpdate) {
    openMeetingStatusModal()
    return
  }
  if (permission === PermissionCode.meetingAssignmentAdjust) {
    choosePsms()
    return
  }
  if (permission === PermissionCode.autoMeeting) {
    openAutoMeetingModal()
    return
  }
  if (permission === PermissionCode.reviewExpertAdjust) {
    openReviewExpertModal()
    return
  }
  if (permission === PermissionCode.onlinePreReviewOpinionEdit) {
    openOnlinePreReviewOpinionModal()
    return
  }
  if (permission === PermissionCode.offlineFinalReviewOpinionEdit) {
    openOfflineReviewOpinionModal()
  }
}

const openMeetingStatusModal = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择需要更新状态的会议')
    return
  }
  meetingStatusModalRef.value?.acceptParams()
}

const handleUpdateMeetingStatus = async (status: string) => {
  meetingStatusModalRef.value?.setLoading(true)
  try {
    const ids = selectedRows.value.map((item) => item.meetingId).filter(Boolean)
    if (ids.length === 0) {
      ElMessage.warning('未获取到会议ID')
      return
    }
    const res = await updateMeetingStatus({
      ids,
      status
    })
    if (!res.success) throw new Error(res.msg)
    ElMessage.success('会议状态更新成功')
    meetingStatusModalRef.value?.setLoading(false)
    meetingStatusModalRef.value?.closeHandle()
    await loadMeetingList()
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    meetingStatusModalRef.value?.setLoading(false)
  }
}

const managerAssignmentApis = {
  deleteExpertProject,
  psfgData: (params: any) => {
    return psfg({
      expertIds: params.expertIds ?? [],
      fgpsType: params.fgpsType,
      ids: params.ids ?? [],
      meetingId: params.meetingId,
      psms: '02',
      pszyType: params.pszyType || ''
    })
  }
}

const choosePsms = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条数据进行评审分工操作!')
    return
  }
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条数据进行评审分工操作!')
    return
  }
  const row = selectedRows.value[0]
  if (!row?.meetingId) {
    ElMessage.warning('未获取到会议ID')
    return
  }
  if (!checkPsmsOptionsReady()) return
  selectModalRef.value.isShowModel = true
  selectModalRef.value.type = row.psms
  meetingId.value = row.meetingId
  psms.value = row.psms || ''
}

const showModal = (val: string) => {
  const value = getReviewModeUpdateMessage(val)
  const text = psms.value ? (val === psms.value ? '当前评审模式保持不变，请确认。' : '是否调整评审模式？') : '是否选择当前评审模式？'
  ElMessageBox.confirm(`${text}`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      if (val === psms.value && val === REVIEW_MODE_ASSIGNED_CODE) {
        selectModalRef.value.isShowModel = false
        showAssigned(meetingId.value)
        return
      }
      const res = await updatePsms({
        meetingId: meetingId.value,
        psms: val
      })
      if (!res.success) {
        ElMessage.error(res.msg)
        selectModalRef.value.isShowModel = false
        return
      }
      ElMessage.success(value)
      selectModalRef.value.isShowModel = false
      if (val === REVIEW_MODE_ASSIGNED_CODE) {
        showAssigned(meetingId.value)
      }
      await loadMeetingList()
    })
    .catch((error) => {
      if (error === 'cancel' || error === 'close') return
      ElMessage.error((error as Error).message || String(error))
    })
}

const showAssigned = (currentMeetingId: string) => {
  expertManagementModalRef.value?.acceptParams({
    title: '项目分配',
    isView: false,
    meetingId: currentMeetingId,
    bmId: userInfo.value.deptId,
    dwId: userInfo.value.dwId,
    roleCode: userInfo.value.roleCode,
    roleId: userInfo.value.roleId,
    taskAssignmentModalRef: taskAssignmentModalRef.value,
    assignmentApis: managerAssignmentApis
  })
}

const openReviewExpertModal = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择一条数据进行评审专家调整操作!')
    return
  }
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条数据进行评审专家调整操作!')
    return
  }
  const row = { ...selectedRows.value[0] }
  const btnPermissions = row['status'] === '00' ? ['ADD', 'DELETE', 'EXPORT'] : ['EXPORT']
  reviewExpertModalRef.value?.acceptParams({
    search: loadMeetingList,
    pageFlag: 'EXPERT',
    title: '联合会审会议专家明细',
    isView: row['status'] === '00',
    row,
    btnPermissions
  })
}

const openOnlinePreReviewOpinionModal = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择一条数据进行线上预审意见修改操作!')
    return
  }
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条数据进行线上预审意见修改操作!')
    return
  }
  const row = { ...selectedRows.value[0] }
  if (!row.meetingId) {
    ElMessage.warning('未获取到会议ID')
    return
  }
  onlinePreReviewOpinionModalRef.value?.acceptParams({
    row,
    userInfo: userInfo.value
  })
}

const openOfflineReviewOpinionModal = () => {
  const operationName = '线下会审及终评意见'
  if (selectedRows.value.length === 0) {
    ElMessage.warning(`请选择一条数据进行${operationName}修改操作!`)
    return
  }
  if (selectedRows.value.length !== 1) {
    ElMessage.warning(`请选择一条数据进行${operationName}修改操作!`)
    return
  }
  const row = { ...selectedRows.value[0] }
  if (!row.meetingId) {
    ElMessage.warning('未获取到会议ID')
    return
  }
  offlineReviewOpinionModalRef.value?.acceptParams({
    title: '修改线下会审及终评意见',
    row
  })
}

const openAutoMeetingModal = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择一条数据进行自动纳会操作!')
    return
  }
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择一条数据进行自动纳会操作!')
    return
  }
  const row = { ...selectedRows.value[0] }
  if (!row.meetingId) {
    ElMessage.warning('未获取到会议ID')
    return
  }
  autoMeetingModalRef.value?.acceptParams({
    title: '自动纳会',
    meetingId: row.meetingId,
    search: loadMeetingList
  })
}

const getPublicCodeData = async () => {
  try {
    const res = await getPublicData('LHHS_MEETING_STATUS')
    if (!res.success) throw new Error(res.msg)
    const tagTypes = ['info', 'warning', 'success', 'danger']
    statusEnum.value = (res.data || []).map((item: any, index: number) => ({
      ...item,
      tagType: tagTypes[index] || 'info'
    }))
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const getBmInfoData = async (bmId: string) => {
  try {
    const res = await getBmInfo(bmId)
    if (!res.success) throw new Error(res.msg)
    bmInfo.value = res.data
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const getRoleHandle = async () => {
  if (!userRoleSelectorRef.value) return
  isShowPage.value = Boolean(userRoleSelectorRef.value.canRender)
  if (!isShowPage.value) return
  await getBmInfoData(userInfo.value.deptId)
  await loadMeetingList()
}

const psmsView = async (row: any) => {
  if (!getPsmsName(row.psms)) {
    return ElMessage.warning('暂未选择评审模式，请选择后查看。')
  }
  expertManagementModalRef.value?.acceptParams({
    title: '业务查看',
    isView: true,
    meetingId: row.meetingId,
    bmId: userInfo.value.deptId,
    dwId: userInfo.value.dwId,
    roleCode: userInfo.value.roleCode,
    roleId: userInfo.value.roleId,
    taskAssignmentModalRef: taskAssignmentModalRef.value,
    assignmentApis: managerAssignmentApis
  })
}

const searchData = () => {
  expertManagementModalRef.value?.isRoleSearch()
}

onMounted(async () => {
  await Promise.all([getPublicCodeData(), loadReviewModeOptions()])
  await nextTick()
  userRoleSelectorRef.value?.getUser()
})
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  &-search {
    padding: 10px 0 0;
    margin-bottom: 10px;

    :deep(.el-form-item) {
      margin-bottom: 10px;
    }

    &__buttons {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 32px;
      margin-bottom: 10px;
    }
  }

  &-table {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    &__main {
      flex: 1;
      min-width: 0;
      min-height: 300px;
    }

    &__pager {
      display: flex;
      justify-content: flex-end;
      padding-top: 10px;
    }
  }
}

.operation {
  display: flex;
  min-height: 28px;
  margin-bottom: 10px;

  &-left {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 400px;
    min-height: 0;
  }

  &-dropdown {
    line-height: 28px;
  }

  &-arrow {
    margin-left: 6px;
  }

  &-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1 1 auto;
    min-width: 0;

    &-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 10px 0 0;

      .highlight {
        display: inline-flex;
        align-items: center;
        max-width: 240px;
        padding: 4px 12px;
        border: 1px solid var(--el-border-color-light, #dcdfe6);
        border-radius: 4px;
        background-color: var(--el-fill-color-light, #f5f7fa);
        font-size: 14px;
        white-space: nowrap;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--el-fill-color, #e6e8eb);
        }

        dt {
          margin: 0;
          color: var(--el-text-color-regular, #606266);
          font-weight: normal;
        }

        dd {
          margin: 0 0 0 6px;
          overflow: hidden;
          color: var(--el-text-color-primary, #303133);
          font-weight: 600;
          text-overflow: ellipsis;
        }
      }
    }
  }
}

@media (max-width: 992px) {
  .operation {
    flex-wrap: wrap;
    gap: 8px;

    &-left {
      min-width: 0;
    }

    &-right {
      justify-content: flex-start;
      width: 100%;

      &-info {
        margin-right: 0;
      }
    }
  }

  .container-search {
    :deep(.el-col) {
      max-width: 50%;
      flex: 0 0 50%;
    }
  }
}

@media (max-width: 640px) {
  .container-search {
    :deep(.el-col) {
      max-width: 100%;
      flex: 0 0 100%;
    }

    &__buttons {
      justify-content: flex-start;
    }
  }
}
</style>
