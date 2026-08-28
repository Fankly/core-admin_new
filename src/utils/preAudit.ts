import { preAudit } from '@/api/service/requirement'
import { showPreAuditConfirm } from '@/components/PreAuditConfirmDialog'
import { ElMessage } from 'element-plus'

export type PreAuditGate = { action: 'pass' } | { action: 'block'; msg: string } | { action: 'warn'; msg: string }

/** 将后端 msg 中的换行或历史 | 分隔符转为换行，供 HTML 渲染 */
export const formatPreAuditHtml = (msg = ''): string => msg.split(/\r?\n|\|/).join('<br/>')

export const showPreAuditBlock = (msg = '预审校验未通过') => {
  ElMessage.error({
    type: 'error',
    dangerouslyUseHTMLString: true,
    message: formatPreAuditHtml(msg)
  })
}

const isEmptyPreAuditData = (data: any): boolean => {
  if (data === null || data === undefined || data === '') {
    return true
  }
  if (Array.isArray(data)) {
    return data.length === 0
  }
  if (typeof data === 'object') {
    return Object.keys(data).length === 0
  }
  return false
}

const normalizeRuleLevel = (level: unknown): string => `${level ?? ''}`.trim()

const pickHighestRuleLevel = (levels: string[]): string => {
  if (levels.includes('1')) return '1'
  if (levels.includes('2')) return '2'
  if (levels.includes('3')) return '3'
  return ''
}

const extractRuleLevel = (data: any): string => {
  if (!data || typeof data !== 'object') {
    return ''
  }
  if (Array.isArray(data)) {
    const levels = data.map((item) => normalizeRuleLevel(item?.ruleLevel)).filter(Boolean)
    return pickHighestRuleLevel(levels)
  }
  return normalizeRuleLevel(data.ruleLevel)
}

const joinUniqueMessages = (items: unknown[]): string => Array.from(new Set(items.map((item) => `${item ?? ''}`.trim()).filter(Boolean))).join('\n')

/** 提示文案取 data.msg（数组时取最高 ruleLevel 对应项的 msg，多条用换行拼接） */
const extractDataMsg = (data: any, ruleLevel: string, fallback = ''): string => {
  if (!data || typeof data !== 'object') {
    return fallback
  }
  if (Array.isArray(data)) {
    const matched = data
      .filter((item) => normalizeRuleLevel(item?.ruleLevel) === ruleLevel)
      .map((item) => item?.msg)
      .filter((msg) => msg !== null && msg !== undefined && `${msg}`.trim() !== '')
    if (matched.length > 0) {
      return joinUniqueMessages(matched)
    }
    const anyMsg = data.map((item) => item?.msg).filter((msg) => msg !== null && msg !== undefined && `${msg}`.trim() !== '')
    return anyMsg.length > 0 ? joinUniqueMessages(anyMsg) : fallback
  }
  if (data.msg !== null && data.msg !== undefined && `${data.msg}`.trim() !== '') {
    return `${data.msg}`
  }
  return fallback
}

/**
 * 提交前预审门禁（纯解析，不弹窗）：
 * - data 为空：pass
 * - ruleLevel 1：block（不可提交）
 * - ruleLevel 2/3：warn（提示后由用户决定）
 * - 接口失败 / 旧契约失败：block
 * - 提示文案使用 data.msg
 */
export const runPreAudit = async (proIds: Array<string | number>): Promise<PreAuditGate> => {
  try {
    const res = await preAudit(proIds)
    if (!res.success) {
      return { action: 'block', msg: res.msg || '预审校验未通过' }
    }
    // 兼容旧契约
    if (res.data === false) {
      return { action: 'block', msg: res.msg || '预审校验未通过' }
    }
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && 'success' in res.data && res.data.success === false) {
      return { action: 'block', msg: res.data.msg || res.msg || '预审校验未通过' }
    }
    if (isEmptyPreAuditData(res.data)) {
      return { action: 'pass' }
    }

    const ruleLevel = extractRuleLevel(res.data)
    if (ruleLevel === '1') {
      return { action: 'block', msg: extractDataMsg(res.data, ruleLevel, '预审校验未通过') }
    }
    if (ruleLevel === '2' || ruleLevel === '3') {
      return { action: 'warn', msg: extractDataMsg(res.data, ruleLevel, '预审校验提示') }
    }
    // 有 data 但无 ruleLevel / 未知等级：不拦截
    return { action: 'pass' }
  } catch {
    return { action: 'block', msg: '预审校验失败' }
  }
}

/**
 * 预审结果：
 * - false：阻断 / 用户取消，中止流程
 * - 'pass'：无预审提示，需走原有「确认是否提交」弹窗
 * - 'directSubmit'：level 2/3 用户已点「是」，跳过二次确认，直接提交
 */
export type ValidatePreAuditResult = false | 'pass' | 'directSubmit'

export const validatePreAudit = async (proIds: Array<string | number>): Promise<ValidatePreAuditResult> => {
  const gate = await runPreAudit(proIds)
  if (gate.action === 'pass') {
    return 'pass'
  }
  if (gate.action === 'block') {
    showPreAuditBlock(gate.msg)
    return false
  }
  // ruleLevel 2/3：组件弹窗点「确认提交」即视为确认，不再二次确认
  const ok = await showPreAuditConfirm({ msg: gate.msg })
  return ok ? 'directSubmit' : false
}
