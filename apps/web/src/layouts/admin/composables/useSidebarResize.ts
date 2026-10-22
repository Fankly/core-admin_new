import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { usePreferencesStore, useSessionStore } from '@/store'
import { CacheSidebarWidth } from '@/constants/cacheKey'
import { getCache, setCache } from '@/utils/cache'

const SIDEBAR_DEFAULT_WIDTH = 248
const SIDEBAR_MIN_WIDTH = 196
const SIDEBAR_MAX_WIDTH = 380

const clampSidebarWidth = (value: unknown): number => {
  const width = Number(value)
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)))
}

const getSidebarWidthCacheKey = (userId: string): string => `${CacheSidebarWidth}:${userId}`

const readSidebarWidth = (userId: string): number => {
  if (!userId) return SIDEBAR_DEFAULT_WIDTH
  return clampSidebarWidth(getCache(getSidebarWidthCacheKey(userId), {}, SIDEBAR_DEFAULT_WIDTH))
}

/** Owns pointer capture, animation frames and per-user sidebar persistence. */
export function useSidebarResize() {
  const session = useSessionStore()
  const preferences = usePreferencesStore()
  const state = reactive({
    isSidebarResizing: false,
    sidebarWidth: readSidebarWidth(session.userId)
  })

  const sidebarResizer = ref<HTMLElement>()
  const activePointerId = ref<number | null>(null)

  let dragStartX = 0
  let dragStartWidth = state.sidebarWidth
  let pendingSidebarWidth = state.sidebarWidth
  let resizeFrame = 0

  const persistSidebarWidth = () => {
    const userId = session.userId
    if (userId) setCache(getSidebarWidthCacheKey(userId), state.sidebarWidth.toString())
  }

  const applyPendingSidebarWidth = () => {
    resizeFrame = 0
    state.sidebarWidth = clampSidebarWidth(pendingSidebarWidth)
  }

  const cancelResizeFrame = () => {
    if (!resizeFrame) return
    cancelAnimationFrame(resizeFrame)
    resizeFrame = 0
  }

  const finishSidebarResize = (persist = true) => {
    if (activePointerId.value === null && !state.isSidebarResizing) return
    cancelResizeFrame()
    state.sidebarWidth = clampSidebarWidth(pendingSidebarWidth)
    const pointerId = activePointerId.value
    if (pointerId !== null && sidebarResizer.value?.hasPointerCapture(pointerId)) {
      sidebarResizer.value.releasePointerCapture(pointerId)
    }
    activePointerId.value = null
    state.isSidebarResizing = false
    document.body.classList.remove('ds-sidebar-resizing')
    if (persist) persistSidebarWidth()
  }

  const onSidebarResizeStart = (event: PointerEvent) => {
    if (event.button !== 0 || preferences.sidebarCollapse) return
    event.preventDefault()
    activePointerId.value = event.pointerId
    dragStartX = event.clientX
    dragStartWidth = state.sidebarWidth
    pendingSidebarWidth = state.sidebarWidth
    state.isSidebarResizing = true
    sidebarResizer.value?.setPointerCapture(event.pointerId)
    document.body.classList.add('ds-sidebar-resizing')
  }

  const onSidebarResizeMove = (event: PointerEvent) => {
    if (activePointerId.value !== event.pointerId) return
    pendingSidebarWidth = clampSidebarWidth(dragStartWidth + event.clientX - dragStartX)
    if (!resizeFrame) resizeFrame = requestAnimationFrame(applyPendingSidebarWidth)
  }

  const onSidebarResizeEnd = (event: PointerEvent) => {
    if (activePointerId.value !== event.pointerId) return
    finishSidebarResize()
  }

  const resetSidebarWidth = (event?: Event) => {
    event?.preventDefault()
    pendingSidebarWidth = SIDEBAR_DEFAULT_WIDTH
    state.sidebarWidth = SIDEBAR_DEFAULT_WIDTH
    persistSidebarWidth()
  }

  const onSidebarResizeKeydown = (event: KeyboardEvent) => {
    const keyboardWidths: Record<string, number> = {
      ArrowLeft: state.sidebarWidth - 10,
      ArrowRight: state.sidebarWidth + 10,
      Home: SIDEBAR_MIN_WIDTH,
      End: SIDEBAR_MAX_WIDTH
    }
    if (!(event.key in keyboardWidths)) return
    event.preventDefault()
    state.sidebarWidth = clampSidebarWidth(keyboardWidths[event.key])
    pendingSidebarWidth = state.sidebarWidth
    persistSidebarWidth()
  }

  watch(
    () => preferences.sidebarCollapse,
    (collapsed) => {
      if (collapsed) finishSidebarResize(false)
    }
  )

  watch(
    () => session.userId,
    (userId) => {
      finishSidebarResize(false)
      state.sidebarWidth = readSidebarWidth(userId)
      pendingSidebarWidth = state.sidebarWidth
    }
  )

  onBeforeUnmount(() => {
    finishSidebarResize(false)
    cancelResizeFrame()
    document.body.classList.remove('ds-sidebar-resizing')
  })

  return {
    state,
    sidebarResizer,
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_MAX_WIDTH,
    onSidebarResizeStart,
    onSidebarResizeMove,
    onSidebarResizeEnd,
    resetSidebarWidth,
    onSidebarResizeKeydown
  }
}
