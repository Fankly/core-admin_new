/**
 * 人工复核 - 单一要点审核：类型与选项
 *
 * 移植自原型 `docs/单一要点审核.html`（标题：人工复核 - 列表形式）。
 *
 * 数据来源已从原型写死的 RULE_POINTS 换成接口（docs/人工复核接口文档.md）：
 * 规则/要点树、默认选中项、已有复审记录都由 `init` 一次性返回，切规则/切要点纯前端读本地树。
 * 这里只留「文案、上传限制、样式相关的枚举」与弹窗入参类型。
 */

/** AI 审核结论的三种展示色调（原型 opt.dataset.ai） */
export type AiResult = 'pass' | 'fail' | 'pending'

/** AI 结论 → 中文文案（原型 AI_TEXT），仅在拿不到接口文案时兜底用 */
export const AI_RESULT_TEXT: Record<AiResult, string> = {
  pass: '通过',
  fail: '不通过',
  pending: '待复核'
}

/**
 * AI 审核结论 → 色调。
 * 接口回的是 `reviewOpinionName` 文案（通过 / 不通过 / 待复核 / 不执行），
 * 这里按文案归一，与 RuleWorkspace 的 getReviewPointVerdict 同一套判定口径。
 */
export const aiToneOf = (opinionName?: string): AiResult => {
  const name = String(opinionName || '').trim()
  if (name.includes('不通过')) return 'fail'
  if (name.includes('通过')) return 'pass'
  return 'pending'
}

/** 某个审核要点上的 AI 结论摘要（弹窗里「AI 审核结论 / AI 审核意见」两行） */
export interface ReviewPointAiInfo {
  /** 展示文案，取接口的 reviewOpinionName */
  name: string
  tone: AiResult
  /** AI 审核意见，取接口的审核结论描述 */
  comment: string
}

/** 复核结论：通过 / 不通过（原型的 .opt data-type） */
export type ReviewConclusion = 'pass' | 'fail'

/** 复核结论 ↔ 接口码值（文档：1 通过，0 不通过） */
export const CONCLUSION_TO_CODE: Record<ReviewConclusion, string> = { pass: '1', fail: '0' }
export const CODE_TO_CONCLUSION: Record<string, ReviewConclusion> = { '1': 'pass', '0': 'fail' }

/** 复核意见的快捷短语（原型的空开 .chip） */
export const QUICK_COMMENTS = ['材料已补充，同意通过。', '偏差超5%，判定不通过。', '无历史数据，人工核对确认无误。']

/** 快捷短语的短标签（原型 chip 上显示的文字，与填充的正文不同） */
export const QUICK_COMMENT_LABELS = ['材料已补充·同意通过', '偏差超5%·不通过', '无历史数据·人工核对']

/** 佐证材料上传限制（原型提示文案） */
export const UPLOAD_TIP = '支持 PDF / JPG / PNG / XLSX，单个不超过 20MB'
export const UPLOAD_ACCEPT = '.pdf,.jpg,.jpeg,.png,.xlsx,.xls'
/** 单个文件大小上限：20MB（原型提示里写的） */
export const UPLOAD_MAX_SIZE = 20 * 1024 * 1024

/** 佐证材料条目 */
export interface ReviewFile {
  name: string
  /** 字节数；已有（服务端）附件拿不到大小时为 0 */
  size: number
  /** 本地待上传的原文件；已上传或已存在的条目没有这个字段 */
  file?: File
  /** upload 成功后拿到的附件 UUID */
  uuid?: string
  /** 来自已有复审记录的附件 */
  existing?: boolean
}

/** 弹窗打开时传入的上下文 */
export interface SinglePointReviewParams {
  /** 任务ID；与 detailId 至少给一个 */
  taskId?: string
  /** 点击的那个要点的任务明细ID：既是 init 的默认选中项，也是 save 的主键 */
  detailId?: string
  /** 该要点所属审核规则ID（init 未回默认值时的兜底） */
  categoryRuleId?: string
  /** 该要点的审核要点ID（同上） */
  ruleId?: string
  /**
   * 宿主已加载的要点 AI 信息，key 为 detailId 字符串。
   * 用来在弹窗打开瞬间就显示 AI 结论，不必再等一次请求。
   */
  aiInfo?: Record<string, ReviewPointAiInfo>
  /**
   * 拉取某规则下全部要点的 AI 信息（宿主调 listRuleReviewNew 实现）。
   * 用户在弹窗里切到尚未加载的规则时才会用到；不传则该规则的 AI 结论显示为空。
   */
  loadAiInfo?: (categoryRuleId: string) => Promise<Record<string, ReviewPointAiInfo>>
}
