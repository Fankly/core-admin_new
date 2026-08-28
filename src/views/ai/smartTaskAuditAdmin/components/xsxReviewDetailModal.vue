<!-- 相似性分析 -->
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
    :title="item?.ruleName || '评审详情'"
    class-name="smart-task-audit-rule-detail-modal"
    @hide="handleModalHide"
    @show="syncModalZoomState"
    @zoom="syncModalZoomState"
  >
    <template #header>
      <div class="audit-modal-hero">
        <h2 class="audit-modal-hero__title" :title="item?.ruleName || '评审详情'">
          <span class="audit-modal-hero__title-text">{{ item?.ruleName || '评审详情' }}</span>
          <span class="audit-modal-hero__title-dots" aria-hidden="true"></span>
        </h2>
        <div class="audit-modal-hero__art" aria-hidden="true">
          <img class="audit-modal-hero__platform" :src="heroCircuitPlatform" alt="" />
          <img class="audit-modal-hero__cube" :src="heroAiCube" alt="" />
        </div>
        <div class="audit-modal-window-controls">
          <button
            type="button"
            class="audit-modal-window-control trigger--btn"
            :aria-label="isMaximized ? '还原窗口' : '最大化窗口'"
            :title="isMaximized ? '还原窗口' : '最大化窗口'"
            @mousedown.stop
            @dblclick.stop
            @click.stop="handleToggleZoom"
          >
            <img :src="isMaximized ? windowRestoreIcon : windowMaximizeIcon" alt="" />
          </button>
          <button
            type="button"
            class="audit-modal-window-control audit-modal-window-control--close trigger--btn"
            aria-label="关闭评审详情"
            title="关闭"
            @mousedown.stop
            @dblclick.stop
            @click.stop="handleClose"
          >
            <img :src="windowCloseIcon" alt="" />
          </button>
        </div>
      </div>
    </template>
    <div
      v-if="item"
      ref="contentRef"
      class="audit-rule-detail-modal__content"
      :class="{ 'audit-rule-detail-modal__content--loading': loading || rerunning }"
    >
      <RerunLoading v-if="rerunning" :title="item.ruleName || 'AI 模型推理中'" subtitle="正在重新分析" />
      <RerunLoading v-else-if="loading" :title="item.ruleName || 'AI 模型推理中'" subtitle="正在加载评审详情" />
      <template v-else-if="ready">
        <div class="review-card review-card--conclusion" :class="`review-card--${cardTone}`" style="--card-index: 0">
          <div class="conclusion-avatar" aria-hidden="true">
            <img :src="conclusionAvatar" alt="" />
          </div>
          <div class="review-card__header">
            <span class="title">
              <span class="review-card__title-text">
                <span class="review-card__title-label-row">
                  <span class="review-card__title-label">AI审核结论</span>
                  <div v-if="hasAuditStatus || auditStatusText" :class="['audit-status', auditStatusToneClass]">
                    <img v-if="auditStatusIcon" class="status-icon" :src="auditStatusIcon" alt="" />
                    {{ auditStatusText }}
                  </div>
                </span>
                <span class="review-card__title-hint">模型输出结果，仅供业务参考</span>
              </span>
            </span>
            <div class="review-card__actions">
              <el-popover
                v-model:visible="previewPopoverVisible"
                placement="bottom-end"
                :width="480"
                trigger="click"
                popper-class="smart-task-audit-preview-attach-popover"
                @show="loadAttachList"
              >
                <template #reference>
                  <button type="button" class="preview-btn" :disabled="previewing" :aria-expanded="previewPopoverVisible" aria-haspopup="dialog">
                    <img class="preview-btn__icon" :src="previewIcon" alt="" />
                    <span>预览</span>
                  </button>
                </template>
                <div v-loading="attachListLoading" class="preview-attach-panel">
                  <div class="preview-attach-panel__header">
                    <div class="preview-attach-panel__title-wrap">
                      <span class="preview-attach-panel__title-bar" aria-hidden="true"></span>
                      <span class="preview-attach-panel__title">附件列表</span>
                    </div>
                    <span v-if="attachList.length" class="preview-attach-panel__count">共 {{ attachList.length }} 个</span>
                  </div>
                  <div v-if="attachList.length" class="preview-attach-panel__table-wrap">
                    <table class="preview-attach-table">
                      <thead>
                        <tr>
                          <th class="preview-attach-table__col-name">附件名称</th>
                          <th class="preview-attach-table__col-type">附件类型</th>
                          <th class="preview-attach-table__col-action">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="row in attachList" :key="getAttachKey(row)">
                          <td class="preview-attach-table__col-name" :title="getAttachDisplayName(row)">
                            <span class="preview-attach-table__name">{{ getAttachDisplayName(row) }}</span>
                          </td>
                          <td class="preview-attach-table__col-type" :title="getAttachTypeName(row)">
                            <span class="preview-attach-table__type">{{ getAttachTypeName(row) }}</span>
                          </td>
                          <td class="preview-attach-table__col-action">
                            <button
                              type="button"
                              class="preview-attach-table__action"
                              :disabled="previewing || !isAttachPreviewable(row)"
                              :title="isAttachPreviewable(row) ? '预览' : '暂不支持预览'"
                              @click.prevent.stop="handlePreviewAttach(row)"
                            >
                              预览
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else-if="!attachListLoading" class="preview-attach-panel__empty">
                    <span>{{ attachListEmptyText }}</span>
                  </div>
                </div>
              </el-popover>
              <button type="button" class="rerun-btn" :disabled="rerunConfirming" @click.prevent.stop="$emit('rerun')">
                <img class="rerun-btn__icon" :src="rerunIcon" alt="" />
                <span>重新分析</span>
              </button>
            </div>
          </div>
          <div v-if="item.reviewConclude" class="review-card__content">
            <TypewriterText
              :text="item.reviewConclude"
              :animate="typewriterAnimate"
              :persist-key="concludePersistKey"
              @attach-preview="handleInlineAttachPreview"
              @typing-progress="followTypewriter"
              @typing-complete="handleConcludeTypingComplete"
            />
          </div>
          <div v-else class="review-card__content review-card__empty">暂无审核结论</div>
        </div>
        <div v-if="top10.length > 0" class="review-card review-card--process" style="--card-index: 1">
          <div class="review-card__header">
            <span class="title">
              <span class="review-card__title-icon-wrap">
                <img class="review-card__title-icon" :src="reviewProcessIcon" alt="" />
              </span>
              <span class="review-card__title-text">
                <span class="review-card__title-label">相似项目TOP10</span>
                <span class="review-card__title-hint">{{ isSimilarityAnalysisMode ? '按项目特征匹配度排序' : '推理链路与关键判断依据' }}</span>
              </span>
            </span>
          </div>
          <div class="review-card__content">
            <Top10Typewriter
              v-if="top10.length > 0"
              :items="top10"
              :animate="typewriterAnimate"
              :persist-key="processPersistKey"
              :item-delay="400"
              :display-mode="displayMode"
              @typing-progress="followTypewriter"
              @typing-complete="handleProcessTypingComplete"
            />
            <div v-else class="review-card__empty">暂无相似项目</div>
          </div>
          <div class="process-art" aria-hidden="true">
            <svg class="process-art__orbit" viewBox="0 0 420 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="audit-orbit-main" x1="28" y1="48" x2="392" y2="192" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#9AF3E9" stop-opacity=".32" />
                  <stop offset=".48" stop-color="#22B8A8" />
                  <stop offset="1" stop-color="#48D4C5" stop-opacity=".38" />
                </linearGradient>
                <linearGradient id="audit-orbit-cross" x1="116" y1="28" x2="304" y2="212" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#62E0D2" stop-opacity=".28" />
                  <stop offset=".5" stop-color="#0FAE9E" stop-opacity=".82" />
                  <stop offset="1" stop-color="#A4F5EC" stop-opacity=".24" />
                </linearGradient>
                <radialGradient
                  id="audit-orbit-core-glow"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(210 120) scale(96 62)"
                >
                  <stop stop-color="#7EEADF" stop-opacity=".42" />
                  <stop offset=".55" stop-color="#2BC4B4" stop-opacity=".12" />
                  <stop offset="1" stop-color="#2BC4B4" stop-opacity="0" />
                </radialGradient>
                <filter id="audit-orbit-dot-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <!-- soft core glow -->
              <ellipse class="process-art__orbit-core" cx="210" cy="120" rx="96" ry="62" fill="url(#audit-orbit-core-glow)" />

              <!-- main horizontal orbit -->
              <g class="process-art__orbit-spin process-art__orbit-spin--main">
                <ellipse cx="210" cy="120" rx="180" ry="66" stroke="url(#audit-orbit-main)" stroke-width="3" />
                <g class="process-art__orbit-satellite" filter="url(#audit-orbit-dot-glow)">
                  <circle cx="390" cy="120" r="8.5" fill="#D8FBF7" fill-opacity=".46" />
                  <circle cx="390" cy="120" r="4.2" fill="#35C7B7" />
                </g>
              </g>

              <!-- tilted orbits -->
              <g class="process-art__orbit-spin process-art__orbit-spin--cross-a">
                <ellipse cx="210" cy="120" rx="176" ry="62" stroke="url(#audit-orbit-cross)" stroke-width="2.5" />
                <g class="process-art__orbit-satellite" filter="url(#audit-orbit-dot-glow)">
                  <circle cx="386" cy="120" r="7.5" fill="#D8FBF7" fill-opacity=".4" />
                  <circle cx="386" cy="120" r="3.6" fill="#15AD9E" />
                </g>
              </g>
              <g class="process-art__orbit-spin process-art__orbit-spin--cross-b">
                <ellipse cx="210" cy="120" rx="176" ry="62" stroke="url(#audit-orbit-cross)" stroke-width="2.5" />
                <g class="process-art__orbit-satellite" filter="url(#audit-orbit-dot-glow)">
                  <circle cx="386" cy="120" r="6.5" fill="#D8FBF7" fill-opacity=".38" />
                  <circle cx="386" cy="120" r="3.2" fill="#4DD2C4" />
                </g>
              </g>

              <!-- dashed inner track -->
              <ellipse
                class="process-art__orbit-dash"
                cx="210"
                cy="120"
                rx="143"
                ry="47"
                stroke="#67DDD0"
                stroke-width="1.5"
                stroke-dasharray="5 9"
                stroke-opacity=".5"
              />

              <!-- sweep highlight arc -->
              <ellipse
                class="process-art__orbit-sweep"
                cx="210"
                cy="120"
                rx="180"
                ry="66"
                stroke="#9AF3E9"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-dasharray="48 1080"
                stroke-opacity=".72"
              />
            </svg>
            <img class="process-art__platform" :src="processPlatform" alt="" />
            <img class="process-art__cube" :src="processCube" alt="" />
          </div>
        </div>

        <div v-if="showReviewTables" class="review-tables-sequence">
          <template v-if="reviewTables.length">
            <div
              v-for="(table, tableIndex) in reviewTables"
              :key="`${table.tableMeta?.title || 'table'}-${tableIndex}`"
              class="review-card review-card--table"
              :style="{ '--card-index': 2 + tableIndex }"
            >
              <img class="review-card__table-art" :src="tableMagnifier" alt="" aria-hidden="true" />
              <div class="review-card__header">
                <span class="title">
                  <span class="review-card__title-icon-wrap">
                    <img class="review-card__title-icon" :src="reviewTableIcon" alt="" />
                  </span>
                  <span class="review-card__title-text">
                    <span class="review-card__title-label">{{ getReviewTableTitle(table) }}</span>
                    <span class="review-card__title-hint">结构化分析明细</span>
                  </span>
                </span>
              </div>
              <div class="review-card__content audit-review-table">
                <vxe-grid v-bind="getReviewGridOptions(table)" class="audit-review-table__table" />
              </div>
            </div>
          </template>
        </div>
      </template>
      <div v-else class="audit-empty audit-empty--inline">
        <img class="audit-empty__icon" :src="emptyStateIcon" alt="" />
        <div class="audit-empty__text">暂无评审详情</div>
      </div>
    </div>
    <div v-else class="audit-empty">
      <img class="audit-empty__icon" :src="emptyStateIcon" alt="" />
      <div class="audit-empty__text">暂无评审详情</div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeModalInstance } from 'vxe-table'
import { listAttach } from '@/api/ai/smartTaskAudit'
import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import conclusionAvatar from '@/assets/images/smart-review/rule-review-detail/conclusion-avatar.png'
import emptyStateIcon from '@/assets/images/smart-review/rule-review-detail/empty-state.svg'
import heroAiCube from '@/assets/images/smart-review/rule-review-detail/hero-ai-cube.png'
import heroCircuitPlatform from '@/assets/images/smart-review/rule-review-detail/hero-circuit-platform.png'
import processCube from '@/assets/images/smart-review/rule-review-detail/process-cube.png'
import processPlatform from '@/assets/images/smart-review/rule-review-detail/process-platform.png'
import tableMagnifier from '@/assets/images/smart-review/rule-review-detail/table-magnifier.png'
import previewIcon from '@/assets/images/smart-review/rule-review-detail/icon-preview.svg'
import rerunIcon from '@/assets/images/smart-review/rule-review-detail/icon-rerun.svg'
import reviewProcessIcon from '@/assets/images/smart-review/rule-review-detail/icon-process.svg'
import reviewTableIcon from '@/assets/images/smart-review/rule-review-detail/icon-table.svg'
import statusFailedIcon from '@/assets/images/smart-review/rule-review-detail/status-failed.svg'
import statusPassedIcon from '@/assets/images/smart-review/rule-review-detail/status-passed.svg'
import statusPendingIcon from '@/assets/images/smart-review/rule-review-detail/status-pending.svg'
import windowCloseIcon from '@/assets/images/smart-review/rule-review-detail/window-close.svg'
import windowMaximizeIcon from '@/assets/images/smart-review/rule-review-detail/window-maximize.svg'
import windowRestoreIcon from '@/assets/images/smart-review/rule-review-detail/window-restore.svg'
import { getOfficeFileExtension } from '@/components/OfficePreview'
import RerunLoading from './RerunLoading.vue'
import TypewriterText from './TypewriterText.vue'
import Top10Typewriter from './Top10Typewriter.vue'
import { getReviewGridOptions, getReviewTables, getReviewTableTitle, getRuleReviewCardTone, parsePossiblyEscapedJson } from './auditDetailHelpers'
import type { RuleReviewDetailItem } from './auditDetailHelpers'

// doc：后端已转换为可预览格式（如 docx），前端按扩展名放行
const SUPPORTED_PREVIEW_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xlsx', 'xls', 'et'])

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object as PropType<RuleReviewDetailItem | null>,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  rerunning: {
    type: Boolean,
    default: false
  },
  ready: {
    type: Boolean,
    default: false
  },
  rerunConfirming: {
    type: Boolean,
    default: false
  },
  previewing: {
    type: Boolean,
    default: false
  },
  typewriterAnimate: {
    type: Boolean,
    default: false
  },
  concludePersistKey: {
    type: [String, Number] as PropType<string | number>,
    default: ''
  },
  processPersistKey: {
    type: [String, Number] as PropType<string | number>,
    default: ''
  },
  displayMode: {
    type: String as PropType<'evidence-keywords' | 'similarity-analysis'>,
    default: 'evidence-keywords'
  }
})

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'preview', file: TXmAttach, files: TXmAttach[]): void
  (event: 'rerun'): void
}>()

const modalRef = ref<VxeModalInstance>()
const isMaximized = ref(false)
const previewPopoverVisible = ref(false)
const contentRef = ref<HTMLElement | null>(null)
const concludeTypingComplete = ref(false)
const processTypingComplete = ref(false)
const isSimilarityAnalysisMode = computed(() => props.displayMode === 'similarity-analysis')
let typewriterScrollFrame: number | null = null

const top10 = computed<any[]>(() => {
  const raw = (props.item as any)?.reviewMessage
  if (!raw) return []
  const parsed = typeof raw === 'string' ? parsePossiblyEscapedJson(raw) : raw
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).top10)) {
    return (parsed as any).top10
  }
  if (Array.isArray(parsed)) return parsed
  return []
})

const syncModalZoomState = async () => {
  await nextTick()
  isMaximized.value = Boolean(modalRef.value?.isMaximized())
}

const handleToggleZoom = async () => {
  await modalRef.value?.zoom()
  await syncModalZoomState()
}

const handleClose = () => {
  previewPopoverVisible.value = false
  emit('close')
}

const handleModalHide = () => {
  isMaximized.value = false
  previewPopoverVisible.value = false
  if (props.visible) emit('close')
}

const syncTypingState = () => {
  concludeTypingComplete.value = !props.typewriterAnimate || !props.item?.reviewConclude
  processTypingComplete.value = !props.typewriterAnimate || top10.value.length === 0
}

const handleConcludeTypingComplete = () => {
  concludeTypingComplete.value = true
}

const handleProcessTypingComplete = () => {
  processTypingComplete.value = true
}

const followTypewriter = () => {
  if (!props.typewriterAnimate || typewriterScrollFrame !== null) return
  typewriterScrollFrame = requestAnimationFrame(async () => {
    typewriterScrollFrame = null
    await nextTick()
    const content = contentRef.value
    if (content) content.scrollTop = content.scrollHeight
  })
}

onBeforeUnmount(() => {
  if (typewriterScrollFrame !== null) cancelAnimationFrame(typewriterScrollFrame)
})

const attachListLoading = ref(false)
const attachList = ref<TXmAttach[]>([])
const attachListEmptyText = ref('暂无附件')
const attachListDetailId = ref('')
let attachListLoadSeq = 0

const decodeAttachName = (value: unknown) => {
  let result = String(value ?? '').trim()
  if (!result) return '未命名附件'

  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(result)
      if (decoded === result) break
      result = decoded
    } catch {
      break
    }
  }
  return result
}

const getAttachKey = (file: TXmAttach) => String(file.uuid || file.id || '')

const getAttachDisplayName = (file: TXmAttach) => decodeAttachName(file.name)

const getAttachExtension = (file: TXmAttach) => getOfficeFileExtension(getAttachDisplayName(file))

const getAttachTypeName = (file: TXmAttach) => {
  const typeName = String(file.fjType || '').trim()
  if (typeName) return typeName
  const fjId = String(file.fjId || '').trim()
  if (fjId) return fjId
  const extension = getAttachExtension(file)
  return extension ? extension.toUpperCase() : '-'
}

const isAttachPreviewable = (file: TXmAttach) => {
  const extension = getAttachExtension(file)
  return Boolean(extension && SUPPORTED_PREVIEW_EXTENSIONS.has(extension))
}

const resetAttachList = () => {
  attachListLoadSeq += 1
  previewPopoverVisible.value = false
  attachListLoading.value = false
  attachList.value = []
  attachListEmptyText.value = '暂无附件'
  attachListDetailId.value = ''
}

const loadAttachList = async () => {
  const detailId = String(props.item?.detailId || '')
  if (!detailId) {
    attachList.value = []
    attachListEmptyText.value = '当前评审详情缺少明细ID'
    attachListDetailId.value = ''
    ElMessage.warning('当前评审详情缺少明细ID')
    return
  }

  // 同一明细已加载过则复用，避免重复请求
  if (attachListDetailId.value === detailId && attachList.value.length) {
    return
  }

  const seq = ++attachListLoadSeq
  attachListLoading.value = true
  attachListEmptyText.value = '暂无附件'
  try {
    const res = await listAttach(detailId)
    if (seq !== attachListLoadSeq) return
    if (!res.success) {
      attachList.value = []
      attachListDetailId.value = ''
      attachListEmptyText.value = res.msg || '源文件列表获取失败'
      ElMessage.error(res.msg || '源文件列表获取失败')
      return
    }

    const files = (Array.isArray(res.data) ? res.data : []).filter((file) => file && getAttachKey(file))
    attachList.value = files
    attachListDetailId.value = detailId
    attachListEmptyText.value = '暂无附件'
  } catch (e: any) {
    if (seq !== attachListLoadSeq) return
    attachList.value = []
    attachListDetailId.value = ''
    attachListEmptyText.value = e?.message || '源文件列表获取失败'
    ElMessage.error(e?.message || '源文件列表获取失败')
  } finally {
    if (seq === attachListLoadSeq) {
      attachListLoading.value = false
    }
  }
}

const handlePreviewAttach = (file: TXmAttach) => {
  if (props.previewing) return
  if (!isAttachPreviewable(file)) {
    ElMessage.warning('暂不支持预览该文件，仅支持 PDF、DOC、DOCX、XLSX、XLS、ET')
    return
  }

  const previewableFiles = attachList.value.filter(isAttachPreviewable)
  previewPopoverVisible.value = false
  emit('preview', file, previewableFiles.length ? previewableFiles : [file])
}

/** 正文内 .attachView：用 data-attach-id 预览，data-attach-name 作为附件名称 */
const handleInlineAttachPreview = (payload: { attachId: string; attachName?: string }) => {
  if (props.previewing) return

  const id = String(payload?.attachId || '').trim()
  if (!id) {
    ElMessage.warning('附件标识缺失，无法预览')
    return
  }

  const attachName = String(payload?.attachName || '').trim()

  // 若用户已打开过预览下拉，列表里可能有同 id 附件，优先用完整信息
  const matched = attachList.value.find((file) => String(file.id || '') === id || String(file.uuid || '') === id || String(file.fjId || '') === id)

  if (matched) {
    // 后端带了 data-attach-name 时覆盖展示名；否则沿用列表名称
    const file: TXmAttach = attachName ? { ...matched, name: attachName } : matched
    if (isAttachPreviewable(file)) {
      handlePreviewAttach(file)
      return
    }
    previewPopoverVisible.value = false
    emit('preview', file, [file])
    return
  }

  // 列表无匹配：按 id 直开，名称用 data-attach-name
  const file: TXmAttach = {
    id,
    uuid: id,
    name: attachName,
    fjId: '',
    size: 0,
    proId: ''
  }
  previewPopoverVisible.value = false
  emit('preview', file, [file])
}

watch(
  () => [props.visible, props.item?.detailId] as const,
  () => {
    resetAttachList()
  },
  { immediate: true }
)

watch(
  () => [props.visible, props.item?.detailId, props.item?.reviewConclude, props.item?.reviewProcess, props.ready, props.typewriterAnimate] as const,
  () => syncTypingState(),
  { immediate: true }
)

type AuditStatus = 'passed' | 'pending' | 'failed' | ''

const passedAuditOpinions = new Set(['1'])
const failedAuditOpinions = new Set(['0'])
const pendingAuditOpinions = new Set(['2'])
const auditStatusToneMap: Record<string, string> = {
  '1': 'success',
  '2': 'warning',
  '0': 'danger'
}
const auditStatusTextMap: Record<string, string> = {
  '1': '通过',
  '2': '待复核',
  '0': '不通过'
}

const cardTone = computed(() => (props.item ? getRuleReviewCardTone(props.item) : 'primary'))

const reviewTables = computed(() => (props.item ? getReviewTables(props.item.reviewTable) : []))
const showReviewTables = computed(() => reviewTables.value.length > 0 && concludeTypingComplete.value && processTypingComplete.value)

watch(showReviewTables, (visible) => {
  if (visible) followTypewriter()
})

const auditStatus = computed<AuditStatus>(() => {
  const reviewOpinion = String(props.item?.reviewOpinion ?? '')
  if (passedAuditOpinions.has(reviewOpinion)) return 'passed'
  if (pendingAuditOpinions.has(reviewOpinion)) return 'pending'
  if (failedAuditOpinions.has(reviewOpinion)) return 'failed'
  return ''
})

const hasAuditStatus = computed(() => Boolean(auditStatus.value))

const auditStatusText = computed(() => auditStatusTextMap[String(props.item?.reviewOpinion ?? '')] || props.item?.reviewOpinionName || '')

const auditStatusIcon = computed(() => {
  if (auditStatus.value === 'passed') return statusPassedIcon
  if (auditStatus.value === 'pending') return statusPendingIcon
  if (auditStatus.value === 'failed') return statusFailedIcon
  return ''
})

const auditStatusToneClass = computed(() => {
  const tone =
    auditStatusToneMap[String(props.item?.reviewOpinion ?? '')] ||
    (auditStatus.value === 'passed' ? 'success' : auditStatus.value === 'failed' ? 'danger' : '')
  return tone ? `audit-status--${tone}` : ''
})
</script>

<style scoped lang="less">
:global(.smart-task-audit-rule-detail-modal) {
  --vxe-modal-body-background-color: #f4f7f8;
  --vxe-modal-header-background-color: #f8fbfb;
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--header) {
  border-bottom: 1px solid rgba(14, 139, 141, 0.08);
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--body),
:global(.smart-task-audit-rule-detail-modal .vxe-modal--content) {
  padding: 0;
  overflow: hidden;
  background: linear-gradient(165deg, #f7fbfb 0%, #f2f5f7 48%, #eef3f5 100%);
}

.audit-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 220px;
  color: #6b7280;
  font-size: 14px;
}

.audit-empty--inline {
  min-height: 160px;
}

.audit-empty__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(14, 139, 141, 0.16), rgba(14, 139, 141, 0.04)),
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), transparent 60%);
  border: 1px solid rgba(14, 139, 141, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.audit-empty__text {
  color: #6b7280;
  letter-spacing: 0.02em;
}

.audit-rule-detail-modal__content {
  --audit-motion-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --audit-motion-press: cubic-bezier(0.2, 0, 0, 1);
  --audit-primary: var(--el-color-primary, #00706b);
  --audit-primary-soft: rgba(0, 112, 107, 0.08);
  --audit-border: rgba(15, 23, 42, 0.06);
  --audit-text: #1f2937;
  --audit-text-secondary: #4b5563;
  --audit-text-muted: #6b7280;
  height: 100%;
  padding: 18px 20px 22px;
  overflow-y: auto;
  box-sizing: border-box;
  background: radial-gradient(circle at top right, rgba(14, 139, 141, 0.08), transparent 34%),
    linear-gradient(165deg, #f7fbfb 0%, #f3f6f8 52%, #eef3f5 100%);
  scrollbar-width: thin;
  scrollbar-color: #c5d0d4 transparent;
}

.audit-rule-detail-modal__content--loading {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  background: transparent;
}

.audit-rule-detail-modal__content::-webkit-scrollbar {
  width: 6px;
}

.audit-rule-detail-modal__content::-webkit-scrollbar-thumb {
  background: #c5d0d4;
  border-radius: 999px;
}

.review-card__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
}

.preview-btn,
.rerun-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
  color: var(--audit-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(0, 112, 107, 0.22);
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: color 180ms var(--audit-motion-ease), background-color 180ms var(--audit-motion-ease), border-color 180ms var(--audit-motion-ease),
    box-shadow 180ms var(--audit-motion-ease), transform 180ms var(--audit-motion-press);

  i {
    font-size: 15px;
    transition: transform 360ms var(--audit-motion-ease);
    transform-origin: center;
  }

  &:hover {
    color: #fff;
    background: linear-gradient(135deg, #0e8b8d 0%, #00706b 100%);
    border-color: transparent;
    box-shadow: 0 8px 18px rgba(0, 112, 107, 0.22);
  }

  &:active {
    transform: translateY(1px) scale(0.98);
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.55;
    box-shadow: none;
  }
}

.rerun-btn:hover i {
  transform: rotate(120deg);
}

.preview-btn__icon {
  width: 15px;
  height: 15px;
  transition: transform 220ms var(--audit-motion-ease);
}

.preview-btn__caret {
  margin-left: 0;
  font-size: 12px;
  transition: transform 180ms var(--audit-motion-ease);
}

.preview-btn:hover .preview-btn__icon {
  transform: scale(1.08);
}

.preview-btn[aria-expanded='true'] .preview-btn__caret {
  transform: rotate(180deg);
}

.review-card {
  position: relative;
  overflow: hidden;
  color: var(--audit-text);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--audit-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.045);
  transform-origin: top center;
  animation: audit-review-card-enter 260ms var(--audit-motion-ease) both;
  animation-delay: calc(var(--card-index, 0) * 50ms);
}

.review-card + .review-card {
  margin-top: 14px;
}

.review-tables-sequence {
  margin-top: 14px;
  animation: audit-table-fade-in-up 600ms ease-out both;
}

.review-tables-sequence .review-card + .review-card {
  margin-top: 14px;
}

.review-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, rgba(0, 112, 107, 0.72), rgba(85, 202, 187, 0.55));
}

.review-card--conclusion {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 252, 252, 0.98) 100%);
  border-color: rgba(0, 112, 107, 0.1);
}

.review-card--conclusion.review-card--success::before {
  background: linear-gradient(180deg, #15803d, #86efac);
}

.review-card--conclusion.review-card--danger::before {
  background: linear-gradient(180deg, #be123c, #fda4af);
}

.review-card--conclusion.review-card--warning::before {
  background: linear-gradient(180deg, #c2410c, #fdba74);
}

.review-card--conclusion.review-card--primary::before {
  background: linear-gradient(180deg, #0e8b8d, #67e8f9);
}

.review-card--process::before {
  background: linear-gradient(180deg, #0284c7, #7dd3fc);
}

.review-card--table::before {
  background: linear-gradient(180deg, #0f766e, #5eead4);
}

.review-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px 12px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9) 0%, rgba(255, 255, 255, 0) 100%);

  .title {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    color: var(--audit-primary);
  }
}

.review-card__title-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  color: var(--audit-primary);
  background: linear-gradient(145deg, rgba(0, 112, 107, 0.12), rgba(0, 112, 107, 0.04)), #fff;
  border: 1px solid rgba(0, 112, 107, 0.1);
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.review-card--process .review-card__title-icon-wrap {
  color: #0284c7;
  background: linear-gradient(145deg, rgba(2, 132, 199, 0.12), rgba(2, 132, 199, 0.04)), #fff;
  border-color: rgba(2, 132, 199, 0.12);
}

.review-card--table .review-card__title-icon-wrap {
  color: #0f766e;
  background: linear-gradient(145deg, rgba(15, 118, 110, 0.12), rgba(15, 118, 110, 0.04)), #fff;
  border-color: rgba(15, 118, 110, 0.12);
}

.review-card__title-icon {
  display: block;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  background-color: currentColor;
  -webkit-mask: var(--review-card-title-icon) center / contain no-repeat;
  mask: var(--review-card-title-icon) center / contain no-repeat;
  user-select: none;
}

.review-card__title-text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.review-card__title-label-row {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.review-card__title-label {
  color: inherit;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

.review-card__title-hint {
  color: var(--audit-text-muted);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
}

/* 与列表页右侧状态标签同款 */
.audit-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 78px;
  height: 28px;
  padding: 0 12px;
  box-sizing: border-box;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  line-height: 26px;
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 1px 2px rgba(15, 23, 42, 0.04);
}

.audit-status--success {
  color: green;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.audit-status--danger {
  color: red;
  background: #fff1f2;
  border-color: #ffe4e6;
}

.audit-status--warning {
  color: orange;
  background: #fff7ed;
  border-color: #fed7aa;
}

.status-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  flex: 0 0 auto;
}

.review-card__content {
  padding: 6px 20px 20px;
  color: var(--audit-text-secondary);
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.review-card__content :deep(.typewriter--markdown) {
  display: block;
  white-space: normal;
}

.review-card__content :deep(.typewriter--markdown h1),
.review-card__content :deep(.typewriter--markdown h2),
.review-card__content :deep(.typewriter--markdown h3),
.review-card__content :deep(.typewriter--markdown h4),
.review-card__content :deep(.typewriter--markdown h5),
.review-card__content :deep(.typewriter--markdown h6) {
  margin: 0.8em 0 0.4em;
  color: var(--audit-text);
  font-weight: 700;
  line-height: 1.4;
}

.review-card__content :deep(.typewriter--markdown h1) {
  font-size: 1.4em;
}

.review-card__content :deep(.typewriter--markdown h2) {
  font-size: 1.25em;
}

.review-card__content :deep(.typewriter--markdown h3) {
  font-size: 1.12em;
}

.review-card__content :deep(.typewriter--markdown h4),
.review-card__content :deep(.typewriter--markdown h5),
.review-card__content :deep(.typewriter--markdown h6) {
  font-size: 1em;
}

.review-card__content :deep(.typewriter--markdown p) {
  margin: 0.5em 0;
}

.review-card__content :deep(.typewriter--markdown ul),
.review-card__content :deep(.typewriter--markdown ol) {
  margin: 0.5em 0;
  padding-left: 1.6em;
}

.review-card__content :deep(.typewriter--markdown li) {
  margin: 0.2em 0;
}

.review-card__content :deep(.typewriter--markdown blockquote) {
  margin: 0.6em 0;
  padding: 0.2em 0.9em;
  color: var(--audit-text-muted);
  border-left: 3px solid rgba(0, 112, 107, 0.22);
  background: rgba(0, 112, 107, 0.04);
}

.review-card__content :deep(.typewriter--markdown code) {
  padding: 0.15em 0.4em;
  font-size: 0.88em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 4px;
}

.review-card__content :deep(.typewriter--markdown pre) {
  margin: 0.6em 0;
  padding: 0.8em 1em;
  overflow-x: auto;
  background: rgba(15, 23, 42, 0.05);
  border-radius: 8px;
}

.review-card__content :deep(.typewriter--markdown pre code) {
  padding: 0;
  font-size: 0.88em;
  background: transparent;
  border-radius: 0;
}

.review-card__content :deep(.typewriter--markdown hr) {
  margin: 1em 0;
  border: 0;
  border-top: 1px solid var(--audit-border);
}

.review-card__content :deep(.typewriter--markdown a) {
  color: var(--audit-primary, #00706b);
  text-decoration: underline;
}

.review-card__content :deep(.typewriter--markdown table) {
  width: 100%;
  margin: 0.6em 0;
  border-collapse: collapse;
}

.review-card__content :deep(.typewriter--markdown th),
.review-card__content :deep(.typewriter--markdown td) {
  padding: 0.4em 0.7em;
  border: 1px solid var(--audit-border);
  text-align: left;
}

.review-card__content :deep(.typewriter--markdown th) {
  background: rgba(15, 23, 42, 0.04);
  font-weight: 600;
}

.review-card__content :deep(.typewriter--markdown del) {
  color: var(--audit-text-muted);
}

.review-card__empty {
  color: var(--audit-text-muted);
  font-size: 14px;
}

.audit-review-table {
  padding-top: 2px;
}

.audit-review-table__table {
  width: 100%;
}

.audit-review-table :deep(.vxe-table--header-wrapper) {
  background: #f4faf9;
}

.audit-review-table :deep(.vxe-header--column) {
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.audit-review-table :deep(.vxe-header--column .vxe-cell) {
  justify-content: center;
  text-align: center;
}

.audit-review-table :deep(.vxe-body--column) {
  font-size: 14px;
}

.audit-review-table :deep(.vxe-table--border-line),
.audit-review-table :deep(.vxe-table--header-border-line) {
  border-color: #e2e8f0;
}

.audit-review-table :deep(.vxe-body--row:hover) {
  background: rgba(0, 112, 107, 0.03);
}

.audit-review-table :deep(.vxe-table) {
  border-radius: 8px;
  overflow: hidden;
}

@keyframes audit-review-card-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes audit-table-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .review-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .review-card__actions {
    align-self: stretch;
  }
}

/* 原型复刻：大标题科技头图、浅青内容面与自适应卡片布局 */
:global(.smart-task-audit-rule-detail-modal) {
  --vxe-modal-body-background-color: #f3fbfa;
  --vxe-modal-header-background-color: #f4fcfb;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--box) {
  max-width: 1380px;
  max-height: 1139px;
  overflow: hidden;
  border: 1px solid rgba(63, 178, 168, 0.14);
  border-radius: 10px;
  box-shadow: 0 24px 60px rgba(38, 106, 102, 0.18);
}

:global(.smart-task-audit-rule-detail-modal.is--maximize .vxe-modal--box),
:global(.smart-task-audit-rule-detail-modal .vxe-modal--box.is--maximize) {
  max-width: none;
  max-height: none;
  border-radius: 0;
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--header) {
  position: relative;
  min-height: clamp(96px, 13vh, 156px);
  overflow: hidden;
  color: #056f68;
  background: linear-gradient(118deg, #fbfefe 0%, #f2fbfa 42%, #ecf9f7 100%);
  border-bottom: 0;
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--header::after) {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(39, 178, 166, 0.24), transparent);
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--header-title) {
  min-width: 0;
  padding: 0;
  overflow: visible;
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--header-right) {
  position: absolute;
  top: clamp(14px, 2vh, 22px);
  right: clamp(14px, 1.8vw, 24px);
  z-index: 5;
  padding: 0;
  color: #315e5c;
  font-size: 18px;
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--zoom-btn),
:global(.smart-task-audit-rule-detail-modal .vxe-modal--close-btn) {
  transition: color 160ms ease, transform 160ms ease;
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--zoom-btn:hover),
:global(.smart-task-audit-rule-detail-modal .vxe-modal--close-btn:hover) {
  color: #008d82;
  transform: scale(1.08);
}

.audit-modal-hero {
  position: relative;
  width: 100%;
  height: clamp(96px, 13vh, 156px);
  overflow: hidden;
  box-sizing: border-box;
}

.audit-modal-hero__title {
  position: absolute;
  top: 50%;
  left: clamp(24px, 2.6vw, 38px);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: clamp(12px, 1.2vw, 18px);
  max-width: min(60%, 720px);
  margin: 0;
  color: #08736c;
  font-size: clamp(23px, 2.15vw, 31px);
  font-weight: 700;
  line-height: 1.28;
  letter-spacing: 0.01em;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.92);
  transform: translateY(-50%);
}

.audit-modal-hero__title-text {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  white-space: normal;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* 原型标题尾部的青色虚点装饰 */
.audit-modal-hero__title-dots {
  flex: 0 0 auto;
  width: clamp(52px, 5vw, 74px);
  height: 6px;
  background-image: radial-gradient(circle, rgba(31, 178, 166, 0.85) 0 2px, transparent 2px);
  background-size: 12px 6px;
  background-repeat: repeat-x;
  background-position: left center;
  opacity: 0.7;
}

.audit-modal-hero__art {
  position: absolute;
  inset: 0 0 0 39%;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.audit-modal-hero__platform,
.audit-modal-hero__cube {
  position: absolute;
  display: block;
  height: auto;
  object-fit: contain;
}

.audit-modal-hero__platform {
  z-index: 1;
  bottom: clamp(-286px, -24vw, -228px);
  left: 50%;
  width: clamp(600px, 59vw, 820px);
  opacity: 0.7;
  transform: translateX(-50%);
}

.audit-modal-hero__cube {
  top: -2px;
  left: 53%;
  z-index: 2;
  width: auto;
  height: calc(100% + 12px);
  max-height: 162px;
  opacity: 0.86;
  transform: translateX(-50%);
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--body),
:global(.smart-task-audit-rule-detail-modal .vxe-modal--content) {
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #f2faf9;
}

.audit-rule-detail-modal__content {
  --audit-primary: #008d82;
  --audit-primary-soft: rgba(0, 141, 130, 0.08);
  --audit-border: rgba(42, 176, 164, 0.16);
  --audit-text: #263b3b;
  --audit-text-secondary: #435454;
  --audit-text-muted: #718080;
  height: 100%;
  padding: clamp(16px, 2vw, 34px) clamp(16px, 2.5vw, 36px) clamp(22px, 2.5vw, 38px);
  overflow-x: hidden;
  overflow-y: auto;
  background: radial-gradient(circle at 86% 5%, rgba(90, 220, 207, 0.1), transparent 30%),
    linear-gradient(158deg, #f7fcfb 0%, #eef8f7 58%, #f6fbfa 100%);
  scrollbar-color: rgba(64, 154, 148, 0.34) transparent;
}

.audit-rule-detail-modal__content--loading {
  padding: 0;
}

.review-card {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(81, 186, 177, 0.12);
  border-radius: 9px;
  box-shadow: 0 9px 24px rgba(31, 112, 106, 0.055);
}

.review-card + .review-card,
.review-tables-sequence,
.review-tables-sequence .review-card + .review-card {
  margin-top: clamp(14px, 1.6vw, 19px);
}

.review-card::before {
  width: 3px;
  background: linear-gradient(180deg, #1ab7a4, #7fe4da);
}

.review-card--conclusion {
  display: grid;
  grid-template-columns: clamp(104px, 9.2vw, 132px) minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  min-height: clamp(146px, 14vw, 164px);
}

.conclusion-avatar {
  grid-row: 1 / span 2;
  align-self: start;
  justify-self: center;
  width: clamp(82px, 7.8vw, 108px);
  height: clamp(82px, 7.8vw, 108px);
  margin-top: clamp(24px, 2.6vw, 34px);
  margin-left: 10px;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(227, 247, 243, 0.96), rgba(236, 250, 248, 0.72));
  border-radius: 8px;
}

.conclusion-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.review-card--conclusion .review-card__header {
  grid-column: 2;
  align-self: end;
  padding: clamp(18px, 1.7vw, 24px) clamp(18px, 2vw, 28px) 6px 10px;
  background: transparent;
}

.review-card--conclusion .review-card__content {
  grid-column: 2;
  padding: 4px clamp(18px, 2vw, 28px) clamp(18px, 1.8vw, 24px) 10px;
}

.review-card__header {
  position: relative;
  z-index: 2;
  gap: 18px;
  padding: clamp(20px, 2vw, 28px) clamp(20px, 2.2vw, 30px) 10px;
  background: transparent;
}

.review-card__header .title {
  gap: 16px;
}

.review-card__title-icon-wrap {
  width: clamp(48px, 4.5vw, 58px);
  height: clamp(48px, 4.5vw, 58px);
  background: rgba(229, 248, 245, 0.92);
  border: 0;
  border-radius: 8px;
  box-shadow: none;
}

.review-card--process .review-card__title-icon-wrap {
  background: rgba(225, 245, 252, 0.92);
  border: 0;
}

.review-card__title-icon {
  width: clamp(22px, 2vw, 27px);
  height: clamp(22px, 2vw, 27px);
}

.review-card__title-label {
  color: #08786f;
  font-size: clamp(17px, 1.45vw, 21px);
  line-height: 1.3;
}

.review-card__title-hint {
  color: #6f7d7d;
  font-size: clamp(12px, 1vw, 14px);
}

.review-card__content {
  position: relative;
  z-index: 2;
  padding: 8px clamp(20px, 2.2vw, 30px) clamp(22px, 2.2vw, 32px);
  color: #455454;
  font-size: clamp(14px, 1.1vw, 16px);
  line-height: 1.85;
}

.audit-status {
  min-width: 76px;
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
  line-height: 26px;
}

.review-card__actions {
  gap: 12px;
  margin-left: auto;
}

.preview-btn,
.rerun-btn {
  min-height: 36px;
  padding: 0 17px;
  color: #008d82;
  font-size: 14px;
  border-color: rgba(0, 154, 142, 0.36);
  box-shadow: none;
}

.rerun-btn {
  color: #fff;
  background: linear-gradient(135deg, #39b9aa 0%, #078f80 100%);
  border-color: transparent;
  box-shadow: 0 7px 16px rgba(0, 141, 130, 0.18);
}

.review-card--process {
  position: relative;
  /* 装饰图绝对定位叠在右侧，不占用布局列宽，避免长文时立方体与底座被拉散 */
  min-height: clamp(220px, 25vw, 290px);
}

.review-card--process::before {
  background: linear-gradient(180deg, #2ca7df, #8adcf6);
}

.review-card--table::before {
  background: linear-gradient(180deg, #1ab7a4, #7fe4da);
}

.review-card--process .review-card__header,
.review-card--process .review-card__content {
  position: relative;
  z-index: 2;
  /* 给右侧装饰留视觉空隙，但不通过 grid 占位 */
  padding-right: clamp(36px, 8vw, 120px);
}

.process-art {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  width: clamp(210px, 23vw, 310px);
  height: clamp(210px, 25vw, 290px);
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.process-art__platform,
.process-art__cube {
  position: absolute;
  display: block;
  height: auto;
  object-fit: contain;
}

.process-art__platform {
  bottom: clamp(-28px, -1.6vw, -16px);
  left: 50%;
  width: clamp(185px, 16.5vw, 235px);
  opacity: 0.58;
  transform: translateX(-50%);
}

.process-art__cube {
  top: clamp(34px, 3.2vw, 50px);
  left: 50%;
  width: clamp(82px, 7.2vw, 104px);
  opacity: 0.68;
  transform: translateX(-50%);
}

.review-card--table {
  min-width: 0;
}

.review-card__table-art {
  position: absolute;
  top: clamp(-58px, -4vw, -34px);
  right: clamp(-30px, -1.5vw, -8px);
  z-index: 1;
  display: block;
  width: clamp(150px, 16vw, 220px);
  height: auto;
  opacity: 0.17;
  pointer-events: none;
  user-select: none;
}

.review-card--table .review-card__header {
  min-height: clamp(76px, 7vw, 96px);
  box-sizing: border-box;
}

.review-card--table .review-card__content {
  padding: 0 clamp(18px, 2vw, 28px) clamp(18px, 1.8vw, 24px);
}

.audit-review-table {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(74, 150, 145, 0.35) transparent;
}

.audit-review-table__table {
  min-width: 860px;
}

.audit-review-table :deep(.vxe-table--header-wrapper) {
  background: linear-gradient(180deg, #f2fbfa 0%, #edf8f7 100%);
}

.audit-review-table :deep(.vxe-header--column) {
  color: #116c66;
  font-size: 13px;
}

.audit-review-table :deep(.vxe-body--column) {
  color: #3d4c4c;
  font-size: 13px;
}

.audit-review-table :deep(.vxe-table--border-line),
.audit-review-table :deep(.vxe-table--header-border-line) {
  border-color: #dcebea;
}

.audit-review-table :deep(.vxe-table) {
  border-radius: 8px;
}

@media (max-width: 1100px) {
  .audit-modal-hero__art {
    left: 45%;
    opacity: 0.72;
  }

  .process-art {
    width: 190px;
    opacity: 0.62;
  }

  .review-card--process .review-card__header,
  .review-card--process .review-card__content {
    padding-right: clamp(24px, 6vw, 72px);
  }
}

@media (max-width: 820px) {
  .audit-modal-hero__title {
    max-width: 68%;
    font-size: clamp(20px, 3.5vw, 25px);
  }

  .audit-modal-hero__art {
    left: 53%;
    opacity: 0.44;
  }

  .audit-modal-hero__platform {
    left: 62%;
  }

  .review-card--conclusion {
    grid-template-columns: 88px minmax(0, 1fr);
  }

  .conclusion-avatar {
    width: 70px;
    height: 70px;
    margin-top: 24px;
  }

  .review-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .review-card--conclusion .review-card__header {
    padding-left: 4px;
  }

  .review-card--conclusion .review-card__content {
    padding-left: 4px;
  }

  .review-card__actions {
    align-self: stretch;
    justify-content: flex-start;
    margin-left: 0;
  }

  .review-card--process {
    min-height: 0;
  }

  .review-card--process .review-card__header,
  .review-card--process .review-card__content {
    padding-right: clamp(18px, 2.2vw, 30px);
  }

  .process-art {
    display: none;
  }

  .audit-review-table__table {
    min-width: 760px;
  }
}

@media (max-height: 780px) {
  :global(.smart-task-audit-rule-detail-modal .vxe-modal--header),
  .audit-modal-hero {
    min-height: 90px;
    height: 90px;
  }

  .audit-rule-detail-modal__content {
    padding-top: 14px;
  }
}

/* Custom header/window controls and task-owned artwork overrides. */
:global(.smart-task-audit-rule-detail-modal .vxe-modal--box) {
  max-width: 1600px;
  max-height: 1139px;
  border-radius: 8px;
}

:global(.smart-task-audit-rule-detail-modal.is--maximize .vxe-modal--box) {
  max-width: none;
  max-height: none;
}

:global(.smart-task-audit-rule-detail-modal .vxe-modal--header) {
  display: block;
  padding: 0;
}

.audit-modal-window-controls {
  position: absolute;
  top: 14px;
  right: 16px;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.audit-modal-window-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 32px;
  padding: 0;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.audit-modal-window-control img {
  width: 18px;
  height: 18px;
  pointer-events: none;
  transition: transform 160ms ease;
}

.audit-modal-window-control:hover {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(0, 112, 107, 0.12);
}

.audit-modal-window-control:hover img {
  transform: scale(1.08);
}

.audit-modal-window-control:active {
  transform: scale(0.95);
}

.audit-modal-window-control:focus-visible {
  outline: 2px solid rgba(0, 141, 130, 0.48);
  outline-offset: 2px;
}

.audit-modal-window-control--close:hover {
  background: rgba(216, 88, 88, 0.11);
  border-color: rgba(216, 88, 88, 0.16);
}

.preview-btn__icon,
.rerun-btn__icon {
  display: block;
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  object-fit: contain;
  transition: filter 180ms ease, transform 220ms var(--audit-motion-ease);
}

.preview-btn:hover .preview-btn__icon {
  filter: brightness(0) invert(1);
  transform: scale(1.08);
}

.rerun-btn:hover .rerun-btn__icon {
  transform: rotate(120deg);
}

.status-icon {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.review-card__title-icon {
  width: clamp(25px, 2.2vw, 30px);
  height: clamp(25px, 2.2vw, 30px);
  object-fit: contain;
  background: transparent;
  -webkit-mask: none;
  mask: none;
  animation: audit-title-icon-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: filter 180ms ease, transform 180ms ease;
}

.review-card__title-icon-wrap:hover .review-card__title-icon {
  filter: saturate(1.12) drop-shadow(0 4px 6px rgba(0, 141, 130, 0.2));
  transform: scale(1.08);
}

.audit-empty__icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.process-art__orbit {
  position: absolute;
  top: clamp(8px, 1.2vw, 16px);
  left: 50%;
  z-index: 1;
  display: block;
  width: clamp(220px, 20vw, 285px);
  height: auto;
  aspect-ratio: 420 / 240;
  overflow: visible;
  opacity: 0.78;
  transform: translateX(-50%);
  pointer-events: none;
}

.process-art__orbit-core {
  transform-box: view-box;
  transform-origin: 210px 120px;
  animation: audit-orbit-core-pulse 3.6s ease-in-out infinite;
}

.process-art__orbit-spin {
  transform-box: view-box;
  transform-origin: 210px 120px;
}

.process-art__orbit-spin--main {
  animation: audit-orbit-spin 18s linear infinite;
}

.process-art__orbit-spin--cross-a {
  animation: audit-orbit-spin-tilt-a 12s linear infinite;
}

.process-art__orbit-spin--cross-b {
  animation: audit-orbit-spin-tilt-b 15s linear infinite;
}

.process-art__orbit-satellite {
  animation: audit-orbit-satellite-pulse 2.4s ease-in-out infinite;
}

.process-art__orbit-dash {
  transform-box: view-box;
  transform-origin: 210px 120px;
  animation: audit-orbit-dash-flow 7s linear infinite, audit-orbit-spin-reverse 22s linear infinite;
}

.process-art__orbit-sweep {
  transform-box: view-box;
  transform-origin: 210px 120px;
  animation: audit-orbit-sweep 5.5s linear infinite;
}

.process-art__platform {
  z-index: 2;
}

.process-art__cube {
  z-index: 3;
  animation: audit-process-cube-float 4.8s ease-in-out infinite;
}

.audit-modal-hero__platform {
  animation: audit-hero-platform-breathe 8s ease-in-out infinite;
}

.audit-modal-hero__cube {
  animation: audit-hero-cube-float 5.4s ease-in-out infinite;
}

.review-card {
  border-radius: 8px;
}

@keyframes audit-title-icon-enter {
  from {
    opacity: 0;
    transform: translateY(5px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes audit-hero-platform-breathe {
  0%,
  100% {
    opacity: 0.58;
    transform: translateX(-50%) scale(0.985);
  }

  50% {
    opacity: 0.74;
    transform: translateX(-50%) scale(1.015);
  }
}

@keyframes audit-hero-cube-float {
  0%,
  100% {
    transform: translate3d(-50%, 0, 0);
  }

  50% {
    transform: translate3d(-50%, -6px, 0);
  }
}

@keyframes audit-process-cube-float {
  0%,
  100% {
    transform: translate(-50%, 0);
  }

  50% {
    transform: translate(-50%, -4px);
  }
}

@keyframes audit-orbit-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes audit-orbit-spin-reverse {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-360deg);
  }
}

@keyframes audit-orbit-spin-tilt-a {
  from {
    transform: rotate(60deg);
  }

  to {
    transform: rotate(420deg);
  }
}

@keyframes audit-orbit-spin-tilt-b {
  from {
    transform: rotate(-60deg);
  }

  to {
    transform: rotate(-420deg);
  }
}

@keyframes audit-orbit-dash-flow {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -140;
  }
}

@keyframes audit-orbit-sweep {
  from {
    stroke-dashoffset: 0;
    opacity: 0.45;
  }

  50% {
    opacity: 0.85;
  }

  to {
    stroke-dashoffset: -1128;
    opacity: 0.45;
  }
}

@keyframes audit-orbit-core-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.92);
  }

  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@keyframes audit-orbit-satellite-pulse {
  0%,
  100% {
    opacity: 0.72;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 1120px) {
  .audit-modal-hero__title {
    max-width: 58%;
  }

  .review-card--process {
    min-height: 0;
  }

  .process-art,
  .review-card__table-art {
    display: none;
  }

  .review-card--process .review-card__header,
  .review-card--process .review-card__content {
    padding-right: clamp(20px, 2.2vw, 30px);
  }
}

@media (max-width: 860px) {
  .audit-modal-window-controls {
    top: 8px;
    right: 8px;
  }

  .audit-modal-window-control {
    width: 32px;
    height: 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .review-card,
  .review-tables-sequence,
  .review-card__title-icon,
  .audit-modal-hero__platform,
  .audit-modal-hero__cube,
  .process-art__orbit-core,
  .process-art__orbit-spin,
  .process-art__orbit-satellite,
  .process-art__orbit-dash,
  .process-art__orbit-sweep,
  .process-art__cube {
    animation: none !important;
  }

  .audit-modal-hero__platform {
    transform: translateX(-50%);
  }

  .audit-modal-hero__cube {
    transform: translateX(-50%);
  }

  .process-art__orbit {
    transform: translateX(-50%);
  }

  .process-art__orbit-spin--cross-a {
    transform: rotate(60deg);
  }

  .process-art__orbit-spin--cross-b {
    transform: rotate(-60deg);
  }

  .process-art__cube,
  .process-art__platform {
    transform: translateX(-50%);
  }
}
</style>

<style lang="less">
/* popover 挂载到 body：样式放全局选择器，避免 teleport 后 scoped 丢失 */
.smart-task-audit-preview-attach-popover.el-popover,
.smart-task-audit-preview-attach-popover {
  z-index: 4000 !important;
  min-width: 480px;
  padding: 14px 14px 12px;
  color: #1f2937;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
  background: linear-gradient(165deg, #fbfefe 0%, #f4faf9 48%, #eef5f5 100%);
  border: 1px solid #9fded9;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(31, 151, 145, 0.16), 0 2px 8px rgba(15, 23, 42, 0.06), inset 0 1px 0 #fff;
}

.smart-task-audit-preview-attach-popover .popper__arrow::before,
.smart-task-audit-preview-attach-popover .el-popper__arrow::before {
  border-bottom-color: #9fded9 !important;
  border-top-color: #9fded9 !important;
}

.smart-task-audit-preview-attach-popover .popper__arrow::after,
.smart-task-audit-preview-attach-popover .el-popper__arrow::after {
  border-bottom-color: #fbfefe !important;
  border-top-color: #f4faf9 !important;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel {
  --attach-primary: #00706b;
  --attach-text: #1f2937;
  --attach-muted: #6b7280;
  min-height: 88px;
  padding: 0;
  box-sizing: border-box;
  color: var(--attach-text);
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  padding: 0 2px;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__title-bar {
  flex: 0 0 auto;
  width: 3px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(0, 112, 107, 0.85), rgba(85, 202, 187, 0.65));
  box-shadow: 0 0 0 1px rgba(0, 112, 107, 0.08);
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__title {
  color: var(--attach-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__count {
  flex: 0 0 auto;
  min-height: 22px;
  padding: 0 10px;
  color: var(--attach-primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 22px;
  white-space: nowrap;
  background: rgba(0, 112, 107, 0.08);
  border: 1px solid rgba(0, 112, 107, 0.14);
  border-radius: 999px;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__table-wrap {
  max-height: 280px;
  overflow: auto;
  border: 1px solid #cfe6e3;
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(252, 255, 255, 0.98) 0%, rgba(244, 251, 250, 0.96) 100%);
  box-shadow: inset 0 1px 0 #fff, 0 4px 12px rgba(31, 151, 145, 0.08);
  scrollbar-width: thin;
  scrollbar-color: rgba(41, 171, 166, 0.38) transparent;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__table-wrap::-webkit-scrollbar-thumb {
  background: rgba(41, 171, 166, 0.38);
  border-radius: 6px;
}

.smart-task-audit-preview-attach-popover .preview-attach-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

.smart-task-audit-preview-attach-popover .preview-attach-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 36px;
  padding: 0 12px;
  color: #173c40;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  text-align: left;
  white-space: nowrap;
  background: linear-gradient(100deg, #fbfefe 0%, #e8f6f5 48%, #f1faf9 100%);
  border-bottom: 1px solid #c5e5e2;
  box-shadow: inset 0 1px 0 #fff;
}

.smart-task-audit-preview-attach-popover .preview-attach-table tbody td {
  height: 42px;
  padding: 0 12px;
  color: #293d40;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.4;
  vertical-align: middle;
  border-bottom: 1px solid #e2efed;
  background: linear-gradient(100deg, #fff 0%, #f8fcfb 55%, #f3faf8 100%);
  transition: background-color 0.16s ease;
}

.smart-task-audit-preview-attach-popover .preview-attach-table tbody tr:last-child td {
  border-bottom: 0;
}

.smart-task-audit-preview-attach-popover .preview-attach-table tbody tr:hover td {
  background: linear-gradient(100deg, #fff 0%, #f2faf9 50%, #e7f5f2 100%);
}

.smart-task-audit-preview-attach-popover .preview-attach-table__col-name,
.smart-task-audit-preview-attach-popover .preview-attach-table__col-type {
  overflow: hidden;
}

.smart-task-audit-preview-attach-popover .preview-attach-table__col-type {
  width: 120px;
}

.smart-task-audit-preview-attach-popover .preview-attach-table__col-action {
  width: 72px;
  text-align: center;
}

/* 附件名称、附件类型：表头居中 */
.smart-task-audit-preview-attach-popover .preview-attach-table thead .preview-attach-table__col-name,
.smart-task-audit-preview-attach-popover .preview-attach-table thead .preview-attach-table__col-type {
  text-align: center;
}

.smart-task-audit-preview-attach-popover .preview-attach-table thead .preview-attach-table__col-action,
.smart-task-audit-preview-attach-popover .preview-attach-table tbody .preview-attach-table__col-action {
  text-align: center;
}

/* 内容过长省略，title 属性可悬浮查看全文 */
.smart-task-audit-preview-attach-popover .preview-attach-table__name,
.smart-task-audit-preview-attach-popover .preview-attach-table__type {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.smart-task-audit-preview-attach-popover .preview-attach-table__type {
  display: inline-block;
  max-width: 100%;
  min-height: 22px;
  padding: 0 8px;
  color: #00706b;
  font-size: 12px;
  font-weight: 500;
  line-height: 22px;
  vertical-align: middle;
  background: rgba(0, 112, 107, 0.06);
  border: 1px solid rgba(0, 112, 107, 0.12);
  border-radius: 999px;
  box-sizing: border-box;
}

.smart-task-audit-preview-attach-popover .preview-attach-table__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 0;
  color: #008d8b;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  text-decoration: underline;
  text-underline-offset: 3px;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 3px;
  cursor: pointer;
  transition: color 0.16s ease;
}

.smart-task-audit-preview-attach-popover .preview-attach-table__action:hover:not(:disabled) {
  color: #006f6d;
}

.smart-task-audit-preview-attach-popover .preview-attach-table__action:focus-visible {
  outline: 2px solid rgba(0, 141, 139, 0.35);
  outline-offset: 2px;
}

.smart-task-audit-preview-attach-popover .preview-attach-table__action:disabled {
  color: #9ca3af;
  text-decoration: none;
  cursor: not-allowed;
}

.smart-task-audit-preview-attach-popover .preview-attach-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 112px;
  padding: 16px;
  color: var(--attach-muted);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  background: linear-gradient(165deg, #f7fbfb 0%, #f2f6f7 100%);
  border: 1px dashed rgba(0, 112, 107, 0.18);
  border-radius: 8px;
}

.xsx_data {
  padding: 10px 10px 10px 20px;
  border: 1px solid #f6f6f6;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 10px;
  box-sizing: border-box;
  .xsx_data_index {
    width: 28px;
    height: 28px;
    text-align: center;
    line-height: 28px;
    border-radius: 14px;
    color: #fff;
    font-size: 13px;
    font-weight: bold;
    background-color: #9ca3af;
  }
  .xsx_data_index_one {
    background-color: #c62828;
  }
  .xsx_data_index_two {
    background-color: #e65100;
  }
  .xsx_data_index_three {
    background-color: #ffa500;
  }
  .xsx_data_index_other {
    background-color: #bbb;
  }
  .xsx_data_item {
    font-size: 16px;
    color: #293d40;
    display: flex;
    flex-direction: column;
    gap: 8px;
    .xsx_data_cont_item {
      display: flex;
      align-items: center;
      gap: 10px;
      .xsx_data_item_other {
        padding: 5px;
        font-size: 12px;
        display: flex;
        gap: 5px;
        background-color: #f9f9f9;
        border-radius: 4px;
      }
    }
  }
  .xsx_data_left {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 5px;
    .xsx_data_prc {
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .score-high {
      background: #ffebee;
      color: #c62828;
    }
    .score-mid {
      background: #fff3e0;
      color: #e65100;
    }
    .score-low {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .xsx_data_icon {
      font-size: 24px;
      cursor: pointer;
    }
  }
}
.xsx_detail {
  width: 100%;
  border: 1px solid #e9e9e9;
  border-radius: 5px;
  margin-bottom: 10px;
  box-sizing: border-box;
  .xsx_detail_top {
    padding: 10px;
    width: 100%;
    height: 50px;
    box-sizing: border-box;
    background-color: #e9e9e9;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: bold;
    .xsx_detail_top_title {
      font-size: 16px;
    }
    .xsx_detail_top_prc {
      font-size: 12px;
      color: #6b7280;
    }
  }
  .xsx_deatil_center {
    width: 100%;
    border-bottom: 1px solid #e9e9e9;
    display: flex;
    .xsx_deatil_center_left {
      width: 50%;
      padding: 10px;
      box-sizing: border-box;
      border-right: 1px solid #e9e9e9;
      .xsx_deatil_center_left_title {
        color: var(--color-primary);
      }
    }
    .xsx_deatil_center_right {
      width: 50%;
      padding: 10px;
      box-sizing: border-box;
      .xsx_deatil_center_right_title {
        color: #ffa500;
      }
    }
  }
  .xsx_deatil_bottom {
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .xsx_deatil_bottom_contert {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      .xsx_deatil_bottom_contert_item {
        padding: 5px;
        font-size: 12px;
        display: flex;
        gap: 5px;
        background-color: #f9f9f9;
        border-radius: 4px;
      }
    }
  }
}
.xsx_deatil_center_left_content {
  width: 100%;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  word-break: break-all;
  font-size: 12px;
}
</style>
