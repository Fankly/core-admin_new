import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

export interface CkData {
  isYap: string
  nd: string
  xmIds: string[]
}

export interface SqckSearchData {
  [key: string]: string
}

export interface YssxByYssxData {
  nd: string
  yssxNewId: string
}

// 出库
export const stockOutData = (params: string[]): Promise<Result> => {
  return baseService.post('/sqckConfirm/sqckConfirm', params)
}

// 导出
export const exportData = (params: SqckSearchData): Promise<Result> => {
  return baseService.export('/sqckConfirm/export', params)
}

// 获取申请出库列表
export const getSqckPage = (params: YssxByYssxData): Promise<Result> => {
  return baseService.post(`/sqckConfirm/getSqckConfirmPage`, params)
}

//  退回
export const thData = (params: any): Promise<Result> => {
  return baseService.post(`/sqckConfirm/th`, params)
}
