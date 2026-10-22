import type { InjectionKey, Ref } from 'vue'

export type BreakPoint = 'md' | 'lg' | 'xl'

export type Responsive = {
  span?: number
  offset?: number
}

export const GridBreakPointKey: InjectionKey<Ref<BreakPoint>> = Symbol('GridBreakPoint')
export const GridHiddenIndexKey: InjectionKey<Ref<number>> = Symbol('GridHiddenIndex')
export const GridGapKey: InjectionKey<Readonly<Ref<number>>> = Symbol('GridGap')
export const GridColsKey: InjectionKey<Readonly<Ref<number>>> = Symbol('GridCols')
