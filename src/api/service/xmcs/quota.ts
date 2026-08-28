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
interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}
interface ImportData {
  expertId: any
  meetingId: any
  excelFormData: any
}

// 定额测算-新增、编辑
export const saveOrUpdateHandler = (params: any): Promise<Result> => {
  return baseService.post(`quota/saveOrUpdateHandler`, params)
}

// 定额测算-查询
export const queryQuota = (params: any): Promise<Result> => {
  return baseService.post(`quota/query`, params)
}

// 定额测算-查询动因子表
export const queryQuotaDy = (params: any): Promise<Result> => {
  return baseService.post(`quota/queryDy`, params)
}

// 定额测算-删除
export const deleteHandler = (params: any): Promise<Result> => {
  return baseService.post(`quota/deleteHandler`, params)
}

//定额测算-模板下载
export const getImportTemplate = (params: Params): any => {
  return baseService.export(`quota/getImportTemplate`, params)
}

// 定额测算-导入
export const importExcel = (params: ImportData): any => {
  return baseService.post(`quota/importExcel`, params.excelFormData)
}

//定额测算-导出
export const exportExcel = (params: Params): Promise<Result> => {
  return baseService.export(`quota/exportExcel`, params)
}

// 定额测算-提交
export const submitHandler = (params: any): any => {
  return baseService.post(`quota/submitHandler`, params)
}

// 定额测算-根据填写名称从406号文查询数量、工日和工作量
export const queryByMcAndXmid = (params: Params): any => {
  return baseService.post(`quota/queryByMcAndXmid`, params)
}

// 定额测算-更新动因子表定额测算结果
export const updateDyDe = (params: Params): any => {
  return baseService.post(`quota/updateDyDe`, params)
}
