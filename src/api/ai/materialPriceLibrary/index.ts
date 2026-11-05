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

// ========== 物料历史价格-新 ==========
// 物料历史价格-分页查询(按物料聚合最新/最低/最高)-新
export const getPageNew = (params: Params): Promise<Result> => {
  return budget.post('material-price-history/getPageNew', params, {}, false)
}
// 物料历史价格-分页查询明细(穿透弹框)-新
export const getPageDetail = (params: Params): Promise<Result> => {
  return budget.post('material-price-history/getPageDetail', params, {}, false)
}
// 物料历史价格-导出数据(按物料聚合最新/最低/最高)-新
export const exportDataNew = (params: Params): Promise<Result> => {
  return budget.exportFile('material-price-history/exportDataNew', params)
}

// ========== 物料历史价格-扩展(扩展编码/扩展描述维度) ==========
// 物料历史价格-分页查询(按物料聚合最新/最低/最高)-扩展
export const getPageExtNew = (params: Params): Promise<Result> => {
  return budget.post('material-extent-price-history/getPageNew', params, {}, false)
}
// 物料历史价格-分页查询明细(穿透弹框)-扩展
export const getPageExtDetail = (params: Params): Promise<Result> => {
  return budget.post('material-extent-price-history/getPageDetail', params, {}, false)
}
// 物料历史价格-导出数据(按物料聚合最新/最低/最高)-扩展
export const exportExtDataNew = (params: Params): Promise<Result> => {
  return budget.exportFile('material-extent-price-history/exportDataNew', params)
}
