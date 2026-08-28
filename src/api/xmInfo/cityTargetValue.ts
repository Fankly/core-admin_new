import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

interface BaseParams {
  dwId: string
  checkPropackYs: boolean
}

interface DataParams extends BaseParams {
  cj: string
  nd: string
  parentId: string
}

interface DataCt {
  dwId: string
  parentId: string
  nd: string
}

export const exportData = (checkPropackYs: boolean, dwId: string, nd: string): Promise<Result> => {
  return baseService.export(`/mbz/city/export?checkPropackYs=${checkPropackYs}&dwId=${dwId}&nd=${nd}`)
}

export const getData = (params: DataParams): Promise<Result> => {
  return baseService.get(`/mbz/city/getData`, params)
}

export const getDynamicColumn = (params: BaseParams): any => {
  return baseService.get(`/mbz/city/getDynamicColumn`, params)
}

export const getDataByCt = (params: DataCt): any => {
  return baseService.get(`/mbz/city/getDataByCt`, params)
}
export const getDynamicColumnByCt = (dwId: string): any => {
  return baseService.get(`/mbz/city/getDynamicColumnByCt`, {
    dwId: dwId
  })
}
