<!-- 反恐防范信息版本管理 -->
<template>
  <div class="container" v-show="pageInfo.isShowPage" v-loading="pageInfo.loading">
    <viewTable
      ref="tableRef"
      :table-type="'BBCONTROL'"
      :btn-list="btnList"
      :table-columns="tableColumns"
      @btn-type="clickBtn"
      @page-type="pageType"
      :page-api="getPage"
      :show-page="pageInfo.isShowPage"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <viewModal ref="modalRef" @show-modal="showModal" :title="title" :nd="nd" />
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
    :busi-type="'2'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/security/fkff/version">
import { onMounted } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import viewModal from '@/views/service/balanceReporting/components/modal.vue' //新增弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { tableForm } from '@/views/deptDataVersion/security/hooks'

const { userInfo, protableCurdRef, yjdwList, versionId, userDialogRef, tableRef, modalRef, pageInfo, btnList, tableColumns, clickBtn, pageType, getPage, getRoleHandle, showModal, title, nd } = handleTable('2')
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