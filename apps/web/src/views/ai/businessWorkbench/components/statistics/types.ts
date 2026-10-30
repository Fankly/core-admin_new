import type { Component } from 'vue'

export interface StatItem {
  label: string
  value: number
  suffix: string
  color: string
  bgColor: string
  iconComponent: Component
}
