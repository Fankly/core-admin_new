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
  pszyType?: string
}

interface SaveData {
  pszyType?: string
  ids: string[]
  meetingId: string
}

interface SaveProData {
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
  return baseService.post(`/sjtc/lhhs/meeting/addOrUpdateMeeting`, saveData)
}

//取消发布
export const canclePublish = (publishParams: PublishParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/canclePublish`, publishParams)
}

//会议发布
export const publish = (publishParams: PublishParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/publish`, publishParams)
}

//删除会议
export const deleteLhhsMeeting = (ids: string[]): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/delete`, {
    ids: ids
  })
}

//会议列表
export const getLhhsMeetingPageData = (searchData: SearchData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/getPage`, searchData)
}

//获取会议编号
export const getMeetingCode = (): Promise<Result> => {
  return baseService.get(`/sjtc/lhhs/meeting/getMeetingCode`)
}

//获取已纳入会审项目清单
export const getYnrhsxmPage = (searchData: YnrhsxmPage): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/getYnrhsxmPage`, searchData)
}

//获取已纳入会审专家清单
export const getYnrhszjPage = (searchData: YnrhszjPage): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/getYnrhszjPage`, searchData)
}

//获取待纳入会审项目清单
export const getDnrhsxmPage = (searchData: YnrhsxmPage): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/getDnrhsxmPage`, searchData)
}

//获取待纳入会审专家清单
export const getDnrhszjPage = (searchData: YnrhszjPage): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/getDnrhszjPage`, searchData)
}

//保存项目
export const saveXm = (saveData: SaveProData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/saveXm`, saveData)
}

//保存项目（评审中）
export const saveXmWhenPsz = (saveData: SaveProData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/saveXmWhenPsz`, saveData)
}

//保存专家
export const saveZj = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/saveZj`, saveData)
}

//删除项目
export const deleteYnrxm = (saveData: SaveProData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/deleteYnrxm`, saveData)
}

//删除专家
export const deleteYnrzj = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/deleteYnrzj`, saveData)
}

//删除项目（评审中）
export const deleteYnrxmWhenPsz = (saveData: SaveProData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/deleteYnrxmWhenPsz`, saveData)
}

//删除专家（评审中）
export const deleteYnrzjWhenPsz = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/deleteYnrzjWhenPsz`, saveData)
}

//导出已纳入会审专家清单
export const exportYnrzj = (saveData: YnrhszjPage): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/meeting/exportYnrzj`, saveData)
}

//导出已纳入会审项目清单
export const exportYnrxm = (saveData: YnrhsxmPage): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/meeting/exportYnrxm`, saveData)
}

//模板下载
export const getExpertReviewOpinionImportTemplate = (saveData: YnrhsxmPage): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/meeting/getExpertReviewOpinionImportTemplate`, saveData)
}

//意见上传
export const importExpertReviewOpinion = (params: any): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/importExpertReviewOpinion`, params.excelFormData)
}

//更新是否已专家评审
export const updateIsMemberReviewWhenAllExpertReviewed = (params: any): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/updateIsMemberReviewWhenAllExpertReviewed`, params)
}

// 获取可研经济与财务合规评审负责人
export const getStepTwoFzr = (bmId: string): Promise<Result> => {
  return baseService.get(`/sjtc/lhhs/meeting/getStepTwoFzr`, {
    bmId: bmId
  })
}

interface YnrhszjData {
  meetingId: string
  pszyType?: string
}

// 获取评审分工-根据会议id和阶段获取专家列表(不分页)
export const getYnrhszjList = (ynrhszjData: YnrhszjData): Promise<Result> => {
  return baseService.get(`/sjtc/lhhs/meeting/getYnrhszjList`, ynrhszjData)
}

export const getYnrhszjListNum = (ynrhszjData: YnrhszjData): Promise<Result> => {
  return baseService.get(`/sjtc/lhhs/meeting/getYnrhszjListNum`, ynrhszjData)
}

interface YfpMessageParams {
  bmId: string
  dwId: string
  expertId: string
  limit: string | number
  meetingId: string
  page: string | number
  roleCode: string
  roleId: string
  xmmc: string
  xmbms: string
  pszyType?: string
}

// 获取已分配信息
export const getYfpxx = (yfpMessageParams: YfpMessageParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/getYfpxx`, yfpMessageParams)
}

interface DfpMessageParams {
  fgpsType: '1' | '2' | '3' //分工评审类型(1按事项分配2按单位分配3按项目分配)
  meetingId: string
  limit: string | number
  page: string | number
  xmmc: string
  xmbms: string
  sfyfp: '0' | '1' | '' // 0 未分配 1 已分配
  pszyType?: string
}

// 获取待分配信息
export const getDfpxx = (dfpMessageParams: DfpMessageParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/getDfpxx`, dfpMessageParams)
}

interface PsfgParams {
  expertIds: string[]
  fgpsType: '1' | '2' | '3'
  ids: string[]
  meetingId: string
  pszyType: string
}

// 评审分工
export const psfgData = (psfgParams: PsfgParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/psfg`, psfgParams)
}

interface updatePsmsParams {
  psms: string
  meetingId: string
}

// 更改评审模式
export const updatePsms = (psfgParams: updatePsmsParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/updatePsms`, psfgParams)
}

interface MeetingNameParams {
  bmId: string
  pspcId: string
  meetingId: string
}

// 获取会议名称
export const getMeetingName = (meetingNameParams: MeetingNameParams): Promise<Result> => {
  return baseService.get(`/sjtc/lhhs/meeting/getMeetingName`, meetingNameParams)
}

interface DeleteExpertProjectParams {
  expertId: string
  pszyType: string
  meetingId: string
  xmIds: string[]
}

// 删除关联专家项目
export const deleteExpertProject = (deleteExpertProjectParams: DeleteExpertProjectParams): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/deleteExpertProject`, deleteExpertProjectParams)
}

//上传会议通知附件
export const getRemindAttach = (params: any): Promise<Result> => {
  return baseService.get(`/sjtc/lhhs/meeting/getRemindAttach`, params)
}

// 删除会议通知附件
export const deleteRemindAttach = (params: any): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/deleteRemindAttach`, params)
}

// 下载附件
export const downloadAttach = (params: any): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/meeting/downloadAttach?uuid=${params.uuid}`)
}

export const exportData = (params: any): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/meeting/export`, params)
}

// 获取上传附件
export const uploadRemindAttach = (params: any): Promise<Result> => {
  const attachType = params.attachType ? `&attachType=${params.attachType}` : ''
  return baseService.post(
    `/sjtc/lhhs/meeting/uploadRemindAttach?attachNames=${params.attachNames}&meetingIds=${params.meetingIds}${attachType}`,
    params.excelFormData
  )
}

export const uploadRemindAttachWhenCreate = (params: any): Promise<Result> => {
  const attachType = params.attachType ? `&attachType=${params.attachType}` : ''
  return baseService.post(`/sjtc/lhhs/meeting/uploadRemindAttachWhenCreate?attachNames=${params.attachNames}${attachType}`, params.excelFormData)
}

// 联合会审会议通过率统计分析-会议列表
export const tjfxGetPage = (params: any): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/tjfx/getPage`, params)
}

// 联合会审会议通过率统计分析-会议列表导出
export const tjfxExportPage = (params: any): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/tjfx/exportPage`, params)
}

// 联合会审会议通过率统计分析-穿透导出
export const tjfxExportCtData = (params: any): Promise<Result> => {
  return baseService.export(`/sjtc/lhhs/tjfx/exportCtData`, params)
}

// 联合会审会议通过率统计分析-穿透明细
export const tjfxGetCtData = (params: any): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/tjfx/getCtData`, params)
}

// 联合会审会议通过率统计分析-统计分析
export const tjfxGetData = (params: any): Promise<Result> => {
  return baseService.post(`/sjtc/lhhs/tjfx/getData`, params)
}
