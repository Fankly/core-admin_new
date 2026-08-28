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

//根据项目节点获取下面全部子节点信息
export const getChildLeafByParentId = (parentId: string, queryType: string): Promise<Result> => {
  return baseService.get(`/protypeConfig/getChildLeafByParentId?parentId=${parentId}&queryType=${queryType}`)
}
//
export const eidtBaseInfo = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeConfig/eidtBaseInfo`, params)
}
export const editZybm = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeConfig/editZybm`, params)
}

export const editWbs = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeConfig/editWbs`, params)
}

export const editSgk = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeConfig/editSgk`, params)
}

// 目标值总控节点配置
export const mbzConfig = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeConfig/editZkjd`, params)
}

// 目标值一致性配置
export const mbzYzxConfig = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeConfig/editYzx`, params)
}

export const exportData = (parentId: string, queryType: string): Promise<Result> => {
  return baseService.export(`/protypeConfig/export?parentId=${parentId}&queryType=${queryType}`)
}

// 获取日志信息
export const getEditLog = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeConfig/getEditLog?id=${params.id}&limit=${params.limit}&page=${params.page}`)
}

interface LinkNdzdrwParams {
  ids: string[]
  nd: string
  ndzdrwIds: string[]
}

// 关联年度重点任务
export const linkNdzdrw = (params: LinkNdzdrwParams): Promise<Result> => {
  return baseService.post(`/protypeConfig/linkNdzdrw`, params)
}
