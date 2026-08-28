<template>
  <vxe-modal
    ref="modalRef"
    :model-value="visible"
    :destroy-on-close="true"
    :show-footer="false"
    :show-close="false"
    show-zoom
    resize
    draggable
    esc-closable
    position="center"
    width="calc(100vw - 32px)"
    height="calc(100vh - 32px)"
    class-name="joint-review-ai-workbench-modal"
    @hide="handleHide"
    @show="syncZoomState"
    @zoom="syncZoomState"
  >
    <template #header>
      <div class="joint-review-ai-workbench-modal__header">
        <div class="joint-review-ai-workbench-modal__header-copy">
          <span class="joint-review-ai-workbench-modal__eyebrow">AI审核意见</span>
          <span class="joint-review-ai-workbench-modal__title">规则详情</span>
        </div>
        <div class="joint-review-ai-workbench-modal__actions">
          <!-- 详情尚未准备好时保留原有入口与禁用逻辑；详情就绪后由工作台详情头部承载按钮。 -->
          <button
            v-if="canRerun && (loading || rerunning || !ready || !item)"
            type="button"
            class="joint-review-ai-workbench-modal__action"
            :disabled="rerunning || rerunConfirming"
            title="重新分析"
            aria-label="重新分析"
            @mousedown.stop
            @dblclick.stop
            @click.stop="emit('rerun')"
          >
            <el-icon aria-hidden="true"><RotateCw /></el-icon>
          </button>
          <button
            type="button"
            class="joint-review-ai-workbench-modal__action"
            :title="isMaximized ? '还原窗口' : '最大化窗口'"
            :aria-label="isMaximized ? '还原窗口' : '最大化窗口'"
            @mousedown.stop
            @dblclick.stop
            @click.stop="toggleZoom"
          >
            <el-icon aria-hidden="true"><component :is="isMaximized ? Minimize2 : Maximize2" /></el-icon>
          </button>
          <button
            type="button"
            class="joint-review-ai-workbench-modal__action joint-review-ai-workbench-modal__action--close"
            title="关闭"
            aria-label="关闭审核意见详情"
            @mousedown.stop
            @dblclick.stop
            @click.stop="$emit('close')"
          >
            <el-icon aria-hidden="true"><X /></el-icon>
          </button>
        </div>
      </div>
    </template>

    <div v-if="loading || rerunning" class="joint-review-ai-workbench-modal__loading" aria-live="polite">
      <RerunLoading :title="item?.ruleName || 'AI模型推理中'" :subtitle="rerunning ? '正在重新分析' : '正在加载评审详情'" />
    </div>
    <div
      v-else-if="ready && item"
      ref="previewStageRef"
      class="joint-review-ai-workbench-modal__workspace-shell review-workbench"
      :style="{ '--preview-drawer-width': previewWidthStyle }"
    >
      <RuleWorkspace
        class="joint-review-ai-workbench-modal__workspace"
        :project-task-id="projectTaskId"
        :selected-rules="[rule]"
        :filtered-rules="[rule]"
        :selected-rule="rule"
        :rule-filters="ruleFilters"
        active-rule-filter=""
        :rules-loading="false"
        :rule-detail-loading="false"
        rule-empty-text="暂无评审规则"
        :preview-open="isPreviewOpen"
        :can-rerun="canRerun"
        :rerunning-rule-ids="rerunningRuleIds"
        :rerun-confirming-rule-id="rerunConfirmingRuleId"
        @rerun-rule="emit('rerun')"
        @preview-attach="openMaterialPreview"
      />
      <DocumentPreviewPanel
        v-if="isPreviewOpen"
        ref="previewPanelRef"
        :visible="isPreviewOpen"
        :loading="previewLoading"
        :error-text="previewErrorText"
        :source="previewSource"
        :file-name="previewFileName"
        :file-type="previewFileType"
        :width="previewWidthStyle"
        :width-value="previewWidthValue"
        :min-width="previewMinWidth"
        :max-width="previewMaxWidth"
        :pdf-options="previewPdfOptions"
        :toolbar-options="previewToolbarOptions"
        @close="closePreview"
        @reload="reloadPreview"
        @error="handlePreviewError"
        @resize-start="startPreviewResize"
        @resize-keydown="handlePreviewResizeKeydown"
        @reset-width="resetPreviewWidth"
      />
    </div>
    <div v-else class="joint-review-ai-workbench-modal__empty">暂无评审详情</div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { Maximize2, Minimize2, RotateCw, X } from 'lucide-vue-next'
import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import type { RuleReviewDetailItem } from '@/views/ai/smartTaskAudit/components/auditDetailHelpers'
import RerunLoading from '@/views/ai/smartTaskAudit/components/RerunLoading.vue'
import RuleWorkspace from '@/views/ai/workbenchView/components/RuleWorkspace.vue'
import DocumentPreviewPanel from '@/views/ai/workbenchView/components/DocumentPreviewPanel.vue'
import { useDocumentPreviewDrawer } from '@/views/ai/workbenchView/composables/useDocumentPreviewDrawer'
import type { ReviewRule, WorkbenchFilterOption } from '@/views/ai/workbenchView/types'

const props = defineProps({
  visible: { type: Boolean, default: false },
  item: { type: Object as PropType<RuleReviewDetailItem | null>, default: null },
  loading: { type: Boolean, default: false },
  rerunning: { type: Boolean, default: false },
  ready: { type: Boolean, default: false },
  rerunConfirming: { type: Boolean, default: false },
  canRerun: { type: Boolean, default: true }
})

const emit = defineEmits(['close', 'rerun'])

const modalRef = ref<any>()
const isMaximized = ref(false)
const previewStageRef = ref<HTMLElement | null>(null)
const previewPanelRef = ref<InstanceType<typeof DocumentPreviewPanel> | null>(null)
const ruleFilters: WorkbenchFilterOption[] = [{ label: '全部', value: '' }]
const projectTaskId = computed(() => String(props.item?.taskId || '').trim())

const rule = computed<ReviewRule>(() => {
  const item = props.item || ({} as RuleReviewDetailItem)
  const reviewOpinion = String(item.reviewOpinion ?? '')
  const result = reviewOpinion === '1' ? 'passed' : reviewOpinion === '0' ? 'failed' : 'warning'
  return {
    id: String(item.detailId || item.ruleId || ''),
    detailId: String(item.detailId || ''),
    code: String(item.ruleCode || item.ruleId || ''),
    category: String(item.ruleClassify || ''),
    name: String(item.ruleName || '评审详情'),
    result,
    level: String(item.ruleLevel || ''),
    ruleDesc: String(item.ruleDesc || ''),
    description: String(item.ruleDesc || ''),
    ruleviewConclude: String(item.reviewConclude || ''),
    auditResult: String(item.reviewOpinionName || item.reviewOpinion || ''),
    analysisProcess: String(item.reviewProcess || ''),
    reviewMessage: String(item.reviewMessage || ''),
    reviewTable: item.reviewTable,
    extracted: '',
    requirement: '',
    conclusion: String(item.reviewConclude || ''),
    document: '',
    page: 0,
    section: '',
    before: '',
    source: '',
    after: ''
  }
})

const ruleDetailId = computed(() => String(rule.value.detailId || '').trim())
const rerunningRuleIds = computed<ReadonlySet<string>>(() => {
  return props.rerunning && ruleDetailId.value ? new Set([ruleDetailId.value]) : new Set()
})
const rerunConfirmingRuleId = computed(() => (props.rerunConfirming && ruleDetailId.value ? ruleDetailId.value : ''))

const {
  visible: isPreviewOpen,
  loading: previewLoading,
  errorText: previewErrorText,
  source: previewSource,
  fileName: previewFileName,
  fileType: previewFileType,
  widthStyle: previewWidthStyle,
  widthValue: previewWidthValue,
  minWidth: previewMinWidth,
  maxWidth: previewMaxWidth,
  pdfOptions: previewPdfOptions,
  toolbarOptions: previewToolbarOptions,
  open: openPreview,
  close: closePreview,
  reload: reloadPreview,
  resetWidth: resetPreviewWidth,
  startResize: startPreviewResize,
  handleResizeKeydown: handlePreviewResizeKeydown,
  handleError: handlePreviewError
} = useDocumentPreviewDrawer(previewStageRef)

const openMaterialPreview = (file: TXmAttach, trigger?: HTMLElement | null) => {
  void openPreview(file, trigger)
}

watch(isPreviewOpen, (visible) => {
  if (visible) void nextTick(() => previewPanelRef.value?.focus({ preventScroll: true }))
})

const syncZoomState = async () => {
  await nextTick()
  isMaximized.value = Boolean(modalRef.value?.isMaximized?.())
}

const toggleZoom = async () => {
  await modalRef.value?.zoom?.()
  await syncZoomState()
}

const handleHide = () => {
  closePreview({ restoreFocus: false })
  isMaximized.value = false
  if (props.visible) emit('close')
}
</script>

<style lang="less">
@import '@/views/ai/workbenchView/css/index.less';

.joint-review-ai-workbench-modal {
  --vxe-modal-body-background-color: #f5fbfb;
  --vxe-modal-header-background-color: #ffffff;
}

.joint-review-ai-workbench-modal .vxe-modal--box {
  max-width: 1480px;
  overflow: hidden;
  border: 1px solid #b8ddd9;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 112, 107, 0.12);
}

.joint-review-ai-workbench-modal.is--maximize .vxe-modal--box,
.joint-review-ai-workbench-modal .vxe-modal--box.is--maximize {
  max-width: none;
  border-radius: 0;
}

.joint-review-ai-workbench-modal .vxe-modal--header {
  height: 48px;
  min-height: 48px;
  padding: 0 14px 0 16px;
  border-bottom: 1px solid #eef2f6;
  background: #ffffff;
}

.joint-review-ai-workbench-modal .vxe-modal--body,
.joint-review-ai-workbench-modal .vxe-modal--content {
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #f5fbfb;
}

.joint-review-ai-workbench-modal .vxe-modal--body {
  flex: 1 1 0;
  height: 0;
}

.joint-review-ai-workbench-modal .vxe-modal--content {
  flex: 1 1 0;
  display: flex;
  height: auto;
}

.joint-review-ai-workbench-modal__header,
.joint-review-ai-workbench-modal__actions,
.joint-review-ai-workbench-modal__header-copy {
  display: flex;
  align-items: center;
}

.joint-review-ai-workbench-modal__header {
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

.joint-review-ai-workbench-modal__header-copy {
  min-width: 0;
  gap: 10px;
}

.joint-review-ai-workbench-modal__eyebrow {
  color: #00706b;
  font-size: 12px;
  font-weight: 600;
}

.joint-review-ai-workbench-modal__title {
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
}

.joint-review-ai-workbench-modal__actions {
  gap: 4px;
}

.joint-review-ai-workbench-modal__action {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #64748b;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.joint-review-ai-workbench-modal__action:hover,
.joint-review-ai-workbench-modal__action:focus-visible {
  color: #00706b;
  background: #f2f9f8;
}

.joint-review-ai-workbench-modal__action:focus-visible {
  outline: 2px solid #00706b;
  outline-offset: 1px;
}

.joint-review-ai-workbench-modal__action--close:hover {
  color: #f56c6c;
  background: #fff5f5;
}

.joint-review-ai-workbench-modal__action:disabled {
  color: #94a3b8;
  cursor: wait;
  background: transparent;
}

.joint-review-ai-workbench-modal__workspace {
  flex: 1 1 0;
  width: 100%;
  min-height: 0;
}

.joint-review-ai-workbench-modal__workspace-shell {
  position: relative;
  flex: 1 1 0;
  width: 100%;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.joint-review-ai-workbench-modal__workspace .rule-list-card {
  display: none;
}

.joint-review-ai-workbench-modal__workspace.rule-workspace {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 0;
}

.joint-review-ai-workbench-modal__workspace.rule-workspace--preview-open {
  padding-left: max(320px, var(--preview-drawer-width, 50%));
}

.joint-review-ai-workbench-modal__workspace .rule-detail-card {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 0;
}

.joint-review-ai-workbench-modal__loading,
.joint-review-ai-workbench-modal__empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: #f5fbfb;
}
</style>
