<!-- 目标值一上预算省专业填报 -->
<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <viewTable
      ref="tableRef"
      :table-type="'MBZYSYSWH'"
      :btn-list="btnList"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      @page-type="pageType"
      :page-api="pageForZgkbmYssb"
      :show-page="pageInfo.isShowPage"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <zyReporting ref="ZyReportTable" @push-page="pushPage" :isShow="isShow" :formData="formData" />
</template>
<script lang="ts">
export default {
  name: '/service/lslxJsc/ysysszytb/index'
}
</script>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import zyReporting from '@/views/service/lslxJsc/ysysszytb/components/zyReporting.vue' //上报组件
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageForZgkbmYssb } from '@/api/lslxJsc/szyBmApi' 
import { getDwInfo } from '@/api/lslxJsc/index' // 判断当前页面是否由访问权限
import { getPublicData } from '@/api/common' //公共代码
import { useStore } from 'vuex'
import { useUser } from '@/hooks/useUser'
import { useRouter, useRoute } from 'vue-router'

const store = useStore()
const route = useRoute()

const userDialogRef = ref()
const pageInfo = reactive({
  loading: false,
  isShowPage: false
})
const tableRef = ref()
const specialorgid = ref<any>() //单位id
const formData = ref<any>()
const ZyReportTable = ref<any>()
const userInfo = ref<any>()
const lslxStatus = ref<any[]>([])
const isShow = ref<boolean>(false)
const btnList = ref<any[]>([
  {
    label: 'YSSZYXG',
    value: '一上预算编制',
    isSelected: true,
    type: 'normal'
  },
  {
    label: 'YSSZYCK',
    value: '一上预算查看',
    isSelected: true,
    type: 'normal'
  }
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
// 权限获取
const getRoleHandle = () => {
  pageInfo.loading = false
  userInfo.value = { ...userDialogRef.value.userMsg }
  isPass(userInfo.value.org_id)
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    specialorgid.value = userInfo.value.org_id
  }
}
// 按钮点击事件
const clickBtn = async (val: any) => {
  try {
    isShow.value = val.label == 'YSSZYXG'
    if (val.selectedList.length != 1) {
      return ElMessage.warning('请选择一条数据')
    }
    if (!['1', '4', '6'].includes(val.selectedList[0].status) && val.label == 'YSSZYXG') {
      return ElMessage.warning(`仅“草稿”、“部门审核已驳回”和“一上省退回”状态可维护,请勿重复点击`)
    }
    const params = {
      versionId: val.selectedList[0].versionId,
      versionName: val.selectedList[0].versionName,
      versionNo: val.selectedList[0].versionNo,
      zgkbmId:val.selectedList[0].zgkbmId,
      nd: val.nd,
      title: val.value,
      specialorgid: specialorgid.value
    }
      formData.value = {...params,}
      ZyReportTable.value.userInfo = userInfo.value
      ZyReportTable.value.isShowModel = true
      ZyReportTable.value.getHeaderData(formData.value)
  } catch (error) {
    console.log(error)
  }
}
const pushPage = (val: any) => {
  if (val) {
    tableRef.value.proTableRef.getTableList()
    tableRef.value.proTableRef.clearSelection()
    ZyReportTable.value.isShowModel = false
  }
}
// 回调
const pageType = (val: any) => {
  if (val.success) {
    pageInfo.isShowPage = true
  } else {
    ElMessage.error('仅限财务或省专业部门访问')
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
          dwId: userInfo.value.org_id,
          bmId:userInfo.value.specialorgid,
          isCwbm:userInfo.value.specialorgcode.includes('BM_CW')
        }
        closeAll()
      }
      const item: any = await getPublicData('MBZYS_STATUS')
      lslxStatus.value.length = 0
      if (item.success && item.data.length !== 0) {
        lslxStatus.value.push(...item.data)
      }
    }
  } catch (error: any) {
    console.log(error)
  }
}

const closeAll = () => {
  ZyReportTable.value?.closeHandle()
  tableRef.value.proTableRef.getTableList()
  tableRef.value.proTableRef.clearSelection()
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
    prop: 'zgkbmName',
    label: '省专业部门名称',
    width: '160'
  },
  {
    prop: 'status',
    label: '省专业编制状态',
    search: { el: 'select', order: 2 },
    enum: lslxStatus.value,
    fieldNames: { label: 'name', value: 'code' },
    width: '200'
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
