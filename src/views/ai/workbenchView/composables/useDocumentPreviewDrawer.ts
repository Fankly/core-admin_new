import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { previewAttach } from '@/api/ai/smartTaskAudit'
import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import type { OfficePdfOptions, OfficePreviewSource, OfficeToolbarOptions } from '@/components/OfficePreview'
import {
  decodeAuditPreviewFileName,
  getAuditPreviewFileExtension,
  getAuditPreviewFileKey,
  resolvePreviewAttachBlob
} from '../../smartTaskAudit/components/auditFilePreview'

/**
 * 抽屉宽度按工作台正文区宽度取百分比；拖动、方向键与复位共用同一区间。
 * 默认 50：打开预览时左侧预览与右侧规则详情对半分。
 */
export const PREVIEW_DRAWER_DEFAULT_WIDTH = 50
export const PREVIEW_DRAWER_MIN_WIDTH = 22
export const PREVIEW_DRAWER_MAX_WIDTH = 68
const PREVIEW_DRAWER_MIN_PX = 320
const PREVIEW_DETAIL_MIN_PX = 520
const PREVIEW_COLUMN_GAP_PX = 12
/** 方向键单次微调步长 */
const PREVIEW_DRAWER_KEY_STEP = 2

/** 抽屉宽度可变，PDF 按页宽自适应比固定倍率更贴合比对场景 */
const previewPdfOptions: OfficePdfOptions = { pageMode: 'none', zoom: 'page-width' }
const previewToolbarOptions: OfficeToolbarOptions = {
  download: false,
  print: false,
  exportHtml: false,
  zoom: true,
  search: true,
  theme: false,
  position: 'top-center'
}

/**
 * 项目材料预览面板：由页面级工作台承载，与右侧规则详情并排比对。
 * containerRef 传入工作台预览宿主，拖动时按它的实际宽度换算百分比。
 */
export function useDocumentPreviewDrawer(containerRef: Readonly<Ref<HTMLElement | null>>) {
  const drawerRef = ref<HTMLElement | null>(null)
  const visible = ref(false)
  const loading = ref(false)
  const errorText = ref('')
  const activeFile = shallowRef<TXmAttach | null>(null)
  const source = shallowRef<OfficePreviewSource>(null)
  const resizing = ref(false)
  const rememberedWidth = ref(PREVIEW_DRAWER_DEFAULT_WIDTH)
  let triggerElement: HTMLElement | null = null
  let loadSeq = 0
  let stopActiveResize: (() => void) | null = null

  const getWidthBounds = () => {
    const containerWidth = containerRef.value?.getBoundingClientRect().width || 0
    if (!containerWidth) return { min: PREVIEW_DRAWER_MIN_WIDTH, max: PREVIEW_DRAWER_MAX_WIDTH }

    const min = Math.max(PREVIEW_DRAWER_MIN_WIDTH, (PREVIEW_DRAWER_MIN_PX / containerWidth) * 100)
    const max = Math.min(PREVIEW_DRAWER_MAX_WIDTH, ((containerWidth - PREVIEW_DETAIL_MIN_PX - PREVIEW_COLUMN_GAP_PX) / containerWidth) * 100)
    // 极窄宿主无法同时容纳两个最小栏宽时，优先保证预览栏可操作。
    return { min, max: Math.max(min, max) }
  }

  const clampWidth = (value: number) => {
    const { min, max } = getWidthBounds()
    if (!Number.isFinite(value)) return Math.min(max, Math.max(min, PREVIEW_DRAWER_DEFAULT_WIDTH))
    return Math.min(max, Math.max(min, value))
  }

  const widthStyle = computed(() => `${rememberedWidth.value}%`)
  const widthValue = computed(() => Math.round(rememberedWidth.value))
  const fileName = computed(() => (activeFile.value ? decodeAuditPreviewFileName(activeFile.value.name) : ''))
  const fileType = computed(() => {
    const extension = activeFile.value ? getAuditPreviewFileExtension(activeFile.value) : ''
    return extension ? extension.toUpperCase() : ''
  })

  const setWidth = (value: number) => {
    rememberedWidth.value = clampWidth(value)
  }

  /** 复位回到左右对半分 */
  const resetWidth = () => setWidth(PREVIEW_DRAWER_DEFAULT_WIDTH)

  const startResize = (event: PointerEvent) => {
    const container = containerRef.value
    const handle = event.currentTarget as HTMLElement | null
    if (!container || !handle || event.button !== 0) return

    stopActiveResize?.()

    const applyPointer = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== event.pointerId) return
      const rect = container.getBoundingClientRect()
      if (!rect.width) return
      setWidth(((pointerEvent.clientX - rect.left) / rect.width) * 100)
    }

    const stopResize = () => {
      handle.removeEventListener('pointermove', applyPointer)
      handle.removeEventListener('pointerup', stopResize)
      handle.removeEventListener('pointercancel', stopResize)
      handle.removeEventListener('lostpointercapture', stopResize)
      resizing.value = false
      container.classList.remove('is-preview-resizing')
      if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId)
      if (stopActiveResize === stopResize) stopActiveResize = null
    }

    // 指针捕获让拖动越界到文档区、右栏甚至窗口外时仍然连续
    resizing.value = true
    container.classList.add('is-preview-resizing')
    stopActiveResize = stopResize
    handle.setPointerCapture?.(event.pointerId)
    handle.addEventListener('pointermove', applyPointer)
    handle.addEventListener('pointerup', stopResize)
    handle.addEventListener('pointercancel', stopResize)
    handle.addEventListener('lostpointercapture', stopResize)
    event.preventDefault()
  }

  const handleResizeKeydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') setWidth(rememberedWidth.value - PREVIEW_DRAWER_KEY_STEP)
    else if (event.key === 'ArrowRight') setWidth(rememberedWidth.value + PREVIEW_DRAWER_KEY_STEP)
    else if (event.key === 'Home') setWidth(PREVIEW_DRAWER_MIN_WIDTH)
    else if (event.key === 'End') setWidth(PREVIEW_DRAWER_MAX_WIDTH)
    else return
    event.preventDefault()
  }

  const loadDocument = async (file: TXmAttach) => {
    const attachId = String(file.id || '').trim()
    const seq = ++loadSeq
    loading.value = true
    errorText.value = ''
    source.value = null
    try {
      const res = await previewAttach(attachId)
      const blob = await resolvePreviewAttachBlob(res)
      if (seq !== loadSeq) return
      source.value = blob
    } catch (error: any) {
      if (seq !== loadSeq) return
      errorText.value = error?.message || '材料预览失败'
      ElMessage.error(errorText.value)
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  }

  const open = async (file: TXmAttach, trigger?: HTMLElement | null) => {
    if (!String(file?.id || '').trim()) {
      ElMessage.warning('附件标识缺失，无法预览')
      return
    }

    // 记录触发入口：关闭预览后焦点回到用户点击的「预览」按钮
    const activeElement = document.activeElement
    triggerElement = trigger || (activeElement instanceof HTMLElement ? activeElement : null)

    const current = activeFile.value
    const isSameDocument =
      visible.value && Boolean(current) && Boolean(source.value) && getAuditPreviewFileKey(current!) === getAuditPreviewFileKey(file)

    activeFile.value = file
    visible.value = true
    await nextTick()
    // 每次打开都按当前宿主宽度重新收敛：默认对半分，窄屏时右侧规则详情仍保底 520px
    setWidth(rememberedWidth.value)
    drawerRef.value?.focus({ preventScroll: true })
    if (!isSameDocument) await loadDocument(file)
  }

  const reload = () => {
    const file = activeFile.value
    if (file) void loadDocument(file)
  }

  const handleError = (error: Error) => {
    if (!visible.value) return
    errorText.value = error?.message || '材料预览失败'
  }

  /** 切换规则等场景不该抢焦点，传 restoreFocus: false 静默收起 */
  const close = (options?: { restoreFocus?: boolean }) => {
    const trigger = triggerElement
    triggerElement = null
    if (!visible.value) return

    loadSeq += 1
    visible.value = false
    loading.value = false
    errorText.value = ''
    stopActiveResize?.()
    activeFile.value = null
    source.value = null
    if (options?.restoreFocus === false || !trigger) return
    // 等「审核要点」的 inert 撤掉后再回焦，否则 focus 会被忽略
    void nextTick(() => {
      if (document.contains(trigger)) trigger.focus({ preventScroll: true })
    })
  }

  /** 抽屉内 Esc 只关闭抽屉，不冒泡给外层「项目详情」弹窗 */
  const handleWindowKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !visible.value) return
    event.preventDefault()
    event.stopPropagation()
    close()
  }

  watch(visible, (isVisible) => {
    if (isVisible) window.addEventListener('keydown', handleWindowKeydown, true)
    else window.removeEventListener('keydown', handleWindowKeydown, true)
  })

  onBeforeUnmount(() => {
    loadSeq += 1
    stopActiveResize?.()
    window.removeEventListener('keydown', handleWindowKeydown, true)
  })

  return {
    drawerRef,
    visible,
    loading,
    errorText,
    activeFile,
    source,
    resizing,
    fileName,
    fileType,
    widthStyle,
    widthValue,
    minWidth: PREVIEW_DRAWER_MIN_WIDTH,
    maxWidth: PREVIEW_DRAWER_MAX_WIDTH,
    pdfOptions: previewPdfOptions,
    toolbarOptions: previewToolbarOptions,
    open,
    close,
    reload,
    resetWidth,
    startResize,
    handleResizeKeydown,
    handleError
  }
}
