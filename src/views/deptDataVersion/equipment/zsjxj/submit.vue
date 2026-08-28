<!-- 直升机巡检信息数据填报 -->
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
    :busi-type="'15'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/equipment/zsjxj/submit">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import { tableForm } from '@/views/deptDataVersion/equipment/hooks'

const { yjdwList, protableCurdRef, userDialogRef, tableRef, pageInfo, submitbtn, tableColumns, clickBtn, pageType, getPage, getRoleHandle, userInfo, versionId, nd  } = handleTable('15')
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
