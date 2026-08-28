<!-- 联合会审评审（专家使用） -->
<template>
  <div class="container" v-loading="loading" v-if="isShowPage">
    <viewTable ref="tableRef" :type="'expert'" :tableColumns="tableColumns" @page-type="handleReview" />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <proAssignedModal @include-in-review="clearSelect" ref="proAssignedModalRef" />
</template>
<script lang="ts">
export default {
  name: '/service/ywpt/jointReview'
}
</script>
<script setup lang="ts">
import userDialog from '@/components/select/userDialog.vue' //权限弹框
import { ref, reactive, onMounted } from 'vue'
import { getExpertInfoByCurrentUser } from '@/api/service/jointReview'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useUser } from '@/hooks/useUser'
import viewTable from '@/views/service/ywpt/components/viewTable.vue'
import { ElMessage } from 'element-plus'
import proAssignedModal from '@/views/service/ywpt/components/proAssignedModal/review.vue'
import { encrypt } from '@/utils/crypto'

// 初始化页面
const loading = ref(false) //接口调用加载中。。。
const isShowPage = ref(false) //未选择角色前不展示页面
const router = useRouter()
const route = useRoute()
const specialOrgId = ref<string>('') //用户id
const store = useStore()
const userDialogRef = ref() // 用户角色
const proAssignedModalRef = ref<any>()
const tableRef = ref()
const userInfo = ref<any>()

// 方法
const clearSelect = () => {
  tableRef.value.proTableRef.getTableList()
  tableRef.value.proTableRef.clearSelection()
}
// 项目评审
const handleReview = async (val: any) => {
  if (val.value == '添加退改需求') {
    const params = {
      row: { meetingId: val.selectedList[0].meetingId },
      getTableList: tableRef.value.proTableRef.getTableList
    }
    proAssignedModalRef.value.acceptParams(params)
  } else if (val.value == '项目评审') {
    let res: any = await getExpertInfoByCurrentUser({
      meetingId: val.selectedList[0].meetingId,
      isLeader: '0'
    })
    if (res.success && res.data) {
      var str = encrypt(
        JSON.stringify({
          meetingId: val.selectedList[0].meetingId,
          expertName: encodeURIComponent(res.data.expertName),
          expertId: res.data.expertId,
          deptId: userInfo.value.specialorgid ? userInfo.value.specialorgid : userInfo.value.deptId,
          dwId: userInfo.value.org_id ? userInfo.value.org_id : userInfo.value.dwId,
          spRoleId: userInfo.value.id ? userInfo.value.id : userInfo.value.spRoleId
        })
      )
      router.push({ name: '/service/ywpt/projectManifest', query: { meetingParams: str } })
    } else {
      ElMessage.error('未获取到专家信息，请检查')
    }
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
  var isRoel = await useUser('getJRGlobalInfo')
  if (isRoel && route.params.formJsc) {
    userInfo.value = { ...store.getters.getJRGlobalInfo }
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
    }
    // width: "280"
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
  { prop: 'startTime', label: '会议开始时间', width: '150' },
  { prop: 'endTime', label: '会议结束时间', width: '150' },
  { prop: 'sfkqpsName', label: '是否开启评审', width: '100' },
  { prop: 'totalCount', label: '会审总条目数', width: '120' },
  { prop: 'thCount', label: '退回条目数', width: '85' },
  { prop: 'pendingReviewCount', label: '待专家审核条目数', width: '120' },
  { prop: 'reviewedCount', label: '专家已审核条目数', width: '120' }
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
