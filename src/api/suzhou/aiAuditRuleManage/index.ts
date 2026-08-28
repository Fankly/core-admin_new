import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export interface Params {
  [key: string]: any
}

// 智能审核规则管理-分页查询规则（弹窗/列表翻页频繁，关闭全屏 loading 避免遮罩闪烁）
export const rulManageGeGetRulePage = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/getRulePage', params, {}, false)
}

// 智能审核规则管理-保存规则
export const rulManageSaveRule = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/saveRule', params)
}

// 智能审核规则管理-编辑提示词
export const editPrompt = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/editPrompt', params)
}

// 智能审核规则管理-删除规则
export const rulManageRemoveRule = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/removeRule', params)
}

// 智能审核规则管理-查询已关联的项目类型清单
export const listLinkedProType = (params: Params): Promise<Result> => {
  return budget.post(`ai-audit-rule-manage/listLinkedProType?ruleId=${params.ruleId}`)
}

// 智能审核规则管理-关联项目类型
export const linkProType = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/linkProType', params)
}

// 智能审核规则管理-查询已关联的一级单位清单
export const listLinkedYjdw = (params: Params): Promise<Result> => {
  return budget.post(`ai-audit-rule-manage/listLinkedYjdw?ruleId=${params.ruleId}`)
}

// 智能审核规则管理-关联一级单位
export const linkYjdw = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rule-manage/linkYjdw', params)
}

// 智能审核规则明细管理-查询明细列表（参数 ruleId；关闭全屏 loading 避免遮罩闪烁）
export const listRuleDetail = (params: Params): Promise<Result> => {
  return budget.post(`ai-audit-rules-detail/listByRuleId?ruleId=${params.ruleId}`, params, {}, false)
}

// 智能审核规则明细管理-新增/编辑明细（参数含 ruleId；编辑带 detailId）
export const saveRuleDetail = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-rules-detail/saveOrUpdate', params)
}

// 智能审核规则明细管理-删除明细（参数 detailId[]）
export const removeRuleDetail = (params: any): Promise<Result> => {
  return budget.post('ai-audit-rules-detail/remove', params)
}
