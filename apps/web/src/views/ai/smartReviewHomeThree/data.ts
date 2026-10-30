/**
 * 智能成本项目评审工作台（三）—— 文案、视图模型映射与图表几何
 *
 * 数据来源已从原型写死的数据换成接口（契约见 docs/评审工作台文档.docx，接口层在
 * src/api/ai/smartReviewHomeThree/）：本文件只保留**与接口无关**的东西——
 * 文案、色板、格式化、以及把接口出参映射成页面视图模型的纯函数。
 *
 * 面板 ↔ 接口（与文档的三节一一对应）：
 * - 指标卡        ← getIndicatorStat（currentData 主数 + weekData 角标）
 * - 面板1 归口部门柱状 ← getAuditProStatByZgkbm（mode 1 数量 / 2 金额）
 * - 面板2 审核结果分布 ← getProReviewResult（按**审核意见**统计项目数量）
 * - 面板3 异常项排名   ← getTaskAbnormalRanking（按**要点**统计规则数量）
 * - 面板4 不通过率     ← getTaskReviewUnPass（按项目类型）
 * - 清单表格      ← getTaskPage
 */

// ==================== 顶栏 ====================

/** 顶部特性标签：照原型 3 枚，各一个色相（色值见 index.vue 的 .pill--*） */
export interface FeatureTag {
  text: string
  tone: 'teal' | 'blue' | 'violet'
}

export const FEATURE_TAGS: FeatureTag[] = [
  { text: '智能识别风险', tone: 'teal' },
  { text: '辅助决策建议', tone: 'blue' },
  { text: '数据驱动洞察', tone: 'violet' }
]

/** 页面标题（顶栏品牌位） */
export const PAGE_TITLE = '智能成本项目评审工作台'

/**
 * 「智能审核路径导览」的 8 个环节（第 8 步「升级审核能力」是原型 2026-10-14 版新增的）。
 * 纯导览动画，**不对应接口状态**（原型也是自己循环播放的演示）——页面上没有「当前跑到第几步」这种数据。
 */
export const REVIEW_STEPS = [
  '形成审核要点',
  '实现审核要点',
  '分配预算事项',
  '预处理项目文档',
  '执行审核要点检查',
  '输出智能审核结果',
  '开展人工复核',
  '升级审核能力'
]

/**
 * 每个环节的**责任角色**，与 REVIEW_STEPS 一一对应（顺序不能错）。
 * 对应环节文字前那枚 14px 小图标：色位与图标都跟着角色走
 * （色值落在 index.vue 的 `.role-icon--*`，图标由色位映射，见该文件的 ROLE_ICONS）。
 */
export interface ReviewStepRole {
  /** 角色全名（图标 title 提示用） */
  name: string
  /** 语义色位：决定字色 / 底色，同时是选图标的键 */
  tone: 'violet' | 'blue' | 'teal' | 'gray'
}

export const REVIEW_STEP_ROLES: ReviewStepRole[] = [
  { name: '业务专家', tone: 'violet' },
  { name: '运营人员', tone: 'blue' },
  { name: '运营人员', tone: 'blue' },
  { name: 'AI智能审核员', tone: 'teal' },
  { name: 'AI智能审核员', tone: 'teal' },
  { name: 'AI智能审核员', tone: 'teal' },
  { name: '一般使用者', tone: 'gray' },
  // 第 8 步「升级审核能力」也由 AI 执行（原型里是 icon-ai）
  { name: 'AI智能审核员', tone: 'teal' }
]

/**
 * 导览标题行右上角的**角色图例**：4 个角色各一枚（短名 专家 / 运营 / AI / 用户，
 * 最后一个 2026-10-14 由「复核」改为「用户」——对应「一般使用者」）。
 * 步骤标签里那枚小图标 = 谁执行，图例负责把它翻译成角色名 ——
 * 有图例之后，环节下方不再单独挂角色名徽标（原型 2026-10-13 版把两者合并了）。
 */
export interface ReviewStepLegend {
  /** 图例上的短名 */
  label: string
  /** 角色全名（hover 提示用） */
  name: string
  /** 色位：与 REVIEW_STEP_ROLES 同一套，决定图标与配色 */
  tone: ReviewStepRole['tone']
}

export const REVIEW_STEP_LEGENDS: ReviewStepLegend[] = [
  { label: '专家', name: '业务专家', tone: 'violet' },
  { label: '运营', name: '运营人员', tone: 'blue' },
  { label: 'AI', name: 'AI智能审核员', tone: 'teal' },
  { label: '用户', name: '一般使用者', tone: 'gray' }
]

// ==================== 指标卡 ====================

/** 卡片的取值维度：与接口字段一一对应（key 同时决定模板里的图标） */
export type MetricKey = 'project' | 'amount' | 'unpass' | 'abnormal' | 'passRate' | 'review'

export interface MetricCardMeta {
  key: MetricKey
  label: string
  /** 数字后缀（个 / % 等），无后缀的卡片不填 */
  unit?: string
  /**
   * 语义色调。'reject' = 负向指标，数字与角标走红色系（原型 `.stat.reject-stat`）。
   * 只有「不通过项目数」是负向的，其余卡片不填。
   */
  tone?: 'reject'
}

/**
 * 顺序与原型严格一致：AI审核项目 → AI审核项目金额 → 不通过项目数 → 识别异常项 → AI审核不通过率。
 * 「不通过项目数」是原型后加的一张卡，插在金额与识别异常项之间。
 * 数值本身来自 getIndicatorStat.currentData，见 buildMetricCards。
 */
export const METRIC_CARD_METAS: MetricCardMeta[] = [
  { key: 'project', label: 'AI审核项目', unit: '个' },
  { key: 'amount', label: 'AI审核项目金额' },
  { key: 'unpass', label: '不通过项目数', unit: '个', tone: 'reject' },
  { key: 'abnormal', label: '识别异常项', unit: '个' },
  { key: 'passRate', label: 'AI审核不通过率', unit: '%' },
  // 复核口径只有一个字段（接口的 pointReviewNum「识别待复核项」），落在卡4「审核要点复核情况」上。
  // 标签用「待复核项」而不是「人工复核数量」：这个数是**识别出来待复核**的，不等于已经复核过的量。
  { key: 'review', label: '待复核项', unit: '个' }
]

/** 接口侧的一组指标（AiIndicatorDataVO，字段见接口层） */
export interface IndicatorLike {
  projectNum: number
  projectAmount: number
  projectNopassNum: number
  pointNopassNum: number
  pointReviewNum: number
  pointRiskNum: number
  pointNum: number
  pointNopassRate: number
}

/** 已渲染的卡片：主数值 + 角标（角标取 weekData） */
export interface MetricCard extends MetricCardMeta {
  value: string
  cornerText: string
}

/** 千分位整数 */
const thousands = (value: number) => Math.round(value).toLocaleString('zh-CN')

/**
 * 金额：接口给的是**万元**（与清单列的「项目申报金额(万元)」同口径），
 * 原型卡片展示的是「亿」级，所以 ≥10000 万时换算成亿元，否则按万元显示。
 */
export const formatAmount = (wan: number): { value: string; unit: string } => {
  const amount = Number(wan) || 0
  if (Math.abs(amount) >= 10000) return { value: (amount / 10000).toFixed(1), unit: '亿' }
  return { value: thousands(amount), unit: '万' }
}

/**
 * 不通过率：文档示例（15/480 → 0.031）表明接口给的是**比值**，展示成百分数。
 * 万一后端改回百分数（>1），这里不再乘 100，免得出现 3100%。
 */
export const formatRate = (rate: number): string => {
  const value = Number(rate) || 0
  return (value > 1 ? value : value * 100).toFixed(1)
}

/** 一组指标 → 五张卡的数值；角标用 weekData 的对应项（接口没给「今日新增」这种增量） */
export const buildMetricCards = (current: IndicatorLike | null, week: IndicatorLike | null): MetricCard[] => {
  const amount = formatAmount(Number(current?.projectAmount) || 0)
  const weekAmount = formatAmount(Number(week?.projectAmount) || 0)
  const valueOf: Record<MetricKey, { value: string; unit?: string }> = {
    project: { value: thousands(Number(current?.projectNum) || 0), unit: '个' },
    amount: { value: amount.value, unit: amount.unit },
    unpass: { value: thousands(Number(current?.projectNopassNum) || 0), unit: '个' },
    // 文档：识别异常项 = 不通过项 + 待复核项
    abnormal: { value: thousands(Number(current?.pointRiskNum) || 0), unit: '个' },
    passRate: { value: formatRate(Number(current?.pointNopassRate) || 0), unit: '%' },
    review: { value: thousands(Number(current?.pointReviewNum) || 0), unit: '个' }
  }
  /**
   * 角标（本周新增）文案。
   * 只有「数量类」的卡片给：`AI审核不通过率` 不给——它的角标是百分比，
   * 和「新增多少个」不是一个量纲（需求 2026-09-28：这一条角标去掉）。
   * 空串表示不展示（模板里 `v-if="card.cornerText"`）。
   */
  const weekOf: Partial<Record<MetricKey, string>> = {
    project: `${thousands(Number(week?.projectNum) || 0)}个`,
    amount: `${weekAmount.value}${weekAmount.unit}`,
    unpass: `${thousands(Number(week?.projectNopassNum) || 0)}个`,
    abnormal: `${thousands(Number(week?.pointRiskNum) || 0)}个`
  }
  return METRIC_CARD_METAS.map((meta) => ({
    ...meta,
    unit: valueOf[meta.key].unit,
    value: valueOf[meta.key].value,
    cornerText: weekOf[meta.key] ? `本周新增：${weekOf[meta.key]}` : ''
  }))
}

// ==================== 面板1：AI审核项目（纵向柱状图，按金额/按数量可切换） ====================

/**
 * 归口部门维度。柱高按所选维度的最大值归一化，柱下方数字随维度切换，
 * 同时它也是清单表的筛选键（点柱 = 按归口部门过滤，与原型一致）。
 * 两个维度各取一次接口（mode=1 数量 / mode=2 金额），切换时不再请求。
 */
export interface DeptBar {
  /** 归口部门 ID（接口 zgkbm_id）—— 点柱子筛列表时当 gkbm 传给 getTaskPage，名称只用于展示 */
  id: string
  name: string
  /** 按金额的值（万元） */
  amount: number
  /** 按数量的值（个） */
  count: number
  amountText: string
  countText: string
}

/** 柱状图的两个维度，与原型 dimSelect 的 option value 一致 */
export type DeptBarDim = 'amount' | 'count'

/** 按维度取最大值归一化成柱高百分比（原型 renderBarDim 的算法：value / max * 100） */
export const buildDeptBarPercents = (items: DeptBar[], dim: DeptBarDim = 'amount'): number[] => {
  const max = items.reduce((m, item) => Math.max(m, item[dim]), 0)
  return items.map((item) => (max ? (item[dim] / max) * 100 : 0))
}

// ==================== 面板2：审核结果分布（环形图） ====================

export interface ResultItem {
  /** 维度名称（接口给的 reviewOpinionName） */
  name: string
  /** 审核意见码值（接口 reviewOpinion）—— 点扇区筛下方清单时作为 getTaskPage 的 reviewOpinion 入参 */
  code: string
  /** 数量（决定环段角度） */
  count: number
  /** 环段描边色（深档） */
  color: string
  /** 图例圆点与占比条的渐变起点色（浅档，照原型「浅→深」的双色做法） */
  light: string
}

/** 审核意见的一对色（浅档 / 深档） */
export interface ColorPair {
  light: string
  deep: string
}

/**
 * 结果分布的色板，按**审核意见名称**取色。
 * 文档在字段表里注明 reviewOpinionName「用这个」——数字标识在示例里与名称自相矛盾（3 配了「通过」），
 * 所以判据是名称而不是码值。
 *
 * 色相与清单里的状态徽标（StatusTone）同源：通过=青绿 / 待复核=琥珀 / 不通过=红 / 不执行=灰。
 * 这样「环上哪一段代表不通过」和「表里哪个 badge 是不通过」看起来是同一套语言。
 */
const OPINION_COLOR_BY_NAME: Record<string, ColorPair> = {
  通过: { light: '#5eead4', deep: '#0d9488' },
  待复核: { light: '#fcd34d', deep: '#f59e0b' },
  不通过: { light: '#fda4af', deep: '#e11d48' },
  不执行: { light: '#cbd5e1', deep: '#94a3b8' }
}

/** 接口没给过的名称时的兜底色板（按出现顺序循环） */
export const FALLBACK_COLORS: ColorPair[] = [
  { light: '#5eead4', deep: '#0d9488' },
  { light: '#93c5fd', deep: '#2563eb' },
  { light: '#a5f3fc', deep: '#06b6d4' },
  { light: '#c4b5fd', deep: '#7c3aed' },
  { light: '#fcd34d', deep: '#f59e0b' }
]

/** 名称优先取色，取不到按出现顺序兜底 */
export const opinionColor = (name: string, index = 0): ColorPair =>
  OPINION_COLOR_BY_NAME[String(name || '').trim()] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]

// ==================== 面板3：异常项排名（横向条） ====================

/** 横向条通用形状：面板3（排名）与面板4（不通过率）共用 */
export interface BarItem {
  name: string
  /** 数值：只用于条宽计算与排序，不直接展示 */
  value: number
  /**
   * 展示文案。后端已经把单位拼进字符串时（如不通过率的 `"23.5%"`）直接渲染，
   * 免得前端再补一个百分号变成 `23.5%%`；不传则按 value 原样展示。
   */
  valueText?: string
  /** 条体渐变起止色 */
  from: string
  to: string
  /** 悬浮提示（接口还给了规则数之类的附加信息，放在这里） */
  hint?: string
  /**
   * 规则 id（接口 ruleId，只有面板3「异常项排名」会给）。
   * 点条筛下方清单时作为 getTaskPage 的 ruleId 入参 —— 名称不可靠，接口就是按 id 查的。
   */
  ruleId?: string
}

/**
 * 横向条的渐变池：面板3（要点排名）与面板4（项目类型不通过率）共用，按出现顺序循环。
 * 接口给的都是**名称**（要点名 / 项目类型名），没有稳定码值可用来固化配色。
 * 起止色照原型 RANK_3_COLORS / RANK_4_COLORS 的色相（紫 / 青绿 / 青 / 蓝 / 琥珀）。
 */
export const BAR_GRADIENTS: ColorPair[] = [
  { light: '#c4b5fd', deep: '#7c3aed' },
  { light: '#5eead4', deep: '#0d9488' },
  { light: '#a5f3fc', deep: '#06b6d4' },
  { light: '#93c5fd', deep: '#2563eb' },
  { light: '#fcd34d', deep: '#f59e0b' }
]

/**
 * 卡1（AI预审项目）纵向柱状图的柱体渐变池，照原型 PALETTE_1 的色相与顺序。
 * 柱子数量随归口部门变化，所以配色按**下标循环**而不是写死在 CSS 的 nth-child 上
 * （写死的话多于 4 根柱子的部门就没有颜色了）。
 */
export const DEPT_BAR_GRADIENTS: ColorPair[] = [
  { light: '#5eead4', deep: '#0d9488' },
  { light: '#93c5fd', deep: '#2563eb' },
  { light: '#fcd34d', deep: '#f59e0b' },
  { light: '#a5f3fc', deep: '#06b6d4' }
]

/** 卡3「异动总计 / 涉及要点」的两个汇总数（都由接口出参现算，不额外请求） */
export interface RankSummary {
  /** 各要点数量之和 */
  total: number
  /** 涉及的要点数（= 有数值的行数） */
  pointCount: number
}

export const buildRankSummary = (items: BarItem[]): RankSummary => ({
  total: items.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
  pointCount: items.filter((item) => Number(item.value) > 0).length
})

// ==================== 卡4：审核要点复核情况（横向条，两个维度可切换） ====================

/**
 * 卡4 的一行：**两条量纲都留着**（复核数量 / 复核率），切换下拉只换读哪个字段 ——
 * 与卡1 的 DeptBar 同一做法，好处是切换维度不用重新请求。
 */
export interface PointReviewBar {
  /** 审核要点名称 */
  name: string
  /** 要点 id —— 点条筛下方清单时作为 getTaskPage 的 ruleId（接口按 id 查；名称可能重复/被截断） */
  ruleId: string
  /**
   * 该柱子背后的任务 id 清单（接口 2026-10-14 新增返参 `taskIdList`）。
   * 点条筛清单**用它**，不再下发 ruleId/reviewOpinionList —— 列表即这根柱子统计到的那批任务。
   */
  taskIdList: string[]
  /** 复核数量（个） */
  count: number
  /** 复核率（百分数值，如 92.5） */
  rate: number
  countText: string
  /** 复核率的展示文案（后端已把 % 拼进字符串时直接用，免得再补一个变成 %%） */
  rateText: string
  /** 条体渐变起止色 */
  from: string
  to: string
  hint?: string
}

/** 卡4 的两个维度，与下拉的 option value 一致 */
export type PointReviewDim = 'count' | 'rate'

/** 卡4 下拉的选项（照原型：按复核数量 / 按复核率） */
export const POINT_REVIEW_DIM_OPTIONS: { value: PointReviewDim; label: string }[] = [
  { value: 'count', label: '按复核数量' },
  { value: 'rate', label: '按复核率' }
]

/** 卡2 的维度（照原型：按专业） */
export type AbnormalDim = 'major'

/**
 * 卡2 下拉的选项。
 * 原型只有「按专业」这一项 —— 按专业细分异常项目的接口未落地，接口到位后再在这里补别的维度。
 */
export const ABNORMAL_DIMENSIONS: { value: AbnormalDim; label: string }[] = [{ value: 'major', label: '按专业' }]

/**
 * 卡4 的条宽百分比。
 * 两个维度的量纲不同，归一化方式也不同：
 * - 复核数量：按最大值归一化（最长一根为 100%），与卡3 的排行榜一致；
 * - 复核率：**直接用数值当宽度**（100% 就是满条）—— 归一化会把「92.5% 和 88.4%」拉成「100% 和 95.5%」，
 *   看不出真实水平，而复核率本身就是有绝对含义的百分比。
 */
export const buildPointReviewPercents = (items: PointReviewBar[], dim: PointReviewDim): number[] => {
  if (dim === 'rate') return items.map((item) => Math.min(Math.max(Number(item.rate) || 0, 0), 100))
  const max = items.reduce((m, item) => Math.max(m, Number(item.count) || 0), 0)
  return items.map((item) => (max ? ((Number(item.count) || 0) / max) * 100 : 0))
}

// ==================== 智能审核项目清单 ====================

/** AI审核结论：null 对应空单元格（尚未出结论） */
export interface AuditConclusion {
  text: string
  /** 语义色位，与项目状态/任务状态共用一套徽标配色 */
  tone: StatusTone
}

/**
 * 状态徽标的语义色位（项目状态 / 任务状态两列的 tag）。
 * 具体色值写在 index.vue 的 `.st6--*` 里 —— 只这一处用，放 CSS 便于与其它 pill 对齐；
 * 这里只表达「是哪种语义」，免得色值散落在 JS 与 CSS 两处。
 */
export type StatusTone = 'ok' | 'run' | 'wait' | 'fail' | 'neutral'

/** 状态徽标：null 对应空单元格（接口没给状态名） */
export interface StatusBadge {
  text: string
  tone: StatusTone
}

/**
 * AI 预审意见（接口的 `resultName`）的语义色位。
 * 与 StatusTone 分开列：取值集合不同（这四个是「AI 预审判出了什么」），
 * 色相确实与状态徽标共用一套，色值见 index.vue 的 `.badge--*` / `.dots--*`。
 */
export type ResultNameTone = 'gray' | 'red' | 'orange' | 'amber'

/**
 * 预审意见**码值**（接口 2026-10-14 新增的 `result` 字段）→ 色位。
 *
 * 色位一律**按码值判**，理由：字典 `AI_AUDIT_TASK_RESULT_COM` 的**真实名称**与接口文档
 * 「枚举说明」里的简称并不一致 ——
 *   文档枚举说明：10 无异常 / 20 问题 / 30 预警 / 40 异常
 *   字典实际值（2026-10-14 截图）：10 AI预审通过 / 20 问题项目 / 30 隐患项目 / 40 异常项目
 * 码值一致、名称不同。之前按名称判，`问题项目` 匹配不到 `问题`，标签就退化成灰色
 * （「问题项目不是红标签」就是这么来的）。0 未分析 / 1 分析中 也走灰。
 * 配色：10=灰、20=红、30=橙、40=黄（需求 2026-10-13 定的四档语义）。
 */
const RESULT_TONE_BY_CODE: Record<string, ResultNameTone> = {
  '0': 'gray',
  '1': 'gray',
  '10': 'gray',
  '20': 'red',
  '30': 'orange',
  '40': 'amber'
}

/**
 * 名称 → 色位。**只作兜底**：行上没有 `result` 码值（老接口/老数据）时才按名称猜，
 * 两种命名（文档简称与字典全称）都收，尽量避免再出现「名字对不上就变灰」。
 */
const RESULT_NAME_TONE: Record<string, ResultNameTone> = {
  无异常: 'gray',
  AI预审通过: 'gray',
  未分析: 'gray',
  分析中: 'gray',
  问题: 'red',
  问题项目: 'red',
  预警: 'orange',
  隐患项目: 'orange',
  异常: 'amber',
  异常项目: 'amber'
}

/** AI 预审意见徽标：null 对应空单元格。码值与名称都认不出的一律走灰 —— 宁可灰，也不给一个语义不对的颜色 */
export interface ResultNameBadge {
  text: string
  tone: ResultNameTone
}

/** `result`（码值，优先）→ 名称兜底 → 灰。名称仅用于展示文案，色位由码值定 */
const toResultNameBadge = (name: unknown, code: unknown): ResultNameBadge | null => {
  const text = String(name ?? '').trim()
  if (!text) return null
  const byCode = RESULT_TONE_BY_CODE[String(code ?? '').trim()]
  return { text, tone: byCode || RESULT_NAME_TONE[text] || 'gray' }
}

/** 清单行（页面视图模型；由接口的 AiAuditTaskVO 映射而来） */
export interface AuditRow {
  /** 行键（接口 taskId） */
  key: string
  /** 项目编码 */
  xmbm: string
  /** 项目名称 */
  xmmc: string
  /** 归口部门 —— 与柱状图/面板联动的键（接口 gkbmName） */
  dept: string
  /** 归口部门 ID —— 请求筛选用的是它 */
  deptId: string
  /** 一级单位 */
  yjdw: string
  /** 二级单位 */
  ejdw: string
  /** 项目类型 */
  proType: string
  /** 项目状态徽标（接口 flowStatusName，名称 → 语义色位） */
  flowStatusBadge: StatusBadge | null
  /** 任务状态徽标（接口 statusName） */
  taskStatusBadge: StatusBadge | null
  /** 预算事项 */
  budget: string
  /** 项目申报金额（万元），已格式化 */
  amount: string
  /** 计划实施年度 */
  jhssnd: string
  /** AI 审核时间 */
  auditTime: string
  /** 审核要点通过数（接口 passCnt，2026-10-20 新增） */
  passCnt: number
  /** 审核要点不通过数（接口 failCnt） */
  failCnt: number
  /** 审核要点待复核数（接口 pendingCnt） */
  pendingCnt: number
  /** 审核要点复核数（接口 reviewedCnt） */
  reviewedCnt: number
  /** 人工复核状态徽标（接口 manualReviewStatus + manualReviewStatusName） */
  manualReviewBadge: StatusBadge | null
  /**
   * AI 预审意见（接口 resultName）。
   * 列表上由它派生**两列**：徽标列（AI预审意见）与列首的三点指示（AI预算结果，三点同色）。
   * null 时两列都显示「–」。
   */
  resultNameBadge: ResultNameBadge | null
  conclusion: AuditConclusion | null
  /**
   * 原始接口行。展示层不消费，只供「查看」打开智能审核详情弹窗——
   * 那个弹窗（复用 smartTaskAudit 的 DetailModal）要 taskId / proId / proType 等原始字段，
   * 与其在视图模型里再复制一份，不如把原行带着。
   */
  raw: AuditRowLike
}

/** 接口行（只声明用到的字段，避免和接口层类型互相牵制） */
export interface AuditRowLike {
  taskId?: string | number
  xmbm?: string
  xmmc?: string
  gkbmId?: string
  gkbmName?: string
  yjdwName?: string
  ejdwName?: string
  proTypeName?: string
  /** 项目状态名称 —— 后端新增字段，接口文档的 AiAuditTaskVO 尚未列出 */
  flowStatusName?: string
  statusName?: string
  yssxName?: string
  amount?: string | number
  jhssnd?: string
  finishTime?: string
  /** AI 预审意见名称（后端字段 resultName）—— 展示文案，色位由 result 码值定 */
  resultName?: string
  /** AI 预审结论码值（后端字段 result，字典 AI_AUDIT_TASK_RESULT_COM）—— 20 问题(红) / 30 预警(橙) / 40 异常(黄) */
  result?: string
  reviewOpinion?: string
  reviewOpinionName?: string
  /* 审核要点复核统计（后端 2026-10-20 新增返参） */
  passCnt?: string | number
  failCnt?: string | number
  pendingCnt?: string | number
  reviewedCnt?: string | number
  /** 人工复核状态码值：1 待复核 / 2 部分复核 / 3 全部复核 */
  manualReviewStatus?: string
  manualReviewStatusName?: string
}

/** 审核意见 → 结论徽标的语义色位（0 不通过 / 1 通过 / 2 待复核 / 3 不执行） */
const OPINION_TONE: Record<string, StatusTone> = {
  '0': 'fail',
  '1': 'ok',
  '2': 'wait',
  '3': 'neutral'
}

/**
 * 项目状态 → 语义色位。名称取 commonCode/getFlowStatusTree（已批复 / 评审中 / 待评审）。
 * 接口只给 `flowStatusName`，没有码值可用，所以按**名称**取；名称没覆盖到一律走 neutral ——
 * 宁可灰，也不给一个语义不对的颜色（色值见 index.vue 的 .st6--*）。
 */
const FLOW_STATUS_TONE: Record<string, StatusTone> = {
  已批复: 'ok',
  评审中: 'run',
  待评审: 'wait'
}

/** 任务状态 → 语义色位（文档：1 待处理 / 2 处理中 / 3 已完成 / 4 处理失败） */
const TASK_STATUS_TONE: Record<string, StatusTone> = {
  待处理: 'neutral',
  处理中: 'run',
  已完成: 'ok',
  处理失败: 'fail'
}

/**
 * 人工复核状态 → 语义色位（接口码值：1 待复核 / 2 部分复核 / 3 全部复核）。
 * 码值优先、名称兜底：1 等待态灰蓝、2 进行态青绿、3 完成态绿。
 */
const MANUAL_REVIEW_TONE_BY_CODE: Record<string, StatusTone> = {
  '1': 'wait',
  '2': 'run',
  '3': 'ok'
}

const MANUAL_REVIEW_TONE_BY_NAME: Record<string, StatusTone> = {
  待复核: 'wait',
  部分复核: 'run',
  全部复核: 'ok'
}

const toManualReviewBadge = (name: unknown, code: unknown): StatusBadge | null => {
  const text = String(name ?? '').trim()
  if (!text) return null
  return { text, tone: MANUAL_REVIEW_TONE_BY_CODE[String(code ?? '').trim()] || MANUAL_REVIEW_TONE_BY_NAME[text] || 'neutral' }
}

/** 计数类字段：后端可能给 number / string / null，统一成非负整数（避免 NaN 或 -0 显示异常） */
const toCount = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? Math.max(0, Math.trunc(num)) : 0
}

/** 名称 → 徽标；空名称给 null（单元格显示「–」） */
const toStatusBadge = (name: unknown, toneMap: Record<string, StatusTone>): StatusBadge | null => {
  const text = String(name ?? '').trim()
  return text ? { text, tone: toneMap[text] || 'neutral' } : null
}

/** 接口行 → 视图行（序号按当前页顺序给；金额按「万元」格式化） */
export const toAuditRow = (row: AuditRowLike, index: number): AuditRow => ({
  key: String(row.taskId ?? index),
  xmbm: String(row.xmbm ?? ''),
  xmmc: String(row.xmmc ?? ''),
  dept: String(row.gkbmName ?? ''),
  deptId: String(row.gkbmId ?? ''),
  yjdw: String(row.yjdwName ?? ''),
  ejdw: String(row.ejdwName ?? ''),
  proType: String(row.proTypeName ?? ''),
  flowStatusBadge: toStatusBadge(row.flowStatusName, FLOW_STATUS_TONE),
  taskStatusBadge: toStatusBadge(row.statusName, TASK_STATUS_TONE),
  budget: String(row.yssxName ?? ''),
  amount: thousands(Number(row.amount) || 0) + (row.amount === undefined || row.amount === null ? '' : '.00'),
  jhssnd: String(row.jhssnd ?? ''),
  auditTime: String(row.finishTime ?? ''),
  passCnt: toCount(row.passCnt),
  failCnt: toCount(row.failCnt),
  pendingCnt: toCount(row.pendingCnt),
  reviewedCnt: toCount(row.reviewedCnt),
  manualReviewBadge: toManualReviewBadge(row.manualReviewStatusName, row.manualReviewStatus),
  resultNameBadge: toResultNameBadge(row.resultName, row.result),
  conclusion: row.reviewOpinionName
    ? { text: String(row.reviewOpinionName), tone: OPINION_TONE[String(row.reviewOpinion ?? '')] || 'neutral' }
    : null,
  raw: row
})

// ==================== 图表几何 ====================
// 原型用 ECharts 画四张图，这里按本文件一贯做法「几何由数据算 + 用 SVG/CSS 画」——
// 页面不引入 ECharts 实例（列/环都在模板里声明式渲染，点选联动直接挂原生事件，不必过 chart.on）。

/**
 * 环形图几何。
 * 用**环带**（圆 + stroke）而不是原型的实心扇区：原型环形图是 `radius: ['62%','84%']`
 * + `borderWidth: 3` 的分段圆环，用 stroke-dasharray 表达最直接，且段间白缝天然成立。
 * viewBox 120、中线半径 44、线宽 13 → 环带落在 37.5~50.5，比例约 62.5%~84%，与原型一致。
 */
export const DONUT_GEOMETRY = { size: 120, radius: 44, stroke: 13 }

/** 环带周长（dasharray 的满值） */
const DONUT_ARC = 2 * Math.PI * DONUT_GEOMETRY.radius
/** 段间留白（SVG 单位），对应原型 itemStyle.borderWidth: 3 的白缝 */
const DONUT_GAP = 5

export interface DonutSegment extends ResultItem {
  /** 占比数值与已格式化的文案 */
  percent: number
  percentText: string
  /** stroke-dasharray：实线段长度 + 其余留白 */
  dash: string
  /** stroke-dashoffset：负值把实线段推到累计起点（配合 rotate(-90) 从 12 点方向顺时针排） */
  offset: number
}

/**
 * 环段按 count 占比切分。
 * 每段从累计起点前挪半个留白，段落之间就有均匀的缝；极小占比保底 0.6 单位，免得整段消失。
 */
export const buildDonutSegments = (items: ResultItem[] = []): DonutSegment[] => {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  if (!total) return []
  let cursor = 0
  return items.map((item) => {
    const arc = (item.count / total) * DONUT_ARC
    const segment = Math.max(arc - DONUT_GAP, 0.6)
    const result: DonutSegment = {
      ...item,
      percent: (item.count / total) * 100,
      percentText: ((item.count / total) * 100).toFixed(1),
      dash: `${segment.toFixed(2)} ${(DONUT_ARC - segment).toFixed(2)}`,
      offset: -(cursor + DONUT_GAP / 2)
    }
    cursor += arc
    return result
  })
}

/** 横向条的宽度百分比（按最大值归一化，最长一根为 100%） */
export const buildBarPercents = (items: { value: number }[]): number[] => {
  const max = items.reduce((m, item) => Math.max(m, item.value), 0)
  return items.map((item) => (max ? (item.value / max) * 100 : 0))
}

/** 渐变填充的 CSS 值（排名条 / 不通过率条 / 图例占比条用） */
export const barGradient = (from: string, to: string): string => `linear-gradient(90deg, ${from}, ${to})`
