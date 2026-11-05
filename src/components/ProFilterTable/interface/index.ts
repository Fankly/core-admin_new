import { VNode, ComponentPublicInstance, Ref } from 'vue'
import { BreakPoint, Responsive } from '@/components/Grid/interface'
import { TableColumnCtx } from 'element-plus/lib/el-table/src/table-column/defaults'

export interface EnumProps {
  label?: string // 选项框显示的文字
  value?: string | number | boolean | any[] // 选项框值
  disabled?: boolean // 是否禁用此选项
  tagType?: string // 当 tag 为 true 时，此选择会指定 tag 显示类型
  children?: EnumProps[] // 为树形选择时，可以通过 children 属性指定子选项
  [key: string]: any
}

export type TypeProps = 'index' | 'selection' | 'radio' | 'expand' | 'sort'

export type SearchType =
  | 'input'
  | 'input-number'
  | 'select'
  | 'select-v2'
  | 'tree-select'
  | 'cascader'
  | 'date-picker'
  | 'time-picker'
  | 'time-select'
  | 'switch'
  | 'slider'

export type SearchRenderScope = {
  searchParam: { [key: string]: any }
  placeholder: string
  clearable: boolean
  options: EnumProps[]
  data: EnumProps[]
}

export type SearchProps = {
  el?: SearchType // 当前项搜索框的类型
  label?: string // 当前项搜索框的 label
  props?: any // 搜索项参数，根据 element plus 官方文档来传递，该属性所有值会透传到组件
  key?: string // 当搜索项 key 不为 prop 属性时，可通过 key 指定
  tooltip?: string // 搜索提示
  order?: number // 搜索项排序（从大到小）
  span?: number // 搜索项所占用的列数，默认为 1 列
  offset?: number // 搜索字段左侧偏移列数
  defaultValue?: string | number | boolean | any[] | Ref<any> // 搜索项默认值
  render?: (scope: SearchRenderScope) => VNode // 自定义搜索内容渲染（tsx语法）
} & Partial<Record<BreakPoint, Responsive>>

export type FieldNamesProps = {
  label: string
  value: string
  children?: string
}

export type RenderScope<T> = {
  row: T
  $index: number
  column: TableColumnCtx<T>
  [key: string]: any
}

export type HeaderRenderScope<T> = {
  $index: number
  column: TableColumnCtx<T>
  [key: string]: any
}

// ========== 列筛选相关类型 ==========
// 筛选类型：文本多选 / 数值区间 / 日期区间
export type FilterType = 'text' | 'number' | 'date'

// 日期选择器类型，默认 date
export type FilterDateType = 'date' | 'datetime' | 'month' | 'daterange'

// 列筛选配置
export interface FilterProps {
  type: FilterType // 筛选类型
  // text 类型：候选选项；不传则自动从当前页数据按列取唯一值
  options?: EnumProps[] | Ref<EnumProps[]>
  // number 类型：保留小数位（解析行值为数值时使用）
  precision?: number
  // date 类型：日期选择器类型，默认 date
  dateType?: FilterDateType
}

// 日期筛选模式：区间 / 之前 / 之后
export type FilterDateMode = 'between' | 'before' | 'after'

// 一列的筛选条件（运行时状态）
export interface FilterCondition {
  // text: 选中的 value 数组
  selected?: any[]
  // number: [min, max]，留空表示不限
  range?: [number | undefined, number | undefined]
  // date 模式：between=区间，before=之前，after=之后
  dateMode?: FilterDateMode
  // date between 模式：[start, end]
  dateRange?: [string, string] | null
  // date before/after 模式：单日期
  dateValue?: string | null
}

// 前端排序状态
export interface FilterSortState {
  prop: string // 排序列的 prop
  order: '' | 'asc' | 'desc' // 排序方向，空字符串表示默认（不排序）
}

export interface ColumnProps<T = any> extends Partial<Omit<TableColumnCtx<T>, 'type' | 'children' | 'renderCell' | 'renderHeader'>> {
  type?: TypeProps // 列类型
  tag?: boolean | Ref<boolean> // 是否是标签展示
  isShow?: boolean | Ref<boolean> // 是否显示在表格当中
  isHide?: boolean | Ref<boolean> // 是否隐藏
  search?: SearchProps // 搜索项配置
  enum?: EnumProps[] | Ref<EnumProps[]> | ((params?: any) => Promise<any>) // 枚举字典
  isFilterEnum?: boolean | Ref<boolean> // 当前单元格值是否根据 enum 格式化（示例：enum 只作为搜索项数据）
  fieldNames?: FieldNamesProps // 指定 label && value && children 的 key 值
  headerRender?: (scope: HeaderRenderScope<T>) => VNode // 自定义表头内容渲染（tsx语法）
  render?: (scope: RenderScope<T>) => VNode | string // 自定义单元格内容渲染（tsx语法）
  _children?: ColumnProps<T>[] // 多级表头
  filter?: FilterProps | true // 列筛选配置；true 表示按默认推断
  source?: string // 字段来源说明（仅末级字段列生效，配合 showSource 显示在表头首行）
}

// 由 index.vue provide 的筛选上下文，供 ColumnFilterPanel / TableColumn 消费
export interface ProFilterContext {
  // 当前页全部数据（未筛选前）
  rawData: Ref<any[]>
  // 各列筛选条件
  filterState: Record<string, FilterCondition>
  // 当前排序状态
  sortState: FilterSortState
  // enumMap（与 ProTable 共享，用于 text 列候选项回显）
  enumMap: Ref<Map<string, { [key: string]: any }[]>>
  // 应用某列筛选条件
  applyFilter: (prop: string, condition: FilterCondition) => void
  // 清空某列筛选
  clearFilter: (prop: string) => void
  // 应用排序（同列切换方向，他列清空）
  applySort: (prop: string, order: 'asc' | 'desc') => void
  // 清空排序
  clearSort: () => void
}
