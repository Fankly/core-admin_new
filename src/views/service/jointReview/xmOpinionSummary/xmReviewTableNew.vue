<!-- 项目意见汇总-备份 -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <ProTable
      @row-click="rowClick"
      row-key="meetingId"
      @search="clearSelect"
      @reset="handleReset"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :request-error="handleRequestError"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="lhhsMeeting"
      ref="proTableRef"
      :row-style="rowStyle"
    >
      <template #tableHeader="scope"> </template>
    </ProTable>
  </div>
  <!-- 权限选择 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <!-- 会审意见汇总 -->
  <reviewTable ref="reviewTableRef" />
</template>
<script setup lang="ts" name="/service/jointReview/xmOpinionSummary/xmReviewTable">
import { onMounted, reactive, ref } from 'vue'
import reviewTable from '@/views/service/jointReview/xmOpinionSummary/components/reviewTable.vue'
import { getPublicData, getGkbmInProvince } from '@/api/common'
import ProTable from '@/components/ProTable/index.vue'
import userDialog from '@/components/select/userDialog.vue'
import { useUser } from '@/hooks/useUser'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { getMeetingPage } from '@/api/service/IhhsMeeting/xmOpinionSummary'
import { getAllBatchList } from '@/api/service/IhhsMeeting/approval/batch'
import baseService from '@/service/baseService'
import { GlobalInfo } from '@/views/service/jointReview/expertReview/interface'
import { formatNumValue, pxWidth } from '@/utils/utils'

const userDialogRef = ref()
const isShowPage = ref(false)
const route = useRoute()
const store = useStore()
const flag = ref<string>('')
const userInfo = ref<any>({})
const reviewTableRef = ref()

const getReviewAuthParams = () => {
  return {
    dwId: userInfo.value.dwId || userInfo.value.org_id || '',
    bmId: userInfo.value.deptId || userInfo.value.specialorgid || '',
    roleId: userInfo.value.roleId || userInfo.value.role_id || ''
  }
}

// 查看项目会审意见汇总
const openModal = (selectedList: any) => {
  const meetingInfo = selectedList[0]
  reviewTableRef.value.getMeetingForXm(meetingInfo.meeting_id, getReviewAuthParams())
}

const proTableRef = ref<any>(null)
const loading = ref(false)
const tableColumnFont = '14px Microsoft YaHei'
const tableColumnPadding = 56
const tableColumnMinWidth = 100

const clearSelect = () => {
  proTableRef.value?.clearSelection()
}

// 加载评审批次选项（可按年度过滤），写入 ProTable 的 enumMap 实现联动
const loadBatchOptions = async (nd?: string) => {
  const enumMap = proTableRef.value?.enumMap
  if (!enumMap) return
  enumMap.set('pspcId', [])
  try {
    const { dwId, bmId } = getReviewAuthParams()
    const res = await getAllBatchList({ dwId, bmId, nd })
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

const rowClick = (row: any) => {
  clearSelect()
  proTableRef.value?.element.toggleRowSelection(row)
}
const getPageList = (params: any) => {
  loading.value = true
  params['dwId'] = getReviewAuthParams().dwId
  params['bmId'] = getReviewAuthParams().bmId
  params['roleId'] = getReviewAuthParams().roleId
  return getMeetingPage(params)
}

const callBackHandle = (val: any) => {
  const records = Array.isArray(val?.records) ? val.records : []
  updateAutoColumnWidths(records)
  loading.value = false
  return val
}

// 请求失败时关闭 loading，避免页面永久转圈
const handleRequestError = () => {
  loading.value = false
}

// 获取会议状态公共代码，并为每项计算 tag 类型
const getStatusEnum = () => {
  return getPublicData('LHHS_MEETING_STATUS').then((res) => {
    const tagType = ['info', 'warning', 'success']
    const statusData: any[] = res.data || []
    for (let i = 0; i < statusData.length; i++) {
      statusData[i].tagType = i > 3 ? 'danger' : tagType[i]
    }
    return res
  })
}

const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { prop: 'pspc_name', label: '批次名称', width: getAutoColumnWidth('批次名称', 'pspc_name') },
  { prop: 'meeting_name', label: '会议名称', width: getAutoColumnWidth('会议名称', 'meeting_name') },
  { prop: 'meeting_code', label: '会议编号', width: 150 },
  {
    prop: 'status',
    label: '会议状态',
    enum: getStatusEnum,
    tag: true,
    search: {
      el: 'select',
      order: 5,
      props: {
        filterable: true
      }
    },
    fieldNames: { label: 'name', value: 'code' },
    width: 80
  },
  {
    prop: 'zgkbmId',
    label: '省专业归口',
    enum: () => getGkbmInProvince(),
    search: { el: 'select', order: 4 },
    fieldNames: {
      label: 'name',
      value: 'code',
      props: {
        filterable: true
      }
    },
    isShow: false
  },
  { prop: 'bm_name', label: '省专业归口', width: 150 },
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
  { prop: 'major_name', label: '评审专业', width: 190 },
  { prop: 'lhhs_one_start_time', label: '线上预审开始日期', width: 150 },
  { prop: 'lhhs_one_end_time', label: '线上预审结束日期', width: 150 },
  { prop: 'lhhs_two_start_time', label: '线下会审开始日期', width: 150 },
  { prop: 'lhhs_two_end_time', label: '线下会审结束日期', width: 150 }
])

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
    { prop: 'pspc_name', label: '批次名称' },
    { prop: 'meeting_name', label: '会议名称' }
  ]
  autoWidthColumns.forEach(({ prop, label }) => {
    const column = tableColumns.find((item) => item.prop === prop)
    if (column) {
      column.width = getAutoColumnWidth(label, prop, records)
    }
  })
}

onMounted(async () => {
  const isRole = await useUser('getJRGlobalInfo')
  if (isRole && route.params.formJsc) {
    userInfo.value = store.getters.getJRGlobalInfo
    isShowPage.value = true
  } else {
    await userDialogRef.value.getUser()
  }
})

function rowStyle({ row }: any) {
  if (row['pspc_type'] == '2') {
    return { color: 'red' }
  }
}

const getRoleHandle = async () => {
  try {
    isShowPage.value = false
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      const flagData = await baseService.post(`/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`)
      if (flagData.success && flagData.data) {
        flag.value = flagData.data
        const globalInfo: GlobalInfo = {
          userId: store.getters.getUserMsg.id,
          deptId: userInfo.value.specialorgid,
          deptName: userInfo.value.specialorgname,
          dwId: userInfo.value.org_id,
          dwName: userInfo.value.org_name,
          roleId: userInfo.value.role_id,
          roleCode: userInfo.value.code,
          spRoleId: userInfo.value.id,
          specialorgcode: userInfo.value.specialorgcode,
          fqzzFlag: flag.value
        }
        store.commit('setJRGlobalInfo', globalInfo)
        isShowPage.value = true
      }
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
  background-color: #fff;
}
</style>
