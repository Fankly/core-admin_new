<!-- 超期未签订合同项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwqdhtXmmxPage"
    :submit-api="'3'"
    :page-api="getCqwqdhtXmmxPage"
    :export-api="exportCqwqdhtXmmx"
    :extra-columns="extraColumns"
  />
</template>

<script setup lang="tsx">
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwqdhtXmmxPage, exportCqwqdhtXmmx } from '@/api/lyg/index'
defineOptions({ name: "/lyg/project/cqwqdhtxms/index" })

const extraColumns = [
  { prop: 'firstWinBidDate', label: '项目中标日期', width: 150 },
  { prop: 'firstContractDate', label: '首笔合同签订时间', width: 150 }
]
</script>
