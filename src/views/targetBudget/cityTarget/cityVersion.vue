<!-- 市级统筹目标值版本管理 -->
<template>
  <div class="container" v-show="isShowPage">
    <btnTable
      ref="tableRef"
      :table-type="'BBCONTROL'"
      :btn-list="btnList"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      @page-type="pageType"
      :page-api="getPage"
      :show-page="isShowPage"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
  <viewModal ref="modalRef" @show-modal="showModal" :title="title" :nd="nd" />
  <reporting ref="reportTable" @get-pass="getPass" :formData="formData" :gkjbList="gkjbList" />
  <matchModal ref="matchTable" :formData="formData" />
  <component
    @closeDialog="processData.isShowDialog = false"
    :isShowDialog="processData.isShowDialog"
    :isShowLog="processData.isShowLog"
    :searchApi="processData.searchApi"
    :id="processData.id"
    :is="processData.compName"
  ></component>
</template>
<script setup lang="ts" name="/service/lslxJsc/lslxbbgl">
import { onMounted } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import btnTable from '@/components/ProTable/table.vue' //表格组件
import viewModal from '@/views/service/balanceReporting/components/modal.vue' //新增弹窗组件
import reporting from '@/views/targetBudget/cityTarget/components/reporting.vue'
import matchModal from '@/views/targetBudget/cityTarget/components/matchModal.vue'
import { useVersion } from '@/views/targetBudget/cityTarget/hooks/cityversion'

const {
  isShowPage,
  tableRef,
  userDialogRef,
  btnList,
  tableColumns,
  clickBtn,
  processData,
  pageType,
  getRoleHandle,
  showModal,
  getPage,
  modalRef,
  reportTable,
  title,
  nd,
  getPass,
  formData,
  matchTable,
  gkjbList
} = useVersion()

onMounted(async () => {
  await userDialogRef.value.getUser()
})
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
