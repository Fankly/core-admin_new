<!-- 超期未立项项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwlxXmmxPage"
    :submit-api="'1'"
    :page-api="getCqwlxXmmxPage"
    :export-api="exportCqwlxXmmx"
    :extra-columns="extraColumns"
  />
</template>

<script setup lang="tsx">
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwlxXmmxPage, exportCqwlxXmmx } from '@/api/lyg/index'
defineOptions({ name: "/lyg/project/cqwlxxms/index" })

const extraColumns = [
  { prop: 'xmckrq', label: '项目出库日期', width: 150 },
  { prop: 'erdat', label: '项目立项日期', width: 150 }
]
</script>
