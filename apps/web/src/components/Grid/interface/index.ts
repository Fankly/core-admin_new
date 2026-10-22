import type { InjectionKey, Ref } from 'vue'

export type BreakPoint = 'md' | 'lg' | 'xl'
export type Responsive = { span?: number; offset?: number }
export type GridColumns = number | Record<BreakPoint, number>
export interface GridProps {
  cols?: GridColumns
  collapsed?: boolean
  collapsedRows?: number
  gap?: [number, number] | number
}
export interface GridInstance {
  breakPoint: BreakPoint
  hiddenIndex: number
}
export interface GridItemProps {
  md?: Responsive
  lg?: Responsive
  xl?: Responsive
  index?: number | string
  offset?: number
  span?: number
  suffix?: boolean
}

export const GridBreakPointKey: InjectionKey<Readonly<Ref<BreakPoint>>> = Symbol('GridBreakPoint')
export const GridHiddenIndexKey: InjectionKey<Readonly<Ref<number>>> = Symbol('GridHiddenIndex')
export const GridGapKey: InjectionKey<Readonly<Ref<number>>> = Symbol('GridGap')
export const GridColsKey: InjectionKey<Readonly<Ref<number>>> = Symbol('GridCols')
