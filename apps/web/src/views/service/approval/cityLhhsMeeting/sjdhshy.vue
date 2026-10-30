<template>
  <div class="container" v-loading="loading">
    <ProTable
      height="100%"
      @row-click="rowClick"
      row-key="meetingId"
      @selection-change="handleSelectionChange"
      @search="clearSelect"
      @reset="resultSelect"
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
            <el-button :disabled="isDisabled" v-permission="'VIEW'" size="small" type="primary" plain @click="openProjectDetail(scope.selectedList)">
              项目明细
            </el-button>
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
    <!-- 权限选择 -->
    <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
    <ExpertManagementModal ref="expertManagementModalRef" />
    <TaskAssignmentModal @allocated="searchData" ref="taskAssignmentModalRef" />
  </div>
</template>

<script setup lang="tsx">
import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'

defineOptions({ name: "/service/approval/cityLhhsMeeting/sjdhshy" })
import { nextTick, onMounted, reactive, ref, h, defineAsyncComponent, provide } from 'vue'
import { getMeetingPage } from '@/api/service/IhhsMeeting/approval/cityLhhsMeeting'
import { getBmInfo, getPublicData } from '@/api/common'
import { ElButton, ElMessage } from 'element-plus'
import { formatNumValue } from '@/utils/utils'
import ProTable from '@/components/ProTable/index.vue'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { useUser } from '@/hooks/useUser'
import { useStore } from '@/store/business'
import { useRoute, useRouter } from 'vue-router'
import { buildRoleRequestParams, appendRoleRequestParams } from '@/views/service/approval/cityLhhsMeeting/utils/roleParams'
import { pickMeetingMajor } from '@/views/service/approval/cityLhhsMeeting/utils/pszy'
import { useReviewModeCode } from '@/hooks/useReviewModeCode'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import { getSgbm } from '@/api/service/requirement'
import { encrypt } from '@/utils/crypto'
import { getListPageDataByAccount } from '@/api/service/IhhsMeeting/expertReview'

const ExpertManagementModal = defineAsyncComponent(
  () => import('@/views/service/approval/cityLhhsMeeting/components/expertManagementModal/index.vue')
)

const TaskAssignmentModal = defineAsyncComponent(() => import('@/views/service/approval/cityLhhsMeeting/components/taskAssignmentModal/index.vue'))

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const isShowPage = ref(false)
const route = useRoute()
const router = useRouter()
// 用户信息
const expertInfo = reactive({
  expertName: '张明远',
  expertId: '',
  majorCode: ''
})
const proTableRef = ref<any>(null)

const expertManagementModalRef = ref()
const taskAssignmentModalRef = ref()
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const gkbmList = ref<any[]>([])

const isDisabled = ref(true)
const loading = ref(false)

const statusEnum = ref<any>([])
const { loadReviewModeOptions, getReviewModeName: getPsmsName } = useReviewModeCode()

const store = useStore()
const bmInfo = ref<{
  name: string
  code: string
}>({
  name: '',
  code: ''
})

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

provide(CurrentUserRoleInjectionKey, currentUserRole)
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

const resultSelect = () => {
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  proTableRef.value?.clearSelection()
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
  return getMeetingPage(params).finally(() => {
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
  if (row['status'] !== '00') {
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

const openProjectDetail = (selectList: any[]) => {
  const meetingInfo = selectList[0]
  if (!meetingInfo) return ElMessage.warning('请选择一条数据')
  const projectManifestRouteName = '/reviewDeatil/indexReturn'
  const str = encrypt(
    JSON.stringify({
      meetingId: meetingInfo.meetingId,
      expertName: encodeURIComponent(expertInfo.expertName),
      expertId: expertInfo.expertId,
      majorCode: expertInfo.majorCode,
      tag: 'review',
      deptId: userInfo.value.deptId,
      dwId: userInfo.value.dwId,
      spRoleId: userInfo.value.spRoleId,
      specialorgcode: userInfo.value.specialorgcode,
      canRerun: route.query.source === 'reviewWorkBench' ? route.query.canRerun === '1' : undefined
    })
  )
  router.push({
    name: projectManifestRouteName,
    query: {
      params: str
    }
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
    ...pickMeetingMajor(row),
    bmId: userInfo.value.deptId,
    dwId: userInfo.value.dwId,
    roleCode: userInfo.value.roleCode,
    roleId: userInfo.value.roleId,
    taskAssignmentModalRef: taskAssignmentModalRef
  })
}

const selectChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  params.ejdw = ''
  params.zgkbmId = ''
  ejdwList.value.length = 0
  gkbmList.value.length = 0
  const param = {
    YJDW: val,
    bmId: userInfo.value.deptId,
    dwId: userInfo.value.dwId,
    parentCode: val
  }
  getEjdwList({ ...param }).then((res: any) => {
    if (res.success && res.data.length !== 0) {
      ejdwList.value.push(...res.data)
    }
  })
  let gkbm: any = await getSgbm({ ...param })
  if (gkbm.success && gkbm.data.length !== 0) {
    gkbmList.value.push(...gkbm.data)
  }
}

const initParamLists = async () => {
  yjdwList.value.length = 0
  let res: any = await getYjdwList({ bmId: userInfo.value.deptId, dwId: userInfo.value.dwId })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }
}

const getRoleHandle = async () => {
  if (!userRoleSelectorRef.value?.canRender || !currentUserRole.value.bmId) return
  const userInfoOthers = buildUserInfoFromCurrentRole()
  userInfo.value = userInfoOthers
  store.commit('setJRGlobalInfo', userInfoOthers)
  await getExperytInfo()
  await getBmInfoData(userInfoOthers.deptId)
  await initParamLists()
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

// 获取专家信息
const getExperytInfo = async () => {
  try {
    const count: any = store.getters.getUserMsg
    const res: any = await getListPageDataByAccount({ account: count.namecode })
    if (res.success && res.data?.records.length != 1) {
      ElMessage.warning('当前账号对应多个专家，请检查')
      loading.value = false
      isShowPage.value = false
      return
    }
    if (res.success) {
      const expert = res.data.records[0]
      expertInfo.expertName = expert.expertName
      expertInfo.expertId = expert.id
      expertInfo.majorCode = expert.major
      loading.value = false
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
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
    await initParamLists()
    await getExperytInfo()
  } else {
    await nextTick()
    if (userRoleSelectorRef.value) await userRoleSelectorRef.value.getUser()
  }
})
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50, fixed: 'left' },
  {
    prop: 'nd',
    label: '年度',
    width: '80',
    render: ({ row }: { row: any }) => row.startTime?.slice(0, 4) || '-',
    search: {
      el: 'date-picker',
      order: 1,
      props: {
        type: 'year',
        valueFormat: 'YYYY',
        clearable: true
      }
    },
    isShow: false
  },
  {
    prop: 'meetingName',
    label: '会议名称',
    search: {
      el: 'input',
      order: 2
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
      order: 9
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
      order: 3
    },
    width: '180'
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: 150,
    search: { el: 'select', props: { onChange: selectChange }, order: 4 },
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    width: 150,
    search: { el: 'select', order: 5 },
    enum: ejdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'zgkbmId',
    label: '市归口部门',
    width: 150,
    search: { el: 'select', order: 6 },
    enum: gkbmList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'bmName',
    label: '市归口管理部门',
    width: '130'
  },
  {
    prop: 'xmNum',
    label: '评审项目数量',
    width: '130'
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
        () => row.psmsName || getPsmsName(row.psms) || '-'
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
    width: '100'
  },
  {
    prop: 'phone',
    label: '组织电话',
    width: '180'
  },
  {
    prop: 'startTime',
    label: '会议开始日期',
    width: '150',
    render: ({ row }: { row: any }) => row.startTime?.slice(0, 10) || '-',
    search: {
      el: 'date-picker',
      order: 7,
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
    width: '150',
    render: ({ row }: { row: any }) => row.endTime?.slice(0, 10) || '-',
    search: {
      el: 'date-picker',
      order: 8,
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
  }
])
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
