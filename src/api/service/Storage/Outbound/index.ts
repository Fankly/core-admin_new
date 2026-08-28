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
export const stockOutData = (params: CkData): Promise<Result> => {
  return baseService.post('/sqck/ck', params)
}

// 导出
export const exportData = (params: SqckSearchData): Promise<Result> => {
  return baseService.export('/sqck/export', params)
}

// 获取申请出库列表
export const getSqckPage = (params: YssxByYssxData): Promise<Result> => {
  return baseService.post(`/sqck/getSqckPage`, params)
}

//  退回
export const thData = (params: any): Promise<Result> => {
  return baseService.post(`/sqck/th`, params)
}

// 非AB项目退回
export const unABTh = (params: any): Promise<Result> => {
  return baseService.post(`/sqck/unABTh`, params)
}

interface whXmyxjParams {
  ids: string[]
  xmyxj: string
}

// 维护项目优先级
export const whXmyxj = (params: whXmyxjParams): Promise<Result> => {
  return baseService.post(`/sqck/whXmyxj`, params)
}
