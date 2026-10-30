<!-- 物资计划信息查询 -->
<template>
  <ReportBaseTable :page-api="wzjhxxPage" :export-api="wzjhxxExport" export-file-name="物资计划信息查询" :columns="columns" />
</template>

<script setup lang="tsx">
defineOptions({ name: "/lyg/report/wzjhxx/index" })
import ReportBaseTable from '../components/ReportBaseTable.vue'
import { wzjhxxPage, wzjhxxExport } from '@/api/lyg/report'
import { columns } from './columns'
</script>
