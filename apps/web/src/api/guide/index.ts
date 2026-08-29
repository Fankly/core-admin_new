import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

interface GuideStatusParams {
  moduleKey: string
}

interface updateGuideStatusParams {
  moduleKey: string
  isCompleted: boolean
}

// 检查是否需要引导
export const checkGuideStatus = (params: GuideStatusParams): Promise<Result> => {
  return baseService.get(`/sysRemind/getRemindFlagByUserId?moduleKey=${params.moduleKey}`)
}

// 更新引导状态
export const updateGuideStatus = (params: updateGuideStatusParams): Promise<Result> => {
  return baseService.post(`/sysRemind/close`, params)
}

// 记录引导完成次数
export const recordGuideCompletion = (params: GuideStatusParams): Promise<Result> => {
  return baseService.post(`/sysRemind/iknow`, params)
}
