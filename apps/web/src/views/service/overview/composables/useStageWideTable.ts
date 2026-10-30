import { computed, ref, watch } from 'vue'
import { exportGlkbByDw, exportGlkbByZybm, getGlDataByDw, getGlDataByZybm, getGlkbByDw, getGlkbByZybm } from '@/api/overview'
import type { GlkbExportParams, GlkbParams, GlkbRecord, OverviewGlData } from '@/api/overview'
import { apiExportHandle } from '@/utils/export'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, normalizePagedResult } from '../data/pagination'
import type { PagedResult } from '../data/pagination'
import { buildOverviewBaseParams, canQueryOverview, withOrgSearchType, withStage } from '../data/query'
import { createWideRows } from '../data/wide-table'
import { useAsyncTask } from './useAsyncTask'
import type { Dimension, OrgType, RoleContext, StageId, StatMode } from '../types'

export interface StageWideTableQuery {
  stageId: StageId
  year: string
  month: string
  /** 项目单位筛选（chooseYjdws）：所选一级单位编码，空数组表示全部。 */
  yjdws: string[]
  /** 省专业归口筛选（chooseZybms）：所选省归口部门编码，空数组表示全部。 */
  zybms: string[]
  dimension: Dimension
  orgType: OrgType
  /** 当前角色上下文，随宽表请求携带（dwId/bmId/roleId/roleCode）。 */
  roleContext: RoleContext
  /** 统计口径只切换展示的数值列，复用同一次响应，不重新请求。 */
  statMode: StatMode
}

/**
 * 阶段平铺明细表数据：选中卡片后切换到「表」时，用 getGlkbByDw / getGlkbByZybm
 * 按接口分页拉取「单位 + 项目类型 + 预算类型」记录，直接平铺展示，不做透视；
 * 导出改用 exportGlkbByDw / exportGlkbByZybm，由后端导出全部匹配记录。
 *
 * 分页数据与整阶段合计分成两个独立的查询任务：合计只在回到第 1 页（筛选变化）时刷新，
 * 翻页不会重复请求汇总接口，也不会因为在途的翻页响应而作废合计。
 */
export const useStageWideTable = (input: () => StageWideTableQuery) => {
  const page = ref(1)
  const pageSize = ref(DEFAULT_PAGE_SIZE)
  const pageData = useAsyncTask<PagedResult<GlkbRecord>>(() => ({ rows: [], total: null }))
  // 阶段合计取自 stage detail 的预算类型汇总接口（sumJe / sumSl），与宽表行同口径；
  // 分页只取当前页，无法用当前页求和得到整阶段合计。
  const summary = useAsyncTask<OverviewGlData | null>(() => null)

  const records = computed(() => pageData.data.value.rows)
  const rows = computed(() => createWideRows(records.value, input().statMode))
  // 接口未返回总条数时退化为「只有当前页」，分页条按已取到的条数展示。
  const total = computed(() => pageData.data.value.total ?? pageData.data.value.rows.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  /** 查询与导出共用同一组筛选条件：角色、年度/月度、项目单位 / 省专业归口、阶段与组织类型，不含分页。 */
  const buildFilterParams = (): GlkbExportParams | null => {
    const query = { ...input() }
    if (!canQueryOverview(query, { requireStage: true })) return null
    // 按单位带组织类型 searchType；按专业只传角色参数与年度/月度/阶段。
    return withOrgSearchType(withStage(buildOverviewBaseParams(query), query.stageId), query)
  }

  const buildParams = (targetPage: number, limit: number): GlkbParams | null => {
    const filterParams = buildFilterParams()
    return filterParams ? { ...filterParams, page: targetPage, limit } : null
  }

  const requestPage = (params: GlkbParams) => (input().dimension === 'specialty' ? getGlkbByZybm(params) : getGlkbByDw(params))
  const requestSummary = (params: GlkbExportParams) => (input().dimension === 'specialty' ? getGlDataByZybm(params) : getGlDataByDw(params))

  /**
   * 合计单独请求一次（与首页、阶段详情同源的汇总接口），避免为了合计把全部分页记录拉到前端；
   * 汇总失败时表格仍可浏览，合计与占比显示 `--`（错误只记录在本任务内，不阻塞表格）。
   */
  const loadSummary = async () => {
    const params = buildFilterParams()
    if (!params) return summary.reset()
    await summary.run(async () => {
      const result = await requestSummary(params)
      if (!result.success) throw new Error(result.msg || '阶段合计加载失败')
      return result.data ?? null
    }, '阶段合计加载失败')
  }

  const load = async () => {
    const params = buildParams(page.value, pageSize.value)
    if (!params) {
      pageData.reset()
      summary.reset()
      return
    }
    // 翻页只重新取当前页；合计在筛选变化（回到第 1 页）时刷新一次。
    if (page.value === 1) void loadSummary()
    await pageData.run(async () => {
      const result = await requestPage(params)
      if (!result.success) throw new Error(result.msg || '阶段明细数据加载失败')
      const normalized = normalizePagedResult<GlkbRecord>(result.data)
      const count = normalized.total
      return { rows: normalized.rows, total: count !== null && count >= 0 ? count : normalized.rows.length }
    }, '阶段明细数据加载失败，请重试')
  }

  const goPage = (target: number) => {
    const next = Math.min(Math.max(1, Math.trunc(target) || 1), pageCount.value)
    if (next === page.value) return
    page.value = next
    void load()
  }

  /** 切换每页条数回到第 1 页；条数即接口 limit。 */
  const changePageSize = (size: number) => {
    if (!PAGE_SIZES.includes(size) || size === pageSize.value) return
    pageSize.value = size
    page.value = 1
    void load()
  }

  /**
   * 导出整张明细表（不受当前页影响）：把当前筛选条件原样交给后端导出接口，
   * 不传 `page` / `limit`，由后端导出全部匹配记录后直接下载返回的文件。
   */
  const exportTable = (filename: string) => {
    const params = buildFilterParams()
    if (!params) throw new Error('缺少计划实施年度、阶段或单位条件，无法导出明细表')
    return apiExportHandle(params, filename, input().dimension === 'specialty' ? exportGlkbByZybm : exportGlkbByDw)
  }

  // 阶段、维度、组织类型、项目单位 / 省专业归口、年度月度或角色变化时回到第 1 页重新查询。
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
      () => input().roleContext.roleId
    ],
    () => {
      page.value = 1
      void load()
    },
    { immediate: true }
  )

  /** 当前统计口径下的阶段合计：金额取 sumJe、数量取 sumSl，保留接口原值。 */
  const summaryValue = computed(() => {
    const data = summary.data.value
    if (!data) return null
    return input().statMode === 'amount' ? data.sumJe : data.sumSl
  })

  return {
    rows,
    summaryValue,
    loading: pageData.loading,
    error: pageData.error,
    total,
    page,
    pageSize,
    pageCount,
    goPage,
    changePageSize,
    exportTable,
    reload: load
  }
}
