import type { VxeGridProps } from 'vxe-table'

export interface OptionItem {
  code: string
  name: string
}

export interface SearchForm {
  xmbm: string
  xmmc: string
  proTypes: string[]
  jhssnd: string
  yjdw: string
  attachName: string
  attachType: string
  priority: string
  transcodeStatus: string
  extractStatus: string
}

export interface ProjectSearchForm {
  xmbm: string
  xmmc: string
  jhssnd: string
  yjdw: string
  proTypeList: string[]
}

export interface AttachTaskRow {
  id?: string
  attachId?: string
  proId?: string
  priority?: string
  priorityName?: string
  content?: string
  wordCount?: number | string
  transcodeStatus?: string
  transcodeStatusName?: string
  transcodeStartTime?: string
  transcodeEndTime?: string
  transcodeFinishTime?: string
  transcodeMessage?: string
  extractJson?: string
  extractSchema?: string
  extractStatus?: string
  extractStatusName?: string
  extractStartTime?: string
  extractEndTime?: string
  extractFinishTime?: string
  extractMessage?: string
  createTime?: string
  attachName?: string
  attachType?: string
  attachTypeName?: string
  fjId?: string
  fjName?: string
  xmbm?: string
  xmmc?: string
  proType?: string
  proTypeName?: string
  jhssnd?: string
  nd?: string
  yjdw?: string
  yjdwName?: string
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

export interface EditForm {
  attachId: string
  content: string
  extractJson: string
  extractSchema: string
  extractStatus: string
  /** 后端编辑接口字段名（历史拼写） */
  transcodeStatus: string
}

export interface ProjectRow {
  xmId?: string
  proId?: string
  id?: string
  xmbm?: string
  xmmc?: string
  jhssnd?: string
  proType?: string
  proTypeName?: string
  yjdw?: string
  yjdwName?: string
  ejdw?: string
  ejdwName?: string
  flowStatus?: string
  flowStatusName?: string
  amount?: number | string
  [key: string]: any
}

export type AttachTaskGridOptions = VxeGridProps<AttachTaskRow>
export type ProjectGridOptions = VxeGridProps<ProjectRow>
