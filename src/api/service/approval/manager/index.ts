//省级统筹联合会审后台管理
import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface ExpertParams {
  ids: string[]
  meetingId: string
  pszyType: string
}

//  评审专家调整-添加专家
export const addExpert = (params: ExpertParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/addExpert`, params, {}, false)
}

//  评审专家调整-删除专家
export const deleteExpert = (params: ExpertParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/deleteExpert`, params, {}, false)
}

interface DeleteExpertProjectParams {
  expertId: string
  meetingId: string
  pszyType: string
  xmIds: string
}

//  会议分工调整-删除专家项目关联关系
export const deleteExpertProject = (params: DeleteExpertProjectParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/deleteExpertProject`, params, {}, false)
}

interface BaseYjParams {
  expertName?: string
  meetingId: string
  limit?: number | string
  page?: number | string
  xmbms?: string[]
}

interface XsyjParams extends BaseYjParams {
  dwId: string
  bmId: string
  roleId: string
  roleCode: string
  userId: string
}

//  修改线上预审意见-获取线上预审意见
export const getXsyj = (params: XsyjParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/getXsyj`, params, {}, false)
}

//  修改线下预审意见-获取线下预审意见
export const getXxyj = (params: BaseYjParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/getXxyj`, params, {}, false)
}

interface PsfgParams {
  expertIds: string[]
  fgpsType: string
  ids: string[]
  meetingId: string
  psms: string
  pszyType: string
}

//  会议分工调整-评审分工
export const psfg = (params: PsfgParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/psfg`, params, {}, false)
}

interface UpdateMeetingStatusParams {
  ids: string[]
  status: string
}

//  会议状态更新-更新会议状态
export const updateMeetingStatus = (params: UpdateMeetingStatusParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/updateMeetingStatus`, params, {}, false)
}

interface UpdatePsmsParams {
  meetingId: string
  psms: string
}

//  会议分工调整-更改评审模式
export const updatePsms = (params: UpdatePsmsParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/updatePsms`, params, {}, false)
}

interface UpdateXsyjParams {
  expertName: string
  meetingCode: string
  meetingName: string
  reason: string
  reviewId: string
  reviewOpinion: string
  reviewOpinionName: string
  xmbm: string
  xmmc: string
}

//  修改线上预审意见-修改线上预审意见
export const updateXsyj = (params: UpdateXsyjParams[]): Promise<Result> => {
  return budget.post(`/lhhs/htgl/updateXsyj`, params, {}, false)
}

interface UpdateXxyjParams {
  cwbReason: string
  fzbReason: string
  id: string
  meetingCode: string
  meetingName: string
  reason: string
  reviewOpinion: string
  reviewOpinionName: string
  sdje: number
  xmbm: string
  xmmc: string
  xxhsjl: string
  xxhsjlName: string
}

//  修改线下预审意见-修改线下预审意见、终审意见
export const updateXxyj = (params: UpdateXxyjParams[]): Promise<Result> => {
  return budget.post(`/lhhs/htgl/updateXxyj`, params, {}, false)
}

// 获取线上意见导入模板
export const getXsyjTemplate = (params: XsyjParams): Promise<Result> => {
  return budget.exportFile(`/lhhs/htgl/getXsyjTemplate`, params, {}, false)
}

// 获取线下意见和终审意见导入模板
export const getXxyjTemplate = (params: BaseYjParams): Promise<Result> => {
  return budget.exportFile(`/lhhs/htgl/getXxyjTemplate`, params, {}, false)
}

interface ImportXsyjParams {
  excelFormData: FormData
  meetingId: string
}

// 导入线上预审意见
export const importXsyj = (params: ImportXsyjParams): Promise<Result> => {
  params.excelFormData.append('meetingId', params.meetingId)
  return budget.post(`/lhhs/htgl/importXsyj`, params.excelFormData, {}, false)
}

// 导入线下预审意见和终审意见
export const importXxyj = (params: ImportXsyjParams): Promise<Result> => {
  params.excelFormData.append('meetingId', params.meetingId)
  return budget.post(`/lhhs/htgl/importXxyj`, params.excelFormData, {}, false)
}

interface AutoMeetingParams {
  meetingId: string
  ids: string[]
}

// 自动纳会
export const autoMeeting = (params: AutoMeetingParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/autoAddProject`, params, {}, false)
}

interface AutoMeetingSearchParams {
  meetingId: string // 会议编号
  xmbmList: string[] // 项目编号列表
  current: number | string // 当前页码
  size: number | string // 每页数量
}

// 自动纳会-获取项目列表
export const getProjectList = (params: AutoMeetingSearchParams): Promise<Result> => {
  return budget.post(`/lhhs/htgl/getZdnhProjectPage`, params, {}, false)
}
