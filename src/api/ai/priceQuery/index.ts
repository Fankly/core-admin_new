import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.lygBudget

interface Params {
  [key: string]: any
}
// 估算书-分页查询估算书甲供数据
export const getGssJgDataWithPage = (params: Params): Promise<Result> => {
  return budget.post('gss/getGssMatWithPage', params)
}
// 估算书-导出估算书甲供数据
export const exportGssJgData = (params: Params): Promise<Result> => {
  return budget.exportFile(`gss/exportGssMat`, params)
}
