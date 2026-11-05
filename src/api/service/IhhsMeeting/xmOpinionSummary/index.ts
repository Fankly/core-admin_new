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

const getRequiredQueryParams = (params: Params = {}): Params => {
  const missingParams = ['dwId', 'bmId', 'roleId'].filter((key) => !params[key])
  if (missingParams.length > 0) {
    throw new Error(`lhhsXmReviewOpinionStat query params missing: ${missingParams.join(', ')}`)
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
  return baseService.post(`lhhsXmReviewOpinionStat/getMeetingPage`, getRequiredQueryParams(params))
}

// 获取动态表头
export const getDynamicColumn = (params: any): Promise<Result> => {
  const requestParams = getRequiredQueryParams(params)
  return baseService.post(`lhhsXmReviewOpinionStat/getDynamicColumn?meetingId=${requestParams.meetingId}`, requestParams)
}

// 获取项目数据
export const getTableData = (params: any): Promise<Result> => {
  return baseService.post(`lhhsXmReviewOpinionStat/getTableData`, getRequiredQueryParams(params))
}

// 导出
export const exportData = (params: any): Promise<Result> => {
  return baseService.export(`lhhsXmReviewOpinionStat/exportData`, getRequiredQueryParams(params))
}

// 导入
export const importData = (params: any): Promise<Result> => {
  return baseService.post(
    `lhhsXmReviewOpinionStat/importData?meetingId=${params.meetingId}&userid=${params.userid}&spRoleId=${params.spRoleId}&bmId=${params.bmId}&dwId=${params.dwId}`,
    params.excelFormData
  )
}

// 预审意见下载及评审意见上传模版
export const downloadTemplate = (params: any): Promise<Result> => {
  return baseService.export(`lhhsXmReviewOpinionStat/getImportTemplate`, getRequiredQueryParams(params))
}

interface ExpertOpinion {
  bmId: string
  dwId: string
  cwbReason: string // 财务部意见
  fzbReason: string // 发展部意见
  spRoleId: string
  xmbm: string
  xxhsJlCw: string // 评审意见记录财务部
  xxhsJlFz: string // 评审意见记录发展部
}

// 保存评审意见
export const updateFinancialDevelopmentReviewResult = (params: ExpertOpinion): Promise<Result> => {
  return baseService.post(`lhhsXmReviewOpinionStat/saveXxyj`, params)
}
