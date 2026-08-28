<!-- 目标值二上预算上报 -->
<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <viewTable
      ref="tableRef"
      :table-type="'MBZESYSWH'"
      :btn-list="btnList"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      @page-type="pageType"
      :page-api="pageForDwEssb"
      :show-page="pageInfo.isShowPage"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <reporting ref="reportTable" @push-page="pushPage" :formData="formData" />
</template>
<script lang="ts">
export default {
  name: '/service/lslxJsc/esyssb'
}
</script>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import reporting from '@/views/service/lslxJsc/components/reportingLslx.vue' //上报组件
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDwInfo, pageForDwEssb } from '@/api/lslxJsc/index' // 判断当前页面是否由访问权限
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
const reportTable = ref<any>()
const userInfo = ref<any>()
const lslxStatus = ref<any[]>([])
const btnList = ref<any[]>([
  {
    label: 'YSWH',
    value: '二上预算编制',
    isSelected: true,
    type: 'normal'
  },
  {
    label: 'YSCK',
    value: '二上预算查看',
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
    if (val.selectedList.length != 1) {
      return ElMessage.warning('请选择一条数据')
    }
    if (!['1', '4', '6'].includes(val.selectedList[0].status) && val.value == '二上预算编制') {
      return ElMessage.warning(
        `仅“草稿”、“二上部门审核已驳回”和“二上省退回”状态可维护,请勿重复点击`
      )
    }
    const params = {
      versionId: val.selectedList[0].versionId,
      versionName: val.selectedList[0].versionName,
      versionNo: val.selectedList[0].versionNo,
      nd: val.nd,
      title: val.value,
      specialorgid: specialorgid.value
    }
    const res: any = await getDwInfo(params)
    if (res.success && res.data) {
      formData.value = {
        ...params,
        dwId: res.data.code,
        dwName: res.data.name
      }
      reportTable.value.userInfo = userInfo.value
      reportTable.value.isShowModel = true
      reportTable.value.getHeaderData(formData.value)
    } else {
      ElMessage.error('当前没有访问权限')
    }
  } catch (error) {
    console.log(error)
  }
}
const pushPage = (val: any) => {
  if (val) {
    tableRef.value.proTableRef.getTableList()
    tableRef.value.proTableRef.clearSelection()
    reportTable.value.isShowModel = false
  }
}
// 回调
const pageType = (val: any) => {
  if (val.success) {
    pageInfo.isShowPage = true
  } else {
    ElMessage.error('仅限一级单位访问')
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
      const item: any = await getPublicData('MBZES_STATUS')
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
  reportTable.value?.closeHandle()
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
    prop: 'status',
    label: '版本状态',
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
