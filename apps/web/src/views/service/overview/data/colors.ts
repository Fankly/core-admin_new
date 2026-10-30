import type { BudgetFilter } from '../types'

// 圆环、排名柱形和筛选标签共用配色；项目类型按圆环接口顺序取色，不受排名顺序影响。
export const BUDGET_TYPE_COLORS: Record<Exclude<BudgetFilter, ''>, string> = { '1': '#1b75ef', '2': '#2aa9ae' }
export const PROJECT_TYPE_COLORS = ['#0e9f6e', '#fd9554', '#1cced1', '#1975f0', '#8b5cf6', '#ef4444', '#f59e0b', '#0ea5e9']
