import type { VxeGridProps } from 'vxe-table'
import type { FormField } from '@/components/FormModal'
import {
  deleteMaterialResult,
  getMaterialPage,
  saveMaterialResult,
  addMaterialResult,
  editMaterialResult,
  exportMaterialResult
} from '@/api/suzhou/material'
import type { CrudPageConfig, CrudToolbarConfig } from '@/views/suzhou/common/types/crud'
import type { MaterialRow } from '@/views/suzhou/common/types/material'
import { DEFAULT_MATERIAL_TITLE } from '@/views/suzhou/material/utils/titleConfig'

export const MATERIAL_COLUMNS: VxeGridProps<MaterialRow>['columns'] = [
  { type: 'checkbox', width: 60, headerAlign: 'center', align: 'center', fixed: 'left' },
  { field: 'materialCode', title: '物料编码', width: 160, headerAlign: 'center', align: 'center', visible: true, fixed: 'left' },
  { field: 'materialDesc', title: '物料描述', minWidth: 180, headerAlign: 'center', align: 'left', visible: true, fixed: 'left' },
  { field: 'bigCategoryCode', title: '大类编码', width: 140, headerAlign: 'center', align: 'center', visible: true },
  { field: 'bigCategoryDesc', title: '大类描述', minWidth: 160, headerAlign: 'center', align: 'left', visible: true },
  { field: 'middleCategoryCode', title: '中类编码', width: 140, headerAlign: 'center', align: 'center', visible: true },
  { field: 'middleCategoryDesc', title: '中类描述', minWidth: 160, headerAlign: 'center', align: 'left', visible: true },
  { field: 'smallCategoryCode', title: '小类编码', width: 140, headerAlign: 'center', align: 'center', visible: true },
  { field: 'smallCategoryDesc', title: '小类描述', minWidth: 160, headerAlign: 'center', align: 'left', visible: true },
  // { field: 'materialGroupCode', title: '物料组编码', width: 140, headerAlign: 'center', align: 'center', visible: true },
  // { field: 'freezeMark', title: '冻结标识', width: 120, headerAlign: 'center', align: 'center', visible: true },
  { field: 'isAssetLevelEquipmentName', title: '是否资产级设备', width: 160, headerAlign: 'center', align: 'center', visible: true },
  { field: 'sourceDirCode', title: 'Ⅲ级目录编码', width: 140, headerAlign: 'center', align: 'center', visible: true },
  { field: 'sourceDirDesc', title: '同源目录描述', minWidth: 180, headerAlign: 'center', align: 'left', visible: true }
]

export const MATERIAL_FORM_FIELDS: FormField[] = [
  {
    prop: 'materialCode',
    label: '物料编码',
    type: 'input',
    maxlength: 60,
    required: true
  },
  {
    prop: 'materialDesc',
    label: '物料描述',
    type: 'input',
    maxlength: 120,
    required: true
  },
  // {
  //   prop: 'materialGroupCode',
  //   label: '物料组编码',
  //   type: 'input',
  //   maxlength: 60
  // },
  {
    prop: 'bigCategoryCode',
    label: '大类编码',
    type: 'input',
    maxlength: 60
  },
  {
    prop: 'bigCategoryDesc',
    label: '大类描述',
    type: 'input',
    maxlength: 120
  },
  {
    prop: 'middleCategoryCode',
    label: '中类编码',
    type: 'input',
    maxlength: 60
  },
  {
    prop: 'middleCategoryDesc',
    label: '中类描述',
    type: 'input',
    maxlength: 120
  },
  {
    prop: 'smallCategoryCode',
    label: '小类编码',
    type: 'input',
    maxlength: 60
  },
  {
    prop: 'smallCategoryDesc',
    label: '小类描述',
    type: 'input',
    maxlength: 120
  },
  // {
  //   prop: 'freezeMark',
  //   label: '冻结标识',
  //   type: 'input',
  //   maxlength: 20
  // },
  {
    prop: 'isAssetLevelEquipment',
    label: '是否资产级设备',
    type: 'select',
    options: [
      { label: '是', value: '1' },
      { label: '否', value: '0' }
    ]
  },
  {
    prop: 'sourceDirCode',
    label: 'Ⅲ级目录编码',
    type: 'input',
    maxlength: 20
  },
  {
    prop: 'sourceDirDesc',
    label: '同源目录描述',
    type: 'input',
    maxlength: 120
  }
]

export const MATERIAL_PAGE_CONFIG: CrudPageConfig<MaterialRow> = {
  columns: MATERIAL_COLUMNS,
  searchApi: getMaterialPage,
  defaultSearchParams: {
    isAssetLevelEquipment: '1'
  }
}

export const MATERIAL_TOOLBAR_CONFIG: CrudToolbarConfig<MaterialRow> = {
  formFields: MATERIAL_FORM_FIELDS,
  getDefaultFormData: () => ({
    isAssetLevelEquipment: ''
  }),
  saveApi: saveMaterialResult,
  addApi: addMaterialResult,
  editApi: editMaterialResult,
  deleteApi: deleteMaterialResult,
  exportApi: exportMaterialResult,
  exportFileName: DEFAULT_MATERIAL_TITLE,
  useResponseFileName: false,
  getRowId: (row) => row.materialCode
}
