<!-- 超期未立项项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwlxXmmxPage"
    :submit-api="'1'"
    :page-api="getCqwlxXmmxPage"
    :export-api="exportCqwlxXmmx"
    :extra-column="{ prop: 'xmckrq', label: '项目出库日期', width: 150 }"
    :next-column="{ prop: 'erdat', label: '项目立项日期', width: 150 }"
  />
</template>

<script setup lang="tsx" name="/lyg/project/cqwlxxms/index">
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwlxXmmxPage, exportCqwlxXmmx } from '@/api/lyg/index'
</script>
