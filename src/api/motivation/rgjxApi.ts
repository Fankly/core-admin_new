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

//人工库-查询
export const glyfwxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`artificial/query`, params)
}
//人工库-新增/编辑
export const glyfwxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`artificial/saveOrUpdateHandler`, params)
}
//人工库-删除
export const glyfwxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`artificial/deleteHandler`, params)
}

//人工库-获取详情
export const glyfwxxGetInfo = (params: any): Promise<Result> => {
  return baseService.post(`artificial/queryById`, params)
}

// 人工库-模板下载
export const glyfwxxGetImportTemplate = (params: any): any => {
  return baseService.export(`artificial/getImportTemplate`, params)
}

// 人工库-上传附件
export const glyfwxxImportExcel = (params: any): any => {
  return baseService.post(`artificial/importExcel`, params.excelFormData)
}

// 人工库-导出
export const glyfwxxExportExcel = (params: any): any => {
  return baseService.export(`artificial/exportExcel`, params)
}

//机械库-查询
export const cnxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`machinery/query`, params)
}
//机械库-新增/编辑
export const cnxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`machinery/saveOrUpdateHandler`, params)
}
//机械库-删除
export const cnxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`machinery/deleteHandler`, params)
}

//机械库-获取详情
export const cnxxGetInfo = (params: any): Promise<Result> => {
  return baseService.post(`machinery/queryById`, params)
}

// 机械库-模板下载
export const cnxxGetImportTemplate = (params: any): any => {
  return baseService.export(`machinery/getImportTemplate`, params)
}

// 机械库-上传附件
export const cnxxImportExcel = (params: any): any => {
  return baseService.post(`machinery/importExcel`, params.excelFormData)
}

// 机械库-导出
export const cnxxExportExcel = (params: any): any => {
  return baseService.export(`machinery/exportExcel`, params)
}

//定额标准-查询
export const debzxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`according/query`, params)
}
//定额标准-新增/编辑
export const debzxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`according/saveOrUpdateHandler`, params)
}
//定额标准-删除
export const debzxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`according/deleteHandler`, params)
}

//定额标准-获取详情
export const debzxxGetInfo = (params: any): Promise<Result> => {
  return baseService.post(`according/queryById`, params)
}

// 定额标准-模板下载
export const debzxxGetImportTemplate = (params: any): any => {
  return baseService.export(`according/getImportTemplate`, params)
}

// 定额标准-上传附件
export const debzxxImportExcel = (params: any): any => {
  return baseService.post(`according/importExcel`, params.excelFormData)
}

// 定额标准-导出
export const debzxxExportExcel = (params: any): any => {
  return baseService.export(`according/exportExcel`, params)
}
