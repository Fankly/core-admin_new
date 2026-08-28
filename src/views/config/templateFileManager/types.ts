import type { ContextProps } from '@/components/ReSplitPane'

export interface SearchTypeOption {
  code: string
  name: string
  [key: string]: any
}

export interface TreeNodeItem {
  id: string
  middleId: string
  name: string
  children?: TreeNodeItem[]
  leaf?: boolean
  [key: string]: any
}

export interface TemplateFileRow {
  id: string
  [key: string]: any
}

export interface AttachmentTypeOption {
  code: string
  name: string
  [key: string]: any
}

export interface TemplateAttachmentRow {
  id?: string | number
  uuid?: string
  fjType?: string
  name?: string
  attachName?: string
  fileName?: string
  [key: string]: any
}

export interface TemplateTableColumn {
  type?: string
  field?: string
  title?: string
  width?: number | string
}

export interface PageConfig extends ContextProps {
  loading: boolean
}
