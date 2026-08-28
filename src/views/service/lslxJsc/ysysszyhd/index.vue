<!-- 两上两下数据核定 -->
<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <viewTable
      ref="tableRef"
      :table-type="'BBCONTROL'"
      :btn-list="btnList"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      :page-api="pageForProvince"
      :show-page="pageInfo.isShowPage"
      @page-type="pageType"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <dwTable ref="dwTableRef" @push-page="pushPage" />
</template>
<script lang="ts">
export default {
  name: '/service/lslxJsc/ysysszyhd/index'
}
</script>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import { ElMessage } from 'element-plus'
import { getPublicData } from '@/api/common' //公共代码
import dwTable from '@/views/service/lslxJsc/ysysszyhd/components/zyTable.vue' //上报组件
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useUser } from '@/hooks/useUser'
import { pageForProvince } from '@/api/lslxJsc/index'

const store = useStore()
const route = useRoute()
const userDialogRef = ref()
const dwTableRef = ref<any>()
const pageInfo = reactive({
  loading: false,
  isShowPage: false
})
const tableRef = ref()
const specialorgid = ref<any>() //单位id
const lslxStatus = ref<any[]>([])
const userInfo = ref<any>()

const btnList = ref<any[]>([
  {
    label: 'REVIEW',
    value: '上报数据核定',
    isSelected: false,
    type: 'normal'
  },
  // {
  //   label: 'ALLVIEW',
  //   value: '上报数据查看',
  //   isSelected: false,
  //   type: 'normal',
  // }
])

onMounted(async () => {
  var isRoel = await useUser('getLSGlobalInfo')
  pageInfo.loading = true
  if (isRoel && route.params.formJsc) {
    const lSGlobalInfo = store.getters.getLSGlobalInfo
    userInfo.value = lSGlobalInfo.deptId
    isPass(userInfo.value.org_id)
  } else {
    await userDialogRef.value.getUser()
  }
})

const pushPage = (val: any) => {
  if (val) {
    tableRef.value.proTableRef.getTableList()
    tableRef.value.proTableRef.clearSelection()
    dwTableRef.value.isShowModel = false
  }
}
// 按钮点击事件
const clickBtn = async (val: any) => {
  try {
    if (val.selectedList.length != 1) {
      return ElMessage.warning('请选择一条数据')
    }
    // if (val.selectedList[0].status == '1') {
    //   return ElMessage.warning('当前为草稿状态，无法点击')
    // }
    const params = {
      versionId: val.selectedList[0].versionId,
      versionName: val.selectedList[0].versionName,
      versionNo: val.selectedList[0].versionNo,
      nd: val.nd,
      title: val.value,
      specialorgid: specialorgid.value
    }
    if (val.label == 'REVIEW') {
      dwTableRef.value.userInfo = userInfo.value
      dwTableRef.value.formData = params
      dwTableRef.value.isShowModel = true
      dwTableRef.value.pageMeeting(params.versionId)
    }
  } catch (error) {
    console.log(error)
  }
}

// 回调
const pageType = (val: any) => {
  if (val.success) {
    pageInfo.isShowPage = true
  } else {
    ElMessage.error('仅限省公司访问')
    pageInfo.isShowPage = false
  }
}

const isPass = async (val: any) => {
  try {
    if (val) {
      const root: any = await getPublicData('NDCX')
      if (root.success && root.data.length !== 0) {
        tableRef.value.ndList = root.data
        tableRef.value.formData = {
          nd: new Date().getFullYear().toString(),
          specialorgid: userInfo.value.org_id
        }
        closeAll()
      }
      const item: any = await getPublicData('MBZLSLX_VERSION_STATUS')
      lslxStatus.value.length = 0
      if (item.success && item.data.length !== 0) {
        lslxStatus.value.push(...item.data)
      }
    }
  } catch (error: any) {
    console.log(error)
  }
}
// 关闭
const closeAll = () => {
  tableRef.value.proTableRef.getTableList()
  tableRef.value.proTableRef.clearSelection()
  pageInfo.loading = false
}

// 权限获取
const getRoleHandle = () => {
  userInfo.value = { ...userDialogRef.value.userMsg }
  isPass(userInfo.value.org_id)
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    specialorgid.value = userInfo.value.org_id
  }
}

const tableColumns = reactive([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'nd', label: '年度', width: '80' },
  { prop: 'versionNo', label: '版本编号', width: '130' },
  {
    prop: 'versionName',
    label: '版本名称',
    width: '300',
    search: { el: 'input', order: 1 }
  },
  {
    prop: 'status',
    label: '版本状态',
    search: { el: 'select', order: 2 },
    enum: lslxStatus.value,
    fieldNames: { label: 'name', value: 'code' },
    width: '200'
  },
  {
    prop: 'zgkbmIssueStatus',
    label: '省专业版本下发状态',
    width: '160',
    render:({row}:any)=>{
      const val = row.zgkbmIssueStatus == '1'?'已下发':'未下发'
      return val
    }
  },
  { prop: 'createDate', label: '创建日期', width: '180' },
  { prop: 'creatorName', label: '创建人', width: '80' },
  { prop: 'remake', label: '备注' }
])
</script>

<style scoped lang="less">
.container {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
}
</style>
