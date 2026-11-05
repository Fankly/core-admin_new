import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface MaterialResultPageParams {
  bmId?: string
  dwId?: string
  isAssetLevelEquipment?: string
  limit?: number
  materialCodeList?: any[]
  materialDesc?: string
  smallCategoryCodeList?: any[]
  page?: number
  roleCode?: string
  roleId?: string
}

export const getMaterialPage = (params: MaterialResultPageParams): Promise<Result> => {
  return budget.post('material-judgment-result/page', params)
}

interface SaveResultTaskParams {
  id?: string
  bigCategoryCode?: string
  bigCategoryDesc?: string
  freezeMark?: string
  isAssetLevelEquipment?: string
  materialCode?: string
  materialDesc?: string
  materialGroupCode?: string
  middleCategoryCode?: string
  middleCategoryDesc?: string
  smallCategoryCode?: string
  smallCategoryDesc?: string
  sourceDirDesc?: string
  sourceDirRowNumber?: string
  operator?: any
}

interface addOrEditResultTaskParams {
  data?: any
  operator?: any
}
interface deleteResultTaskParams {
  materialCodeList?: string[]
  operator?: any
}

export const saveMaterialResult = (params: SaveResultTaskParams): Promise<Result> => {
  return budget.post('material-judgment-result/save', params)
}

export const addMaterialResult = (params: addOrEditResultTaskParams): Promise<Result> => {
  return budget.post('material-judgment-result/add', params)
}

export const editMaterialResult = (params: addOrEditResultTaskParams): Promise<Result> => {
  return budget.post('material-judgment-result/edit', params)
}

export const materialCodeIsExists = (materialCode: string): Promise<Result> => {
  return budget.post(`material-judgment-result/materialCodeIsExists?materialCode=${materialCode}`)
}

export const saveResult = saveMaterialResult

export const deleteMaterialResult = (params: deleteResultTaskParams): Promise<Result> => {
  return budget.post('material-judgment-result/remove', params)
}

export const getLog = (params: { materialCode?: number | string; limit: number | string; page: number | string }): Promise<Result> => {
  return budget.post('material-judgment-result-log/page', params)
}

// 导出
export const exportMaterialResult = (params: MaterialResultPageParams) => {
  return budget.exportFile('material-judgment-result/exportData', params)
}
