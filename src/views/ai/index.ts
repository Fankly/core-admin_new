import ServiceApi from '@/api/base/ServiceApi'
import type { Result } from '@/api/types'

export const budget = ServiceApi.budget

export type BusinessWorkbenchModuleId = 'create' | 'review' | 'opinion'
export type BusinessWorkbenchMenuTarget = '_self' | '_blank'

export const BUSINESS_WORKBENCH_MODULE_STEPS: Record<BusinessWorkbenchModuleId, number> = {
  create: 0,
  review: 1,
  opinion: 2
}

export const BUSINESS_WORKBENCH_API = {
  projectStatistics: 'business-workbench/projectStatistics',
  requirementLibraryProjectPage: 'business-workbench/requirementLibraryProjectPage', // 需求库项目信息分页查询
  meetingInfoPage: 'business-workbench/meetingInfoPage', // 联合会审项目信息分页查询
  reserveLibraryProjectPage: 'business-workbench/reserveLibraryProjectPage' // 储备库项目信息分页查询
} as const

export interface BusinessWorkbenchRoleParams {
  bmId: string
  bmName?: string
  dwId: string
  dwName?: string
  roleId: string
  roleCode: string
  specialOrgCode?: string
  spRoleId?: string
}

export interface BusinessWorkbenchModuleParams extends BusinessWorkbenchRoleParams {
  moduleId: BusinessWorkbenchModuleId
  step: number
  nd: string
  yjdw: string
}

export interface BusinessWorkbenchListItem {
  id: string
  name: string
  moduleId?: BusinessWorkbenchModuleId
  routePath?: string
  routeName?: string
  query?: Record<string, any>
  [key: string]: any
}

export interface BusinessWorkbenchPageResult<T = BusinessWorkbenchListItem> {
  records: T[]
  total: number
  page?: number | string
  limit?: number | string
}

export type RequirementLibraryProject = object
export type MeetingInfo = object
export type ReserveLibraryProject = object

export type RequirementLibraryProjectPageResult = BusinessWorkbenchPageResult<RequirementLibraryProject>
export type MeetingInfoPageResult = BusinessWorkbenchPageResult<MeetingInfo>
export type ReserveLibraryProjectPageResult = BusinessWorkbenchPageResult<ReserveLibraryProject>

export type ProjectStatisticsParams = Pick<BusinessWorkbenchModuleParams, 'yjdw' | 'step' | 'nd'>

export const buildBusinessWorkbenchRoleParams = (role: Partial<BusinessWorkbenchRoleParams>): BusinessWorkbenchRoleParams => {
  return {
    bmId: role.bmId || '',
    bmName: role.bmName || '',
    dwId: role.dwId || '',
    dwName: role.dwName || '',
    roleId: role.roleId || '',
    roleCode: role.roleCode || '',
    specialOrgCode: role.specialOrgCode || '',
    spRoleId: role.spRoleId || ''
  }
}

export const buildBusinessWorkbenchModuleParams = (
  role: Partial<BusinessWorkbenchRoleParams>,
  moduleId: BusinessWorkbenchModuleId,
  nd: string
): BusinessWorkbenchModuleParams => {
  const roleParams = buildBusinessWorkbenchRoleParams(role)

  return {
    ...roleParams,
    moduleId,
    step: BUSINESS_WORKBENCH_MODULE_STEPS[moduleId],
    nd,
    yjdw: roleParams.dwId
  }
}

export interface ProjectStatisticsResult {
  totalCount: number //需求资源库-我的项目总数
  requirementEntryRate: number // 需求资源库-需求入库率
  notInRequirementEntryRate: number // 需求资源库-未纳入需求库总数
  requirementCount: number // 需求资源库-需求库项目数
  jointReviewCount: number // 需求资源库-联合会审项目数
  reserveCount: number // 需求资源库-储备项目数
  budgetingCount: number // 需求资源库-计划预算编制中项目数
  approvedCount: number // 需求资源库-已立项项目数
  closedCount: number // 需求资源库-已关闭项目数
  jointReviewPassRate: number // 联合会审-会审通过率
  totalCount2: number // 联合会审-我的项目总数
  reviewingCount: number // 联合会审-审核中项目数
  reviewPassedCount: number // 联合会审-审核通过项目数
  reviewRejectedCount: number // 联合会审-审核退回项目数
  reviewOpinionPendingCount: number // 联合会审-评审意见待上传项目数
  pendingFeasibilityUploadCount: number // 联合会审-可研批复待上传项目数
  complianceReviewingCount: number // 联合会审-发展合规审核中项目数
  approvalRate: number // 项目储备库-立项率
  totalCount3: number // 项目储备库-我的项目总数
  pendingOutboundCount: number // 项目储备库-待出库总数
  pendingOutboundConfirmCount: number // 项目储备库-待出库确认项目数
  pendingBudgetingCount: number // 项目储备库-待预算编制项目数
  budgetingReviewingCount: number // 项目储备库-预算编制审核中项目数
  pendingApprovalCount: number // 项目储备库-待立项项目数
  approvedCount3: number // 项目储备库-已立项项目数
}

export const getBusinessWorkbenchProjectStatistics = (params: ProjectStatisticsParams): Promise<Result & { data: ProjectStatisticsResult }> => {
  return budget.post(BUSINESS_WORKBENCH_API.projectStatistics, params, {}, false)
}

export interface RequirementLibraryProjectPageParams {
  nd: string
  bmId: string
  dwId: string
  limit: string
  page: string
  roleId: string
  roleCode: string
  userId: string
  yjdw: string // 一级单位和dwId字段一样
}

// 需求库项目信息分页查询
export const requirementLibraryProjectPage = (
  params: RequirementLibraryProjectPageParams
): Promise<Result & { data: RequirementLibraryProjectPageResult }> => {
  return budget.post(BUSINESS_WORKBENCH_API.requirementLibraryProjectPage, params, {}, false)
}

export interface MeetingInfoPageParams {
  nd: string // 年度
  meetingName: string // 会议名称
  bmId: string // 部门id
  dwId: string // 部门id
  limit: string // 每页条数
  page: string // 页码
  roleId: string // 角色id
  roleCode: string // 角色编码
  userId: string // 用户id
  yjdw: string // 一级单位和dwId字段一样
  status: string // 状态 00未发布 01评审中 02已结束
}

// 联合会审项目信息分页查询
export const meetingInfoPage = (params: MeetingInfoPageParams): Promise<Result & { data: MeetingInfoPageResult }> => {
  return budget.post(BUSINESS_WORKBENCH_API.meetingInfoPage, params, {}, false)
}

export interface ReserveLibraryProjectPageParams {
  nd: string
  bmId: string
  dwId: string
  limit: string
  page: string
  roleId: string
  roleCode: string
  userId: string
  yjdw: string // 一级单位和dwId字段一样
}

// 储备库项目信息分页查询
export const reserveLibraryProjectPage = (params: ReserveLibraryProjectPageParams): Promise<Result & { data: ReserveLibraryProjectPageResult }> => {
  return budget.post(BUSINESS_WORKBENCH_API.reserveLibraryProjectPage, params, {}, false)
}
