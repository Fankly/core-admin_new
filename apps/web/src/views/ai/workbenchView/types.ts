import type { ReviewTable } from '../smartTaskAudit/components/auditDetailHelpers'
import type { RuleReviewPoint } from '@/api/ai/smartTaskAudit'

export type RuleResult = 'passed' | 'warning' | 'failed' | 'reject' | ''

export interface WorkbenchFilterOption {
  label: string
  value: string
  /** 该页签的条数；由宿主算好传入（页签计数要跟随「不看通过规则」开关联动），不传则回落到组件内按规则状态统计 */
  count?: number
}

/** 规则分类 取公共代码 AI_AUDIT_RULE_CLASSIFY_COM */
export interface WorkbenchClassifyOption {
  code: string
  name: string
}

/** 每档风险分级的汇总：发现数 + 接口实际下发的等级名 */
export interface RiskLevelCount {
  count: number
  /** 接口 ruleLevelFindNumList 里的 ruleLevelName；为空时回落到码值映射名（问题/预警/异常） */
  name?: string
}

export interface WorkbenchAuditSummary {
  conclusion: string
  statusText: string
  statusTone: string
  counts: Record<'1' | '2' | '3', RiskLevelCount>
  /** 结论获取失败的原因；非空时结论区改为错误态，不把报错当结论渲染 */
  errorText?: string
}

export interface ReviewRule {
  id: string
  detailId?: string
  /** 规则 ID；单规则详情入口用它跨接口（listRuleReview / listCategoryRuleReview）匹配同一条规则 */
  ruleId?: string
  code: string
  ruleLevel: string
  /** 规则等级名称（问题 / 预警 / 异常）—— 页面按 ruleLevel 码值归一后写入，不是直接抄接口的 ruleLevelName */
  ruleLevelName?: string
  /** 规则分类编码 取公共代码 AI_AUDIT_RULE_CLASSIFY_COM */
  ruleClassify?: string
  /** 规则分类名称（listCategoryRuleReview 直接下发，用作分组标题） */
  ruleClassifyName?: string
  /** 分类规则主键 ID，用于 listRuleReviewNew 拉取审核要点 */
  categoryRuleId?: string
  category: string
  name: string
  result: RuleResult
  reviewOpinion?: string
  /** 规则列表接口返回的状态名称，空值不显示状态徽标 */
  reviewOpinionName?: string
  /** 人工审核意见混合状态（listCategoryRuleReview）：1 通过 / 2 待复核 / 4 复核不通过 / 5 复核通过 */
  mixReviewStatus?: string
  /** 人工审核意见名称（接口下发，空值不展示） */
  mixReviewStatusName?: string
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
