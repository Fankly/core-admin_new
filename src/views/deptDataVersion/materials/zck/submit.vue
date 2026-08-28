<!-- 注册库信息数据填报 -->
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
    :busi-type="'16'"
    ref="protableCurdRef"
  />
</template>

<script setup lang="ts" name="/deptDataVersion/materials/zck/submit">
import { onMounted, ref } from 'vue'
import userDialog from '@/components/select/userDialog.vue' //登陆权限
import viewTable from '@/views/service/lslxJsc/components/table.vue' //表格组件
import ProtableCurdModal from '@/views/deptDataVersion/components/index.vue' //填报弹窗组件
import { handleTable } from '@/views/deptDataVersion/hooks/version'
import { tableForm } from '@/views/deptDataVersion/materials/hooks'

const { yjdwList, protableCurdRef, userDialogRef, tableRef, pageInfo, submitbtn, tableColumns, clickBtn, pageType, getPage, getRoleHandle, userInfo, versionId, nd  } = handleTable('16')
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
