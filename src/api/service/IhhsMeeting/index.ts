import baseService from '@/service/baseService'
import { MeetingList } from '@/views/service/jointReview/lhhsMeeting/interface'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

export interface SearchData {
  endTime: string
  major: string
  meetingAddr: string
  meetingCode: string
  meetingId: number
  meetingName: string
  organizer: string
  phone: string
  startTime: string
}

export interface YnrhsxmPage {
  current: string
  ejdw: string
  meetingId: string
  size: string
  xmlx: string
  xmmc: string
  yjdw: string
  xmbm: string
  xmbmList: any[]
  page: string
  limit: string
}

export interface YnrhszjPage {
  current: string
  ejdw: string
  meetingId: string
  expertName: string
  size: string
  yjdw: string
  page: string
  limit: string
  accounts: any[]
  expertNames: any[]
  account: string
}

interface SaveData {
  ids: string[]
  meetingId: string
}

interface PublishParams {
  ids: string[]
  bmId: string
  dwId: string
}

//创建/修改会议
export const addOrUpdateMeeting = (saveData: MeetingList): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/addOrUpdateMeeting`, saveData)
}

//取消发布
export const canclePublish = (publishParams: PublishParams): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/canclePublish`, publishParams)
}

//会议发布
export const publish = (publishParams: PublishParams): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/publish`, publishParams)
}

//删除会议
export const deleteLhhsMeeting = (ids: string[]): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/delete`, {
    ids: ids
  })
}

//会议列表
export const getLhhsMeetingPageData = (searchData: SearchData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/getPage`, searchData)
}

//获取会议编号
export const getMeetingCode = (): Promise<Result> => {
  return baseService.get(`/lhhsMeeting/getMeetingCode`)
}

//获取已纳入会审项目清单
export const getYnrhsxmPage = (searchData: YnrhsxmPage): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/getYnrhsxmPage`, searchData)
}

//获取已纳入会审专家清单
export const getYnrhszjPage = (searchData: YnrhszjPage): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/getYnrhszjPage`, searchData)
}

//获取待纳入会审项目清单
export const getDnrhsxmPage = (searchData: YnrhsxmPage): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/getDnrhsxmPage`, searchData)
}

//获取待纳入会审专家清单
export const getDnrhszjPage = (searchData: YnrhszjPage): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/getDnrhszjPage`, searchData)
}

//保存项目
export const saveXm = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/saveXm`, saveData)
}

//保存项目（评审中）
export const saveXmWhenPsz = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/saveXmWhenPsz`, saveData)
}

//保存专家
export const saveZj = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/saveZj`, saveData)
}

//删除项目
export const deleteYnrxm = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/deleteYnrxm`, saveData)
}

//删除专家
export const deleteYnrzj = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/deleteYnrzj`, saveData)
}

//删除项目（评审中）
export const deleteYnrxmWhenPsz = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/deleteYnrxmWhenPsz`, saveData)
}

//删除专家（评审中）
export const deleteYnrzjWhenPsz = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/deleteYnrzjWhenPsz`, saveData)
}

//设置组长
export const setLeader = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/setLeader`, saveData)
}

//重置组长
export const resetLeader = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/resetLeader`, saveData)
}

//导出已纳入会审专家清单
export const exportYnrzj = (saveData: YnrhszjPage): Promise<Result> => {
  return baseService.export(`/lhhsMeeting/exportYnrzj`, saveData)
}

//导出已纳入会审项目清单
export const exportYnrxm = (saveData: YnrhsxmPage): Promise<Result> => {
  return baseService.export(`/lhhsMeeting/exportYnrxm`, saveData)
}

//模板下载
export const getExpertReviewOpinionImportTemplate = (saveData: YnrhsxmPage): Promise<Result> => {
  return baseService.export(`/lhhsMeeting/getExpertReviewOpinionImportTemplate`, saveData)
}

//意见上传
export const importExpertReviewOpinion = (params: any): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/importExpertReviewOpinion`, params.excelFormData)
}

//更新是否已专家评审
export const updateIsMemberReviewWhenAllExpertReviewed = (params: any): Promise<Result> => {
  return baseService.post(`/lhhsMeeting/updateIsMemberReviewWhenAllExpertReviewed`, params)
}
