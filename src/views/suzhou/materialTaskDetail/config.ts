import type { VxeGridProps } from 'vxe-table'
import { exportMaterialTaskDetailAll, getMaterialTaskDetail } from '@/api/suzhou/materialTask'
import type { CrudPageConfig, CrudRequest } from '@/views/suzhou/common/types/crud'
import type { MaterialTaskDetailRow } from '@/views/suzhou/common/types/material'

export const MATERIAL_TASK_DETAIL_STATUS_CODE = 'MATERIAL_JUDGMENT_DETAIL_STATUS_COM'
export const GY_SF = 'GY_SF'
export const MATERIAL_JUDGMENT_DETAIL_CONFIRM_IS_GDZC_COM = 'MATERIAL_JUDGMENT_DETAIL_CONFIRM_IS_GDZC_COM'

export const MATERIAL_TASK_DETAIL_COLUMNS: VxeGridProps<MaterialTaskDetailRow>['columns'] = [
  { type: 'checkbox', width: 50, headerAlign: 'center', align: 'center', fixed: 'left' },
  { type: 'seq', width: 60, title: '序号', headerAlign: 'center', align: 'center', fixed: 'left' },
  { field: 'budatMkpf', title: '过账日期', width: 120, headerAlign: 'center', align: 'center' },
  { field: 'matnr', title: '物料编码', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'maktx', title: '物料描述', minWidth: 180, headerAlign: 'center', align: 'left' },
  { field: 'zkzmst', title: '物料扩展描述', minWidth: 180, headerAlign: 'center', align: 'left' },
  { field: 'menge', title: '数量', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'unitPrice', title: '单价（元）', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'sourceDirCode', title: 'Ⅲ级目录编码', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'sourceDirDesc', title: '同源目录对应名称', minWidth: 160, headerAlign: 'center', align: 'left' },
  { field: 'confirmIsGdzcName', title: '是否独立资产', width: 140, headerAlign: 'center', align: 'center' },
  {
    field: 'reasonWhenYzgGdzc',
    title: '独立资产（是）',
    headerAlign: 'center',
    align: 'center',
    children: [
      { field: 'reasonWhenWzgGdzcName', title: '是否已整改', minWidth: 120, headerAlign: 'center', align: 'center' },
      { field: 'reasonWhenYzgGdzc', title: '整改日期', minWidth: 150, headerAlign: 'center', align: 'center' }
    ]
  },
  {
    field: 'reasonWhenNotGdzc',
    title: '非独立资产（否）',
    headerAlign: 'center',
    align: 'center',
    children: [{ field: 'reasonWhenNotGdzc', title: '原因说明', minWidth: 180, headerAlign: 'center', align: 'left' }]
  },
  { field: 'pspid', title: '项目定义', width: 160, headerAlign: 'center', align: 'center' },
  { field: 'post1', title: '项目描述', minWidth: 200, headerAlign: 'center', align: 'left' },
  { field: 'proType', title: '项目类型', width: 120, headerAlign: 'center', align: 'center' },
  { field: 'yjdw', title: '一级单位', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'ejdw', title: '二级单位', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'applyCenter', title: '归口部门', width: 120, headerAlign: 'center', align: 'center' },
  { field: 'mblnr', title: '凭证编码', width: 140, headerAlign: 'center', align: 'center' },
  // { field: 'createor', title: '创建人', width: 100, headerAlign: 'center', align: 'center' },
  // { field: 'updater', title: '修改人', width: 100, headerAlign: 'center', align: 'center' },
  // { field: 'xqSubmitUsername', title: '需求提交人', width: 100, headerAlign: 'center', align: 'center' },
  {
    field: 'fileNameList',
    title: '佐证材料',
    width: 150,
    headerAlign: 'center',
    align: 'left',
    showOverflow: false,
    slots: { default: 'fileNameList_default' }
  },
  { field: 'statusName', title: '状态', width: 120, headerAlign: 'center', align: 'center', fixed: 'right' }
]

export const MATERIAL_TASK_DETAIL_PAGE_CONFIG: CrudPageConfig<MaterialTaskDetailRow> = {
  columns: MATERIAL_TASK_DETAIL_COLUMNS,
  searchApi: getMaterialTaskDetail
}

export const MATERIAL_TASK_DETAIL_EXPORT_API: CrudRequest = exportMaterialTaskDetailAll
export const MATERIAL_TASK_DETAIL_EXPORT_FILE_NAME = '物料任务明细'
