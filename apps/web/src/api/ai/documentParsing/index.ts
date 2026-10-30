import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

/** 文档解析页签：jys 建议书 / ky 可研报告 / gss 估算书 */
export type ParseDocType = 'jys' | 'ky' | 'gss'

/** 三个页签公用的查询条件（见 docs/文档数据解析.md 的 DocParseQueryDTO） */
export interface DocParseQuery {
  xmbm?: string // 项目编码（精确匹配）
  xmmc?: string // 项目名称（模糊匹配）
  proTypes?: string[] // 项目类型 ID 集合（IN 查询）
  jhssnd?: string // 计划实施年度（精确匹配）
  yjdw?: string // 一级单位 ID（精确匹配）
  zt?: string[] // 项目状态编码集合（IN 查询）
  attachName?: string // 附件名称（模糊匹配）
  page?: number
  limit?: number
}

/** 三类解析列表的公共字段 */
export interface ParseRowBase {
  attachId: string // 附件ID（修改入口）
  proId: string // 项目ID
  fjId: string // 附件类型编码（FJ_TYPE）
  proType: string // 项目类型ID
  yjdw: string // 一级单位ID
  flowStatus: string // 项目状态编码（ZLYS_XMZT）
  attachName: string // 附件名称
  fjName: string // 附件类型名称
  xmbm: string // 项目编码
  xmmc: string // 项目名称
  proTypeName: string // 项目类型名称
  jhssnd: string // 计划实施年度
  yjdwName: string // 一级单位名称
  amount: number | string // 不含税总预算（万元，项目级）
  allInvestTax: number | string // 含税总预算（万元，项目级）
  flowStatusName: string // 项目状态名称
}

/**
 * 解析列表行：三个页签的专属列放在同一个类型里（表格按页签取其中 3 个字段）。
 * JYS: jysProjectName / jysAmount / jysAllInvestTax
 * KY:  kyProjectName / kyAmount / kyAllInvestTax
 * GSS: gssProjectName / gssTotalInvestTaxEx / gssTotalInvestTaxIn
 */
export interface ParseRow extends ParseRowBase {
  infoId?: string // 主键（T_XM_JYS_INFO.ID / T_XM_KY_INFO.ID；估算书无此字段）
  jysProjectName?: string
  jysAmount?: number | string
  jysAllInvestTax?: number | string
  kyProjectName?: string
  kyAmount?: number | string
  kyAllInvestTax?: number | string
  gssProjectName?: string
  gssTotalInvestTaxEx?: number | string
  gssTotalInvestTaxIn?: number | string
}

// 建议书-分页查询
export const getJysParsePage = (params: DocParseQuery): Promise<Result> => {
  return budget.post('doc-parse-info/jys/page', params, {}, false)
}

// 建议书-导出（忽略 page/limit，后端按条件导出全量）
export const exportJysParse = (params: DocParseQuery): Promise<Result> => {
  return budget.exportFile('doc-parse-info/jys/export', params, {}, false)
}

// 可研-分页查询
export const getKyParsePage = (params: DocParseQuery): Promise<Result> => {
  return budget.post('doc-parse-info/ky/page', params, {}, false)
}

// 可研-导出
export const exportKyParse = (params: DocParseQuery): Promise<Result> => {
  return budget.exportFile('doc-parse-info/ky/export', params, {}, false)
}

// 估算书-分页查询
export const getGssParsePage = (params: DocParseQuery): Promise<Result> => {
  return budget.post('doc-parse-info/gss/page', params, {}, false)
}

// 估算书-导出
export const exportGssParse = (params: DocParseQuery): Promise<Result> => {
  return budget.exportFile('doc-parse-info/gss/export', params, {}, false)
}
