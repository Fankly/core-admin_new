import type { VxeGridProps } from 'vxe-table'
import { exportMaterialTaskDetailAll, getMaterialTaskDetail } from '@/api/suzhou/materialTask'
import type { CrudPageConfig, CrudRequest } from '@/views/suzhou/common/types/crud'
import type { MaterialTaskDetailRow } from '@/views/suzhou/common/types/material'

export const MATERIAL_TASK_DETAIL_STATUS_CODE = 'MATERIAL_JUDGMENT_DETAIL_STATUS_COM'

export const MATERIAL_TASK_DETAIL_COLUMNS: VxeGridProps<MaterialTaskDetailRow>['columns'] = [
  { type: 'seq', width: 60, title: '序号', headerAlign: 'center', align: 'center', fixed: 'left' },
  { field: 'mjahr', title: '年度', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'budatMkpf', title: '过账日期', width: 120, headerAlign: 'center', align: 'center' },
  { field: 'pspid', title: '项目定义', width: 160, headerAlign: 'center', align: 'center' },
  { field: 'post1', title: '项目描述', minWidth: 200, headerAlign: 'center', align: 'left' },
  { field: 'matnr', title: '物料编码', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'maktx', title: '物料描述', minWidth: 180, headerAlign: 'center', align: 'left' },
  { field: 'mblnr', title: '凭证编码', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'menge', title: '数量', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'unitPrice', title: '单价', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'proType', title: '项目类型', width: 120, headerAlign: 'center', align: 'center' },
  { field: 'yjdw', title: '一级单位', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'ejdw', title: '二级单位', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'applyCenter', title: '归口部门', width: 120, headerAlign: 'center', align: 'center' },
  { field: 'createor', title: '创建人', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'updater', title: '修改人', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'xqSubmitUsername', title: '需求提交人', width: 100, headerAlign: 'center', align: 'center' },
  { field: 'sourceDirCode', title: 'Ⅲ级目录编码', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'sourceDirDesc', title: '同源目录对应名称', minWidth: 160, headerAlign: 'center', align: 'left' },
  { field: 'confirmIsGdzcName', title: '确认是否为固定资产（是/否）', width: 140, headerAlign: 'center', align: 'center' },
  { field: 'reasonWhenNotGdzc', title: '如判断不为固定资产，请说明原因', minWidth: 180, headerAlign: 'center', align: 'left' },
  { field: 'reasonWhenWzgGdzc', title: '如判断确为固定资产并已整改请简要说明', minWidth: 180, headerAlign: 'center', align: 'left' },
  { field: 'reasonWhenYzgGdzc', title: '如判断确为固定资产但尚未整改，请说明整改方案', minWidth: 180, headerAlign: 'center', align: 'left' },
  {
    field: 'fileNameList',
    title: '佐证材料',
    width: 150,
    headerAlign: 'center',
    align: 'left',
    showOverflow: false,
    slots: { default: 'fileNameList_default' }
  },
  { field: 'statusName', title: '状态', width: 100, headerAlign: 'center', align: 'center', fixed: 'right' }
]

export const MATERIAL_TASK_DETAIL_PAGE_CONFIG: CrudPageConfig<MaterialTaskDetailRow> = {
  columns: MATERIAL_TASK_DETAIL_COLUMNS,
  searchApi: getMaterialTaskDetail
}

export const MATERIAL_TASK_DETAIL_EXPORT_API: CrudRequest = exportMaterialTaskDetailAll
export const MATERIAL_TASK_DETAIL_EXPORT_FILE_NAME = '物料任务明细'
