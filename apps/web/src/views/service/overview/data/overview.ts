import demandPoolIcon from '@/assets/images/overview/demand-pool.png'
import jointReviewIcon from '@/assets/images/overview/joint-review.png'
import projectReserveIcon from '@/assets/images/overview/project-reserve.png'
import projectExecutionIcon from '@/assets/images/overview/project-execution.png'
import type { StageStatistics, StatisticValue } from '@/api/overview'
import type { AmountUnit, ChartSort, OrgType, OverviewStage, StageId } from '../types'

/**
 * 占比曲线默认显示配置的公共代码（随 OVERVIEW_PUBLIC_CODES 一次批量取回）。
 * 配置项的 code 为阶段编码，配置了哪些阶段就默认显示哪些占比曲线；
 * 未配置、配置为空或读取失败时只显示需求储备库的占比。
 * 若后端已有其它公共代码承载该配置，只需替换这里的 code，配置项含义保持一致。
 */
export const OVERVIEW_RATIO_PUBLIC_CODE = 'XMZL_RATIO_COM'

/**
 * 需求储备库阶段名称：阶段识别、占比曲线默认项与默认排序都以接口名称（jdmc）为准。
 * 阶段编码由后端决定（XQCBK、01 等任意编码均可），前端不写死也不换算编码。
 */
export const DEMAND_POOL_STAGE_NAME = '需求储备库'

/** 占比曲线未配置时的默认显示项：需求储备库名称键，由 resolveRatioStageIds 换成接口实际编码。 */
export const DEFAULT_RATIO_STAGE_IDS: StageId[] = [DEMAND_POOL_STAGE_NAME]

/** 图表及表格默认按需求储备库当前统计口径的占比降序；名称键由 resolveChartSort 换成接口实际编码。 */
export const DEFAULT_CHART_SORT: ChartSort = `ratio-${DEMAND_POOL_STAGE_NAME}`

/**
 * 「合计」排序：按行的合计金额/数量排序，不对应任何接口阶段（阶段编码不会等于 total）。
 * 接口没有「合计占比」，因此只提供数值排序选项，不提供占比选项。
 */
export const TOTAL_SORT_STAGE_ID = 'total'
export const TOTAL_SORT_LABEL = '合计'
export const TOTAL_CHART_SORT: ChartSort = `value-${TOTAL_SORT_STAGE_ID}`

/** 是否「合计」数值排序键：排序与文案都据此走合计分支。 */
export const isTotalChartSort = (sort: ChartSort): boolean => sort === TOTAL_CHART_SORT

/**
 * 默认排序的系统参数（getParamValueMulti）：值为排序键 `value-阶段编码` / `ratio-阶段编码`，
 * 如 ratio-XQCBK（需求储备库占比降序）、value-LHSH（联合会审当前金额/数量降序），编码与接口 jdbm 一致。
 * 未配置、格式非法或配置的阶段不存在时，维持 DEFAULT_CHART_SORT。
 */
export const OVERVIEW_DEFAULT_SORT_PARAM_KEY = 'XMZL_DEFAULT_SORT'

/** 系统参数 → 默认排序键：只接受 value-/ratio- 加非空阶段编码，其余返回 null 交给调用方兜底。 */
export const parseDefaultChartSort = (value: unknown): ChartSort | null => {
  if (value === undefined || value === null) return null
  const matched = /^(value|ratio)-(.+)$/.exec(String(value).trim())
  if (!matched) return null
  const stageId = matched[2].trim()
  if (!stageId) return null
  return `${matched[1]}-${stageId}` as ChartSort
}

/**
 * 金额单位默认值的系统参数（getParamValueMulti）：值为「万元」或「亿元」。
 * 未配置、读取失败或填写其它值时，维持默认「万元」。
 */
export const OVERVIEW_AMOUNT_UNIT_PARAM_KEY = 'XMZL_AMOUNT_UNIT'

/** 系统参数 → 金额单位：仅接受「万元」/「亿元」（忽略首尾空格），其余返回 null。 */
export const parseAmountUnit = (value: unknown): AmountUnit | null => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text === '万元' || text === '亿元' ? text : null
}

/** 公共代码 → 默认显示占比曲线的阶段编码：只接受非空 code，重复码值去重，空配置回落到需求储备库。 */
export const parseRatioStageIds = (data: unknown): StageId[] => {
  if (!Array.isArray(data)) return [...DEFAULT_RATIO_STAGE_IDS]
  const codes = data.map((item) => String((item as { code?: StatisticValue })?.code ?? '').trim()).filter((code) => !!code)
  return codes.length ? Array.from(new Set(codes)) : [...DEFAULT_RATIO_STAGE_IDS]
}

/** 阶段名称比较用的归一化：只去掉首尾空白，不做其它兼容（名称必须与接口 jdmc 一致）。 */
export const normalizeStageName = (name: string | null | undefined): string => String(name ?? '').trim()

/**
 * 四个业务阶段的语义配置：只按接口名称（jdmc）识别，不绑定阶段编码。
 * 后端用 XQCBK 这类业务编码还是别的编码都不影响颜色、图标与固定顺序；
 * 名称与接口不一致时可用 aliases 补充历史写法。
 */
interface StageDefinition {
  name: string
  aliases?: string[]
  color: string
  icon: string
}

const stageStyles: StageDefinition[] = [
  // 四个阶段色相拉开：绿（需求）、橙（会审）、青（储备）、蓝（立项），避免相近青绿在深色卡片上混在一起。
  { name: '需求储备库', aliases: ['项目需求库'], color: '#0e9f6e', icon: demandPoolIcon },
  { name: '联合会审', color: '#fd9554', icon: jointReviewIcon },
  { name: '项目储备库', color: '#1cced1', icon: projectReserveIcon },
  { name: '立项执行', color: '#1975f0', icon: projectExecutionIcon }
]

/** 阶段名称 → 业务阶段下标：支持别名，未命中返回 -1（按扩展阶段处理）。 */
const findStageStyleIndex = (name: string | null | undefined): number => {
  const target = normalizeStageName(name)
  if (!target) return -1
  return stageStyles.findIndex((style) => [style.name, ...(style.aliases ?? [])].some((alias) => normalizeStageName(alias) === target))
}

/** 阶段名称 → 图表中的实际阶段：按 jdmc 精确匹配，未命中返回 undefined。 */
const findStageByName = (name: string, stages: OverviewStage[]): OverviewStage | undefined => {
  const target = normalizeStageName(name)
  if (!target) return undefined
  return stages.find((stage) => normalizeStageName(stage.title) === target)
}

/** 语义键（阶段名称）→ 接口实际阶段：先按名称匹配，再按业务阶段别名（需求储备库 / 项目需求库）匹配。 */
const matchStage = (key: string, stages: OverviewStage[]): OverviewStage | undefined => {
  const byName = findStageByName(key, stages)
  if (byName) return byName
  const styleIndex = findStageStyleIndex(key)
  return styleIndex < 0 ? undefined : stages.find((stage) => findStageStyleIndex(stage.title) === styleIndex)
}

/**
 * 语义排序键 → 实际阶段编码的排序键（ratio-需求储备库 → ratio-XQCBK）。
 * 默认排序不写死阶段编码；键已经能对应到实际阶段时原样返回。
 */
export const resolveChartSort = (sort: ChartSort, stages: OverviewStage[]): ChartSort => {
  const prefix = sort.startsWith('value-') ? 'value-' : sort.startsWith('ratio-') ? 'ratio-' : ''
  if (!prefix || !stages.length) return sort
  const stage = matchStage(sort.slice(prefix.length), stages)
  return stage ? (`${prefix}${stage.id}` as ChartSort) : sort
}

/**
 * 公共代码配置的占比曲线阶段 → 当前图表数据中真实存在的阶段编码。
 * 配置项按 code 与接口 jdbm 精确比对，不做编码换算；未配置、配置为空、读取失败或
 * code 与接口阶段都对不上时回落到需求储备库（按 jdmc 名称识别），
 * 连需求储备库都不存在时展示全部占比曲线，避免默认曲线整组消失。
 */
export const resolveRatioStageIds = (configured: StageId[], stages: OverviewStage[]): StageId[] => {
  if (!stages.length) return configured.length ? [...configured] : [...DEFAULT_RATIO_STAGE_IDS]
  const actualIds = new Set(stages.map((stage) => stage.id))
  const matched = Array.from(new Set(configured.map((code) => String(code ?? '').trim()).filter((code) => actualIds.has(code))))
  if (matched.length) return matched
  const demandPool = matchStage(DEMAND_POOL_STAGE_NAME, stages)
  if (demandPool) return [demandPool.id]
  return stages.map((stage) => stage.id)
}

/**
 * 柱状图排序选项的公共代码：配置项 code 为阶段编码、name 为阶段名称
 * （如 需求储备库、联合会审、项目储备库、立项执行），每个阶段提供数值和占比两种排序选项，方向由前端切换。
 * 未配置、配置为空或读取失败时，下拉回落到图表接口返回的阶段列表。
 */
export const OVERVIEW_STAGE_SORT_PUBLIC_CODE = 'XMZL_STAGE_SORT_COM'

/** 组织类型切换的公共代码：name 为名称，码值 1 / 2 分别对应地市公司 / 直属单位。 */
export const OVERVIEW_ORG_TYPE_PUBLIC_CODE = 'XMZL_SEARCH_TYPE_COM'

/**
 * 总览页需要的全部公共代码：组织类型、占比曲线默认项与排序选项。
 * 三者由一次批量请求取回（getPublicCodesList），不再按 code 分别请求。
 */
export const OVERVIEW_PUBLIC_CODES: string[] = [OVERVIEW_ORG_TYPE_PUBLIC_CODE, OVERVIEW_RATIO_PUBLIC_CODE, OVERVIEW_STAGE_SORT_PUBLIC_CODE]

/**
 * 批量公共代码响应 → 指定 code 的配置项。
 * 接口按请求顺序返回 [{ comCode, codes }]，这里按 comCode 取值，不依赖返回顺序；
 * 未返回该 code 时视为空配置（与单 code 接口返回空数组一致）。
 */
export const pickPublicCodeItems = (data: unknown, code: string): unknown => {
  const list = Array.isArray(data) ? data : []
  const matched = list.find((item) => String((item as { comCode?: unknown })?.comCode ?? '') === code)
  const items = (matched as { codes?: unknown } | undefined)?.codes
  return items === undefined || items === null ? [] : items
}

export interface StageSortOption {
  id: StageId
  label: string
}

/** 公共代码 → 排序选项：忽略缺少编码或名称的配置项，重复码值只保留首次出现的名称。 */
export const parseStageSortOptions = (data: unknown): StageSortOption[] => {
  if (!Array.isArray(data)) return []
  const options = data
    .map((item) => {
      const record = item as { code?: StatisticValue; name?: unknown }
      return { id: String(record?.code ?? '').trim(), label: typeof record?.name === 'string' ? record.name.trim() : '' }
    })
    .filter((option) => !!option.id && !!option.label)
  return options.filter((option, index) => options.findIndex((item) => item.id === option.id) === index)
}

/** 全部组织类型（固定顺序），用于「全省」权限与权限标识异常时的兜底。 */
export const ALL_ORG_TYPES: OrgType[] = ['province', 'city', 'direct']

/** 单位属性编码：地市公司、部门本部、直属单位。 */
export const ORG_SCOPE_DWSX_IDS = {
  CITY: 'GSSX_GDGS',
  DEPARTMENT: 'GSSX_JGBB',
  DIRECT: 'GSSX_ZSDW'
} as const

/**
 * 权限组织范围 → 可展示的组织类型（getOrgFlag 返回的 orgFlag / dwsxId）：
 * - orgFlag 为 PROVINCE：展示全部（全省 / 地市公司 / 直属单位及本部）；
 * - 否则 dwsxId 为 GSSX_GDGS：只展示地市公司；
 * - dwsxId 为 GSSX_JGBB / GSSX_ZSDW：只展示直属单位及本部；
 * - 字段缺失或码值未知时回落到全部，避免权限标识异常导致组织类型切换为空、整页无数据
 *   （真实数据范围仍由后端按角色上下文控制）。
 */
export const resolveAllowedOrgTypes = (data: unknown): OrgType[] => {
  const record = (data && typeof data === 'object' ? data : {}) as { orgFlag?: unknown; dwsxId?: unknown }
  const orgFlag = String(record.orgFlag ?? '').trim()
  const dwsxId = String(record.dwsxId ?? '').trim()
  if (orgFlag === 'PROVINCE') return [...ALL_ORG_TYPES]
  if (dwsxId === ORG_SCOPE_DWSX_IDS.CITY) return ['city']
  if (dwsxId === ORG_SCOPE_DWSX_IDS.DEPARTMENT || dwsxId === ORG_SCOPE_DWSX_IDS.DIRECT) return ['direct']
  return [...ALL_ORG_TYPES]
}

/** 省财务预算专职角色编码：只有该角色可以点击柱形钻取下级单位/专业。 */
export const PROVINCE_BUDGET_ROLE_CODE = 'SCWYSZZ'

/**
 * 筛选栏是否收起「数据更新时间」：工具栏是 flex-wrap，条件胶囊又不参与收缩，
 * 条件区自然宽度 + 右侧操作区宽度一旦超过一行，整块操作区就会换到第二行（表现为更新时间换行）。
 * 这里按实测宽度判断是否需要先让更新时间与分隔线收起，把宽度留给条件。
 * @param pillsWidth 全部条件胶囊排成一行的宽度（含胶囊之间的间距）
 * @param actionsWidth 操作区完整宽度（含更新时间）
 * @param availableWidth 工具栏内容区宽度（已去掉左右内边距）
 * @param gap 条件区与操作区之间的间距
 */
export const shouldCollapseUpdateTime = (pillsWidth: number, actionsWidth: number, availableWidth: number, gap = 14): boolean => {
  // 亚像素取整与字体回退会让实际排版比宽度之和略宽，留 8px 余量，避免刚好卡在边界上仍换行。
  const WIDTH_SAFETY = 8
  if (!(availableWidth > 0)) return false
  const required = pillsWidth + (pillsWidth > 0 && actionsWidth > 0 ? gap : 0) + actionsWidth
  return required > availableWidth - WIDTH_SAFETY
}

/** 预算类型（阶段详情接口 yslx）：1 省级统筹、2 市域统筹；名称同时用于图例与筛选标识。 */
export const BUDGET_TYPE_NAMES: Record<string, string> = { '1': '省级统筹', '2': '市域统筹' }

export const getBudgetTypeName = (yslx: string) => BUDGET_TYPE_NAMES[yslx] || ''

/** 未占用的业务阶段样式：扩展阶段或重名阶段按此兜底，尽量不与已有阶段同色。 */
const pickFallbackStyleIndex = (used: Set<number>): number => {
  const free = stageStyles.findIndex((_, index) => !used.has(index))
  return free >= 0 ? free : used.size % stageStyles.length
}

export const createOverviewStages = (
  statistics: (Pick<StageStatistics, 'jdbm' | 'jdmc'> & { sort?: StatisticValue; sortCode?: StatisticValue })[]
): OverviewStage[] => {
  const uniqueStages = Array.from(new Map(statistics.map((stage) => [stage.jdbm, stage])).values())
  const entries = uniqueStages.map((stage) => ({ stage, styleIndex: findStageStyleIndex(stage.jdmc) }))
  entries.sort((a, b) => {
    // 四个业务阶段按名称固定顺序，扩展阶段排在其后并沿用接口排序。
    const order = (a.styleIndex < 0 ? stageStyles.length : a.styleIndex) - (b.styleIndex < 0 ? stageStyles.length : b.styleIndex)
    return order || Number(a.stage.sort ?? a.stage.sortCode ?? 0) - Number(b.stage.sort ?? b.stage.sortCode ?? 0)
  })
  const usedStyles = new Set<number>()
  return entries.map(({ stage, styleIndex }) => {
    const index = styleIndex >= 0 && !usedStyles.has(styleIndex) ? styleIndex : pickFallbackStyleIndex(usedStyles)
    usedStyles.add(index)
    const style = stageStyles[index]
    return { color: style.color, icon: style.icon, id: stage.jdbm, title: stage.jdmc }
  })
}
