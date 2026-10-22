import type { BreakPoint, GridColumns, GridItemProps } from './interface'

export const getBreakPoint = (width: number): BreakPoint => (width < 1200 ? 'md' : width < 1920 ? 'lg' : 'xl')
export const getGridColumns = (cols: GridColumns, breakpoint: BreakPoint): number => {
  const value = typeof cols === 'number' ? cols : cols[breakpoint]
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}
export const getItemPlacement = (item: GridItemProps, breakpoint: BreakPoint, cols: number) => {
  const responsive = item[breakpoint]
  const rawSpan = responsive?.span ?? item.span ?? 1
  const rawOffset = responsive?.offset ?? item.offset ?? 0
  const span = Number.isFinite(rawSpan) ? Math.min(cols, Math.max(1, Math.floor(rawSpan))) : 1
  const offset = Number.isFinite(rawOffset) ? Math.min(cols - span, Math.max(0, Math.floor(rawOffset))) : 0
  return { span, offset, occupied: span + offset }
}

/** CSS grid 不会把一个字段拆到两行；跨行时计入上一行余下的空格。 */
export const getHiddenIndex = (items: GridItemProps[], breakpoint: BreakPoint, cols: number, rows = 1): number => {
  const suffix = items.filter((item) => item.suffix).reduce((total, item) => total + getItemPlacement(item, breakpoint, cols).occupied, 0)
  const capacity = Math.max(0, Math.max(1, Math.floor(rows)) * cols - suffix)
  let used = 0
  return items
    .filter((item) => !item.suffix)
    .findIndex((item) => {
      const occupied = getItemPlacement(item, breakpoint, cols).occupied
      const remaining = cols - (used % cols)
      if (remaining < occupied) used += remaining
      used += occupied
      return used > capacity
    })
}
