import baseService from '@/service/baseService'

interface Params {
  [key: string]: any
}

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

/**
 * 计算下一步活动或参与者(启动并完成第一步活动)
 * @param spOrgId
 * @param spRoleId
 * @param params
 * @returns
 */
export const getNextPersionAndPathFromStart = (spOrgId: string, spRoleId: string, params: Params): any => {
  return baseService.post(`/workflow/getNextPersionAndPathFromStart?spOrgId=${spOrgId}&spRoleId=${spRoleId}`, params)
}

/**
 * 初始化工作流
 * @param spOrgId
 * @param wfCode
 * @param workItemId
 * @returns
 */
export const initWfJavascript = (spOrgId: string, wfCode: string, workItemId: string): Promise<Result> => {
  return baseService.post(`/workflow/initWfJavascript?spOrgId=${spOrgId}&wfCode=${wfCode}&workItemId=${workItemId}`)
}

/**
 * 加载用户及工作流相关信息
 * @param workItemId
 * @returns
 */
export const loadUserWfInfo = (workItemId: string): any => {
  return baseService.post(`/workflow/loadUserWfInfo?workItemId=${workItemId}`)
}

/**
 * 查询工作项
 * @param params
 * @returns
 */
export const queryWorkItemsByEmployee = (params: Params): any => {
  return baseService.post('/workflow/queryWorkItemsByEmployee', params)
}

/**
 * 取得流程详细信息url
 * @param workItemId
 * @returns
 */
export const getWfTracking = (wfInstId: string): any => {
  return baseService.post(`/workflow/getWfTracking?wfInstId=${wfInstId}`)
}

/**
 * 关闭待办
 * @param workItemId
 * @returns
 */
export const notify = (workItemId: string): any => {
  return baseService.get(`/db/handle/close?workItemId=${workItemId}`)
}

interface ReSendToJhxt {
  ids: string[]
  xmjd: string
}

/**
 * 补退计划系统
 * @param params
 */
export const reSendToJhxt = (params: ReSendToJhxt): Promise<Result> => {
  return baseService.post(`/workflow/cbxqsh/reSendToJhxt`, params)
}

// 使用权资产移动提醒-待办处理-本月使用权资产变动清单列表查询
export const getZlpzForJh = (params: Params): any => {
  return baseService.post('/zlht/getZlpzForJh', params)
}

// 使用权资产移动提醒-待办处理-下载操作手册
export const downloadJhCzsc = (): Promise<Result> => {
  return baseService.exportGet(`/zlht/downloadJhCzsc`)
}

// 使用权资产移动提醒-待办处理-未挂接合同的租赁需求列表查询
export const getXmWithOutHt = (params: Params): any => {
  return baseService.post('/zlht/getXmWithOutHt', params)
}
