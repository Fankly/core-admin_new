import baseService from '@/service/baseService'

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

export const submitActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/xmgbdk/submitWf', params)
}

// 发起
export const finishActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/xmgbdk/finishWf', params)
}

// 驳回
export const rejectActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/xmgbdk/reject', params)
}

export const queryData = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/xmgbdk/query', params)
}