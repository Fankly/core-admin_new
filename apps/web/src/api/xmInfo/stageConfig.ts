import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export interface Params {
  [key: string]: any
}

export interface DeleteParams {
  ids: any[]
}

export interface linkParams {
  dataId: string
}

export interface linkProcessParams {
  onechartDataIds: string[] //方案Ids
  onechartProcessIds: string[] //步骤Ids
}

export interface DataParams {
  pageType: string
  xmid: string
  orderType?: number // 1=升序 2=降序
}

// 全流程节点配置-获取方案列表
export const configGetPage = (prams: Params): Promise<Result> => {
  return budget.post(`onechart/config/getPage`, prams, {}, false)
}

// 全流程节点配置-新增或修改方案
export const configSaveOrUpdate = (params: Params): Promise<Result> => {
  return budget.post('onechart/config/saveOrUpdate', params, {}, false)
}

// 全流程节点配置-删除方案
export const configDelete = (params: DeleteParams): Promise<Result> => {
  return budget.post('onechart/config/delete', params, {}, false)
}

// 全流程节点配置-根据方案ID获取已关联的步骤
export const getAlreadyLinkProcess = (params: linkParams): Promise<Result> => {
  return budget.get('onechart/config/getAlreadyLinkProcess', params, {}, false)
}

// 全流程节点配置-根据方案ID关联步骤
export const linkProcess = (params: linkProcessParams): Promise<Result> => {
  return budget.post('onechart/config/linkProcess', params, {}, false)
}

// 全流程节点配置-获取步骤列表
export const processGetPage = (prams: Params): Promise<Result> => {
  return budget.post(`onechart/process/getPage`, prams, {}, false)
}

// 全流程节点配置-新增或修改步骤
export const processSaveOrUpdate = (params: Params): Promise<Result> => {
  return budget.post('onechart/process/saveOrUpdate', params, {}, false)
}

// 全流程节点配置-删除步骤
export const processDelete = (params: DeleteParams): Promise<Result> => {
  return budget.post('onechart/process/delete', params, {}, false)
}

// 根据项目id获取一张图信息（按步骤）
export const getDataByXmid = (params: DataParams): Promise<Result> => {
  return budget.get(`onechart/getDataByXmid`, params, {}, false)
}
// 根据项目id获取一张图信息（按时间）
export const getDataByXmidOrderByTime = (params: DataParams): Promise<Result> => {
  return budget.get(`onechart/getDataByXmidOrderByTime`, params, {}, false)
}
