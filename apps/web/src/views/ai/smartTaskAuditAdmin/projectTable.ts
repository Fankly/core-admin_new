import type { VxeGridProps } from 'vxe-table'
import type { SmartTaskAuditProjectGridOptions, SmartTaskAuditProjectRow } from './types'
import { formatEmpty } from './utils'

type SmartTaskAuditProjectColumn = NonNullable<VxeGridProps<SmartTaskAuditProjectRow>['columns']>[number]

const centerConfig: Pick<SmartTaskAuditProjectColumn, 'align' | 'headerAlign' | 'showOverflow'> = {
  align: 'center',
  headerAlign: 'center',
  showOverflow: true
}

export const createProjectGridOptions = (): SmartTaskAuditProjectGridOptions => ({
  border: true,
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
    highlight: true,
    range: true
  },
  columns: [
    { type: 'checkbox', width: 50, fixed: 'left' },
    { type: 'seq', width: 60, title: '序号', fixed: 'left' },
    { field: 'xmmc', title: '项目名称', fixed: 'left', minWidth: 240, align: 'left', headerAlign: 'center', showOverflow: true },
    { field: 'xmbm', title: '项目编码', minWidth: 160, ...centerConfig },
    { field: 'jhssnd', title: '计划实施年度', width: 130, ...centerConfig },
    { field: 'proType', title: '项目类型', minWidth: 150, ...centerConfig },
    { field: 'yjdw', title: '一级单位', minWidth: 160, ...centerConfig },
    { field: 'ejdw', title: '二级单位', minWidth: 160, ...centerConfig },
    { field: 'yjfl', title: '一级分类', width: 130, ...centerConfig },
    { field: 'ejfl', title: '二级分类', width: 130, ...centerConfig },
    { field: 'sjfl', title: '三级分类', width: 130, ...centerConfig },
    { field: 'flowStatus', title: '流程状态', width: 130, ...centerConfig },
    {
      field: 'amount',
      title: '申报预算（万元）',
      width: 150,
      align: 'right',
      headerAlign: 'center',
      formatter: ({ row }) => formatEmpty(row.amount)
    },
    { field: 'createDep', title: '创建部门', minWidth: 160, ...centerConfig },
    { field: 'createor', title: '创建人', width: 110, ...centerConfig },
    { field: 'createTime', title: '创建时间', minWidth: 160, ...centerConfig }
  ],
  data: []
})
