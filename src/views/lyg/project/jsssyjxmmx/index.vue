<!-- 结算送审预警项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwlxXmmxPage"
    :submit-api="'7'"
    :page-api="getCqwjssshXmmxPage"
    :export-api="exportCqwjssshXmmx"
    :extra-columns="extraColumns"
  />
</template>

<script setup lang="tsx" name="/lyg/project/jsssyjxmmx/index">
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwjssshXmmxPage, exportCqwjssshXmmx } from '@/api/lyg/index'

const extraColumns = [{ prop: 'actualEndDate', label: '项目竣工时间', width: 150, filter: { type: 'date' } }]
</script>
