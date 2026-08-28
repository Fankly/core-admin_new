<!-- 营业厅信息数据填报 -->
<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="pageInfo.loading">
    <viewTable
      ref="tableRef"
      :table-type="'BBCONTROL'"
      :btn-list="submitbtn"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      @page-type="pageType"
      :page-api="getPage"
      :show-page="pageInfo.isShowPage"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <ProtableCurdModal
    :export-api="table2.exportApi"
    :get-table-list="table2.getTableList"
    :delete-api="table2.deleteApi"
    :modal-title="table2.modalTitle"
    :submit-api="table2.submitApi"
    :import-title="table2.importTitle"
    :save-api="table2.saveApi"
    :temp-api="table2.tempApi"
    :table-columns="table2.tableColumns"
    :form-fields="table2.formFields"
    :import-api="table2.importApi"
    :label-width="'180px'"
    :info-api="table2.infoApi"
    :user-info="userInfo"
    :nd="nd"
    :version-id="versionId"
    :busi-type="'19'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/marketing/yyt/submit">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import { tableForm } from '@/views/deptDataVersion/marketing/hooks'

const {
  yjdwList,
  protableCurdRef,
  userDialogRef,
  tableRef,
  pageInfo,
  submitbtn,
  tableColumns,
  clickBtn,
  pageType,
  getPage,
  getRoleHandle,
  userInfo,
  versionId,
  nd
} = handleTable('19')
const { table2 } = tableForm(userInfo, protableCurdRef, yjdwList)

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
