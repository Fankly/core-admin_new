import type { VxeGridProps } from 'vxe-table'
import type { PointTaskListItem } from '@/api/ai/smartTaskAudit'
import { formatEmpty } from './utils'

/**
 * 单要点审核任务（接口文档：docs/单要点审核任务执行管理.md）
 *
 * 一个「智能审核任务」= 一个项目的全规则审核；
 * 一个「单要点审核任务」= 一个审核要点 × 多个原始审核任务（项目）。
 * 状态码值：0已取消 1未开始 2处理中 3已完成 4处理失败
 */
export type PointTaskRow = Partial<PointTaskListItem> & { [key: string]: any }

export interface PointTaskRuleOption {
  value: string
  label: string
  code: string
  name: string
  ruleName: string
}

export interface PointTaskTaskRow {
  taskId: string
  taskName: string
}

export const POINT_TASK_STATUS_OPTIONS = [
  { code: '1', name: '未开始' },
  { code: '2', name: '处理中' },
  { code: '3', name: '已完成' },
  { code: '4', name: '处理失败' },
  { code: '0', name: '已取消' }
]

export const pointTaskStatusName = (row: PointTaskRow): string => {
  const statusName = String(row.statusName || '').trim()
  if (statusName) return statusName
  const status = String(row.status ?? '').trim()
  return POINT_TASK_STATUS_OPTIONS.find((item) => item.code === status)?.name || '-'
}

/** 修改：仅未开始状态支持（文档：edit 仅未开始） */
export const canEditPointTask = (row: PointTaskRow): boolean => String(row.status ?? '').trim() === '1'

/** 删除：处理中、已完成状态不能删除（文档：remove） */
export const canDeletePointTask = (row: PointTaskRow): boolean => !['2', '3'].includes(String(row.status ?? '').trim())

/** 开始执行：仅未开始的任务可发起；是否已有其他处理中任务由后端兜底校验 */
export const canStartPointTask = (row: PointTaskRow): boolean => String(row.status ?? '').trim() === '1'

/** 取消执行：仅处理中状态可取消（文档：cancel） */
export const canCancelPointTask = (row: PointTaskRow): boolean => String(row.status ?? '').trim() === '2'

type PointTaskColumn = NonNullable<VxeGridProps<PointTaskRow>['columns']>[number]

const centerConfig: Pick<PointTaskColumn, 'align' | 'headerAlign' | 'showOverflow'> = {
  align: 'center',
  headerAlign: 'center',
  showOverflow: true
}

export const createPointTaskGridOptions = (): VxeGridProps<PointTaskRow> => ({
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
      field: 'auditPointCode',
      title: '审核要点编码',
      minWidth: 150,
      fixed: 'left',
      align: 'left',
      headerAlign: 'center',
      showOverflow: true,
      formatter: ({ row }) => formatEmpty(row.auditPointCode)
    },
    {
      field: 'auditPointName',
      title: '审核要点名称',
      minWidth: 240,
      align: 'left',
      headerAlign: 'center',
      showOverflow: true,
      formatter: ({ row }) => formatEmpty(row.auditPointName || row.ruleName)
    },
    {
      field: 'ruleName',
      title: '所属规则',
      minWidth: 200,
      align: 'left',
      headerAlign: 'center',
      showOverflow: true,
      formatter: ({ row }) => formatEmpty(row.ruleName)
    },
    {
      field: 'statusName',
      title: '状态',
      width: 110,
      ...centerConfig,
      slots: { default: 'status_default' }
    },
    {
      field: 'taskCount',
      title: '任务数',
      width: 90,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.taskCount)
    },
    {
      field: 'completedCount',
      title: '已完成',
      width: 90,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.completedCount)
    },
    { field: 'createTime', title: '创建时间', minWidth: 160, ...centerConfig },
    { field: 'startTime', title: '开始时间', minWidth: 160, ...centerConfig },
    { field: 'finishTime', title: '结束时间', minWidth: 160, ...centerConfig }
  ],
  data: []
})
