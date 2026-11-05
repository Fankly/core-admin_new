import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export interface Params {
  [key: string]: any
}

// 智能审核规则-提示词保存
export const editPrompt = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-category-rule-manage/editPrompt', params)
}

// 智能审核规则-查询
export const getRulePage = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-category-rule-manage/getRulePage', params, {}, false)
}

// 智能审核规则监控-查询
export const getRuleMonitoringPage = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-category-rule-monitoring/getRulePage', params, {}, false)
}

// 智能审核规则-新增
export const saveRule = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-category-rule-manage/saveRule', params, {}, false)
}

// 智能审核规则-删除
export const removeRule = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-category-rule-manage/removeRule', params, {}, false)
}

// 智能审核规则-切换状态
export const changeStatus = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-category-rule-manage/changeRuleStatus', params)
}

// 审核要点-查询
export const getRulePointPage = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/getRulePage', params, {}, false)
}

// 审核要点-修改状态
export const changeRuleStatus = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/changeRuleStatus', params, {}, false)
}

// 审核要点-删除
export const removeRulePoint = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/removeRule', params, {}, false)
}

// 审核要点-保存提示词
export const savePrompt = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/savePrompt', params, {}, false)
}

// 审核要点-查询提示词
export const getPrompt = (params: Params): Promise<Result> => {
  return budget.post(`ai-audit-rule-manage/getPrompt?ruleId=${params}`, {})
}

// 智能审核规则管理-关联项目类型
export const linkProTypeByRuleIds = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/linkProTypeByRuleIds', params)
}
interface ImportOutsourceAdaptParams {
  excelFormData: FormData
}

// 审核要点-导入导出
export const importPoint = (params: ImportOutsourceAdaptParams): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/importExcel', params.excelFormData, {}, false)
}

export const exportPoint = (params: Params) => {
  return budget.exportFile('ai-audit-rule-manage/exportExcel', params)
}

// 审核规则-导入导出
export const importRule = (params: ImportOutsourceAdaptParams): Promise<Result> => {
  return budget.post('ai-audit-category-rule-manage/importExcel', params.excelFormData, {}, false)
}

export const exportRule = (params: Params): Promise<Result> => {
  return budget.exportFile('ai-audit-category-rule-manage/exportExcel', params)
}

// 智能审核规则监控-导出
export const exportRuleMonitoring = (params: Params): Promise<Result> => {
  return budget.exportFile('ai-audit-category-rule-monitoring/exportExcel', params)
}

/* ---------------- 主列表后三列列值的穿透明细（接口文档 十一 / 十二）---------------- */

/**
 * 审核规则关联审核要点分页（文档 十一）。POST，分页。
 * 用于主列表「已分配审核要点数」列的穿透。
 *
 * ⚠️ 文档返参表把 auditPointName 列了两遍（一条注释写「要点编码」），是笔误；
 *    示例里编码字段实际叫 auditPointCode，且文档十二的返参表也写作 auditPointCode，按此为准。
 */
export interface RuleByCategoryRuleRow {
  /** 规则id */
  categoryRuleId: string
  /** 要点id */
  ruleId: string
  /** 要点编码 */
  auditPointCode: string
  /** 要点名称 */
  auditPointName: string
  /** 要点状态 code（1 启用 / 0 停用） */
  ruleStatus: string
  /** 要点状态名称 */
  ruleStatusName: string
  /**
   * 已分配事项数（文档十一返参表的第 13 项，注释「预算事项数量」）。
   * 接口不下发时该列显示 '-'。
   */
  yssxCnt?: string | number
}

export interface RuleByCategoryRuleParams {
  categoryRuleId: string
  page: number
  limit: number
}

export const getRuleByCategoryRulePage = (
  params: RuleByCategoryRuleParams
): Promise<Result & { data: { records: RuleByCategoryRuleRow[]; total: string | number } }> => {
  return budget.post('ai-audit-category-rule-manage/getRuleByCategoryRulePage', params, {}, false)
}

/**
 * 审核规则关联预算事项分页（文档 十二）。POST，分页。
 * 用于主列表「已分配事项数」列的穿透。
 *
 * 注意 remark：文档此处注释是「预算事项名称」（示例里为 null），
 * 名字容易误读成备注，这里按文档语义当作预算事项名称用。
 */
export interface XmyssxByCategoryRuleRow {
  /** 要点编码 */
  auditPointCode: string
  /** 要点名称 */
  auditPointName: string
  /** 要点状态 code（1 启用 / 0 停用） */
  ruleStatus: string
  /** 要点状态名称 */
  ruleStatusName: string
  /** 预算事项编码 */
  zyssxbm: string
  /** 预算事项名称 */
  remark: string | null
}

export interface XmyssxByCategoryRuleParams {
  categoryRuleId: string
  page: number
  limit: number
}

export const getXmyssxByCategoryRulePage = (
  params: XmyssxByCategoryRuleParams
): Promise<Result & { data: { records: XmyssxByCategoryRuleRow[]; total: string | number } }> => {
  return budget.post('ai-audit-category-rule-manage/getXmyssxByCategoryRulePage', params, {}, false)
}

/**
 * 已分配审核要点数 - 已分配事项数二次弹层（文档 十三）。POST，分页。
 * 用于审核要点清单弹层里「已分配事项数」列的二级穿透。
 *
 * 与十二的区别只在入参维度：十二按**规则**（categoryRuleId=规则id）查全量，
 * 十三按**要点**（ruleId=要点id）查该要点下的事项；返参字段完全一致，所以复用同一个行类型。
 */
export interface XmyssxByRuleParams {
  /** 要点id（十一返参里的 ruleId） */
  ruleId: string
  page: number
  limit: number
}

export const getXmyssxByRulePage = (
  params: XmyssxByRuleParams
): Promise<Result & { data: { records: XmyssxByCategoryRuleRow[]; total: string | number } }> => {
  return budget.post('ai-audit-category-rule-manage/getXmyssxByRulePage', params, {}, false)
}
