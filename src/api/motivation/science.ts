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
//科技部数据填报-专利和研发费用信息-分页查询
export const zlhyffyxxPageApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/zlhyffyxx/page`, params)
}

//科技部数据填报-专利和研发费用信息-详情查询
export const zlhyffyxxGetInfoApi = (params: Params): Promise<Result> => {
  return baseService.get(`dy/zlhyffyxx/getInfo`, params)
}
//科技部数据填报-专利和研发费用信息-新增
export const zlhyffyxxSaveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/zlhyffyxx/save`, params)
}

//科技部数据填报-专利和研发费用信息-删除
export const zlhyffyxxRemoveApi = (params: Params): Promise<Result> => {
  return baseService.post(`dy/zlhyffyxx/remove`, params)
}
//科技部数据填报-专利和研发费用信息-提交
export const zlhyffyxxSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/zlhyffyxx/submit`, params)
}

// 科技部数据填报-专利和研发费用信息-模板下载
export const zlhyffyxxgetImportTemplate = (params: any): any => {
  return baseService.export(`dy/zlhyffyxx/getImportTemplate`, params)
}

// 科技部数据填报-专利和研发费用信息-上传附件
export const zlhyffyxxImportExcel = (params: any): any => {
  return baseService.post(`dy/zlhyffyxx/importExcel`, params.excelFormData)
}

// 科技部数据填报-专利和研发费用信息-导出
export const zlhyffyxxExportExcel = (params: any): any => {
  return baseService.export(`dy/zlhyffyxx/exportExcel`, params)
}


