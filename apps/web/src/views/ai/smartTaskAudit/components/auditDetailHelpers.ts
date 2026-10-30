import MarkdownIt from 'markdown-it'
import type { ReviewTable, ReviewTableRaw, RuleReviewInfo, RuleReviewInfoRes } from '@/api/ai/smartTaskAudit'
import type { VxeGridProps } from 'vxe-table'

/** v-html 中后端按钮 id：同源目录 */
export const SOURCE_DIRECTORY_BUTTON_ID = 'sourceDirectory'
/** 同源目录页面路由（与历史 goToSourceDirectory 一致） */
export const SOURCE_DIRECTORY_PATH = '/suzhou/sourceDirectory/index'
/** v-html 中后端附件预览节点 class；点击后读 data-attach-id 预览 */
export const ATTACH_VIEW_CLASS = 'attachView'
/** v-html 中后端评审明细表 class；点击后打开结构化 reviewTable */
export const REVIEW_TABLE_CLASS = 'reviewTable'
/** v-html 中后端国网参考采购价格节点 class；点击后跳转物料价格库-国网参考采购价格 tab */
export const GW_PRICE_VIEW_CLASS = 'gwPriceView'
/** v-html 中后端历史项目领用物料单价节点 class；点击后跳转物料价格库-历史项目领用物料单价 tab */
export const MATERIAL_NEWEST_PRICE_VIEW_CLASS = 'materialNewestPriceView'
/** 附件预览节点上的附件 id 属性 */
export const ATTACH_ID_ATTR = 'data-attach-id'
/** 附件预览节点上的附件名称属性（预览标题/文件名） */
export const ATTACH_NAME_ATTR = 'data-attach-name'
/** v-html 中后端「疑似重复图片」节点属性：`data-image="本图文件uuid,命中目标文件uuid"`；
 *  本图与命中目标文件名两个 span 都带它，uuid 取行内第一个（本图）即可 */
export const IMAGE_COMPARE_ATTR = 'data-image'
/** v-html 中后端图片下载（预览）地址片段；旧格式的「命中目标文件名」是指向它的 <a>，新格式已改成带 data-image 的 span */
export const IMAGE_DOWNLOAD_HREF = 'ai/image/download'

export type AuditAttachViewPayload = {
  attachId: string
  /** 后端 data-attach-name，预览时作为附件名称 */
  attachName: string
}

export type AuditReviewTablePayload = {
  /** 当前 v-html 中标记表格的顺序，从 0 开始 */
  index: number
}

export type AuditPriceViewPayload = {
  /** 命中的价格查看节点类型：gwPriceView → 国网参考采购价格；materialNewestPriceView → 历史项目领用物料单价 */
  type: 'gwPriceView' | 'materialNewestPriceView'
}

export type AuditImageCompareItem = {
  /** 本图文件 uuid（data-image 第一个值） */
  imageUuid: string
  /** 命中目标文件 uuid（data-image 第二个值） */
  targetUuid: string
  /** 本图文件名（带 data-image 节点的文本） */
  imageName: string
  /** 命中目标文件名（同一行第二个 data-image 或图片下载链接的文本） */
  targetName: string
}

export type AuditImageComparePayload = {
  /** 当前 v-html 中所有可对比的图片组（按表格行顺序） */
  items: AuditImageCompareItem[]
  /** 被点击的那组在 items 里的下标 */
  index: number
}

export type AuditHtmlActionHandlers = {
  /** 命中 .attachView 时回调 */
  onAttachPreview?: (payload: AuditAttachViewPayload) => void
  /** 命中 table.reviewTable 时回调 */
  onReviewTableOpen?: (payload: AuditReviewTablePayload) => void
  /** 命中 .gwPriceView / .materialNewestPriceView 时回调 */
  onPriceViewNavigate?: (payload: AuditPriceViewPayload) => void
  /** 命中疑似重复图片（本图文件名 / 命中目标文件名）时回调，打开左右图片对比 */
  onImageCompare?: (payload: AuditImageComparePayload) => void
}

export const RERUN_POLL_MAX_ATTEMPTS = 40
export const RERUN_POLL_MAX_DURATION_MS = 10 * 60 * 1000

export type { ReviewTable, ReviewTableRaw }
export type ReviewTableValue = ReviewTableRaw
/** 归一化后的单表；列表接口 strip 后可能没有 reviewTable */
export type RuleReviewDetailItem = RuleReviewInfoRes &
  Partial<Pick<RuleReviewInfo, 'reviewConclude' | 'reviewProcess'>> & {
    reviewTable?: ReviewTable[]
  }
export type RuleReviewCardTone = 'success' | 'danger' | 'warning' | 'primary'

export type AuditSummaryRuleLevel = '1' | '2' | '3'
export type AuditSummaryLevelTone = 'danger' | 'warning' | 'primary'

export interface AuditSummaryLevelConfig {
  ruleLevel: AuditSummaryRuleLevel
  label: string
  tone: AuditSummaryLevelTone
}

/** 审核结论等级的统一口径：问题 / 隐患 / 异常。 */
export const auditSummaryLevelConfigs: readonly AuditSummaryLevelConfig[] = [
  { ruleLevel: '1', label: '发现问题数', tone: 'danger' },
  { ruleLevel: '2', label: '发现隐患数', tone: 'warning' },
  { ruleLevel: '3', label: '发现异常数', tone: 'primary' }
]

/**
 * 风险分级（问题 / 预警 / 异常）的统一口径 —— 顶部「总体评审情况」计数、左栏页签、
 * 审核要点的「规则等级」都用它。
 *
 * **以码值为准**（需求 2026-10-14 二次确认）：各接口下发 `ruleLevelName` 的用词不统一
 * （同一个码值 2，有的地方写「隐患」、有的写「预警」），按名称判会出现「同一档两种名字、
 * 颜色对不上」。所以等级名一律由码值映射：
 * 码值来自公共代码 AI_AUDIT_RULE_LEVEL_COM —— **1 问题 / 2 预警 / 3 异常**（顺序即码值顺序）。
 * 配色照 2026-10-14 的效果图：问题(红) → 预警(橙) → 异常(黄)。
 */
export const auditRiskLevelConfigs = [
  { code: '1', name: '问题', tone: 'danger' },
  { code: '2', name: '预警', tone: 'warning' },
  { code: '3', name: '异常', tone: 'yellow' }
] as const

export type AuditRiskLevelName = typeof auditRiskLevelConfigs[number]['name']

/**
 * 等级**码值** → 名称：等级的权威来源。
 * （接口只给 ruleLevelName、没给 ruleLevel 时才退回名称，见 getAuditRiskLevelName。）
 */
export const AUDIT_RISK_LEVEL_NAME_BY_CODE: Record<string, string> = { '1': '问题', '2': '预警', '3': '异常' }

/** 等级名称 → 配色 tone；未知名称返回空串（不硬套颜色） */
export const auditRiskLevelToneByName = (name: string): string => auditRiskLevelConfigs.find((item) => item.name === name)?.tone || ''

/** 等级码值 → 配色 tone；未知码值返回空串（分级标准弹层里字典项不在配置里时用中性样式） */
export const auditRiskLevelToneByCode = (code: string): string => auditRiskLevelConfigs.find((item) => String(item.code) === String(code))?.tone || ''

/**
 * 「总体评审情况」最右侧结论胶囊（AI预审通过/问题项目/隐患项目/异常项目/未分析…）的
 * 字典 tone → CSS 类名映射。workbenchView 与 smartTaskAudit 共用一份，避免两处各写一份后分叉
 * （此前 smartTaskAudit 缺 danger/yellow 分支，问题/异常/隐患三态全落橙色）。
 * CSS 侧对应 workbenchView/css/index.less 的 .conclusion-badge.{passed,danger,warning,yellow,waiting}。
 */
export const auditConclusionClass = (tone?: string): string => {
  if (tone === 'success') return 'passed'
  if (tone === 'info' || tone === 'primary-blue') return 'waiting'
  if (tone === 'danger') return 'danger'
  if (tone === 'yellow') return 'yellow'
  return 'warning'
}

/**
 * 取一条规则/要点的风险等级名：**优先 `ruleLevel` 码值**（1 问题 / 2 预警 / 3 异常），
 * 码值缺失才退回接口给的 `ruleLevelName`；两处都空返回空串（调用方据此决定是否渲染这一行）。
 *
 * 反过来（名称优先）会踩到「ruleLevelName 各接口用词不统一」：同一个码值 2 可能写成
 * 「隐患」，就会与页签/配色对不上（用户 2026-10-14 反馈）。
 */
export const getAuditRiskLevelName = (source: { ruleLevelName?: unknown; ruleLevel?: unknown } | null | undefined): string => {
  const byCode = AUDIT_RISK_LEVEL_NAME_BY_CODE[String(source?.ruleLevel ?? '').trim()]
  if (byCode) return byCode
  return String(source?.ruleLevelName ?? '').trim()
}

export const auditSummaryRuleLevelAliasMap: Record<string, AuditSummaryRuleLevel> = {
  problem: '1',
  risk: '2',
  abnormal: '3'
}

export interface RerunPollContext {
  taskId: string
  ruleClassify: string
  startedAt: number
  attempts: number
}

export interface NormalizedAuditSummaryData {
  auditConclude: string
  auditResult: string | number | null
  reviewTime: string | number
  ruleLevelFindNumList: any[]
}

export const createRerunPollContext = (taskId: string, ruleClassify: string, startedAt = Date.now()): RerunPollContext => ({
  taskId,
  ruleClassify,
  startedAt,
  attempts: 0
})

export const isSameRerunPollContext = (context: RerunPollContext | undefined, taskId: string, ruleClassify: string): context is RerunPollContext => {
  return Boolean(context && context.taskId === taskId && context.ruleClassify === ruleClassify)
}

export const hasRerunPollExpired = (context: RerunPollContext, now = Date.now()) => {
  return context.attempts >= RERUN_POLL_MAX_ATTEMPTS || now - context.startedAt > RERUN_POLL_MAX_DURATION_MS
}

export const normalizeAuditSummaryData = (data: any): NormalizedAuditSummaryData => {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  return {
    auditConclude: source.auditConclude ?? '',
    auditResult: source.auditResult ?? '',
    reviewTime: source.reviewTime ?? '',
    ruleLevelFindNumList: Array.isArray(source.ruleLevelFindNumList) ? source.ruleLevelFindNumList : []
  }
}

const hasValue = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== ''

export const isRuleReviewDetailComplete = (data: { reviewOpinion?: unknown } | null | undefined) => {
  return Boolean(data && hasValue(data.reviewOpinion))
}

const isPlainObject = (value: unknown): value is Record<string, any> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 解析可能被多次序列化的 JSON 字符串（含 \" 转义）。
 * 例：'[{"a":1}]'、'"[{\\"a\\":1}]"'
 */
export const parsePossiblyEscapedJson = (value: string): unknown => {
  let current: unknown = value.trim()
  if (!current) return undefined

  // 最多解包 4 层，避免异常数据死循环
  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== 'string') return current
    const text = current.trim()
    if (!text) return undefined

    try {
      current = JSON.parse(text)
      continue
    } catch {
      // 非标准二次转义：整段被 \\" 包住时，先还原一层引号再解析
      if (text.includes('\\"') || text.includes('\\\\')) {
        try {
          const unescaped = text.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          current = JSON.parse(unescaped)
          continue
        } catch {
          return undefined
        }
      }
      return undefined
    }
  }

  return current
}

/** 归一化单张表结构 */
export const normalizeReviewTable = (table: unknown): ReviewTable | undefined => {
  if (!table) return undefined

  if (typeof table === 'string') {
    const parsed = parsePossiblyEscapedJson(table)
    if (parsed === undefined || typeof parsed === 'string') return undefined
    // 字符串若解析为数组，取第一张有效表（单表语义的兜底）
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const normalized = normalizeReviewTable(item)
        if (normalized) return normalized
      }
      return undefined
    }
    return normalizeReviewTable(parsed)
  }

  if (!isPlainObject(table)) return undefined

  const source = table as Partial<ReviewTable>
  const columns = Array.isArray(source.columns) ? source.columns : []
  const rows = Array.isArray(source.rows) ? source.rows : []
  // 空壳对象不视为有效表
  if (!columns.length && !rows.length && !source.tableMeta) return undefined

  return {
    ...(source as ReviewTable),
    columns,
    rows,
    tableMeta: source.tableMeta && typeof source.tableMeta === 'object' ? source.tableMeta : { title: '' }
  }
}

/**
 * 将接口 reviewTable（字符串 / 单对象 / 数组）统一为 ReviewTable[]
 */
export const normalizeReviewTables = (table: ReviewTableValue): ReviewTable[] => {
  if (!table) return []

  if (typeof table === 'string') {
    const parsed = parsePossiblyEscapedJson(table)
    // 解包后仍是字符串说明解析失败，避免递归
    if (parsed === undefined || typeof parsed === 'string') return []
    return normalizeReviewTables(parsed as ReviewTableValue)
  }

  if (Array.isArray(table)) {
    return table.map((item) => normalizeReviewTable(item)).filter((item): item is ReviewTable => Boolean(item))
  }

  const single = normalizeReviewTable(table)
  return single ? [single] : []
}

export const normalizeRuleReviewDetail = (data: Partial<RuleReviewInfo>) => {
  const next = { ...data } as Partial<RuleReviewInfo> & { reviewTable?: ReviewTable[] }
  if ('reviewTable' in next) {
    next.reviewTable = normalizeReviewTables(next.reviewTable as ReviewTableValue)
  }
  return next
}

export const getReviewTableColumns = (table?: ReviewTable | ReviewTableValue) => {
  // 传入数组时取第一张；单表直接用
  const normalized = Array.isArray(table) ? table[0] : normalizeReviewTable(table)
  return (normalized?.columns || []).filter((column) => !column.hide && !column.hidden)
}

export const hasReviewTable = (table?: ReviewTableValue | ReviewTable[]) => {
  return normalizeReviewTables(table as ReviewTableValue).some((item) => getReviewTableColumns(item).length > 0 && (item.rows?.length || 0) > 0)
}

export const getReviewTables = (table?: ReviewTableValue | ReviewTable[]) => {
  return normalizeReviewTables(table as ReviewTableValue).filter((item) => getReviewTableColumns(item).length > 0 && (item.rows?.length || 0) > 0)
}

export const getReviewTableTitle = (table?: ReviewTable | ReviewTableValue, fallback = '分析明细') => {
  if (Array.isArray(table)) {
    return table[0]?.tableMeta?.title || fallback
  }
  if (table && typeof table === 'object' && !Array.isArray(table) && 'tableMeta' in table) {
    const title = (table as ReviewTable).tableMeta?.title
    if (title) return title
  }
  return normalizeReviewTable(table)?.tableMeta?.title || fallback
}

type ReviewGridColumn = NonNullable<VxeGridProps['columns']>[number]

/** 分析明细表最大高度，避免无界撑开 + 全量 DOM */
const REVIEW_GRID_MAX_HEIGHT = 360

export const getReviewGridOptions = (table?: ReviewTable | ReviewTableValue, fillHeight = false): VxeGridProps => {
  // 已归一化的单表直接使用，避免重复 parse
  const normalizedTable =
    table && typeof table === 'object' && !Array.isArray(table) && Array.isArray((table as ReviewTable).columns)
      ? (table as ReviewTable)
      : Array.isArray(table)
      ? table[0]
      : normalizeReviewTable(table)

  const rows = normalizedTable?.rows || []

  return {
    border: true,
    size: 'small',
    showOverflow: true,
    headerAlign: 'center',
    // 填充模式跟随可缩放弹窗重算尺寸；普通内嵌表仍限制最大高度
    autoResize: fillHeight,
    height: fillHeight ? '100%' : undefined,
    maxHeight: fillHeight ? undefined : REVIEW_GRID_MAX_HEIGHT,
    // 行数较多时启用虚拟滚动，降低 DOM 峰值
    scrollY: { enabled: true, gt: 30 },
    columnConfig: { resizable: true },
    columns: getReviewTableColumns(normalizedTable).map((column) => ({
      field: column.key,
      title: column.label,
      align: (column.align || 'left') as ReviewGridColumn['align'],
      // 列 align 会影响表头，需单独指定 headerAlign，保证表头居中
      headerAlign: 'center',
      width: column.width || undefined,
      fixed: (column.fixed || undefined) as ReviewGridColumn['fixed']
    })),
    data: rows
  }
}

const reviewRuleLevelToneMap: Record<string, RuleReviewCardTone> = {
  '1': 'danger',
  '2': 'warning',
  '3': 'primary',
  problem: 'danger',
  risk: 'warning',
  abnormal: 'primary'
}

export const getRuleReviewCardTone = (item: Pick<RuleReviewDetailItem, 'reviewOpinion' | 'ruleLevel'>): RuleReviewCardTone => {
  const reviewOpinion = String(item.reviewOpinion ?? '')
  if (reviewOpinion === '1') return 'success'
  const ruleLevelTone = reviewRuleLevelToneMap[String(item.ruleLevel ?? '')]
  if (ruleLevelTone) return ruleLevelTone
  return reviewOpinion === '0' ? 'danger' : 'success'
}

/** 以 hash 路由 + pop=true 的方式在新标签页打开内页（不推当前 Tabs） */
export const openPopPage = (path: string, query?: Record<string, string>) => {
  const queryString = query
    ? Object.entries(query)
        .filter(([, v]) => v !== '' && v != null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    : ''
  const url = `${location.origin}${location.pathname}${location.search}#${path}?pop=true${queryString ? `&${queryString}` : ''}`
  window.open(url, '_blank')
}

/** 新窗口打开同源目录（hash 路由 + pop=true 全屏内页，不推当前 Tabs） */
export const goToSourceDirectory = () => openPopPage(SOURCE_DIRECTORY_PATH)

/** 事件目标解析为 Element（点击文本节点时取 parentElement） */
const resolveEventElement = (event: Event): Element | null => {
  const raw = event.target
  if (raw instanceof Element) return raw
  if (raw instanceof Node) return raw.parentElement
  return null
}

/** 从事件目标向上查找标记表格，并按当前富文本容器中的出现顺序返回索引。 */
const getReviewTableIndexFromEvent = (event: Event): number | null => {
  const target = resolveEventElement(event)
  if (!target) return null

  const table = target.closest(`table.${REVIEW_TABLE_CLASS}`)
  const container = event.currentTarget
  if (!table || !(container instanceof Element)) return null

  const tables = Array.from(container.querySelectorAll(`table.${REVIEW_TABLE_CLASS}`))
  const index = tables.indexOf(table)
  return index >= 0 ? index : null
}

/** 从事件目标向上查找 .attachView，读取 data-attach-id / data-attach-name */
export const getAttachViewFromEvent = (event: Event): AuditAttachViewPayload | null => {
  const target = resolveEventElement(event)
  if (!target) return null

  const attachEl = target.closest(`.${ATTACH_VIEW_CLASS}`) as HTMLElement | null
  if (!attachEl) return null

  const attachId = String(attachEl.getAttribute(ATTACH_ID_ATTR) || attachEl.dataset.attachId || '').trim()
  if (!attachId) return null

  const attachName = String(attachEl.getAttribute(ATTACH_NAME_ATTR) || attachEl.dataset.attachName || '').trim()
  return { attachId, attachName }
}

/** 兼容：仅返回 attachId；完整信息请用 getAttachViewFromEvent */
export const getAttachViewIdFromEvent = (event: Event): string | null => {
  return getAttachViewFromEvent(event)?.attachId || null
}

/** 从一行表格里解析一组对比图片（第一个 data-image 带两个 uuid，第二个节点/下载链接只提供目标文件名） */
const toImageCompareItem = (row: Element): AuditImageCompareItem | null => {
  const hosts = Array.from(row.querySelectorAll(`[${IMAGE_COMPARE_ATTR}]`)) as HTMLElement[]
  const dataHost = hosts[0]
  if (!dataHost) return null

  const raw = String(dataHost.getAttribute(IMAGE_COMPARE_ATTR) || '').trim()
  const [imageUuid, targetUuid] = raw.split(',').map((item) => item.trim())
  if (!imageUuid || !targetUuid) return null

  const targetLink = row.querySelector(`a[href*="${IMAGE_DOWNLOAD_HREF}"]`) as HTMLAnchorElement | null
  return {
    imageUuid,
    targetUuid,
    imageName: String(dataHost.textContent || '').trim(),
    targetName: String((hosts[1] || targetLink)?.textContent || '').trim()
  }
}

/**
 * 从事件目标解出「疑似重复图片」对比信息（一次带回当前富文本里的全部图片组）。
 * - 本图文件名 / 命中目标文件名都可触发；
 * - uuid 取每行第一个 data-image；
 * - 返回的 index 是点击行在 items 里的位置，供弹层左右翻组。
 */
export const getImageCompareFromEvent = (event: Event): AuditImageComparePayload | null => {
  const target = resolveEventElement(event)
  if (!target) return null

  const clickedHost = target.closest(`[${IMAGE_COMPARE_ATTR}]`) as HTMLElement | null
  // 旧格式：命中目标文件名是 ai/image/download 链接，行内其它位置不触发
  const isTargetLink = Boolean(target.closest(`a[href*="${IMAGE_DOWNLOAD_HREF}"]`))
  if (!clickedHost && !isTargetLink) return null

  const row = (clickedHost || target).closest('tr')
  if (!row) return null

  // 当前 v-html 容器（点击委托挂在富文本根节点上）；拿不到时退回所在表格
  const container = event.currentTarget instanceof Element ? event.currentTarget : row.closest('table')
  const rows = container ? Array.from(container.querySelectorAll('tr')) : [row]

  const items: AuditImageCompareItem[] = []
  let index = -1
  rows.forEach((tr) => {
    const item = toImageCompareItem(tr)
    if (!item) return
    if (tr === row) index = items.length
    items.push(item)
  })

  if (!items.length) return null
  if (index < 0) {
    // 点击行没解析出图片组（理论上不会发生）：退回单组，避免弹层打不开
    const fallback = toImageCompareItem(row)
    return fallback ? { items: [fallback], index: 0 } : null
  }
  return { items, index }
}

/**
 * 处理 v-html 内点击：
 * 1) .attachView + data-attach-id → 附件预览（需传入 onAttachPreview）
 * 2) table.reviewTable → 打开结构化评审明细（需传入 onReviewTableOpen）
 * 3) .gwPriceView / .materialNewestPriceView → 跳转物料价格库对应 tab（需传入 onPriceViewNavigate）
 * 4) id=sourceDirectory → 跳转同源目录
 * 5) [data-image] / ai/image/download 链接 → 打开左右图片对比（需传入 onImageCompare）
 * @returns 是否已处理
 */
export const handleAuditHtmlActionClick = (event: Event, handlers?: AuditHtmlActionHandlers): boolean => {
  const target = resolveEventElement(event)
  if (!target) return false

  // 附件预览节点（后端可能下发多个）；仅在有回调时消费事件
  const attachView = getAttachViewFromEvent(event)
  if (attachView && handlers?.onAttachPreview) {
    event.preventDefault()
    event.stopPropagation()
    handlers.onAttachPreview(attachView)
    return true
  }

  const reviewTableIndex = getReviewTableIndexFromEvent(event)
  if (reviewTableIndex !== null && handlers?.onReviewTableOpen) {
    event.preventDefault()
    event.stopPropagation()
    handlers.onReviewTableOpen({ index: reviewTableIndex })
    return true
  }

  // 疑似重复图片：本图文件名（[data-image]）或命中目标文件名（行内下载链接）→ 打开左右对比弹层
  if (handlers?.onImageCompare) {
    const imageCompare = getImageCompareFromEvent(event)
    if (imageCompare) {
      event.preventDefault()
      event.stopPropagation()
      handlers.onImageCompare(imageCompare)
      return true
    }
  }

  // 价格查看节点：.gwPriceView → 国网参考采购价格；.materialNewestPriceView → 历史项目领用物料单价
  if (handlers?.onPriceViewNavigate) {
    const gwPriceEl = target.closest(`.${GW_PRICE_VIEW_CLASS}`) as HTMLElement | null
    if (gwPriceEl) {
      event.preventDefault()
      event.stopPropagation()
      handlers.onPriceViewNavigate({ type: 'gwPriceView' })
      return true
    }
    const materialNewestPriceEl = target.closest(`.${MATERIAL_NEWEST_PRICE_VIEW_CLASS}`) as HTMLElement | null
    if (materialNewestPriceEl) {
      event.preventDefault()
      event.stopPropagation()
      handlers.onPriceViewNavigate({ type: 'materialNewestPriceView' })
      return true
    }
  }

  // 优先 id，兼容 data-id / data-action
  const actionEl =
    (target.closest(`#${SOURCE_DIRECTORY_BUTTON_ID}`) as HTMLElement | null) ||
    (target.closest(`[data-id="${SOURCE_DIRECTORY_BUTTON_ID}"]`) as HTMLElement | null) ||
    (target.closest(`[data-action="${SOURCE_DIRECTORY_BUTTON_ID}"]`) as HTMLElement | null)

  if (!actionEl) return false

  event.preventDefault()
  event.stopPropagation()
  goToSourceDirectory()
  return true
}

// ---------- Markdown 渲染（智能识别，渲染结果与后端 HTML 均原样输出）----------

let markdownRenderer: MarkdownIt | null = null

/** 数字、百分数或括号之间的单个星号是乘号，不参与 Markdown 强调配对。 */
const isArithmeticAsterisk = (source: string, index: number): boolean =>
  source[index] === '*' && /[\d)%）％][ \t]*$/.test(source.slice(0, index)) && /^[ \t]*[+\-−]?[ \t]*(?:\d|\.\d|[（(])/.test(source.slice(index + 1))

export const getMarkdownRenderer = (): MarkdownIt => {
  if (!markdownRenderer) {
    markdownRenderer = new MarkdownIt({
      // 原文/审核内容可能同时包含 Markdown 与后端生成的 HTML，二者都直接渲染，不做清洗。
      html: true,
      breaks: true,
      linkify: true,
      typographer: false
    })

    markdownRenderer.inline.ruler.before('emphasis', 'arithmetic_asterisk', (state, silent) => {
      if (!isArithmeticAsterisk(state.src, state.pos)) return false
      if (!silent) state.pending += '*'
      state.pos += 1
      return true
    })

    // Markdown 表格外面包一层滚动容器：表格自适应内容区宽度，极端宽表（列数过多）时横向滚动。
    markdownRenderer.renderer.rules.table_open = (tokens, index, options, env, renderer) => {
      return `<div class="markdown-table-wrap">${renderer.renderToken(tokens, index, options)}`
    }
    markdownRenderer.renderer.rules.table_close = (tokens, index, options, env, renderer) => {
      return `${renderer.renderToken(tokens, index, options)}</div>`
    }
  }
  return markdownRenderer
}

/** 强调定界符与等价 HTML 标签 */
const emphasisTagMap: Record<string, [string, string]> = {
  '***': ['<strong><em>', '</em></strong>'],
  '**': ['<strong>', '</strong>'],
  __: ['<strong>', '</strong>'],
  '*': ['<em>', '</em>'],
  _: ['<em>', '</em>']
}

/**
 * CommonMark 规定：闭合定界符前一个字符是标点时，后一个字符必须是空白或标点，否则不构成右侧定界符。
 * 后端 / 模型产出的中文审核文本大量使用「**标签：**取值」，冒号后紧跟正文，
 * markdown-it 会把星号原样吐出（线上表现为 `**Top1 历史项目：**` 不加粗）。
 * 强调内容不允许再含 * 或 _，避免跨过同一行里已经合法的「**标签**：取值」配对。
 */
const markdownEmphasisBeforePunctPattern = /(\*\*\*|\*\*|__|\*|_)(?=[^\s*_])([^\n*_]+?)\1/g

const commonMarkPunctPattern = /[\p{P}\p{S}]/u

/** 代码块 / 行内代码 / HTML 标签内部不参与强调改写（split 保留捕获组，奇数段即受保护段） */
const markdownProtectedSegmentPattern = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`|<[^>\n]+>)/g

/** 把标点前闭合的强调改写成等价 HTML 标签；内容原样保留，其中的 markdown 仍会继续解析 */
const fixMarkdownEmphasisBeforePunct = (segment: string) =>
  segment.replace(markdownEmphasisBeforePunctPattern, (matched: string, delimiter: string, body: string, offset: number) => {
    // 先消费完整的强调对，再判断是否需要修复，避免把前一标题的闭合符当作下一对的开头。
    const after = segment.charAt(offset + matched.length)
    if (!commonMarkPunctPattern.test(body.slice(-1)) || !/[\p{L}\p{N}]/u.test(after)) return matched
    const before = offset > 0 ? segment[offset - 1] : ''
    // 例如 (5000*10)*100%：不能把乘号提前改写成 <em>，否则行内解析时已无法区分。
    if (delimiter === '*' && (isArithmeticAsterisk(segment, offset) || isArithmeticAsterisk(segment, offset + matched.length - 1))) {
      return matched
    }
    // 处在更长的定界符串或转义之后，交给 markdown-it 原样处理
    if (before === '*' || before === '_' || before === '\\') return matched
    // 左定界符合法性：内容以标点开头时，定界符前必须是行首 / 空白 / 标点，否则本就不构成强调
    const startsWithPunct = commonMarkPunctPattern.test(body.charAt(0))
    if (startsWithPunct && before !== '' && !/\s/.test(before) && !commonMarkPunctPattern.test(before)) return matched
    const tag = emphasisTagMap[delimiter]
    return tag ? `${tag[0]}${body}${tag[1]}` : matched
  })

/**
 * markdown-it 会把紧跟 HTML 结束标签的下一行并入 HTML block，
 * 标题、列表和粗体段落等 Markdown 内容需要空行隔开才会被解析。
 */
const separateMarkdownBlocksFromHtml = (source: string) =>
  source
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|<(?:pre|code|script|style|textarea)\b[^>]*>[\s\S]*?<\/(?:pre|code|script|style|textarea)\s*>)/gi)
    .map((segment, index) =>
      index % 2 === 1
        ? segment
        : segment.replace(/(<\/[a-z][^>]*>)[ \t]*\n(?=[ \t]{0,3}\S)/gi, (matched, closingTag, offset) => {
            const nextLine = segment.slice(offset + matched.length).split('\n', 1)[0]
            return looksLikeMarkdown(nextLine) ? `${closingTag}\n\n` : matched
          })
    )
    .join('')

/** 渲染前的 markdown 归一化：块级标记与后端 HTML 隔行 + 修复标点前闭合的强调 */
export const normalizeAuditMarkdown = (source: string) => {
  const normalized = separateMarkdownBlocksFromHtml(String(source ?? '').replace(/\r\n?/g, '\n'))
  return normalized
    .split(markdownProtectedSegmentPattern)
    .map((segment, index) => (index % 2 === 1 ? segment : fixMarkdownEmphasisBeforePunct(segment)))
    .join('')
}

const markdownLinePatterns: RegExp[] = [
  /^#{1,6}\s/,
  /^\s*[-*+]\s/,
  /^\s*\d+\.\s/,
  /^>\s?/,
  /^(-{3,}|\*{3,}|_{3,})\s*$/,
  /^\|.*\|\s*$/,
  /^\s*\|.*\|\s*$/
]

const markdownInlinePatterns: RegExp[] = [
  // 内容允许再含 * / _（如「**含 *嵌套* 的：**」），否则整段不会走 markdown 渲染
  /\*\*[^\s][\s\S]*?\*\*/,
  /__[^\s][\s\S]*?__/,
  /~~[^~]+~~/,
  /`[^`]+`/,
  /```[\s\S]*?```/,
  /!\[[^\]]*\]\([^)]*\)/,
  /\[[^\]]+\]\([^)]*\)/
]

export const looksLikeMarkdown = (text: string): boolean => {
  if (!text) return false

  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    for (const pattern of markdownLinePatterns) {
      if (pattern.test(trimmed)) return true
    }
  }

  for (const pattern of markdownInlinePatterns) {
    if (pattern.test(text)) return true
  }

  return false
}

/** 粗判是否含 HTML 标签；与 looksLikeMarkdown 一起决定是否按富文本渲染 */
export const looksLikeHtml = (text: string): boolean => /<\/?[a-z][^>]*>/i.test(text)

/** 结论、规则说明等字段可能是纯文本，也可能是 Markdown 或后端下发的 HTML */
export const isRichAuditText = (text: string | null | undefined): boolean => {
  const source = String(text ?? '')
  return Boolean(source) && (looksLikeMarkdown(source) || looksLikeHtml(source))
}

/** 在格式识别前还原富文本的 JSON 转义，修复表格标签与 style 粘连，不补写缺失内容。 */
export const normalizeAuditRichText = (source: string): string => {
  let normalized = source

  for (let depth = 0; depth < 4; depth += 1) {
    const trimmed = normalized.trim()
    const isQuoted = trimmed.startsWith('"') && trimmed.endsWith('"')
    const isEscapedHtml = /^<[a-z][^>]*=\\"/i.test(trimmed)
    if (!isQuoted && !isEscapedHtml) break

    const serialized = isQuoted ? trimmed : `"${normalized.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`
    try {
      const decoded: unknown = JSON.parse(serialized)
      if (typeof decoded !== 'string' || (!looksLikeHtml(decoded) && !looksLikeMarkdown(decoded))) break
      normalized = decoded
    } catch {
      break
    }
  }

  return normalized.replace(markdownProtectedSegmentPattern, (segment) =>
    segment.replace(/^<(table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col)(?=style\s*=)/i, '<$1 ')
  )
}

/** HTML 标签与注释；换行只在标签之间的文本里转换，标签本身原样保留 */
const htmlTokenPattern = /<!--[\s\S]*?-->|<\/?[^>]+>/g

/**
 * 评审富文本换行处理，与原白名单清洗保持一致：文本中的 \n 转成 <br/>。
 * 先折叠标签之间的空白，避免 Markdown 渲染出的块级标签之间多出空行。
 */
export const convertAuditHtmlLineBreaks = (html: string | null | undefined) => {
  const source = String(html ?? '')
    .replace(/>\s+</g, '><')
    .replace(/\r\n?/g, '\n')
    // <br> 标签后紧跟的换行会导致 \n → <br/> 时生成两个连续 <br/>，此处提前消掉
    .replace(/(<br\s*\/?>)\s*\n/gi, '$1')

  let output = ''
  let lastIndex = 0
  let match: RegExpExecArray | null
  htmlTokenPattern.lastIndex = 0

  while ((match = htmlTokenPattern.exec(source)) !== null) {
    output += source.slice(lastIndex, match.index).replace(/\n/g, '<br/>')
    output += match[0]
    lastIndex = htmlTokenPattern.lastIndex
  }

  output += source.slice(lastIndex).replace(/\n/g, '<br/>')
  return output
}

/**
 * 将评审富文本转换为标题、原生 tooltip 等纯文本场景可用的内容。
 * 用 DOMParser 解析到惰性文档，只取文本：不会加载图片、不会执行脚本。
 */
export const getAuditPlainText = (html: string | null | undefined) => {
  const source = String(html ?? '')
  if (!source) return ''
  const parsed = new DOMParser().parseFromString(source, 'text/html')
  return String(parsed.body?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
}

/* ---------------- 人工复核签章（需求 2026-10-20） ---------------- */

export type ManualReviewTone = 'passed' | 'failed'

/**
 * 一枚签章：**一个审核要点最多一枚**（复核记录与要点一一对应，不存在多条）。
 * 没做过人工复核时取值为 null，界面不盖章。
 */
export interface ManualReviewVerdict {
  tone: ManualReviewTone
  label: '通过' | '不通过'
  /** 人工填写的复核结论，用作签章的悬浮说明 */
  opinion?: string
}

/** 码值口径：1 通过 / 0 不通过（与复审接口 reviewConclusion 一致） */
const MANUAL_REVIEW_TONE_BY_CODE: Record<string, ManualReviewTone> = { '1': 'passed', '0': 'failed' }

/**
 * 复核结论 → 色调。
 * 以 `rgReviewOpinion` **码值**为准；码值缺失时才退回 `rgReviewOpinionName`，
 * 且名称**必须精确比对** —— 不能用 includes('通过')，否则「不通过」会被判成通过、盖反章。
 * 名称先去掉 HTML 标签再比对（后端可能下发富文本）。
 */
const getManualReviewTone = (code?: unknown, name?: unknown): ManualReviewTone | null => {
  const byCode = MANUAL_REVIEW_TONE_BY_CODE[String(code ?? '').trim()]
  if (byCode) return byCode
  const plainName = String(name ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plainName === '通过') return 'passed'
  if (plainName === '不通过') return 'failed'
  return null
}

/** 审核要点上承载人工复核信息的字段（listRuleReview 下发） */
export interface ManualReviewVerdictSource {
  /** 人工复核意见码值：0 不通过 / 1 通过（主判据） */
  rgReviewOpinion?: string
  /** 人工复核意见名称（通过 / 不通过）：仅码值缺失时兜底 */
  rgReviewOpinionName?: string
  /** 人工复核结论（人工填写的结论描述） */
  rgReviewConclude?: string
}

/**
 * 审核要点 → 人工复核签章。
 *
 * 先看 `rgReviewOpinion` 码值：`1` → 复核通过、`0` → 复核不通过；
 * 码值没给（或给了 0/1 以外的值）才按名称精确比对兜底。
 * 都判不出来 = 还没做过人工复核，返回 null（不盖章）。
 */
export const getManualReviewVerdict = (point?: ManualReviewVerdictSource | null): ManualReviewVerdict | null => {
  if (!point) return null
  const tone = getManualReviewTone(point.rgReviewOpinion, point.rgReviewOpinionName)
  if (!tone) return null
  const opinion = String(point.rgReviewConclude || '').trim()
  return {
    tone,
    label: tone === 'passed' ? '通过' : '不通过',
    opinion: opinion || undefined
  }
}
