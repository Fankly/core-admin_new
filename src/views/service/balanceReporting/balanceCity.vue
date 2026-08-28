<!-- 预计结余上报（市公司） -->
<template>
  <div class="container" v-show="pageInfo.isShowPage">
    <viewTable ref="tableRef" :type="'city'" :specialorgid="specialorgid" @click-btn="clickBtn" @page-type="pageType" />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <reporting ref="reportTable" @loadCompany="getRoleHandle" :formData="formData" :title="'预计结余-上报'" />
</template>
<script lang="ts">
export default {
  name: '/service/balanceReporting/balanceCity'
}
</script>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/balanceReporting/components/table.vue' //表格组件
import reporting from '@/views/service/balanceReporting/components/reporting.vue' //表格组件
import { ElMessage } from 'element-plus'

const userDialogRef = ref()
const reportTable = ref()
const tableRef = ref()

const pageInfo = reactive({
  loading: false,
  isShowPage: false
})
const specialorgid = ref<any>()
const formData = ref<any>()
onMounted(() => {
  pageInfo.loading = true
  userDialogRef.value?.getUser?.()
})
const getRoleHandle = () => {
  pageInfo.loading = false
  const userInfo = { ...userDialogRef.value?.userMsg }
  const isQuery = userDialogRef.value?.isQuery
  if (isQuery) {
    specialorgid.value = userInfo.org_id
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
const clickBtn = (val: any) => {
  try {
    const selectedVersion = getSelectedVersion(val)
    if (!selectedVersion?.versionId) return

    formData.value = {
      versionId: selectedVersion.versionId,
      specialorgid: specialorgid.value,
      versionName: selectedVersion.versionName,
      versionNo: selectedVersion.versionNo,
      nd: val.nd,
      isStatus: val.value == '上报预计结余' ? selectedVersion.status : '3',
      versionFlag: selectedVersion.versionFlag
    }
    if (!reportTable.value) return

    reportTable.value.isShowModel = true
    reportTable.value.getHeaderData?.({
      versionId: selectedVersion.versionId,
      specialorgid: specialorgid.value
    })
  } catch (error) {
    console.log(error)
  }
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
