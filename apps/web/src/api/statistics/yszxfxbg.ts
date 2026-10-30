import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

interface Params {
  [key: string]: any
}

// 拼接 get 请求参数，过滤未填写的查询条件
const buildQuery = (params: Params = {}): string => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return query ? `?${query}` : ''
}

// 分析报告（普通）：busiType、endDate
export const getFxbg = (params: Params): Promise<Result> => {
  return baseService.get(`yszxfxbg/getFxbg${buildQuery(params)}`)
}

// 分析报告（预安排）：busiType、saveDate、ysnd
export const getYapFxbg = (params: Params): Promise<Result> => {
  return baseService.get(`yszxfxbg/getYapFxbg${buildQuery(params)}`)
}
