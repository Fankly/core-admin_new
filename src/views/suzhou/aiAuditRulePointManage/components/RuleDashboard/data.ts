/**
 * 智能审核规则看板 —— 展示元数据（维度定义、配色策略、联动字段映射）
 *
 * 数据源已换成接口：`@/api/suzhou/aiAuditRuleMonitoring` 的一~六号接口
 * （规则分布 / 应用项目分布 / 应用项目分布事项明细 / 智能审核项目数量 /
 *  智能审核项目文件明细 / 审核要点异动排名）。
 * 原来移植自原型的那批演示数据集（RULE_DIST / PROJECT_TYPE_DIST / DOC_TYPE_DIST /
 * RISK_RANKING / RISK_PROJECTS / *_ITEMS）已删除——它们只在无接口时兜底，
 * 留着会让人分不清哪个数字是真的。
 */

/**
 * 图表配色：**逐个对齐最新原型 `docs/1009/智能审核规则v2.html`** 里各图表的 itemStyle 色值
 * （需求 2026-10-15：只同步「底色 + 图表颜色 + 数值样式」三处）。
 *
 * v2 改成「每张卡一个色系」：卡1 蓝、卡2 蓝/紫/青/绿、卡3 蓝/紫/青、卡4 橙色系由深到浅，
 * 不再是上一版的青绿族 + 琥珀。⚠️ 这里仍是有意放宽 H2/H5 的例外（照原型用色，2026-09-24 确认）。
 * 卡片之间**不共用**色板，各自按原型顺序循环（条目多于原型时循环取色）。
 * 要改回主色体系，只改这一个常量即可。
 */
export const CHART_PALETTE = {
  /** 卡片2 应用项目分布（v2 projectTypeData：蓝 / 紫 / 青 / 绿） */
  projectDist: ['#60a5fa', '#a78bfa', '#22d3ee', '#34d399'],
  /** 卡片3 智能审核·文件解析（v2 docTypeData：蓝 / 紫 / 青） */
  docDist: ['#60a5fa', '#a78bfa', '#22d3ee'],
  /**
   * 卡片4 审核要点异动排名（v2 riskColorRamp：橙色系由深到浅）。
   * 原型注释「按风险严重程度做同色系深浅，弱化『排行榜』观感」——第一名最深。
   */
  riskRank: ['#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74'],
  /** 卡片1 维度「按分类」（v2 ruleData.category：蓝 / 紫） */
  category: ['#60a5fa', '#a78bfa'],
  /** 卡片1 维度「按专业」（v2 ruleData.business：蓝 / 紫 / 绿 / 琥珀） */
  business: ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24']
}

/** 通用分布项：环形图/柱图的数据点 */
export interface DistItem {
  name: string
  value: number
  color: string
}

/** 规则分布的四个维度。label 必须与接口 pieChartData[].name 逐字一致 */
export type RuleDistKey = 'status' | 'level' | 'category' | 'business'

export const RULE_DIST_DIMENSIONS: { key: RuleDistKey; label: string; fieldLabel: string }[] = [
  { key: 'status', label: '按状态', fieldLabel: '规则状态' },
  { key: 'level', label: '按级别', fieldLabel: '规则级别' },
  { key: 'category', label: '按分类', fieldLabel: '规则分类' },
  { key: 'business', label: '按专业', fieldLabel: '规则专业' }
]

/** 接口返回的维度名 → 内部维度 key。接口给了没见过的维度名时会被跳过 */
export const RULE_DIM_BY_API_NAME: Record<string, RuleDistKey> = {
  按状态: 'status',
  按级别: 'level',
  按分类: 'category',
  按专业: 'business'
}

/**
 * 看板维度 → 主表 `searchColumns` 里的字段名。四个维度都要有落点，否则点扇区只能提示、联动不了。
 *
 * 「按专业」落在主表的**适用专业**（`ruleMajor`）上：接口的规则业务与主表的适用专业是同一个字段，
 * 两边共用 `AI_AUDIT_RULE_MAJOR_COM` 的码值（COMMON 通用 / SPECIAL 专业），所以扇区的 code 直接能用。
 */
export const RULE_DIST_FILTER_FIELD: Record<RuleDistKey, string> = {
  status: 'ruleStatus',
  level: 'ruleLevel',
  category: 'ruleClassify',
  business: 'ruleMajor'
}

/**
 * 分布项的配色策略（色值逐个对齐最新原型 `docs/1009/智能审核规则v2.html` 的 ruleData）。
 *
 * 颜色按接口返回的 **code** 判定而不是名字——名字是后端词表来的、会变，
 * code 是稳定的语义值。码值依据（来自后端字典）：
 * - 规则状态 ZLYS_SFQY            = { '1' 启用, '0' 停用 }
 * - 规则级别 AI_AUDIT_RULE_LEVEL_COM = { '1' 问题, '2' 预警, '3' 异常 }，1 最严重
 * 命中不了的 code 按该维度的色板循环，不猜语义。
 */
export const colorForDistribution = (dimension: RuleDistKey, code: string, index: number): string => {
  if (dimension === 'status') {
    // v2：生效中蓝、测试中琥珀、已停用浅灰
    if (code === '1') return '#60a5fa' // 生效中
    if (code === '0') return '#cbd5e1' // 已停用
    return '#fbbf24' // 测试中
  }
  if (dimension === 'level') {
    // 级别按严重程度取红/橙/黄三档（问题 > 预警 > 异常），色值照 v2（比上一版略暗、更沉稳）
    if (code === '1') return '#c93a33' // 问题/高（红）
    if (code === '2') return '#e0761a' // 预警/中（橙）
    if (code === '3') return '#e8b923' // 异常/低（黄）
    return CHART_PALETTE.riskRank[index % CHART_PALETTE.riskRank.length]
  }
  const palette = dimension === 'business' ? CHART_PALETTE.business : CHART_PALETTE.category
  return palette[index % palette.length]
}
