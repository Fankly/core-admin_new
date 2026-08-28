import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export interface Params {
  [key: string]: any
}

// 智能审核启用范围-分页查询（列表翻页关闭全屏 loading，由页面内 loading 承接）
export const aiAuditGetPage = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-inuse-range/getPage', params, {}, false)
}

// 智能审核启用范围-保存
export const aiAuditEdit = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-inuse-range/edit', params)
}

// 智能审核启用范围-删除
export const aiAuditRemove = (params: Params): Promise<Result> => {
  return budget.post('ai-audit-inuse-range/remove', params)
}

export interface KnowledgeEditParams {
  kbIdList: string[]
  proTypeList: string[]
}

// 智能审核知识库适用范围-编辑
export const aiAuditKnowledgeEdit = (params: KnowledgeEditParams): Promise<Result> => {
  return budget.post('ai-audit-kb-range/edit', params)
}

export interface KnowledgeParams {
  bmId?: string
  dwId?: string
  limit?: string | number
  page?: string | number
  proType?: string
  roleCode?: string
  roleId?: string
  userId?: string
  [key: string]: any
}

export interface KnowledgeRow {
  kbBizSubCatList: string // 知识库业务小类清单
  kbBizSubCatNameList: string // 知识库业务小类名称清单
  kbIdList: string // 知识库ID清单
  proType: string // proType
  proTypeName: string // 项目类型名称
}

// 智能审核知识库适用范围-查询
export const aiAuditKnowledgeGet = (
  params: KnowledgeParams
): Promise<Result & { data: { current: string; size: string; total: string; records: KnowledgeRow[]; pages: string | number } }> => {
  return budget.post('ai-audit-kb-range/getPage', params, {}, false)
}

// 智能审核知识库适用范围-删除
export const aiAuditKnowledgeRemove = (proTypeList: string[]): Promise<Result> => {
  return budget.post('ai-audit-kb-range/remove', proTypeList)
}

export interface AuditRuleEditParams {
  ruleIdList: string[]
  proTypeList: string[]
}

// 智能审核规则适用范围-编辑
export const aiAuditRuleEdit = (params: AuditRuleEditParams): Promise<Result> => {
  return budget.post('ai-audit-rules-range/edit', params)
}

export interface AuditRuleParams {
  bmId?: string
  dwId?: string
  limit?: string | number
  page?: string | number
  proType?: string
  roleCode?: string
  roleId?: string
  userId?: string
  [key: string]: any
}

export interface AuditRuleRow {
  proType: string // 项目类型
  proTypeName: string // 项目类型名称
  ruleIdList: string // 规则ID清单
  ruleNameList: string // 规则名称清单
}

// 智能审核规则适用范围-查询
export const aiAuditRuleGet = (
  params: AuditRuleParams
): Promise<Result & { data: { current: string; size: string; total: string; records: AuditRuleRow[]; pages: string | number } }> => {
  return budget.post('ai-audit-rules-range/getPage', params, {}, false)
}

// 智能审核规则适用范围-删除
export const aiAuditRuleRemove = (proTypeList: string[]): Promise<Result> => {
  return budget.post('ai-audit-rules-range/remove', proTypeList)
}

export interface SchemaEditParams {
  schemaIdList: string[]
  proTypeList: string[]
}

// schema关联-保存
export const schemaEdit = (params: SchemaEditParams) => {
  return budget.post('xm-protype-extract-schema/edit', params)
}

export interface SchemaParams {
  bmId?: string
  dwId?: string
  limit?: string | number
  page?: string | number
  proType?: string
  roleCode?: string
  roleId?: string
  userId?: string
  [key: string]: any
}

export interface SchemaRow {
  proType: string // 项目类型
  proTypeName: string // 项目类型名称
  schemaIdList: string
  schemaNameList: string
}

// schema关联-分页查询
export const schemaGetPage = (
  params: SchemaParams
): Promise<Result & { data: { current: string; size: string; total: string; records: SchemaRow[]; pages: string | number } }> => {
  return budget.post('xm-protype-extract-schema/getPage', params, {}, false)
}

// schema关联-删除
export const schemaRemove = (proTypeList: string[]): Promise<Result> => {
  return budget.post('xm-protype-extract-schema/remove', proTypeList)
}

export interface SimilarityParams {
  limit?: string | number
  page?: string | number
  proType?: string
  [key: string]: any
}

export interface SimilarityRow {
  proType: string
  proTypeName: string
  similarityJson: string
}

// 智能审核相似性要素-分页查询
export const aiAuditSimilarityGet = (
  params: SimilarityParams
): Promise<Result & { data: { current: string; size: string; total: string; records: SimilarityRow[]; pages: string | number } }> => {
  return budget.post('ai-audit-similarity/getPage', params, {}, false)
}

export interface SimilarityEditParams {
  proTypeList: string[]
  similarityJson: string
}

// 智能审核相似性要素-编辑
export const aiAuditSimilarityEdit = (params: SimilarityEditParams): Promise<Result> => {
  return budget.post('ai-audit-similarity/edit', params)
}
