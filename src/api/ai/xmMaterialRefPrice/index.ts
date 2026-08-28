import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

/** 项目物资参考价格库-分页查询参数 */
export interface XmMaterialRefPriceParams {
  materialMajor?: string // 物料大类（精确匹配）
  materialMiddle?: string // 物料中类（精确匹配）
  materialMinor?: string // 物料小类（精确匹配）
  materialCode?: string // 物料编码（精确匹配）
  materialDesc?: string // 物料描述（模糊匹配）
  page: string // 当前页码
  limit: string // 每页条数
  // 角色上下文（后端 mapper 当前未使用，但 DTO 继承 PageDto 保留）
  bmId?: string
  dwId?: string
  roleId?: string
  roleCode?: string
  userId?: string
}

/** 项目物资参考价格库-列表行 */
export interface XmMaterialRefPriceRow {
  id?: string // 主键ID（后端 VO 补齐后可用）
  materialMajor: string // 物料大类
  materialMiddle: string // 物料中类
  materialMinor: string // 物料小类
  materialCode: string // 物料编码
  materialDesc: string // 物料描述
  unit: string // 单位
  priceExTax: string // 除税价格
  priceInTax: string // 含税价格
  createTime: string // 创建时间
}

/** 项目物资参考价格库-分页结果 */
export interface XmMaterialRefPricePageResult {
  current: string
  size: string
  total: string
  records: XmMaterialRefPriceRow[]
  pages: string | number
}

/** 项目物资参考价格库-编辑参数 */
export interface XmMaterialRefPriceEditParams {
  id?: string // 主键ID（编辑时必传）
  materialMajor: string // 物料大类
  materialMiddle: string // 物料中类
  materialMinor: string // 物料小类
  materialCode: string // 物料编码（必填，唯一）
  materialDesc: string // 物料描述
  unit: string // 单位
  priceExTax: string // 除税价格
  priceInTax: string // 含税价格
}

interface ImportXmMaterialRefPriceParams {
  excelFormData: FormData
}

// 项目物资参考价格库-分页查询（列表翻页关闭全屏 loading，由页面内 loading 承接）
export const getXmMaterialRefPricePage = (params: XmMaterialRefPriceParams): Promise<Result & { data: XmMaterialRefPricePageResult }> => {
  return budget.post('xm-material-ref-price/getPage', params, {}, false)
}

// 项目物资参考价格库-新增或修改（物料编码重复时后端返回错误）
export const saveOrUpdateXmMaterialRefPrice = (params: XmMaterialRefPriceEditParams): Promise<Result> => {
  return budget.post('xm-material-ref-price/saveOrUpdate', params)
}

// 项目物资参考价格库-批量删除
export const deleteXmMaterialRefPrice = (ids: string[]): Promise<Result> => {
  return budget.post('xm-material-ref-price/delete', ids)
}

// 项目物资参考价格库-导入
export const importXmMaterialRefPrice = (params: ImportXmMaterialRefPriceParams) => {
  return budget.post('xm-material-ref-price/importData', params.excelFormData, {}, false)
}

// 项目物资参考价格库-导出
export const exportXmMaterialRefPrice = (params: XmMaterialRefPriceParams) => {
  return budget.exportFile('xm-material-ref-price/exportData', params, {}, false)
}
