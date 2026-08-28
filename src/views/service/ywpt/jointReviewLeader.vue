<!-- 联合会审组长终审（专家组长使用） -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <viewTable ref="tableRef" :type="'leader'" :tableColumns="tableColumns" @page-type="handleReview" @cell-type="cellType" />
  </div>
  <pro-assigned ref="proAssignedRef" />
  <select-modal
    ref="selectModalRef"
    @show-modal="showModal"
    :title="'评审模式'"
    :label="'评审模式'"
    :options="reviewModeOptions"
    :loading="reviewModeLoading"
    :disabled="reviewModeLoadFailed"
  />
  <proAssignedModal @include-in-review="clearSelect" ref="proAssignedModalRef" />

  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>
<script lang="ts">
export default {
  name: '/service/ywpt/jointReviewLeader'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import { ref, reactive, onMounted, nextTick, h } from 'vue'
import { getExpertInfoByCurrentUser, startReview, closeReview, psfg } from '@/api/service/jointReview'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useUser } from '@/hooks/useUser'
import viewTable from '@/views/service/ywpt/components/viewTable.vue'
import selectModal from '@/views/service/ywpt/components/selectModal.vue'
import proAssigned from '@/views/service/ywpt/components/proAssigned.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import proAssignedModal from '@/views/service/ywpt/components/proAssignedModal/review.vue'
import { encrypt } from '@/utils/crypto'
import { REVIEW_MODE_ASSIGNED_CODE, useReviewModeCode } from '@/hooks/useReviewModeCode'

// 初始化页面
const loading = ref(false) //接口调用加载中。。。
const isShowPage = ref(false) //未选择角色前不展示页面
const router = useRouter()
const route = useRoute()
const specialOrgId = ref<string>('') //用户id
const store = useStore()
const userDialogRef = ref() // 用户角色
const tableRef = ref()
const proAssignedRef = ref()
const selectModalRef = ref()
const psms = ref<string>('')
const proAssignedModalRef = ref<any>()
const userInfo = ref<any>()
const {
  reviewModeOptions,
  reviewModeLoading,
  reviewModeLoadFailed,
  loadReviewModeOptions,
  getReviewModeName,
  getReviewModeUpdateMessage,
  checkReviewModeOptionsReady
} = useReviewModeCode()

// 方法
const clearSelect = () => {
  tableRef.value.proTableRef.getTableList()
  tableRef.value.proTableRef.clearSelection()
}
// 选择评审方式
const showModal = (val: any) => {
  const value = getReviewModeUpdateMessage(val)
  const text = psms.value ? (val === psms.value ? '当前评审模式保持不变，请确认。' : '是否调整评审模式？') : '是否选择当前评审模式？'
  ElMessageBox.confirm(`${text}`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      const params = {
        meetingId: proAssignedRef.value.searchData.meetingId,
        psms: val
      }
      if (val === psms.value && val == REVIEW_MODE_ASSIGNED_CODE) {
        selectModalRef.value.isShowModel = false
        showAssigned()
        return
      }
      const res: any = await psfg({ ...params })
      if (res.success) {
        ElMessage.success(`${value}`)
        selectModalRef.value.isShowModel = false
        if (val == REVIEW_MODE_ASSIGNED_CODE) {
          showAssigned()
        }
        tableRef.value.proTableRef.getTableList()
        tableRef.value.proTableRef.clearSelection()
      } else {
        ElMessage.error(res.msg)
        selectModalRef.value.isShowModel = false
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
}
const showAssigned = () => {
  proAssignedRef.value.isShowModel = true
  proAssignedRef.value.isShowBtn = true
  nextTick(() => {
    proAssignedRef.value.initParamLists()
    proAssignedRef.value.proTableRef.getTableList()
  })
}

// 点击评审模式
const cellType = (val: any) => {
  proAssignedRef.value.searchData.meetingId = val
  proAssignedRef.value.isShowModel = true
  proAssignedRef.value.isShowBtn = false
  nextTick(() => {
    proAssignedRef.value.initParamLists()
    proAssignedRef.value.proTableRef.getTableList()
  })
}

// 项目评审
const handleReview = async (val: any) => {
  try {
    const Ids = val.selectedList.map((item: any) => item.meetingId)
    if (val.value == '组长终审') {
      let res: any = await getExpertInfoByCurrentUser({
        meetingId: val.selectedList[0].meetingId,
        isLeader: '1'
      })
      if (res.success) {
        var str = encrypt(
          JSON.stringify({
            meetingId: val.selectedList[0].meetingId,
            expertName: encodeURIComponent(res.data.expertName),
            expertId: res.data.expertId,
            tag: 'review',
            deptId: userInfo.value.specialorgid ? userInfo.value.specialorgid : userInfo.value.deptId,
            dwId: userInfo.value.org_id ? userInfo.value.org_id : userInfo.value.dwId,
            spRoleId: userInfo.value.id ? userInfo.value.id : userInfo.value.spRoleId
          })
        )
        router.push({
          name: '/service/ywpt/projectManifestLeader',
          query: {
            meetingParams: str
          }
        })
      }
    } else if (val.value == '评审分工') {
      if (!checkReviewModeOptionsReady()) return
      selectModalRef.value.isShowModel = true
      selectModalRef.value.type = val.selectedList[0].psms
      psms.value = val.selectedList[0].psms
      proAssignedRef.value.searchData.meetingId = val.selectedList[0].meetingId
    } else if (val.value == '添加退改需求') {
      const params = {
        row: { meetingId: val.selectedList[0].meetingId },
        getTableList: tableRef.value.proTableRef.getTableList
      }
      proAssignedModalRef.value.acceptParams(params)
    } else {
      ElMessageBox.confirm(`是否${val.value}？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          let res: any = val.value == '开启评审' ? await startReview(Ids) : await closeReview(Ids)
          if (res.success) {
            ElMessage.success(`会议${val.value}成功`)
            tableRef.value.proTableRef.getTableList()
            tableRef.value.proTableRef.clearSelection()
          } else {
            ElMessage.error(res.msg)
          }
        })
        .catch((error: any) => {
          console.log(error)
        })
    }
  } catch (e) {
    const error = e as Error
    ElMessage.error(error.message)
  }
}

// 选择角色
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    specialOrgId.value = userDialogRef.value.specialorgid
    if (isQuery) {
      isShowPage.value = true
    }
  } catch (e) {
    console.error(e)
  }
}

// 方法
onMounted(async () => {
  await loadReviewModeOptions()
  var isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    userInfo.value = store.getters.getJRGlobalInfo
    isShowPage.value = true
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
  {
    prop: 'startTimeBegin',
    label: '评审时间从',
    isShow: false,
    width: 200,
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
  { prop: 'major', label: '评审专业', width: '200' },
  { prop: 'createUserName', label: '组织人', width: '80' },
  { prop: 'leaderName', label: '专家组长', width: '80' },
  {
    prop: 'psms',
    label: '评审模式',
    width: '80',
    render: ({ row }: any) => {
      return getReviewModeName(row.psms, '-')
    }
  },
  { prop: 'startTime', label: '会议开始时间', width: '150' },
  { prop: 'endTime', label: '会议结束时间', width: '150' },
  { prop: 'sfkqpsName', label: '是否开启评审', width: '100' },
  { prop: 'pskssj', label: '评审开始时间', width: '150' },
  { prop: 'psjssj', label: '评审结束时间', width: '150' },
  { prop: 'totalCount', label: '会审总条目数', width: '100' },
  { prop: 'thCount', label: '退回条目数', width: '85' },
  { prop: 'leaderReviewedCount', label: '组长已评审条目数', width: '120' },
  { prop: 'pendingLeaderReviewCount', label: '待组长评审条目数', width: '120' },
  { prop: 'pendingExpertReviewCount', label: '待专家审核条目数', width: '120' },
  { prop: 'expertReviewedCount', label: '专家已审核条目数', width: '120' }
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
