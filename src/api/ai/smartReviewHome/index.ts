// 智能审核工作台 / AI 智能审核首页
import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

/** 总览统计 */
export interface OverviewStat {
  /** 累计发现风险项目数量 */
  ljfxfxxmsl_total?: number | string
  /** 累计项目申报金额今日新增 */
  ljxmsbje_add?: number | string
  /** 累计前置拦截次数 */
  ljqzljcs_total?: number | string
  /** 累计审核项目数量 */
  ljshxmsl_total?: number | string
  /** 累计发现风险项目数量今日新增 */
  ljfxfxxmsl_add?: number | string
  /** 累计前置拦截次数今日新增 */
  ljqzljcs_add?: number | string
  /** 累计发现风险项数量 */
  ljfxfxxsl_total?: number | string
  /** 累计发现风险项今日新增 */
  ljfxfxxsl_add?: number | string
  /** 累计审核项目今日新增 */
  ljshxmsl_add?: number | string
  /** 累计项目申报金额 */
  ljxmsbje_total?: number | string
}

/** 规则库统计项 */
export interface RuleStatItem {
  code: string
  name: string
  count: string
}

/** 文档处理统计 */
export interface DocDealStat {
  xmjys: string // 项目建议书
  kybg: string //可研报告
  gss: string // 估算书
  total: string // 累计解析文档
}

/** 风险分布统计项 */
export interface RiskDistStatItem {
  code: string
  name: string
  count: string
}

/** 风险项排名（页面仅使用 name，不使用 count） */
export interface RiskRankStatItem {
  name: string
  count?: string
}

/** 项目类型风险项排名 */
export interface ProjectTypeRiskRankStatItem {
  /** 项目类型名称 */
  name?: string
  /** 风险项数量 */
  count?: string | number
  /** 兼容部分环境返回的驼峰项目类型名称 */
  proTypeName?: string
  /** 兼容部分环境返回的下划线项目类型名称 */
  pro_type_name?: string
  /** 兼容通用项目类型名称字段 */
  projectTypeName?: string
}

/** 最近审核业务 */
export interface RecentAuditItem {
  xmmc: string // 项目名称
  jhssnd: string // 计划实施年度
  xmbm: string // 项目编码
  audit_time: string // AI审核时间
  status: string //AI审核状态
  /** 项目 id，打开项目审核详情所需 */
  xm_id: string | number
  /** 审核任务 id，打开项目审核详情所需 */
  task_id: string | number
  /** 项目类型 */
  pro_type: string | number
}

export interface RiskRankStatParams {
  limit: string | number
}

export interface RecentAuditParams {
  limit: string | number
}

// 获取文档处理统计
export const getDocDealStat = (): Promise<Result & { data: DocDealStat }> => {
  return budget.post(`ai-audit-workbench/getDocDealStat`, {}, {}, false)
}

// 获取总览统计
export const getOverviewStat = (): Promise<Result & { data: OverviewStat }> => {
  return budget.post(`ai-audit-workbench/getOverviewStat`, {}, {}, false)
}

// 获取审核风险项分布统计（规则分类维度）
export const getRiskDistStatByRuleClassify = (): Promise<Result & { data: RiskDistStatItem[] }> => {
  return budget.post(`ai-audit-workbench/getRiskDistStatByRuleClassify`, {}, {}, false)
}

// 获取审核风险项分布统计（规则级别维度）
export const getRiskDistStatByRuleLevel = (): Promise<Result & { data: RiskDistStatItem[] }> => {
  return budget.post(`ai-audit-workbench/getRiskDistStatByRuleLevel`, {}, {}, false)
}

// 获取风险项排名统计（limit 默认 10）
export const getRiskRankStat = (params: RiskRankStatParams = { limit: 10 }): Promise<Result & { data: RiskRankStatItem[] }> => {
  const limit = params?.limit ?? 10
  return budget.post(`ai-audit-workbench/getRiskRankStat?limit=${limit}`, {}, {}, false)
}

// 获取规则库统计
export const getRuleStat = (): Promise<Result & { data: RuleStatItem[] }> => {
  return budget.post(`ai-audit-workbench/getRuleStat`, {}, {}, false)
}

// 获取最近审核业务（limit 默认 20）
export const listRecentAudit = (params: RecentAuditParams = { limit: 20 }): Promise<Result & { data: RecentAuditItem[] }> => {
  const limit = params?.limit ?? 20
  return budget.post(`ai-audit-workbench/listRecentAudit?limit=${limit}`, {}, {}, false)
}

// 获取风险项排名统计（项目类型维度）
export const getRiskRankStatByProType = (params: RiskRankStatParams = { limit: 20 }): Promise<Result & { data: ProjectTypeRiskRankStatItem[] }> => {
  const limit = params?.limit ?? 20
  return budget.post(`ai-audit-workbench/getRiskRankStatByProType?limit=${limit}`, {}, {}, false)
}
