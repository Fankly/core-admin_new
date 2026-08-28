import baseService from '@/service/baseService'

interface DwList {
  code: string
  nodeType: string
}

export interface Data {
  busiType: string
  dwId: string
  dwList: DwList[]
  endDate: string
  indicators: string
  parentId: number | string
  startDate: string
  xmlbIds: string
}

export interface ProYapMbaSearch {
  busiType: string
  dwId: string
  dwList: DwList[]
  ysnd: string
  indicators: string
  parentId: number | string
  saveDate: string
  xmlbIds: string
}

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

// 获取数据
export const getDataListByDw = (params: Data): Promise<Result> => {
  return baseService.post('budgetStatistics/getDataListByDw', params)
}

// 获取数据
export const getProYapMbzData = (params: any): Promise<Result> => {
  return baseService.post(`/xmYapMbz/getData`, params)
}

// 获取动态表格
export const getDynamicColumnByDw = (params: Data | ProYapMbaSearch): Promise<Result> => {
  return baseService.post('budgetStatistics/getDynamicColumnByDw', params)
}
