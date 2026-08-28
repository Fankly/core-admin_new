<template>
  <!-- triggerOnly：不渲染入口 UI，由外部工具按钮调用 openDetailModal（与「更多意见」相同） -->
  <section v-if="!triggerOnly" class="joint-review-ai-audit" aria-labelledby="joint-review-ai-audit-title">
    <div class="joint-review-ai-audit__header">
      <div id="joint-review-ai-audit-title" class="joint-review-ai-audit__title section-title">
        <span class="section-title__icon" aria-hidden="true">
          <svg class="joint-review-ai-audit__ai-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- 人头轮廓 -->
            <circle cx="12" cy="9.2" r="7.4" stroke="currentColor" stroke-width="1.5" />
            <!-- 颈部 -->
            <path
              d="M8.6 16.4v1.8c0 1 .8 1.8 1.8 1.8h3.2c1 0 1.8-.8 1.8-1.8v-1.8"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <text
              x="12"
              y="9.55"
              text-anchor="middle"
              dominant-baseline="middle"
              fill="currentColor"
              font-size="8.5"
              font-weight="800"
              font-family="Arial, 'Microsoft YaHei', sans-serif"
              letter-spacing="0.2"
            >
              AI
            </text>
          </svg>
        </span>
        <span>AI审核意见</span>
      </div>
      <button
        type="button"
        class="joint-review-ai-audit__more"
        aria-label="查看更多AI审核意见"
        :class="{ 'is-loading': loading }"
        @click="openDetailModal"
      >
        <span>更多意见</span>
        <i class="el-icon-more el-icon--right" aria-hidden="true"></i>
      </button>
    </div>

    <div v-loading="loading" class="joint-review-ai-audit__content">
      <div v-if="auditConclusion" class="joint-review-ai-audit__conclusion" aria-label="AI评审总体结论">
        <ClipboardList class="joint-review-ai-audit__conclusion-icon" :stroke-width="2" aria-hidden="true" />
        <div class="joint-review-ai-audit__conclusion-text">
          <TypewriterText :text="auditConclusion" :animate="false" />
        </div>
      </div>
      <AiAuditRuleList
        :items="auditOpinions"
        :empty-text="emptyText"
        :show-manual-review="showManualReview"
        @detail="openRuleDetail"
        @manual-review="openManualReview"
      />
    </div>
  </section>

  <AuditFilePreviewModal :visible="filePreviewVisible" :files="previewFiles" :active-key="activePreviewKey" @close="closeFilePreview" />
  <DetailModal
    :modal="detailModal"
    :detail-row="detailRow"
    :user-info="userInfo"
    project-info-api="LHHS"
    :can-rerun="canRerun"
    :initial-detail-id="detailModal.initialDetailId"
    review-opinions=""
    @close="closeDetailModal"
  />
  <AiManualReviewModal v-if="showManualReview" v-model="manualReviewVisible" :item="manualReviewItem" :project="project" :user-info="userInfo" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ClipboardList } from 'lucide-vue-next'
import type { PropType } from 'vue'
import { getAuditTaskIdByProId, getRuleReviewInfo, getXmAuditConclude } from '@/api/ai/smartTaskAudit'
import type { RuleReviewInfo, TXmAttach } from '@/api/ai/smartTaskAudit'
import AiAuditRuleList from '@/views/service/jointReview/components/AiAuditRuleList.vue'
import AiManualReviewModal from '@/views/service/jointReview/components/AiManualReviewModal.vue'
import AuditFilePreviewModal from '@/views/ai/smartTaskAudit/components/AuditFilePreviewModal.vue'
import DetailModal from '@/views/ai/smartTaskAudit/components/DetailModal.vue'
import TypewriterText from '@/views/ai/smartTaskAudit/components/TypewriterText.vue'
import {
  getAuditPreviewFileKey,
  resolveAuditPreviewTarget,
  UNSUPPORTED_AUDIT_PREVIEW_TIP
} from '@/views/ai/smartTaskAudit/components/auditFilePreview'
import { normalizeAuditSummaryData } from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'
import type { RuleReviewDetailItem } from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'
import type { SmartTaskAuditRow } from '@/views/ai/smartTaskAudit/types'

type AiAuditOpinionItem = RuleReviewDetailItem

const REVIEW_OPINIONS = '0,2'

const props = defineProps({
  project: {
    type: Object as PropType<Record<string, any> | null>,
    default: null
  },
  userInfo: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  /** 仅专家预审等指定场景展示人工复核入口，默认隐藏 */
  showManualReview: {
    type: Boolean,
    default: false
  },
  /** 仅挂载弹窗能力，不渲染面板入口（由外部按钮触发 openDetailModal） */
  triggerOnly: {
    type: Boolean,
    default: false
  },
  /** 详情弹窗是否展示「重新分析」，由调用页面参数配置控制 */
  canRerun: {
    type: Boolean,
    default: true
  }
})

const loading = ref(false)
const taskId = ref('')
const emptyText = ref('暂无AI审核意见')
const auditConclusion = ref('')
const auditOpinions = shallowRef<AiAuditOpinionItem[]>([])
const manualReviewVisible = ref(false)
const manualReviewItem = shallowRef<AiAuditOpinionItem | null>(null)
const filePreviewVisible = ref(false)
const previewFiles = shallowRef<TXmAttach[]>([])
const activePreviewKey = ref('')
const detailModal = reactive({
  visible: false,
  loading: false,
  initialDetailId: ''
})
let loadSeq = 0

const projectId = computed(() => String(props.project?.xmId ?? props.project?.proId ?? props.project?.id ?? '').trim())
const projectType = computed(() => String(props.project?.pro_type_id ?? props.project?.proType ?? props.project?.proTypeId ?? '').trim())
const detailRow = computed<SmartTaskAuditRow>(() => ({
  ...(props.project || {}),
  proId: projectId.value,
  proType: projectType.value,
  taskId: taskId.value
}))

const openRuleDetail = (item: AiAuditOpinionItem) => {
  if (!item.detailId) {
    ElMessage.info('当前审核意见暂无详情')
    return
  }
  detailModal.initialDetailId = String(item.detailId)
  openDetailModal()
}

const openManualReview = (item: AiAuditOpinionItem) => {
  if (!props.showManualReview) return
  if (!item.ruleId) {
    ElMessage.info('当前审核意见暂无规则信息，无法人工复核')
    return
  }
  const expertId = String(props.userInfo?.expertId ?? '').trim()
  const meetingId = String(props.userInfo?.meetingId ?? '').trim()
  const reviewXmid = String(props.project?.xmId ?? props.project?.reviewXmid ?? '').trim()
  if (!expertId || !meetingId || !reviewXmid) {
    ElMessage.warning('缺少专家或会议信息，无法人工复核')
    return
  }
  manualReviewItem.value = { ...item }
  manualReviewVisible.value = true
}

const closeFilePreview = () => {
  filePreviewVisible.value = false
  previewFiles.value = []
  activePreviewKey.value = ''
}

/** RuleReviewDetailModal 已过滤出可预览附件，这里只负责解析目标文件并打开预览弹窗 */
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
}

const normalizeTaskId = (data: any) => {
  if (data && typeof data === 'object') return String(data.taskId ?? '').trim()
  return String(data ?? '').trim()
}

const resetAuditOpinion = () => {
  taskId.value = ''
  auditConclusion.value = ''
  auditOpinions.value = []
  emptyText.value = '暂无AI审核意见'
  closeRuleDetail()
  manualReviewVisible.value = false
  manualReviewItem.value = null
  detailModal.visible = false
  detailModal.initialDetailId = ''
}

const loadAuditOpinions = async () => {
  const seq = ++loadSeq
  const proId = String(props.project?.originXmId ?? '').trim()
  resetAuditOpinion()
  if (!proId) return

  loading.value = true
  try {
    const taskRes = await getAuditTaskIdByProId(proId)
    if (seq !== loadSeq) return

    const nextTaskId = normalizeTaskId(taskRes.data)
    if (!nextTaskId) return

    if (!taskRes.success) {
      emptyText.value = 'AI审核意见获取失败'
      ElMessage.error(taskRes.msg || 'AI审核任务获取失败')
      return
    }
    taskId.value = nextTaskId

    const [reviewResult, conclusionResult] = await Promise.allSettled([
      getRuleReviewInfo({
        taskId: nextTaskId,
        ruleClassify: '',
        reviewOpinions: REVIEW_OPINIONS
      }),
      getXmAuditConclude(nextTaskId)
    ])
    if (seq !== loadSeq) return

    if (conclusionResult.status === 'fulfilled' && conclusionResult.value.success) {
      auditConclusion.value = normalizeAuditSummaryData(conclusionResult.value.data).auditConclude
    }

    if (reviewResult.status === 'rejected') throw reviewResult.reason
    const reviewRes = reviewResult.value
    if (!reviewRes.success) {
      emptyText.value = 'AI审核意见获取失败'
      ElMessage.error(reviewRes.msg || 'AI审核意见获取失败')
      return
    }

    const detailIds = new Set<string>()
    auditOpinions.value = (Array.isArray(reviewRes.data) ? reviewRes.data : []).filter((item) => {
      const key = String(item.detailId || item.ruleId)
      if (detailIds.has(key)) return false
      detailIds.add(key)
      return true
    }) as AiAuditOpinionItem[]
    emptyText.value = auditOpinions.value.length ? '' : '暂无AI审核意见'
  } catch (error: any) {
    if (seq !== loadSeq) return
    emptyText.value = 'AI审核意见获取失败'
    ElMessage.error(error?.message || 'AI审核意见获取失败')
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

const openDetailModal = () => {
  if (loading.value) return
  if (!taskId.value) {
    ElMessage.info('暂无AI审核意见')
    return
  }
  detailModal.visible = true
}

const closeDetailModal = () => {
  detailModal.visible = false
}

defineExpose({
  openDetailModal
})

watch(
  () => [projectId.value, props.project],
  () => loadAuditOpinions(),
  { immediate: true }
)

onBeforeUnmount(() => {
  loadSeq += 1
  closeFilePreview()
  closeDetailModal()
})
</script>

<style scoped lang="less">
@import '../styles/sectionTitle.less';

.joint-review-ai-audit {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
}

.joint-review-ai-audit__header {
  flex: 0 0 44px;
  height: 44px;
  min-height: 44px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  border-bottom: 1px solid #f1f5f9;
}

.joint-review-ai-audit__ai-icon {
  width: 22px;
  height: 22px;
  display: block;
  color: var(--color-primary, #00857c);
}

.joint-review-ai-audit__title .section-title__icon {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
}

.joint-review-ai-audit__more {
  width: 68px;
  height: 28px;
  margin: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  color: var(--color-primary, #00857c);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  appearance: none;
  transition: color 0.2s;

  .el-icon--right {
    margin-left: 0;
  }

  &:hover {
    color: #006f68;

    i {
      animation: rotate-more 0.6s ease;
    }
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 133, 124, 0.35);
    outline-offset: 2px;
    border-radius: 2px;
  }

  &.is-loading {
    cursor: wait;
    opacity: 0.65;
  }
}

.joint-review-ai-audit__content {
  flex: 1;
  min-height: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-sizing: border-box;
}

.joint-review-ai-audit__conclusion {
  flex: 0 0 auto;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.joint-review-ai-audit__conclusion-icon {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  color: var(--color-primary, #00857c);
}

.joint-review-ai-audit__conclusion-text {
  flex: 1;
  min-width: 0;
}

@keyframes rotate-more {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}
</style>
