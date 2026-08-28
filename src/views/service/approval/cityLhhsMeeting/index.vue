<template>
  <div class="container" v-loading="loading">
    <ProTable
      height="100%"
      @row-click="rowClick"
      row-key="meetingId"
      @selection-change="handleSelectionChange"
      @search="clearSelect"
      @reset="clearSelect"
      v-if="isShowPage"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="lhhsMeeting"
      ref="proTableRef"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <div class="operation">
          <div class="operation-left">
            <el-button v-permission="'ADD'" size="mini" type="primary" plain @click="openModal('ADD')">创 建</el-button>
            <el-button :disabled="isDisabled" v-permission="'EDIT'" size="mini" type="primary" plain @click="openModal('EDIT', scope['selectedList'])"
              >修 改</el-button
            >
            <el-button
              v-permission="'VIEW'"
              size="mini"
              :disabled="!scope['isSelected']"
              type="primary"
              plain
              @click="openModal('VIEW', scope['selectedList'])"
              >查 看</el-button
            >
            <el-button
              v-permission="'DELETE'"
              size="mini"
              :disabled="!scope['isSelected']"
              type="primary"
              plain
              @click="handleDeleteFormData(scope['selectedList'])"
              >删 除</el-button
            >
            <el-button
              v-permission="'PRODETAIL'"
              :disabled="isDisabled"
              size="mini"
              type="primary"
              plain
              @click="openReviewModal('PROGRAM', '联合会审会议项目明细', scope['selectedList'])"
              >评审项目确定</el-button
            >
            <el-button
              v-permission="'EXPDETAIL'"
              :disabled="isDisabled"
              size="mini"
              type="primary"
              plain
              @click="openReviewModal('EXPERT', '联合会审会议专家明细', scope['selectedList'])"
              >评审专家确定</el-button
            >
            <el-button
              v-permission="'ASSIGNED'"
              size="mini"
              :disabled="scope['selectedList'].length !== 1"
              type="primary"
              plain
              @click="choosePsms(scope['selectedList'])"
            >
              评审分工
            </el-button>
            <el-button
              v-permission="'PUBLISH'"
              size="mini"
              :disabled="!scope['isSelected']"
              type="primary"
              plain
              @click="handlePublish('PUBLISH', '发布', scope['selectedList'])"
              >会议发布</el-button
            >
            <el-button
              v-permission="'CANCEL'"
              size="mini"
              :disabled="!scope['isSelected']"
              type="primary"
              plain
              @click="handlePublish('CACEL_PUBLISH', '取消发布', scope['selectedList'])"
              >取消会议发布</el-button
            >
            <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="handleExport"> 导 出 </el-button>
          </div>

          <div class="operation-right">
            <div class="operation-right-info">
              <div class="highlight">
                <dt> 部门名称:</dt>
                <dd>{{ bmInfo.name }}</dd>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ProTable>
    <TheesMeetingEdit @clearSelect="clearSelect" ref="modalRef" />
    <ReviewExpertModal @clearSelect="clearSelect" ref="reviewExpertModalRef" />
    <ReviewProModal @clearSelect="clearSelect" ref="reviewProModalRef" />
    <!-- 权限选择 -->
    <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
    <selectModal
      ref="selectModalRef"
      @show-modal="showModal"
      :title="'评审模式'"
      :label="'评审模式'"
      :options="psmsOptions"
      :loading="psmsLoading"
      :disabled="psmsLoadFailed"
    />
    <ExpertManagementModal ref="expertManagementModalRef" />
    <TaskAssignmentModal @allocated="searchData" ref="taskAssignmentModalRef" />
  </div>
</template>

<script setup lang="tsx" name="/service/approval/cityLhhsMeeting/index">
import { nextTick, onMounted, reactive, ref, h, defineAsyncComponent, computed, provide } from 'vue'
import {
  addOrUpdateMeeting,
  canclePublish,
  deleteLhhsMeeting,
  getLhhsMeetingPageData,
  exportData,
  getMeetingCode,
  publish,
  updatePsms
} from '@/api/service/IhhsMeeting/approval/cityLhhsMeeting'
import { getBmInfo, getPublicData } from '@/api/common'
import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { VXETable } from 'vxe-table'
import { formatNumValue } from '@/utils/utils'
import ProTable from '@/components/ProTable/index.vue'
import TheesMeetingEdit from '@/views/service/approval/cityLhhsMeeting/components/TheesMeetingEdit'
import ReviewExpertModal from '@/views/service/approval/cityLhhsMeeting/components/ReViewModal/reviewExpertModal.vue'
import ReviewProModal from '@/views/service/approval/cityLhhsMeeting/components/ReViewModal/reviewProModal.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { useUser } from '@/hooks/useUser'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import selectModal from '@/views/service/approval/cityLhhsMeeting/components/selectModal.vue'
import { downloadExportBlob } from '@/views/service/approval/cityLhhsMeeting/utils/download'
import { buildRoleRequestParams, appendRoleRequestParams } from '@/views/service/approval/cityLhhsMeeting/utils/roleParams'
import { REVIEW_MODE_ASSIGNED_CODE, useReviewModeCode } from '@/hooks/useReviewModeCode'

const ExpertManagementModal = defineAsyncComponent(
  () => import('@/views/service/approval/cityLhhsMeeting/components/expertManagementModal/index.vue')
)

const TaskAssignmentModal = defineAsyncComponent(() => import('@/views/service/approval/cityLhhsMeeting/components/taskAssignmentModal/index.vue'))

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const isShowPage = ref(false)
const route = useRoute()

const proTableRef = ref<any>(null)
const modalRef = ref<InstanceType<typeof TheesMeetingEdit> | null>(null)
const reviewExpertModalRef = ref<InstanceType<typeof ReviewExpertModal>>()

const expertManagementModalRef = ref()
const taskAssignmentModalRef = ref()
const reviewProModalRef = ref<InstanceType<typeof ReviewProModal>>()

const isDisabled = ref(true)
const loading = ref(false)

const statusEnum = ref<any>([])
const meetingId = ref<any>()
const {
  reviewModeOptions: psmsOptions,
  reviewModeLoading: psmsLoading,
  reviewModeLoadFailed: psmsLoadFailed,
  loadReviewModeOptions,
  getReviewModeName: getPsmsName,
  getReviewModeUpdateMessage,
  checkReviewModeOptionsReady: checkPsmsOptionsReady
} = useReviewModeCode()

const store = useStore()
const psms = ref<string>('')
const selectModalRef = ref()
const bmInfo = ref<{
  name: string
  code: string
}>({
  name: '',
  code: ''
})

const isProvinceFinanceBudgetSpecialist = computed(
  () => userInfo.value && userInfo.value.roleCode === 'SCWYSZZ' && userInfo.value.specialorgcode === 'BM_CWZC'
)

const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
}>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: ''
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

provide('currentUserRole', currentUserRole)
provide(PermissionInjectionKey, {
  get permissions() {
    return userRoleSelectorRef.value?.permissions || []
  },
  get isLoading() {
    return Boolean(userRoleSelectorRef.value?.loading)
  }
})

const buildUserInfoFromCurrentRole = () => ({
  deptId: currentUserRole.value.bmId,
  deptName: currentUserRole.value.bmName,
  dwId: currentUserRole.value.dwId,
  dwName: currentUserRole.value.dwName,
  roleId: currentUserRole.value.roleId,
  roleCode: currentUserRole.value.roleCode,
  spRoleId: currentUserRole.value.spRoleId,
  specialorgcode: currentUserRole.value.specialOrgCode
})

const setCurrentUserRoleFromUserInfo = (roleInfo: typeof userInfo.value) => {
  currentUserRole.value = {
    bmId: roleInfo.deptId,
    bmName: roleInfo.deptName,
    dwId: roleInfo.dwId,
    dwName: roleInfo.dwName,
    roleId: roleInfo.roleId,
    roleCode: roleInfo.roleCode,
    spRoleId: roleInfo.spRoleId,
    specialOrgCode: roleInfo.specialorgcode
  }
}

const getCurrentRoleRequestParams = () =>
  buildRoleRequestParams({
    bmId: userInfo.value.deptId,
    roleId: userInfo.value.roleId,
    roleCode: userInfo.value.roleCode,
    dwId: userInfo.value.dwId
  })
const clearSelect = () => {
  proTableRef.value?.clearSelection()
}

const searchMainPage = () => {
  proTableRef.value?.getTableList()
}

const rowClick = (row: any) => {
  clearSelect()
  proTableRef.value?.element.toggleRowSelection(row)
}
const getPageList = (params: any) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  appendRoleRequestParams(params, getCurrentRoleRequestParams())
  return getLhhsMeetingPageData(params).finally(() => {
    loading.value = false
  })
}

const callBackHandle = (val: any) => {
  return val
}

const handleSelectionChange = (rows: any[]) => {
  if (rows.length === 1) isDisabled.value = false
  else {
    isDisabled.value = true
    return
  }
  const row = rows[0]
  if (row['status'] === '00') {
    isDisabled.value = false
  } else {
    isDisabled.value = true
  }
}

const getPublicCodeData = async () => {
  try {
    const res = await getPublicData('LHHS_MEETING_STATUS')
    if (!res.success) {
      throw new Error(res.msg)
    }
    const statusData: any[] = res.data
    const tagType = ['info', 'warning', 'success', 'danger']
    for (let i = 0; i < statusData.length; i++) {
      statusData[i].tagType = tagType[i] || 'danger'
    }
    statusEnum.value.push(...statusData)
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
}

// 选择评审方式
const showModal = (val: string) => {
  const value = getReviewModeUpdateMessage(val)
  const text = psms.value ? (val === psms.value ? '当前评审模式保持不变，请确认。' : '是否调整评审模式？') : '是否选择当前评审模式？'
  ElMessageBox.confirm(`${text}`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const params = {
        meetingId: meetingId.value,
        psms: val,
        ...getCurrentRoleRequestParams()
      }
      if (val === psms.value && val === REVIEW_MODE_ASSIGNED_CODE) {
        selectModalRef.value.isShowModel = false
        showAssigned(meetingId.value)
        return
      }
      const res: any = await updatePsms({ ...params })
      if (res.success) {
        ElMessage.success(`${value}`)
        selectModalRef.value.isShowModel = false
        if (val === REVIEW_MODE_ASSIGNED_CODE) {
          showAssigned(meetingId.value)
        }
        proTableRef.value?.getTableList()
        proTableRef.value?.clearSelection()
      } else {
        ElMessage.error(res.msg)
        selectModalRef.value.isShowModel = false
      }
    })
    .catch((error) => {
      if (error === 'cancel' || error === 'close') return
      ElMessage.error((error as Error).message || String(error))
    })
}

// 查看评审模式
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
    taskAssignmentModalRef: taskAssignmentModalRef
  })
}

const showAssigned = (meetingId: string) => {
  // 按事项分配（按事项统计项目数量）、按单位分配（按一级单位统计项目数量）、按项目分配

  expertManagementModalRef.value?.acceptParams({
    title: '项目分配',
    meetingId: meetingId,
    bmId: userInfo.value.deptId,
    dwId: userInfo.value.dwId,
    roleCode: userInfo.value.roleCode,
    roleId: userInfo.value.roleId,
    taskAssignmentModalRef: taskAssignmentModalRef
  })
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 80, fixed: 'left' },
  {
    prop: 'meetingName',
    label: '会议名称',
    search: {
      el: 'input',
      order: 1
    },
    fixed: 'left',
    width: '280'
  },
  {
    prop: 'status',
    label: '会议状态',
    enum: statusEnum.value,
    tag: true,
    search: {
      el: 'select',
      order: 5
    },
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    width: '120'
  },
  {
    prop: 'meetingCode',
    label: '会议编号',
    search: {
      el: 'input',
      order: 1
    },
    width: '180'
  },
  {
    prop: 'psms',
    label: '评审模式',
    width: '80',
    render: ({ row }: { row: any }) => {
      return h(
        ElButton,
        {
          type: 'text',
          onClick: () => psmsView(row),
          modelValue: row['psms']
        },
        () => getPsmsName(row.psms) || '-'
      )
    }
  },
  {
    prop: 'meetingAddr',
    label: '会议地点',
    width: '180'
  },
  {
    prop: 'organizer',
    label: '组织人',
    width: '180'
  },
  {
    prop: 'phone',
    label: '组织电话',
    width: '180'
  },
  {
    prop: 'startTime',
    label: '会议开始日期',
    width: '180',
    render: ({ row }: { row: any }) => row.startTime?.slice(0, 10) || '-',
    search: {
      el: 'date-picker',
      order: 3,
      props: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        onChange: (val: string) => {
          if (val && proTableRef.value?.searchParam.endTime) {
            const startTime = new Date(val).getTime()
            const endTime = new Date(proTableRef.value.searchParam.endTime).getTime()
            if (startTime > endTime) {
              proTableRef.value.searchParam.endTime = val
            }
          }
        },
        clearable: true
      }
    }
  },
  {
    prop: 'endTime',
    label: '会议结束日期',
    width: '180',
    render: ({ row }: { row: any }) => row.endTime?.slice(0, 10) || '-',
    search: {
      el: 'date-picker',
      order: 4,
      props: {
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
        onChange: (val: string) => {
          if (!val) {
            proTableRef.value.searchParam.startTime = ''
            return
          }
          if (val && proTableRef.value?.searchParam.startTime) {
            const startTime = new Date(proTableRef.value.searchParam.startTime).getTime()
            const endTime = new Date(val).getTime()
            if (startTime > endTime) {
              proTableRef.value.searchParam.startTime = val
            }
          }
        },
        clearable: true
      }
    }
  },
  {
    prop: 'majorName',
    label: '评审专业',
    width: '180'
  },
  {
    prop: 'xmNum',
    label: '评审项目数量',
    width: '180'
  },
  {
    prop: 'sumJe',
    label: '评审项目金额(万元)',
    width: '180',
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      const value = scope.row.sumJe
      if (value === undefined || value === null) return '-'
      return formatNumValue(value, 6)
    }
  },
  {
    prop: 'zjNum',
    label: '评审专家人数',
    width: '100'
  }
])

const openModal = async (flag: 'ADD' | 'EDIT' | 'VIEW', selectedData: any[] = []) => {
  const flagStr = {
    ADD: '创建',
    EDIT: '编辑',
    VIEW: '查看'
  }
  const title = flagStr[flag]
  if (flag !== 'ADD' && selectedData && selectedData.length !== 1) {
    ElMessage.warning('请选择一条数据进行' + title + '操作!')
    return
  }
  const row: any = selectedData.length === 0 ? {} : { ...selectedData[0] }
  if (flag === 'EDIT') {
    if (row['status'] !== '00') {
      ElMessage.warning('仅状态为[未发布]状态才可进行编辑!')
      return
    }
    if (row['bmId'] !== bmInfo.value.code && !isProvinceFinanceBudgetSpecialist.value) {
      ElMessage.warning('当前记录所属的专业部门与您选择的专业部门不一致,仅拥有查看权限,无法进行其他操作!')
      return
    }
  }
  if (flag === 'ADD') {
    row['bmName'] = bmInfo.value.name
    row['bmId'] = bmInfo.value.code
    row['yjdw'] = userInfo.value.dwId
    row['major'] = []
    const res = await getMeetingCode(getCurrentRoleRequestParams())
    if (!res.success) {
      ElMessage.error(res.msg)
      return
    }
    row['meetingCode'] = res.data
  } else {
    const major: any = selectedData[0] && selectedData[0].major
    row['major'] = major ? major.split(',') || [] : []
  }
  const params = {
    title,
    isView: flag === 'VIEW',
    row: { ...getCurrentRoleRequestParams(), ...row },
    api: flag !== 'VIEW' ? addOrUpdateMeeting : undefined,
    getTableList: proTableRef.value?.getTableList,
    ...getCurrentRoleRequestParams()
  }

  modalRef.value?.acceptParams(params)
}

const openReviewModal = (pageFlag: 'PROGRAM' | 'EXPERT', title: string, selectedData: any[] = []) => {
  if (selectedData && selectedData.length !== 1) {
    ElMessage.warning('请选择一条数据进行操作!')
    return
  }
  const row = { ...selectedData[0] }
  if (row['bmId'] !== bmInfo.value.code && !isProvinceFinanceBudgetSpecialist.value) {
    ElMessage.warning('当前记录所属的专业部门与您选择的专业部门不一致,仅拥有查看权限,无法进行其他操作!')
    return
  }
  const btnPermissions = row['status'] === '00' ? ['ADD', 'DELETE', 'EXPORT'] : ['EXPORT']
  const params = {
    search: proTableRef.value?.getTableList,
    pageFlag: pageFlag,
    title,
    isView: row['status'] === '00',
    row: row,
    btnPermissions: btnPermissions,
    ...getCurrentRoleRequestParams()
  }
  if (pageFlag === 'PROGRAM') {
    reviewProModalRef.value?.acceptParams(params)
  } else {
    reviewExpertModalRef.value?.acceptParams(params)
  }
}

const handleDeleteFormData = async (meetingList: any[] = []) => {
  if (meetingList && meetingList.length === 0) {
    ElMessage.warning('请至少选择一条数据进行删除操作!')
    return
  }
  const isCurDept = meetingList.some((item) => item['bmId'] !== bmInfo.value.code)
  if (isCurDept && !isProvinceFinanceBudgetSpecialist.value) {
    ElMessage.warning('存在数据所属的专业部门与您选择的专业部门不一致,仅拥有查看权限,无法进行其他操作!')
    return
  }
  const status = meetingList.some((item: any) => {
    const xmNum = Number(item.xmNum ?? 0)
    const zjNum = Number(item.zjNum ?? 0)
    return item.status !== '00' || xmNum !== 0 || zjNum !== 0
  })
  if (status) {
    ElMessage.warning('仅状态为[未发布]状态且[评审项目数量]、[评审专家人数]均为空，联合会审会议才可进行删除!')
    return
  }
  const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
    status: 'warning'
  })
  if (type === 'confirm') {
    const delIds = meetingList.map((item: any) => item.meetingId)
    const res = await deleteLhhsMeeting({
      ids: delIds,
      ...getCurrentRoleRequestParams()
    })
    if (res.success) {
      ElMessage.success('删除成功!')
      proTableRef.value?.getTableList()
      clearSelect()
    } else {
      ElMessage.error(res.msg)
    }
  }
}

const choosePsms = (meetingList: any[] = []) => {
  if (meetingList && meetingList.length === 0) {
    ElMessage.warning('请至少选择一条数据进行评审分工操作!')
    return
  }
  if (meetingList.length !== 1) {
    ElMessage.warning('请选择一条数据进行评审分工操作!')
    return
  }
  const isCurDept = meetingList.some((item) => item['bmId'] !== bmInfo.value.code)
  if (isCurDept && !isProvinceFinanceBudgetSpecialist.value) {
    ElMessage.warning('存在数据所属的专业部门与您选择的专业部门不一致,仅拥有查看权限,无法进行其他操作!')
    return
  }
  if (!checkPsmsOptionsReady()) return
  selectModalRef.value.isShowModel = true
  selectModalRef.value.type = meetingList[0].psms
  meetingId.value = meetingList[0].meetingId
  psms.value = meetingList[0]?.psms
}

const handleExport = async () => {
  loading.value = true
  let params = {
    ...proTableRef.value?.searchParam
  }
  params['current'] = params['page']
  params['size'] = params['limit']
  appendRoleRequestParams(params, getCurrentRoleRequestParams())
  try {
    const api = exportData
    const blob: any = await api(params)
    downloadExportBlob(blob, '联合会审会议导出.xlsx')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const handlePublish = async (opType: string, title: string, meetingList: any[] = []) => {
  if (meetingList && meetingList.length === 0) {
    ElMessage.warning('请至少选择一条数据进行' + title + '操作!')
    return
  }
  const isCurDept = meetingList.some((item) => item['bmId'] !== bmInfo.value.code)
  if (isCurDept && !isProvinceFinanceBudgetSpecialist.value) {
    ElMessage.warning('存在数据所属的专业部门与您选择的专业部门不一致,仅拥有查看权限,无法进行其他操作!')
    return
  }
  try {
    if (opType === 'PUBLISH') {
      const name = meetingList
        .filter((item: any) => item.status !== '00')
        .map((item) => item.meetingName)
        .join(',')

      if (name) throw new Error('会议名称:' + '[' + name + ']' + '：状态不是初始状态，不允许发布')
    } else {
      const name = meetingList
        .filter((item: any) => item.status !== '01')
        .map((item) => item.meetingName)
        .join(',')
      if (name) throw new Error('会议名称:' + '[' + name + ']' + '：状态不是已发布状态，不允许取消发布')
    }
    const type = await VXETable.modal.confirm('是否确定' + title + '？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      const meetingIds = meetingList.map((item: any) => item.meetingId)
      const api = opType === 'PUBLISH' ? publish : canclePublish
      const res = await api({
        ids: meetingIds,
        ...getCurrentRoleRequestParams()
      })
      if (res.success) {
        ElMessage.success(title + '成功!')
        proTableRef.value?.getTableList()
        clearSelect()
      } else {
        throw new Error(res.msg)
      }
    }
  } catch (error) {
    ElMessage.warning((error as Error).message)
  }
}

const getRoleHandle = async () => {
  if (!userRoleSelectorRef.value?.canRender || !currentUserRole.value.bmId) return
  const userInfoOthers = buildUserInfoFromCurrentRole()
  userInfo.value = userInfoOthers
  store.commit('setJRGlobalInfo', userInfoOthers)
  await getBmInfoData(userInfoOthers.deptId)
  isShowPage.value = true
}

const getBmInfoData = async (bmId: string) => {
  try {
    const res = await getBmInfo(bmId)
    if (!res.success) throw new Error(res.msg)
    bmInfo.value = res.data || {
      name: '',
      code: bmId || ''
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const initParams = () => {
  getPublicCodeData()
  loadReviewModeOptions()
}

const searchData = () => {
  expertManagementModalRef.value?.isRoleSearch()
}

onMounted(async () => {
  initParams()
  const isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    const jRGlobalInfo = store.getters.getJRGlobalInfo
    isShowPage.value = true
    userInfo.value = {
      ...(jRGlobalInfo as any)
    }
    setCurrentUserRoleFromUserInfo(userInfo.value)
    await getBmInfoData(userInfo.value.deptId)
    isShowPage.value = true
  } else {
    await nextTick()
    if (userRoleSelectorRef.value) await userRoleSelectorRef.value.getUser()
  }
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
