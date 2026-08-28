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

//组织部数据填报 -人员和工资信息-查询
export const ryhgzxxPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/ryhgzxx/page`, params)
}
//组织部数据填报 -人员和工资信息-新增/编辑
export const ryhgzxxSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/ryhgzxx/save`, params)
}
//组织部数据填报 -人员和工资信息-删除
export const ryhgzxxRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/ryhgzxx/remove`, params)
}

//组织部数据填报 -人员和工资信息-提交
export const ryhgzxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/ryhgzxx/submit`, params)
}

//组织部数据填报 -人员和工资信息-获取详情
export const ryhgzxxGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/ryhgzxx/getInfo`, params)
}

// 组织部数据填报 -人员和工资信息-模板下载
export const ryhgzxxGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/ryhgzxx/getImportTemplate`, params)
}

// 组织部数据填报 -人员和工资信息-上传附件
export const ryhgzxxImportExcel = (params: any): any => {
  return baseService.post(`dy/ryhgzxx/importExcel`, params.excelFormData)
}

// 组织部数据填报 -人员和工资信息-导出
export const ryhgzxxExportExcel = (params: any): any => {
  return baseService.export(`dy/ryhgzxx/exportExcel`, params)
}
