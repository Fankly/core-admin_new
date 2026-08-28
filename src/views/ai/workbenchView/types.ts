import type { ReviewTable } from '../smartTaskAudit/components/auditDetailHelpers'
import type { RuleReviewPoint } from '@/api/ai/smartTaskAudit'

export type RuleResult = 'passed' | 'warning' | 'failed' | ''

export interface WorkbenchFilterOption {
  label: string
  value: string
}

/** 规则分类 取公共代码 AI_AUDIT_RULE_CLASSIFY_COM */
export interface WorkbenchClassifyOption {
  code: string
  name: string
}

export interface WorkbenchAuditSummary {
  conclusion: string
  statusText: string
  statusTone: string
  counts: Record<'1' | '2' | '3', number>
  /** 结论获取失败的原因；非空时结论区改为错误态，不把报错当结论渲染 */
  errorText?: string
}

export interface ReviewRule {
  id: string
  detailId?: string
  code: string
  ruleLevel: string
  /** 规则分类编码 取公共代码 AI_AUDIT_RULE_CLASSIFY_COM */
  ruleClassify?: string
  category: string
  name: string
  result: RuleResult
  level: string
  ruleDesc: string
  description: string
  ruleviewConclude?: string
  auditResult: string
  analysisProcess: string
  reviewMessage?: string
  reviewTable?: ReviewTable[]
  points?: RuleReviewPoint[]
  extracted: string
  requirement: string
  conclusion: string
  document: string
  page: number
  section: string
  before: string
  source: string
  after: string
}

export interface WorkbenchProject {
  id?: number
  taskId?: string
  code?: string
  xmbm?: string
  archive?: string
  name?: string
  xmmc?: string
  unit?: string
  yjdw?: string
  ejdw?: string
  voltage?: string
  type?: string
  proTypeName?: string
  investment?: string
  version?: string
  status?: string
  statusName?: string
  priorityName?: string
  docPreStatusName?: string
  progress: number
  riskCount: number
  conclusion?: string
  score?: number
  summary?: string
  document?: string
  reviewTime?: string
  createTime?: string
  startTime?: string
  finishTime?: string
  ruleName?: string
  jhssnd?: string
  yssxName?: string
  allInvestTax?: string | number
  amount?: string | number
  rules?: ReviewRule[]
  [key: string]: unknown
}
