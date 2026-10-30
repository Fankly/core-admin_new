import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface Params {
  [key: string]: any
}

// 标准成本测算完成值-分页查询
export const bzcbcxWczGetPage = (params: Params): Promise<Result> => {
  return budget.get('bzcbcxWcz/getPage', params)
}

// 标准成本测算完成值-导出
export const bzcbcxWczExportExcel = (params: any): any => {
  return budget.exportFile('bzcbcxWcz/exportExcel', params)
}

// 标准成本差异项目完成值-分页查询
export const bzcbcxXmwczGetPage = (params: Params): Promise<Result> => {
  return budget.get('bzcbcxXmwcz/getPage', params)
}

// 标准成本差异项目完成值-导出
export const bzcbcxXmwczExportExcel = (params: any): any => {
  return budget.exportFile('bzcbcxXmwcz/exportExcel', params)
}
