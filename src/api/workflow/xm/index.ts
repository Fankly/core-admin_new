// 提交
import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  headers?: any
}

interface Params {
  [key: string]: any
}

export const submitActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/cbxqsh/submitWf', params)
}

// 发起
export const finishActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/cbxqsh/finishWf', params)
}

// 租赁发起
export const finishZlActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/zlxqsh/finishWf', params)
}

// 租赁发起-新
export const finishZlActivityNew = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/zl/zlxqsh/finishWf', params)
}

// 租赁驳回
export const rejectZlActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/zlxqsh/reject', params)
}

// 租赁驳回-新
export const rejectZlActivityNew = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/zl/zlxqsh/reject', params)
}

// 租赁动态查询
export const getSearchData = (params: Params): Promise<Result> => {
  return baseService.post('/zlxqszy/zlxqmxcx', params)
}

// 租赁动态查询-新
export const getSearchDataNew = (params: Params): Promise<Result> => {
  return baseService.post(`/zlxqszynew/zlxqmxcx`, params)
}

// 租赁项目批量修改省归口专业部门
export const modiySdkzybm = (params: Params): Promise<Result> => {
  return baseService.post('/xmAttributeConfig/modiySdkzybm', params)
}

// 终止
export const rejectActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/cbxqsh/reject', params)
}

// 退回信息表
export const saveOrUpdateTXmThxxb = (params: Params): Promise<Result> => {
  return baseService.post('/thxxb/saveOrUpdateTXmThxxb', params)
}

interface UploadFilesParams {
  xmIds: string
  fileName: string
  file: FormData
}

// 上传
export const uploadCswj = (params: UploadFilesParams): Promise<Result> => {
  return baseService.post(`/xmAttributeConfig/uploadCswj?xmIds=${params.xmIds}&fileName=${params.fileName}`, params.file)
}

// 删除初审文件
export const deleteCswj = (ids: string[]): Promise<Result> => {
  return baseService.post('/xmAttributeConfig/deleteCswj', {
    ids
  })
}
