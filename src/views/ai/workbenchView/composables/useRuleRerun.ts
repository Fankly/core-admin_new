import { onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getRuleReview, redoAuditRule } from '@/api/ai/smartTaskAudit'
import type { RuleReviewInfo } from '@/api/ai/smartTaskAudit'
import { isRuleReviewDetailComplete, RERUN_POLL_MAX_ATTEMPTS, RERUN_POLL_MAX_DURATION_MS } from '../../smartTaskAudit/components/auditDetailHelpers'
import type { ReviewRule } from '../types'

const RERUN_POLL_INTERVAL_MS = 15000
/** 评审执行状态：1 待处理 2 处理中 3 已完成 4 处理失败 */
const RERUN_PENDING_STATUSES = new Set(['1', '2'])
const RERUN_COMPLETED_STATUS = '3'
const RERUN_FAILED_STATUS = '4'

interface RuleRerunContext {
  detailId: string
  taskId: string
  rule: ReviewRule
  startedAt: number
  attempts: number
  timer?: ReturnType<typeof setTimeout>
}

interface UseRuleRerunOptions {
  getTaskId: () => string
  isActive: (taskId: string) => boolean
  /** 当前详情区展示的规则 key（detailId）；轮询只在对应规则仍停留在界面上时继续 */
  getActiveRuleKey: () => string
  onCompleted: (rule: ReviewRule, data: Partial<RuleReviewInfo>, taskId: string) => void | Promise<void>
}

export const getRuleRerunKey = (rule?: Partial<ReviewRule> | null) => String(rule?.detailId || '').trim()

export const useRuleRerun = (options: UseRuleRerunOptions) => {
  const rerunningRuleIds = ref<ReadonlySet<string>>(new Set())
  const rerunConfirmingRuleId = ref('')
  const contexts = new Map<string, RuleRerunContext>()

  const syncRerunningRuleIds = () => {
    rerunningRuleIds.value = new Set(contexts.keys())
  }

  const stopRuleRerun = (detailId: string, expectedContext?: RuleRerunContext) => {
    const context = contexts.get(detailId)
    if (expectedContext && context !== expectedContext) return
    if (context?.timer) clearTimeout(context.timer)
    contexts.delete(detailId)
    syncRerunningRuleIds()
  }

  const stopAllRuleReruns = () => {
    contexts.forEach((context) => {
      if (context.timer) clearTimeout(context.timer)
    })
    contexts.clear()
    rerunConfirmingRuleId.value = ''
    syncRerunningRuleIds()
  }

  /** 轮询只服务于「当前正在看的那条规则」：切走即视为放弃，不再回写数据也不再提示 */
  const isActiveRule = (detailId: string) => options.getActiveRuleKey().trim() === detailId

  const isCurrentContext = (context: RuleRerunContext) => {
    return contexts.get(context.detailId) === context && options.isActive(context.taskId) && isActiveRule(context.detailId)
  }

  const hasExpired = (context: RuleRerunContext) => {
    return context.attempts >= RERUN_POLL_MAX_ATTEMPTS || Date.now() - context.startedAt > RERUN_POLL_MAX_DURATION_MS
  }

  const failRuleRerun = (context: RuleRerunContext, message: string) => {
    if (!isCurrentContext(context)) return
    stopRuleRerun(context.detailId, context)
    ElMessage.error(message)
  }

  const isRerunResultReady = (context: RuleRerunContext, data: Partial<RuleReviewInfo>) => {
    if (!isRuleReviewDetailComplete(data)) return false

    const previousPoints = Array.isArray(context.rule.points) ? context.rule.points : []
    if (!previousPoints.length) return true

    return Array.isArray(data.points) && data.points.length > 0
  }

  const pollRuleReview = async (context: RuleRerunContext) => {
    if (!isCurrentContext(context)) {
      stopRuleRerun(context.detailId, context)
      return
    }
    if (hasExpired(context)) {
      failRuleRerun(context, '重新分析超时，请稍后重试')
      return
    }

    context.timer = undefined
    context.attempts += 1
    try {
      const res = await getRuleReview({ detailId: context.detailId })
      if (!isCurrentContext(context)) return
      if (!res.success) {
        failRuleRerun(context, res.msg || '获取评审结果失败')
        return
      }

      const data = (res.data || {}) as Partial<RuleReviewInfo>
      const status = String(data.status ?? '')
      // 状态与详情数据并非原子落库：状态可能先变为已完成，审核要点稍后才可查询。
      // 在结果内容真正就绪前保持重新分析动画，避免先渲染成「暂无审核要点/依据」。
      const shouldKeepPolling = RERUN_PENDING_STATUSES.has(status) || (status === RERUN_COMPLETED_STATUS && !isRerunResultReady(context, data))
      if (shouldKeepPolling) {
        if (hasExpired(context)) {
          failRuleRerun(context, '重新分析超时，请稍后重试')
          return
        }
        context.timer = setTimeout(() => void pollRuleReview(context), RERUN_POLL_INTERVAL_MS)
        return
      }
      if (status === RERUN_FAILED_STATUS) {
        failRuleRerun(context, String(data.message || '').trim() || '重新分析失败')
        return
      }

      await options.onCompleted(context.rule, data, context.taskId)
      // onCompleted 可能改掉当前选中规则，这里不能再用 isCurrentContext 作为收尾条件，
      // 否则上下文会残留在 Map 里让规则一直显示为「重新分析中」
      stopRuleRerun(context.detailId, context)
    } catch (error: any) {
      failRuleRerun(context, error?.message || '获取评审结果失败')
    }
  }

  const rerunRule = async (rule: ReviewRule) => {
    const detailId = getRuleRerunKey(rule)
    const taskId = options.getTaskId().trim()
    if (!detailId) {
      ElMessage.warning('当前规则缺少评审详情，无法重新分析')
      return
    }
    if (!taskId) {
      ElMessage.warning('缺少任务信息，无法重新分析')
      return
    }
    if (contexts.has(detailId) || rerunConfirmingRuleId.value === detailId) return

    rerunConfirmingRuleId.value = detailId
    try {
      const type = await VXETable.modal.confirm(`是否确认重新分析“${rule.name || '当前规则'}”？`, '提示', {
        status: 'warning',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
    } catch (error: any) {
      ElMessage.error(error?.message || '重新分析确认失败')
      return
    } finally {
      if (rerunConfirmingRuleId.value === detailId) rerunConfirmingRuleId.value = ''
    }

    // 确认弹窗期间用户可能已经切走：此时不再发起重新分析
    if (!options.isActive(taskId) || options.getTaskId().trim() !== taskId || !isActiveRule(detailId) || contexts.has(detailId)) return

    const context: RuleRerunContext = {
      detailId,
      taskId,
      rule: { ...rule },
      startedAt: Date.now(),
      attempts: 0
    }
    contexts.set(detailId, context)
    syncRerunningRuleIds()

    try {
      const res = await redoAuditRule({ detailId })
      if (!isCurrentContext(context)) return
      if (!res.success) {
        failRuleRerun(context, res.msg || '重新分析失败')
        return
      }
      void pollRuleReview(context)
    } catch (error: any) {
      failRuleRerun(context, error?.message || '重新分析失败')
    }
  }

  // 切换规则/筛选后立刻清掉 timer，而不是等下一次 15s 唤醒才发现自己已经不是当前规则
  watch(
    () => options.getActiveRuleKey().trim(),
    (activeKey) => {
      contexts.forEach((context, detailId) => {
        if (detailId !== activeKey) stopRuleRerun(detailId, context)
      })
    }
  )

  onBeforeUnmount(stopAllRuleReruns)

  return {
    rerunningRuleIds,
    rerunConfirmingRuleId,
    rerunRule,
    stopAllRuleReruns
  }
}
