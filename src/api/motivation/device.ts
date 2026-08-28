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
//设备部数据填报-变电站信息-分页查询
export const bdzxxPageApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/bdzxx/page`, params)
}

//设备部数据填报-变电站信息-详情查询
export const bdzxxGetInfoApi = (params: Params): Promise<Result> => {
  return baseService.get(`dy/bdzxx/getInfo`, params)
}
//设备部数据填报-变电站信息-新增
export const bdzxxSaveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/bdzxx/save`, params)
}

//设备部数据填报-变电站信息-删除
export const bdzxxRemoveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/bdzxx/remove`, params)
}
//设备部数据填报-变电站信息-提交
export const bdzxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/bdzxx/submit`, params)
}

// 设备部数据填报-变电站信息-模板下载
export const bdzxxgetImportTemplate = (params: any): any => {
  return baseService.export(`dy/bdzxx/getImportTemplate`, params)
}

// 设备部数据填报-变电站信息-上传附件
export const bdzxxImportExcel = (params: any): any => {
  return baseService.post(`dy/bdzxx/importExcel`, params.excelFormData)
}

// 设备部数据填报-变电站信息-导出
export const bdzxxExportExcel = (params: any): any => {
  return baseService.export(`dy/bdzxx/exportExcel`, params)
}


//设备部数据填报-输电线路信息-分页查询
export const sdxlxxPageApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/sdxlxx/page`, params)
}

//设备部数据填报-输电线路信息-详情查询
export const sdxlxxGetInfoApi = (params: Params): Promise<Result> => {
  return baseService.get(`dy/sdxlxx/getInfo`, params)
}
//设备部数据填报-输电线路信息-新增
export const sdxlxxSaveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/sdxlxx/save`, params)
}

//设备部数据填报-输电线路信息-删除
export const sdxlxxRemoveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/sdxlxx/remove`, params)
}
//设备部数据填报-输电线路信息-提交
export const sdxlxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/sdxlxx/submit`, params)
}

// 设备部数据填报-输电线路信息-模板下载
export const sdxlxxgetImportTemplate = (params: any): any => {
  return baseService.export(`dy/sdxlxx/getImportTemplate`, params)
}

// 设备部数据填报-输电线路信息-上传附件
export const sdxlxxImportExcel = (params: any): any => {
  return baseService.post(`dy/sdxlxx/importExcel`, params.excelFormData)
}

// 设备部数据填报-输电线路信息-导出
export const sdxlxxExportExcel = (params: any): any => {
  return baseService.export(`dy/sdxlxx/exportExcel`, params)
}


//设备部数据填报-直升机巡检信息-分页查询
export const zsjxjxxPageApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/zsjxjxx/page`, params)
}

//设备部数据填报-直升机巡检信息-详情查询
export const zsjxjxxGetInfoApi = (params: Params): Promise<Result> => {
  return baseService.get(`dy/zsjxjxx/getInfo`, params)
}
//设备部数据填报-直升机巡检信息-新增
export const zsjxjxxSaveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/zsjxjxx/save`, params)
}

//设备部数据填报-直升机巡检信息-删除
export const zsjxjxxRemoveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/zsjxjxx/remove`, params)
}
//设备部数据填报-直升机巡检信息-提交
export const zsjxjxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/zsjxjxx/submit`, params)
}

// 设备部数据填报-直升机巡检信息-模板下载
export const zsjxjxxgetImportTemplate = (params: any): any => {
  return baseService.export(`dy/zsjxjxx/getImportTemplate`, params)
}

// 设备部数据填报-直升机巡检信息-上传附件
export const zsjxjxxImportExcel = (params: any): any => {
  return baseService.post(`dy/zsjxjxx/importExcel`, params.excelFormData)
}

// 设备部数据填报-直升机巡检信息-导出
export const zsjxjxxExportExcel = (params: any): any => {
  return baseService.export(`dy/zsjxjxx/exportExcel`, params)
}

