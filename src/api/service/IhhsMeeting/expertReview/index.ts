import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface expertInfo {
  account: string
}

interface meetingPage {
  account: string
  page: string
  limit: string
}

// 根据账号登录名获取专家列表数据
export const getListPageDataByAccount = (params: expertInfo): Promise<Result> => {
  return budget.post(`xmExpert/getListPageDataByAccount`, params, {}, false)
}

// 获取评审概览信息
export const getHandlePsgl = (params: expertInfo): Promise<Result> => {
  return budget.post(`psgzt/getPsgl?account=${params.account}`, {}, {}, false)
}

// 获取评审会议信息
export const getMeetingPage = (params: meetingPage): Promise<Result> => {
  return budget.post(`psgzt/getMeetingPage`, params, {}, false)
}
