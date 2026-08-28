<!-- 联合会审评审报告管理 -->
<template>
  <div class="container" v-loading="loading" v-show="isShowPage">
    <viewTable v-if="isShowPage" ref="tableRef" :type="'report'" :tableColumns="tableColumns" @page-type="handleReview" @file-type="fileType" />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>
<script lang="ts">
export default {
  name: '/service/ywpt/reportMahg'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { endMeeting, startMeeting, generateReviewReport, removeFinalReport } from '@/api/service/jointReview'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useUser } from '@/hooks/useUser'
import viewTable from '@/views/service/ywpt/components/viewTable.vue'
import { encrypt } from '@/utils/crypto'

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

// 方法
const fileType = (val: any) => {
  if (val) {
    tableRef.value?.proTableRef.getTableList()
    tableRef.value?.proTableRef.clearSelection()
  }
}

//查看专家评审意见
const handleReview = async (val: any) => {
  let meetingInfoList: any = []
  let meetingIdList: any = []
  const isOverMeeting = val.selectedList.every((item: any) => item.finalReportUuid)
  if (['结束会议', '评审报告生成'].includes(val.value)) {
    val.selectedList.forEach((item: any) => {
      meetingInfoList.push({ meetingId: item.meetingId, meetingName: item.meetingName })
    })
  }
  if (val.value == '重新打开会议') {
    val.selectedList.forEach((item: any) => {
      meetingIdList.push(item.meetingId)
    })
  }
  if (['结束会议', '评审报告删除'].includes(val.value) && !isOverMeeting) {
    return ElMessage.warning('所选会议包含评审意见报告(定稿)未上传,请重新选择')
  }
  if (val.value == '查看专家评审意见') {
    var str = encrypt(
      JSON.stringify({
        meetingId: val.selectedList[0].meetingId,
        deptId: userInfo.value.specialorgid,
        dwId: userInfo.value.org_id,
        dwName: userInfo.value.org_name
      })
    )
    router.push({
      name: '/service/ywpt/reportReview',
      query: {
        Meetingparams:str
      }
    })
  } else {
    const text = val.value == '评审报告删除' ? `删除已上传评审报告？` : val.value
    ElMessageBox.confirm(`是否${text}？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        let res: any =
          val.value == '结束会议'
            ? await endMeeting({ meetingInfoList: meetingInfoList })
            : val.value == '重新打开会议'
            ? await startMeeting({ meetingIdList: meetingIdList })
            : val.value == '评审报告删除'
            ? await removeFinalReport(val.selectedList[0].meetingId)
            : await generateReviewReport({ meetingInfoList: meetingInfoList })
        if (res.success) {
          ElMessage({ type: 'success', message: `${val.value}成功` })
          meetingInfoList.length == 0
          meetingIdList.length == 0
          tableRef.value?.proTableRef.getTableList()
          tableRef.value?.proTableRef.clearSelection()
        } else {
          ElMessage({ type: 'error', message: res.msg })
        }
      })
      .catch((error: any) => {
        console.log(error)
      })
  }
}
// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    specialOrgId.value = userDialogRef.value.specialorgid
    sessionStorage.setItem(
      'jointInfoLeader',
      JSON.stringify({
        deptId: userInfo.value.deptId,
        deptName: userInfo.value.deptName,
        dwId: userInfo.value.dwId,
        dwName: userInfo.value.dwName
      })
    )
    if (isQuery) {
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}
// 方法
onMounted(async () => {
  var isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    userInfo.value = store.getters.getJRGlobalInfo
    isShowPage.value = true
    sessionStorage.setItem(
      'jointInfoLeader',
      JSON.stringify({
        deptId: userInfo.value.deptId,
        deptName: userInfo.value.deptName,
        dwId: userInfo.value.dwId,
        dwName: userInfo.value.dwName
      })
    )
  } else {
    await userDialogRef.value.getUser()
  }
})
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
  { prop: 'isLeaderReview', label: '是否完成终评', width: '100' },
  {
    prop: 'reportStatus',
    label: '评审报告状态',
    width: '100',
    tag: true,
    enum: [
      { label: '已生成', value: '已生成', tagType: 'success' },
      { label: '生成中', value: '生成中', tagType: 'warning' },
      { label: '未生成', value: '未生成', tagType: 'info' }
    ]
  },
  { prop: 'major', label: '评审专业' },
  { prop: 'createUserName', label: '组织人', width: '80' },
  { prop: 'leaderName', label: '专家组长', width: '80' },
  { prop: 'startTime', label: '会议开始时间', width: '150' },
  { prop: 'endTime', label: '会议结束时间', width: '150' },
  { prop: 'reportType', label: '评审意见报告(初稿)', width: '140' },
  { prop: 'finalReportName', label: '评审意见报告(定稿)', width: '140' },
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
