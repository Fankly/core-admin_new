<!-- 其他信息版本管理 -->
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
    :export-api="tableRow.exportApi"
    :get-table-list="tableRow.getTableList"
    :delete-api="tableRow.deleteApi"
    :modal-title="tableRow.modalTitle"
    :submit-api="tableRow.submitApi"
    :import-title="tableRow.importTitle"
    :save-api="tableRow.saveApi"
    :temp-api="tableRow.tempApi"
    :table-columns="tableRow.tableColumns"
    :form-fields="tableRow.formFields"
    :import-api="tableRow.importApi"
    :label-width="'180px'"
    :info-api="tableRow.infoApi"
    :user-info="userInfo"
    :nd="nd"
    :version-id="versionId"
    :busi-type="'11'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/logistics/qt/version">
import { onMounted } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import viewModal from '@/views/service/balanceReporting/components/modal.vue' //新增弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { tableForm } from '@/views/deptDataVersion/logistics/hooks'

const { userInfo, protableCurdRef, yjdwList, versionId, userDialogRef, tableRef, modalRef, pageInfo, btnList, tableColumns, clickBtn, pageType, getPage, getRoleHandle, showModal, title, nd } = handleTable('11')
const { tableRow } = tableForm(userInfo, protableCurdRef, yjdwList)

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
