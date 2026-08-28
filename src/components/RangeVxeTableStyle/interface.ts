import type { VxeGridInstance, VxeGridProps } from 'vxe-table'
import type { BreakPoint } from '@/components/Grid/interface'
import type { ColumnProps } from '@/components/ProTable/interface'

export type RangeVxeTableRow = Record<string, any>
export type RangeVxeTableRowClickMode = 'exclusive' | 'toggle' | 'none'
export type RangeVxeTableToolButton = 'help' | 'setting' | 'search' | 'other'

export interface RangeVxeTableAutoColumnWidthOptions {
  minWidth?: number
  maxWidth?: number
}

export interface RangeVxeTablePageable {
  current: number
  size: number
  total: number
}

export interface RangeVxeTableElement<Row = RangeVxeTableRow> {
  toggleRowSelection: (row: Row, selected?: boolean) => void
  doLayout: () => void
  clearSelection: () => void
  setCheckboxRow: (row: Row, checked?: boolean) => void
  getCheckboxRecords: () => Row[]
  getCheckboxReserveRecords: () => Row[]
}

export interface RangeVxeTablePageResult<Row = RangeVxeTableRow> {
  records: Row[]
  total: number
  current?: number
  size?: number
}

export interface RangeVxeTableResponse<Row = RangeVxeTableRow> {
  data: RangeVxeTablePageResult<Row> | Row[]
  success?: boolean
  msg?: string
  [key: string]: any
}

/** RangeVxeTableStyle 的公共入参，业务页面可复用该类型声明二次封装。 */
export interface RangeVxeTableProps {
  columns?: VxeGridProps['columns']
  autoColumnWidth?: boolean | RangeVxeTableAutoColumnWidthOptions
  searchColumns?: ColumnProps[]
  requestApi?: (params: Record<string, any>) => Promise<any>
  requestAuto?: boolean
  requestError?: (error: unknown) => void
  dataCallback?: (data: any) => any
  pagination?: boolean
  pageSize?: number
  pageSizes?: number[]
  border?: boolean
  stripe?: boolean
  toolButton?: RangeVxeTableToolButton[] | boolean
  columnSetting?: boolean
  rowKey?: string
  searchCol?: number | Record<BreakPoint, number>
  loading?: boolean
  rowClickMode?: RangeVxeTableRowClickMode
  reserveSelection?: boolean
  initParam?: Record<string, any>
  cellStyle?: VxeGridProps['cellStyle']
}

/** 父组件通过 template ref 获取的公开实例；Vue 会自动解包 expose 中的 Ref。 */
export interface RangeVxeTableExpose<Row = RangeVxeTableRow> {
  getTableList: () => Promise<void>
  invalidateRequest: () => void
  clearSelection: () => void
  clearCheckboxRow: () => void
  reset: () => Promise<void>
  searchParam: Record<string, any>
  selectedList: Row[]
  selectedListIds: Array<string | number>
  isSelected: boolean
  pageable: RangeVxeTablePageable
  element: RangeVxeTableElement<Row>
  gridRef?: VxeGridInstance
  getCheckboxRecords: () => Row[]
  setCheckboxRow: (row: Row, checked?: boolean) => void
  openColSetting: () => void
  toggleRowSelection: (row: Row, selected?: boolean) => void
  doLayout: () => void
}

export interface RangeVxeTableEmit {
  (event: 'search'): void
  (event: 'reset'): void
  (event: 'row-click', row: RangeVxeTableRow): void
  (event: 'selection-change', rows: RangeVxeTableRow[]): void
  (event: 'cell-click', params: { row: RangeVxeTableRow; column: any }): void
}
