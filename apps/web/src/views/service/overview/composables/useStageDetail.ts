import { watch } from 'vue'
import {
  getGlDataByDw,
  getGlDataByZybm,
  getGlDwpmByDw,
  getGlDwpmByZybm,
  getGlXmlxDataByDw,
  getGlXmlxDataByZybm,
  getGlXmlxpmByDw,
  getGlXmlxpmByZybm
} from '@/api/overview'
import type { GetGlParams, GetGlPmParams, OrderBy, OverviewGlData, OverviewRankData, OverviewXmlxData } from '@/api/overview'
import { buildOverviewBaseParams, canQueryOverview, withOrgSearchType, withStage } from '../data/query'
import { useAsyncTask } from './useAsyncTask'
import type { BudgetFilter, Dimension, OrgType, RoleContext, StageId, StatMode, ViewMode } from '../types'

export interface StageDetailQuery {
  stageId: StageId
  year: string
  month: string
  /** 项目单位筛选（chooseYjdws）：所选一级单位编码，空数组表示全部。 */
  yjdws: string[]
  /** 省专业归口筛选（chooseZybms）：所选省归口部门编码，空数组表示全部。 */
  zybms: string[]
  dimension: Dimension
  orgType: OrgType
  /** 当前角色上下文，随每个 getGl* 请求携带（dwId/bmId/roleId/roleCode）。 */
  roleContext: RoleContext
  /** 当前选中的项目类型，作为两个排名的 xmlxId。 */
  xmlxId: string
  /** 预算类型筛选（接口 yslx：1 省级统筹，2 市域统筹），只作用于两个排名。 */
  yslx: BudgetFilter
  /** 点击单位/专业排名柱形后传所点行 id，只用于筛选项目类型排名。 */
  searchZybm: string
  /** 统计口径，决定两个排名接口的 orderBy：1 金额，2 数量。 */
  statMode: StatMode
  /** 展示方式：切到「表」时四块详情不参与展示，也不发起请求，改由阶段宽表承载。 */
  viewMode: ViewMode
}

/**
 * 阶段详情下方的四块数据全部来自 getGl* 接口，参数只差维度、是否带 xmlxId、预算类型 yslx 与排名筛选 searchZybm。
 * 四块各自独立请求、独立记录在途请求号（见 useAsyncTask），避免某一块刷新时作废其它块的响应。
 * 两个饼图分别展示预算类型与项目类型全量，yslx / xmlxId 只传给后面的两块排名，互不筛选对方；
 * searchZybm 只由项目类型排名承接，用于点击单位/专业排名柱形后的筛选。
 */
export const useStageDetail = (input: () => StageDetailQuery) => {
  const gl = useAsyncTask<OverviewGlData | null>(() => null)
  const xmlx = useAsyncTask<OverviewXmlxData[]>(() => [])
  const dwRanking = useAsyncTask<OverviewRankData[]>(() => [])
  const xmlxRanking = useAsyncTask<OverviewRankData[]>(() => [])

  /** 四块接口共用的查询输入：角色、维度、组织类型、年度月度与两项筛选、最外层阶段。 */
  const baseInput = () => {
    const current = input()
    return {
      roleContext: current.roleContext,
      dimension: current.dimension,
      orgType: current.orgType,
      year: current.year,
      month: current.month,
      yjdws: current.yjdws,
      zybms: current.zybms,
      stageId: current.stageId
    }
  }

  const buildBase = (): GetGlParams | null => {
    const current = input()
    // 「表」模式由阶段宽表接口承载，四块详情不请求；切回「全览图」时随 watch 重新查询。
    if (current.viewMode !== 'chart') return null
    const query = baseInput()
    if (!canQueryOverview(query, { requireStage: true })) return null
    // 按单位带上组织类型 searchType；按专业沿用 getDataByZybm 的口径，角色上下文照旧全部携带。
    return withOrgSearchType(withStage(buildOverviewBaseParams(query), current.stageId), query)
  }

  // 两个饼图都展示全量：项目类型饼图不叠加预算类型 yslx，预算类型饼图也不叠加 xmlxId。
  const buildPm = (withSearchZybm = false): GetGlPmParams | null => {
    const base = buildBase()
    if (!base) return null
    const { statMode, xmlxId: category, yslx, searchZybm } = input()
    // 排名由后端按统计口径排序：1 按金额，2 按数量。
    const orderBy: OrderBy = statMode === 'amount' ? 1 : 2
    return {
      ...base,
      ...(yslx ? { yslx } : {}),
      ...(category ? { xmlxId: category } : {}),
      // searchZybm 是项目类型排名的下钻条件，单位/专业排名本身不受它影响。
      ...(withSearchZybm && searchZybm ? { searchZybm } : {}),
      orderBy
    }
  }

  /** 按维度选择接口：按专业走 getGl*ByZybm，其余走 getGl*ByDw。 */
  const isSpecialty = () => input().dimension === 'specialty'

  const loadGl = async () => {
    const params = buildBase()
    if (!params) return gl.reset()
    const specialty = isSpecialty()
    await gl.run(async () => {
      const result = specialty ? await getGlDataByZybm(params) : await getGlDataByDw(params)
      if (!result.success) throw new Error(result.msg || '预算类型数据加载失败')
      return result.data
    }, '预算类型数据加载失败，请重试')
  }

  const loadXmlxList = async () => {
    // 项目类型饼图始终展示全量项目类型，不叠加预算类型筛选。
    const params = buildBase()
    if (!params) return xmlx.reset()
    const specialty = isSpecialty()
    await xmlx.run(async () => {
      const result = specialty ? await getGlXmlxDataByZybm(params) : await getGlXmlxDataByDw(params)
      if (!result.success) throw new Error(result.msg || '项目类型数据加载失败')
      return Array.isArray(result.data) ? result.data : []
    }, '项目类型数据加载失败，请重试')
  }

  const loadDwRanking = async () => {
    const params = buildPm()
    if (!params) return dwRanking.reset()
    const specialty = isSpecialty()
    await dwRanking.run(async () => {
      const result = specialty ? await getGlDwpmByZybm(params) : await getGlDwpmByDw(params)
      if (!result.success) throw new Error(result.msg || '单位排名数据加载失败')
      return Array.isArray(result.data) ? result.data : []
    }, '单位排名数据加载失败，请重试')
  }

  const loadXmlxRanking = async () => {
    // 项目类型排名承接单位/专业排名的点击筛选，额外携带所点行 id。
    const params = buildPm(true)
    if (!params) return xmlxRanking.reset()
    const specialty = isSpecialty()
    await xmlxRanking.run(async () => {
      const result = specialty ? await getGlXmlxpmByZybm(params) : await getGlXmlxpmByDw(params)
      if (!result.success) throw new Error(result.msg || '项目类型排名数据加载失败')
      return Array.isArray(result.data) ? result.data : []
    }, '项目类型排名数据加载失败，请重试')
  }

  const refresh = () => {
    void loadGl()
    void loadXmlxList()
    void loadDwRanking()
    void loadXmlxRanking()
  }

  // 切换项目类型或预算类型都只影响两个排名，两个饼图复用各自的全量响应。
  const refreshRankings = () => {
    void loadDwRanking()
    void loadXmlxRanking()
  }

  watch(
    [
      () => input().stageId,
      () => input().year,
      () => input().month,
      () => input().yjdws,
      () => input().zybms,
      () => input().dimension,
      () => input().orgType,
      () => input().roleContext.userId,
      () => input().roleContext.dwId,
      () => input().roleContext.roleId,
      () => input().viewMode
    ],
    refresh,
    { immediate: true }
  )
  watch(() => input().xmlxId, refreshRankings)
  // 点击单位/专业排名柱形只刷新项目类型排名，单位/专业排名保持原顺序。
  watch(
    () => input().searchZybm,
    () => void loadXmlxRanking()
  )
  // 统计口径只影响两个排名的 orderBy，两个饼图复用同次响应。
  watch(() => input().statMode, refreshRankings)
  // 预算类型与项目类型各自只刷新两个排名；两个饼图之间不互相筛选。
  watch(() => input().yslx, refreshRankings)

  return {
    glData: gl.data,
    glLoading: gl.loading,
    glError: gl.error,
    xmlxList: xmlx.data,
    xmlxLoading: xmlx.loading,
    xmlxError: xmlx.error,
    dwRanking: dwRanking.data,
    dwRankingLoading: dwRanking.loading,
    dwRankingError: dwRanking.error,
    xmlxRanking: xmlxRanking.data,
    xmlxRankingLoading: xmlxRanking.loading,
    xmlxRankingError: xmlxRanking.error,
    reloadGl: loadGl,
    reloadXmlxList: loadXmlxList,
    reloadDwRanking: loadDwRanking,
    reloadXmlxRanking: loadXmlxRanking
  }
}
