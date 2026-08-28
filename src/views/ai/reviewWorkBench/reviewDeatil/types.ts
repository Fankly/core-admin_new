import type { VxeGridProps } from 'vxe-table'
import type { SmartTaskAuditDetailListItem, SmartTaskAuditListItem } from '@/api/ai/smartTaskAudit'

export interface SearchForm {
  xmbm: string
  proTypeList: string[]
  jhssnd: string
  yjdw: string
  ejdwList: string[]
  taskName: string
  status: string
  docPreStatus: string
  isHis: string
  priority: string
}

export interface ProjectSearchForm {
  xmmc: string
  xmbm: string
  jhssnd: string
  yjdw: string
  proTypeList: string[]
  ejdwList: string[]
  yjfl: string
  ejfl: string
  sjflList: string[]
  flowStatusList: string[]
}

export interface OptionItem {
  code: string
  name: string
  [key: string]: any
}

export type SmartTaskAuditRow = Partial<SmartTaskAuditListItem> & {
  [key: string]: any
}

export type SmartTaskAuditProjectRow = Partial<SmartTaskAuditDetailListItem> & {
  [key: string]: any
}

export interface PageState {
  total: number
  limit: number
  page: number
}

export interface ModalState {
  visible: boolean
  loading: boolean
}

export interface PriorityForm {
  priority: string
}

export type SmartTaskAuditGridOptions = VxeGridProps<SmartTaskAuditRow>
export type SmartTaskAuditProjectGridOptions = VxeGridProps<SmartTaskAuditProjectRow>
