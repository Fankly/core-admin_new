<!-- 供电所房屋信息版本管理 -->
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
    :export-api="table1.exportApi"
    :get-table-list="table1.getTableList"
    :delete-api="table1.deleteApi"
    :modal-title="table1.modalTitle"
    :submit-api="table1.submitApi"
    :import-title="table1.importTitle"
    :save-api="table1.saveApi"
    :temp-api="table1.tempApi"
    :table-columns="table1.tableColumns"
    :form-fields="table1.formFields"
    :import-api="table1.importApi"
    :label-width="'180px'"
    :info-api="table1.infoApi"
    :user-info="userInfo"
    :nd="nd"
    :version-id="versionId"
    :busi-type="'18'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/marketing/gdsfw/version">
import { onMounted } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import viewModal from '@/views/service/balanceReporting/components/modal.vue' //新增弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { tableForm } from '@/views/deptDataVersion/marketing/hooks'

const {
  userInfo,
  protableCurdRef,
  yjdwList,
  versionId,
  userDialogRef,
  tableRef,
  modalRef,
  pageInfo,
  btnList,
  tableColumns,
  clickBtn,
  pageType,
  getPage,
  getRoleHandle,
  showModal,
  title,
  nd
} = handleTable('18')
const { table1 } = tableForm(userInfo, protableCurdRef, yjdwList)

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
