import type { VxeGridProps } from 'vxe-table'
import { getMaterialTaskPage } from '@/api/suzhou/materialTask'
import type { CrudPageConfig } from '@/views/suzhou/common/types/crud'
import type { MaterialTaskRow } from '@/views/suzhou/common/types/material'

export const MATERIAL_TASK_STATUS_CODE = 'MATERIAL_JUDGMENT_TASK_STATUS_COM'

export const MATERIAL_TASK_COLUMNS: VxeGridProps<MaterialTaskRow>['columns'] = [
  { type: 'checkbox', width: 50, headerAlign: 'center', align: 'center' },
  { field: 'nd', title: '年度', minWidth: 80, headerAlign: 'center', align: 'center', visible: true },
  { field: 'yd', title: '月度', minWidth: 80, headerAlign: 'center', align: 'center', visible: true },
  { field: 'yjdw', title: '一级单位', minWidth: 180, headerAlign: 'center', align: 'center', visible: true },
  { field: 'ejdw', title: '二级单位', minWidth: 180, headerAlign: 'center', align: 'center', visible: true },
  { field: 'taskName', title: '任务名称', width: 180, headerAlign: 'center', align: 'center', visible: false },
  { field: 'taskNo', title: '任务编号', width: 120, headerAlign: 'center', align: 'center', visible: true },
  {
    field: 'taskName',
    title: '任务名称',
    minWidth: 180,
    headerAlign: 'center',
    align: 'left',
    visible: true,
    slots: { default: 'taskName_default' }
  },
  { field: 'statusName', title: '任务状态', width: 80, headerAlign: 'center', align: 'center', visible: true },
  { field: 'startTime', title: '任务开始时间', width: 150, headerAlign: 'center', align: 'center', visible: true },
  { field: 'endTime', title: '任务结束时间', width: 150, headerAlign: 'center', align: 'center', visible: true },
  { field: 'createUserName', title: '创建人姓名', width: 100, headerAlign: 'center', align: 'center', visible: true },
  { field: 'createTime', title: '创建时间', width: 150, headerAlign: 'center', align: 'center', visible: true }
]

export const MATERIAL_TASK_PAGE_CONFIG: CrudPageConfig<MaterialTaskRow> = {
  columns: MATERIAL_TASK_COLUMNS,
  searchApi: getMaterialTaskPage
}
