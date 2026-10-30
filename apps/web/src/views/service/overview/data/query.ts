import type { SearchBy, SearchType, XmzlBaseParams } from '@/api/overview'
import type { Dimension, OrgType, OverviewFilters, RoleContext, StageId } from '../types'

/**
 * /xmzl 全页请求参数的唯一来源。
 *
 * 汇总、单位/专业统计、点击穿透、阶段详情、宽表与两个穿透弹窗都要携带同一组角色上下文与筛选
 * （`userId/dwId/bmId/roleId/roleCode`、`jhssnd`、`nd`/`yd`、`chooseYjdws`/`chooseZybms`、`searchBy`），
 * 过去每个调用点各写一遍，口径一旦改动就会漏改。这里把公共部分收敛成三个可组合的函数：
 *
 * 1. `buildOverviewBaseParams` —— 角色上下文 + 公共筛选，覆盖绝大多数接口；
 * 2. `withOrgSearchType` —— 只在「按单位」时追加组织类型 `searchType`；
 * 3. `withStage` —— 阶段详情 / 宽表追加最外层阶段编码 `jdbm`。
 *
 * 没被组合进去的字段（`orderBy`、`yslx`、`xmlxId`、`searchZybm`、`page`/`limit` 等）由调用方自行追加，
 * 保证每个接口只收到自己约定的参数。
 */

export interface OverviewQueryInput {
  roleContext: RoleContext
  dimension: Dimension
  /** 计划实施年度，请求参数 jhssnd。 */
  year: string
  /** 统计月份 YYYY-MM，空字符串表示全部月份。 */
  month: string
  /** 项目单位筛选，请求参数 chooseYjdws；未选传空数组。 */
  yjdws?: string[]
  /** 省专业归口筛选，请求参数 chooseZybms；未选传空数组。 */
  zybms?: string[]
  /** 组织类型：只有需要 searchType 的按单位接口才需要传。 */
  orgType?: OrgType
  /** 最外层阶段编码：只有阶段详情 / 宽表这类按阶段统计的接口才需要传。 */
  stageId?: StageId
}

/** 统计口径：1 按单位，2 按专业。全页所有接口共用同一个映射。 */
export const getSearchBy = (dimension: Dimension): SearchBy => (dimension === 'specialty' ? 2 : 1)

/** 组织类型 → 接口 searchType：全省传空值（不限单位类型），地市公司 1，直属单位 2。 */
export const ORG_TYPE_SEARCH_TYPES: Record<OrgType, SearchType> = {
  province: '',
  city: 1,
  direct: 2
}

export const getOrgTypeSearchType = (orgType: OrgType): SearchType => ORG_TYPE_SEARCH_TYPES[orgType]

/**
 * 月度日期 → 接口 nd / yd 参数，与计划实施年度 jhssnd 独立；清空时均传空字符串。
 * 无法识别时按「全部月份」处理而不抛错：调用点包括 computed 与渲染路径（穿透弹窗的请求参数），
 * 在那里抛异常会直接打断渲染，而取值本身只来自受控的月份面板。
 */
export const toMonthParams = (month: string): { nd: string; yd: string | number } => {
  const matched = /^(\d{4})-(\d{1,2})$/.exec(String(month ?? '').trim())
  if (!matched) return { nd: '', yd: '' }
  const monthNumber = Number(matched[2])
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return { nd: '', yd: '' }
  return { nd: matched[1], yd: monthNumber }
}

/**
 * 项目单位 / 省专业归口 → 全部 /xmzl 接口的公共筛选参数。
 * 两个条件都是多选，未选时按接口约定传空数组（表示不筛选）；这里复制数组，
 * 避免调用方后续修改筛选状态时影响已在途请求的请求体。
 * 组件未传这两个属性（如独立复用的子组件）时按「全部」处理，不抛错。
 */
export const toOrgFilterParams = (filters: Partial<Pick<OverviewFilters, 'yjdws' | 'zybms'>>): { chooseYjdws: string[]; chooseZybms: string[] } => ({
  chooseYjdws: [...(filters.yjdws ?? [])],
  chooseZybms: [...(filters.zybms ?? [])]
})

/**
 * 与角色无关的公共筛选参数：项目单位 / 省专业归口、年度、月份与统计口径。
 * 点击穿透接口的请求体不含 userId / roleCode，用这个函数拼筛选部分后再补自己的角色字段；
 * 参数类型只声明真正用到的字段，调用方传完整的查询输入也照样可用。
 */
export const buildOverviewFilterParams = (input: Pick<OverviewQueryInput, 'dimension' | 'year' | 'month' | 'yjdws' | 'zybms'>) => ({
  ...toOrgFilterParams(input),
  jhssnd: input.year,
  ...toMonthParams(input.month),
  searchBy: getSearchBy(input.dimension)
})

/** 全部 /xmzl 查询共用的参数：角色上下文 + 公共筛选参数。 */
export const buildOverviewBaseParams = (input: OverviewQueryInput): XmzlBaseParams => ({
  ...input.roleContext,
  ...buildOverviewFilterParams(input)
})

/**
 * 组织类型只对「按单位」生效：按专业沿用 getDataByZybm 的口径，不传 searchType。
 * 未提供 orgType 时原样返回，便于调用方在不关心组织类型的接口上复用同一个参数对象。
 */
export const withOrgSearchType = <T extends object>(
  params: T,
  input: Pick<OverviewQueryInput, 'dimension' | 'orgType'>
): T & { searchType?: SearchType } =>
  input.dimension === 'specialty' || !input.orgType ? params : { ...params, searchType: getOrgTypeSearchType(input.orgType) }

/** 阶段详情 / 宽表按最外层阶段统计；未传阶段时原样返回（合计与一级统计按全部阶段统计）。 */
export const withStage = <T extends object>(params: T, stageId?: StageId): T & { jdbm?: StageId } => (stageId ? { ...params, jdbm: stageId } : params)

/**
 * 查询前置条件：必须有计划实施年度；按单位还需要角色单位；阶段类查询还需要阶段编码。
 * 按专业不依赖 dwId（沿用 getDataByZybm 的口径），与各接口原有的空态判断保持一致。
 */
export const canQueryOverview = (input: OverviewQueryInput, options: { requireStage?: boolean } = {}): boolean => {
  if (!input.year) return false
  if (options.requireStage && !input.stageId) return false
  return input.dimension === 'specialty' ? true : !!input.roleContext.dwId
}
