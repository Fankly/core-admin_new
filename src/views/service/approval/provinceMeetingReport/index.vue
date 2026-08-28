<!-- 联合会审会议通过率统计分析 -->
<template>
  <div class="container" v-loading="loading">
    <ProTable
      height="100%"
      @row-click="rowClick"
      row-key="meetingId"
      @selection-change="handleSelectionChange"
      @search="clearSelect"
      @reset="handleReset"
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
            <el-button v-permission="'VIEW'" size="mini" type="primary" plain @click="openModal(scope['selectedList'])"> 统计分析 </el-button>
            <el-button v-permission="'EXPORT'" size="mini" type="primary" plain @click="handleExport"> 导 出 </el-button>
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
    <TheesMeetingEdit @clearSelect="clearSelect" ref="modalRef" />
    <ReviewExpertModal @clearSelect="clearSelect" ref="reviewExpertModalRef" />
    <ReviewProModal @clearSelect="clearSelect" ref="reviewProModalRef" />
    <!-- 权限选择 -->
    <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
    <ExpertManagementModal ref="expertManagementModalRef" />
    <TaskAssignmentModal @allocated="searchData" ref="taskAssignmentModalRef" />
    <DimensionStatistics ref="DimensionStatisticsRef" />
  </div>
</template>

<script setup lang="tsx" name="/service/approval/provinceMeetingReport/index">
import { nextTick, onMounted, reactive, ref, h, defineAsyncComponent, computed } from 'vue'
import { tjfxGetPage, tjfxExportPage } from '@/api/service/IhhsMeeting/approval/proviceIhhsMeeting'
import { getPublicData, getGkbmInProvince, getSubProtypeTree } from '@/api/common'
import { getAllBatchList } from '@/api/service/IhhsMeeting/approval/batch'
import { ElButton, ElMessage } from 'element-plus'
import { formatNumValue, pxWidth } from '@/utils/utils'
import ProTable from '@/components/ProTable/index.vue'
import TheesMeetingEdit from '@/views/service/approval/provinceLhhsMeeting/components/TheesMeetingEdit'
import ReviewExpertModal from '@/views/service/approval/provinceLhhsMeeting/components/ReViewModal/reviewExpertModal.vue'
import ReviewProModal from '@/views/service/approval/provinceLhhsMeeting/components/ReViewModal/reviewProModal.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useUser } from '@/hooks/useUser'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import DimensionStatistics from './components/DimensionStatistics/index.vue'
import { useReviewModeCode } from '@/hooks/useReviewModeCode'
import { downloadExportBlob } from '@/views/service/approval/provinceLhhsMeeting/utils/download'
import { getEjdwList, getYjdwList } from '@/api/ai/smartTaskAudit'
import ElTreeSelect from '@/components/ElTreeSelect/index'

interface bmInfoVo {
  name: string
  code: string
}

const ExpertManagementModal = defineAsyncComponent(
  () => import('@/views/service/approval/provinceLhhsMeeting/components/expertManagementModal/index.vue')
)

const TaskAssignmentModal = defineAsyncComponent(
  () => import('@/views/service/approval/provinceLhhsMeeting/components/taskAssignmentModal/index.vue')
)

const userDialogRef = ref()
const isShowPage = ref(false)
const route = useRoute()

const proTableRef = ref<any>(null)
const modalRef = ref<InstanceType<typeof TheesMeetingEdit> | null>(null)
const reviewExpertModalRef = ref<InstanceType<typeof ReviewExpertModal>>()

const expertManagementModalRef = ref()
const taskAssignmentModalRef = ref()
const DimensionStatisticsRef = ref<InstanceType<typeof DimensionStatistics>>()
const reviewProModalRef = ref<InstanceType<typeof ReviewProModal>>()

const isDisabled = ref(true)
const loading = ref(false)
const yjdwList = ref<any[]>([])
const ejdwList = ref<any[]>([])
const projectTypeList = ref<any[]>([])

const statusEnum = ref<any>([])
const { loadReviewModeOptions, getReviewModeName: getPsmsName } = useReviewModeCode()

const store = useStore()
const bmInfo = ref<bmInfoVo>({
  name: '',
  code: ''
})

const proTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

const tableColumnFont = '14px Microsoft YaHei'
const tableColumnPadding = 56
const tableColumnMinWidth = 100
const apiParams = ref<any>([])

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
const clearSelect = () => {
  proTableRef.value?.clearSelection()
}

// 重置时清空选中并恢复完整评审批次选项
const handleReset = () => {
  ejdwList.value.length = 0
  clearSelect()
  loadBatchOptions()
}

const rowClick = (row: any) => {
  clearSelect()
  proTableRef.value?.element.toggleRowSelection(row)
}

const getPageList = (params: any) => {
  loading.value = true
  params['current'] = params['page']
  params['size'] = params['limit']
  params['bmId'] = userInfo.value.deptId
  params['dwId'] = userInfo.value.dwId
  params['roleId'] = userInfo.value.roleId
  apiParams.value = { ...params }
  return tjfxGetPage(params).finally(() => {
    loading.value = false
  })
}

const callBackHandle = (val: any) => {
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
    const tagType = ['info', 'warning', 'success', 'danger']
    for (let i = 0; i < statusData.length; i++) {
      statusData[i].tagType = tagType[i] || 'danger'
    }
    statusEnum.value.push(...statusData)
  } catch (e: any) {
    ElMessage.error(e.toString())
  }
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

function rowStyle({ row }: any) {
  if (row['pspcType'] == '2') {
    return { color: 'red' }
  }
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

const initParamLists = async () => {
  yjdwList.value.length = 0
  projectTypeList.value.length = 0
  let res: any = await getYjdwList({ bmId: userInfo.value.deptId, dwId: userInfo.value.dwId })
  if (res.success && res.data.length !== 0) {
    yjdwList.value.push(...res.data)
  }
  let xmlx = await getSubProtypeTree()
  if (xmlx.success && xmlx.data.length !== 0) {
    projectTypeList.value.push(...xmlx.data)
  }
}

const selectChange = async (val: any) => {
  const params = proTableRef.value?.searchParam
  params.ejdw = ''
  ejdwList.value.length = 0
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
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 40, fixed: 'left' },
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
      order: 4,
      props: {
        maxlength: 120
      }
    },
    fixed: 'left',
    width: getAutoColumnWidth('会议名称', 'meetingName')
  },
  {
    prop: 'nd',
    label: '年度',
    enum: () => getPublicData('ZLYS_XMJHSSND'),
    search: {
      el: 'select',
      order: 1,
      props: {
        filterable: true,
        onChange: handleNdChange
      }
    },
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    isShow: false
  },
  {
    prop: 'pspcId',
    label: '评审批次',
    enum: () => getAllBatchList({ dwId: userInfo.value.dwId, bmId: userInfo.value.deptId }),
    search: {
      el: 'select',
      order: 2,
      props: {
        filterable: true
      }
    },
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    isShow: false
  },
  {
    prop: 'zgkbmId',
    label: '专业部门',
    enum: () => getGkbmInProvince(),
    search: {
      el: 'select',
      order: 3,
      props: {
        filterable: true
      }
    },
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    isShow: false
  },
  {
    prop: 'status',
    label: '会议状态',
    enum: statusEnum.value,
    tag: true,
    search: {
      el: 'select',
      order: 6
    },
    fieldNames: {
      label: 'name',
      value: 'code'
    },
    width: 100
  },
  {
    prop: 'meetingCode',
    label: '会议编号',
    search: {
      el: 'input',
      order: 5,
      props: {
        maxlength: 120
      }
    },
    width: 110
  },
  {
    prop: 'bmName',
    label: '专业部门',
    width: 150
  },
  {
    prop: 'yjdw',
    label: '一级单位',
    width: 150,
    search: { el: 'select', props: { onChange: selectChange }, order: 7 },
    enum: yjdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'ejdw',
    label: '二级单位',
    width: 150,
    search: { el: 'select', order: 8 },
    enum: ejdwList.value,
    fieldNames: { label: 'name', value: 'code' },
    isShow: false
  },
  {
    prop: 'proType',
    label: '项目类型',
    width: 150,
    search: {
      order: 9,
      render: (scope: any) => {
        return (
          <ElTreeSelect
            showCheckbox
            collapseTags
            clearable
            data={projectTypeList.value}
            props={proTypeProps}
            nodeKey={'middleId'}
            modelValue={scope.modelValue}
          />
        )
      }
    },
    isShow: false
  },
  {
    prop: 'yssx',
    label: '预算事项',
    search: {
      el: 'input',
      order: 10,
      props: {
        maxlength: 120
      }
    },
    isShow: false
  },
  {
    prop: 'sbje',
    label: '初始申报金额（万元）',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      return formatNumValue(scope.row.sbje, 6)
    }
  },
  {
    prop: 'nhje',
    label: '首次纳会金额（万元）',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      return formatNumValue(scope.row.nhje, 6)
    }
  },
  {
    prop: 'sdje',
    label: '审定金额（万元）',
    width: 140,
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      return formatNumValue(scope.row.sdje, 6)
    }
  },
  {
    prop: 'hjje',
    label: '会审核减（万元）',
    width: 140,
    align: 'right',
    headerAlign: 'center',
    render: (scope: any) => {
      return formatNumValue(scope.row.hjje, 6)
    }
  },
  {
    prop: 'hjl',
    label: '核减率(%)',
    width: 100,
    align: 'center',
    headerAlign: 'center'
  },
  {
    prop: 'xmNum',
    label: '评审项目数量',
    width: 100
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
        () => getPsmsName(row.psms) || '-'
      )
    }
  },
  {
    prop: 'meetingAddr',
    label: '会议地点',
    width: 180
  },
  {
    prop: 'organizer',
    label: '组织人',
    width: 80
  },
  {
    prop: 'phone',
    label: '组织电话',
    width: 110
  },
  {
    prop: 'yslyName',
    label: '预算来源',
    width: 100
  },
  {
    prop: 'lhhsSkTime',
    label: '需求申请与提报截止日期',
    width: 180
  },
  {
    prop: 'lhhsOneStartTime',
    label: '线上预审开始日期',
    width: 180
  },
  {
    prop: 'lhhsOneEndTime',
    label: '线上预审结束日期',
    width: 180
  },
  {
    prop: 'lhhsTwoStartTime',
    label: '线下会审开始日期',
    width: 180
  },
  {
    prop: 'lhhsTwoEndTime',
    label: '线下会审结束日期',
    width: 180
  },
  {
    prop: 'majorName',
    label: '评审专业',
    width: '220'
  }
])

const openModal = async (selectedData: any[] = []) => {
  if (selectedData.length == 0) return ElMessage.warning('请选择数据进行统计分析操作!')
  const meetingIds = selectedData.map((item: any) => item.meetingId)
  const moadlParams = {
    ...apiParams.value,
    meetingIds: meetingIds
  }
  DimensionStatisticsRef.value?.open({...moadlParams})
}

const handleExport = async () => {
  loading.value = true
  let params = {
    ...proTableRef.value?.searchParam
  }
  params['bmId'] = userInfo.value.deptId
  params['roleId'] = userInfo.value.roleId
  try {
    const api = tjfxExportPage
    const blob: any = await api(params)
    downloadExportBlob(blob, '联合会审会议导出.xlsx')
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const getRoleHandle = async () => {
  const isQuery = userDialogRef.value.isQuery
  const userInfOther = userDialogRef.value.userMsg
  if (isQuery) {
    const userInfoOthers = {
      deptId: userInfOther.specialorgid,
      deptName: userInfOther.specialorgname,
      dwId: userInfOther.org_id,
      dwName: userInfOther.org_name,
      roleId: userInfOther.role_id,
      roleCode: userInfOther.code,
      spRoleId: userInfOther.id,
      specialorgcode: userInfOther.specialorgcode
    }
    userInfo.value = userInfoOthers
    store.commit('setJRGlobalInfo', userInfoOthers)
    await getGkbmInfoData(userInfoOthers.deptId)
    await initParamLists()
    isShowPage.value = true
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
    await getGkbmInfoData(userInfo.value.deptId)
    await initParamLists()
    isShowPage.value = true
  } else {
    await nextTick()
    if (userDialogRef.value) await userDialogRef.value.getUser()
  }
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
