import baseService from '@/service/baseService'
import type { ApiResponse } from '@/service/http/types'

/** 待办事项行数据；后端字段名沿用工作流接口。 */
export interface WorkItem {
  id: string
  bizName: string
  workflowName: string
  activityDefName: string
  senderName: string
  startTime: string
  urgency: string
  wfInstId: string
  url: string
}

export interface WorkItemPage {
  records: WorkItem[]
  total: number
}

export interface WorkItemQuery {
  type: number
  workFlowCode: string
  state: number
  page: number
  limit: number
}

/** 查询当前登录用户的待办工作项 */
export const queryWorkItemsByEmployee = (params: WorkItemQuery): Promise<ApiResponse<WorkItemPage | null>> => {
  return baseService.post<WorkItemPage>('/workflow/queryWorkItemsByEmployee', params)
}

/** 取得流程跟踪页面地址 */
export const getWfTracking = (wfInstId: string): Promise<ApiResponse<string | null>> => {
  return baseService.post<string>(`/workflow/getWfTracking?wfInstId=${encodeURIComponent(wfInstId)}`)
}


export const getNextPersionAndPathFromStart = (spOrgId: string, spRoleId: string, params: Record<string, any>): any => {
  return baseService.post(`/workflow/getNextPersionAndPathFromStart?spOrgId=${spOrgId}&spRoleId=${spRoleId}`, params)
}

export const initWfJavascript = (spOrgId: string, wfCode: string, workItemId: string): Promise<ApiResponse<any>> => {
  return baseService.post(`/workflow/initWfJavascript?spOrgId=${spOrgId}&wfCode=${wfCode}&workItemId=${workItemId}`)
}

export const loadUserWfInfo = (workItemId: string): any => {
  return baseService.post(`/workflow/loadUserWfInfo?workItemId=${workItemId}`)
}

export const notify = (workItemId: string): any => {
  return baseService.get(`/db/handle/close?workItemId=${workItemId}`)
}

export const reSendToJhxt = (params: { ids: string[]; xmjd: string }): Promise<ApiResponse<any>> => {
  return baseService.post(`/workflow/cbxqsh/reSendToJhxt`, params)
}

export const getZlpzForJh = (params: Record<string, any>): any => {
  return baseService.post('/zlht/getZlpzForJh', params)
}

export const downloadJhCzsc = (): Promise<ApiResponse<any>> => {
  return baseService.exportGet(`/zlht/downloadJhCzsc`)
}

export const getXmWithOutHt = (params: Record<string, any>): any => {
  return baseService.post('/zlht/getXmWithOutHt', params)
}
