import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

const budget = ServiceApi.budget
const BASE_PATH = '/xmysylpz'

export interface addParams {
  leaf: string
  sortCode: string
  nd: string
  name: string
  protypeId?: string
  id?: string
}
export interface deleteParams {
  ids: string[]
}

export interface getChildParams {
  nd: string
  parentId: string
}

export interface copyParams {
  sourceNd: string
  targetNd: string
}
//项目预算一览配置-新增或修改
export const addApi = (params: addParams): Promise<Result> => {
  return budget.post(`${BASE_PATH}/add`, params, undefined, false)
}

//项目预算一览配置-删除
export const deleteApi = (params: deleteParams): Promise<Result> => {
  return budget.post(`${BASE_PATH}/delete`, params, undefined, false)
}

//项目预算一览配置-根据父id获取下级节点信息
export const getChildApi = (params: getChildParams): Promise<Result> => {
  return budget.post(`${BASE_PATH}/getChild?nd=${params.nd}&parentId=${params.parentId}`, params, undefined, false)
}

//项目预算一览配置-复制
export const copyApi = (params: copyParams): Promise<Result> => {
  return budget.post(`${BASE_PATH}/copy?sourceNd=${params.sourceNd}&targetNd=${params.targetNd}`, params, undefined, false)
}
