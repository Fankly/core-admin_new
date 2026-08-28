import baseService from '@/service/baseService'
import { MeetingList } from '@/views/service/approval/cityLhhsMeeting/interface'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

interface RoleRequestParams {
  bmId?: string
  roleId?: string
  roleCode?: string
  dwId?: string
}

const buildRoleQuery = (params: RoleRequestParams = {}) => {
  const searchParams = new URLSearchParams()
  ;['bmId', 'roleId', 'roleCode', 'dwId'].forEach((key) => {
    const value = params[key as keyof RoleRequestParams]
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `&${query}` : ''
}

export interface SearchData extends RoleRequestParams {
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

export interface YnrhsxmPage extends RoleRequestParams {
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

export interface YnrhszjPage extends RoleRequestParams {
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

interface SaveData extends RoleRequestParams {
  pszyType?: string
  ids: string[]
  meetingId: string
}

interface SaveProData extends RoleRequestParams {
  ids: string[]
  meetingId: string
}

interface PublishParams extends RoleRequestParams {
  ids: string[]
}

interface DeleteMeetingParams extends RoleRequestParams {
  ids: string[]
}

//创建/修改会议
export const addOrUpdateMeeting = (saveData: MeetingList): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/addOrUpdateMeeting`, saveData)
}

//取消发布
export const canclePublish = (publishParams: PublishParams): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/canclePublish`, publishParams)
}

//会议发布
export const publish = (publishParams: PublishParams): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/publish`, publishParams)
}

//删除会议
export const deleteLhhsMeeting = (ids: string[] | DeleteMeetingParams): Promise<Result> => {
  const params = Array.isArray(ids) ? { ids } : ids
  return baseService.post(`/city/lhhs/meeting/delete`, {
    ...params
  })
}

//会议列表
export const getLhhsMeetingPageData = (searchData: SearchData): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/getPage`, searchData)
}

//获取会议编号
export const getMeetingCode = (params?: RoleRequestParams): Promise<Result> => {
  return baseService.get(`/city/lhhs/meeting/getMeetingCode`, params)
}

//获取已纳入会审项目清单
export const getYnrhsxmPage = (searchData: YnrhsxmPage): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/getYnrhsxmPage`, searchData)
}

//获取已纳入会审专家清单
export const getYnrhszjPage = (searchData: YnrhszjPage): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/getYnrhszjPage`, searchData)
}

//获取待纳入会审项目清单
export const getDnrhsxmPage = (searchData: YnrhsxmPage): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/getDnrhsxmPage`, searchData)
}

//获取待纳入会审专家清单
export const getDnrhszjPage = (searchData: YnrhszjPage): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/getDnrhszjPage`, searchData)
}

//保存项目
export const saveXm = (saveData: SaveProData): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/saveXm`, saveData)
}

//保存项目（评审中）
export const saveXmWhenPsz = (saveData: SaveProData): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/saveXmWhenPsz`, saveData)
}

//保存专家
export const saveZj = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/saveZj`, saveData)
}

//删除项目
export const deleteYnrxm = (saveData: SaveProData): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/deleteYnrxm`, saveData)
}

//删除专家
export const deleteYnrzj = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/deleteYnrzj`, saveData)
}

//删除项目（评审中）
export const deleteYnrxmWhenPsz = (saveData: SaveProData): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/deleteYnrxmWhenPsz`, saveData)
}

//删除专家（评审中）
export const deleteYnrzjWhenPsz = (saveData: SaveData): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/deleteYnrzjWhenPsz`, saveData)
}

//导出已纳入会审专家清单
export const exportYnrzj = (saveData: YnrhszjPage): Promise<Result> => {
  return baseService.export(`/city/lhhs/meeting/exportYnrzj`, saveData)
}

//导出已纳入会审项目清单
export const exportYnrxm = (saveData: YnrhsxmPage): Promise<Result> => {
  return baseService.export(`/city/lhhs/meeting/exportYnrxm`, saveData)
}

//模板下载
export const getExpertReviewOpinionImportTemplate = (saveData: YnrhsxmPage): Promise<Result> => {
  return baseService.export(`/city/lhhs/meeting/getExpertReviewOpinionImportTemplate`, saveData)
}

//意见上传
export const importExpertReviewOpinion = (params: any): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/importExpertReviewOpinion`, params.excelFormData)
}

//更新是否已专家评审
export const updateIsMemberReviewWhenAllExpertReviewed = (params: any): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/updateIsMemberReviewWhenAllExpertReviewed`, params)
}

// 获取可研经济与财务合规评审负责人
export const getStepTwoFzr = (bmId: string | RoleRequestParams): Promise<Result> => {
  const params = typeof bmId === 'string' ? { bmId } : bmId
  return baseService.get(`/city/lhhs/meeting/getStepTwoFzr`, params)
}

interface YnrhszjData extends RoleRequestParams {
  meetingId: string
  pszyType?: string
}

// 获取评审分工-根据会议id和阶段获取专家列表(不分页)
export const getYnrhszjList = (ynrhszjData: YnrhszjData): Promise<Result> => {
  return baseService.get(`/city/lhhs/meeting/getYnrhszjList`, ynrhszjData)
}

export const getYnrhszjListNum = (ynrhszjData: YnrhszjData): Promise<Result> => {
  return baseService.get(`/city/lhhs/meeting/getYnrhszjListNum`, ynrhszjData)
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
  return baseService.post(`/city/lhhs/meeting/getYfpxx`, yfpMessageParams)
}

interface DfpMessageParams extends RoleRequestParams {
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
  return baseService.post(`/city/lhhs/meeting/getDfpxx`, dfpMessageParams)
}

interface PsfgParams extends RoleRequestParams {
  expertIds: string[]
  fgpsType: '1' | '2' | '3'
  ids: string[]
  meetingId: string
  pszyType: string
}

// 评审分工
export const psfgData = (psfgParams: PsfgParams): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/psfg`, psfgParams)
}

interface updatePsmsParams extends RoleRequestParams {
  psms: string
  meetingId: string
}

// 更改评审模式
export const updatePsms = (psfgParams: updatePsmsParams): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/updatePsms`, psfgParams)
}

interface MeetingNameParams extends RoleRequestParams {
  bmId: string
  pspcId: string
  meetingId: string
}

// 获取会议名称
export const getMeetingName = (meetingNameParams: MeetingNameParams): Promise<Result> => {
  return baseService.get(`/city/lhhs/meeting/getMeetingName`, meetingNameParams)
}

interface DeleteExpertProjectParams extends RoleRequestParams {
  expertId: string
  pszyType: string
  meetingId: string
  xmIds: string[]
}

// 删除关联专家项目
export const deleteExpertProject = (deleteExpertProjectParams: DeleteExpertProjectParams): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/deleteExpertProject`, deleteExpertProjectParams)
}

//上传会议通知附件
export const getRemindAttach = (params: any): Promise<Result> => {
  return baseService.get(`/city/lhhs/meeting/getRemindAttach`, params)
}

// 删除会议通知附件
export const deleteRemindAttach = (params: any): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/deleteRemindAttach`, params)
}

// 下载附件
export const downloadAttach = (params: any): Promise<Result> => {
  return baseService.post(`/city/lhhs/meeting/downloadAttach?uuid=${params.uuid}${buildRoleQuery(params)}`)
}

export const exportData = (params: any): Promise<Result> => {
  return baseService.export(`/city/lhhs/meeting/export`, params)
}

// 获取上传附件
export const uploadRemindAttach = (params: any): Promise<Result> => {
  const attachType = params.attachType ? `&attachType=${params.attachType}` : ''
  const roleQuery = buildRoleQuery(params)
  return baseService.post(
    `/city/lhhs/meeting/uploadRemindAttach?attachNames=${params.attachNames}&meetingIds=${params.meetingIds}${attachType}${roleQuery}`,
    params.excelFormData
  )
}

export const uploadRemindAttachWhenCreate = (params: any): Promise<Result> => {
  const attachType = params.attachType ? `&attachType=${params.attachType}` : ''
  const roleQuery = buildRoleQuery(params)
  return baseService.post(
    `/city/lhhs/meeting/uploadRemindAttachWhenCreate?attachNames=${params.attachNames}${attachType}${roleQuery}`,
    params.excelFormData
  )
}
