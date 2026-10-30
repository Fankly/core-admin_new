/**
 * 规则评审「详情」能力：对齐联合会审 AiAuditOpinion 单条规则详情
 * （RuleReviewDetailModal + 轮询 getRuleReview + 附件预览 + 可选重新分析）
 */
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getRuleReview, redoAuditRule } from '@/api/ai/smartTaskAudit'
import type { RuleReviewInfo, TXmAttach } from '@/api/ai/smartTaskAudit'
import {
  getAuditPreviewFileKey,
  resolveAuditPreviewTarget,
  UNSUPPORTED_AUDIT_PREVIEW_TIP
} from '@/views/ai/smartTaskAudit/components/auditFilePreview'
import {
  isRuleReviewDetailComplete,
  normalizeRuleReviewDetail,
  RERUN_POLL_MAX_ATTEMPTS,
  RERUN_POLL_MAX_DURATION_MS
} from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'
import type { RuleReviewDetailItem } from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'

type RuleDetailPollMode = 'load' | 'rerun'

const RULE_DETAIL_POLL_INTERVAL_MIN_MS = 15000
const RULE_DETAIL_POLL_INTERVAL_MAX_MS = 30000

export interface OpenRuleReviewDetailParams {
  detailId: string
  /** 重新分析需要；无 taskId 时仍可查看，但无法重新分析 */
  taskId?: string
  /** 加载完成前弹窗标题兜底 */
  ruleName?: string
}

export const useRuleReviewDetail = () => {
  const activeItem = shallowRef<RuleReviewDetailItem | null>(null)
  const ruleDetailVisible = ref(false)
  const ruleDetailLoading = ref(false)
  const ruleDetailRerunning = ref(false)
  const ruleDetailReady = ref(false)
  const ruleDetailRerunConfirming = ref(false)
  const ruleDetailTypewriterSession = ref(0)
  const filePreviewVisible = ref(false)
  const previewFiles = shallowRef<TXmAttach[]>([])
  const activePreviewKey = ref('')
  /** 打开详情时绑定的 taskId，供重新分析使用 */
  const boundTaskId = ref('')

  let ruleDetailLoadSeq = 0
  let ruleDetailPollTimer: ReturnType<typeof setTimeout> | null = null
  let ruleDetailPollStartedAt = 0
  let ruleDetailPollAttempts = 0

  const ruleDetailPersistKey = computed(() =>
    [boundTaskId.value, activeItem.value?.detailId || activeItem.value?.ruleId || '', ruleDetailTypewriterSession.value].join('-')
  )
  const ruleDetailConcludePersistKey = computed(() => `${ruleDetailPersistKey.value}-conclude`)
  const ruleDetailProcessPersistKey = computed(() => `${ruleDetailPersistKey.value}-process`)

  const getRuleDetailPollInterval = () => {
    return Math.floor(Math.random() * (RULE_DETAIL_POLL_INTERVAL_MAX_MS - RULE_DETAIL_POLL_INTERVAL_MIN_MS + 1)) + RULE_DETAIL_POLL_INTERVAL_MIN_MS
  }

  const clearRuleDetailPollTimer = () => {
    if (!ruleDetailPollTimer) return
    clearTimeout(ruleDetailPollTimer)
    ruleDetailPollTimer = null
  }

  const invalidateRuleDetailLoad = () => {
    ruleDetailLoadSeq += 1
    clearRuleDetailPollTimer()
  }

  const isCurrentRuleDetailRequest = (seq: number, detailId: string) => {
    return seq === ruleDetailLoadSeq && ruleDetailVisible.value && String(activeItem.value?.detailId || '') === detailId
  }

  const setRuleDetailFailure = (message: string, mode: RuleDetailPollMode) => {
    if (mode === 'load') {
      ruleDetailLoading.value = false
      ruleDetailReady.value = false
    } else {
      ruleDetailRerunning.value = false
    }
    ElMessage.error(message)
  }

  const applyRuleDetailResult = (data: Partial<RuleReviewInfo>, replayTypewriter = false) => {
    if (!activeItem.value) return
    const nextItem = { ...activeItem.value, ...normalizeRuleReviewDetail(data) } as RuleReviewDetailItem
    activeItem.value = nextItem
    ruleDetailReady.value = isRuleReviewDetailComplete(nextItem)
    if (replayTypewriter) {
      ruleDetailTypewriterSession.value += 1
    }
  }

  const pollRuleDetail = async (seq: number, detailId: string, mode: RuleDetailPollMode) => {
    if (!isCurrentRuleDetailRequest(seq, detailId)) return
    ruleDetailPollTimer = null

    try {
      const res = await getRuleReview({ detailId })
      if (!isCurrentRuleDetailRequest(seq, detailId)) return
      if (!res.success) {
        setRuleDetailFailure(res.msg || '评审详情获取失败', mode)
        return
      }

      const data = (res.data || {}) as Partial<RuleReviewInfo>
      // status=1 表示仍在分析中，继续轮询
      if (String(data.status ?? '') === '1') {
        ruleDetailPollAttempts += 1
        const expired = ruleDetailPollAttempts >= RERUN_POLL_MAX_ATTEMPTS || Date.now() - ruleDetailPollStartedAt > RERUN_POLL_MAX_DURATION_MS
        if (expired) {
          setRuleDetailFailure(mode === 'rerun' ? '重新分析超时，请稍后重试' : '评审详情加载超时，请稍后重试', mode)
          return
        }
        ruleDetailPollTimer = setTimeout(() => pollRuleDetail(seq, detailId, mode), getRuleDetailPollInterval())
        return
      }

      applyRuleDetailResult(data, mode === 'rerun')
      if (mode === 'load') {
        ruleDetailLoading.value = false
      } else {
        ruleDetailRerunning.value = false
      }
    } catch (error: any) {
      if (!isCurrentRuleDetailRequest(seq, detailId)) return
      setRuleDetailFailure(error?.message || '评审详情获取失败', mode)
    }
  }

  const startRuleDetailPoll = (mode: RuleDetailPollMode) => {
    const detailId = String(activeItem.value?.detailId || '')
    if (!detailId) {
      ElMessage.info('当前审核意见暂无详情')
      return
    }

    clearRuleDetailPollTimer()
    const seq = ++ruleDetailLoadSeq
    ruleDetailPollStartedAt = Date.now()
    ruleDetailPollAttempts = 0
    if (mode === 'load') {
      ruleDetailLoading.value = true
      ruleDetailReady.value = false
    } else {
      ruleDetailRerunning.value = true
    }
    pollRuleDetail(seq, detailId, mode)
  }

  /** 打开规则详情（对齐 AiAuditOpinion.openRuleDetail） */
  const openRuleDetail = (params: OpenRuleReviewDetailParams) => {
    const detailId = String(params?.detailId || '').trim()
    if (!detailId) {
      ElMessage.info('当前审核意见暂无详情')
      return
    }

    boundTaskId.value = String(params?.taskId || '').trim()
    activeItem.value = {
      detailId,
      ruleName: String(params?.ruleName || '').trim() || undefined
    } as RuleReviewDetailItem
    ruleDetailVisible.value = true
    ruleDetailRerunning.value = false
    ruleDetailRerunConfirming.value = false
    startRuleDetailPoll('load')
  }

  const closeFilePreview = () => {
    filePreviewVisible.value = false
    previewFiles.value = []
    activePreviewKey.value = ''
  }

  /** RuleReviewDetailModal 已过滤可预览附件，这里解析目标并打开预览 */
  const openFilePreview = (file: TXmAttach, files: TXmAttach[]) => {
    const resolved = resolveAuditPreviewTarget(file, Array.isArray(files) ? files : [])
    if (!resolved) {
      ElMessage.warning(UNSUPPORTED_AUDIT_PREVIEW_TIP)
      return
    }

    previewFiles.value = resolved.files
    activePreviewKey.value = getAuditPreviewFileKey(resolved.targetFile)
    filePreviewVisible.value = true
  }

  const closeRuleDetail = () => {
    closeFilePreview()
    ruleDetailVisible.value = false
    invalidateRuleDetailLoad()
    ruleDetailLoading.value = false
    ruleDetailRerunning.value = false
    ruleDetailReady.value = false
    ruleDetailRerunConfirming.value = false
  }

  const rerunActiveRule = async () => {
    const item = activeItem.value
    const detailId = String(item?.detailId || '')
    if (!item || !detailId || !boundTaskId.value || ruleDetailRerunning.value || ruleDetailRerunConfirming.value) {
      if (!boundTaskId.value) {
        ElMessage.warning('缺少任务信息，无法重新分析')
      }
      return
    }

    const confirmSeq = ruleDetailLoadSeq
    ruleDetailRerunConfirming.value = true
    try {
      const type = await VXETable.modal.confirm(`是否确认重新分析“${item.ruleName || '当前规则'}”？`, '提示', {
        status: 'warning',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
    } catch (error: any) {
      ElMessage.error(error?.message || '重新分析确认失败')
      return
    } finally {
      ruleDetailRerunConfirming.value = false
    }

    if (!isCurrentRuleDetailRequest(confirmSeq, detailId)) return
    ruleDetailRerunning.value = true
    try {
      const res = await redoAuditRule({ detailId })
      if (!isCurrentRuleDetailRequest(confirmSeq, detailId)) return
      if (!res.success) {
        ruleDetailRerunning.value = false
        ElMessage.error(res.msg || '重新分析失败')
        return
      }
      startRuleDetailPoll('rerun')
    } catch (error: any) {
      if (!isCurrentRuleDetailRequest(confirmSeq, detailId)) return
      ruleDetailRerunning.value = false
      ElMessage.error(error?.message || '重新分析失败')
    }
  }

  onBeforeUnmount(() => {
    invalidateRuleDetailLoad()
  })

  return {
    activeItem,
    ruleDetailVisible,
    ruleDetailLoading,
    ruleDetailRerunning,
    ruleDetailReady,
    ruleDetailRerunConfirming,
    ruleDetailConcludePersistKey,
    ruleDetailProcessPersistKey,
    filePreviewVisible,
    previewFiles,
    activePreviewKey,
    openRuleDetail,
    closeRuleDetail,
    openFilePreview,
    closeFilePreview,
    rerunActiveRule
  }
}
