import type { VxeGridProps } from 'vxe-table'
import type { AttachTaskGridOptions, AttachTaskRow } from './types'
import { formatEmpty, getAttachTypeName, getPriorityName, getStatusName } from './utils'

type AttachTaskColumn = NonNullable<VxeGridProps<AttachTaskRow>['columns']>[number]

const centerConfig: Pick<AttachTaskColumn, 'align' | 'headerAlign' | 'showOverflow'> = {
  align: 'center',
  headerAlign: 'center',
  showOverflow: true
}

export const createGridOptions = (): AttachTaskGridOptions => ({
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
    { type: 'seq', width: 60, title: '序号', fixed: 'left' },
    { field: 'attachName', title: '附件名称', fixed: 'left', minWidth: 220, align: 'left', headerAlign: 'center', showOverflow: true },
    {
      field: 'fjName',
      title: '附件类型',
      fixed: 'left',
      minWidth: 150,
      ...centerConfig,
      formatter: ({ row }) => getAttachTypeName(row)
    },
    {
      field: 'priorityName',
      title: '优先级',
      fixed: 'left',
      width: 100,
      ...centerConfig,
      formatter: ({ row }) => row.priorityName || getPriorityName(row.priority)
    },
    { field: 'xmbm', title: '项目编码', minWidth: 160, ...centerConfig },
    { field: 'xmmc', title: '项目名称', minWidth: 220, align: 'left', headerAlign: 'center', showOverflow: true },
    {
      field: 'proTypeName',
      title: '项目类型',
      minWidth: 160,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.proTypeName || row.proType)
    },
    { field: 'jhssnd', title: '计划实施年度', width: 130, ...centerConfig },
    {
      field: 'yjdwName',
      title: '一级单位',
      minWidth: 180,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.yjdwName || row.yjdw)
    },
    {
      field: 'transcodeStatusName',
      title: '转码状态',
      width: 110,
      ...centerConfig,
      formatter: ({ row }) => row.transcodeStatusName || getStatusName(row.transcodeStatus)
    },
    { field: 'transcodeStartTime', title: '转码开始时间', minWidth: 160, ...centerConfig },
    {
      field: 'transcodeFinishTime',
      title: '转码结束时间',
      minWidth: 160,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.transcodeFinishTime || row.transcodeEndTime)
    },
    {
      field: 'extractStatusName',
      title: '提取状态',
      width: 110,
      ...centerConfig,
      formatter: ({ row }) => row.extractStatusName || getStatusName(row.extractStatus)
    },
    { field: 'extractStartTime', title: '提取开始时间', minWidth: 160, ...centerConfig },
    {
      field: 'extractFinishTime',
      title: '提取结束时间',
      minWidth: 160,
      ...centerConfig,
      formatter: ({ row }) => formatEmpty(row.extractFinishTime || row.extractEndTime)
    },
    { field: 'createTime', title: '创建时间', minWidth: 160, ...centerConfig }
  ],
  data: []
})
