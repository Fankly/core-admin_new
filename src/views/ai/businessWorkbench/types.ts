import type { BusinessWorkbenchMenuTarget, BusinessWorkbenchModuleId, ProjectStatisticsResult } from '@/api/ai/businessWorkbench'

export type ModuleId = BusinessWorkbenchModuleId
export type ModuleCardType = 'requirementLibrary' | 'jointReview' | 'projectReserve'
export type LevelFilter = 'all' | (string & {})
export type MeetingStatus = 'pending' | 'reviewing' | 'completed' | 'cancelled' | 'unknown'
export type StatusFilter = 'all' | MeetingStatus | (string & {})

export interface YearOption {
  code: string
  name: string
}

export interface Meeting {
  id: string
  name: string
  status: MeetingStatus
  statusName: string
  meetingCode: string
  projectCode: string
  declaredBudget: number
  primaryUnit: string
  secondaryUnit: string
  cityManagementDepartment: string
  createDepartment: string
  reviewStartDate: string
  reviewEndDate: string
  expertCount: number
  projectCount: number
  passedCount: number
  returnedCount: number
  pendingCount: number
  level: 'city' | 'province'
}

export interface StatusConfig {
  label: string
  colorClass: string
  icon: string
}

export type Statistics = ProjectStatisticsResult

export interface ModuleConfig {
  id: ModuleId
  appNo: string
  title: string
  icon: string
  color: string
  bgColor: string
  menus: MenuConfig[]
  hasPermission?: boolean
  permissionText?: string
  loading?: boolean
}

export interface MenuConfig {
  id: string
  label: string
  appNo?: string
  outsideMenu?: string
  routePath?: string
  routeName?: string
  params?: Record<string, any>
  query?: Record<string, any>
  target?: BusinessWorkbenchMenuTarget
  permissionCode?: string
  disabled?: boolean
  sort?: number
}

export interface FilterOption<T extends string> {
  value: T
  label: string
}

export interface ModuleListConfig {
  title: string
  unitLabel: string
  searchPlaceholder: string
  emptyTitle: string
  showLevelFilter: boolean
  levelOptions: FilterOption<LevelFilter>[]
  statusOptions: FilterOption<StatusFilter>[]
}

export interface WorkbenchModule {
  id: ModuleId
  cardType: ModuleCardType
  config: ModuleConfig
  listConfig: ModuleListConfig
}
