<!-- 超期未签订合同项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwqdhtXmmxPage"
    :submit-api="'3'"
    :page-api="getCqwqdhtXmmxPage"
    :export-api="exportCqwqdhtXmmx"
    :extra-column="{ prop: 'firstWinBidDate', label: '项目中标日期', width: 150 }"
    :next-column="{ prop: 'firstContractDate', label: '首笔合同签订时间', width: 150 }"
  />
</template>

<script setup lang="tsx" name="/lyg/project/cqwqdhtxms/index">
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwqdhtXmmxPage, exportCqwqdhtXmmx } from '@/api/lyg/index'
</script>
