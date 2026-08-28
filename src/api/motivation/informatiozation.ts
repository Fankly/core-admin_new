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
export const xxhxgxxPageApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/xxhxgxx/page`, params)
}

//配网部数据填报-配电线路信息-详情查询
export const xxhxgxxGetInfoApi = (params: Params): Promise<Result> => {
  return baseService.get(`dy/xxhxgxx/getInfo`, params)
}
//配网部数据填报-配电线路信息-新增
export const xxhxgxxSaveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/xxhxgxx/save`, params)
}

//配网部数据填报-配电线路信息-删除
export const xxhxgxxRemoveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/xxhxgxx/remove`, params)
}
//配网部数据填报-配电线路信息-提交
export const xxhxgxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/xxhxgxx/submit`, params)
}

// 配网部数据填报-配电线路信息-模板下载
export const xxhxgxxgetImportTemplate = (params: any): any => {
  return baseService.export(`dy/xxhxgxx/getImportTemplate`, params)
}

// 配网部数据填报-配电线路信息-上传附件
export const xxhxgxxImportExcel = (params: any): any => {
  return baseService.post(`dy/xxhxgxx/importExcel`, params.excelFormData)
}

// 配网部数据填报-配电线路信息-导出
export const xxhxgxxExportExcel = (params: any): any => {
  return baseService.export(`dy/xxhxgxx/exportExcel`, params)
}


