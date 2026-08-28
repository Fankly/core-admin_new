import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export const getPageList = (bmId: string, nd: string): Promise<Result> => {
  return budget.get(
    '/zyhyslLimit/getList',
    {
      bmId: bmId,
      nd: nd
    },
    {},
    false
  )
}

// 保存/修改数据
export const saveData = (params: any[]): Promise<Result> => {
  return budget.post('/zyhyslLimit/saveOrUpdate', params, {}, false)
}
