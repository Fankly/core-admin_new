<!-- 超期未提需求计划项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwtxqjhXmmxPage"
    :submit-api="'2'"
    :page-api="getCqwtxqjhXmmxPage"
    :export-api="exportCqwtxqjhXmmx"
    :extra-columns="extraColumns"
  />
</template>

<script setup lang="tsx">
defineOptions({ name: "/lyg/project/cqwtxqjhxms/index" })
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwtxqjhXmmxPage, exportCqwtxqjhXmmx } from '@/api/lyg/index'

const extraColumns = [
  { prop: 'erdat', label: '项目立项日期', width: 150 },
  { prop: 'firstPlanApproveDate', label: '首笔计划审批通过时间', width: 150 }
]
</script>
