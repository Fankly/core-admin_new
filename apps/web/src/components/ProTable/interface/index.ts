import type { InjectionKey, MaybeRef, Ref, VNode } from 'vue'
import type { TableColumnCtx, TableInstance, TagProps } from 'element-plus'
import type { TableColumnProps } from 'element-plus/es/components/table/src/table-column/defaults'
import type { GridColumns, Responsive, BreakPoint } from '@/components/Grid/interface'
import type { TablePageable } from '@/hooks/interface'
import type { useGuide } from '@/hooks/useGuide'

export type TableRow = Record<string, unknown>
export type SearchParams = Record<string, unknown>
export interface EnumProps {
  label?: string
  value?: string | number | boolean | unknown[]
  disabled?: boolean
  tagType?: TagProps['type']
  children?: EnumProps[]
  [key: string]: unknown
}
export type EnumMap = Map<string, EnumProps[]>
export const EnumMapInjectionKey: InjectionKey<Readonly<Ref<EnumMap>>> = Symbol('TableEnumMap')
export type TypeProps = 'index' | 'selection' | 'radio' | 'expand' | 'sort'
export type ToolButtonKey = 'help' | 'setting' | 'search' | 'other'
export type SearchType =
  'input' | 'input-number' | 'select' | 'select-v2' | 'tree-select' | 'cascader' | 'date-picker' | 'time-picker' | 'time-select' | 'switch' | 'slider'
export interface SearchRenderScope {
  searchParam: SearchParams
  placeholder?: string
  clearable: boolean
  options: EnumProps[]
  data: EnumProps[]
}
export type SearchProps = {
  el?: SearchType
  label?: string
  props?: Record<string, unknown>
  key?: string
  tooltip?: string
  order?: number
  span?: number
  offset?: number
  defaultValue?: MaybeRef<unknown>
  render?: (scope: SearchRenderScope) => VNode
} & Partial<Record<BreakPoint, Responsive>>
export interface FieldNamesProps {
  label: string
  value: string
  children?: string
}
export interface RenderScope<T extends object = TableRow> {
  row: T
  $index: number
  column: TableColumnCtx<T>
}
export interface HeaderRenderScope<T extends object = TableRow> {
  $index: number
  column: TableColumnCtx<T>
}

/** 仅继承 Element Plus 公开属性，避免 Store/实例内部类型递归展开。 */
export interface ColumnProps<T extends object = TableRow> extends Omit<TableColumnProps<T>, 'type' | 'renderHeader'> {
  type?: TypeProps
  tag?: MaybeRef<boolean>
  isShow?: MaybeRef<boolean>
  isHide?: MaybeRef<boolean>
  search?: SearchProps
  enum?: MaybeRef<EnumProps[]> | ((params?: SearchParams) => Promise<{ data: EnumProps[] }>)
  isFilterEnum?: MaybeRef<boolean>
  fieldNames?: FieldNamesProps
  headerRender?: (scope: HeaderRenderScope<T>) => VNode
  render?: (scope: RenderScope<T>) => VNode | string
  _children?: ColumnProps<T>[]
}
export interface TablePageData<T = TableRow> extends TablePageable {
  records: T[]
}
export type TableResponseData<T = TableRow> = TablePageData<T> | T[]
export type TableRequest<T = TableRow> = (params: SearchParams) => Promise<{ data: TableResponseData<T> }>
export interface ProTableProps {
  columns: ColumnProps[]
  data?: TableRow[]
  requestApi?: TableRequest
  /** 保留历史行为：默认不自动请求。 */
  requestAuto?: boolean
  requestError?: (error: unknown) => void
  dataCallback?: (data: TableResponseData) => TableResponseData
  title?: string
  pagination?: boolean
  initParam?: SearchParams
  border?: boolean
  toolButton?: ToolButtonKey[] | boolean
  helpMessage?: string
  titleMsg?: string
  rowKey?: string
  searchCol?: GridColumns
  isShowTable?: boolean
  guideModuleKey?: string
  guideTitle?: string
  guideMessage?: string
}
export interface ColSettingInstance {
  openColSetting: () => void
}
export interface ProTableInstance {
  element?: TableInstance
  tableData: TableRow[]
  radio: string
  pageable: TablePageable
  searchParam: SearchParams
  searchInitParam: SearchParams
  getTableList: () => Promise<void>
  search: () => Promise<void>
  reset: () => Promise<void>
  handleSizeChange: (size: number) => Promise<void>
  handleCurrentChange: (page: number) => Promise<void>
  clearSelection: () => void
  enumMap: EnumMap
  isSelected: boolean
  selectedList: TableRow[]
  selectedListIds: unknown[]
  startGuide: ReturnType<typeof useGuide>['startGuide']
  showGuidemanual: ReturnType<typeof useGuide>['showGuideManual']
  hideGuide: () => void
  destroyGuide: () => void
}
