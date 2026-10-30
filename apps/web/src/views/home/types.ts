import type { Component } from 'vue'

export interface MaintenanceNotice {
  id: number
  title: string
  time: string
  date: string
  level: string
  levelBg: string
  scope: string
  content: string
  contact: string
  unread: boolean
}

export interface ModuleItem {
  key: string
  name: string
  centerName: string
  dimensionLabel: string
  dimensionType: string
  layer: string
  step?: string
  description: string
  icon: Component
  count: number
  records: any[]
  statusText: string
  gradient?: string
  glowColor?: string
  bgImage?: string
}

export interface NoticeItemClickEvent {
  notice: MaintenanceNotice
}
