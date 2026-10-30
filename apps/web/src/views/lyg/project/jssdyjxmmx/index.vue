<!-- 结算审定预警项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwjssdXmmxPage"
    :submit-api="'8'"
    :page-api="getCqwjssdXmmxPage"
    :export-api="exportCqwjssdXmmx"
    :extra-columns="extraColumns"
  />
</template>

<script setup lang="tsx">
defineOptions({ name: "/lyg/project/jssdyjxmmx/index" })
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwjssdXmmxPage, exportCqwjssdXmmx } from '@/api/lyg/index'

const extraColumns = [{ prop: 'actualEndDate', label: '项目竣工时间', width: 150 }]
</script>
