<!-- 项目结算预警项目明细 -->
<template>
  <CqxmBaseTable
    :send-early="getCqwjssXmmxPage"
    :submit-api="'9'"
    :page-api="getCqwjssXmmxPage"
    :export-api="exportCqwjssXmmx"
    :extra-columns="extraColumns"
  />
</template>

<script setup lang="tsx">
defineOptions({ name: "/lyg/project/xmjsyjxmmx/index" })
import CqxmBaseTable from '../components/CqxmBaseTable.vue'
import { getCqwjssXmmxPage, exportCqwjssXmmx } from '@/api/lyg/index'
import { formatNumValue } from '@/utils/utils'

// 物资领用占比渲染：保留两位小数 + %
const renderPercent = (raw: any) => {
  if (raw === undefined || raw === null || raw === '') return '-'
  if (isNaN(Number(raw))) return raw
  return formatNumValue(raw, 2) + '%'
}

const extraColumns = [
  { prop: 'jsfs', label: '结算方式', width: 150 },
  {
    prop: 'erpztys',
    label: '年度预算',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.erpztys)
  },
  {
    prop: 'settlementAmt',
    label: '年度结算金额',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.settlementAmt)
  },
  {
    prop: 'materialUseAmt',
    label: '物资领用金额',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.materialUseAmt)
  },
  {
    prop: 'ljjsje',
    label: '累计结算金额',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    render: ({ row }: any) => formatNumValue(row.ljjsje)
  },
  {
    prop: 'wzlyzb',
    label: '物资领用占比(%)',
    width: 150,
    align: 'center',
    headerAlign: 'center',
    render: ({ row }: any) => renderPercent(row.wzlyzb)
  }
]
</script>
