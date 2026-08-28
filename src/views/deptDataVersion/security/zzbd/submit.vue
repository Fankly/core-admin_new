<!-- 政治保电信息数据填报 -->
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
    :export-api="tableColumn.exportApi"
    :get-table-list="tableColumn.getTableList"
    :delete-api="tableColumn.deleteApi"
    :modal-title="tableColumn.modalTitle"
    :submit-api="tableColumn.submitApi"
    :import-title="tableColumn.importTitle"
    :save-api="tableColumn.saveApi"
    :temp-api="tableColumn.tempApi"
    :table-columns="tableColumn.tableColumns"
    :form-fields="tableColumn.formFields"
    :import-api="tableColumn.importApi"
    :label-width="'180px'"
    :info-api="tableColumn.infoApi"
    :user-info="userInfo"
    :nd="nd"
    :version-id="versionId"
    :busi-type="'3'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/security/zzbd/submit">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import { tableForm } from '@/views/deptDataVersion/security/hooks'

const { yjdwList, protableCurdRef, userDialogRef, tableRef, pageInfo, submitbtn, tableColumns, clickBtn, pageType, getPage, getRoleHandle, userInfo, versionId, nd  } = handleTable('3')
const { tableColumn } = tableForm(userInfo, protableCurdRef, yjdwList)

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

