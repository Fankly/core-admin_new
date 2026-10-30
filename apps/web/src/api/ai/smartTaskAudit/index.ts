import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'
import baseService from '@/service/baseService'

export const budget = ServiceApi.budget
export const project = ServiceApi.project

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
  auditOpinion?: string | number | null // 整体审核意见，公共代码 AI_AUDIT_REVIEW_OPINION_COM
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
  reviewOpinions: string // 审核意见 公共代码 AI_AUDIT_REVIEW_OPINION_COM 0 不通过 1 通过 2 待审核 3 不执行
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
  reviewOpinion?: string // 审核意见 公共代码 AI_AUDIT_REVIEW_OPINION_COM 0 不通过 1 通过 2 待审核 3 不执行
  reviewOpinionName?: string // 审核意见名称
  ruleId: string // 规则id
  ruleName: string // 规则名称
  ruleviewConclude?: string // 审核结论（兼容后端历史字段命名）
  reviewConclude?: string // 审核结论
  ruleCode: string // 规则编码
  status: string | number // 评审执行状态，2 表示执行中
  taskId: string // 任务ID
  /**
   * 人工复核意见（码值：0 不通过 / 1 通过）：listRuleReview 只在**该要点做过人工复核**后下发，
   * 没有 = 还没复核 —— 界面据此决定要不要盖「复核通过 / 不通过」签章。
   */
  rgReviewOpinion?: string
  /** 人工复核意见名称（通过 / 不通过）：码值缺失时的兜底判据 */
  rgReviewOpinionName?: string
  /** 人工复核结论（人工填写的复核结论描述） */
  rgReviewConclude?: string
  [key: string]: any
}
export const getRuleReviewInfo = (params: RuleReviewInfoParams): Promise<Result & { data: RuleReviewInfoRes[] }> => {
  return budget.post('ai-audit-task-manage/listRuleReview', params, {}, false)
}

interface RuleReviewNewParams {
  taskId: string
}

// 查询规则评审信息
export const listCategoryRuleReview = (params: RuleReviewNewParams): Promise<Result & { data: RuleReviewInfo[] }> => {
  return budget.post(`ai-audit-task-manage/listCategoryRuleReview`, { ...params }, {}, false)
}

interface listRuleReviewNewVo {
  taskId: string
  categoryRuleId: string
}

export const listRuleReviewNew = (params: listRuleReviewNewVo): Promise<Result & { data: RuleReviewInfoRes[] }> => {
  return budget.post('ai-audit-task-manage/listRuleReview', params, {}, false)
}

// 修改优化级
export const updatePriority = (taskIdList: string[], priority: string): Promise<Result> => {
  return budget.post('ai-audit-task-manage/updateTaskPriority', { taskIdList, priority }, {}, false)
}

/**
 * 审核任务详情 / 修改任务入参（AiAuditTaskEntity）。
 * 来源：docs/AiAuditTaskManageController接口协议.md 一、getTaskById 与 二、updateTask。
 *
 * taskId 在两个接口里都必传；其余字段在 updateTask 中按需传，不传即不更新。
 * 大 ID 是字符串（jsonBigstring 解析），勿盲目 Number()。
 */
export interface AiAuditTaskEntity {
  /** 任务ID */
  taskId: string
  /** 项目ID */
  proId?: string
  /** 任务名称 */
  taskName?: string
  /** 优先级（1 高 2 中 3 低） 取公共代码 AI_AUDIT_TASK_PRIORITY_COM */
  priority?: string
  /** 创建时间 */
  createTime?: string
  /** 开始时间：getTaskDetail 回显为字符串；updateTask 时由前端日期控件转 Date 传给后端 */
  startTime?: string | Date
  /** 完成时间：getTaskDetail 回显为字符串；updateTask 时由前端日期控件转 Date 传给后端 */
  finishTime?: string | Date
  /** 状态（1 待处理 2 处理中 3 已完成 4 处理失败） 取公共代码 AI_AUDIT_TASK_STATUS_COM */
  status?: string
  /** 是否历史（0 当前 1 历史） 取公共代码 GY_SF */
  isHis?: string
  /** 审核意见（2 待复核 1 通过 0 不通过） 取公共代码 AI_AUDIT_REVIEW_OPINION_COM */
  reviewOpinion?: string
  /** 审核结论 */
  reviewConclude?: string
  /** 分析过程 */
  reviewProcess?: string
  /** 审核结果（10 通过 20 问题 30 预警 40 异常） 取公共代码 AI_AUDIT_REVIEW_RESULT_COM */
  result?: string
  /** 当前审核规则ID */
  ruleId?: string
  /** 错误信息 */
  message?: string
  /** 规则名称 */
  ruleName?: string
  /** 人工复核意见 取公共代码 MANUAL_REVIEW_OPINION_COM */
  manualReviewOpinion?: string
  /** 人工复核状态 取公共代码 MANUAL_REVIEW_STATUS_COM */
  manualReviewStatus?: string
}

/** 查询单条审核任务信息（协议 一）。仅 taskId 作为查询条件 */
export const getTaskDetailById = (taskId: string): Promise<Result & { data: AiAuditTaskEntity }> => {
  return budget.post('ai-audit-task-manage/getTaskById', { taskId }, {}, false)
}

/** 修改审核任务（协议 二）。按 taskId 更新传入的字段，data 为 null */
export const updateTask = (params: AiAuditTaskEntity): Promise<Result> => {
  return budget.post('ai-audit-task-manage/updateTask', params, {}, false)
}

/**
 * 审核要点任务详情（协议 三 getTaskDetailByTask）。
 * 按任务ID查询该任务下审核要点明细列表（审核要点级别）。
 * 大 ID 是字符串（jsonBigstring 解析），勿盲目 Number()。
 */
export interface AiAuditTaskDetailVO {
  /** 明细ID */
  detailId: string
  /** 任务ID */
  taskId: string
  /** 规则ID */
  ruleId: string
  /** 要点名称 */
  auditPointPointName?: string
  /** 规则描述 */
  ruleDesc?: string
  /** 审核意见（1 通过 0 不通过 2 待复核 3 不执行） 取公共代码 AI_AUDIT_REVIEW_OPINION_COM */
  reviewOpinion?: string
  /** 审核意见名称 */
  reviewOpinionName?: string
  /** 审核结论 */
  reviewConclude?: string
  /** 引用原文 */
  originalText?: string
  /** 改进建议 */
  reviewAdvice?: string
  /** 分析过程 */
  reviewProcess?: string
  /** 审核消息 */
  reviewMessage?: string
  /** 表格数据（接口常返回 JSON 字符串） */
  reviewTable?: ReviewTableRaw
  /** 开始时间 */
  startTime?: string
  /** 完成时间 */
  finishTime?: string
  /** 状态（1 待处理 2 处理中 3 已完成 4 处理失败） 取公共代码 AI_AUDIT_TASK_STATUS_COM */
  status?: string
  /** 状态名称 */
  statusName?: string
  /** 错误信息 */
  message?: string
}

/** 查询审核要点任务详情（协议 三）。仅 taskId 作为查询条件，返回该任务下审核要点明细列表 */
export const getTaskDetailByTask = (taskId: string): Promise<Result & { data: AiAuditTaskDetailVO[] }> => {
  return budget.post('ai-audit-task-manage/getTaskDetailByTask', { taskId }, {}, false)
}

/**
 * 修改审核要点任务详情入参（协议 四 AiAuditTaskDetailEntity）。
 * detailId 必填，其余字段按需传，不传即不更新。
 */
export interface AiAuditTaskDetailUpdateParams {
  /** 明细ID（必填） */
  detailId: string
  /** 任务ID */
  taskId?: string
  /** 规则ID */
  ruleId?: string
  /** 规则描述 */
  ruleDesc?: string
  /** 审核意见（1 通过 0 不通过 2 待复核 3 不执行） 取公共代码 AI_AUDIT_REVIEW_OPINION_COM */
  reviewOpinion?: string
  /** 审核结论 */
  reviewConclude?: string
  /** 引用原文 */
  originalText?: string
  /** 改进建议 */
  reviewAdvice?: string
  /** 分析过程 */
  reviewProcess?: string
  /** 审核消息 */
  reviewMessage?: string
  /** 表格数据 */
  reviewTable?: string
  /** 状态（1 待处理 2 处理中 3 已完成 4 处理失败） 取公共代码 AI_AUDIT_TASK_STATUS_COM */
  status?: string
  /** 错误信息 */
  message?: string
}

/** 修改审核要点明细（协议 四）。按 detailId 更新传入的字段，data 为 null */
export const updateTaskDetail = (params: AiAuditTaskDetailUpdateParams): Promise<Result> => {
  return budget.post('ai-audit-task-manage/updateTaskDetail', params, {}, false)
}

/**
 * 审核规则任务详情（协议 五 getTaskDetailSumByTask）。
 * 按任务ID查询该任务下审核规则汇总明细列表（规则分类级别）。
 * 字段全部接收，列表展示 ruleName / reviewOpinionName / reviewConclude / originalText 四列。
 * 大 ID 是字符串（jsonBigstring 解析），勿盲目 Number()。
 */
export interface AiAuditTaskDetailSumVO {
  /** 明细ID */
  detailId: string
  /** 任务ID */
  taskId: string
  /** 规则分类ID */
  categoryRuleId: string
  /** 审核意见（1 通过 0 不通过 2 待复核 3 不执行） 取公共代码 AI_AUDIT_REVIEW_OPINION_COM */
  reviewOpinion?: string
  /** 审核意见名称 */
  reviewOpinionName?: string
  /** 审核结论 */
  reviewConclude?: string
  /** 引用原文 */
  originalText?: string
  /** 规则名称 */
  ruleName?: string
}

/** 查询审核规则任务详情（协议 五）。仅 taskId 作为查询条件，返回该任务下审核规则汇总明细列表 */
export const getTaskDetailSumByTask = (taskId: string): Promise<Result & { data: AiAuditTaskDetailSumVO[] }> => {
  return budget.post('ai-audit-task-manage/getTaskDetailSumByTask', { taskId }, {}, false)
}

/**
 * 修改审核规则任务详情入参（协议 六 AiAuditTaskDetailSumEntity）。
 * detailId 必填，其余字段按需传，不传即不更新。
 */
export interface AiAuditTaskDetailSumUpdateParams {
  /** 明细ID（必填） */
  detailId: string
  /** 任务ID */
  taskId?: string
  /** 规则分类ID */
  categoryRuleId?: string
  /** 审核意见（1 通过 0 不通过 2 待复核 3 不执行） 取公共代码 AI_AUDIT_REVIEW_OPINION_COM */
  reviewOpinion?: string
  /** 审核结论 */
  reviewConclude?: string
  /** 引用原文 */
  originalText?: string
}

/** 修改审核规则任务详情（协议 六）。按 detailId 更新传入的字段，data 为 null */
export const updateTaskDetailSum = (params: AiAuditTaskDetailSumUpdateParams): Promise<Result> => {
  return budget.post('ai-audit-task-manage/updateTaskDetailSum', params, {}, false)
}

// 重新执行审核规则
export const redoAuditRule = (params: RuleReviewDetailParams): Promise<Result> => {
  return budget.post(`ai-audit-task-manage/redoAuditRule?detailId=${encodeURIComponent(params.detailId)}`, {}, {}, false)
}

// 重新执行审核规则
export const redoAuditRuleNew = (params: RuleReviewDetailParams): Promise<Result> => {
  return project.post(`ai-audit-task-manage/redoAuditRule?detailId=${encodeURIComponent(params.detailId)}`, {}, {}, false)
}

/**
 * 审核要点。字段来源：listRuleReviewNew 返回的 RuleReviewInfoRes[]，
 * 由 loadReviewPoints 经 { ...item, id } 展开注入 id（取 detailId 或 ruleId）。
 */
export interface RuleReviewPoint {
  id: string // 由前端注入：detailId || ruleId
  detailId: string // 规则评审信息id（要点主键，详情/重跑均用此字段）
  ruleId: string // 规则id
  ruleName?: string // 规则名称
  ruleCode?: string // 规则编码
  taskId?: string // 任务ID
  auditPointName?: string // 审核要点名称
  reviewOpinionName?: string // 审核意见名称（通过/不通过/待复核/不执行）
  reviewConclude?: string // 审核结论描述（富文本，可能含 HTML/Markdown）
  ruleviewConclude?: string // 审核结论（兼容后端历史字段命名）
  reviewOpinion?: string // 审核意见代码 0 不通过 / 1 通过 / 2 待复核 / 3 不执行
  /**
   * 人工复核意见（码值：0 不通过 / 1 通过）。
   * listRuleReview 只在**该要点做过人工复核**后才下发；没有 = 还没复核 ——
   * 详情页据此决定要不要盖「复核通过 / 复核不通过」签章。
   */
  rgReviewOpinion?: string
  /** 人工复核意见名称（通过 / 不通过）：码值缺失时的兜底判据 */
  rgReviewOpinionName?: string
  /** 人工复核结论（人工填的结论描述） */
  rgReviewConclude?: string
  status?: string | number // 评审执行状态
  [key: string]: unknown // 后端可能下发其他字段，保留透传能力
}

export interface RuleReviewInfo extends RuleReviewInfoRes {
  finishTime: string // 完成时间
  message: string // 错误信息
  reviewConclude: string // 审核结论
  reviewMessage: string // 审核信息
  reviewOpinion: string // 审核意见 公共代码 AI_AUDIT_REVIEW_OPINION_COM 0 不通过 1 通过 2 待审核 3 不执行
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
  /** 人工复核状态码值（后端 2026-10-20 新增）：1 待复核 / 2 部分复核 / 3 全部复核 */
  manualReviewStatus?: string
  /** 人工复核状态名称（规则列表上展示） */
  manualReviewStatusName?: string
  /** 人工审核意见混合状态：1 通过 / 2 待复核 / 4 复核不通过 / 5 复核通过 */
  mixReviewStatus?: string
  /** 人工审核意见名称（接口下发） */
  mixReviewStatusName?: string
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

/**
 * 根据项目ID获取审核任务ID。
 *
 * ⚠️ 返参形状：**`data` 本身就是 taskId**（后端实测 `{code:0, data:"2095064962462117889", msg:"success", success:true}`），
 * 不是 `{ taskId }` 对象。此前类型/文档按对象写，调用侧因此都用「归一化」取值 —— 见
 * `composables/useProjectAiAuditTab`、`service/jointReview/components/AiAuditOpinion` 里的 normalizeTaskId：
 * 字符串与 `{ taskId }` 两种形状都能吃。
 */
export const getAuditTaskIdByProId = (proId: string): Promise<Result & { data: string }> => {
  return budget.get(`ai-audit-task-manage/getAuditTaskIdByProId?proId=${encodeURIComponent(proId)}`, {}, {}, false)
}

// 根据项目ID获取审核任务ID 联合会审专用（返参形状同上：data 就是 taskId）
export const getAuditTaskIdByLHHSProId = (proId: string): Promise<Result & { data: string }> => {
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

// 导出审核任务明细（按任务导出该任务下全部审核要点结论，无分页）
export const exportTaskDetail = (taskId: string): Promise<Result> => {
  return budget.getExport('ai-audit-task-manage/exportTaskDetail', { taskId }, {}, false)
}

/* ------------------------------------------------------------------ *
 * 单要点审核任务（接口文档：docs/单要点审核任务执行管理.md）
 *
 * 与「智能审核任务」的关系：一个智能审核任务 = 一个项目的全规则审核；
 * 一个单要点审核任务 = 一个审核要点 × 多个原始审核任务（项目）。
 * 主键 pointTaskId；创建/编辑提交 { ruleId, taskIdList }；
 * remove / start / cancel 的请求体是**裸主键**（integer），不是对象也不是数组。
 * ------------------------------------------------------------------ */

export interface PointTaskPageParams {
  page: number | string
  limit: number | string
  /** 审核要点ID */
  ruleId?: string
  /** 状态：0已取消 1未开始 2处理中 3已完成 4处理失败 */
  status?: string
  /** 创建时间-开始（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss） */
  createTimeStart?: string
  /** 创建时间-结束（yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss） */
  createTimeFinish?: string
}

export interface PointTaskListItem {
  pointTaskId: string // 要点任务ID
  ruleId: string // 审核要点ID
  ruleName: string // 审核要点名称
  auditPointCode: string // 审核要点编码
  auditPointName: string // 审核要点名称
  createTime: string
  startTime: string
  finishTime: string
  status: string // 0已取消 1未开始 2处理中 3已完成 4处理失败
  statusName: string
  taskCount: number // 明细总数
  completedCount: number // 已完成明细数
}

export interface PointTaskListResult {
  records: PointTaskListItem[]
  total: number
}

export interface PointTaskDetailPageParams {
  page: number | string
  limit: number | string
  pointTaskId: string
  status?: string
}

export interface PointTaskDetailItem {
  detailId: string
  pointTaskId: string
  taskId: string
  taskName: string
  proId: string
  createTime: string
  startTime: string
  finishTime: string
  status: string
  statusName: string
  message: string
}

// 分页查询要点审核任务
export const getPointTaskPage = (params: PointTaskPageParams): Promise<Result & { data: PointTaskListResult }> => {
  return budget.post('ai-audit-point-task/getPage', params, {}, false)
}

// 分页查询要点任务明细
export const getPointTaskDetailPage = (
  params: PointTaskDetailPageParams
): Promise<Result & { data: { records: PointTaskDetailItem[]; total: number } }> => {
  return budget.post('ai-audit-point-task/getDetailPage', params, {}, false)
}

// 创建要点审核任务
export const createPointTask = (params: { ruleId: string; taskIdList: string[] }): Promise<Result> => {
  return budget.post('ai-audit-point-task/create', params, {}, false)
}

// 修改要点审核任务（仅未开始状态支持；taskIdList 整体替换）
export const editPointTask = (params: { pointTaskId: string; ruleId: string; taskIdList: string[] }): Promise<Result> => {
  return budget.post('ai-audit-point-task/edit', params, {}, false)
}

// 删除要点审核任务（处理中、已完成状态不能删除）——请求体是裸主键
export const removePointTask = (pointTaskId: string): Promise<Result> => {
  return budget.post('ai-audit-point-task/remove', pointTaskId as unknown as Record<string, any>, {}, false)
}

// 开始执行（不能存在其他正在处理中状态的要点审核任务）——请求体是裸主键
export const startPointTask = (pointTaskId: string): Promise<Result> => {
  return budget.post('ai-audit-point-task/start', pointTaskId as unknown as Record<string, any>, {}, false)
}

// 取消执行（仅处理中状态可取消）——请求体是裸主键
export const cancelPointTask = (pointTaskId: string): Promise<Result> => {
  return budget.post('ai-audit-point-task/cancel', pointTaskId as unknown as Record<string, any>, {}, false)
}

// 导出要点审核任务（双 sheet：要点任务 + 任务明细）
export const exportPointTaskList = (params: PointTaskPageParams): Promise<Result> => {
  return budget.exportFile('ai-audit-point-task/exportExcel', params, {}, false)
}

/** 要点审核任务执行进度（GET：pointTaskId 走 query，data 里每个原始审核任务一行） */
export interface PointTaskProgressRow {
  name: string
  startTime: string | null
  finishTime: string | null
  status: string
  statusName: string
}

export const getPointTaskProgress = (pointTaskId: string): Promise<Result & { data: PointTaskProgressRow[] }> => {
  return budget.get('ai-audit-point-task/getProcessProgress', { pointTaskId }, {}, false)
}

/**
 * 审核要点池：单要点审核任务创建/修改时选「审核要点」。
 * 与苏州要点管理同源（`ai-audit-rule-manage/getRulePage`，返回 pointId/auditPointCode/auditPointName 等），
 * 走 `budget` 服务，不引入苏州页面的 API 模块。
 */
export interface AuditPointPoolItem {
  pointId: string
  ruleId?: string
  categoryRuleId?: string
  ruleCode?: string
  ruleName?: string
  auditPointCode: string
  auditPointName: string
  ruleStatus?: string
  ruleStatusName?: string
}

export const getAuditPointPool = (params: Record<string, any>): Promise<Result & { data: { records: AuditPointPoolItem[]; total: number } }> => {
  return budget.post('ai-audit-rule-manage/getRulePage', params, {}, false)
}

/** 图片对比弹窗查询两张图所属项目名称的返参 */
export interface ImageXmInfoVO {
  /** 源图片所属项目名称 */
  srcXmmc: string
  /** 目标图片所属项目名称 */
  targetXmmc: string
}

/**
 * 获取图片项目信息（图片对比弹窗用）。
 * GET `ai/image/getXmInfo?srcImageId=源图片ID&targetImageId=目标图片ID`，
 * 返回 data: { srcXmmc, targetXmmc }。
 */
export const getXmInfo = (srcImageId: string, targetImageId: string): Promise<Result & { data: ImageXmInfoVO }> => {
  return budget.get(
    `ai/image/getXmInfo?srcImageId=${encodeURIComponent(srcImageId)}&targetImageId=${encodeURIComponent(targetImageId)}`,
    {},
    {},
    false
  )
}
