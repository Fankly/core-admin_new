import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

/** 外包适配清单-分页查询参数 */
export interface OutsourceAdaptListParams {
  bizMajorCat: string // 业务大类
  bizSubCat: string // 业务小类
  bmId: string // 部门ID
  dwId: string // 单位ID
  limit: string // 每页条数
  page: string // 当前页码
  roleId: string // 角色ID
  roleCode: string // 角色编码
  userId: string // 用户ID
}

/** 外包适配清单-列表行 */
export interface OutsourceAdaptListRow {
  allowedAuxBiz: string // 整项业务中外包的辅助性业务
  bizMajorCat: string // 业务大类
  bizMajorCatName: string // 业务大类名称
  bizSubCat: string // 业务小类
  bizSubCatName: string // 业务小类名称
  id: string // 主键ID
  prohibitedBiz: string // 禁止外包的整项业务
  seqNo: string // 序号
}

/** 外包适配清单-分页结果 */
export interface OutsourceAdaptListPageResult {
  current: string
  size: string
  total: string
  records: OutsourceAdaptListRow[]
  pages: string | number
}

/** 外包适配清单-编辑参数 */
export interface OutsourceAdaptListEditParams {
  allowedAuxBiz: string // 整项业务中外包的辅助性业务
  bizMajorCat: string // 业务大类
  bizSubCat: string // 业务小类
  prohibitedBiz: string // 禁止外包的整项业务
  seqNo: string // 序号
  id?: string // 主键ID（编辑时必传）
}

// 外包适配清单-分页查询（列表翻页关闭全屏 loading，由页面内 loading 承接）
export const getOutsourceAdaptListPage = (params: OutsourceAdaptListParams): Promise<Result & { data: OutsourceAdaptListPageResult }> => {
  return budget.post('outsource-rule-kb/getPage', params, {}, false)
}

// 外包适配清单-编辑/保存
export const editOutsourceAdaptList = (params: OutsourceAdaptListEditParams): Promise<Result> => {
  return budget.post('outsource-rule-kb/save', params)
}

// 外包适配清单-删除（按项目类型列表）
export const removeOutsourceAdaptList = (idList: string[]): Promise<Result> => {
  return budget.post('outsource-rule-kb/remove', idList)
}

interface ImportOutsourceAdaptParams {
  excelFormData: FormData
}

// 导入
export const importOutsourceAdaptList = (params: ImportOutsourceAdaptParams) => {
  return budget.post(`outsource-rule-kb/importData`, params.excelFormData, {}, false)
}

// 导入模板
export const importTemplateOutsourceAdaptList = () => {
  return budget.exportFile('outsource-rule-kb/getImportTemplate', {}, {}, false)
}

// 导出
export const exportOutsourceAdaptList = (params: OutsourceAdaptListParams) => {
  return budget.exportFile('outsource-rule-kb/exportData', params, {}, false)
}
