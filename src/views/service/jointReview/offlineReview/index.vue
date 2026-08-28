<template>
  <div class="container" v-loading="loading">
    <ProTable
      height="100%"
      row-key="meetingId"
      @selection-change="handleSelectionChange"
      @search="clearSelect"
      @reset="handleReset"
      @row-click="handleClickRow"
      v-if="isShowPage"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="lhhsMeeting"
      ref="proTableRef"
      :row-style="rowStyle"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <div class="operation">
          <div class="operation-left">
            <el-button
              size="mini"
              v-permission="'XXHS'"
              :disabled="scope.selectedList.length != 1"
              type="primary"
              @click="reviewMeeting(scope['selectedList'])"
              plain
              >线下会审</el-button
            >
            <el-button
              size="mini"
              v-permission="'ZJPSJD'"
              :disabled="scope.selectedList.length != 1"
              type="primary"
              @click="openExpertProcess(scope['selectedList'])"
              plain
              >专家评审进度</el-button
            >
          </div>

          <div class="operation-right">
            <div class="operation-right-info">
              <div class="highlight">
                <dt> 部门名称:</dt>
                <dd>{{ bmInfo['name'] }}</dd>
              </div>
            </div>
          </div>
        </div>
      </template>
    </ProTable>
    <!-- 权限选择 -->
    <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
    <ExpertManagementModal ref="expertManagementModalRef" />
    <ExpertProcessModal ref="expertProcessModalRef" />
  </div>
</template>

<script setup lang="tsx" name="/service/jointReview/offlineReview/index">
import { nextTick, onMounted, reactive, ref, h, defineAsyncComponent } from 'vue'
import { pageSjtcMeetingInfo } from '@/api/service/IhhsMeeting/offlineReview'
import { getPublicData, getGkbmInProvince } from '@/api/common'
import { getAllBatchList } from '@/api/service/IhhsMeeting/approval/batch'
import { ElButton, ElMessage } from 'element-plus'
import { formatNumValue, pxWidth } from '@/utils/utils'
import ProTable from '@/components/ProTable/index.vue'
import userDialog from '@/components/select/userDialog.vue'
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

const userDialogRef = ref()
const isShowPage = ref(false)
const route = useRoute()
const router = useRouter()
const proTableRef = ref<any>(null)
const expertManagementModalRef = ref()
const expertProcessModalRef = ref()
const taskAssignmentModalRef = ref()
const isDisabled = ref(true)
const loading = ref(false)
const statusEnum = ref<any>([])
const store = useStore()
const { loadReviewModeOptions, getReviewModeName, hasReviewMode } = useReviewModeCode()
const bmInfo = ref<{
  name: string
  code: string
}>({
  name: '',
  code: ''
})

const tableColumnFont = '14px Microsoft YaHei'
const tableColumnPadding = 56
const tableColumnMinWidth = 100

const userInfo = ref<{
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
  roleId: string
  fqzzFlag: string
}>({
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
const clearSelect = () => {
  proTableRef.value?.clearSelection()
}

// 加载评审批次选项（可按年度过滤），写入 ProTable 的 enumMap 实现联动
const loadBatchOptions = async (nd?: string) => {
  const enumMap = proTableRef.value?.enumMap
  if (!enumMap) return
  enumMap.set('pspcId', [])
  try {
    const res = await getAllBatchList({
      dwId: userInfo.value.dwId,
      bmId: userInfo.value.deptId,
      nd
    })
    if (res.success) enumMap.set('pspcId', res.data || [])
  } catch (e) {
    // 拉取失败时保持为空选项
  }
}

// 年度变化时，清空已选评审批次并按年度重新加载批次选项
const handleNdChange = (nd: string) => {
  const searchParam = proTableRef.value?.searchParam
  if (searchParam) searchParam.pspcId = ''
  loadBatchOptions(nd)
}

// 重置时清空选中并恢复完整评审批次选项
const handleReset = () => {
  clearSelect()
  loadBatchOptions()
}

// 单击行选中当前行
const handleClickRow = async (val: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element.toggleRowSelection(val)
  })
}
const getPageList = (params: any) => {
  loading.value = true
  params['bmId'] = userInfo.value.deptId
  params['roleCode'] = userInfo.value.roleCode
  params['bmxz'] = userInfo.value.specialorgcode
  params['username'] = store.getters.getUserMsg?.namecode
  params['orgFlag'] = userInfo.value.fqzzFlag

  if (params.startTimeBegin) {
    let startTimeBegin: any = params.startTimeBegin
    params.startTimeBegin = startTimeBegin[0]
    params.startTimeEnd = startTimeBegin[1]
  }
  return pageSjtcMeetingInfo(params)
}

const callBackHandle = (val: any) => {
  loading.value = false
  const records = Array.isArray(val?.records) ? val.records : []
  updateAutoColumnWidths(records)
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
    for (let i = 0; i < statusData.length; i++) {
      const tagType = ['info', 'warning', 'success']
      if (i > 3) {
        statusData[i].tagType = 'danger'
      } else {
        statusData[i].tagType = tagType[i]
      }
    }
    statusEnum.value.push(...statusData)
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
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

// 线下评审
const reviewMeeting = (selectList: any) => {
  const meetingInfo = selectList[0]
  const str = encrypt(
    JSON.stringify({
      meetingId: meetingInfo.meetingId,
      status: meetingInfo.status,
      tag: 'review',
      deptId: userInfo.value.deptId,
      deptName: userInfo.value.deptName,
      dwId: userInfo.value.dwId,
      dwName: userInfo.value.dwName,
      roleId: userInfo.value.roleId,
      roleCode: userInfo.value.roleCode,
      spRoleId: userInfo.value.spRoleId,
      specialorgcode: userInfo.value.specialorgcode,
      startTime: meetingInfo.startTime,
      endTime: meetingInfo.endTime,
      canRerun: route.query.source === 'reviewWorkBench' ? route.query.canRerun === '1' : undefined
    })
  )
  router.push({
    name: '/service/jointReview/offlineReview/projectManifest',
    query: {
      meetingParams: str
    }
  })
}

// 专家评审进度
const openExpertProcess = (selectList: any[] = []) => {
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

function getTableCellText(value: any) {
  if (value === undefined || value === null) return ''
  return String(value)
}

function getTextWidthWithPadding(value: any) {
  return Math.ceil(pxWidth(getTableCellText(value), tableColumnFont) + tableColumnPadding)
}

function getAutoColumnWidth(label: string, prop: string, records: any[] = []) {
  const titleWidth = getTextWidthWithPadding(label)
  const contentWidth = records.reduce((width, row) => Math.max(width, getTextWidthWithPadding(row?.[prop])), 0)
  return Math.max(tableColumnMinWidth, titleWidth, contentWidth)
}

function updateAutoColumnWidths(records: any[] = []) {
  const autoWidthColumns = [
    { prop: 'pspcName', label: '批次名称' },
    { prop: 'meetingName', label: '会议名称' }
  ]
  autoWidthColumns.forEach(({ prop, label }) => {
    const column = tableColumns.find((item) => item.prop === prop)
    if (column) {
      column.width = getAutoColumnWidth(label, prop, records)
    }
  })
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50, fixed: 'left' },
  {
    prop: 'pspcName',
    label: '评审批次',
    fixed: 'left',
    width: getAutoColumnWidth('批次名称', 'pspcName')
  },
  {
    prop: 'meetingName',
    label: '会议名称',
    search: {
      el: 'input',
      order: 1
    },
    fixed: 'left',
    width: getAutoColumnWidth('会议名称', 'meetingName')
  },
  {
    prop: 'status',
    label: '会议状态',
    enum: statusEnum.value,
    tag: true,
    search: {
      el: 'select',
      order: 3
    },
    fieldNames: { label: 'name', value: 'code' },
    width: '80'
  },
  {
    prop: 'nd',
    label: '年度',
    enum: () => getPublicData('ZLYS_XMJHSSND'),
    search: {
      el: 'select',
      order: 4,
      props: {
        filterable: true,
        onChange: handleNdChange
      }
    },
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'pspcId',
    label: '评审批次',
    enum: () => getAllBatchList({ dwId: userInfo.value.dwId, bmId: userInfo.value.deptId }),
    search: {
      el: 'select',
      order: 5,
      props: {
        filterable: true
      }
    },
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'zgkbmId',
    label: '归口部门',
    enum: () => getGkbmInProvince(),
    search: {
      el: 'select',
      order: 6,
      props: {
        filterable: true
      }
    },
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'startTimeBegin',
    label: '评审时间从',
    isShow: false,
    search: {
      el: 'date-picker',
      order: 2,
      span: 2,
      props: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        clearable: true
      }
    }
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
    prop: 'bmName',
    label: '专业部门',
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
        () => getReviewModeName(row.psms, '-')
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
    prop: 'yslyName',
    label: '预算来源',
    width: '100'
  },
  { prop: 'startTime', label: '线下会审开始时间', width: '150' },
  { prop: 'endTime', label: '线下会审结束时间', width: '150' },
  {
    prop: 'majorName',
    label: '评审专业',
    width: '220'
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

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value.userMsg
  if (isQuery) {
    const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfOther.specialorgid}`)
    if (flagData.success && flagData.data) {
      const userInfoOthers = {
        deptId: userInfOther.specialorgid,
        deptName: userInfOther.specialorgname,
        dwId: userInfOther.org_id,
        dwName: userInfOther.org_name,
        roleId: userInfOther.role_id,
        roleCode: userInfOther.code,
        spRoleId: userInfOther.id,
        specialorgcode: userInfOther.specialorgcode,
        fqzzFlag: flagData.data
      }
      userInfo.value = userInfoOthers
      store.commit('setJRGlobalInfo', userInfoOthers)
      await getGkbmInfoData(userInfoOthers.deptId)
      isShowPage.value = true
    }
  }
}

const getGkbmInfoData = async (bmId: string) => {
  try {
    const res = await getGkbmInProvince()
    if (!res.success) throw new Error(res.msg)
    const currentDepartment = (res.data || []).find((item: any) => item.id === bmId || item.code === bmId)
    bmInfo.value = {
      name: currentDepartment?.name || userInfo.value.deptName || '',
      code: currentDepartment?.code || bmId || ''
    }
  } catch (error) {
    ElMessage.error((error as Error).message)
  }
}

const initParams = () => {
  getPublicCodeData()
  loadReviewModeOptions()
}

function rowStyle({ row }: any) {
  if (row['pspcType'] == '2') {
    return { color: 'red' }
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
    await getGkbmInfoData(userInfo.value.deptId)
    isShowPage.value = true
  } else {
    await nextTick()
    if (userDialogRef.value) await userDialogRef.value.getUser()
  }
})
</script>

<style scoped lang="less">
.container {
  height: 100%;
  padding: 10px;

  .operation {
    display: flex;
    min-height: 100%;
    margin-bottom: 6px;

    &-left {
      min-width: 400px;
    }

    &-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex: 1 1 auto;

      :deep(.el-select) {
        width: 120px;
      }

      &-info {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 0;
        margin-right: 10px;

        .highlight {
          display: inline-flex;
          align-items: center;
          font-size: 14px;
          padding: 4px 12px;
          background-color: var(--el-fill-color-light, #f5f7fa);
          border: 1px solid var(--el-border-color-light, #dcdfe6);
          border-radius: 4px;
          white-space: nowrap;
          transition: background-color 0.2s;
          max-width: 240px;

          &:hover {
            background-color: var(--el-fill-color, #e6e8eb);
          }

          dt {
            color: var(--el-text-color-regular, #606266);
            font-weight: normal;
            margin: 0;
          }

          dd {
            font-weight: 600;
            color: var(--el-text-color-primary, #303133);
            margin: 0 0 0 6px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      &-tool__button {
        margin-left: 10px;
      }
    }
  }
}
</style>
