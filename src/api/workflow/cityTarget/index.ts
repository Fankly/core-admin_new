// 提交
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

// 通过
export const finishWfActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/sytcMbzPhtz/finishWf', params)
}

// 驳回
export const rejectActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/sytcMbzPhtz/reject', params)
}
