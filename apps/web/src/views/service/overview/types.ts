export type StageId = string
export type StatMode = 'amount' | 'count'
/** 金额展示单位：接口金额固定为万元，亿元仅在前端换算展示。 */
export type AmountUnit = '万元' | '亿元'
export type Dimension = 'unit' | 'specialty'
/** 组织类型：province 全省（searchType 传空）、city 地市公司、direct 直属单位及本部。 */
export type OrgType = 'province' | 'city' | 'direct'
export type ViewMode = 'chart' | 'table'
export type ChartSortMetric = 'value' | 'ratio'
/** 排序方向：desc 从高到低（默认），asc 从低到高；图表、表格与导出共用。 */
export type SortOrder = 'desc' | 'asc'
/** 图表及表格排序：value-阶段编码按金额/数量，ratio-阶段编码按对应占比，方向由 SortOrder 决定。 */
export type ChartSort = `${ChartSortMetric}-${StageId}`
/** 预算类型筛选（接口 yslx）：1 省级统筹，2 市域统筹；空字符串表示不筛选。 */
export type BudgetFilter = '' | '1' | '2'

export interface OverviewFilters {
  year: string // 计划实施年度，对应 jhssnd
  month: string // 月度日期 YYYY-MM，空字符串表示全部月份
  statMode: StatMode
  /** 金额展示单位；数量口径不参与换算。 */
  amountUnit: AmountUnit
  /** 项目单位：所选一级单位编码列表，请求参数 chooseYjdws；空数组表示全部单位。 */
  yjdws: string[]
  /** 省专业归口：所选省归口部门编码列表，请求参数 chooseZybms；空数组表示全部。 */
  zybms: string[]
}

/** 当前角色上下文，作为所有 /xmzl 接口的公共参数（userId/dwId/bmId/roleId/roleCode）。 */
export interface RoleContext {
  /** 选择权限的用户 id，后端据此判断按单位时是否返回二级单位。 */
  userId: string
  dwId: string
  bmId: string
  roleId: string
  roleCode: string
}

export interface OverviewYearOption {
  yearCode: string
  yearName: string
}

/** 筛选栏自绘下拉的一项：value 为提交值，label 为展示文案。 */
export interface OverviewSelectOption {
  value: string
  label: string
}

export interface OverviewStage {
  id: StageId
  title: string
  color: string
  icon: string
}

/** 穿透目标：合计不传阶段编码，阶段/子阶段传自身编码，标题用于弹窗；yssxId 由预算事项列表多选后传数组，不传表示全部事项。 */
export interface OverviewDrillTarget {
  jdbm?: StageId
  yssxId?: string[]
  title: string
}

export interface OverviewRow {
  code: string
  name: string
  values: Record<StageId, string | number | null>
  total: string | number | null
  ratios: Record<StageId, number | null>
}

export interface RankingRow {
  /** 单位/专业编码：点击排名柱形时作为 searchZybm 传给项目类型排名。 */
  id: string
  name: string
  /** 展示、提示与导出保留接口原值，仅绘图时由 ECharts 转换为数值。 */
  value: string | number | null
  /** 按当前排名全量数据现算占比；合计行不参与筛选。 */
  ratio?: number | null
  isTotal?: boolean
}

/** 阶段详情占比圆环的一行：扇区、顶部图例与圆心读数共用；id 即点击筛选时传给排名的取值（yslx / xmlxId）。 */
export interface DonutRow {
  id: string
  name: string
  color: string
  value: string | number | null | undefined
  /** 已格式化的占比文本（如 66.19%）。 */
  ratio: string
}

/**
 * 阶段平铺表的一行：接口按「单位 + 项目类型 + 预算类型」返回的一条原始记录，
 * 页面按「预算类型、项目类型、单位/专业、金额」平铺展示，不再透视成
 * 「行 = 单位、列 = 项目类型 × 预算类型」的交叉表。
 */
export interface WideTableRow {
  /** 行键：维度编码拼接页内下标，保证同页内唯一 */
  key: string
  /** 单位名称（按专业为专业部门名称） */
  name: string
  /** 项目类型名称 */
  category: string
  /** 预算类型名称（接口 yslx：1 省级统筹、2 市域统筹） */
  budget: string
  /** 当前统计口径下的原值：金额取 amount、数量取 num，保留接口原样，不换算不补零 */
  value: string | number | null
}
