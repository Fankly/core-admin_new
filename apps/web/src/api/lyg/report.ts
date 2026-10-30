import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface Params {
  [key: string]: any
}

// 物资计划信息查询-分页查询
export const wzjhxxPage = (params: Params): Promise<Result> => {
  return budget.post('wzjhxx/page', params)
}

// 物资计划信息查询-导出
export const wzjhxxExport = (params: Params): any => {
  return budget.exportFile('wzjhxx/export', params)
}

// 服务计划信息查询-分页查询
export const fwjhxxPage = (params: Params): Promise<Result> => {
  return budget.post('fwjhxx/page', params)
}

// 服务计划信息查询-导出
export const fwjhxxExport = (params: Params): any => {
  return budget.exportFile('fwjhxx/export', params)
}
