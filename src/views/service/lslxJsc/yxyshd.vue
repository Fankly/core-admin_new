<!-- 目标值一下预算核定-->
<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <viewTable
      ref="tableRef"
      :table-type="'BBCONTROL'"
      :btn-list="btnList"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      @page-type="pageType"
      :page-api="pageForProvince"
      :show-page="pageInfo.isShowPage"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <reportingyx ref="reportRef" @get-pass="getPass" :formData="formData" />
</template>
<script lang="ts">
export default {
  name: '/service/lslxJsc/yxyshd'
}
</script>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPublicData } from '@/api/common' //公共代码
import reportingyx from '@/views/service/lslxJsc/components/reportingyx.vue' //上报组件
import { pageForProvince } from '@/api/lslxJsc/index'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useUser } from '@/hooks/useUser'

const store = useStore()
const route = useRoute()
const formData = ref<any>()
const userDialogRef = ref()
const reportRef = ref<any>()
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
    label: 'AUDIT',
    value: '一下数据编制',
    isSelected: true,
    type: 'normal'
  },
  {
    label: 'VIEW',
    value: '一下数据查看',
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

// 回调
const pageType = (val: any) => {
  if (val.success) {
    pageInfo.isShowPage = true
  } else {
    ElMessage.error('仅限省公司访问')
    pageInfo.isShowPage = false
  }
}
// 按钮点击事件
const clickBtn = async (val: any) => {
  try {
    if (val.selectedList.length != 1) {
      return ElMessage.warning('请选择一条数据')
    }
    if (val.selectedList[0].status != '3' && val.label == 'AUDIT') {
      return ElMessage.warning(`状态不是“一上省核定”，不允许编制。`)
    }
    const params = {
      versionId: val.selectedList[0].versionId,
      versionName: val.selectedList[0].versionName,
      versionNo: val.selectedList[0].versionNo,
      nd: val.nd,
      title: val.value,
      dwId: specialorgid.value
    }
    formData.value = { ...params }
    reportRef.value.userInfo = userInfo.value
    reportRef.value.isShowModel = true
    reportRef.value.getHeaderData(params)
  } catch (error) {
    console.log(error)
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

const getPass = (val: any) => {
  if (val) {
    tableRef.value.proTableRef.getTableList()
    tableRef.value.proTableRef.clearSelection()
    reportRef.value.isShowModel = false
  }
}

// 权限获取
const getRoleHandle = () => {
  userInfo.value = { ...userDialogRef.value.userMsg }
  const isQuery = userDialogRef.value.isQuery
  if (isQuery) {
    specialorgid.value = userInfo.value.org_id
    isPass(userInfo.value.org_id)
    store.commit('setLSGlobalInfo', {
      deptId: userInfo.value.specialorgid,
      deptName: userInfo.value.specialorgname,
      dwId: userInfo.value.org_id,
      dwName: userInfo.value.org_name,
      roleId: userInfo.value.role_id,
      roleCode: userInfo.value.code,
      spRoleId: userInfo.value.id,
      specialorgcode: userInfo.value.specialorgcode
    })
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
