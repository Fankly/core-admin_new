import { computed, nextTick, provide, ref, unref, type Ref } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { usePolling } from '@/hooks/usePolling'
import {
  getDocDealStat,
  getOverviewStat,
  getRiskDistStatByRuleClassify,
  getRiskDistStatByRuleLevel,
  getRiskRankStat,
  getRuleStat,
  listRecentAudit
} from '@/api/ai/smartReviewHome'
import type { DocDealStat, OverviewStat, RecentAuditItem, RiskDistStatItem, RiskRankStatItem, RuleStatItem } from '@/api/ai/smartReviewHome'
import metricAuditProject from '@/assets/images/smart-review/smart-review-home/icons/icon-metric-audit-project-01.png'
import metricDeclaredAmount from '@/assets/images/smart-review/smart-review-home/icons/icon-metric-declared-amount-01.png'
import metricRiskProject from '@/assets/images/smart-review/smart-review-home/icons/icon-metric-risk-project-01.png'
import metricInterception from '@/assets/images/smart-review/smart-review-home/icons/icon-metric-interception-01.png'
import metricRiskItem from '@/assets/images/smart-review/smart-review-home/icons/icon-metric-risk-item-01.png'
import { formatAmount, formatCount, formatPercent, isApiSuccess, toNumber } from '../utils'

export interface MetricItem {
  key: string
  label: string
  value: string
  increment: string
  trending: boolean
  icon: string
}

export interface NamedCountItem {
  label: string
  value: number
  code?: string
}

export interface RiskItem {
  code: string
  label: string
  value: number
  percent: string
  color: string
}

export interface RankingItem {
  label: string
}

export interface AuditRow {
  code: string
  name: string
  year: string
  status: string
  audit_time: string
  /** 项目 id，打开 DetailModal 所需 */
  proId: string
  /** 审核任务 id，打开 DetailModal 所需 */
  taskId: string
  /** 项目类型 */
  proType: string
  raw?: RecentAuditItem
}

/** 规则级别颜色：问题 / 隐患 / 异常 */
const RISK_LEVEL_COLORS: Record<string, string> = {
  '1': '#fb4146',
  问题: '#fb4146',
  '2': '#ffa739',
  隐患: '#ffa739',
  '3': '#fbd54a',
  异常: '#fbd54a'
}

/** 规则分类颜色：必要性 / 经济性 / 合规性（主题色 #00a3ae + 国网绿） */
const RISK_TYPE_COLORS: Record<string, string> = {
  '1': '#00a3ae',
  必要性风险: '#00a3ae',
  必要性: '#00a3ae',
  '2': '#00a870',
  经济性风险: '#00a870',
  经济性: '#00a870',
  '3': '#ffad38',
  合规性风险: '#ffad38',
  合规性: '#ffad38'
}

const TYPE_COLOR_FALLBACK = ['#00a3ae', '#00a870', '#ffad38', '#5ec8d0']
const LEVEL_COLOR_FALLBACK = ['#fb4146', '#ffa739', '#fbd54a']

/** 总览指标字段映射（仅配置展示字段，数值一律来自后端） */
const METRIC_FIELD_MAP: Array<{
  key: string
  label: string
  icon: string
  totalKey: keyof OverviewStat
  addKey: keyof OverviewStat
  isAmount?: boolean
}> = [
  { key: 'ljshxmsl', label: '累计审核项目数量', icon: metricAuditProject, totalKey: 'ljshxmsl_total', addKey: 'ljshxmsl_add' },
  { key: 'ljxmsbje', label: '累计项目申报金额', icon: metricDeclaredAmount, totalKey: 'ljxmsbje_total', addKey: 'ljxmsbje_add', isAmount: true },
  { key: 'ljfxfxxmsl', label: '累计发现风险项目数量', icon: metricRiskProject, totalKey: 'ljfxfxxmsl_total', addKey: 'ljfxfxxmsl_add' },
  { key: 'ljqzljcs', label: '累计前置拦截次数', icon: metricInterception, totalKey: 'ljqzljcs_total', addKey: 'ljqzljcs_add' },
  { key: 'ljfxfxxsl', label: '累计发现风险项数量', icon: metricRiskItem, totalKey: 'ljfxfxxsl_total', addKey: 'ljfxfxxsl_add' }
]

/** 文档解析字段映射（字段语义固定，数值来自后端） */
const DOC_FIELD_MAP: Array<{ key: keyof DocDealStat; label: string }> = [
  { key: 'xmjys', label: '项目建议书' },
  { key: 'kybg', label: '可研报告' },
  { key: 'gss', label: '估算书' }
]

const toList = <T>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const nested = data.records || data.list || data.rows || data.data
    if (Array.isArray(nested)) return nested as T[]
  }
  return []
}

const toDisplayText = (value: any) => {
  if (value === undefined || value === null) return ''
  return String(value)
}

/** 总览：严格按 OverviewStat 字段，无后端数据时返回空列表 */
const mapOverviewMetrics = (data: OverviewStat | null | undefined): MetricItem[] => {
  if (!data || typeof data !== 'object') return []

  return METRIC_FIELD_MAP.map((field) => {
    const addRaw = data[field.addKey]
    const addNum = toNumber(addRaw, 0)
    return {
      key: field.key,
      label: field.label,
      value: field.isAmount ? formatAmount(data[field.totalKey]) : formatCount(data[field.totalKey]),
      increment: field.isAmount ? formatAmount(addRaw) : formatCount(addRaw),
      trending: addNum > 0,
      icon: field.icon
    }
  })
}

/** 规则库：{ code, name, count }[]，完全以后端列表为准 */
const mapRuleStats = (data: any): NamedCountItem[] => {
  return toList<RuleStatItem>(data).map((item) => ({
    code: toDisplayText(item.code),
    label: toDisplayText(item.name),
    value: toNumber(item.count, 0)
  }))
}

/** 文档解析：{ xmjys, kybg, gss, total }，无后端数据时返回空 */
const mapDocDealStat = (data: DocDealStat | null | undefined) => {
  if (!data || typeof data !== 'object') {
    return { total: 0, items: [] as NamedCountItem[] }
  }

  return {
    total: toNumber(data.total, 0),
    items: DOC_FIELD_MAP.map((field) => ({
      label: field.label,
      value: toNumber(data[field.key], 0)
    }))
  }
}

/**
 * 风险分布：{ code, name, count }[]
 * - name → 展示名称
 * - code → 编码（配色）
 * - count → 数量
 * 无数据时返回空数组，不使用本地占位
 */
const mapRiskDist = (data: any, isType = false): RiskItem[] => {
  const list = toList<RiskDistStatItem>(data)
  if (!list.length) return []

  const colorMap = isType ? RISK_TYPE_COLORS : RISK_LEVEL_COLORS
  const colorFallback = isType ? TYPE_COLOR_FALLBACK : LEVEL_COLOR_FALLBACK

  const items = list.map((item, index) => {
    const code = toDisplayText(item.code)
    const label = toDisplayText(item.name)
    const value = toNumber(item.count, 0)
    const color = colorMap[code] || colorMap[label] || colorFallback[index % colorFallback.length] || '#98a1a6'

    return { code, label, value, color }
  })

  const total = items.reduce((sum, item) => sum + item.value, 0)

  return items.map((item) => ({
    ...item,
    percent: formatPercent('', total, item.value)
  }))
}

/** 风险排名：仅使用 name，不使用 count */
const mapRankings = (data: any): RankingItem[] => {
  return toList<RiskRankStatItem>(data)
    .map((item) => ({ label: toDisplayText(item.name) }))
    .filter((item) => item.label)
}

/** 最近审核业务：字段原样映射，缺失显示为空 */
const mapRecentAudits = (data: any): AuditRow[] => {
  return toList<RecentAuditItem>(data).map((item) => {
    return {
      code: toDisplayText(item.xmbm),
      name: toDisplayText(item.xmmc),
      year: toDisplayText(item.jhssnd),
      status: toDisplayText(item.status),
      audit_time: toDisplayText(item.audit_time),
      proId: toDisplayText(item.xm_id),
      taskId: toDisplayText(item.task_id),
      proType: toDisplayText(item.pro_type),
      raw: item
    }
  })
}

/**
 * 静默模式（轮询）下不弹提示，仅告警，避免错误提示随轮询堆叠
 */
const unwrap = async <T>(request: Promise<any>, label: string, silent = false): Promise<T | null> => {
  const fail = (message: string) => {
    if (silent) {
      console.warn(`[smartReviewHome] ${message}`)
    } else {
      ElMessage.error(message)
    }
    return null
  }

  try {
    const res = await request
    if (!isApiSuccess(res)) {
      return fail(res?.msg || `${label}加载失败`)
    }
    return (res?.data ?? null) as T
  } catch (error: any) {
    return fail(error?.message || `${label}加载失败`)
  }
}

/** 快组：波动频繁的总览 / 最近审核 / 文档解析 */
const FAST_INTERVAL = 30 * 1000
/** 慢组：规则库与风险分布、排名，变化较慢 */
const SLOW_INTERVAL = 3 * 60 * 1000

/**
 * 值未变化时不写 ref，从源头避免下游图表重绘、表格重置
 * payload 均为几十条的小对象，序列化比对成本可忽略
 */
const assignIfChanged = <T>(target: Ref<T>, next: T) => {
  if (JSON.stringify(target.value) === JSON.stringify(next)) return false
  target.value = next
  return true
}

export const useSmartReviewHome = () => {
  const store = useStore()
  const loading = ref(false)
  const isShowPage = ref(false)
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const currentUserRole = ref<UserRole>({
    bmName: '',
    dwName: '',
    bmId: '',
    roleId: '',
    roleCode: '',
    dwId: '',
    specialOrgCode: '',
    spRoleId: ''
  })

  provide('currentUserRole', currentUserRole)
  provide(PermissionInjectionKey, {
    get permissions() {
      return unref(userRoleSelectorRef.value?.permissions) || []
    },
    get isLoading() {
      return Boolean(unref((userRoleSelectorRef.value as any)?.loading))
    }
  })

  /** 问候语取当前登录用户名称 */
  const userName = computed(() => store.getters.getUserMsg?.name || '')
  const greeting = computed(() => (userName.value ? `您好，${userName.value}` : '您好'))
  const metrics = ref<MetricItem[]>([])
  const rules = ref<NamedCountItem[]>([])
  const documentTotal = ref(0)
  const documentStats = ref<NamedCountItem[]>([])
  const riskLevels = ref<RiskItem[]>([])
  const riskTypes = ref<RiskItem[]>([])
  const rankings = ref<RankingItem[]>([])
  const auditRows = ref<AuditRow[]>([])

  /** 静默刷新中（轮询），不触发全页 loading 蒙层 */
  const refreshing = ref(false)
  /** 最近一次成功刷新时间，用于页面展示"更新于" */
  const lastUpdatedAt = ref(0)

  /**
   * 快组：总览、最近审核业务、文档解析
   * silent 时失败保留上一次数据，避免网络抖动把看板刷成空态
   */
  const loadFastGroup = async (silent: boolean) => {
    const [overview, docStat, recentList] = await Promise.all([
      unwrap<OverviewStat>(getOverviewStat(), '总览统计', silent),
      unwrap<DocDealStat>(getDocDealStat(), '文档解析统计', silent),
      unwrap<RecentAuditItem[]>(listRecentAudit({ limit: 20 }), '最近审核业务', silent)
    ])

    if (overview) {
      assignIfChanged(metrics, mapOverviewMetrics(overview))
    } else if (!silent) {
      metrics.value = []
    }

    if (docStat) {
      const mapped = mapDocDealStat(docStat)
      if (documentTotal.value !== mapped.total) documentTotal.value = mapped.total
      assignIfChanged(documentStats, mapped.items)
    } else if (!silent) {
      documentTotal.value = 0
      documentStats.value = []
    }

    if (recentList !== null) {
      assignIfChanged(auditRows, mapRecentAudits(recentList))
    } else if (!silent) {
      auditRows.value = []
    }
  }

  /** 慢组：规则库、风险分布、风险项排名 */
  const loadSlowGroup = async (silent: boolean) => {
    const [ruleStat, levelDist, typeDist, rankStat] = await Promise.all([
      unwrap<RuleStatItem[]>(getRuleStat(), '规则库统计', silent),
      unwrap<RiskDistStatItem[]>(getRiskDistStatByRuleLevel(), '风险级别分布', silent),
      unwrap<RiskDistStatItem[]>(getRiskDistStatByRuleClassify(), '风险类型分布', silent),
      unwrap<RiskRankStatItem[]>(getRiskRankStat({ limit: 10 }), '风险项排名', silent)
    ])

    if (ruleStat !== null) {
      assignIfChanged(rules, mapRuleStats(ruleStat))
    } else if (!silent) {
      rules.value = []
    }

    if (levelDist !== null) {
      assignIfChanged(riskLevels, mapRiskDist(levelDist, false))
    } else if (!silent) {
      riskLevels.value = []
    }

    if (typeDist !== null) {
      assignIfChanged(riskTypes, mapRiskDist(typeDist, true))
    } else if (!silent) {
      riskTypes.value = []
    }

    if (rankStat !== null) {
      assignIfChanged(rankings, mapRankings(rankStat))
    } else if (!silent) {
      rankings.value = []
    }
  }

  /**
   * @param options.silent 静默刷新：只置 refreshing，不动 loading，失败不清空数据
   * @param options.scope  刷新范围，轮询按分组刷新
   */
  const loadData = async (options: { silent?: boolean; scope?: 'all' | 'fast' | 'slow' } = {}) => {
    const { silent = false, scope = 'all' } = options
    if (silent) {
      refreshing.value = true
    } else {
      loading.value = true
    }

    try {
      const tasks: Promise<void>[] = []
      if (scope === 'all' || scope === 'fast') tasks.push(loadFastGroup(silent))
      if (scope === 'all' || scope === 'slow') tasks.push(loadSlowGroup(silent))
      await Promise.all(tasks)
      lastUpdatedAt.value = Date.now()
    } finally {
      if (silent) {
        refreshing.value = false
      } else {
        loading.value = false
      }
    }
  }

  const fastPolling = usePolling({
    task: () => loadData({ silent: true, scope: 'fast' }),
    interval: FAST_INTERVAL
  })

  const slowPolling = usePolling({
    task: () => loadData({ silent: true, scope: 'slow' }),
    interval: SLOW_INTERVAL
  })

  const startAutoRefresh = () => {
    fastPolling.start()
    slowPolling.start()
  }

  const stopAutoRefresh = () => {
    fastPolling.stop()
    slowPolling.stop()
  }

  /** 页面从 keep-alive 恢复：数据过期则补拉一次再恢复节奏 */
  const resumeAutoRefresh = async () => {
    if (!isShowPage.value) return
    const stale = fastPolling.isStale()
    startAutoRefresh()
    if (stale) await loadData({ silent: true, scope: 'fast' })
  }

  /** 手动刷新：全量静默刷新 */
  const refreshNow = () => loadData({ silent: true, scope: 'all' })

  /** 角色选择确认后才渲染页面并拉取数据 */
  const getRoleHandle = async () => {
    if (!userRoleSelectorRef.value) return
    isShowPage.value = Boolean(unref(userRoleSelectorRef.value.canRender))
    if (!isShowPage.value) return

    await nextTick()
    await loadData()
    startAutoRefresh()
  }

  return {
    isShowPage,
    userRoleSelectorRef,
    currentUserRole,
    getRoleHandle,
    userName,
    greeting,
    loading,
    refreshing,
    lastUpdatedAt,
    metrics,
    rules,
    documentTotal,
    documentStats,
    riskLevels,
    riskTypes,
    rankings,
    auditRows,
    loadData,
    startAutoRefresh,
    stopAutoRefresh,
    resumeAutoRefresh,
    refreshNow
  }
}
