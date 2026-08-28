import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'
import { SaveData, SearchData } from '@/api/service/IhhsMeeting/approval/batch/types'

export const budget = ServiceApi.budget

// 获取评审批次管理页面数据
export const getPageData = (searchData: SearchData): Promise<Result> => {
  return budget.post('/lhhs/pspc/getPage', searchData, {}, false)
}

//获取评审编号
export const getPspcCode = (): Promise<Result> => {
  return budget.get('/lhhs/pspc/getPspcCode', {}, {}, false)
}

// 保存/修改数据
export const saveOrUpdateData = (params: SaveData): Promise<Result> => {
  return budget.post('/lhhs/pspc/saveOrUpdate', params, {}, false)
}

// 删除
export const deleteData = (ids: string[]): Promise<Result> => {
  return budget.post(
    '/lhhs/pspc/delete',
    {
      ids: ids
    },
    {},
    true
  )
}

// 激活
export const activeData = (ids: string[]): Promise<Result> => {
  return budget.post(
    '/lhhs/pspc/active',
    {
      ids: ids
    },
    {},
    true
  )
}

// 取消激活
export const cancleData = (ids: string[]): Promise<Result> => {
  return budget.post(
    '/lhhs/pspc/cancleActive',
    {
      ids: ids
    },
    {},
    true
  )
}

// 获取完整批次列表
export const getAllBatchList = (params: { dwId?: string; bmId?: string; nd?: string }): Promise<Result> => {
  return budget.post('lhhs/pspc/getList', params, {}, false)
}
