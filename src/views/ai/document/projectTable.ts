import type { VxeGridProps } from 'vxe-table'
import type { ProjectGridOptions, ProjectRow } from './types'
import { formatEmpty } from './utils'

type ProjectColumn = NonNullable<VxeGridProps<ProjectRow>['columns']>[number]

const centerConfig: Pick<ProjectColumn, 'align' | 'headerAlign' | 'showOverflow'> = {
  align: 'center',
  headerAlign: 'center',
  showOverflow: true
}

export const createProjectGridOptions = (): ProjectGridOptions => ({
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
    { field: 'xmbm', title: '项目编码', minWidth: 170, ...centerConfig },
    {
      field: 'proType',
      title: '项目类型',
      minWidth: 160,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.proTypeName || row.proType)
    },
    { field: 'jhssnd', title: '计划实施年度', width: 130, ...centerConfig },
    {
      field: 'yjdw',
      title: '一级单位',
      minWidth: 170,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.yjdwName || row.yjdw)
    },
    {
      field: 'ejdw',
      title: '二级单位',
      minWidth: 170,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.ejdwName || row.ejdw)
    },
    {
      field: 'flowStatus',
      title: '流程状态',
      width: 130,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.flowStatusName || row.flowStatus)
    },
    {
      field: 'amount',
      title: '申报预算（万元）',
      width: 150,
      align: 'right',
      headerAlign: 'center',
      formatter: ({ row }) => formatEmpty(row.amount)
    }
  ],
  data: []
})
