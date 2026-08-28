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
/** 附件预览节点上的附件 id 属性 */
export const ATTACH_ID_ATTR = 'data-attach-id'
/** 附件预览节点上的附件名称属性（预览标题/文件名） */
export const ATTACH_NAME_ATTR = 'data-attach-name'

export type AuditAttachViewPayload = {
  attachId: string
  /** 后端 data-attach-name，预览时作为附件名称 */
  attachName: string
}

export type AuditReviewTablePayload = {
  /** 当前 v-html 中标记表格的顺序，从 0 开始 */
  index: number
}

export type AuditHtmlActionHandlers = {
  /** 命中 .attachView 时回调 */
  onAttachPreview?: (payload: AuditAttachViewPayload) => void
  /** 命中 table.reviewTable 时回调 */
  onReviewTableOpen?: (payload: AuditReviewTablePayload) => void
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

/** 新窗口打开同源目录（hash 路由 + pop=true 全屏内页，不推当前 Tabs） */
export const goToSourceDirectory = () => {
  const url = `${location.origin}${location.pathname}${location.search}#${SOURCE_DIRECTORY_PATH}?pop=true`
  window.open(url, '_blank')
}

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

/**
 * 处理 v-html 内点击：
 * 1) .attachView + data-attach-id → 附件预览（需传入 onAttachPreview）
 * 2) table.reviewTable → 打开结构化评审明细（需传入 onReviewTableOpen）
 * 3) id=sourceDirectory → 跳转同源目录
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

// ---------- Markdown 渲染（智能识别，复用 sanitizeAuditHtml 清洗）----------

let markdownRenderer: MarkdownIt | null = null

export const getMarkdownRenderer = (): MarkdownIt => {
  if (!markdownRenderer) {
    markdownRenderer = new MarkdownIt({
      // 原文/审核内容可能同时包含 Markdown 与后端生成的安全 HTML。
      // 渲染后仍会统一经过 sanitizeAuditHtml 白名单清洗。
      html: true,
      breaks: true,
      linkify: true,
      typographer: false
    })
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
const markdownEmphasisBeforePunctPattern = /(\*\*\*|\*\*|__|\*|_)(?=[^\s*_])([^\n*_]*?(?![*_])[\p{P}\p{S}])\1(?=[\p{L}\p{N}])/gu

const commonMarkPunctPattern = /[\p{P}\p{S}]/u

/** 代码块 / 行内代码 / HTML 标签内部不参与强调改写（split 保留捕获组，奇数段即受保护段） */
const markdownProtectedSegmentPattern = /(```[\s\S]*?```|`[^`\n]*`|<[^>\n]+>)/g

/** 把标点前闭合的强调改写成等价 HTML 标签；内容原样保留，其中的 markdown 仍会继续解析 */
const fixMarkdownEmphasisBeforePunct = (segment: string) =>
  segment.replace(markdownEmphasisBeforePunctPattern, (matched: string, delimiter: string, body: string, offset: number) => {
    const before = offset > 0 ? segment[offset - 1] : ''
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
 * `### 审核结论` 这类块级标记需要空行隔开才会被解析。
 */
const separateMarkdownBlocksFromHtml = (source: string) => source.replace(/(<\/[a-z][^>]*>)[ \t]*\n(?=\s{0,3}#{1,6}\s)/gi, '$1\n\n')

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

// ---------- 评审 HTML 白名单清洗（允许同源目录 button）----------

const allowedTags = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'button',
  'caption',
  'code',
  'del',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul'
])
const voidTags = new Set(['br', 'hr'])
const dangerousTags = [
  'base',
  'embed',
  'form',
  'iframe',
  'img',
  'input',
  'link',
  'math',
  'meta',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'textarea'
]
const dangerousTagGroup = dangerousTags.join('|')
const dangerousBlockPattern = new RegExp(`<\\s*(${dangerousTagGroup})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, 'gi')
const dangerousTagPattern = new RegExp(`<\\s*\\/?\\s*(?:${dangerousTagGroup})\\b[^>]*\\/?>`, 'gi')
const htmlTokenPattern = /<!--[\s\S]*?-->|<\/?[^>]+>/g
const attrPattern = /([:@\w-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))?/g
const namedEntityMap: Record<string, string> = {
  amp: '&',
  colon: ':',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'"
}

const escapeHtml = (value: string) => {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const escapeTextSegment = (value: string) => escapeHtml(value).replace(/\n/g, '<br/>')

const normalizeTagName = (value: string) => value.toLowerCase()

const unwrapAttrValue = (value = '') => {
  if (!value) return ''
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

const decodeHtmlEntitiesForUrl = (value: string) => {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, entity: string) => {
    const normalized = entity.toLowerCase()
    if (normalized.startsWith('#')) {
      const radix = normalized.startsWith('#x') ? 16 : 10
      const codePoint = Number.parseInt(normalized.slice(radix === 16 ? 2 : 1), radix)
      if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return ''
      return String.fromCodePoint(codePoint)
    }
    return namedEntityMap[normalized] ?? ''
  })
}

const isSafeHref = (value: string) => {
  const decoded = decodeHtmlEntitiesForUrl(value)
  const compact = decoded.replace(/[\u0000-\u001F\u007F\s]+/g, '').toLowerCase()
  return compact.startsWith('#') || /^https?:\/\//i.test(decoded.trim()) || /^mailto:/i.test(decoded.trim()) || /^tel:/i.test(decoded.trim())
}

const sanitizeNumericAttr = (value: string) => {
  const normalized = value.trim()
  if (!/^\d{1,2}$/.test(normalized)) return ''
  return normalized
}

const sanitizeAlignAttr = (value: string) => {
  const normalized = value.trim().toLowerCase()
  return ['left', 'center', 'right'].includes(normalized) ? normalized : ''
}

const normalizeStyleAttr = (value: string) => value.replace(/：/g, ':').replace(/；/g, ';').trim()

const isSourceDirectoryActionValue = (value: string) => value.trim() === SOURCE_DIRECTORY_BUTTON_ID

const sanitizeAttributes = (tagName: string, attrSource: string) => {
  const attrs: string[] = []
  const classMatch = attrSource.match(/(?:^|\s)class\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+)/i)
  const rawClassName = unwrapAttrValue(classMatch?.[1] || '')
  const isAttachView = rawClassName.split(/\s+/).includes(ATTACH_VIEW_CLASS)
  const isReviewTable = tagName === 'table' && rawClassName.split(/\s+/).includes(REVIEW_TABLE_CLASS)
  let match: RegExpExecArray | null
  attrPattern.lastIndex = 0

  while ((match = attrPattern.exec(attrSource)) !== null) {
    const attrName = match[1].toLowerCase()
    if (attrName.startsWith('on') || attrName === 'srcdoc') continue

    const attrValue = unwrapAttrValue(match[2] || '')

    // 同源目录 button：允许 id / data-id / data-action / type / class
    if (tagName === 'button') {
      if (isAttachView && (attrName === ATTACH_ID_ATTR || attrName === ATTACH_NAME_ATTR)) {
        if (attrValue.trim()) attrs.push(`${attrName}="${escapeHtml(attrValue.trim())}"`)
        continue
      }
      if (attrName === 'id' && isSourceDirectoryActionValue(attrValue)) {
        attrs.push(`id="${escapeHtml(attrValue)}"`)
        continue
      }
      if ((attrName === 'data-id' || attrName === 'data-action') && isSourceDirectoryActionValue(attrValue)) {
        attrs.push(`${attrName}="${escapeHtml(attrValue)}"`)
        continue
      }
      if (attrName === 'type') {
        const type = attrValue.trim().toLowerCase()
        if (type === 'button' || type === 'submit' || type === 'reset') {
          attrs.push(`type="${type}"`)
        }
        continue
      }
      if (attrName === 'class') {
        const cls = attrValue.replace(/[^\w\s\-]/g, '').trim()
        const safeClasses = cls.split(/\s+/).filter(Boolean)
        if (isAttachView && !safeClasses.includes(ATTACH_VIEW_CLASS)) safeClasses.push(ATTACH_VIEW_CLASS)
        if (safeClasses.length) attrs.push(`class="${escapeHtml(safeClasses.join(' '))}"`)
        continue
      }
      continue
    }

    if (attrName === 'class') {
      const safeClasses = [isAttachView ? ATTACH_VIEW_CLASS : '', isReviewTable ? REVIEW_TABLE_CLASS : ''].filter(Boolean)
      if (safeClasses.length) attrs.push(`class="${safeClasses.join(' ')}"`)
      continue
    }

    if (isAttachView && (attrName === ATTACH_ID_ATTR || attrName === ATTACH_NAME_ATTR)) {
      if (attrValue.trim()) attrs.push(`${attrName}="${escapeHtml(attrValue.trim())}"`)
      continue
    }

    if (attrName === 'style') {
      const value = normalizeStyleAttr(attrValue)
      if (value) attrs.push(`style="${escapeHtml(value)}"`)
      continue
    }

    if (tagName === 'a' && attrName === 'href') {
      if (!isSafeHref(attrValue)) continue
      attrs.push(`href="${escapeHtml(attrValue)}"`, 'target="_blank"', 'rel="noopener noreferrer"')
      continue
    }

    if ((tagName === 'td' || tagName === 'th') && (attrName === 'colspan' || attrName === 'rowspan')) {
      const value = sanitizeNumericAttr(attrValue)
      if (value) attrs.push(`${attrName}="${value}"`)
      continue
    }

    if ((tagName === 'td' || tagName === 'th' || tagName === 'p' || tagName === 'div') && attrName === 'align') {
      const value = sanitizeAlignAttr(attrValue)
      if (value) attrs.push(`align="${value}"`)
    }
  }

  // button 默认 type=button，避免被当成 submit
  if (tagName === 'button' && !attrs.some((item) => item.startsWith('type='))) {
    attrs.push('type="button"')
  }

  if (isReviewTable) {
    attrs.push('role="button"', 'tabindex="0"')
  }

  return attrs.length ? ` ${attrs.join(' ')}` : ''
}

const sanitizeTag = (token: string) => {
  if (token.startsWith('<!--')) return ''

  const closeMatch = token.match(/^<\s*\/\s*([a-z0-9-]+)\s*>$/i)
  if (closeMatch) {
    const tagName = normalizeTagName(closeMatch[1])
    return allowedTags.has(tagName) && !voidTags.has(tagName) ? `</${tagName}>` : ''
  }

  const openMatch = token.match(/^<\s*([a-z0-9-]+)([\s\S]*?)\/?\s*>$/i)
  if (!openMatch) return escapeTextSegment(token)

  const tagName = normalizeTagName(openMatch[1])
  if (!allowedTags.has(tagName)) return ''
  if (voidTags.has(tagName)) return `<${tagName}>`

  const attrs = sanitizeAttributes(tagName, openMatch[2] || '')
  const selfClosing = /\/\s*>$/.test(token)
  return `<${tagName}${attrs}${selfClosing ? '/>' : '>'}`
}

/**
 * 评审结论/过程 HTML 白名单清洗。
 * 允许安全排版标签，以及 id/data-id/data-action=sourceDirectory 的 button。
 */
export const sanitizeAuditHtml = (html: string | null | undefined) => {
  const source = String(html ?? '')
    .replace(dangerousBlockPattern, '')
    .replace(dangerousTagPattern, '')
    .replace(/>\s+</g, '><')
    .replace(/\r\n?/g, '\n')

  let output = ''
  let lastIndex = 0
  let match: RegExpExecArray | null
  htmlTokenPattern.lastIndex = 0

  while ((match = htmlTokenPattern.exec(source)) !== null) {
    output += escapeTextSegment(source.slice(lastIndex, match.index))
    output += sanitizeTag(match[0])
    lastIndex = htmlTokenPattern.lastIndex
  }

  output += escapeTextSegment(source.slice(lastIndex))
  return output
}

/** 将评审富文本转换为标题、原生 tooltip 等纯文本场景可用的内容。 */
export const getAuditPlainText = (html: string | null | undefined) => {
  const container = document.createElement('div')
  container.innerHTML = sanitizeAuditHtml(html)
  return String(container.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
}
