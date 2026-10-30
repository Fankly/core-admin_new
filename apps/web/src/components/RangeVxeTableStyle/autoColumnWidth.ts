import type { VxeGridProps } from 'vxe-table'
import type { RangeVxeTableAutoColumnWidthOptions } from './interface'

type GridColumn = NonNullable<VxeGridProps['columns']>[number]

export const DEFAULT_AUTO_COLUMN_MIN_WIDTH = 100
export const DEFAULT_AUTO_COLUMN_MAX_WIDTH = 360

export interface AutoColumnWidthBounds {
  minWidth: number
  maxWidth: number
}

export interface AutoColumnWidthItem extends AutoColumnWidthBounds {
  key: string
  width: number
}

export interface AutoColumnWidthConfigResult {
  config: AutoColumnWidthBounds | null
  error?: string
}

const isPositiveFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

export const resolveAutoColumnWidthConfig = (value: boolean | RangeVxeTableAutoColumnWidthOptions | undefined): AutoColumnWidthConfigResult => {
  if (!value) return { config: null }

  const minWidth = value === true ? DEFAULT_AUTO_COLUMN_MIN_WIDTH : value.minWidth ?? DEFAULT_AUTO_COLUMN_MIN_WIDTH
  const maxWidth = value === true ? DEFAULT_AUTO_COLUMN_MAX_WIDTH : value.maxWidth ?? DEFAULT_AUTO_COLUMN_MAX_WIDTH

  if (!isPositiveFiniteNumber(minWidth) || !isPositiveFiniteNumber(maxWidth)) {
    return {
      config: null,
      error: `minWidth 和 maxWidth 必须是大于 0 的有限数值，当前值为 minWidth=${String(minWidth)}、maxWidth=${String(maxWidth)}`
    }
  }
  if (minWidth > maxWidth) {
    return {
      config: null,
      error: `minWidth 不能大于 maxWidth，当前值为 minWidth=${minWidth}、maxWidth=${maxWidth}`
    }
  }
  return { config: { minWidth, maxWidth } }
}

export const cloneGridColumns = (columns: VxeGridProps['columns'] = []): VxeGridProps['columns'] =>
  columns.map((column) => ({
    ...column,
    children: column.children ? cloneGridColumns(column.children) : undefined
  }))

export const collectLeafColumns = (columns: VxeGridProps['columns'] = []): GridColumn[] => {
  const result: GridColumn[] = []
  columns.forEach((column) => {
    if (column.children?.length) {
      result.push(...collectLeafColumns(column.children))
    } else {
      result.push(column)
    }
  })
  return result
}

export const resolveColumnBounds = (column: GridColumn, defaults: AutoColumnWidthBounds): AutoColumnWidthConfigResult => {
  const minWidth = column.minWidth ?? defaults.minWidth
  const maxWidth = column.maxWidth ?? defaults.maxWidth

  if (!isPositiveFiniteNumber(minWidth) || !isPositiveFiniteNumber(maxWidth)) {
    return {
      config: null,
      error: `列 ${String(column.field)} 的 minWidth 和 maxWidth 必须是大于 0 的有限数值，当前值为 minWidth=${String(minWidth)}、maxWidth=${String(
        maxWidth
      )}`
    }
  }
  if (minWidth > maxWidth) {
    return {
      config: null,
      error: `列 ${String(column.field)} 的 minWidth 不能大于 maxWidth，当前值为 minWidth=${minWidth}、maxWidth=${maxWidth}`
    }
  }
  return { config: { minWidth, maxWidth } }
}

export const clampColumnWidth = (width: number, bounds: AutoColumnWidthBounds) =>
  Math.min(bounds.maxWidth, Math.max(bounds.minWidth, Math.ceil(width)))

/** 在不突破列最大宽度的前提下，按水位方式确定性地分配剩余空间。 */
export const distributeAutoColumnWidths = (items: AutoColumnWidthItem[], availableWidth: number): Map<string, number> => {
  const widths = new Map(items.map((item) => [item.key, clampColumnWidth(item.width, item)]))
  let remaining = Math.max(0, Math.floor(availableWidth - Array.from(widths.values()).reduce((sum, width) => sum + width, 0)))
  let active = items.filter((item) => (widths.get(item.key) || 0) < item.maxWidth)

  while (remaining > 0 && active.length > 0) {
    const share = Math.max(1, Math.floor(remaining / active.length))
    let distributed = 0
    active.forEach((item) => {
      const current = widths.get(item.key) || item.minWidth
      const addition = Math.min(share, item.maxWidth - current, remaining - distributed)
      if (addition > 0) {
        widths.set(item.key, current + addition)
        distributed += addition
      }
    })
    if (distributed === 0) break
    remaining -= distributed
    active = active.filter((item) => (widths.get(item.key) || 0) < item.maxWidth)
  }

  return widths
}
