import type { VxeGridProps } from 'vxe-table'
import Decimal from 'decimal.js'
import { formatNumValue } from '@/utils/utils'

type VxeColumn = NonNullable<VxeGridProps['columns']>[number]

const renderAmount = (raw: any) => {
  if (raw === undefined || raw === null || raw === '') return '-'
  const val = new Decimal(raw)
  return formatNumValue(val.toString(), 2)
}

const renderRate = (numerator: any, denominator: any) => {
  if (
    numerator === undefined || numerator === null || numerator === '' ||
    denominator === undefined || denominator === null || denominator === ''
  ) return '-'
  const den = new Decimal(denominator)
  if (den.isZero()) return '-'
  const rate = new Decimal(numerator).div(den).times(100)
  return formatNumValue(rate.toString(), 2)
}

const COMMON_COLUMNS: VxeColumn[] = [
  { type: 'seq', width: 50, title: '序号' },
  { field: 'pspid', title: '项目编码', width: 150 },
  { field: 'post1', title: '项目名称', minWidth: 300, align: 'left', headerAlign: 'center' },
  { field: 'zyear', title: '年度', width: 80 },
  { field: 'qkjxmlxmc', title: '项目类型', width: 180 },
  { field: 'qkjejdwName', title: '二级单位', width: 150 },
  { field: 'qkjgkbmName', title: '市归口部门', width: 180 },
  { field: 'applyCenterName', title: '实施部门', width: 150 },
  { field: 'projectManagerName', title: '责任人', width: 120 },
  { field: 'directorName', title: '责任主任', width: 120 },
  { field: 'projectProgressName', title: '项目阶段', width: 120 }
]

interface ScenarioConfig {
  columns: VxeColumn[]
  title: string
  exportFileName: string
}

const buildOverdueColumns = (dateField: string, dateTitle: string, isWarning: boolean): VxeColumn[] => [
  { field: dateField, title: dateTitle, width: 150 },
  { field: 'cqts', title: isWarning ? '超期天数' : '距离超期天数', width: 120 }
]

const SCENARIO_MAP: Record<string, ScenarioConfig> = {
  '1-TX': { columns: buildOverdueColumns('milestoneDate', '项目出库日期', false), title: '项目立项提醒', exportFileName: '项目立项提醒明细' },
  '1-YJ': { columns: buildOverdueColumns('milestoneDate', '项目出库日期', false), title: '项目立项预警', exportFileName: '项目立项预警明细' },
  '1-JG': { columns: buildOverdueColumns('milestoneDate', '项目出库日期', true), title: '项目立项警告', exportFileName: '项目立项警告明细' },

  '2-TX': { columns: buildOverdueColumns('milestoneDate', '项目立项日期', false), title: '计划提报提醒', exportFileName: '计划提报提醒明细' },
  '2-YJ': { columns: buildOverdueColumns('milestoneDate', '项目立项日期', false), title: '计划提报预警', exportFileName: '计划提报预警明细' },
  '2-JG': { columns: buildOverdueColumns('milestoneDate', '项目立项日期', true), title: '计划提报警告', exportFileName: '计划提报警告明细' },

  '3-TX': { columns: buildOverdueColumns('milestoneDate', '首笔中标时间', false), title: '合同签订提醒', exportFileName: '合同签订提醒明细' },
  '3-YJ': { columns: buildOverdueColumns('milestoneDate', '首笔中标时间', false), title: '合同签订预警', exportFileName: '合同签订预警明细' },
  '3-JG': { columns: buildOverdueColumns('milestoneDate', '首笔中标时间', true), title: '合同签订警告', exportFileName: '合同签订警告明细' },

  '7-TX': { columns: buildOverdueColumns('milestoneDate', '项目竣工时间', false), title: '结算送审提醒', exportFileName: '结算送审提醒明细' },
  '7-YJ': { columns: buildOverdueColumns('milestoneDate', '项目竣工时间', false), title: '结算送审预警', exportFileName: '结算送审预警明细' },
  '7-JG': { columns: buildOverdueColumns('milestoneDate', '项目竣工时间', true), title: '结算送审警告', exportFileName: '结算送审警告明细' },

  '8-TX': { columns: buildOverdueColumns('milestoneDate', '项目竣工时间', false), title: '结算审定提醒', exportFileName: '结算审定提醒明细' },
  '8-YJ': { columns: buildOverdueColumns('milestoneDate', '项目竣工时间', false), title: '结算审定预警', exportFileName: '结算审定预警明细' },
  '8-JG': { columns: buildOverdueColumns('milestoneDate', '项目竣工时间', true), title: '结算审定警告', exportFileName: '结算审定警告明细' },

  '9-TX': {
    columns: [
      {
        field: 'yearBudget',
        title: '年度预算(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.yearBudget)
      },
      {
        field: 'settlementAmt',
        title: '年度结算金额(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.settlementAmt)
      }
    ],
    title: '季度未结算',
    exportFileName: '季度未结算明细'
  },
  '9-YJ': {
    columns: [
      { field: 'jsfsName', title: '结算方式', width: 120 },
      {
        field: 'yearBudget',
        title: '年度预算(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.yearBudget)
      },
      {
        field: 'settlementAmt',
        title: '年度结算金额(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.settlementAmt)
      },
      {
        field: 'jsjd',
        title: '结算进度(%)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderRate(row.settlementAmt, row.yearBudget)
      }
    ],
    title: '结算进度为零',
    exportFileName: '结算进度为零明细'
  },
  '9-JG': {
    columns: [
      {
        field: 'yearBudget',
        title: '年度预算(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.yearBudget)
      },
      {
        field: 'materialUseAmt',
        title: '物资领用金额(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.materialUseAmt)
      },
      {
        field: 'ljjsje',
        title: '累计结算金额(元)',
        width: 130,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.ljjsje)
      },
      { field: 'materialUseRate', title: '物资领用占比(%)' }
    ],
    title: '纯物资领用项目',
    exportFileName: '纯物资领用项目明细'
  },
  '4-TX': {
    columns: [
      { field: 'milestoneDate', title: '项目竣工日期', width: 150 },
      { field: 'firstAuditDate', title: '首次审定时间', width: 150 },
      {
        field: 'projectTotalBudget',
        title: '项目总预算(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.projectTotalBudget)
      },
      {
        field: 'ljjsje',
        title: '累计结算金额(元)',
        width: 130,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.ljjsje)
      },
      { field: 'lastSettlementDate', title: '最后结算日期', width: 150 },
      { field: 'cqts', title: '距离超期天数', width: 120 }
    ],
    title: '项目关闭提醒',
    exportFileName: '项目关闭提醒明细'
  },
  '4-YJ': {
    columns: [
      { field: 'milestoneDate', title: '项目竣工日期', width: 150 },
      { field: 'firstAuditDate', title: '首次审定时间', width: 150 },
      {
        field: 'projectTotalBudget',
        title: '项目总预算(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.projectTotalBudget)
      },
      {
        field: 'ljjsje',
        title: '累计结算金额(元)',
        width: 130,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.ljjsje)
      },
      { field: 'lastSettlementDate', title: '最后结算日期', width: 150 },
      { field: 'cqts', title: '距离超期天数', width: 120 }
    ],
    title: '项目关闭预警',
    exportFileName: '项目关闭预警明细'
  },
  '4-JG': {
    columns: [
      { field: 'milestoneDate', title: '项目竣工日期', width: 150 },
      { field: 'firstAuditDate', title: '首次审定时间', width: 150 },
      {
        field: 'projectTotalBudget',
        title: '项目总预算(元)',
        width: 120,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.projectTotalBudget)
      },
      {
        field: 'ljjsje',
        title: '累计结算金额(元)',
        width: 130,
        align: 'right',
        headerAlign: 'center',
        formatter: ({ row }: any) => renderAmount(row.ljjsje)
      },
      { field: 'lastSettlementDate', title: '最后结算日期', width: 150 },
      { field: 'cqts', title: '超期天数', width: 120 }
    ],
    title: '项目关闭警告',
    exportFileName: '项目关闭警告明细'
  }
}

export const getScenarioConfig = (yjhj: string, yjlx: string): ScenarioConfig => {
  const key = `${yjhj}-${yjlx}`
  const config = SCENARIO_MAP[key]
  if (!config) {
    return { columns: [], title: '预警明细', exportFileName: '预警明细' }
  }
  return config
}

export const getDetailColumns = (yjhj: string, yjlx: string): VxeColumn[] => {
  const { columns } = getScenarioConfig(yjhj, yjlx)
  return [...COMMON_COLUMNS, ...columns]
}

export const getExportFileName = (yjhj: string, yjlx: string): string => {
  return getScenarioConfig(yjhj, yjlx).exportFileName
}

export const getModalTitle = (yjhj: string, yjlx: string): string => {
  return getScenarioConfig(yjhj, yjlx).title
}
