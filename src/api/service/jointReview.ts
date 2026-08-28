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

//专家联合会审
//获取专家、组长信息
export const getExpertInfoByCurrentUser = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/getExpertInfoByCurrentUser`, params)
}
// 双击行获取项目信息
export const pageGetXmInfo = (params: any): Promise<Result> => {
  return baseService.get(`expertReview/getXmInfo?xmId=${params}`)
}

// 获取作证材料
export const getXmInfoByYsbgfj = (params: any): Promise<Result> => {
  return baseService.get(`expertReview/getXmInfoByYsbgfj?xmId=${params}`)
}

// AI智能审核：根据项目名称查询审核详情id（查不到返回0）
export const findAiAuditViewId = (name: string): Promise<Result> => {
  return baseService.post(`/ai/third/zj/findViewId`, { name })
}
//专家项目清单--项目信息导出
export const exportXmInfo = (formData: Params): Promise<Result> => {
  return baseService.export(`/expertReview/exportXmInfo`, formData)
}

// 项目附件导出
export const exportXmAttach = (params: any): Promise<Result> => {
  return baseService.export(`/expertReview/exportXmAttach`, params)
}

// 专家会议记录--列表查询
export const pageMeetingInfo = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/pageMeetingInfo`, params)
}
// 专家项目清单--列表查询
export const pageXmInfo = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/pageXmInfo`, params)
}
// 专家项目清单--维护评审意见
export const saveExpertReviewRecord = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/saveExpertReviewRecord`, params)
}
// 专家项目清单-模板下载
export const getExpertReviewRecordImportTemplate = (params: Params): any => {
  return baseService.export(`/expertReview/getExpertReviewRecordImportTemplate`, params)
}
// 专家项目清单-上传附件
export const importExpertReviewRecord = (params: ImportData): any => {
  return baseService.post(`/expertReview/importExpertReviewRecord?expertId=${params.expertId}&meetingId=${params.meetingId}`, params.excelFormData)
}

// 专家项目清单-上传附件-省级统筹
export const importExpertReviewRecordForSjtc = (params: ImportData): any => {
  return baseService.post(
    `/expertReview/importExpertReviewRecordForSjtc?expertId=${params.expertId}&meetingId=${params.meetingId}`,
    params.excelFormData
  )
}

// 专家项目清单-上传专家评审记录(市级联合会审)
export const importExpertReviewRecordForCityLhhs = (params: any): any => {
  return baseService.post(
    `/expertReview/importExpertReviewRecordForCityLhhs?expertId=${params.expertId}&meetingId=${params.meetingId}&spOrgId=${params.spOrgId}&spRoleId=${params.spRoleId}`,
    params.excelFormData
  )
}

// 专家项目清单--维护评审意见-省级统筹
export const saveExpertReviewRecordForSjtc = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/saveExpertReviewRecordForSjtc`, params)
}

// 专家项目清单--保存专家评审记录(市级联合会审)
export const saveExpertReviewRecordForCityLhhs = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/saveExpertReviewRecordForCityLhhs`, params)
}

// 专家评审-与本会议上个提交记录比对功能
export const getLastXmInfoForCmp = (params: any): Promise<Result> => {
  return baseService.post(`expertReview/getLastXmInfoForCmp?meetingId=${params.meetingId}&xmId=${params.xmId}&originXmId=${params.originXmId}`)
}

// 根据评审意见获取评审意见说明
export const getReasonByOpinion = (params: Params): any => {
  return baseService.post(`/expertReview/getReasonByOpinion`, params)
}

// 专家项目清单--查询是否可以评审
export const canExpertReview = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/canExpertReview`, params)
}

// 专家项目清单--查询是否可以退回
export const canExpertReviewTh = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/canExpertReviewTh`, params)
}

// 专家项目清单--退回
export const expertReviewTh = (params: Params): Promise<Result> => {
  return baseService.post(`expertReview/expertReviewTh`, params)
}
//组长终评
// 组长会议记录--列表查询
export const leaderReviewPageMeetingInfo = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/pageMeetingInfo`, params)
}

// 组长终评--项目列表查询
export const leaderReviewPageXmInfo = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/pageXmInfo`, params)
}
// 组长终评--专家评审意见列表查询
export const pageExpertReviewInfo = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/pageExpertReviewInfo`, params)
}
// 组长终评--查询是否可以评审
export const canLeaderReview = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/canLeaderReview`, params)
}
// 组长终评--保存组长评审记录
export const saveLeaderReviewRecord = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/saveLeaderReviewRecord`, params)
}

// 组长终评--保存组长批量评审记录
export const saveLeaderReviewRecordNew = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/saveLeaderReviewRecordNew`, params)
}

// 组长终评-模板下载
export const getLeaderReviewRecordImportTemplate = (params: Params): any => {
  return baseService.export(`leaderReview/getLeaderReviewRecordImportTemplate`, params)
}
// 组长终评-上传附件
export const importLeaderReviewRecord = (params: ImportData): any => {
  return baseService.post(`leaderReview/importLeaderReviewRecord?expertId=${params.expertId}&meetingId=${params.meetingId}`, params.excelFormData)
}

// 组长终评--查询是否可以退回
export const canLeaderReviewTh = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/canLeaderReviewTh`, params)
}

// 组长终评--退回
export const leaderReviewTh = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/leaderReviewTh`, params)
}

//组长终评--项目信息导出
export const leaderReviewExportXmInfo = (formData: Params): Promise<Result> => {
  return baseService.export(`/leaderReview/exportXmInfo`, formData)
}
// 组长终评--开启评审
export const startReview = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/startReview`, params)
}
// 组长终评--关闭评审
export const closeReview = (params: Params): Promise<Result> => {
  return baseService.post(`leaderReview/closeReview`, params)
}
// 组长终评--获取专家评审意见
export const getExpertReviewReason = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/getExpertReviewReason`, params)
}

// 组长终评--分页查询重新纳入会审项目信息
export const pageCxnrhsXmInfo = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/pageCxnrhsXmInfo`, params)
}

//组长终评--导出重新纳入会审项目信息
export const exportCxnrhsXmInfo = (formData: Params): Promise<Result> => {
  return baseService.export(`/leaderReview/exportCxnrhsXmInfo`, formData)
}

// 组长终评--重新纳入会审
export const cxnrhs = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/cxnrhs`, params)
}

// 报告管理
// 报告管理--结束会议
export const endMeeting = (params: any): Promise<Result> => {
  return baseService.post(`reviewReport/endMeeting`, params)
}
// 报告管理--重新打开会议
export const startMeeting = (params: any): Promise<Result> => {
  return baseService.post(`reviewReport/startMeeting`, params)
}
// 报告管理--分页查询会议
export const reviewReportPageMeetingInfo = (params: any): Promise<Result> => {
  return baseService.post(`reviewReport/pageMeetingInfo`, params)
}
// 报告管理--生成报告
export const generateReviewReport = (params: any): Promise<Result> => {
  return baseService.post(`reviewReport/generateReviewReport`, params)
}

// 报告管理--删除报告（定稿）
export const removeFinalReport = (params: any): Promise<Result> => {
  return baseService.post(`reviewReport/removeFinalReport?meetingId=${params}`)
}

// 报告管理-上传报告（定稿）
export const uploadFinalReport = (params: any): any => {
  return baseService.post(`reviewReport/uploadFinalReport`, params)
}

// 报告管理--下载报告 非结构化平台下载
export const downloadReviewReport = (params: any): Promise<Result> => {
  return baseService.export(`reviewReport/downloadReviewReport?uuid=${params.uuid}&fileName=${params.fileName}`)
}
//查看专家评审意见
// 查看专家评审意见--分页查询会议
export const lhhsXmDetailPageXmInfo = (params: any): Promise<Result> => {
  return baseService.post(`lhhsXmDetail/pageXmInfo`, params)
}
//查看专家评审意见--项目信息导出
export const lhhsXmDetailExportXmInfo = (formData: Params): Promise<Result> => {
  return baseService.export(`lhhsXmDetail/exportXmInfo`, formData)
}
// 项目评审记录
export const pageXmHistoryReviewRecord = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/pageXmHistoryReviewRecord`, params)
}

//联合会审项目分配
//联合会审项目分配-分页查询专家信息
export const pageExpertInfo = (params: any): Promise<Result> => {
  return baseService.post(`lhhsProjectAllocate/pageExpertInfo`, params)
}
//联合会审项目分配-分页查询专家已关联项目信息
export const pageExpertLinkedXmInfo = (params: any): Promise<Result> => {
  return baseService.post(`lhhsProjectAllocate/pageExpertLinkedXmInfo`, params)
}
//联合会审项目分配-分页查询专家未关联项目信息
export const pageExpertUnLinkedXmInfo = (params: any): Promise<Result> => {
  return baseService.post(`lhhsProjectAllocate/pageExpertUnLinkedXmInfo`, params)
}
//联合会审项目分配-新增专家项目关联
export const addExpertProjectLink = (params: any): Promise<Result> => {
  return baseService.post(`lhhsProjectAllocate/addExpertProjectLink`, params)
}
//联合会审项目分配-删除专家项目关联
export const removeExpertProjectLink = (params: any): Promise<Result> => {
  return baseService.post(`lhhsProjectAllocate/removeExpertProjectLink`, params)
}

//联合会审项目分配--项目信息导出
export const exportExpertLinkedXmInfo = (formData: Params): Promise<Result> => {
  return baseService.export(`lhhsProjectAllocate/exportExpertLinkedXmInfo`, formData)
}

//联合会审项目分配--评审分工
export const psfg = (params: any): Promise<Result> => {
  return baseService.post(`lhhsProjectAllocate/psfg`, params)
}

// 根据会议ID查找组长信息
export const getLeaderByMeetingId = (meetingId: any): Promise<Result> => {
  return baseService.get(`xmExpert/getLeaderByMeetingId?meetingId=${meetingId}`)
}

// 获取催办人员信息
export const ListCbryxx = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/listCbryxx?meetingId=${params.meetingId}`)
}

// 发送催办
export const handleCb = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/cb`, params)
}

// 专业部门评审-是否可以退回
export const canLeaderReviewThForSjtc = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/canLeaderReviewThForSjtc`, params)
}

// 专业部门评审-退回
export const leaderReviewThForSjtc = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/leaderReviewThForSjtc`, params)
}

// 专业部门评审-获取评审阶段
export const getReviewStage = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/getReviewStage?meetingId=${params.meetingId}`)
}

// 获取评审项目ID清单(省级统筹)
export const listReviewXmIdForSjtc = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/listReviewXmIdForSjtc`, params)
}

//查询专家评审信息清单(省级统筹)
export const listExpertReviewInfoForSjtc = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/listExpertReviewInfoForSjtc`, params)
}

// 查询专家评审信息清单(省级统筹)
export const listExpertReviewInfoByTabForSjtc = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/listExpertReviewInfoByTabForSjtc`, params)
}

//获取专家评审标签(省级统筹)
export const listExpertReviewTabForSjtc = (params: any): Promise<Result> => {
  return baseService.post(`leaderReview/listExpertReviewTabForSjtc?meetingId=${params.meetingId}&originXmId=${params.originXmId}`)
}

export interface ExpertRuleReviewRecordParams {
  expertId: string
  meetingId: string
  reviewXmid: string
  ruleId: string
}

export interface ExpertRuleReviewRecordResult {
  reason: string
  reviewId: string
  reviewOpinion: string
}

// 获取专家规则复核记录
export const getExpertRuleReviewRecord = (params: ExpertRuleReviewRecordParams): Promise<Result & { data: ExpertRuleReviewRecordResult }> => {
  return baseService.post(`expertReview/getExpertRuleReviewRecord`, params)
}

// 保存专家规则复核记录
export const saveExpertRuleReviewRecord = (params: ExpertRuleReviewRecordResult & ExpertRuleReviewRecordParams): Promise<Result> => {
  return baseService.post(`expertReview/saveExpertRuleReviewRecord`, params)
}

/** 专家评审进度公共入参 */
export interface ExpertProcessParams {
  bmId: string // 部门ID
  dwId: string // 单位
  expertAccount?: string // 专家账号
  meetingId: string // 会议ID
  meetingCode?: string // 会议编码
  page?: string // 当前页
  limit?: string // 每页条数
  roleCode: string
  roleId: string
  userId: string
}

/** 专家评审进度-穿透/导出入参 */
export type ExpertProcessThroughParams = ExpertProcessParams & {
  xmbms: string[]
  expertId: string
  ctType: string
}

export interface ExpertProcessRow {
  dpsxmNum: string // 待评审项目数量
  expertAccount: string // 专家账号
  expertId: string // 专家ID
  expertName: string // 专家姓名
  meetingCode?: string // 会议编码
  meetingId?: string // 会议ID
  pszyType: string // 评审专业
  totalNum: string // 评审项目总数量
  wcl: string // 完成率(%)
  ypsxmNum: string // 已评审项目数量
  /** 项目编码列表（穿透用） */
  xmbms?: string[] | string
  // 穿透明细字段
  xmbm?: string
  xmmc?: string
  zyssxmc?: string
  yjdw?: string
  yjdwName?: string
  ejdw?: string
  ejdwName?: string
  reviewOpinion?: string
  reviewReason?: string
  thdpsxmNum?: string //退回待评审项目统计
}

/** 专家评审进度分页 data */
export interface ExpertProcessPublicResult {
  current: string
  pages: string
  records: ExpertProcessRow[]
  searchCount: string
  size: string
  total: string
}

// 专家评审进度
export const getExpertProcess = (params: ExpertProcessParams): Promise<Result & { data: ExpertProcessPublicResult }> => {
  return baseService.post(`leaderReview/getExpertPsjd`, params) as Promise<Result & { data: ExpertProcessPublicResult }>
}

// 专家评审进度-穿透 ctType: totalNum、ypsxmNum、dpsxmNum
export const getExpertProcessThrough = (
  params: ExpertProcessThroughParams
): Promise<Result & { data: ExpertProcessRow[] | ExpertProcessPublicResult }> => {
  return baseService.post(`leaderReview/getExpertPsjdCtData`, params) as Promise<Result & { data: ExpertProcessRow[] | ExpertProcessPublicResult }>
}

// 专家评审进度-穿透导出（blob）
export const exportExpertProcess = (params: ExpertProcessThroughParams): Promise<any> => {
  return baseService.export(`leaderReview/exportExpertPsjdCtData`, params)
}
