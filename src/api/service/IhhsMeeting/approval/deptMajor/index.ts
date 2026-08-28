import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface SaveData {
  bmId: string
  codes: string[]
}

//根据部门id获取评审专业
export const getMajorDataList = (bmId: string): Promise<Result> => {
  return budget.get(
    '/zybmLinkPszy/list',
    {
      bmId: bmId
    },
    {},
    false
  )
}

// 保存/修改数据
export const saveData = (params: SaveData): Promise<Result> => {
  return budget.post('/zybmLinkPszy/save', params, {}, false)
}
