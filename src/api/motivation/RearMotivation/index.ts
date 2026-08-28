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

//后勤部数据填报 -管理用房屋信息-查询
export const glyfwxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/glyfwxx/page`, params)
}
//后勤部数据填报 -管理用房屋信息-新增/编辑
export const glyfwxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/glyfwxx/save`, params)
}
//后勤部数据填报 -管理用房屋信息-删除
export const glyfwxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/glyfwxx/remove`, params)
}

//后勤部数据填报 -管理用房屋信息-提交
export const glyfwxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/glyfwxx/submit`, params)
}

//后勤部数据填报 -管理用房屋信息-获取详情
export const glyfwxxGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/glyfwxx/getInfo`, params)
}

// 后勤部数据填报 -管理用房屋信息-模板下载
export const glyfwxxGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/glyfwxx/getImportTemplate`, params)
}

// 后勤部数据填报 -管理用房屋信息-上传附件
export const glyfwxxImportExcel = (params: any): any => {
  return baseService.post(`dy/glyfwxx/importExcel`, params.excelFormData)
}

// 后勤部数据填报 -管理用房屋信息-导出
export const glyfwxxExportExcel = (params: any): any => {
  return baseService.export(`dy/glyfwxx/exportExcel`, params)
}

//后勤部数据填报 -车辆信息-查询
export const cnxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/cnxx/page`, params)
}
//后勤部数据填报 -车辆信息-新增/编辑
export const cnxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/cnxx/save`, params)
}
//后勤部数据填报 -车辆信息-删除
export const cnxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/cnxx/remove`, params)
}

//后勤部数据填报 -车辆信息-提交
export const cnxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/cnxx/submit`, params)
}

//后勤部数据填报 -车辆信息-获取详情
export const cnxxGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/cnxx/getInfo`, params)
}

// 后勤部数据填报 -车辆信息-模板下载
export const cnxxGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/cnxx/getImportTemplate`, params)
}

// 后勤部数据填报 -车辆信息-上传附件
export const cnxxImportExcel = (params: any): any => {
  return baseService.post(`dy/cnxx/importExcel`, params.excelFormData)
}

// 后勤部数据填报 -车辆信息-导出
export const cnxxExportExcel = (params: any): any => {
  return baseService.export(`dy/cnxx/exportExcel`, params)
}

//后勤部数据填报 -其他信息-查询
export const qtxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/qtxx/page`, params)
}
//后勤部数据填报 -其他信息-新增/编辑
export const qtxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/qtxx/save`, params)
}
//后勤部数据填报 -其他信息-删除
export const qtxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/qtxx/remove`, params)
}

//后勤部数据填报 -其他信息-提交
export const qtxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/qtxx/submit`, params)
}

//后勤部数据填报 -其他信息-获取详情
export const qtxxGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/qtxx/getInfo`, params)
}

// 后勤部数据填报 -其他信息-模板下载
export const qtxxGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/qtxx/getImportTemplate`, params)
}

// 后勤部数据填报 -其他信息-上传附件
export const qtxxImportExcel = (params: any): any => {
  return baseService.post(`dy/qtxx/importExcel`, params.excelFormData)
}

// 后勤部数据填报 -其他信息-导出
export const qtxxExportExcel = (params: any): any => {
  return baseService.export(`dy/qtxx/exportExcel`, params)
}
