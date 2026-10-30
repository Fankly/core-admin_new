/**
 * 财务 / 项目规则监控中心接口
 *
 * 契约来源：docs/项目规则监控中心接口协议.doc（该文档共 9 个接口，本文件只接入本模块用到的）。
 * 文档里其余尚未接入的接口（供后续按需补）：
 *   一、规则分布          GET  ai-audit-category-rule-monitoring/getCategoryRuleDistribution
 *   二、应用项目分布      GET  ai-audit-category-rule-monitoring/getProDistribution
 *   三、应用项目分布明细  GET  ai-audit-category-rule-monitoring/getProTypeRelaSsyd
 *   四、智能审核项目数量  GET  ai-audit-category-rule-monitoring/getAuditXmFileQuantity
 *   五、智能审核文件明细  GET  ai-audit-category-rule-monitoring/getAuditXmFileDetail
 *   六、规则风险项排名    GET  ai-audit-category-rule-monitoring/getProTaskUnPassRule
 */
import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

const budget = ServiceApi.budget

/**
 * 未通过清单查询参数。
 *
 * 契约按接口文档「七、规则风险项详细」的**更新版**：
 * page / limit 必传；yjdw / ejdw / jhssnd / ruleName / categoryRuleId 均可选。
 * categoryRuleId 由必传改为可选，就是为了支持「查看全部」——不传即查全部规则的未通过记录。
 *
 * 接缝：`xmbm` / `xmmc` 两个筛选项是需求方 2026-09-28 提的，**文档的入参表里还没有**
 * （表里只有上面那几项）。字段名沿用返参里同名的 `xmbm` / `xmmc`，后端补文档时核对一下。
 *
 * `bmId` / `dwId` 是 2026-10-19 新增的角色上下文入参，与一级/二级单位下拉（bizOrgTree/getYjdw）
 * 同源——列表查询也要走角色权限口径，不传则后端按无权限收口。
 */
export interface ProTaskUnPassDetailParams {
  page: number
  limit: number
  /** 部门id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  bmId?: string
  /** 单位id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  dwId?: string
  /** 一级单位 code */
  yjdw?: string
  /** 二级单位 code */
  ejdw?: string
  /** 计划年度 */
  jhssnd?: string
  /** 项目编码（模糊） */
  xmbm?: string
  /** 项目名称（模糊） */
  xmmc?: string
  /** 审核规则名称 */
  ruleName?: string
  /** 规则Id。不传 = 查看全部 */
  categoryRuleId?: string
}

/**
 * 审核结果名称。文档更新后返参新增了 `reviewOpinionName`（审核结果），
 * 值直接是名称（如「待审核」），不再需要拿 reviewOpinion 的 code 去查字典。
 */
export interface ProTaskUnPassDetailRow {
  /** 项目编码 */
  xmbm: string
  /** 项目名称 */
  xmmc: string
  /**
   * 项目 ID。
   * 接缝：**返参表里还没有这一项**（需求方 2026-09-29 说后端已开始返回），
   * 用途是「查看」→ 智能审核详情：详情弹窗那套接口（getXmAuditConclude 等）要的是 taskId，
   * 先拿它调 `ai-audit-task-manage/getAuditTaskIdByProId` 换 taskId，再开弹窗。
   */
  proId?: string
  /** 一级单位（code，展示用 yjdwName） */
  yjdw: string
  /** 一级单位名称 */
  yjdwName: string
  /** 二级单位（code，展示用 ejdwName） */
  ejdw: string
  /** 二级单位名称 */
  ejdwName: string
  /** 计划年度 */
  jhssnd: string
  /** 规则Id */
  categoryRuleId?: string
  /** 规则名称 */
  ruleName: string
  /** 审核要点名称 */
  auditPointName: string
  /** 审核结论（code，字典 AI_AUDIT_REVIEW_OPINION_COM；老接口只有它，作为名称缺失时的兜底） */
  reviewOpinion?: string
  /** 审核结果（名称，文档新增字段，优先用它） */
  reviewOpinionName?: string
  /** 审核结论简述 */
  reviewConclude: string
  /**
   * 人工审核结果（名称）。
   * 接缝：**文档的返参表里还没有这两项**（需求方 2026-09-28 说后端已开始返回），
   * 两个穿透明细（风险项排名 / 风险统计）共用本组件，所以这一处加上两处都能看到。
   */
  rgReviewOpinionName?: string
  /**
   * 人工审核意见（code，字典 AI_AUDIT_REVIEW_OPINION_COM）。
   * 需求方 2026-10-13 新增的**查询条件**按它过滤（弹窗里的「人工审核结论」下拉）；
   * 返参若只给名称，这一列的下拉筛选仍按 code 下发，由后端对齐。
   */
  rgReviewOpinion?: string
  /** 人工审核结论（人工复核填的结论简述） */
  rgReviewConclude?: string
  /** 项目类型（code，供智能审核详情弹窗 showProjectInfo 读取，缺失时报「缺少项目类型」） */
  proType?: string
  /** 项目类型名称 */
  proTypeName?: string
  /** 审核任务明细ID（保存 AI 运营复核信息的主键） */
  detailId?: string
  /** 问题方向编码（字典 AI_AUDIT_PROBLEM_DIRECTION_COM） */
  problemDirection?: string
  /** 问题方向名称 */
  problemDirectionName?: string
  /** AI运营复核状态：1 已复核 / 0 未复核（接口原语义为启用/停用） */
  opsReviewStatus?: string
  /** AI运营复核状态名称 */
  opsReviewStatusName?: string
  /** 解决方案 */
  solution?: string
  /** 复核时间 */
  reviewTime?: string
}

/** 未通过清单分页数据（data 内层，含文档示例里的分页字段） */
export interface ProTaskUnPassDetailPage {
  records: ProTaskUnPassDetailRow[]
  total: string | number
  current?: string | number
  size?: string | number
  pages?: string | number
}

/**
 * 规则风险项详细 / 未通过清单（文档 七）。POST，分页。
 */
export const getProTaskUnPassDetail = (params: ProTaskUnPassDetailParams): Promise<Result & { data: ProTaskUnPassDetailPage }> => {
  return budget.post('ai-audit-category-rule-monitoring/getProTaskUnPassDetail', params, {}, false)
}

/** 保存 AI 运营复核信息（问题方向、解决方案、运营复核状态） */
export interface OpsReviewInfoParams {
  /** 任务明细ID（对应 T_AI_AUDIT_REVIEW_INFO.DETAIL_ID） */
  detailId: string
  /** 问题方向编码（字典 AI_AUDIT_PROBLEM_DIRECTION_COM） */
  problemDirection?: string
  /** 解决方案 */
  solution?: string
  /** 运营复核状态：1 已复核 / 0 未复核（接口原语义为启用/停用） */
  opsReviewStatus?: string
}

/** 保存 AI 运营复核信息，返回新记录主键；开关开启/关闭与复核弹窗共用 */
export const saveOpsReviewInfo = (params: OpsReviewInfoParams): Promise<Result & { data: string | number }> => {
  return budget.post('ai-audit-category-rule-monitoring/saveOpsReviewInfo', params, {}, false)
}

/**
 * 未通过清单导出。契约按接口文档「十、物资申报单价合理性-未通过清单导出」。
 *
 * 文档更新后五个入参**全部为可选**（categoryRuleId 原先标成必传是文档笔误，已修正），
 * 所以「查看全部」模式下不带 categoryRuleId 导出也是合法的。
 * `xmbm` / `xmmc` 与查询参数同源（弹窗把整份 searchParam 摊进来），同样待后端补文档。
 *
 * `bmId` / `dwId` 是 2026-10-19 新增的角色上下文入参（与查询接口 getProTaskUnPassDetail 同步）。
 */
export interface ExportProTaskUnPassParams {
  /** 部门id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  bmId?: string
  /** 单位id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  dwId?: string
  categoryRuleId?: string
  yjdw?: string
  ejdw?: string
  jhssnd?: string
  xmbm?: string
  xmmc?: string
  ruleName?: string
}

export const exportProTaskUnPassExcel = (params: ExportProTaskUnPassParams): Promise<Result> => {
  return budget.exportFile('ai-audit-category-rule-monitoring/exportProTaskUnPassExcel', params)
}

/* ================================================================== *
 * 看板（模块一）四个卡片 + 两个穿透明细
 * ================================================================== */

/**
 * 一、规则分布。GET，无入参。
 *
 * pieChartData[].name 是维度标识（按状态 / 按级别 / 按分类 / 按业务），
 * 每个维度下的 ruleDistribution 才是该维度的扇区数据。
 * 注意：文档里这条地址写成了 `//getCategoryRuleDistribution`（双斜杠），应为笔误，这里按单斜杠调用。
 *
 * ⚠️ 文档示例的 ruleCnt / categoryRuleCnt 分别是「要点总数」和「规则总数」，
 *    但示例值 64 / 25 与页面表头原有文案（25 条规则 / 75 个要点）口径一致——顺序别弄反。
 */
export interface RuleDistributionItem {
  /** 饼图某一类统计编码值（可回传主表做筛选条件） */
  code: string
  /** 饼图某一类统计名称 */
  name: string
  /** 该分类的规则数量 */
  categoryRuleCnt: string
  /** 该分类的要点数量 */
  ruleCnt: string
}

export interface RulePieGroup {
  /** 维度标识：按状态 / 按级别 / 按分类 / 按业务 */
  name: string
  ruleDistribution: RuleDistributionItem[]
}

export interface CategoryRuleDistributionData {
  /** 规则分布要点总数 */
  ruleCnt: string
  /** 规则分布规则总数 */
  categoryRuleCnt: string
  pieChartData: RulePieGroup[]
}

export const getCategoryRuleDistribution = (): Promise<Result & { data: CategoryRuleDistributionData }> => {
  return budget.get('ai-audit-category-rule-monitoring/getCategoryRuleDistribution', {}, {}, false)
}

/** 二、应用项目分布。GET，无入参 */
export interface ProDistributionItem {
  /** 项目类型id（穿透事项明细要用） */
  id: string
  /** 项目类型名称 */
  name: string
  /** 事项数量 */
  cnt: string
}

export interface ProDistributionData {
  /** 项目分布项目类型总数 */
  procnt: string
  /** 项目分布事项总数 */
  yssxCnt: string
  proDistribution: ProDistributionItem[]
}

export const getProDistribution = (): Promise<Result & { data: ProDistributionData }> => {
  return budget.get('ai-audit-category-rule-monitoring/getProDistribution', {}, {}, false)
}

/** 三、应用项目分布事项明细。POST，不分页，入参只有项目类型id */
export interface ProTypeSsydRow {
  /** 事项名称 */
  zyssxmc: string
  /** 项目类型 */
  name: string
  /** 项目类型id */
  id: string
  /** 审核要点数量 */
  ssydCnt: string
  /** 审核要点数据集合名称 */
  ssyds: string[]
  /**
   * 预算事项编码：二级穿透（文档十四 getYssxRelaRulePage）要靠它取数。
   * ⚠️ 文档「三」的返参表里没列这个字段，但后一级必须要它 —— 先按此名接收，取不到时页面会提示。
   */
  zyssxbm?: string
}

export const getProTypeRelaSsyd = (params: { id: string }): Promise<Result & { data: ProTypeSsydRow[] }> => {
  return budget.post('ai-audit-category-rule-monitoring/getProTypeRelaSsyd', params, {}, false)
}

/**
 * 应用分布 - 预算事项关联审核要点分页（文档 十四）。POST，分页。
 * 用于「应用分布」穿透明细（getProTypeRelaSsyd）里「已分配审核要点数量」列的**二级穿透**。
 *
 * ⚠️ 文档这一条**自相矛盾**：入参表写的是 `categoryRuleId`（规则id），示例给的是 `zyssxbm`
 *    （预算事项编码）。已确认按**示例**的 `zyssxbm` 实现。
 *
 * ⚠️ 另外：上一级接口（文档三 getProTypeRelaSsyd）的返参表里**没有** zyssxbm，
 *    但这一级必须要它——页面从行上取 `zyssxbm`，取不到会明确提示、不发无效请求，
 *    请后端在「三」的返参里补上该字段（或告知应传哪个字段）。
 */
export interface YssxRelaRuleParams {
  /** 预算事项编码 */
  zyssxbm: string
  page: number
  limit: number
}

/** 十四返参行：与文档十三同形（要点编码/名称/状态），另带预算事项数量 */
export interface YssxRelaRuleRow {
  /** 审核要点编码 */
  auditPointCode: string
  /** 审核要点名称 */
  auditPointName: string
  /** 要点状态（码：1 启用 / 0 停用） */
  ruleStatus: string
  /** 要点状态名称 */
  ruleStatusName: string
  /** 预算事项数量（接口带回；本弹层只列要点，先留着备用） */
  yssxCnt?: string
}

export const getYssxRelaRulePage = (
  params: YssxRelaRuleParams
): Promise<Result & { data: { records: YssxRelaRuleRow[]; total: string | number } }> => {
  return budget.post('ai-audit-category-rule-monitoring/getYssxRelaRulePage', params, {}, false)
}

/**
 * 四、智能审核项目数量。POST。
 *
 * 2026-10-19：由无入参的 GET 改为 POST，入参加 bmId / dwId（角色上下文）——
 * 文件解析卡片也要走角色权限口径，不传则后端按无权限收口。
 */
export interface AuditXmFileItem {
  /** 文件类型id（穿透文件明细要用） */
  fjId: string
  /** 文件类型名称 */
  fileType: string
  /** 文件数量 */
  cnt: number
}

export interface AuditXmFileQuantityData {
  /** 审核文件总数 */
  fileQuantity: string
  xmFileData: AuditXmFileItem[]
}

export interface AuditXmFileQuantityParams {
  /** 部门id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  bmId?: string
  /** 单位id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  dwId?: string
}

export const getAuditXmFileQuantity = (params: AuditXmFileQuantityParams = {}): Promise<Result & { data: AuditXmFileQuantityData }> => {
  return budget.post('ai-audit-category-rule-monitoring/getAuditXmFileQuantity', params, {}, false)
}

/** 五、智能审核项目文件明细。POST，分页；入参 fjId / page / limit */
export interface AuditXmFileDetailRow {
  fjId: string
  /** 项目编码 */
  xmbm: string
  /** 项目名称 */
  xmmc: string
  /** 一级单位 code */
  yjdw: string
  /** 一级单位名称 */
  yjdwName: string
  /** 二级单位 code */
  ejdw: string
  /** 二级单位名称 */
  ejdwName: string
  /** 计划年度 */
  jhssnd: string
  /** 文件类型 */
  fileType: string
  /** 文件名称 */
  attachName: string
  /**
   * 项目 ID。
   * 接缝：**返参表里还没有这一项**（需求方 2026-09-29 说后端已开始返回），
   * 用途与未通过清单的「查看」一致：先调 `getAuditTaskIdByProId` 换 taskId，再开智能审核详情弹窗。
   */
  proId?: string
}

export interface AuditXmFileDetailParams {
  fjId: string
  page: number
  limit: number
  /**
   * 部门id（角色上下文，看板穿透时由 RuleDashboard 透传）。
   * 2026-10-19 新增，与一级/二级单位下拉（bizOrgTree/getYjdw）同源——
   * 列表查询也要走角色权限口径，不传则后端按无权限收口。
   */
  bmId?: string
  /** 单位id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  dwId?: string
  /** 项目编码 */
  xmbm?: string
  /** 项目名称 */
  xmmc?: string
  /** 一级单位 code */
  yjdw?: string
  /** 二级单位 code */
  ejdw?: string
  /** 计划年度 */
  jhssnd?: string
}

export const getAuditXmFileDetail = (
  params: AuditXmFileDetailParams
): Promise<Result & { data: ProTaskUnPassDetailPage & { records: AuditXmFileDetailRow[] } }> => {
  return budget.post('ai-audit-category-rule-monitoring/getAuditXmFileDetail', params, {}, false)
}

/**
 * 六、规则风险项排名。POST。
 *
 * 2026-10-19：由无入参的 GET 改为 POST，入参加 bmId / dwId（角色上下文）——
 * 审核规则异动排名卡片也要走角色权限口径，不传则后端按无权限收口。
 * data 直接是数组（不是分页对象）。
 */
export interface ProTaskUnPassRuleItem {
  /** 规则Id（穿透未通过清单要用） */
  categoryRuleId: string
  /** 规则名称 */
  ruleName: string
  /** 规则数量 */
  cnt: string
}

export interface ProTaskUnPassRuleParams {
  /** 部门id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  bmId?: string
  /** 单位id（角色上下文，看板穿透时由 RuleDashboard 透传） */
  dwId?: string
}

export const getProTaskUnPassRule = (params: ProTaskUnPassRuleParams = {}): Promise<Result & { data: ProTaskUnPassRuleItem[] }> => {
  return budget.post('ai-audit-category-rule-monitoring/getProTaskUnPassRule', params, {}, false)
}
