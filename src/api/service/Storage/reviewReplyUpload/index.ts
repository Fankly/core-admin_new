import { Result } from '@/api/types'
import baseService from '@/service/baseService'

export interface Params {
  [key: string]: any
}

// 获取数据
export const getPsyjAndPfwjPage = (params: Params): Promise<Result> => {
  return baseService.post('/sjtc/lhhs/psyjAndPfwj/getPage', params)
}

// 删除附件
export const deleteAttach = (params: Params): Promise<Result> => {
  return baseService.post('/sjtc/lhhs/psyjAndPfwj/deleteAttach', params)
}

// 上传附件
export const uploadAttach = (params: Params): Promise<Result> => {
  return baseService.post(
    `/sjtc/lhhs/psyjAndPfwj/uploadAttach?ids=${params.ids}&attachNames=${params.attachNames}&searchCode=${params.searchCode}`,
    params.excelFormData
  )
}

// 查询附件
export const getAttachAndWh = (params: Params): Promise<Result> => {
  const queryString = new URLSearchParams(params).toString()
  return baseService.post(`/sjtc/lhhs/psyjAndPfwj/getAttachAndWh?${queryString}`)
}

// 维护意见
export const maintainWh = (params: Params): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/psyjAndPfwj/maintainWh`, params)
}

// 提交
export const submitData = (params: Params): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/psyjAndPfwj/submit`, params)
}

// 导出
export const exportData = (params: Params): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/psyjAndPfwj/export`, params)
}

interface CtData {
  bmId: string
  dwId: string
  limit: string | number
  meetingId: string
  page: string | number
  roleCode: string
  roleId: string
  searchType: string
  xmbm: string
  xmmc: string
}

interface NoMeetingData {
  bmId: string
  dwId: string
  limit: string | number
  page: string | number
  roleCode: string
  roleId: string
  searchType: string
  xmbm: string
  xmmc: string
}

// 穿透导出
export const exportDrillThrough = (params: CtData): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/psyjAndPfwj/exportCtData`, params)
}

// 穿透查询
export const getDrillThroughPage = (params: CtData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/psyjAndPfwj/getCtData`, params)
}

// 无会议列表
export const getNoMeetingXmPage = (params: NoMeetingData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/psyjAndPfwj/getNoMeetingXmPage`, params)
}

// 无会议导出（参数与 getNoMeetingXmPage 一致）
export const exportNoMeetingXmPage = (params: NoMeetingData): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/psyjAndPfwj/exportNoMeetingXmPage`, params)
}

interface MaintainNoMeetingPsyjParams {
  xmId: string // 多个逗号拼接
  wh: string
  uuids: string // 附件 uuid 逗号拼接
}

// 无会议-评审意见维护
export const maintainNoMeetingPsyj = (params: MaintainNoMeetingPsyjParams): Promise<Result> => {
  return baseService.post(`/xmpsyjsc/psyjwh`, params)
}

// 无会议-提交
export const submitNoMeetingPsyj = (ids: string[]): Promise<Result> => {
  return baseService.post(`/xmpsyjsc/submit`, { ids })
}

interface MaintainPsyjParams {
  uuids: string[]
  wh: string
  meetingId: string
}

// 待省专业上传评审报告页面-维护评审意见和评审意见附件
export const maintainPsyj = (params: MaintainPsyjParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/psyjAndPfwj/maintainWhByXm`, params)
}

interface SubmitAndEndPsyjParams {
  meetingId: string
}

// 待省专业上传评审报告页面-提交
export const submitPsyj = (params: SubmitAndEndPsyjParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/psyjAndPfwj/submitForXm`, params)
}

interface EndMeetingParams {
  ids: string[] // meetingId列表
}

// 结束会议
export const endMeeting = (params: EndMeetingParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/psyjAndPfwj/closeMeeting`, params)
}
