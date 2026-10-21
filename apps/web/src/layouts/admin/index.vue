<template>
  <div class="ds-admin" :class="shellClasses" :style="layoutStyle">
    <HeaderBar />

    <div class="ds-admin__body">
      <aside v-if="showRail" class="ds-admin__rail" aria-label="侧边导航">
        <SideNav :menus="railMenus" :router="preferences.navLayout === ESidebarLayoutEnum.Left" mode="vertical" :is-mobile="false" />
      </aside>

      <button
        v-if="showRail && !preferences.sidebarCollapse"
        ref="sidebarResizer"
        class="ds-admin__resizer"
        :class="{ 'is-resizing': state.isSidebarResizing }"
        type="button"
        role="separator"
        aria-label="调整导航栏宽度"
        aria-orientation="vertical"
        :aria-valuemin="SIDEBAR_MIN_WIDTH"
        :aria-valuemax="SIDEBAR_MAX_WIDTH"
        :aria-valuenow="state.sidebarWidth"
        @pointerdown="onSidebarResizeStart"
        @pointermove="onSidebarResizeMove"
        @pointerup="onSidebarResizeEnd"
        @pointercancel="onSidebarResizeEnd"
        @dblclick="resetSidebarWidth"
        @keydown="onSidebarResizeKeydown"
      />

      <main class="ds-admin__main">
        <div class="ds-workspace">
          <WorkspaceTabs v-if="preferences.openTabsPage" />
          <div class="ds-workspace__viewport">
            <ViewOutlet />
          </div>
        </div>
      </main>
    </div>

    <el-drawer
      v-model="mobileSidebarOpen"
      direction="ltr"
      size="280px"
      :with-header="false"
      :append-to-body="true"
      :class="['ds-mobile-drawer', ...Object.values(preferences.themeClasses)]"
    >
      <div class="ds-mobile-brand">
        <BrandMark />
      </div>
      <div class="ds-mobile-nav">
        <SideNav mode="vertical" :router="true" :is-mobile="true" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { useMenuStore, usePreferencesStore, useSessionStore, useShellStore } from '@/store'
import { CacheSidebarWidth } from '@/constants/cacheKey'
import { ESidebarLayoutEnum } from '@/constants/enum'
import { getCache, setCache } from '@/utils/cache'
import { BrandMark } from '@/design-system'
import HeaderBar from './components/header/HeaderBar.vue'
import SideNav from './components/navigation/SideNav.vue'
import WorkspaceTabs from './components/tabs/WorkspaceTabs.vue'
import ViewOutlet from './components/view/ViewOutlet.vue'

defineOptions({ name: 'AdminLayout' })

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

const route = useRoute()
const shell = useShellStore()
const session = useSessionStore()
const preferences = usePreferencesStore()
const menu = useMenuStore()
const isMobile = useMediaQuery('(max-width: 960px)')

const state = reactive({
  isSidebarResizing: false,
  sidebarWidth: readSidebarWidth(session.userId)
})

const sidebarResizer = ref<HTMLElement>()
const activePointerId = ref<number | null>(null)

const showRail = computed(() => !isMobile.value && preferences.navLayout !== ESidebarLayoutEnum.Top)

const railMenus = computed(() => {
  if (preferences.navLayout !== ESidebarLayoutEnum.Mix) return undefined
  const topPath = shell.activeTopMenu || route.matched[0]?.path
  return menu.routes.find((item) => item.path === topPath)?.children ?? []
})

const shellClasses = computed(() => [
  ...Object.values(preferences.themeClasses),
  {
    'ds-admin--top': preferences.navLayout === ESidebarLayoutEnum.Top,
    'ds-admin--mobile': isMobile.value,
    'is-sidebar-collapsed': preferences.sidebarCollapse,
    'is-sidebar-resizing': state.isSidebarResizing
  }
])

const layoutStyle = computed(() => ({ '--ds-sidebar-width': `${String(state.sidebarWidth)}px` }))

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

watch(
  () => route.path,
  () => {
    if (mobileSidebarOpen.value) mobileSidebarOpen.value = false
  }
)

watch(isMobile, (mobile) => {
  if (!mobile) mobileSidebarOpen.value = false
})

onBeforeUnmount(() => {
  finishSidebarResize(false)
  cancelResizeFrame()
  document.body.classList.remove('ds-sidebar-resizing')
})
</script>
