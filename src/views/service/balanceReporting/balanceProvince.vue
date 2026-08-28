<!-- 预计结余上报（省公司） -->
<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <viewTable ref="tableRef" :type="'province'" :specialorgid="specialorgid" @click-btn="clickBtn" @page-type="pageType" />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <viewModal ref="modalRef" @show-modal="showModal" :title="title" :nd="nd" />
  <reporting ref="reportTable" :formData="formData" :title="'预计结余-查看'" />
  <viewEntity ref="entityRef" :specialorgid="specialorgid" />
</template>
<script lang="ts">
export default {
  name: '/service/balanceReporting/balanceProvince'
}
</script>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/balanceReporting/components/table.vue' //表格组件
import viewModal from '@/views/service/balanceReporting/components/modal.vue' //新增弹窗组件
import viewEntity from '@/views/service/balanceReporting/components/entity.vue' //单位管理组件
import { ElMessage } from 'element-plus'
import { remove, issue, filed, add, edit, cancelFiled } from '@/api/service/balanceReporting/index'
import reporting from '@/views/service/balanceReporting/components/reporting.vue' //表格组件
import { useStore } from 'vuex'

const store = useStore()
const userDialogRef = ref()
const pageInfo = reactive({
  loading: false,
  isShowPage: false
})
const tableRef = ref()
const modalRef = ref()
const entityRef = ref()
const title = ref<any>('')
const nd = ref<any>(0)
const specialorgid = ref<any>() //单位id
const formData = ref<any>()
const reportTable = ref<any>({})
const userInfo = ref<any>()
onMounted(() => {
  pageInfo.loading = true
  userDialogRef.value?.getUser?.()
})
// 权限获取
const getRoleHandle = () => {
  pageInfo.loading = false
  userInfo.value = { ...userDialogRef.value?.userMsg }
  const isQuery = userDialogRef.value?.isQuery
  if (isQuery) {
    specialorgid.value = userInfo.value.org_id
  }
}
//新增编辑回调
const showModal = async (val: any) => {
  const isCreate = val.title == '版本创建'
  const api = isCreate ? add : edit
  const res: any = await api({ ...val.rmarkData })
  if (res.success) {
    ElMessage.success(isCreate ? '版本创建成功' : '版本修改成功')
    closeAll()
  } else {
    ElMessage.error(res.msg)
  }
}
// 回调
const pageType = (val: any) => {
  if (val?.success) {
    pageInfo.isShowPage = true
  } else {
    ElMessage.error(val?.msg)
    pageInfo.isShowPage = false
  }
}
const getSelectedVersion = (val: any) => val?.selectedList?.[0]
const refreshTable = () => {
  tableRef.value?.proTableRef?.getTableList?.()
  tableRef.value?.proTableRef?.clearSelection?.()
}
const runVersionAction = async (val: any, api: (versionId: any) => Promise<any>) => {
  const selectedVersion = getSelectedVersion(val)
  if (!selectedVersion?.versionId) return

  const res: any = await api(selectedVersion.versionId)
  if (res.success) {
    ElMessage.success(`${val.value}成功`)
    closeAll()
  } else {
    ElMessage.error(res.msg)
  }
}
const openReport = (val: any) => {
  const selectedVersion = getSelectedVersion(val)
  if (!selectedVersion?.versionId) return

  formData.value = {
    versionId: selectedVersion.versionId,
    versionName: selectedVersion.versionName,
    versionNo: selectedVersion.versionNo,
    nd: val.nd,
    specialorgid: specialorgid.value
  }
  if (!reportTable.value) return
  reportTable.value.isShowModel = true
  reportTable.value.getHeaderData?.({
    versionId: selectedVersion.versionId,
    specialorgid: specialorgid.value
  })
}
const openEntity = (val: any) => {
  const selectedVersion = getSelectedVersion(val)
  if (!selectedVersion || !entityRef.value) return

  entityRef.value.versionStatus = selectedVersion
  entityRef.value.pageMeeting?.()
  entityRef.value.isShowModel = true
}
const openVersionModal = (val: any) => {
  const selectedVersion = getSelectedVersion(val)
  if (!modalRef.value) return

  modalRef.value.rmarkData =
    val.value == '版本创建'
      ? {}
      : {
          versionId: selectedVersion?.versionId,
          versionName: selectedVersion?.versionName,
          remake: selectedVersion?.remake
        }
  modalRef.value.isShowModel = true
}
// 按钮点击事件
const clickBtn = async (val: any) => {
  try {
    title.value = val.value
    nd.value = val.nd
    if (val.value == '版本删除') {
      await runVersionAction(val, remove)
    } else if (val.value == '版本下发') {
      const selectedVersion = getSelectedVersion(val)
      if (!selectedVersion?.versionId) return

      let iss = await issue({
        spOrgId: userInfo.value?.specialorgid,
        spRoleId: userInfo.value?.id,
        userId: store.getters.getUserMsg?.id,
        versionId: selectedVersion.versionId
      })
      if (iss.success) {
        ElMessage.success(`${val.value}成功`)
        closeAll()
      } else {
        ElMessage.error(iss.msg)
      }
    } else if (val.value == '归档') {
      await runVersionAction(val, filed)
    } else if (val.value == '取消归档') {
      await runVersionAction(val, cancelFiled)
    } else if (val.value == '上报查看') {
      openReport(val)
    } else if (val.value == '下发单位管理') {
      openEntity(val)
    } else {
      openVersionModal(val)
    }
  } catch (error) {
    console.log(error)
  }
}
const closeAll = () => {
  modalRef.value?.closeHandle()
  refreshTable()
}
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
