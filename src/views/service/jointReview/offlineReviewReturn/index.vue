<template>
  <div class="container" v-loading="loading">
    <template v-if="isShowPage">
      <div class="operation">
        <div class="operation-left">
          <el-button
            v-if="hasButtonPermission('XXHS')"
            size="mini"
            :disabled="selectedRows.length !== 1"
            type="primary"
            @click="openProjectDetail(selectedRows)"
            plain
          >
            项目明细
          </el-button>
          <el-button
            v-if="hasButtonPermission('ZJPSJD')"
            size="mini"
            :disabled="selectedRows.length !== 1"
            type="primary"
            @click="openExpertProcess(selectedRows)"
            plain
          >
            专家评审进度
          </el-button>
        </div>

        <div class="operation-right">
          <div class="operation-right-info">
            <div class="highlight">
              <span class="highlight-label">部门名称:</span>
              <span class="highlight-value">{{ bmInfo.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="search-panel">
        <el-form ref="searchFormRef" :model="searchForm" label-suffix="：" label-width="100px" @submit.prevent>
          <el-row :gutter="24">
            <el-col :span="6">
              <el-form-item label="会议名称" prop="meetingName">
                <el-input v-model="searchForm.meetingName" clearable @keyup.enter="searchHandle" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="会议编号" prop="meetingCode">
                <el-input v-model="searchForm.meetingCode" clearable @keyup.enter="searchHandle" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="评审时间从" prop="startTimeBegin">
                <el-date-picker
                  v-model="searchForm.startTimeBegin"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  clearable
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 100%"
                />
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
              <el-form-item label="年度" prop="nd">
                <el-select v-model="searchForm.nd" clearable filterable style="width: 100%" @change="handleNdChange">
                  <el-option v-for="item in ndList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="评审批次" prop="pspcId">
                <el-select v-model="searchForm.pspcId" clearable filterable style="width: 100%">
                  <el-option v-for="item in batchList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="归口部门" prop="zgkbmId">
                <el-select v-model="searchForm.zgkbmId" clearable filterable style="width: 100%">
                  <el-option v-for="item in gkbmList" :key="item.code" :label="item.name" :value="item.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <div class="search-panel__buttons">
                <el-button size="mini" type="primary" plain @click="searchHandle">查 询</el-button>
                <el-button size="mini" plain @click="resetSearch">重 置</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="table-wrap" v-tableRowSelect>
        <div class="table-wrap__main">
          <vxe-table
            ref="vxeTableRef"
            height="100%"
            border
            resizable
            show-overflow
            show-header-overflow
            align="center"
            header-align="center"
            :data="tableData"
            :row-config="{ keyField: 'meetingId', isHover: true, height: 32 }"
            :checkbox-config="{ reserve: true, highlight: true }"
            @checkbox-change="handleSelectionChange"
            @checkbox-all="handleSelectionChange"
            @cell-click="handleClickRow"
          >
            <vxe-column type="checkbox" width="50" fixed="left" />
            <vxe-column field="meetingName" title="会议名称" width="280" fixed="left" />
            <vxe-column field="status" title="会议状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status).type">{{ getStatusTag(row.status).label }}</el-tag>
              </template>
            </vxe-column>
            <vxe-column field="meetingCode" title="会议编号" width="180" />
            <vxe-column field="bmName" title="专业部门" width="180" />
            <vxe-column field="psms" title="评审模式" width="80">
              <template #default="{ row }">
                <el-button type="text" @click.stop="psmsView(row)">
                  {{ getReviewModeName(row.psms, '-') }}
                </el-button>
              </template>
            </vxe-column>
            <vxe-column field="pspcName" title="评审批次" width="180" />
            <vxe-column field="meetingAddr" title="会议地点" width="180" />
            <vxe-column field="organizer" title="组织人" width="180" />
            <vxe-column field="phone" title="组织电话" width="180" />
            <vxe-column field="yslyName" title="预算来源" width="100" />
            <vxe-column field="startTime" title="线下会审开始时间" width="150" />
            <vxe-column field="endTime" title="线下会审结束时间" width="150" />
            <vxe-column field="majorName" title="评审专业" width="220" />
            <vxe-column field="xmNum" title="评审项目数量" width="180" />
            <vxe-column field="sumJe" title="评审项目金额(万元)" width="180" align="right" header-align="center">
              <template #default="{ row }">{{ formatAmount(row.sumJe) }}</template>
            </vxe-column>
            <vxe-column field="zjNum" title="评审专家人数" width="100" />
            <template #empty>
              <div class="table-empty">暂无数据</div>
            </template>
          </vxe-table>
        </div>
        <div class="table-wrap__pager">
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
    </template>

    <UserRoleSelector ref="userRoleSelectorRef" @loadCompany="getRoleHandle" />
    <ExpertManagementModal ref="expertManagementModalRef" />
    <ExpertProcessModal ref="expertProcessModalRef" />
  </div>
</template>

<script setup lang="ts" name="/service/jointReview/offlineReviewReturn/index">
import { computed, defineAsyncComponent, nextTick, onMounted, provide, reactive, ref } from 'vue'
import { pageSjtcMeetingInfo } from '@/api/service/IhhsMeeting/offlineReview'
import { getPublicData, getGkbmInProvince } from '@/api/common'
import { getAllBatchList } from '@/api/service/IhhsMeeting/approval/batch'
import { ElForm, ElMessage } from 'element-plus'
import type { VxeTableInstance } from 'vxe-table'
import { checkPermission, formatNumValue } from '@/utils/utils'
import UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { useUser } from '@/hooks/useUser'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import baseService from '@/service/baseService'
import { encrypt } from '@/utils/crypto'
import { useReviewModeCode } from '@/hooks/useReviewModeCode'
import ExpertProcessModal from '@/views/service/jointReview/components/ExpertProcessModal.vue'

const ExpertManagementModal = defineAsyncComponent(
  () => import('@/views/service/approval/provinceLhhsMeeting/components/expertManagementModal/index.vue')
)

type MeetingRow = Record<string, any>

interface JointReviewUserInfo {
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
  fqzzFlag: string
}

const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
const searchFormRef = ref<InstanceType<typeof ElForm>>()
const vxeTableRef = ref<VxeTableInstance>()
const isShowPage = ref(false)
const route = useRoute()
const router = useRouter()
const expertManagementModalRef = ref()
const expertProcessModalRef = ref()
const taskAssignmentModalRef = ref()
const loading = ref(false)
const statusEnum = ref<any[]>([])
const ndList = ref<any[]>([])
const batchList = ref<any[]>([])
const gkbmList = ref<any[]>([])
const tableData = ref<MeetingRow[]>([])
const selectedRows = ref<MeetingRow[]>([])
const store = useStore()
const { loadReviewModeOptions, getReviewModeName, hasReviewMode } = useReviewModeCode()
const bmInfo = ref({
  name: '',
  code: ''
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

const userInfo = ref<JointReviewUserInfo>({
  deptId: '',
  deptName: '',
  dwId: '',
  dwName: '',
  roleCode: '',
  spRoleId: '',
  specialorgcode: '',
  roleId: '',
  fqzzFlag: ''
})

const searchForm = reactive({
  meetingName: '',
  status: '',
  startTimeBegin: [] as string[],
  meetingCode: '',
  nd: '',
  pspcId: '',
  zgkbmId: ''
})

const page = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const buttonPermissions = computed<string[]>(() => {
  const selectorPermissions = userRoleSelectorRef.value?.permissions || []
  return selectorPermissions.length ? selectorPermissions : store.state.permissions || []
})

const hasButtonPermission = (permission: string) => {
  return checkPermission(buttonPermissions.value, permission)
}

provide('currentUserRole', currentUserRole)
provide(PermissionInjectionKey, {
  get permissions() {
    return userRoleSelectorRef.value?.permissions || []
  },
  get isLoading() {
    return Boolean(userRoleSelectorRef.value?.loading)
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
  return {
    label: item.name || '-',
    type: item.tagType || 'primary'
  }
}

const formatAmount = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  return formatNumValue(value as string | number, 6)
}

const clearSelect = () => {
  selectedRows.value = []
  vxeTableRef.value?.clearCheckboxRow()
}

const handleClickRow = async ({ row, column }: any) => {
  if (column?.type === 'checkbox') return
  await nextTick()
  await vxeTableRef.value?.clearCheckboxRow()
  await vxeTableRef.value?.setCheckboxRow(row, true)
  selectedRows.value = [row]
}

const handleSelectionChange = ({ records }: any) => {
  selectedRows.value = records || []
}

const buildPageParams = () => {
  const params: Record<string, any> = {
    meetingName: searchForm.meetingName,
    status: searchForm.status,
    meetingCode: searchForm.meetingCode,
    nd: searchForm.nd,
    pspcId: searchForm.pspcId,
    zgkbmId: searchForm.zgkbmId,
    page: page.page,
    limit: page.limit,
    bmId: userInfo.value.deptId,
    roleCode: userInfo.value.roleCode,
    bmxz: userInfo.value.specialorgcode,
    username: store.getters.getUserMsg?.namecode,
    orgFlag: userInfo.value.fqzzFlag
  }
  if (searchForm.startTimeBegin?.length) {
    params.startTimeBegin = searchForm.startTimeBegin[0]
    params.startTimeEnd = searchForm.startTimeBegin[1]
  }
  return params
}

const loadTableData = async () => {
  loading.value = true
  try {
    const res = await pageSjtcMeetingInfo(buildPageParams())
    if (!res.success) throw new Error(res.msg)
    tableData.value = Array.isArray(res.data?.records) ? res.data.records : []
    page.page = Number(res.data?.current || page.page)
    page.limit = Number(res.data?.size || page.limit)
    page.total = Number(res.data?.total || 0)
    clearSelect()
  } catch (error) {
    tableData.value = []
    page.total = 0
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const searchHandle = () => {
  page.page = 1
  loadTableData()
}

const resetSearch = () => {
  searchFormRef.value?.resetFields()
  searchForm.meetingName = ''
  searchForm.status = ''
  searchForm.startTimeBegin = []
  searchForm.meetingCode = ''
  searchForm.nd = ''
  searchForm.pspcId = ''
  searchForm.zgkbmId = ''
  loadBatchOptions()
  page.page = 1
  loadTableData()
}

const pageChangeHandle = (currentPage: number) => {
  page.page = currentPage
  loadTableData()
}

const limitChangeHandle = (limit: number) => {
  page.page = 1
  page.limit = limit
  loadTableData()
}

const getPublicCodeData = async () => {
  try {
    const res = await getPublicData('LHHS_MEETING_STATUS')
    if (!res.success) {
      throw new Error(res.msg)
    }
    const tagTypes = ['info', 'warning', 'success']
    statusEnum.value = (res.data || []).map((item: any, index: number) => ({
      ...item,
      tagType: index > 3 ? 'danger' : tagTypes[index]
    }))
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
}

// 加载年度选项
const loadNdOptions = async () => {
  try {
    const res = await getPublicData('ZLYS_XMJHSSND')
    if (res.success) ndList.value = res.data || []
  } catch (e) {
    ndList.value = []
  }
}

// 加载归口部门选项
const loadGkbmOptions = async () => {
  let departments: any[] = []
  try {
    const res = await getGkbmInProvince()
    if (!res.success) throw new Error(res.msg)
    departments = res.data || []
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
  gkbmList.value = departments
  const bmId = userInfo.value.deptId
  const currentDepartment = departments.find((item: any) => item.id === bmId || item.code === bmId)
  bmInfo.value = {
    name: currentDepartment?.name || userInfo.value.deptName || '',
    code: currentDepartment?.code || bmId || ''
  }
}

// 加载评审批次选项（可按年度过滤）
const loadBatchOptions = async (nd?: string) => {
  try {
    const res = await getAllBatchList({
      dwId: userInfo.value.dwId,
      bmId: userInfo.value.deptId,
      nd
    })
    batchList.value = res.success ? res.data || [] : []
  } catch (e) {
    batchList.value = []
  }
}

// 年度变化时，清空已选评审批次并按年度重新加载批次选项
const handleNdChange = (nd: string) => {
  searchForm.pspcId = ''
  loadBatchOptions(nd)
}

// 查看评审模式
const psmsView = async (row: any) => {
  if (!hasReviewMode(row.psms)) {
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

const getDateStartTime = (dateValue?: string) => {
  if (!dateValue) return 0
  const dateText = String(dateValue).split(' ')[0].split('T')[0]
  const [year, month, day] = dateText.split('-').map(Number)
  const date = year && month && day ? new Date(year, month - 1, day) : new Date(dateValue)
  date.setHours(0, 0, 0, 0)
  const time = date.getTime()
  return Number.isNaN(time) ? 0 : time
}

const isExceedLhhsOneEndTime = (meetingInfo: any) => {
  const endTime = getDateStartTime(meetingInfo?.lhhsOneEndTime)
  if (!endTime) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime() > endTime
}

// 项目明细
const openProjectDetail = (selectList: MeetingRow[]) => {
  const meetingInfo = selectList[0]
  if (!meetingInfo) return ElMessage.warning('请选择一条数据')
  const projectManifestRouteName = '/service/jointReview/offlineReviewReturn/projectManifest'
  const str = encrypt(
    JSON.stringify({
      meetingId: meetingInfo.meetingId,
      tag: 'review',
      deptId: userInfo.value.deptId,
      dwId: userInfo.value.dwId,
      roleId: userInfo.value.roleId,
      spRoleId: userInfo.value.spRoleId,
      specialorgcode: userInfo.value.specialorgcode,
      buttonPermissions: buttonPermissions.value,
      canRerun: route.query.source === 'reviewWorkBench' ? route.query.canRerun === '1' : undefined
    })
  )
  router.push({
    name: projectManifestRouteName,
    query: {
      meetingParams: str
    }
  })
}

// 专家评审进度
const openExpertProcess = (selectList: MeetingRow[] = []) => {
  if (!selectList || selectList.length !== 1) {
    ElMessage.warning('请选择一条会议数据')
    return
  }
  const meetingInfo = selectList[0]
  expertProcessModalRef.value?.acceptParams({
    row: {
      meetingId: meetingInfo.meetingId,
      meetingCode: meetingInfo.meetingCode
    },
    userInfo: {
      deptId: userInfo.value.deptId,
      dwId: userInfo.value.dwId,
      roleCode: userInfo.value.roleCode,
      roleId: userInfo.value.roleId
    }
  })
}

const setCurrentUserRoleFromGlobalInfo = (globalInfo: JointReviewUserInfo) => {
  currentUserRole.value = {
    bmId: globalInfo.deptId,
    bmName: globalInfo.deptName,
    dwId: globalInfo.dwId,
    dwName: globalInfo.dwName,
    roleId: globalInfo.roleId,
    roleCode: globalInfo.roleCode,
    spRoleId: globalInfo.spRoleId,
    specialOrgCode: globalInfo.specialorgcode
  }
}

const buildUserInfoFromCurrentRole = (fqzzFlag: string): JointReviewUserInfo => ({
  deptId: currentUserRole.value.bmId,
  deptName: currentUserRole.value.bmName,
  dwId: currentUserRole.value.dwId,
  dwName: currentUserRole.value.dwName,
  roleId: currentUserRole.value.roleId,
  roleCode: currentUserRole.value.roleCode,
  spRoleId: currentUserRole.value.spRoleId,
  specialorgcode: currentUserRole.value.specialOrgCode,
  fqzzFlag
})

const getRoleHandle = async () => {
  if (!userRoleSelectorRef.value?.canRender || !currentUserRole.value.bmId) return
  const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${currentUserRole.value.bmId}`)
  if (flagData.success && flagData.data) {
    const userInfoOthers = buildUserInfoFromCurrentRole(flagData.data)
    userInfo.value = userInfoOthers
    store.commit('setJRGlobalInfo', userInfoOthers)
    await loadGkbmOptions()
    isShowPage.value = true
    await nextTick()
    loadBatchOptions()
    await loadTableData()
  }
}

const initParams = () => {
  getPublicCodeData()
  loadReviewModeOptions()
  loadNdOptions()
}

onMounted(async () => {
  initParams()
  const isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    const jRGlobalInfo = store.getters.getJRGlobalInfo as JointReviewUserInfo
    userInfo.value = { ...jRGlobalInfo }
    setCurrentUserRoleFromGlobalInfo(jRGlobalInfo)
    await loadGkbmOptions()
    loadBatchOptions()
    isShowPage.value = true
    await nextTick()
    await loadTableData()
  } else {
    await nextTick()
    await userRoleSelectorRef.value?.getUser()
  }
})
</script>

<style scoped lang="less">
.container {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 10px;

  .operation {
    display: flex;
    min-height: 28px;
    margin-bottom: 6px;

    &-left {
      min-width: 400px;
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
        gap: 6px;
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

          &-label {
            margin: 0;
            color: var(--el-text-color-regular, #606266);
            font-weight: normal;
          }

          &-value {
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
}

.search-panel {
  padding-top: 2px;
  margin-bottom: 6px;

  :deep(.el-form-item) {
    margin-bottom: 6px;
  }

  &__buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 32px;
    margin-bottom: 6px;

    :deep(.el-button + .el-button) {
      margin-left: 8px;
    }
  }
}

.table-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

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

.table-empty {
  padding: 40px 0;
  color: var(--el-text-color-secondary, #909399);
}

@media (max-width: 992px) {
  .container {
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
  }

  .search-panel {
    :deep(.el-col) {
      max-width: 50%;
      flex: 0 0 50%;
    }
  }
}

@media (max-width: 640px) {
  .search-panel {
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
