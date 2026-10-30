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

const getRequiredQueryParams = (params: Params = {}): Params => {
  const missingParams = ['dwId', 'bmId', 'roleId'].filter((key) => !params[key])
  if (missingParams.length > 0) {
    throw new Error(`cityLhhsXmReviewOpinionStat query params missing: ${missingParams.join(', ')}`)
  }
  return {
    ...params,
    dwId: params.dwId,
    bmId: params.bmId,
    roleId: params.roleId
  }
}

// 分页查询会议
export const getMeetingPage = (params: any): Promise<Result> => {
  return baseService.post(`cityLhhsXmReviewOpinionStat/getMeetingPage`, getRequiredQueryParams(params))
}

// 获取动态表头
export const getDynamicColumn = (params: any): Promise<Result> => {
  const requestParams = getRequiredQueryParams(params)
  return baseService.post(`cityLhhsXmReviewOpinionStat/getDynamicColumn?meetingId=${requestParams.meetingId}`, requestParams)
}

// 获取项目数据
export const getTableData = (params: any): Promise<Result> => {
  return baseService.post(`cityLhhsXmReviewOpinionStat/getTableData`, getRequiredQueryParams(params))
}

// 导出
export const exportData = (params: any): Promise<Result> => {
  return baseService.export(`cityLhhsXmReviewOpinionStat/exportData`, getRequiredQueryParams(params))
}
