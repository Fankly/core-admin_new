<!-- 配电线路信息数据填报 -->
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
    :export-api="tables.exportApi"
    :get-table-list="tables.getTableList"
    :delete-api="tables.deleteApi"
    :modal-title="tables.modalTitle"
    :submit-api="tables.submitApi"
    :import-title="tables.importTitle"
    :save-api="tables.saveApi"
    :temp-api="tables.tempApi"
    :table-columns="tables.tableColumns"
    :form-fields="tables.formFields"
    :import-api="tables.importApi"
    :label-width="'180px'"
    :info-api="tables.infoApi"
    :user-info="userInfo"
    :nd="nd"
    :version-id="versionId"
    :busi-type="'5'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/network/pdxl/submit">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import { tableForm } from '@/views/deptDataVersion/network/hooks'

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
} = handleTable('5')
const { tables } = tableForm(userInfo, protableCurdRef, yjdwList)

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
