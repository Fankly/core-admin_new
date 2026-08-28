import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'
import baseService from '@/service/baseService'

export const budget = ServiceApi.budget

export interface SmartTaskAuditSearchParams {
  bmId: string // 部门id
  dwId: string // 单位id
  isHis?: string // 是否历史数据(0 否 1 是) 取公共代码 GY_SF
  limit: number | string // 每页条数
  orderByType?: number | string // 排序类型
  page: number | string // 页码
  priority?: string // 优先级(1 高 2 中 3 低) 取公共代码 AI_AUDIT_TASK_PRIORITY_COM
  roleId: string // 角色id
  roleCode: string // 角色code
  status?: string // 任务状态 // 1 等待中 2 处理中 3 已完成 4 处理失败 取公共代码 AI_AUDIT_TASK_STATUS_COM
  docPreStatus?: string // 文档预处理状态 取公共代码 AI_AUDIT_DOC_TYPE_PRE_STATUS_COM
  taskName?: string // 任务名称
  createStartTime?: string // 创建开始日期，格式 YYYY-MM-DD
  createFinishTime?: string // 创建结束日期，格式 YYYY-MM-DD
  userId: string // 用户id
  yjdw: string // 一级单位
  ejdwList?: string[] // 二级单位id列表
  jhssnd?: string // 计划实施年度  通过公共代码 ZLYS_XMJHSSND
  proTypeList?: string[] // 项目类型列表
  xmbmList?: string[] // 项目编码列表
}

export interface SmartTaskAuditListItem {
  createTime: string // 创建时间
  startTime: string // 开始时间
  finishTime: string // 结束时间
  isHis: string // 是否历史数据(0 否 1 是) 取公共代码 GY_SF
  isHisName: string // 是否历史数据名称
  priority: string // 优先级(1 高 2 中 3 低) 取公共代码 AI_AUDIT_TASK_PRIORITY_COM
  priorityName: string // 优先级名称
  proId: string // 项目id
  status: string // 任务状态 // 0 待审核 1 审核中 2 已完成 3 已撤销 4 已驳回 取公共代码 AI_AUDIT_TASK_STATUS_COM
  statusName: string // 任务状态名称
  docPreStatus: string // 文档预处理状态 取公共代码 AI_AUDIT_DOC_TYPE_PRE_STATUS_COM
  docPreStatusName: string // 文档预处理状态名称
  taskId: string // 任务id
  taskName: string // 任务名称
  yjdw: string // 一级单位
  ejdw: string // 二级单位
  xmbm: string // 项目编码
  proType: string // 项目类型
  proTypeName: string // 项目类型名称
  jhssnd: string // 计划实施年度
  ruleName: string // 当前执行规则
  xmmc: string // 项目名称
}

export interface SmartTaskAuditListResult {
  records: SmartTaskAuditListItem[]
  total: number
}

// 获取智能任务审核列表
export const getSmartTaskAuditList = (params: SmartTaskAuditSearchParams): Promise<Result & { data: SmartTaskAuditListResult }> => {
  return budget.post('ai-audit-task-manage/getTaskPage', params, {}, false)
}

// 导出智能任务审核列表
export const exportSmartTaskAuditList = (params: SmartTaskAuditSearchParams): Promise<Result> => {
  return budget.exportFile('ai-audit-task-manage/exportTask', params, {}, false)
}

export interface SmartTaskAuditDetailSearchParams {
  bmId: string // 部门id
  dwId: string // 单位id
  ejdwList?: string[] // 二级单位id列表
  ejfl?: string // 二级分类
  flowStatusList?: string[] // 流程状态清单
  jhssnd?: string // 计划实施年度  通过公共代码 ZLYS_XMJHSSND
  limit: number | string // 每页条数
  page: number | string // 页码
  proTypeList?: string[] // 项目类型列表
  roleId: string // 角色id
  roleCode: string // 角色code
  sjflList?: string[] // 三级分类列表
  userId: string // 用户id
  xmbmList?: string[] // 项目编码列表
  xmmc?: string // 项目名称
  yjdw?: string // 一级单位
  yjfl?: string // 一级分类 // 通过公共代码 GWXMFL
}

export interface SmartTaskAuditDetailListItem {
  amount: number | string // 申报预算（万元）
  createDep: string // 创建部门
  createTime: string // 创建时间
  createor: string // 创建人
  ctbm: string // 市管部门
  ejdw: string // 二级单位
  ejfl: string // 二级分类
  flowStatus: string // 流程状态
  jhssnd: string // 计划实施年度
  proType: string // 项目类型
  sjfl: string // 三级分类
  xmId: string // 项目id
  xmbm: string // 项目编码
  xmmc: string // 项目名称
  yjdw: string // 一级单位
  yjfl: string // 一级分类
  zgkbm: string // 省归口部门
}

// 获取分页项目列表
export const getSmartTaskAuditProjectList = (params: SmartTaskAuditDetailSearchParams): Promise<Result> => {
  return budget.post('ai-audit-task-manage/getXmPage', params, {}, false)
}

interface XmAuditConcludeResult {
  auditConclude: string // 审核结论
  auditResult: string // 审核结果 1 通过 0 未通过
  ruleLevelFindNumList: RuleLevelFindNum[]
}

interface RuleLevelFindNum {
  findNum: number | string // 发现数量
  ruleLevel: string // 规则级别 1 发现问题数 2发现隐患数 3发现异常数
  ruleLevelName: string // 规则级别名称
}

// 获取项目审核结论
export const getXmAuditConclude = (taskId: string): Promise<Result & { data: XmAuditConcludeResult }> => {
  return budget.get(`ai-audit-task-manage/getXmAuditConclude?taskId=${encodeURIComponent(taskId)}`, {}, {}, false)
}

// 创建任务
export const createSmartTaskAudit = (proIdList: string[]): Promise<Result> => {
  return budget.post('ai-audit-task-manage/createTask', proIdList, {}, false)
}

// 重新执行任务
export const redoTask = (taskId: string): Promise<Result> => {
  return budget.post(`ai-audit-task-manage/redoTask?taskId=${encodeURIComponent(taskId)}`, {}, {}, false)
}

// 重新执行审核任务并补全规则
export const redoTaskWithCompleteRule = (taskId: string): Promise<Result> => {
  return budget.post(`ai-audit-task-manage/redoTaskWithCompleteRule?taskId=${encodeURIComponent(taskId)}`, {}, {}, false)
}

// 删除任务
export const deleteSmartTaskAudit = (taskIdList: string[]): Promise<Result> => {
  return budget.post('ai-audit-task-manage/removeTask', taskIdList, {}, false)
}

interface publicParams {
  bmId: string // 部门id
  dwId: string // 单位id
}

// 获取一级单位
export const getYjdwList = (params: publicParams): Promise<Result> => {
  return budget.post('bizOrgTree/getYjdw', params, {}, false)
}

interface EjdwParams extends publicParams {
  YJDW: string // 一级单位
  parentCode: string // 父级code和YJDW相同的值
}

// 获取二级单位 parentCode和YJDW相同的值 获取二级单位列表
export const getEjdwList = (params: EjdwParams): Promise<Result> => {
  return budget.post('bizOrgTree/getEjdw', params, {}, false)
}

// 获取流程状态清单 树形结构
export const getFlowStatusList = (params: publicParams): Promise<Result> => {
  return budget.post('commonCode/getFlowStatusTree', params, {}, false)
}

interface flParams extends publicParams {
  code: 'GWXMFL' // 通过公共代码 GWXMFL 获取项目分类列表
  parentCode: string // 父级code和一级分类相同的值
}

// 获取二级分类、三级分类,parentCode不同获取不同分类 二级分类parentCode为一级分类，三级分类parentCode为二级分类 获取项目分类列表
export const getFlList = (params: flParams): Promise<Result> => {
  return budget.post('commonCode/getCommonCodeByParentCode', params, {}, false)
}

export interface RuleReviewInfoParams {
  taskId: string // 任务id
  ruleClassify: string // 规则分类 取公共代码 AI_AUDIT_RULE_CLASSIFY_COM
  reviewOpinions: string // 审核意见 公共代码 AI_AUDIT_REVIEW_OPINION_COM 0 不通过 1 通过 2 待审核
}

export interface RuleReviewDetailParams {
  detailId: string // 规则评审信息id
}

export interface ReviewTableColumn {
  key: string
  label: string
  align: string
  width: string
  fixed: string
  hide?: boolean // 兼容历史隐藏字段
  hidden?: boolean // 后端列隐藏字段，默认 false
}

/** 单张评审明细表结构 */
export interface ReviewTable {
  columns: ReviewTableColumn[]
  rows: {
    [key: string]: any
  }[]
  tableMeta: {
    title: string
  }
}

/**
 * 接口原始 reviewTable：
 * 实际多为 JSON 字符串，形如 "[{columns,rows,tableMeta},...]"，内部可能含 \" 转义或二次序列化；
 * 也兼容已解析的 ReviewTable[] / 历史单表对象。
 */
export type ReviewTableRaw = string | ReviewTable[] | ReviewTable | null | undefined

export interface RuleReviewInfoRes {
  detailId: string // 规则评审信息id
  ruleLevel: string // 规则级别 1 发现问题数 2发现隐患数 3发现异常数
  ruleLevelName?: string // 规则级别名称
  reviewOpinion?: string // 审核意见 公共代码 AI_AUDIT_REVIEW_OPINION_COM 0 不通过 1 通过
  reviewOpinionName?: string // 审核意见名称
  ruleId: string // 规则id
  ruleName: string // 规则名称
  ruleviewConclude?: string // 审核结论（兼容后端历史字段命名）
  reviewConclude?: string // 审核结论
  ruleCode: string // 规则编码
  status: string | number // 评审执行状态，2 表示执行中
  taskId: string // 任务ID
  [key: string]: any
}

export const getRuleReviewInfo = (params: RuleReviewInfoParams): Promise<Result & { data: RuleReviewInfoRes[] }> => {
  return budget.post('ai-audit-task-manage/listRuleReview', params, {}, false)
}

// 修改优化级
export const updatePriority = (taskIdList: string[], priority: string): Promise<Result> => {
  return budget.post('ai-audit-task-manage/updateTaskPriority', { taskIdList, priority }, {}, false)
}

// 重新执行审核规则
export const redoAuditRule = (params: RuleReviewDetailParams): Promise<Result> => {
  return budget.post(`ai-audit-task-manage/redoAuditRule?detailId=${encodeURIComponent(params.detailId)}`, {}, {}, false)
}

export interface RuleReviewPoint {
  id: string // 主键ID
  proId: string // 项目ID
  detailId: string // 任务明细ID
  pointId: string // 审核点ID
  pointName: string // 审核点名称
  ruleDescription: string // 规则描述
  originalEvidence: string // 原文出处
  reviewConclusion: string // 审核结论 通过/待复核/不通过
  conclusionDescription: string // 结论描述
}

export interface RuleReviewInfo extends RuleReviewInfoRes {
  finishTime: string // 完成时间
  message: string // 错误信息
  reviewConclude: string // 审核结论
  reviewMessage: string // 审核信息
  reviewOpinion: string // 审核意见 公共代码 AI_AUDIT_REVIEW_OPINION_COM 0 不通过 1 通过
  reviewOpinionName: string // 审核意见名称
  reviewProcess: string // 分析过程
  originalText: string // 引用韵文
  reviewTable: ReviewTableRaw // 表格数据
  ruleCode: string // 规则编码
  ruleDesc: string // 规则描述
  ruleId: string // 规则Id
  startTime: string // 开始时间
  status: string // 状态（1：待处理 2：处理中 3：已完成 4：处理失败）
  taskId: string // 任务ID
  points: RuleReviewPoint[]
  /** 评审表格：接口常返回 JSON 字符串 "[{ReviewTable},...]"，见 ReviewTableRaw */
}

// 获取单个项目的审核规则
export const getRuleReview = (params: RuleReviewDetailParams): Promise<Result & { data: RuleReviewInfo }> => {
  return budget.get(`ai-audit-task-manage/getRuleReview?detailId=${encodeURIComponent(params.detailId)}`, {}, {}, false)
}

export interface ProcessProgressRow {
  name: string
  startTime?: string
  finishTime?: string
  status: string | number
  statusName: string
}

export interface ProcessProgressData {
  transcode: ProcessProgressRow[]
  extract: ProcessProgressRow[]
  aiAudit: ProcessProgressRow[]
}

// 获取处理进度
export const getProcessProgress = (taskId: string): Promise<Result & { data: ProcessProgressData }> => {
  return budget.get(`ai-audit-task-manage/getProcessProgress?taskId=${encodeURIComponent(taskId)}`, {}, {}, false)
}

// 根据项目ID获取审核任务ID
export const getAuditTaskIdByProId = (proId: string): Promise<Result & { data: { taskId: string } }> => {
  return budget.get(`ai-audit-task-manage/getAuditTaskIdByProId?proId=${encodeURIComponent(proId)}`, {}, {}, false)
}

// 根据项目ID获取审核任务ID 联合会审专用
export const getAuditTaskIdByLHHSProId = (proId: string): Promise<Result & { data: { taskId: string } }> => {
  return budget.get(`ai-audit-task-manage/getAuditTaskIdByLHHSProId?proId=${encodeURIComponent(proId)}`, {}, {}, false)
}

export interface TXmAttach {
  id: number | string // 唯一标识
  fjId: string // 附件类型ID
  uuid: string // 附件ID
  name: string // 附件名称
  size: number | string // 附件大小
  proId: number | string // 项目ID
  fjType?: string // 附件类型名称
  uploadUserId?: string // 上传人ID
  uploadUserName?: string // 上传人名称
}

// 获取源文件
export const listAttach = (detailId: string): Promise<Result & { data: TXmAttach[] }> => {
  return budget.get(`ai-audit-task-manage/listAttach?detailId=${encodeURIComponent(detailId)}`, {}, {}, false)
}

// 预览源文件（attachId 传 id 附件类型ID）
export const previewAttach = (attachId: string): Promise<Result & { data: { url: string } }> => {
  return budget.exportFile(`ai-audit-task-manage/previewAttach?attachId=${encodeURIComponent(attachId)}`, {}, {}, false)
}

// 导出
export const exportReviewTable = (detailId: string): Promise<Result> => {
  return budget.getExport(`ai-audit-task-manage/exportReviewTable?detailId=${encodeURIComponent(detailId)}`, {}, {}, false)
}
