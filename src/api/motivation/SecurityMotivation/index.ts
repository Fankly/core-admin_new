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
//安监部数据填报-反恐防范信息-查询
export const fkffxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/fkffxx/page`, params)
}
//安监部数据填报-反恐防范信息-新增/编辑
export const fkffxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/fkffxx/save`, params)
}
//安监部数据填报-反恐防范信息-删除
export const fkffxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/fkffxx/remove`, params)
}

//安监部数据填报-反恐防范信息-提交
export const fkffxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/fkffxx/submit`, params)
}

//安监部数据填报-反恐防范信息-获取详情
export const fkffxxGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/fkffxx/getInfo`, params)
}

// 安监部数据填报-反恐防范信息-模板下载
export const fkffxxGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/fkffxx/getImportTemplate`, params)
}

// 安监部数据填报-反恐防范信息-上传附件
export const fkffxxImportExcel = (params: any): any => {
  return baseService.post(`dy/fkffxx/importExcel`, params.excelFormData)
}

// 安监部数据填报-反恐防范信息-导出
export const fkffxxExportExcel = (params: any): any => {
  return baseService.export(`dy/fkffxx/exportExcel`, params)
}

//安监部数据填报-政治保电信息-查询
export const zzbdxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/zzbdxx/page`, params)
}
//安监部数据填报-政治保电信息-新增/编辑
export const zzbdxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/zzbdxx/save`, params)
}
//安监部数据填报-政治保电信息-删除
export const zzbdxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/zzbdxx/remove`, params)
}

//安监部数据填报-政治保电信息-提交
export const zzbdxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/zzbdxx/submit`, params)
}

//安监部数据填报-反恐防范信息-获取详情
export const zzbdxxGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/zzbdxx/getInfo`, params)
}

// 安监部数据填报-政治保电信息-模板下载
export const zzbdxxGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/zzbdxx/getImportTemplate`, params)
}

// 安监部数据填报-政治保电信息-上传附件
export const zzbdxxImportExcel = (params: any): any => {
  return baseService.post(`dy/zzbdxx/importExcel`, params.excelFormData)
}

// 安监部数据填报-政治保电信息-导出
export const zzbdxxExportExcel = (params: any): any => {
  return baseService.export(`dy/zzbdxx/exportExcel`, params)
}
