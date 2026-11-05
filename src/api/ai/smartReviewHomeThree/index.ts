/**
 * 智能成本项目评审工作台（三）· 看板接口
 *
 * 契约来源：docs/评审工作台文档.docx。文档里是两组控制器：
 * - `/ai-audit-workbench`        指标统计（1）、归口部门统计（2）、项目清单分页（3）
 * - `/ai-audit-project-review`   审核结果分布（4）、任务异常排名（5）、审核未通过占比（6）
 *   ↑ 这一组在 2026-09-24 更新过入参与出参，详见下方该节的说明。
 *
 * 文档要点：
 * - 统一响应体是 Result<T>（本项目里表现为 { code, success, msg, data }，判 success 即可）。
 * - 前三个接口要 dwId/bmId/roleId，权限由后端按这三个值推导，**前端不要传 orgFlag 之类**。
 * - `getTaskPage` 的 isHis/orderByType/finishStatus 由后端固定，前端传了也会被覆盖。
 * - 项目状态的码值：1 待处理 / 2 处理中 / 3 已完成 / 4 处理失败；
 *   审核意见：0 不通过 / 1 通过 / 2 待复核 / 3 不执行。
 * - `pointNopassRate` 按文档示例（15/480 → 0.031）是**比值**不是百分数，展示时 ×100。
 */
import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

const budget = ServiceApi.budget

/** 三个看板接口共用的时间区间 + 权限入参 */
export interface WorkbenchBaseParams {
  /** 开始日期，yyyy-MM-dd（超 10 位自动截断） */
  startDate?: string
  /** 结束日期，yyyy-MM-dd */
  endDate?: string
  /** 单位 ID */
  dwId: string
  /** 部门 ID */
  bmId: string
  /** 角色 ID */
  roleId?: string
}

/* ------------------------------------------------------------------ *
 * 一、指标统计
 * ------------------------------------------------------------------ */

/** 一组指标（currentData / weekData 同构） */
export interface IndicatorData {
  /** 审核项目数量 */
  projectNum: number
  /** 审核项目金额 */
  projectAmount: number
  /** 不通过项目数量 */
  projectNopassNum: number
  /** 识别不通过项 */
  pointNopassNum: number
  /** 识别待复核项 */
  pointReviewNum: number
  /** 识别异常项（= 不通过项 + 待复核项） */
  pointRiskNum: number
  /** 识别审核要点数量 */
  pointNum: number
  /** 审核不通过率（比值，0.031 → 3.1%） */
  pointNopassRate: number
}

export interface IndicatorStat {
  /** 指定区间的指标 */
  currentData: IndicatorData | null
  /** 本周指标 */
  weekData: IndicatorData | null
}

/** 指标统计：指定区间 currentData + 本周 weekData */
export const getIndicatorStat = (params: WorkbenchBaseParams): Promise<Result & { data: IndicatorStat }> => {
  return budget.post('ai-audit-workbench/getIndicatorStat', params, {}, false)
}

/* ------------------------------------------------------------------ *
 * 二、按归口部门统计项目数量/金额
 * ------------------------------------------------------------------ */

/** mode：1 统计项目数量（默认），2 统计项目金额 */
export type ZgkbmStatMode = 1 | 2

export interface ZgkbmStatItem {
  /**
   * 归口部门名称。
   * ⚠️ 键名是小写 + 下划线（后端 2026-09-25 全量改过），别改回大写的 ZGKBM_NAME——
   *    换回去柱状图会因为取不到名称而整条空掉。
   */
  zgkbm_name: string
  /**
   * 归口部门 ID。点面板柱子筛下方清单时，`getTaskPage` 的 `gkbm` 用的就是它
   * （接口返回的就是这套 id，别再拿名称去字典反查码值）。
   */
  zgkbm_id: string
  /** mode=1 为项目数量；mode=2 为项目金额合计 */
  value: number
}

export interface AudittProStatByZgkbmParams extends WorkbenchBaseParams {
  mode?: ZgkbmStatMode
}

/** 按预算事项归口部门统计（结果按 value 倒序） */
export const getAuditProStatByZgkbm = (params: AudittProStatByZgkbmParams): Promise<Result & { data: ZgkbmStatItem[] }> => {
  return budget.post('ai-audit-workbench/getAuditProStatByZgkbm', params, {}, false)
}

/* ------------------------------------------------------------------ *
 * 三、智能审核项目清单（分页）
 * ------------------------------------------------------------------ */

export interface TaskPageParams {
  page?: number
  limit?: number
  dwId: string
  bmId: string
  roleId?: string
  /** 审核结论（公共代码 AI_AUDIT_TASK_REVIEW_OPINION_COM） */
  reviewOpinion?: string
  /** 项目编码清单 */
  xmbmList?: string[]
  /**
   * 项目编码（单个，模糊匹配）。
   * 接缝：文档的入参表里只有 `xmbmList`（编码清单数组），单个编码这一项是需求方 2026-09-28 提的
   * （页面上的「项目编码」是文本框），按需求给的键名 `xmbm` 传。后端补文档/改名时以那一处为准。
   */
  xmbm?: string
  /** 项目名称，模糊匹配 */
  xmmc?: string
  /**
   * 项目状态**多值**（码值清单，树形字典 commonCode/getFlowStatusTree）。
   * 接缝：文档的入参表里没有这一项，需求方 2026-09-30 给的口径 —— 页面上的「项目状态」是
   * tree-select 多选，选中的 code 数组整组传（与 views/ai/document 的 `zt` 同一份数据源）。
   */
  flowStatusList?: string[]
  /**
   * AI 预审意见（单个码值，字典 AI_AUDIT_TASK_RESULT_COM：0 未分析 / 1 分析中 / 10 AI预审通过 /
   * 20 问题项目 / 30 隐患项目 / 40 异常项目）。需求方 2026-10-12 给的口径与入参名 ——
   * 清单「AI预审意见」列展示的 `resultName` 与它同源。
   * ⚠️ 这份字典是**清单筛选专用**；详情页「总体评审情况」用的是另一个字典 `AI_AUDIT_RESULT_COM`
   *    （见 AuditDetailWorkbench 的 AUDIT_RESULT_PUBLIC_CODE），两者互不干扰，不要混用或互相替代。
   */
  result?: string
  /**
   * 项目类型清单，取 `protypeTree/getSubprotypeTree` 的 **middleId** 数组 ——
   * 值口径与「文档解析」页的查询控件（views/ai/document）一致：同一个树接口、同一套节点键，
   * 任务行上的 proType 也是这套码值。
   * 入参名沿用文档/后端的 `proTypeList`（用户 2026-10-12 确认：入参不变，只换取值口径）。
   */
  proTypeList?: string[]
  /**
   * 项目类型名称（单个）。
   * 接缝：文档的入参表里只有 `proTypeList`（类型 id 清单），这一项是需求方 2026-09-28 提的 ——
   * 「AI审核不通过率」面板返回的是**项目类型名**、没有 id，所以按名称筛。后端补文档/改名时以那一处为准。
   */
  proTypeName?: string
  /**
   * 审核结论**多值**（码值清单，与上面的单个 `reviewOpinion` 并列）。
   * 接缝：文档入参表里只有单个 `reviewOpinion`，这一项是需求方 2026-09-28 提的 ——
   * 点「异常项排名」面板时要固定带上 `['0', '2']`（不通过 + 待复核，即「异常」的口径）。
   * 只有该面板点击时才有这个参数，其它面板/表单查询不传。
   */
  reviewOpinionList?: string[]
  /**
   * 规则 id（单个）。
   * 接缝：文档的入参表里没有这一项，需求方 2026-09-28 提的 ——「异常项排名」面板返回 `ruleId`，
   * 点条筛清单就传它。后端补文档/改名时以那一处为准。
   */
  ruleId?: string
  /**
   * 任务 id 清单 —— 「要点复核情况」（卡4）点条时传它（后端 2026-10-14 给的口径）。
   * 卡4 的 getManualReviewRule 现在直接返回每根柱子的 `taskIdList`，
   * 清单按它过滤即可；原来卡4 借用的 `ruleId + reviewOpinionList` 组合已不再下发。
   */
  taskIdList?: string[]
  /** 计划实施年度 */
  jhssnd?: string
  /** 一级单位 */
  yjdw?: string
  /** 二级单位清单 */
  ejdwList?: string[]
  /** 归口部门 */
  gkbm?: string
  /** 预算事项 ID（文档口径） */
  yssxNewId?: string
  /**
   * 预算事项名称，模糊匹配。
   * ⚠️ 文档只定义了 yssxNewId；页面上的预算事项是文本框输入，只能给名称，
   *    等后端确认名称过滤的入参名后以那一处为准（接缝只在 index.vue 的 buildListParams）。
   */
  yssxName?: string
  /** AI 审核时间-开始 */
  auditTimeStart?: string
  /** AI 审核时间-结束 */
  auditTimeFinish?: string
  /**
   * 人工复核状态（单值码值）：1 待复核 / 2 部分复核 / 3 全部复核。
   * 后端 2026-10-20 新增（接口文档 docs/默认模块.md 的 getTaskPage 入参）；
   * 清单同名列展示的是返参 `manualReviewStatusName`。
   */
  manualReviewStatus?: string
}

/** 清单行（AiAuditTaskVO） */
export interface AuditTaskRow {
  taskId: string | number
  proId: string | number
  taskName: string
  priority?: string
  priorityName?: string
  isHis?: string
  isHisName?: string
  reviewOpinion?: string
  reviewOpinionName?: string
  xmmc: string
  xmbm: string
  proType?: string
  proTypeName?: string
  /**
   * 项目状态名称 —— 后端新增字段（列表「项目状态」列）。
   * 接缝：接口文档的 AiAuditTaskVO 字段表与响应示例里都还没有这一项，后端补文档后请核对键名。
   */
  flowStatusName?: string
  jhssnd?: string
  yjdw?: string
  yjdwName?: string
  ejdw?: string
  ejdwName?: string
  gkbmId?: string
  gkbmName?: string
  /** 不含税申报预算（万元） */
  amount?: number | string
  /** 含税申报预算（万元） */
  allInvestTax?: number | string
  yssxId?: string | number
  yssxbm?: string
  yssxName?: string
  docPreStatus?: string
  docPreStatusName?: string
  /**
   * AI 预审意见名称（清单的「AI预审状态」三点指示与「AI预审意见」徽标都用它）。
   * 名称随字典 `AI_AUDIT_TASK_RESULT_COM` 下发；**判色不要用它** —— 字典实际名称
   * （10 AI预审通过 / 20 问题项目 / 30 隐患项目 / 40 异常项目）与接口文档枚举说明里的简称
   * （无异常 / 问题 / 预警 / 异常）不一致，按名称判会漏（见 data.ts 的 RESULT_TONE_BY_CODE）。
   */
  resultName?: string
  /**
   * AI 预审意见的**码值**（字典 AI_AUDIT_TASK_RESULT_COM 的 code，后端 2026-10-14 新增）。
   * 清单徽标的配色以它为准：10 通过/无异常 → 灰、20 问题 → 红、30 预警/隐患 → 橙、40 异常 → 黄。
   */
  result?: string
  createTime?: string
  startTime?: string
  finishTime?: string
  status?: string
  statusName?: string
  ruleName?: string
  /* ---------------- 审核要点复核统计（后端 2026-10-20 新增返参） ---------------- */
  /** 审核要点通过数 */
  passCnt?: number | string
  /** 审核要点不通过数 */
  failCnt?: number | string
  /** 审核要点待复核数 */
  pendingCnt?: number | string
  /** 审核要点复核数（已人工复核的要点数） */
  reviewedCnt?: number | string
  /** 人工复核状态码值：1 待复核 / 2 部分复核 / 3 全部复核 */
  manualReviewStatus?: string
  /** 人工复核状态名称（列表展示用它） */
  manualReviewStatusName?: string
}

export interface TaskPageResult {
  records: AuditTaskRow[]
  total: number
  size: number
  current: number
  pages: number
}

/** 智能审核项目清单：分页 + 7 个筛选条件 */
export const getTaskPage = (params: TaskPageParams): Promise<Result & { data: TaskPageResult }> => {
  return budget.post('ai-audit-workbench/getTaskPage', { page: 1, limit: 20, ...params }, {}, false)
}

/**
 * 导出智能审核项目清单（跟清单同一批筛选条件，由后端生成文件）。
 * 入参与 getTaskPage 一致（只是没有分页），响应是二进制流，配 `utils/export` 的 apiExportHandle 落盘。
 *
 * 注：接口示例里还出现过 taskName / priority / status / xmbmList / jhssnd / createTimeStart·Finish，
 *    这些是**智能审核任务**那套筛选条件，本页没有对应输入框，所以不传。
 */
export const exportTask = (params: Omit<TaskPageParams, 'page' | 'limit'>): Promise<Result> => {
  return budget.exportFile('ai-audit-workbench/exportTask', params, {}, false)
}

/* ------------------------------------------------------------------ *
 * 四~六、/ai-audit-project-review
 *
 * 文档 2026-09-24 更新（这一版的改动都在这里，前半部分 /ai-audit-workbench 没动）：
 * - 三个接口的入参统一成 `startDate` / `endDate`，原来的 `statusList` / `startTime` / `endTime` 已取消；
 * - `getProReviewResult` 的出参由「任务状态」换成**审核意见**（对应环形「审核结果分布」，
 *   与原型画的 通过/待复核/不通过 一致）；
 * - `getTaskAbnormalRanking` 的出参由「审核意见」换成**要点**（对应「异常项排名」，行是要点名）；
 * - 文档在字段表里特别标注 `reviewOpinionName`「用这个」——展示与配色都按**名称**走，
 *   不要把数字标识当判据（示例里 3 配的却是「通过」，与旧版枚举自相矛盾；附录的枚举说明这一版也删了）。
 *   码值仍以公共代码 AI_AUDIT_TASK_REVIEW_OPINION_COM 为准（0 不通过 / 1 通过 / 2 待复核 / 3 不执行）。
 * ------------------------------------------------------------------ */

export interface ProjectReviewBaseParams {
  /** 完成时间开始（yyyy-MM-dd） */
  startDate?: string
  /** 完成时间结束（yyyy-MM-dd） */
  endDate?: string
  /**
   * 角色上下文：与 getAuditProStatByZgkbm 一样，这三个接口也要带全（dwId / bmId / roleId）。
   * 少了 dwId，后端就按「无单位」过滤——数据静默变多，很难发现。
   */
  /** 单位 ID */
  dwId?: string
  /** 部门 ID */
  bmId?: string
  /** 角色 ID */
  roleId?: string
}

/** 审核任务项目审核结果（按**审核意见**统计项目数量） */
export interface ProReviewResultItem {
  /** 审核意见数字标识 */
  reviewOpinion: string
  /** 审核意见名称（文档注明「用这个」） */
  reviewOpinionName: string
  /** 审核任务项目数量 */
  cnt: string
}

/**
 * 审核任务项目审核结果（按**审核意见**统计项目数量）。
 *
 * ⚠️ 2026-10-11 起**没有页面在用它**了：v0.3 设计把「审核结果分布」卡换成了「AI识别异常项目」（见下面的
 * `getAuditProblemTask`）。函数留着备用 —— 万一还要一张按审核意见的分布图，这里就是现成的。
 */
export const getProReviewResult = (params: ProjectReviewBaseParams = {}): Promise<Result & { data: ProReviewResultItem[] }> => {
  return budget.post('ai-audit-project-review/getProReviewResult', params, {}, false)
}

/** 任务异常排名（按**要点**统计规则数量） */
export interface TaskAbnormalRankingItem {
  /** 要点 id */
  ruleId: string
  /** 要点名称 */
  auditPointName: string
  /** 规则数量 */
  cnt: string
}

export const getTaskAbnormalRanking = (params: ProjectReviewBaseParams = {}): Promise<Result & { data: TaskAbnormalRankingItem[] }> => {
  return budget.post('ai-audit-project-review/getTaskAbnormalRanking', params, {}, false)
}

/** 任务审核未通过占比（按项目类型统计规则数量及占比） */
export interface TaskReviewUnPassItem {
  /** 项目类型名称 */
  name: string
  /** 规则数量 */
  cnt: string
  /**
   * 占比（%）。
   * ⚠️ 文档示例里是 `"23.5"`（不带百分号），但 2026-09-24 后端已改成**带百分号**（`"23.5%"`）。
   * 前端按「带则直接用、不带则补一个」处理，避免后端口径回退时数字算错。
   */
  rate: string
}

export const getTaskReviewUnPass = (params: ProjectReviewBaseParams = {}): Promise<Result & { data: TaskReviewUnPassItem[] }> => {
  return budget.post('ai-audit-project-review/getTaskReviewUnPass', params, {}, false)
}

/* ------------------------------------------------------------------ *
 * 四、AI 识别问题项目 / 五、复核要点复核情况
 * （协议 2026-10-09 版新增，对应 v0.3 设计的卡2 / 卡4）
 * ------------------------------------------------------------------ */

/** 卡2 饼图的一段：按归口部门统计的问题任务数 */
export interface ProProblemTaskItem {
  /** 归口部门名称 */
  gkbmName: string
  /** 归口部门 id —— 点扇区筛清单就是按它（与卡1 柱子的 zgkbm_id 同一套 id） */
  gkbmId: string
  /** 该归口部门下的问题任务数量 */
  cnt: string
}

/** 四、AI 识别问题项目（卡2）：问题任务数 / 不通过任务数 / 不通过率 + 按归口部门的饼图数据 */
export interface ProProblemTaskData {
  /** 问题任务数量（RESULT = '20' 的任务数） */
  problemCnt: string
  /** 不通过任务数（REVIEW_OPINION = '0' 的任务数） */
  unpassCnt: string
  /** 不通过任务比率（百分比，保留 3 位小数，如 5.000） */
  unpassRatio: string
  gkbmpieChartData: ProProblemTaskItem[]
}

export const getAuditProblemTask = (params: ProjectReviewBaseParams = {}): Promise<Result & { data: ProProblemTaskData }> => {
  return budget.post('ai-audit-project-review/getAuditProblemTask', params, {}, false)
}

/** 卡4 柱图的一行：按审核要点统计的复核数量与复核率 */
export interface ManualReviewRuleItem {
  /** 审核要点名称 */
  auditPointName: string
  /** 规则 id —— 点条筛清单就是按它（与卡3 的 ruleId 同一套） */
  ruleId: string
  /** 该要点的复核数量 */
  cnt: string
  /** 该要点的复核率（百分比，保留 1 位小数，如 18.3） */
  reviewRate: string
  /**
   * 该要点这一根柱子背后的**任务 id 清单**（后端 2026-10-14 新增返参）。
   * 点条筛清单时整组当 `taskIdList` 传给 getTaskPage —— 不再像原来那样靠
   * `reviewOpinionList + ruleId` 反推，列表就是这根柱子统计到的那批任务。
   */
  taskIdList?: string[]
}

/** 五、复核要点复核情况（卡4）：人工复核总数 / 复核率 + 按审核要点的柱图数据 */
export interface ManualReviewRuleData {
  /** 人工复核总数量（已复核的明细数） */
  manualReviewCount: string
  /** 人工复核率（百分比，保留 1 位小数，如 52.2） */
  manualReviewRate: string
  barchartData: ManualReviewRuleItem[]
}

export const getManualReviewRule = (params: ProjectReviewBaseParams = {}): Promise<Result & { data: ManualReviewRuleData }> => {
  return budget.post('ai-audit-project-review/getManualReviewRule', params, {}, false)
}
