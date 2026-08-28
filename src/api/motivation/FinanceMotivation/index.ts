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

//财务部数据填报 -财务相关信息-查询
export const cwxgxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/cwxgxx/page`, params)
}
//财务部数据填报 -财务相关信息-新增/编辑
export const cwxgxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/cwxgxx/save`, params)
}
//财务部数据填报 -财务相关信息-删除
export const cwxgxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/cwxgxx/remove`, params)
}

//财务部数据填报 -财务相关信息-提交
export const cwxgxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/cwxgxx/submit`, params)
}

//财务部数据填报 -财务相关信息-获取详情
export const cwxgxxGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/cwxgxx/getInfo`, params)
}

// 财务部数据填报 -财务相关信息-模板下载
export const cwxgxxGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/cwxgxx/getImportTemplate`, params)
}

// 财务部数据填报 -财务相关信息-上传附件
export const cwxgxxImportExcel = (params: any): any => {
  return baseService.post(`dy/cwxgxx/importExcel`, params.excelFormData)
}

// 财务部数据填报 -财务相关信息-导出
export const cwxgxxExportExcel = (params: any): any => {
  return baseService.export(`dy/cwxgxx/exportExcel`, params)
}
