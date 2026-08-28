import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.lygBudget
export interface Params {
  [key: string]: any
}
export const getMaterialPriceLibraryPage = (params: Params): Promise<Result> => {
  return budget.post('material-price-library/getPage', params, {}, false)
}
export const importMaterialPriceLibrary = (formData: FormData): Promise<Result> => {
  return budget.post('material-price-library/importData', formData, {}, false)
}
export const exportMaterialPriceLibrary = (params: Params): Promise<Result> => {
  return budget.exportFile('material-price-library/exportData', params)
}

// ========== 物料历史价格 ==========
// 物料历史价格-分页查询
export const getMaterialPriceHistoryPage = (params: Params): Promise<Result> => {
  return budget.post('material-price-history/getPage', params, {}, false)
}
// 物料历史价格-导出数据
export const exportMaterialPriceHistory = (params: Params): Promise<Result> => {
  return budget.exportFile('material-price-history/exportData', params)
}
// 物料历史价格-同步数据
export const syncMaterialPriceHistory = (): Promise<Result> => {
  return budget.post('material-price-history/syncData', {}, {}, false)
}
