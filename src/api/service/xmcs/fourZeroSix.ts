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

// 406号文测算-新增、编辑
export const saveOrUpdateHandler = (params: any): Promise<Result> => {
  return baseService.post(`fourZeroSix/saveOrUpdateHandler`, params)
}

// 406号文测算-查询
export const query = (params: any): Promise<Result> => {
  return baseService.post(`fourZeroSix/query`, params)
}

// 406号文测算-动因查询
export const fourZeroSixQueryDy = (params: any): Promise<Result> => {
  return baseService.post(`fourZeroSix/queryDy`, params)
}

// 406号文测算-查询
export const queryFour = (params: any): Promise<Result> => {
  return baseService.post(`fourZeroSix/query`, params)
}

// 406号文测算-删除
export const deleteHandler = (params: any): Promise<Result> => {
  return baseService.post(`fourZeroSix/deleteHandler`, params)
}

//406号文测算-模板下载
export const getImportTemplate = (params: Params): any => {
  return baseService.export(`fourZeroSix/getImportTemplate`, params)
}

// 406号文测算-导入
export const importExcel = (params: ImportData): any => {
  return baseService.post(`fourZeroSix/importExcel`, params.excelFormData)
}

//406号文测算-导出
export const exportExcel = (params: Params): Promise<Result> => {
  return baseService.export(`fourZeroSix/exportExcel`, params)
}

// 406号文测算-提交
export const submitHandler = (params: any): any => {
  return baseService.post(`fourZeroSix/submitHandler`, params)
}

// 定额测算-根据填写名称从406号文查询数量、工日和工作量
export const queryByMcAndXmid = (params: Params): any => {
  return baseService.post(`fourZeroSix/queryByMcAndXmid`, params)
}

// 定额测算-406号文测算退回至定额测算
export const goback = (params: Params): any => {
  return baseService.post(`fourZeroSix/goback`, params)
}
