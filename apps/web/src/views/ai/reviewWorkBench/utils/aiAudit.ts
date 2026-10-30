import { getParamValueMulti } from '@/api/common'
import { AIRiskLevelDict } from '@/staticDict/index.js'

/** 参数为 1 时：隐藏 AI审核意见，恢复 AI智能审核入口 */
export const HIDE_AI_AUDIT_OPINION_PARAM = 'LHHS_HIDE_AI_OPINION'

/**
 * AI 审议意见可见部门配置（public 参数）
 * - 未配置 / 空：默认仅 BM_CWZC
 * - ALL：不做部门限制
 * - 其他：按配置值限制，多个 specialorgcode 用英文逗号分隔
 */
export const AI_AUDIT_VISIBLE_ORG_PARAM = 'LHHS_AI_OPINION_VISIBLE_ORG'

/** 参数为 0 时关闭评审工作台重新分析，默认开启 */
export const AI_AUDIT_RERUN_PARAM = 'REVIEW_WORKBENCH_AI_RERUN'

/** 未配置参数时的默认可见部门 */
export const AI_AUDIT_VISIBLE_SPECIAL_ORG_CODE_DEFAULT = 'BM_CWZC'

/** 配置为该值时不做 specialorgcode 限制 */
export const AI_AUDIT_VISIBLE_ORG_ALL = 'ALL'

export type AiAuditParams = {
  hideAiAuditOpinion: boolean
  canRerun: boolean
  /** 可见部门配置原始值，空则按默认 BM_CWZC 处理 */
  visibleOrgConfig: string
}

export type AiRiskLevelItem = {
  id: string | number
  name: string
  type?: string
  symbol?: string
  [key: string]: unknown
}

/** 项目是否具备 AI 审核入口（sfaishxm 为正整数） */
export const hasAiAuditEntry = (sfaishxm: unknown) => {
  if (typeof sfaishxm === 'boolean') return false

  const value = Number(sfaishxm)
  return Number.isInteger(value) && value > 0
}

export const isHideAiAuditOpinionEnabled = (value: unknown) => String(value ?? '').trim() === '1'

export const isAiAuditRerunEnabled = (value: unknown) => String(value ?? '').trim() !== '0'

/** 规范化可见部门参数；空值回落默认 BM_CWZC */
export const normalizeAiAuditVisibleOrgConfig = (value: unknown): string => {
  const text = String(value ?? '').trim()
  return text || AI_AUDIT_VISIBLE_SPECIAL_ORG_CODE_DEFAULT
}

/**
 * 是否允许当前 specialorgcode 查看 AI 审议意见
 * @param specialorgcode 当前用户 specialorgcode
 * @param visibleOrgConfig 公共参数值（未传则按默认 BM_CWZC）
 */
export const canShowAiAuditBySpecialOrg = (specialorgcode: unknown, visibleOrgConfig?: unknown) => {
  const config = normalizeAiAuditVisibleOrgConfig(visibleOrgConfig)
  if (config.toUpperCase() === AI_AUDIT_VISIBLE_ORG_ALL) return true

  const current = String(specialorgcode ?? '').trim()
  if (!current) return false

  const allowed = config
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return allowed.includes(current)
}

/** 一次拉取 AI 审议意见相关公共参数 */
export const loadAiAuditParams = async (): Promise<AiAuditParams> => {
  try {
    const res = await getParamValueMulti([HIDE_AI_AUDIT_OPINION_PARAM, AI_AUDIT_VISIBLE_ORG_PARAM, AI_AUDIT_RERUN_PARAM])
    if (res.success && res.data) {
      return {
        hideAiAuditOpinion: isHideAiAuditOpinionEnabled(res.data[HIDE_AI_AUDIT_OPINION_PARAM]),
        canRerun: isAiAuditRerunEnabled(res.data[AI_AUDIT_RERUN_PARAM]),
        visibleOrgConfig: normalizeAiAuditVisibleOrgConfig(res.data[AI_AUDIT_VISIBLE_ORG_PARAM])
      }
    }
  } catch {
    // 参数拉取失败时：不隐藏意见区，部门限制回落默认 BM_CWZC
  }
  return {
    hideAiAuditOpinion: false,
    canRerun: true,
    visibleOrgConfig: AI_AUDIT_VISIBLE_SPECIAL_ORG_CODE_DEFAULT
  }
}

export const loadHideAiAuditOpinionParam = async (): Promise<boolean> => {
  const params = await loadAiAuditParams()
  return params.hideAiAuditOpinion
}

/** AI 风险等级字典 Map，供列表标签渲染复用 */
const aiRiskLevelMap = new Map<string, AiRiskLevelItem>((AIRiskLevelDict.getList() as AiRiskLevelItem[]).map((item) => [String(item.id), item]))

/** 根据 aishResult 解析 AI 风险等级字典项 */
export const getAiRiskLevel = (aishResult?: string | number | null): AiRiskLevelItem | undefined => {
  const riskLevelId = String(aishResult ?? '').trim()
  if (!riskLevelId) return undefined
  return aiRiskLevelMap.get(riskLevelId)
}

/**
 * 组装进入评审详情页的加密参数（对齐 expertReview）
 * 必须携带 specialorgcode，否则 AI 审议意见按部门可见性会隐藏
 */
export type MeetingEntryParamsInput = {
  meetingId: string | number
  expertName: string
  expertId: string | number
  tag: 'review' | 'view' | string
  userInfo: Record<string, any>
  canRerun?: boolean
}

export const buildMeetingEntryPayload = (input: MeetingEntryParamsInput) => {
  const { meetingId, expertName, expertId, tag, userInfo, canRerun } = input
  return {
    meetingId,
    expertName: encodeURIComponent(expertName),
    expertId,
    tag,
    deptId: userInfo.specialorgid ? userInfo.specialorgid : userInfo.deptId,
    dwId: userInfo.org_id ? userInfo.org_id : userInfo.dwId,
    spRoleId: userInfo.id ? userInfo.id : userInfo.spRoleId,
    // AI 可见性依赖 specialorgcode，从评审工作台进入省级评审时必须带上
    specialorgcode: userInfo.specialorgcode,
    canRerun: canRerun === true
  }
}
