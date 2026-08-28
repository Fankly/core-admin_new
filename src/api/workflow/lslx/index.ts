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

// 一上通过
export const finishWfActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/mbzys/finishWf', params)
}

// 一上驳回
export const rejectActivity = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/mbzys/reject', params)
}

// 二上通过
export const mbzesFinishWf = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/mbzes/finishWf', params)
}

// 二上驳回
export const mbzesReject = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/mbzes/reject', params)
}

// 一上省专业通过
export const zgkbmFinishWf = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/mbzys/zgkbm/finishWf', params)
}

// 一上省专业驳回
export const zgkbmReject = (params: Params): Promise<Result> => {
  return baseService.post('/workflow/mbzys/zgkbm/reject', params)
}
