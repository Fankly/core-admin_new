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

//适用审核要点 查询
export const aiAuditRuleKeysGet = (
  params: AuditRuleParams
): Promise<Result & { data: { current: string; size: string; total: string; records: AuditRuleRow[]; pages: string | number } }> => {
  return budget.post('ai-audit-yssx-range/getPage', params, {}, false)
}

//适用审核要点 编辑/批量编辑
export const aiAuditRuleKeysEdit = (
  params: AuditRuleParams
): Promise<Result & { data: { current: string; size: string; total: string; records: AuditRuleRow[]; pages: string | number } }> => {
  return budget.post('ai-audit-yssx-range/edit', params, {}, false)
}

// 适用审核要点 删除
export const aiAuditRuleKeysRemove = (
  params: AuditRuleParams
): Promise<Result & { data: { current: string; size: string; total: string; records: AuditRuleRow[]; pages: string | number } }> => {
  return budget.post('ai-audit-yssx-range/remove', params, {}, false)
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

/* ------------------------------------------------------------------ *
 * 项目类型文档处理配置（docs/1102/文件处理配置.md）
 * 与 T_XM_PROTYPE 一对一，id 即项目类型 ID；大整数不要 Number()。
 * 列表使用 queryPage（INNER JOIN，仅已配置）；getPage 为旧版兼容接口。
 * ------------------------------------------------------------------ */
export interface DocumentConfigParams {
  page?: string | number
  limit?: string | number
  /** 树选中的项目类型 ID（含子类型） */
  proType?: string | number
  proTypeName?: string
  onlyConfigured?: string
  aiPdfSyncTranscode?: string
  aiDocSyncTranscode?: string
  aiDocHeadingFixEnable?: string
  [key: string]: any
}

export interface DocumentConfigRow {
  /** 项目类型 ID，也是配置主键 */
  id: string | number
  /** 项目类型名称（queryPage 返回；getPage 为 null） */
  proTypeName: string
  /** 是否已配置：queryPage 恒为 1；getPage 为 null */
  configured: string
  zy?: string | null
  maxDocFileSize?: number | null
  maxPdfFileSize?: number | null
  aiPdfSyncTranscode?: string | null
  aiPdfSyncTranscodeName?: string | null
  aiDocSyncTranscode?: string | null
  aiDocSyncTranscodeName?: string | null
  aiDocHeadingFixEnable?: string | null
  aiDocHeadingFixEnableName?: string | null
  aiStartJysChunkExtract?: string | null
  aiStartKybgChunkExtract?: string | null
  /** 估算书切片提取：queryPage 返回；getPage 为 null */
  aiStartGssChunkExtract?: string | null
}

export interface DocumentConfigEntity {
  id: string | number
  zy?: string | null
  maxDocFileSize?: number | null
  maxPdfFileSize?: number | null
  aiPdfSyncTranscode?: string | null
  aiDocSyncTranscode?: string | null
  aiDocHeadingFixEnable?: string | null
  aiStartJysChunkExtract?: string | null
  aiStartKybgChunkExtract?: string | null
  aiStartGssChunkExtract?: string | null
}

// 项目类型文档处理配置-旧版分页查询（单表，仅兼容保留）
export const documentConfigGetPage = (
  params: DocumentConfigParams
): Promise<
  Result & {
    data: { current: string | number; size: string | number; total: string | number; records: DocumentConfigRow[]; pages: string | number }
  }
> => {
  return budget.post('xm-protype-config/getPage', params, {}, false)
}

// 项目类型文档处理配置-新版分页查询（INNER JOIN，仅已配置；返回 proTypeName / 估算书切片）
export const documentConfigQueryPage = (
  params: DocumentConfigParams
): Promise<
  Result & {
    data: { current: string | number; size: string | number; total: string | number; records: DocumentConfigRow[]; pages: string | number }
  }
> => {
  return budget.post('xm-protype-config/queryPage', params, {}, false)
}

// 项目类型文档处理配置-详情（请求体为裸 JSON 数字：项目类型 ID）
export const documentConfigInfo = (id: string | number): Promise<Result & { data: DocumentConfigEntity }> => {
  // RequestData 类型声明是对象，但文档明确要求裸 ID，这里显式透传
  return budget.post('xm-protype-config/info', id as any)
}

// 项目类型文档处理配置-新增（id 必须是未配置过的项目类型 ID）
export const documentConfigSave = (params: DocumentConfigEntity): Promise<Result> => {
  return budget.post('xm-protype-config/save', params)
}

// 项目类型文档处理配置-修改
export const documentConfigUpdate = (params: DocumentConfigEntity): Promise<Result> => {
  return budget.post('xm-protype-config/update', params)
}

// 项目类型文档处理配置-删除（请求体是项目类型 ID 数组）
export const documentConfigRemove = (idList: Array<string | number>): Promise<Result> => {
  // 与其它批量删除接口一致，请求体直接是数组
  return budget.post('xm-protype-config/remove', idList as any)
}
