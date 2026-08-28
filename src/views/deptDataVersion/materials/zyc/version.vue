<!-- 专业仓信息版本管理 -->
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
    :export-api="tableCon.exportApi"
    :get-table-list="tableCon.getTableList"
    :delete-api="tableCon.deleteApi"
    :modal-title="tableCon.modalTitle"
    :submit-api="tableCon.submitApi"
    :import-title="tableCon.importTitle"
    :save-api="tableCon.saveApi"
    :temp-api="tableCon.tempApi"
    :table-columns="tableCon.tableColumns"
    :form-fields="tableCon.formFields"
    :import-api="tableCon.importApi"
    :label-width="'180px'"
    :info-api="tableCon.infoApi"
    :user-info="userInfo"
    :nd="nd"
    :version-id="versionId"
    :busi-type="'17'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/materials/zyc/version">
import { onMounted } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import viewModal from '@/views/service/balanceReporting/components/modal.vue' //新增弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { tableForm } from '@/views/deptDataVersion/materials/hooks'

const { userInfo, protableCurdRef, yjdwList, versionId, userDialogRef, tableRef, modalRef, pageInfo, btnList, tableColumns, clickBtn, pageType, getPage, getRoleHandle, showModal, title, nd } = handleTable('17')
const { tableCon } = tableForm(userInfo, protableCurdRef, yjdwList)

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
