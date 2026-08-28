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

export const getZlxqFlag = (xmIds: string, dwId: string): Promise<Result> => {
  return baseService.get(`/workflow/zlxqsh/getZlxqFlag?xmIds=${xmIds}&dwId=${dwId}`)
}

export const updateSgbm = (params: Params): Promise<Result> => {
  return baseService.post(`/zlxqszy/updateSgbm`, params)
}

// 列表
export const getPage = (params: Params): Promise<Result> => {
  return baseService.post(`/zlxqszy/getPage`, params)
}

// 导出数据
export const exportData = (params: Params): Promise<Result> => {
  return baseService.export(`/zlxqszy/export`, params)
}

// 退回
export const fallback = (params: Params): Promise<Result> => {
  return baseService.post(`/zlxqszy/fallback`, params)
}

// 提交
export const zlxqzyshSubmitWf = (params: Params): Promise<Result> => {
  return baseService.post(`/workflow/zlxqzysh/submitWf`, params)
}

export const zlxqzswhSubmitWf = (params: Params): Promise<Result> => {
  return baseService.post(`/workflow/zlxqcwsh/submitWf`, params)
}

// 跳过工作流
export const skipToScw = (ids: string[]) => {
  return baseService.post(`/zlxqszy/skipToScw`, {
    ids
  })
}