import Decimal from 'decimal.js'
import type { StatisticValue } from '@/api/overview'
import type { ChartSort, ChartSortMetric, OverviewRow, OverviewStage, SortOrder } from '../types'
import { DEFAULT_CHART_SORT, TOTAL_CHART_SORT, TOTAL_SORT_LABEL, TOTAL_SORT_STAGE_ID } from './overview'
import type { StageSortOption } from './overview'

export interface ChartSortOption {
  id: ChartSort
  label: string
  metric: ChartSortMetric
}

const parseSortValue = (value: StatisticValue | null | undefined): Decimal | null => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  if (!text) return null
  try {
    // 直接比较原始十进制值，避免长金额先转 Number 后丢失差异。
    const number = new Decimal(text)
    return number.isFinite() ? number : null
  } catch {
    return null
  }
}

/**
 * 按当前统计口径的阶段值、占比或合计排序：desc 从高到低、asc 从低到高。
 * 缺失值始终排最后，同值沿用接口顺序，不修改源数据。
 */
export const sortOverviewRows = (rows: OverviewRow[], sortBy: ChartSort = DEFAULT_CHART_SORT, order: SortOrder = 'desc'): OverviewRow[] => {
  const ratio = sortBy.startsWith('ratio-')
  const stageId = sortBy.slice(sortBy.indexOf('-') + 1)
  // 「合计」取行的合计列，不查阶段明细；其余键按阶段编码取当前口径的数值或占比。
  const readValue = (row: OverviewRow) => (!ratio && stageId === TOTAL_SORT_STAGE_ID ? row.total : (ratio ? row.ratios : row.values)[stageId])
  return rows
    .map((row) => ({ row, value: parseSortValue(readValue(row)) }))
    .sort((a, b) => {
      if (a.value === null) return b.value === null ? 0 : 1
      if (b.value === null) return -1
      return order === 'asc' ? a.value.comparedTo(b.value) : b.value.comparedTo(a.value)
    })
    .map(({ row }) => row)
}

/**
 * 每个阶段提供数值和占比选项，配置决定名称与顺序，未配置的阶段仍补齐；
 * 首位固定补一个「合计」数值选项（接口没有合计占比），用于按行的合计金额/数量排序。
 */
export const resolveStageSortOptions = (configured: StageSortOption[], stages: OverviewStage[]): ChartSortOption[] => {
  // 配置项 code 与接口 jdbm 精确比对，不做编码换算；对不上的配置项忽略，阶段顺序沿用图表阶段顺序。
  const actualIds = new Set(stages.map((stage) => stage.id))
  const available: StageSortOption[] = []
  configured.forEach((option) => {
    if (available.some((item) => item.id === option.id)) return
    if (actualIds.has(option.id)) available.push({ id: option.id, label: option.label })
  })
  const configuredIds = new Set(available.map((option) => option.id))
  const allStages = [...available, ...stages.filter((stage) => !configuredIds.has(stage.id)).map((stage) => ({ id: stage.id, label: stage.title }))]
  // 没有任何阶段（加载中或接口为空）时不提供排序项，排序控件保持禁用。
  if (!allStages.length) return []
  return [
    { id: TOTAL_CHART_SORT, label: TOTAL_SORT_LABEL, metric: 'value' },
    ...allStages.flatMap((stage): ChartSortOption[] => [
      { id: `value-${stage.id}`, label: stage.label, metric: 'value' },
      { id: `ratio-${stage.id}`, label: stage.label, metric: 'ratio' }
    ])
  ]
}
