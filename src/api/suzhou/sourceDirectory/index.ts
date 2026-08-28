import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export interface Params {
  [key: string]: any
}

// 物料判定同源目录-分页查询
export const materialSourceGetPage = (params: Params): Promise<Result> => {
  return budget.post('material-judgment-source-dir/page', params)
}

// 物料判定同源目录-导出
export const materialSourceExportData = (params: Params): Promise<Result> => {
  return budget.exportFile('material-judgment-source-dir/exportData', params)
}
