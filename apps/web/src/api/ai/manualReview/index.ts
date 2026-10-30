/**
 * 人工复核（智能审核复审信息）接口
 *
 * 契约来源：docs/人工复核接口文档.md（控制器 AiAuditReviewInfoController，前缀 /ai-audit-review-info）。
 *
 * 前缀怎么来的：http.ts 只认 `constants/app.ts` 的 `app.api`（= VITE_APP_API），
 *   开发 = `/api` → vite proxy 去掉 /api 后打到 {后端}:10027/budget-process；
 *   生产 = `./` → 相对部署上下文（BASE_URL=/budget-process/），即同源真实后端。
 * 注意 ServiceApi.budget 带过去的 `service: 'budget'` 键在 http.ts 里**没有被消费**（全文无引用），
 * 所以这里写相对路径即可，与其它 ai/* 接口层一致。
 *
 * 文档要点（实现时容易踩的几条）：
 * - init 一次给全：项目编码/名称 + 规则清单（规则下挂要点）+ 默认选中项 + 已有复审记录回填；
 *   切规则/切要点都是**纯前端**读 categoryRuleList，不要再请求接口。
 * - 附件是**两步式**：先 upload 拿 fileUuid，再 save 时带上 fileName + fileUuid。
 * - save 的入参主键是**要点的 detailId**（即 init 里 pointList[i].detailId），不是任务 id。
 * - save 只收一对 fileName + fileUuid，也就是**一条记录只挂 1 个附件**（界面是多选，见组件里的处理）。
 * - categoryRuleId 是字符串，ruleId / detailId / id 是数字（大 ID 经 jsonBigstring 会以字符串返回，
 *   比较和当 key 用时统一转字符串，见 docs 第五节）。
 */
import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

const budget = ServiceApi.budget

/** 复审结论码值：1 通过 / 0 不通过 */
export const REVIEW_CONCLUSION_PASS = '1'
export const REVIEW_CONCLUSION_FAIL = '0'

/** 页面初始化入参：taskId 与 detailId 不能同时为空 */
export interface AiAuditReviewInitParams {
  taskId?: string | number
  /** 任务明细ID */
  detailId?: string | number
}

/** 审核要点 */
export interface AiAuditReviewPoint {
  /** 任务明细ID：save 时回传该值 */
  detailId: string | number
  /** 所属审核规则ID（字符串） */
  categoryRuleId: string
  /** 审核要点ID */
  ruleId: string | number
  auditPointCode?: string
  auditPointName: string
}

/** 审核规则（含其要点清单） */
export interface AiAuditReviewCategoryRule {
  /** 审核规则ID，字符串类型 */
  categoryRuleId: string
  ruleCode?: string
  ruleName: string
  pointList: AiAuditReviewPoint[]
}

/** 复审记录（init 的 reviewInfo / getDetail / getPage 的 records 同一结构） */
export interface AiAuditReviewRecord {
  id: string | number
  detailId: string | number
  /** 1 通过 / 0 不通过 */
  reviewConclusion: string
  reviewConclusionName?: string
  reviewOpinion: string
  fileName?: string
  fileUuid?: string
  fileUrl?: string
  createTime?: string
  creator?: string
  /** getPage 不返回创建人名称（文档注明恒为 null），需要名称时走 getDetail */
  creatorName?: string | null
}

/** 页面初始化返回 */
export interface AiAuditReviewInitResult {
  taskId: string | number
  /** 项目编码 */
  xmbm: string
  /** 项目名称 */
  xmmc: string
  /** 默认选中的任务明细ID（回显入参） */
  detailId: string | number
  /** 默认选中的审核规则ID（字符串） */
  categoryRuleId: string
  /** 默认选中的审核要点ID */
  ruleId: string | number
  categoryRuleList: AiAuditReviewCategoryRule[]
  /** 该明细已有的复审记录，无记录时为 null */
  reviewInfo: AiAuditReviewRecord | null
}

/** 进入复审页面时调用，一次性拿齐页面所需数据 */
export const initReviewInfo = (params: AiAuditReviewInitParams): Promise<Result & { data: AiAuditReviewInitResult }> => {
  return budget.post('ai-audit-review-info/init', params, {}, false)
}

/**
 * 上传附件，返回附件 UUID（非结构化平台）。
 * multipart/form-data：其余 importData 类接口同样是把 FormData 直接交给 post。
 */
export const uploadReviewAttach = (file: File, fileName?: string): Promise<Result & { data: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  if (fileName) formData.append('fileName', fileName)
  return budget.post('ai-audit-review-info/upload', formData as unknown as Record<string, any>, {}, false)
}

/** 保存/更新入参：结论与意见不能同时为空，detailId 必填 */
export interface AiAuditReviewSaveParams {
  /** 任务明细ID（取自 init 返回的要点 detailId） */
  detailId: string | number
  /** 1 通过 / 0 不通过 */
  reviewConclusion?: string
  reviewOpinion?: string
  fileName?: string
  fileUuid?: string
}

/** 保存/更新复审信息；同一条任务明细只会有一条记录，已存在则更新。返回记录主键 */
export const saveReviewInfo = (params: AiAuditReviewSaveParams): Promise<Result & { data: string | number }> => {
  return budget.post('ai-audit-review-info/save', params, {}, false)
}

export interface AiAuditReviewPageParams {
  page?: number
  limit?: number
  detailId?: string | number
  reviewConclusion?: string
  reviewOpinion?: string
  fileName?: string
}

export interface AiAuditReviewPageResult {
  records: AiAuditReviewRecord[]
  total: number
  size: number
  current: number
  pages: number
}

/** 分页查询复审信息 */
export const getReviewPage = (params: AiAuditReviewPageParams): Promise<Result & { data: AiAuditReviewPageResult }> => {
  return budget.post('ai-audit-review-info/getPage', { limit: 50, page: 1, ...params }, {}, false)
}

/**
 * 查询单条复审详情。
 * 注意参数名是 taskDetailId；无记录时后端直接抛异常（不同于 init 返回 null），
 * 首次进入页面请用 init。
 */
export const getReviewDetail = (taskDetailId: string | number): Promise<Result & { data: AiAuditReviewRecord }> => {
  return budget.get(`ai-audit-review-info/getDetail?taskDetailId=${encodeURIComponent(String(taskDetailId))}`, {}, {}, false)
}

/** 删除复审信息，支持批量：请求体是主键 ID 数组 */
export const removeReviewInfo = (ids: (string | number)[]): Promise<Result> => {
  return budget.post('ai-audit-review-info/remove', ids as unknown as Record<string, any>, {}, false)
}

/** 下载附件：返回文件流（非 JSON），按 blob 处理后再触发下载 */
export const downloadReviewAttach = (id: string | number, fileName?: string): Promise<void> => {
  return budget.download('ai-audit-review-info/downloadAttach', { id }, fileName)
}
