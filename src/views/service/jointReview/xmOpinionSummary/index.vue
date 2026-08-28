<!-- 项目意见汇总 -->
<template>
  <div class="container" v-if="isShowPage">
    <el-row :gutter="20" class="section">
      <el-col :span="6" class="left-column">
        <proTable
          @row-click="clickMeetingRow"
          ref="meetingTableRef"
          @search="searchMeetingPage"
          @reset="searchMeetingPage"
          :data-callback="callBackMeeting"
          :request-api="getMeetingList"
          :request-auto="true"
          :search-col="4"
          :columns="meetingColumns"
          :toolButton="['help']"
        >
          <template #tableHeader>
            <el-input v-model="searchKeyword" placeholder="搜索会议名称、编号..." class="search-input" clearable @change="searchMeeting">
              <template #prefix>
                <i style="font-size: 18px" class="el-icon-search"></i>
              </template>
            </el-input>
          </template>
          <template #headerButton>
            <el-tabs v-model="meetingTab" @tab-click="handleTabChange">
              <el-tab-pane label="全部" name="all" />
              <el-tab-pane label="评审中" name="01" />
              <el-tab-pane label="已结束" name="02" />
            </el-tabs>
          </template>
        </proTable>
      </el-col>
      <el-col :span="18" class="right-column">
        <div class="toolbar-section">
          <div class="search-group">
            <el-input
              v-model="rightSearchKeyword"
              placeholder="请输入项目名称查询..."
              class="copy-text-input w-64"
              clearable
              size="small"
              :disabled="meetingId == ''"
              @change="loadRightData"
            >
              <template #prepend>
                <div class="input-prepend">项目名称</div>
              </template>
            </el-input>
            <ReMultipleText
              v-model="rightProjectCode"
              placeholder="请输入项目编码,多个用逗号分隔"
              show-prepend
              prepend-label="项目编码"
              :disabled="meetingId == ''"
              class="w-64"
              @change="loadRightData"
            />
          </div>
          <div class="btn">
            <el-button :disabled="meetingId == ''" size="mini" type="primary" plain @click="refreshHandle">刷 新</el-button>
            <el-button :disabled="meetingId == ''" size="mini" type="primary" plain @click="exportHandle">导 出</el-button>
          </div>
        </div>
        <div class="right-column-table">
          <vxe-grid ref="xmTableRef" v-bind="gridProps" />
        </div>
        <el-pagination
          :page-size="xmListPage.pageSize"
          :current-page="xmListPage.currentPage"
          :page-sizes="[20, 50, 100, 500]"
          size="default"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="xmListPage.total"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </el-col>
    </el-row>
  </div>
  <!-- 登录 -->
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>
<script setup lang="ts" name="/service/jointReview/xmOpinionSummary/index">
import { ref, reactive, nextTick, onMounted } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import baseService from '@/service/baseService'
import { GlobalInfo } from '@/views/service/jointReview/expertReview/interface'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useUser } from '@/hooks/useUser'
import proTable from '@/components/ProTable/index.vue' //表格组件
import { getPublicData } from '@/api/common'
import { getMeetingPage, getDynamicColumn, getTableData, exportData } from '@/api/service/IhhsMeeting/xmOpinionSummary'

import ReMultipleText from '@/components/ReMultipleText/src/index.vue'
import { ElMessage } from 'element-plus'
import { apiExportHandle } from '@/utils/export'
import { formatValue } from '@/utils/utils'

const isShowPage = ref<boolean>(false)
const userDialogRef = ref()
const userInfo = ref<any>({})
const flag = ref<string>('')
const store = useStore()
const route = useRoute()

// 左侧会议 开始
const meetingTableRef = ref()
const searchKeyword = ref()
const meetingTab = ref('all')
const meetingId = ref('')
// 左侧会议 结束

// 右侧项目 开始
const xmTableRef = ref()
const rightSearchKeyword = ref('')
const rightProjectCode = ref('')
const xmListPage = reactive({
  currentPage: 1,
  pageSize: 100,
  total: 0
})
// 右侧项目 结束

const getReviewAuthParams = () => {
  return {
    dwId: userInfo.value.dwId || userInfo.value.org_id || '',
    bmId: userInfo.value.deptId || userInfo.value.specialorgid || '',
    roleId: userInfo.value.roleId || userInfo.value.role_id || ''
  }
}

onMounted(async () => {
  var isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    userInfo.value = store.getters.getJRGlobalInfo
  } else {
    await userDialogRef.value.getUser()
  }
})

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

// 导出
const exportHandle = () => {
  const params = {
    ...getReviewAuthParams(),
    meetingId: meetingId.value,
    xmmc: rightSearchKeyword.value,
    xmbmList: rightProjectCode.value ? rightProjectCode.value.split(',') : []
  }
  const fileName = '项目会审意见汇总表'
  apiExportHandle(params, fileName, exportData)
}

// 根据会议ID获取表头
const getMeetingForXm = async () => {
  const res: any = await getDynamicColumn({
    ...getReviewAuthParams(),
    meetingId: meetingId.value
  })
  if (res.success) {
    if (res.data.length == 0) return ElMessage.warning('暂无数据')
    gridProps.columns = handleColumns(res.data)
    if (meetingId.value != '') {
      await getDataByMeetingId()
    }
  } else {
    ElMessage.error(res.msg)
  }
}

//数据中金额保留小数点后六位
const formatterData = ({ cellValue, column }: any) => {
  if (typeof cellValue === 'undefined' || cellValue === null || cellValue === '') return '-'
  return formatValue(cellValue.toString(), 6)
}

// 表格对齐方式
const handleColumns = (data: any) => {
  data.forEach((item: any) => {
    item.headerAlign = item.title == '单位：万元' ? 'right' : 'center'
    item.align = ['xmgstz_sbys', 'xmgstz_sdje', 'xmgstz_hshj'].includes(item.field) ? 'right' : 'center'
    item.formatter = ['xmgstz_sbys', 'xmgstz_sdje', 'xmgstz_hshj'].includes(item.field) ? formatterData : null
    if (item.children.length != 0) {
      handleColumns(item.children)
    }
  })
  return data
}

//根据会议ID获取数据
const getDataByMeetingId = async () => {
  const params = {
    ...getReviewAuthParams(),
    limit: xmListPage.pageSize,
    page: xmListPage.currentPage,
    meetingId: meetingId.value,
    xmmc: rightSearchKeyword.value,
    xmbmList: rightProjectCode.value ? rightProjectCode.value.split(',') : []
  }
  const data: any = await getTableData({ ...params })
  gridProps.loading = true
  if (data.success) {
    if (data.data.length == 0) return ElMessage.warning('暂无数据')
    gridProps.data = data.data.records
    xmListPage.total = Number(data.data.total ?? '0')
    gridProps.loading = false
  } else {
    gridProps.loading = false
    ElMessage.error(data.msg)
  }
}

// 处理项目分页
const handleSizeChange = (val: number) => {
  xmListPage.pageSize = val
  xmListPage.currentPage = 1
  getDataByMeetingId()
}
//处理项目翻页
const handlePageChange = (val: number) => {
  xmListPage.currentPage = val
  getDataByMeetingId()
}

// 加载右侧业务数据
const loadRightData = async () => {
  getDataByMeetingId()
}

// 刷新数据
const refreshHandle = () => {
  rightSearchKeyword.value = ''
  rightProjectCode.value = ''
  xmListPage.pageSize = 100
  xmListPage.currentPage = 1
  xmListPage.total = 0
  if (meetingId.value == '') return
  getDataByMeetingId()
}

// 项目列表
const gridProps = reactive<any>({
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '92%',
  rowConfig: {
    height: 32,
    keyField: 'id'
  },
  border: true,
  columnConfig: {
    resizable: true
  },
  columns: [],
  data: []
})

// 会议数据回调
const callBackMeeting = (val: any) => {
  return val
}

// 会议数据
const getMeetingList = (params: any) => {
  params['searchParam'] = searchKeyword.value
  params['status'] = meetingTab.value == 'all' ? '' : meetingTab.value
  params['dwId'] = getReviewAuthParams().dwId
  params['bmId'] = getReviewAuthParams().bmId
  params['roleId'] = getReviewAuthParams().roleId
  return getMeetingPage(params)
}

// 根据会议编码和会议名称查询会议
const searchMeeting = async () => {
  meetingTab.value = 'all'
  gridProps.columns.length = 0
  gridProps.data.length = 0
  meetingId.value = ''
  searchMeetingPage()
}
// 根据状态查询会议
const handleTabChange = () => {
  searchMeetingPage()
}

// 会议选中行
const clickMeetingRow = (row: any) => {
  meetingTableRef.value?.clearSelection()
  meetingTableRef.value?.element.toggleRowSelection(row)
  meetingId.value = row?.meeting_id
  getMeetingForXm()
}
// 会议查询/重置回调
const searchMeetingPage = () => {
  meetingTableRef.value?.clearSelection()
  meetingTableRef.value?.getTableList()
  refreshHandle()
}
// 会议列表
const meetingColumns = reactive<any>([
  { type: 'index', width: 50, label: '序号' },
  {
    prop: 'status',
    label: '会议状态',
    enum: () => getPublicData('LHHS_MEETING_STATUS'),
    tag: true,
    fieldNames: { label: 'name', value: 'code' },
    width: '80'
  },
  { prop: 'meeting_code', label: '会议编号', width: '100' },
  { prop: 'meeting_name', label: '会议名称', width: '150' }
  // { prop: 'majorName', label: '评审专业', width: '220' }
])
</script>

<style scoped lang="less">
@import 'css/index';
</style>
