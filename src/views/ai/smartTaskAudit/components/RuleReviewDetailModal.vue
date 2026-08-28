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
        <div class="audit-modal-hero__copy">
          <h2 class="audit-modal-hero__title" :title="item?.ruleName || '评审详情'">
            <span class="audit-modal-hero__title-text">{{ item?.ruleName || '评审详情' }}</span>
          </h2>
        </div>
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
              <button v-if="canRerun" type="button" class="rerun-btn" :disabled="rerunConfirming" @click.prevent.stop="$emit('rerun')">
                <img class="rerun-btn__icon" :src="rerunIcon" alt="" />
                <span>重新分析</span>
              </button>
            </div>
          </div>
          <div v-if="item.reviewConclude" class="review-card__content">
            <TypewriterText
              :text="item.reviewConclude"
              tag="div"
              :animate="typewriterAnimate"
              :persist-key="concludePersistKey"
              @attach-preview="handleInlineAttachPreview"
              @review-table-open="handleReviewTableOpen"
              @price-view-navigate="handlePriceViewNavigate"
              @typing-progress="followTypewriter"
            />
          </div>
          <div v-else class="review-card__content review-card__empty">暂无审核结论</div>
        </div>

        <div class="review-card review-card--process" style="--card-index: 1">
          <div class="review-card__header">
            <span class="title">
              <span class="review-card__title-icon-wrap">
                <img class="review-card__title-icon" :src="reviewProcessIcon" alt="" />
              </span>
              <span class="review-card__title-text">
                <span class="review-card__title-label">AI审核分析</span>
                <span class="review-card__title-hint">审核依据与预览文档对照</span>
              </span>
            </span>
          </div>
          <div class="review-process-columns">
            <section class="review-process-column review-process-column--reasoning" aria-label="审核依据">
              <div class="review-process-column__header">
                <h3 class="review-process-column__title">
                  <img class="review-process-column__title-icon" :src="reasoningColumnIcon" alt="" />
                  <span>审核依据</span>
                </h3>
                <span class="review-process-column__hint">规则判断与审核依据</span>
                <div class="review-process-column__actions">
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
                </div>
              </div>
              <div v-if="reviewProcessText" class="review-process-column__content">
                <TypewriterText
                  :text="reviewProcessText"
                  tag="div"
                  :animate="typewriterAnimate"
                  :persist-key="processPersistKey"
                  @attach-preview="handleInlineAttachPreview"
                  @review-table-open="handleReviewTableOpen"
                  @price-view-navigate="handlePriceViewNavigate"
                  @typing-progress="followTypewriter"
                />
              </div>
              <div v-else class="review-process-column__content review-process-column__empty">暂无审核依据</div>
            </section>
            <section class="review-process-column review-process-column--source" aria-label="原文解析">
              <div class="review-process-column__header">
                <h3 class="review-process-column__title">
                  <img class="review-process-column__title-icon" :src="sourceColumnIcon" alt="" />
                  <span>原文解析</span>
                </h3>
                <span class="review-process-column__hint">待审核文档内容</span>
              </div>
              <div v-loading="previewDocumentLoading" class="review-process-column__content preview-document" aria-live="polite">
                <OfficePreview
                  v-if="previewDocumentFile"
                  :src="previewDocumentSource"
                  :file-name="getAttachDisplayName(previewDocumentFile)"
                  :pdf-options="auditPdfOptions"
                  :toolbar="officeZoomToolbarOptions"
                  height="100%"
                  empty-text="暂无原文解析"
                />
                <div v-else-if="!previewDocumentLoading" class="review-process-column__empty preview-document__empty">暂无原文解析</div>
              </div>
            </section>
          </div>
        </div>
      </template>
      <div v-else class="audit-empty audit-empty--inline">
        <img class="audit-empty__icon" :src="emptyStateIcon" alt="" />
        <div class="audit-empty__text">暂无评审详情</div>
        <button v-if="canRerun" type="button" class="rerun-btn" :disabled="rerunConfirming" @click.prevent.stop="$emit('rerun')">
          <img class="rerun-btn__icon" :src="rerunIcon" alt="" />
          <span>重新分析</span>
        </button>
      </div>
    </div>
    <div v-else class="audit-empty">
      <img class="audit-empty__icon" :src="emptyStateIcon" alt="" />
      <div class="audit-empty__text">暂无评审详情</div>
    </div>
  </vxe-modal>

  <ReviewTableModal
    :visible="reviewTableModalVisible"
    :tables="reviewTables"
    :detail-id="String(item?.detailId || '')"
    :rule-name="item?.ruleName || ''"
    :initial-index="reviewTableInitialIndex"
    @close="handleReviewTableModalClose"
  />
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { VxeModalInstance } from 'vxe-table'
import { getPublicData } from '@/api/common'
import { listAttach, previewAttach } from '@/api/ai/smartTaskAudit'
import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import conclusionAvatar from '@/assets/images/smart-review/rule-review-detail/conclusion-avatar.png'
import emptyStateIcon from '@/assets/images/smart-review/rule-review-detail/empty-state.svg'
import heroAiCube from '@/assets/images/smart-review/rule-review-detail/hero-ai-cube.png'
import heroCircuitPlatform from '@/assets/images/smart-review/rule-review-detail/hero-circuit-platform.png'
import previewIcon from '@/assets/images/smart-review/rule-review-detail/icon-preview.svg'
import reasoningColumnIcon from '@/assets/images/smart-review/rule-review-detail/icon-reasoning.svg'
import rerunIcon from '@/assets/images/smart-review/rule-review-detail/icon-rerun.svg'
import reviewProcessIcon from '@/assets/images/smart-review/rule-review-detail/icon-process.svg'
import sourceColumnIcon from '@/assets/images/smart-review/rule-review-detail/icon-source.svg'
import statusFailedIcon from '@/assets/images/smart-review/rule-review-detail/status-failed.svg'
import statusPassedIcon from '@/assets/images/smart-review/rule-review-detail/status-passed.svg'
import statusPendingIcon from '@/assets/images/smart-review/rule-review-detail/status-pending.svg'
import windowCloseIcon from '@/assets/images/smart-review/rule-review-detail/window-close.svg'
import windowMaximizeIcon from '@/assets/images/smart-review/rule-review-detail/window-maximize.svg'
import windowRestoreIcon from '@/assets/images/smart-review/rule-review-detail/window-restore.svg'
import OfficePreview from '@/components/OfficePreview'
import type { OfficePdfOptions, OfficePreviewSource, OfficeToolbarOptions } from '@/components/OfficePreview'
import RerunLoading from './RerunLoading.vue'
import ReviewTableModal from './ReviewTableModal.vue'
import TypewriterText from './TypewriterText.vue'
import {
  decodeAuditPreviewFileName,
  getAuditPreviewFileExtension,
  getAuditPreviewFileKey,
  isSupportedAuditPreviewFile,
  resolvePreviewAttachBlob,
  selectAuditPreviewFileByTypePriority
} from './auditFilePreview'
import { getReviewTables, getRuleReviewCardTone } from './auditDetailHelpers'
import type { AuditPriceViewPayload, AuditReviewTablePayload, RuleReviewDetailItem } from './auditDetailHelpers'
import type { UserRole } from '@/components/UserRoleSelector/interface'

const PREVIEW_DOCUMENT_PUBLIC_CODE = 'AI_AUDIT_PREVIEW_DOC_COM'
const auditPdfOptions: OfficePdfOptions = { pageMode: 'none', zoom: 85 }
const officeZoomToolbarOptions: OfficeToolbarOptions = {
  download: false,
  print: false,
  exportHtml: false,
  zoom: true,
  search: false,
  theme: false,
  position: 'top-center'
}

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
  /** 是否展示「重新分析」按钮，默认开启 */
  canRerun: {
    type: Boolean,
    default: true
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
  }
})

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'preview', file: TXmAttach, files: TXmAttach[]): void
  (event: 'rerun'): void
}>()

const router = useRouter()
const currentUserRole = inject<Ref<UserRole>>('currentUserRole')

/** 点击 .gwPriceView / .materialNewestPriceView：跳转物料价格库对应 tab，携带当前角色 spRoleId 供目标页比对 */
const handlePriceViewNavigate = (payload: AuditPriceViewPayload) => {
  const tab = payload.type === 'gwPriceView' ? 'materialPriceLibrary' : 'historyPrice'
  const spRoleId = currentUserRole?.value?.spRoleId || ''
  router.push({ path: '/ai/materialPriceLibrary', query: spRoleId ? { tab, spRoleId } : { tab } })
}

const modalRef = ref<VxeModalInstance>()
const isMaximized = ref(false)
const previewPopoverVisible = ref(false)
const reviewTableModalVisible = ref(false)
const reviewTableInitialIndex = ref(0)
const contentRef = ref<HTMLElement | null>(null)
let typewriterScrollFrame: number | null = null

const reviewProcessText = computed(() => String(props.item?.reviewProcess || '').trim())

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
  reviewTableModalVisible.value = false
  reviewTableInitialIndex.value = 0
  emit('close')
}

const handleModalHide = () => {
  isMaximized.value = false
  previewPopoverVisible.value = false
  reviewTableModalVisible.value = false
  reviewTableInitialIndex.value = 0
  if (props.visible) emit('close')
}

const followTypewriter = () => {
  if (!props.typewriterAnimate || typewriterScrollFrame !== null) return
  typewriterScrollFrame = requestAnimationFrame(async () => {
    typewriterScrollFrame = null
    await nextTick()
    const content = contentRef.value
    if (!content) return
    const distanceToBottom = content.scrollHeight - content.scrollTop - content.clientHeight
    if (distanceToBottom < 120) content.scrollTop = content.scrollHeight
  })
}

onBeforeUnmount(() => {
  if (typewriterScrollFrame !== null) cancelAnimationFrame(typewriterScrollFrame)
})

const attachListLoading = ref(false)
const attachList = ref<TXmAttach[]>([])
const attachListEmptyText = ref('暂无附件')
const attachListDetailId = ref('')
const attachListLoaded = ref(false)
const previewDocumentLoading = ref(false)
const previewDocumentFile = shallowRef<TXmAttach | null>(null)
const previewDocumentSource = shallowRef<OfficePreviewSource>(null)
let attachListLoadSeq = 0
let previewDocumentLoadSeq = 0
let attachListPromise: Promise<TXmAttach[]> | null = null
let attachListPromiseDetailId = ''

const getAttachKey = (file: TXmAttach) => getAuditPreviewFileKey(file)

const getAttachDisplayName = (file: TXmAttach) => decodeAuditPreviewFileName(file.name)

const getAttachExtension = (file: TXmAttach) => getAuditPreviewFileExtension(file)

const getAttachTypeName = (file: TXmAttach) => {
  const typeName = String(file.fjType || '').trim()
  if (typeName) return typeName
  const fjId = String(file.fjId || '').trim()
  if (fjId) return fjId
  const extension = getAttachExtension(file)
  return extension ? extension.toUpperCase() : '-'
}

const isAttachPreviewable = (file: TXmAttach) => isSupportedAuditPreviewFile(file)

const resetAttachList = () => {
  attachListLoadSeq += 1
  previewDocumentLoadSeq += 1
  previewPopoverVisible.value = false
  attachListLoading.value = false
  attachList.value = []
  attachListEmptyText.value = '暂无附件'
  attachListDetailId.value = ''
  attachListLoaded.value = false
  attachListPromise = null
  attachListPromiseDetailId = ''
  previewDocumentLoading.value = false
  previewDocumentFile.value = null
  previewDocumentSource.value = null
}

const ensureAttachList = async (notifyMissingDetail: boolean) => {
  const detailId = String(props.item?.detailId || '')
  if (!detailId) {
    attachList.value = []
    attachListEmptyText.value = '当前评审详情缺少明细ID'
    attachListDetailId.value = ''
    attachListLoaded.value = false
    if (notifyMissingDetail) ElMessage.warning('当前评审详情缺少明细ID')
    return []
  }

  if (attachListDetailId.value === detailId && attachListLoaded.value) return attachList.value
  if (attachListPromise && attachListPromiseDetailId === detailId) return attachListPromise

  const seq = ++attachListLoadSeq
  const request = (async () => {
    attachListLoading.value = true
    attachListEmptyText.value = '暂无附件'
    try {
      const res = await listAttach(detailId)
      if (seq !== attachListLoadSeq) return []
      if (!res.success) {
        attachList.value = []
        attachListDetailId.value = ''
        attachListLoaded.value = false
        attachListEmptyText.value = res.msg || '源文件列表获取失败'
        ElMessage.error(res.msg || '源文件列表获取失败')
        return []
      }

      const files = (Array.isArray(res.data) ? res.data : []).filter((file) => file && getAttachKey(file))
      attachList.value = files
      attachListDetailId.value = detailId
      attachListLoaded.value = true
      attachListEmptyText.value = '暂无附件'
      return files
    } catch (e: any) {
      if (seq !== attachListLoadSeq) return []
      attachList.value = []
      attachListDetailId.value = ''
      attachListLoaded.value = false
      attachListEmptyText.value = e?.message || '源文件列表获取失败'
      ElMessage.error(e?.message || '源文件列表获取失败')
      return []
    } finally {
      if (seq === attachListLoadSeq) attachListLoading.value = false
    }
  })()

  attachListPromise = request
  attachListPromiseDetailId = detailId
  try {
    return await request
  } finally {
    if (attachListPromise === request) {
      attachListPromise = null
      attachListPromiseDetailId = ''
    }
  }
}

const loadAttachList = async () => {
  await ensureAttachList(true)
}

const loadPreviewDocument = async () => {
  const detailId = String(props.item?.detailId || '').trim()
  if (!props.visible || !props.ready || !detailId) return

  const seq = ++previewDocumentLoadSeq
  previewDocumentLoading.value = true
  previewDocumentFile.value = null
  previewDocumentSource.value = null
  try {
    const [configRes, files] = await Promise.all([getPublicData(PREVIEW_DOCUMENT_PUBLIC_CODE).catch(() => null), ensureAttachList(false)])
    if (seq !== previewDocumentLoadSeq || !props.visible || String(props.item?.detailId || '').trim() !== detailId) return

    const typeCodes = configRes?.success && Array.isArray(configRes.data) ? configRes.data.map((item: any) => item?.code) : []
    const file = selectAuditPreviewFileByTypePriority(files, typeCodes)
    if (!file) return

    previewDocumentFile.value = file
    const res = await previewAttach(String(file.id).trim())
    if (seq !== previewDocumentLoadSeq || !props.visible || String(props.item?.detailId || '').trim() !== detailId) return
    const source = await resolvePreviewAttachBlob(res)
    if (seq !== previewDocumentLoadSeq || !props.visible || String(props.item?.detailId || '').trim() !== detailId) return
    previewDocumentSource.value = source
  } catch (e: any) {
    if (seq !== previewDocumentLoadSeq || !props.visible || String(props.item?.detailId || '').trim() !== detailId) return
    previewDocumentSource.value = null
    ElMessage.error(e?.message || '文件获取失败')
  } finally {
    if (seq === previewDocumentLoadSeq) previewDocumentLoading.value = false
  }
}

onBeforeUnmount(() => resetAttachList())

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
  () => [props.visible, props.item?.detailId, props.ready] as const,
  ([visible, detailId, ready]) => {
    resetAttachList()
    if (visible && detailId && ready) void loadPreviewDocument()
  },
  { immediate: true }
)

watch(
  () => [props.visible, props.item?.detailId] as const,
  ([visible]) => {
    reviewTableModalVisible.value = false
    reviewTableInitialIndex.value = 0
  },
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

const handleReviewTableOpen = ({ index }: AuditReviewTablePayload) => {
  if (!reviewTables.value[index]) {
    ElMessage.warning('评审明细尚未生成，请稍后重试')
    return
  }

  reviewTableInitialIndex.value = index
  reviewTableModalVisible.value = true
}

const handleReviewTableModalClose = () => {
  reviewTableModalVisible.value = false
  reviewTableInitialIndex.value = 0
}

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

.review-card--conclusion {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 252, 252, 0.98) 100%);
  border-color: rgba(0, 112, 107, 0.1);
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
  border: 1px solid rgba(0, 112, 107, 0.22);
  border-radius: 4px;
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

/* Markdown 表格自适应内容区宽度：撑满可用宽度，列宽按内容分配，单元格内换行；
   最小内容宽度仍超出时由包裹层横向滚动兜底。 */
.review-card__content :deep(.typewriter--markdown .markdown-table-wrap) {
  width: 100%;
  max-width: 100%;
  margin: 0.6em 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.review-card__content :deep(.typewriter--markdown table) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  table-layout: auto;
  margin: 0.6em 0;
  border-collapse: collapse;
}

.review-card__content :deep(.typewriter--markdown .markdown-table-wrap table) {
  margin: 0;
}

.review-card__content :deep(.typewriter--markdown th),
.review-card__content :deep(.typewriter--markdown td) {
  padding: 0.4em 0.7em;
  border: 1px solid var(--audit-border);
  text-align: left;
}

.review-card__content :deep(.typewriter--markdown td) {
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* 表头整行不换行：列宽下限取表头完整文本宽度，总宽超出时由包裹层横向滚动 */
.review-card__content :deep(.typewriter--markdown th) {
  background: rgba(15, 23, 42, 0.04);
  font-weight: 600;
  white-space: nowrap;
}

.review-card__content :deep(.typewriter--markdown del) {
  color: var(--audit-text-muted);
}

.review-process-columns {
  display: grid;
  width: 100%;
  min-width: 0;
  align-items: stretch;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  padding: 16px 20px 20px;
  border-top: 0;
  background: #e6f4f3;
  box-sizing: border-box;
}

/* 左右两栏各自独立成面板，用间距 + 背景层级分开，保持内容区的轻量感 */
.review-process-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: #f8fcfb;
  border: 0;
  border-radius: 8px;
}

.review-process-column__header {
  display: flex;
  /* 垂直居中对齐，避免右栏预览按钮把基线压低导致两栏标题不齐 */
  align-items: center;
  flex: 0 0 auto;
  gap: 10px;
  /* 固定等高表头：全局 border-box 下 min-height 会被右栏按钮撑高，
     导致两栏标题不在同一水平线，这里直接锁定高度 */
  height: 56px;
  padding: 0 16px;
  /* 标题栏与内容区通过浅青绿色背景区分，不再使用装饰性分隔线 */
  background: #dff3f0;
  border-bottom: 0;
}

.review-process-column__actions {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  margin-left: auto;
}

.review-process-column__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.review-process-column__title-icon {
  display: block;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.review-process-column__hint {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.review-process-column__content {
  flex: 1 1 auto;
  min-width: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

/* 审核依据内容区：面板背景负责层级，这里只负责内边距，随左右两栏等高拉伸 */
.review-process-column--reasoning .review-process-column__content {
  padding: 14px 16px 16px;
  box-sizing: border-box;
}

.review-process-column--reasoning .review-process-column__empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.review-process-column__content :deep(.typewriter) {
  display: block;
  width: 100%;
  max-width: none;
}

.review-process-column__content :deep(table),
.review-process-column__content :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
}

.review-process-column__content :deep(table.reviewTable) {
  cursor: pointer;
  outline: 1px solid transparent;
  outline-offset: 2px;
  transition: border-color 180ms ease, box-shadow 180ms ease, outline-color 180ms ease;
}

.review-process-column__content :deep(table.reviewTable:hover),
.review-process-column__content :deep(table.reviewTable:focus-visible) {
  outline-color: rgba(0, 112, 107, 0.55);
  box-shadow: 0 0 0 3px rgba(0, 112, 107, 0.1);
}

.review-process-column__content :deep(table.reviewTable caption) {
  padding: 6px 8px;
  color: #475569;
  font-weight: 600;
  text-align: left;
}

.review-process-column__content :deep(.typewriter--markdown) {
  white-space: normal;
}

.review-process-column__content :deep(.typewriter--markdown h1),
.review-process-column__content :deep(.typewriter--markdown h2),
.review-process-column__content :deep(.typewriter--markdown h3),
.review-process-column__content :deep(.typewriter--markdown h4),
.review-process-column__content :deep(.typewriter--markdown h5),
.review-process-column__content :deep(.typewriter--markdown h6) {
  margin: 0.8em 0 0.4em;
  color: #1f2937;
  font-weight: 700;
  line-height: 1.4;
}

.review-process-column__content :deep(.typewriter--markdown h1) {
  font-size: 1.35em;
}

.review-process-column__content :deep(.typewriter--markdown h2) {
  font-size: 1.22em;
}

.review-process-column__content :deep(.typewriter--markdown h3) {
  font-size: 1.1em;
}

.review-process-column__content :deep(.typewriter--markdown h4),
.review-process-column__content :deep(.typewriter--markdown h5),
.review-process-column__content :deep(.typewriter--markdown h6) {
  font-size: 1em;
}

.review-process-column__content :deep(.typewriter--markdown p) {
  margin: 0.5em 0;
}

.review-process-column__content :deep(.typewriter--markdown ul),
.review-process-column__content :deep(.typewriter--markdown ol) {
  margin: 0.5em 0;
  padding-left: 1.6em;
}

.review-process-column__content :deep(.typewriter--markdown li) {
  margin: 0.2em 0;
}

.review-process-column__content :deep(.typewriter--markdown blockquote) {
  margin: 0.6em 0;
  padding: 0.2em 0.9em;
  color: #718080;
  border: 1px solid rgba(15, 118, 110, 0.22);
  border-radius: 4px;
  background: rgba(15, 118, 110, 0.04);
}

.review-process-column__content :deep(.typewriter--markdown code) {
  padding: 0.15em 0.4em;
  font-size: 0.88em;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 4px;
}

.review-process-column__content :deep(.typewriter--markdown pre) {
  margin: 0.6em 0;
  padding: 0.8em 1em;
  overflow-x: auto;
  background: rgba(15, 23, 42, 0.05);
  border-radius: 8px;
}

.review-process-column__content :deep(.typewriter--markdown pre code) {
  padding: 0;
  font-size: 0.88em;
  background: transparent;
  border-radius: 0;
}

.review-process-column__content :deep(.typewriter--markdown hr) {
  margin: 1em 0;
  border: 0;
  border-top: 1px solid #e2eeec;
}

.review-process-column__content :deep(.typewriter--markdown a) {
  color: #0284c7;
  text-decoration: underline;
}

/* 双栏审核过程内容区较窄，表格同样自适应列宽，超出时包裹层横向滚动 */
.review-process-column__content :deep(.typewriter--markdown .markdown-table-wrap) {
  width: 100%;
  max-width: 100%;
  margin: 0.6em 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.review-process-column__content :deep(.typewriter--markdown table) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  table-layout: auto;
  margin: 0.6em 0;
  border-collapse: collapse;
}

.review-process-column__content :deep(.typewriter--markdown .markdown-table-wrap table) {
  margin: 0;
}

.review-process-column__content :deep(.typewriter--markdown th),
.review-process-column__content :deep(.typewriter--markdown td) {
  padding: 0.4em 0.7em;
  border: 1px solid #e2eeec;
  text-align: left;
}

.review-process-column__content :deep(.typewriter--markdown td) {
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* 表头整行不换行：列宽下限取表头完整文本宽度，总宽超出时由包裹层横向滚动 */
.review-process-column__content :deep(.typewriter--markdown th) {
  background: rgba(15, 23, 42, 0.04);
  font-weight: 600;
  white-space: nowrap;
}

.review-process-column__content :deep(.typewriter--markdown del) {
  color: #718080;
}

.review-process-column__empty {
  color: #718080;
}

.preview-document {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  height: auto;
  min-height: 800px;
  /* 无内框，与面板融为一体，留白与左栏审核依据一致 */
  margin: 14px 16px 16px;
  overflow: hidden;
  box-sizing: border-box;
  white-space: normal;
  background: #ffffff;
}

.preview-document :deep(.office-preview) {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  /* 去掉 OfficePreview 组件自带边框，与面板融为一体 */
  border: 0;
  border-radius: 0;
}

.preview-document__empty {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.review-card__empty {
  color: var(--audit-text-muted);
  font-size: 14px;
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
  display: none;
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
}

.audit-modal-hero__copy {
  position: absolute;
  top: 50%;
  left: clamp(24px, 2.6vw, 38px);
  z-index: 3;
  width: min(60%, 720px);
  max-width: calc(100% - 132px);
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
  background: #f2f9f8;
  border: 0;
  border-radius: 9px;
  box-shadow: 0 9px 24px rgba(31, 112, 106, 0.055);
}

.review-card + .review-card {
  margin-top: clamp(14px, 1.6vw, 19px);
}

.review-card--conclusion {
  display: grid;
  grid-template-columns: clamp(104px, 9.2vw, 132px) minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  min-height: clamp(146px, 14vw, 164px);
  background: #f2f9f8;
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
  background: #dff3f0;
  border: 0;
}

.review-card__title-icon {
  width: clamp(22px, 2vw, 27px);
  height: clamp(22px, 2vw, 27px);
}

.review-card__title-label {
  color: #00706b;
  font-size: clamp(17px, 1.45vw, 21px);
  line-height: 1.3;
}

.review-card__title-hint {
  color: #64748b;
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
  background: #f2f9f8;
  border: 0;
}

@media (max-width: 1100px) {
  .audit-modal-hero__art {
    left: 45%;
    opacity: 0.72;
  }

  .review-process-columns {
    gap: 12px;
    padding: 12px 14px 16px;
  }
}

@media (max-width: 820px) {
  .audit-modal-hero__title {
    max-width: 100%;
    font-size: clamp(20px, 3.5vw, 25px);
  }

  .audit-modal-hero__copy {
    width: 68%;
    max-width: calc(100% - 96px);
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
  border: 0;
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

.review-card {
  border-radius: 8px;
}

.audit-modal-hero__platform {
  animation: audit-hero-platform-breathe 8s ease-in-out infinite;
}

.audit-modal-hero__cube {
  animation: audit-hero-cube-float 5.4s ease-in-out infinite;
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

@media (max-width: 1120px) {
  .audit-modal-hero__copy {
    max-width: calc(100% - 132px);
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
  .review-card__title-icon,
  .audit-modal-hero__platform,
  .audit-modal-hero__cube {
    animation: none !important;
  }

  .audit-modal-hero__platform,
  .audit-modal-hero__cube {
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
</style>
