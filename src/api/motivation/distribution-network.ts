import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}
interface Params {
  [key: string]: any
}
export interface ImportOther {
  excelFormData: any
}

//配网部数据填报-配电线路信息-分页查询
export const pdxlxxPageApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/pdxlxx/page`, params)
}

//配网部数据填报-配电线路信息-详情查询
export const pdxlxxGetInfoApi = (params: Params): Promise<Result> => {
  return baseService.get(`dy/pdxlxx/getInfo`, params)
}
//配网部数据填报-配电线路信息-新增
export const pdxlxxSaveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/pdxlxx/save`, params)
}

//配网部数据填报-配电线路信息-删除
export const pdxlxxRemoveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/pdxlxx/remove`, params)
}
//配网部数据填报-配电线路信息-提交
export const pdxlxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/pdxlxx/submit`, params)
}

// 配网部数据填报-配电线路信息-模板下载
export const pdxlxxgetImportTemplate = (params: any): any => {
  return baseService.export(`dy/pdxlxx/getImportTemplate`, params)
}

// 配网部数据填报-配电线路信息-上传附件
export const pdxlxxImportExcel = (params: any): any => {
  return baseService.post(`dy/pdxlxx/importExcel`, params.excelFormData)
}

// 配网部数据填报-配电线路信息-导出
export const pdxlxxExportExcel = (params: any): any => {
  return baseService.export(`dy/pdxlxx/exportExcel`, params)
}


