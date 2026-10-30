import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export interface SmartTaskAuditSearchParams {
  bmId: string // 部门id
  dwId: string // 单位id
  isHis?: string // 是否历史数据(0 否 1 是) 取公共代码 GY_SF
  limit: number | string // 每页条数
  page: number | string // 页码
  priority?: string // 优先级(1 高 2 中 3 低) 取公共代码 AI_AUDIT_TASK_PRIORITY_COM
  roleId: string // 角色id
  roleCode: string // 角色code
  status?: string // 任务状态 // 0 待审核 1 审核中 2 已完成 3 已撤销 4 已驳回 取公共代码 AI_AUDIT_TASK_STATUS_COM
  docPreStatus?: string // 文档预处理状态 取公共代码 AI_AUDIT_DOC_TYPE_PRE_STATUS_COM
  taskName?: string // 任务名称
  userId: string // 用户id
  yjdw: string // 一级单位
  ejdwList?: string[] // 二级单位id列表
  jhssnd?: string // 计划实施年度  通过公共代码 ZLYS_XMJHSSND
  proTypeList?: string[] // 项目类型列表
  xmbmList?: string[] // 项目编码列表
}

// 获取智能任务审核列表
export const getSmartTaskAuditList = (params: SmartTaskAuditSearchParams): Promise<Result> => {
  return budget.post('ai-audit-task-manage/getTaskPage', params, {}, false)
}
