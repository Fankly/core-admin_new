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

// 提交
export const submitActivity = (params: Params): Promise<Result> => {
    return baseService.post('/workflow/xjjz/submitWf', params)
}
//续建结转列表
export const queryData = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/xjjz/query', params)
}

// 发起
export const finishActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/xjjz/finishWf', params)
}

// 驳回
export const rejectActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/xjjz/reject', params)
}