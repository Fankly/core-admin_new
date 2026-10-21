<template>
  <el-container
    :class="`rr ${containerClassNames}`"
    :style="layoutStyle"
    v-loading="shell.isLoading"
    element-loading-background="#0000"
    element-loading-lock="true"
    element-loading-custom-class="rr-loading"
  >
    <el-header class="rr-header" height="50px">
      <base-header />
    </el-header>
    <el-container class="rr-body">
      <el-aside v-if="state.isShowNav" class="rr-sidebar hidden-xs-only" width="auto">
        <base-sidebar v-if="state.sidebarLayout === ESidebarLayoutEnum.Left" :router="true" mode="vertical" :is-mobile="false" />
        <base-sidebar v-else :menus="state.mixLayoutRoutes" :router="true" mode="vertical" :is-mobile="false" />
      </el-aside>
      <div
        v-if="state.isShowNav && !state.collapseSidebar"
        ref="sidebarResizer"
        class="rr-sidebar-resizer hidden-xs-only"
        :class="{ 'is-resizing': state.isSidebarResizing }"
        role="separator"
        aria-label="调整菜单栏宽度"
        aria-orientation="vertical"
        :aria-valuemin="SIDEBAR_MIN_WIDTH"
        :aria-valuemax="SIDEBAR_MAX_WIDTH"
        :aria-valuenow="state.sidebarWidth"
        tabindex="0"
        @pointerdown="onSidebarResizeStart"
        @pointermove="onSidebarResizeMove"
        @pointerup="onSidebarResizeEnd"
        @pointercancel="onSidebarResizeEnd"
        @dblclick="resetSidebarWidth"
        @keydown="onSidebarResizeKeydown"
      />
      <el-container class="rr-view-container">
        <el-main class="rr-view">
          <base-view />
        </el-main>
      </el-container>
    </el-container>

    <!-- 移动端导航抽屉：原实现只发事件、没有接收方，这里补齐。 -->
    <el-drawer v-model="mobileSidebarOpen" direction="ltr" size="260px" :with-header="false" class="rr-mobile-sidebar">
      <base-sidebar mode="vertical" :router="true" :is-mobile="true" />
    </el-drawer>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { usePreferencesStore, useSessionStore, useShellStore } from '@/store'
import { CacheSidebarWidth } from '@/constants/cacheKey'
import { ESidebarLayoutEnum } from '@/constants/enum'
import { getCache, setCache } from '@/utils/cache'
import BaseHeader from './header/base-header.vue'
import BaseSidebar from './sidebar/base-sidebar.vue'
import BaseView from './view/base-view.vue'

/** 多标签页布局 */
defineOptions({ name: 'AdminLayout' })

const SIDEBAR_DEFAULT_WIDTH = 230
const SIDEBAR_MIN_WIDTH = 180
const SIDEBAR_MAX_WIDTH = 420

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

const isMobile = useMediaQuery('(max-width: 768px)')
const shell = useShellStore()
const session = useSessionStore()
const preferences = usePreferencesStore()
const router = useRouter()

const state = reactive({
  isShowNav: preferences.navLayout !== ESidebarLayoutEnum.Top,
  sidebarLayout: preferences.navLayout,
  collapseSidebar: preferences.sidebarCollapse,
  isSidebarResizing: false,
  sidebarWidth: readSidebarWidth(session.userId),
  mixLayoutRoutes: router.options.routes.find((route) => route.path === '/')?.children ?? []
})

const sidebarResizer = ref<HTMLElement>()
const activePointerId = ref<number | null>(null)
const mobileSidebarOpen = computed({
  get: () => shell.mobileSidebarOpen,
  set: (value: boolean) => {
    shell.toggleMobileSidebar(value)
  }
})
let dragStartX = 0
let dragStartWidth = state.sidebarWidth
let pendingSidebarWidth = state.sidebarWidth
let resizeFrame = 0

const containerClassNames = computed(() =>
  [
    ...Object.values(preferences.themeClasses),
    ...(isMobile.value ? ['ui-mobile'] : []),
    ...(state.isSidebarResizing ? ['is-sidebar-resizing'] : [])
  ].join(' ')
)
const layoutStyle = computed(() => ({ '--rr-sidebar-width': `${String(state.sidebarWidth)}px` }))

const updateMixLayoutRoutes = (path?: string) => {
  const target = path ?? router.currentRoute.value.matched[0]?.path
  state.mixLayoutRoutes = router.options.routes.find((route) => route.path === target)?.children ?? []
}

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
  document.body.classList.remove('rr-sidebar-resizing')
  if (persist) persistSidebarWidth()
}

const onSidebarResizeStart = (event: PointerEvent) => {
  if (event.button !== 0 || state.collapseSidebar) return
  event.preventDefault()
  activePointerId.value = event.pointerId
  dragStartX = event.clientX
  dragStartWidth = state.sidebarWidth
  pendingSidebarWidth = state.sidebarWidth
  state.isSidebarResizing = true
  sidebarResizer.value?.setPointerCapture(event.pointerId)
  document.body.classList.add('rr-sidebar-resizing')
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
  () => preferences.navLayout,
  (layout) => {
    if (layout === ESidebarLayoutEnum.Top) finishSidebarResize(false)
    state.sidebarLayout = layout
    state.isShowNav = layout !== ESidebarLayoutEnum.Top
    if (layout === ESidebarLayoutEnum.Mix) updateMixLayoutRoutes()
  }
)

watch(
  () => preferences.sidebarCollapse,
  (collapsed) => {
    state.collapseSidebar = collapsed
    if (collapsed) finishSidebarResize(false)
  }
)

watch(
  () => shell.activeTopMenu,
  (path) => {
    if (preferences.navLayout === ESidebarLayoutEnum.Mix) updateMixLayoutRoutes(path)
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
})
</script>
