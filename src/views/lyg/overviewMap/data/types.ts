export type StageKey = '出库' | '立项' | '报招' | '中标' | '签订合同' | '实施中' | '送审' | '结算' | '关闭'

export interface StageInfo {
  key: StageKey
  title: string
  shortTitle: string
  color: string
  badgeBg?: string
  currentCount: number
  cumulativeCount: number
  cumulativeLabel: string
}

export interface CityCompletion {
  cityName: string
  completionRate: number
  targetRate: number
  rank: number
  budgetAmount: number // 万元
  completedAmount: number // 万元
}

export interface DistrictInfo {
  id: string
  name: string
  code: string
  projectCount: number
  totalBudget: number // 万元
  completedBudget: number // 万元
  completionRate: number
  pathD?: string
  center?: [number, number]
}

export interface ProjectItem {
  id: string
  code: string
  name: string
  type: string
  responsibleDept: string
  implementationDept: string
  stage: StageKey
  district: string
  budgetAmount: number // 万元
  spentAmount: number // 万元
  startDate: string
  endDate: string
  status: '正常' | '预警' | '延期' | '加急'
  manager: string
}

export interface FilterState {
  projectType: string
  responsibleDept: string
  implementationDept: string
  yearMonth: string
  district: string
  searchQuery: string
  xmlx: string
}
