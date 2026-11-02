<!-- 服务计划信息查询 -->
<template>
  <ReportBaseTable :page-api="fwjhxxPage" :export-api="fwjhxxExport" export-file-name="服务计划信息查询" :columns="columns" />
</template>

<script setup lang="tsx">
import ReportBaseTable from '../components/ReportBaseTable.vue'
import { fwjhxxPage, fwjhxxExport } from '@/api/lyg/report'
import { columns } from './columns'
defineOptions({ name: "/lyg/report/fwjhxx/index" })
</script>
