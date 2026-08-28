import type { VxeGridInstance, VxeGridProps, VxeGridPropTypes } from 'vxe-table'
import type { BreakPoint } from '@/components/Grid/interface'
import type { ColumnProps } from '@/components/ProTable/interface'

export type RangeVxeTableRow = Record<string, any>
export type RangeVxeTableRowClickMode = 'exclusive' | 'toggle' | 'none'
export type RangeVxeTableToolButton = 'help' | 'setting' | 'search' | 'other'

export interface RangeVxeTableAutoColumnWidthOptions {
  minWidth?: number
  maxWidth?: number
}

/**
 * 树形配置：透传到 vxe-grid 的 treeConfig。
 * lazy=true 时配合 treeConfig.loadMethod 懒加载子节点；
 * 业务页通过 :tree-config="..." 传入，loadMethod 会被组件内部包装以调用 requestApi。
 */
export type RangeVxeTableTreeConfig = VxeGridPropTypes.TreeConfig

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

/** RangeVxeTable 的公共入参，业务页面可复用该类型声明二次封装。 */
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
  /**
   * 树形配置：透传到 vxe-grid treeConfig。
   * 若配置 lazy=true，组件会用 requestApi 包装 loadMethod：展开节点时以当前行作为 parentId 等参数调用 requestApi，
   * 返回的数据作为子节点挂载。业务页需在 requestApi 内根据 params.parentId 区分根查询与子节点加载。
   */
  treeConfig?: RangeVxeTableTreeConfig
  /**
   * 自定义树形懒加载取参：从被展开行中提取传给 requestApi 的参数（默认 { parentId: row[rowKey] }）。
   */
  treeLoadParams?: (row: RangeVxeTableRow) => Record<string, any>
  /**
   * 预取的搜索枚举数据：key 为 searchColumns 的 prop，value 为枚举数组。
   * 传入后在 setup 同步阶段注入 enumMap，使后续 initSearchEnums 命中去重、跳过对应网络请求，
   * 从而解除字典请求与 getTableList 数据请求的串行阻塞。未传入时走原有逻辑，向后兼容。
   */
  prefetchedEnums?: Record<string, any[]>
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
}
