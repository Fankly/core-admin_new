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

// 分页查询省级统筹会议信息
export const pageSjtcMeetingInfo = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/pageSjtcMeetingInfo`, params)
}

// 自动中评
export const automatedFinalAssessment = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/automatedFinalAssessment`, params)
}
