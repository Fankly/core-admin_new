import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface Params {
  [key: string]: any
}

/** 物料库表头列定义（后端返回） */
export interface MaterialLibraryColumn {
  title: string // 列标题
  field: string // 字段名
  width?: number | string // 列宽
  visible?: boolean // 是否显示
  edit?: boolean // 是否可编辑
  children?: MaterialLibraryColumn[] // 子列
}

/** 物料库标签页（公共代码返回） */
export interface MaterialLibraryTab {
  code: string
  name: string
}

/** 物料库分页查询入参 */
export interface MaterialLibrarySearchParams {
  bmId: string // 部门id
  dwId: string // 单位id
  ejdwList?: string[] // 二级单位列表
  proTypeList?: string[] // 项目类型列表
  roleCode: string // 角色code
  sjly: string // 标签页标识（区分多个标签页数据来源）
  userId: string // 用户id
  wlbmList?: string[] // 物料编码列表
  wlmc?: string // 物料名称
  xmbmList?: string[] // 项目编码列表
  xmmc?: string // 项目名称
  yjdw?: string // 一级单位
  page: number | string // 当前页码
  size: number | string // 每页条数
}

/** 物料库分页查询结果 */
export interface MaterialLibraryListResult {
  records: Record<string, any>[]
  total: number
  current?: number
  size?: number
}

// 获取物料库表头（按标签页 code 区分，未区分时后端返回统一表头）
export const getMaterialLibraryColumns = (params: { sjly?: string } = {}): Promise<Result & { data: MaterialLibraryColumn[] }> => {
  const query = params.sjly ? `?sjly=${encodeURIComponent(params.sjly)}` : ''
  return budget.post(`ai/material-library/getDynamicColumn${query}`, {}, {}, false)
}

// 分页查询物料库列表
export const getMaterialLibraryPage = (params: MaterialLibrarySearchParams): Promise<Result & { data: MaterialLibraryListResult }> => {
  return budget.post('ai/material-library/getTableData', params, {}, false)
}

// 导出物料库列表（按当前查询条件导出）
export const exportMaterialLibrary = (params: MaterialLibrarySearchParams): Promise<Result> => {
  return budget.exportFile('ai/material-library/export', params, {}, false)
}
