<template>
  <Teleport to="body">
    <div v-if="visible && previewWindows.length" class="review-material-preview-layer">
      <section
        v-for="previewWindow in previewWindows"
        :key="previewWindow.key"
        class="review-material-preview-panel"
        :class="{ 'is-maximized': previewWindow.maximized, 'is-active': previewWindow.zIndex === topZIndex }"
        :style="getWindowStyle(previewWindow)"
        role="dialog"
        aria-modal="false"
        :aria-label="`预览 ${getReviewMaterialFileName(previewWindow.file)}`"
        @pointerdown="focusWindow(previewWindow.key)"
      >
        <div
          class="review-material-preview__toolbar"
          @dblclick="toggleMaximize(previewWindow.key)"
          @pointerdown="startDrag($event, previewWindow.key)"
        >
          <div class="review-material-preview__label">
            <FileText :size="16" :stroke-width="1.8" aria-hidden="true" />
            <span>预览文件</span>
          </div>
          <span class="review-material-preview__filename" :title="getReviewMaterialFileName(previewWindow.file)">
            {{ getReviewMaterialFileName(previewWindow.file) }}
          </span>
          <span class="review-material-preview__count">{{ getFileIndex(previewWindow.file) + 1 }}/{{ files.length }}</span>
          <div class="review-material-preview__actions" @dblclick.stop @pointerdown.stop>
            <el-tooltip :content="previewWindow.maximized ? '还原窗口' : '最大化窗口'" placement="bottom">
              <button
                type="button"
                class="review-material-preview__action"
                :aria-label="previewWindow.maximized ? '还原窗口' : '最大化窗口'"
                @click="toggleMaximize(previewWindow.key)"
              >
                <Minimize2 v-if="previewWindow.maximized" :size="16" :stroke-width="1.8" aria-hidden="true" />
                <Maximize2 v-else :size="16" :stroke-width="1.8" aria-hidden="true" />
              </button>
            </el-tooltip>
            <el-tooltip content="关闭预览" placement="bottom">
              <button
                type="button"
                class="review-material-preview__action"
                :aria-label="`关闭 ${getReviewMaterialFileName(previewWindow.file)}`"
                @click="closeWindow(previewWindow.key)"
              >
                <X :size="17" :stroke-width="1.8" aria-hidden="true" />
              </button>
            </el-tooltip>
          </div>
        </div>

        <div v-loading="previewWindow.loading" class="review-material-preview__body">
          <OfficePreview
            :src="previewWindow.source"
            :file-name="getReviewMaterialFileName(previewWindow.file)"
            :pdf-options="pdfOptions"
            :toolbar="toolbarOptions"
            height="100%"
            empty-text="暂无可预览文件"
          />
          <button
            v-if="previewWindow.zIndex !== topZIndex"
            type="button"
            class="review-material-preview__activate"
            :aria-label="`激活 ${getReviewMaterialFileName(previewWindow.file)} 预览窗口`"
            @click="focusWindow(previewWindow.key)"
          ></button>
        </div>

        <template v-if="!previewWindow.maximized">
          <span
            v-for="direction in resizeDirections"
            :key="direction"
            class="review-material-preview__resize-handle"
            :class="`is-${direction}`"
            :aria-label="`调整窗口${getResizeDirectionLabel(direction)}大小`"
            role="separator"
            @pointerdown.stop.prevent="startResize($event, previewWindow.key, direction)"
          ></span>
        </template>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts" name="ReviewMaterialPreviewModal">
import { computed, onBeforeUnmount, onMounted, reactive, shallowReactive, watch } from 'vue'
import type { PropType } from 'vue'
import { ElMessage } from 'element-plus'
import { FileText, Maximize2, Minimize2, X } from 'lucide-vue-next'
import { downloadAttachByView } from '@/api/service/requirement'
import OfficePreview from '@/components/OfficePreview'
import type { OfficePdfOptions, OfficePreviewSource, OfficeToolbarOptions } from '@/components/OfficePreview'
import { getReviewMaterialFileKey, getReviewMaterialFileName, resolveReviewMaterialPreviewBlob } from './reviewMaterialPreview'
import type { ReviewMaterialFile } from './reviewMaterialPreview'

type ResizeDirection = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface PreviewWindowState {
  key: string
  file: ReviewMaterialFile
  source: OfficePreviewSource
  loading: boolean
  loadSequence: number
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  maximized: boolean
}

const props = defineProps({
  visible: { type: Boolean, default: false },
  files: { type: Array as PropType<ReviewMaterialFile[]>, default: () => [] },
  activeKey: { type: String, default: '' },
  openRequest: { type: Number, default: 0 },
  /** 联合会审附件下载标识，与"更多详情-附件信息"下载保持一致；传入时走 isLhhs 下载分支 */
  isLhhs: { type: String, default: '' }
})

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'active-change', key: string): void
}>()

const previewWindows = reactive<PreviewWindowState[]>([])
const resizeDirections: ResizeDirection[] = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']
const pdfOptions: OfficePdfOptions = { pageMode: 'none', zoom: 90 }
const toolbarOptions: OfficeToolbarOptions = {
  download: false,
  print: false,
  exportHtml: false,
  zoom: true,
  search: false,
  theme: false,
  position: 'top-center'
}
const VIEWPORT_GAP = 0
const DRAWER_WIDTH = 560
const MIN_WINDOW_WIDTH = 640
const MIN_WINDOW_HEIGHT = 420
let zIndexSeed = 3020
let removePointerListeners: (() => void) | null = null

const topZIndex = computed(() => previewWindows.reduce((top, item) => Math.max(top, item.zIndex), 0))
const getWindow = (key: string) => previewWindows.find((item) => item.key === key)

const getFileIndex = (file: ReviewMaterialFile) => {
  const key = getReviewMaterialFileKey(file)
  return Math.max(
    0,
    props.files.findIndex((item) => getReviewMaterialFileKey(item) === key)
  )
}

const getDefaultGeometry = () => {
  const availableWidth = Math.max(360, window.innerWidth - DRAWER_WIDTH)
  return {
    width: availableWidth,
    height: window.innerHeight,
    x: 0,
    y: 0
  }
}

const clampWindow = (previewWindow: PreviewWindowState) => {
  const maxWidth = Math.max(360, window.innerWidth - VIEWPORT_GAP * 2)
  const maxHeight = Math.max(280, window.innerHeight - VIEWPORT_GAP * 2)
  const minWidth = Math.min(MIN_WINDOW_WIDTH, maxWidth)
  const minHeight = Math.min(MIN_WINDOW_HEIGHT, maxHeight)
  previewWindow.width = Math.min(Math.max(previewWindow.width, minWidth), maxWidth)
  previewWindow.height = Math.min(Math.max(previewWindow.height, minHeight), maxHeight)
  previewWindow.x = Math.min(Math.max(previewWindow.x, VIEWPORT_GAP), Math.max(VIEWPORT_GAP, window.innerWidth - previewWindow.width - VIEWPORT_GAP))
  previewWindow.y = Math.min(
    Math.max(previewWindow.y, VIEWPORT_GAP),
    Math.max(VIEWPORT_GAP, window.innerHeight - previewWindow.height - VIEWPORT_GAP)
  )
}

const getWindowStyle = (previewWindow: PreviewWindowState) => ({
  left: previewWindow.maximized ? '0' : `${previewWindow.x}px`,
  top: previewWindow.maximized ? '0' : `${previewWindow.y}px`,
  width: previewWindow.maximized ? '100vw' : `${previewWindow.width}px`,
  height: previewWindow.maximized ? '100vh' : `${previewWindow.height}px`,
  zIndex: previewWindow.zIndex
})

const focusWindow = (key: string) => {
  const previewWindow = getWindow(key)
  if (!previewWindow) return
  previewWindow.zIndex = ++zIndexSeed
  emit('active-change', key)
}

const loadFile = async (previewWindow: PreviewWindowState) => {
  const uuid = String(previewWindow.file.uuid || '').trim()
  if (!uuid) {
    ElMessage.error('文件缺少标识，无法预览')
    return
  }

  const sequence = ++previewWindow.loadSequence
  previewWindow.loading = true
  previewWindow.source = null
  try {
    const response = await downloadAttachByView(uuid, props.isLhhs)
    if (sequence !== previewWindow.loadSequence || !getWindow(previewWindow.key)) return
    previewWindow.source = await resolveReviewMaterialPreviewBlob(response)
  } catch (error: any) {
    if (sequence !== previewWindow.loadSequence || !getWindow(previewWindow.key)) return
    ElMessage.error(error?.message || '文件获取失败')
  } finally {
    if (sequence === previewWindow.loadSequence) previewWindow.loading = false
  }
}

const openWindow = (key: string) => {
  const file = props.files.find((item) => getReviewMaterialFileKey(item) === key)
  if (!file) return
  const existingWindow = getWindow(key)
  if (existingWindow) {
    focusWindow(key)
    return
  }

  const geometry = getDefaultGeometry()
  const previewWindow = shallowReactive<PreviewWindowState>({
    key,
    file,
    source: null,
    loading: false,
    loadSequence: 0,
    ...geometry,
    zIndex: ++zIndexSeed,
    maximized: false
  })
  previewWindows.push(previewWindow)
  emit('active-change', key)
  void loadFile(previewWindow)
}

const closeWindow = (key: string) => {
  const index = previewWindows.findIndex((item) => item.key === key)
  if (index < 0) return
  previewWindows[index].loadSequence += 1
  previewWindows.splice(index, 1)
  const topWindow = previewWindows.reduce<PreviewWindowState | null>((top, item) => (!top || item.zIndex > top.zIndex ? item : top), null)
  emit('active-change', topWindow?.key || '')
  if (!previewWindows.length) emit('close')
}

const closeAll = () => {
  previewWindows.forEach((item) => (item.loadSequence += 1))
  previewWindows.splice(0)
  emit('active-change', '')
}

const toggleMaximize = (key: string) => {
  const previewWindow = getWindow(key)
  if (!previewWindow) return
  focusWindow(key)
  previewWindow.maximized = !previewWindow.maximized
  if (!previewWindow.maximized) clampWindow(previewWindow)
}

const trackPointer = (move: (event: PointerEvent) => void) => {
  removePointerListeners?.()
  const finish = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('pointercancel', finish)
    document.body.classList.remove('review-material-preview-is-interacting')
    removePointerListeners = null
  }
  removePointerListeners = finish
  document.body.classList.add('review-material-preview-is-interacting')
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', finish)
  window.addEventListener('pointercancel', finish)
}

const startDrag = (event: PointerEvent, key: string) => {
  if (event.button !== 0) return
  const previewWindow = getWindow(key)
  if (!previewWindow || previewWindow.maximized) return
  focusWindow(key)
  const startX = event.clientX
  const startY = event.clientY
  const originX = previewWindow.x
  const originY = previewWindow.y
  trackPointer((moveEvent) => {
    previewWindow.x = originX + moveEvent.clientX - startX
    previewWindow.y = originY + moveEvent.clientY - startY
    clampWindow(previewWindow)
  })
}

const startResize = (event: PointerEvent, key: string, direction: ResizeDirection) => {
  if (event.button !== 0) return
  const previewWindow = getWindow(key)
  if (!previewWindow || previewWindow.maximized) return
  focusWindow(key)
  const startX = event.clientX
  const startY = event.clientY
  const origin = { x: previewWindow.x, y: previewWindow.y, width: previewWindow.width, height: previewWindow.height }
  trackPointer((moveEvent) => {
    const deltaX = moveEvent.clientX - startX
    const deltaY = moveEvent.clientY - startY
    const maxWidth = Math.max(360, window.innerWidth - VIEWPORT_GAP * 2)
    const maxHeight = Math.max(280, window.innerHeight - VIEWPORT_GAP * 2)
    const minWidth = Math.min(MIN_WINDOW_WIDTH, maxWidth)
    const minHeight = Math.min(MIN_WINDOW_HEIGHT, maxHeight)
    if (direction.includes('e'))
      previewWindow.width = Math.min(Math.max(origin.width + deltaX, minWidth), window.innerWidth - origin.x - VIEWPORT_GAP)
    if (direction.includes('s'))
      previewWindow.height = Math.min(Math.max(origin.height + deltaY, minHeight), window.innerHeight - origin.y - VIEWPORT_GAP)
    if (direction.includes('w')) {
      const right = origin.x + origin.width
      previewWindow.width = Math.min(Math.max(origin.width - deltaX, minWidth), right - VIEWPORT_GAP)
      previewWindow.x = right - previewWindow.width
    }
    if (direction.includes('n')) {
      const bottom = origin.y + origin.height
      previewWindow.height = Math.min(Math.max(origin.height - deltaY, minHeight), bottom - VIEWPORT_GAP)
      previewWindow.y = bottom - previewWindow.height
    }
    clampWindow(previewWindow)
  })
}

const getResizeDirectionLabel = (direction: ResizeDirection) =>
  ({ n: '上方', e: '右侧', s: '下方', w: '左侧', ne: '右上角', nw: '左上角', se: '右下角', sw: '左下角' }[direction])

const handleViewportResize = () => previewWindows.forEach((item) => !item.maximized && clampWindow(item))

watch(
  () => props.openRequest,
  () => {
    if (props.visible && props.activeKey) openWindow(props.activeKey)
  }
)

watch(
  () => props.visible,
  (visible) => {
    if (!visible) closeAll()
  }
)

onMounted(() => window.addEventListener('resize', handleViewportResize))

onBeforeUnmount(() => {
  removePointerListeners?.()
  window.removeEventListener('resize', handleViewportResize)
  closeAll()
})

defineExpose({ closeAll })
</script>

<style scoped lang="less">
:global(.review-material-preview-layer) {
  position: fixed;
  z-index: 3010;
  inset: 0;
  pointer-events: none;
}

:global(.review-material-preview-panel) {
  position: fixed;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  color: #475569;
  pointer-events: auto;
  background-color: #f5fbfb;
  border: 1px solid #b8ddd9;
  border-radius: 6px;
  box-shadow: 0 8px 28px rgba(0, 112, 107, 0.12);
}

:global(.review-material-preview-panel.is-active) {
  border-color: #00706b;
  box-shadow: 0 8px 28px rgba(0, 112, 107, 0.12);
}

:global(.review-material-preview-panel.is-maximized) {
  border: 0;
  border-radius: 0;
}

.review-material-preview__toolbar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  height: 48px;
  min-height: 48px;
  padding: 0 8px 0 12px;
  box-sizing: border-box;
  cursor: move;
  user-select: none;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.is-maximized .review-material-preview__toolbar {
  cursor: default;
}

.review-material-preview__actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
}

.review-material-preview__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: #64748b;
  cursor: pointer;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 6px;

  &:hover,
  &:focus-visible {
    color: #00706b;
    background-color: #f0fdfa;
    border-color: #b8ddd9;
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid #00706b;
    outline-offset: 1px;
  }
}

.review-material-preview__label {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  color: #00706b;
  font-size: 13px;
  font-weight: 600;
}

.review-material-preview__filename {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-material-preview__count {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.review-material-preview__body {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  overflow: auto;
  box-sizing: border-box;
}

.review-material-preview__activate {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: 0;

  &:focus-visible {
    outline: 2px solid #00706b;
    outline-offset: -3px;
  }
}

.review-material-preview__body :deep(.office-preview) {
  width: max(100%, 560px);
  min-width: 560px;
  border-color: #e2e8f0;
  border-radius: 6px;
}

.review-material-preview__resize-handle {
  position: absolute;
  z-index: 2;

  &.is-n,
  &.is-s {
    right: 8px;
    left: 8px;
    height: 8px;
    cursor: ns-resize;
  }

  &.is-e,
  &.is-w {
    top: 8px;
    bottom: 8px;
    width: 8px;
    cursor: ew-resize;
  }

  &.is-n {
    top: -4px;
  }
  &.is-s {
    bottom: -4px;
  }
  &.is-e {
    right: -4px;
  }
  &.is-w {
    left: -4px;
  }

  &.is-ne,
  &.is-nw,
  &.is-se,
  &.is-sw {
    width: 14px;
    height: 14px;
  }

  &.is-ne {
    top: -5px;
    right: -5px;
    cursor: nesw-resize;
  }
  &.is-nw {
    top: -5px;
    left: -5px;
    cursor: nwse-resize;
  }
  &.is-se {
    right: -5px;
    bottom: -5px;
    cursor: nwse-resize;
  }
  &.is-sw {
    bottom: -5px;
    left: -5px;
    cursor: nesw-resize;
  }
}

:global(body.review-material-preview-is-interacting) {
  cursor: move;
  user-select: none;
}

:global(body.review-material-preview-is-interacting iframe) {
  pointer-events: none;
}
</style>
