import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

export interface Params {
  [key: string]: any
}

// 出库
export const sqckConfirm = (params: Params): Promise<Result> => {
  return baseService.post('/sqckConfirmNew/sqckConfirm', params)
}

// 导出
export const exportData = (params: Params): Promise<Result> => {
  return baseService.export('/sqckConfirmNew/export', params)
}

// 获取申请出库列表
export const getSqckConfirmPage = (params: Params): Promise<Result> => {
  return baseService.post(`/sqckConfirmNew/getSqckConfirmPage`, params)
}

// 穿透导出
export const exportDrillThrough = (params: Params): Promise<Result> => {
  return baseService.export('/sqckConfirmNew/exportCtData', params)
}

// 穿透列表
export const getDrillThroughPage = (params: Params): Promise<Result> => {
  return baseService.post(`/sqckConfirmNew/getCtData`, params)
}

// 获取上会信息
export const getShxx = (params: Params): Promise<Result> => {
  return baseService.get(`/sqckConfirmNew/getShxx`, params)
}

// 获取集中修改页面动态配置(多级表头)
export const getDynamicColumnByHzxx = (params: Params): Promise<Result> => {
  return baseService.post(`/sqckConfirmNew/getDynamicColumnByHzxx`, params)
}
