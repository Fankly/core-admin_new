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
