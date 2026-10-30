<!-- 项目关闭预警项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwjgbXmmxPage"
    :submit-api="'10'"
    :page-api="getCqwjgbXmmxPage"
    :export-api="exportCqwjgbXmmx"
    :extra-columns="extraColumns"
  />
</template>

<script setup lang="tsx">
defineOptions({ name: "/lyg/project/xmgbyjxmmx/index" })
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwjgbXmmxPage, exportCqwjgbXmmx } from '@/api/lyg/index'
import { formatNumValue } from '@/utils/utils'

const extraColumns = [
  { prop: 'actualEndDate', label: '项目竣工时间', width: 150 },
  { prop: 'scsdrq', label: '首次审定时间', width: 150 },
  {
    prop: 'erpjdys',
    label: '项目总预算',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.erpjdys)
  },
  {
    prop: 'ljjsje',
    label: '累计结算金额',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.ljjsje)
  },
  { prop: 'lastSettlementDate', label: '最后结算日期', width: 150 }
]
</script>
