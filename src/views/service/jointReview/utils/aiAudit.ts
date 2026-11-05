import { getParamValueMulti } from '@/api/common'

/** 参数为 1 时：隐藏 AI审核意见，恢复 AI智能审核入口 */
export const HIDE_AI_AUDIT_OPINION_PARAM = 'LHHS_HIDE_AI_OPINION'

/**
 * AI 审议意见可见部门配置（public 参数）
 * - 未配置 / 空：默认仅 BM_CWZC
 * - ALL：不做部门限制
 * - 其他：按配置值限制，多个 specialorgcode 用英文逗号分隔
 */
export const AI_AUDIT_VISIBLE_ORG_PARAM = 'LHHS_AI_OPINION_VISIBLE_ORG'

/** 参数为 0 时关闭联合会审重新分析，默认开启 */
export const AI_AUDIT_RERUN_PARAM = 'LHHS_AI_RERUN'

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

export const loadHideAiAuditOpinionParam = async (): Promise<boolean> => {
  const params = await loadAiAuditParams()
  return params.hideAiAuditOpinion
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
