import type { VxeGridProps } from 'vxe-table'
import type { SmartTaskAuditGridOptions, SmartTaskAuditRow } from './types'
import { formatEmpty } from './utils'

type SmartTaskAuditColumn = NonNullable<VxeGridProps<SmartTaskAuditRow>['columns']>[number]

const centerConfig: Pick<SmartTaskAuditColumn, 'align' | 'headerAlign' | 'showOverflow'> = {
  align: 'center',
  headerAlign: 'center',
  showOverflow: true
}

export const createGridOptions = (): SmartTaskAuditGridOptions => ({
  border: true,
  stripe: true,
  loading: false,
  height: '100%',
  align: 'center',
  headerAlign: 'center',
  showOverflow: true,
  showHeaderOverflow: true,
  columnConfig: {
    resizable: true
  },
  rowConfig: {
    height: 32
  },
  checkboxConfig: {
    trigger: 'row',
    highlight: true
  },
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left' },
    {
      field: 'taskName',
      title: '任务名称',
      fixed: 'left',
      minWidth: 240,
      align: 'left',
      headerAlign: 'center',
      showOverflow: true,
      slots: { default: 'taskName_default' }
    },
    { field: 'xmbm', title: '项目编码', minWidth: 160, ...centerConfig },
    {
      field: 'proTypeName',
      title: '项目类型',
      minWidth: 150,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.proTypeName || row.proType)
    },
    { field: 'jhssnd', title: '计划实施年度', width: 130, ...centerConfig },
    { field: 'yjdw', title: '一级单位', minWidth: 160, ...centerConfig },
    { field: 'ejdw', title: '二级单位', minWidth: 160, ...centerConfig },
    {
      field: 'isHisName',
      title: '是否历史',
      width: 110,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.isHisName || row.isHis)
    },
    {
      field: 'priorityName',
      title: '优先级',
      width: 100,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.priorityName || row.priority)
    },
    { field: 'createTime', title: '创建时间', minWidth: 160, ...centerConfig },
    { field: 'startTime', title: '开始时间', minWidth: 160, ...centerConfig },
    { field: 'finishTime', title: '结束时间', minWidth: 160, ...centerConfig },
    {
      field: 'docPreStatusName',
      title: '文档预处理状态',
      width: 120,
      ...centerConfig,
      fixed: 'right'
    },
    {
      field: 'statusName',
      title: '审核任务状态',
      width: 120,
      ...centerConfig,
      fixed: 'right'
    },
    {
      field: 'ruleName',
      title: '当前执行规则',
      width: 120,
      ...centerConfig,
      fixed: 'right'
    }
  ],
  data: []
})
