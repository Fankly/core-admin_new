<template>
  <el-container
    :class="`rr ${containerClassNames}`"
    :style="layoutStyle"
    v-loading="state.loading"
    element-loading-background="#0000"
    element-loading-lock="true"
    element-loading-custom-class="rr-loading"
  >
    <!-- 头部 -->
    <el-header class="rr-header" height="50px">
      <base-header></base-header>
    </el-header>
    <el-container class="rr-body">
      <!-- 菜单 -->
      <el-aside v-if="state.isShowNav" class="rr-sidebar hidden-xs-only" width="auto">
        <base-sidebar v-if="state.sidebarLayout === ESidebarLayoutEnum.Left" :router="true" mode="vertical" :is-mobile="false"></base-sidebar>
        <base-sidebar v-else :menus="state.mixLayoutRoutes" :router="true" mode="vertical" :is-mobile="false"></base-sidebar>
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
      ></div>
      <el-container class="rr-view-container">
        <el-main class="rr-view">
          <base-view></base-view>
        </el-main>
      </el-container>
    </el-container>
  </el-container>
</template>
<script lang="ts">
import { CacheSidebarWidth } from '@/constants/cacheKey'
import { EMitt, ESidebarLayoutEnum, EThemeSetting } from '@/constants/enum'
import { getCache, setCache } from '@/utils/cache'
import emits from '@/utils/emits'
import { getThemeConfigCache, getThemeConfigCacheByKey, getThemeConfigToClass } from '@/utils/theme'
import { getValueByKeys } from '@/utils/utils'
import { useMediaQuery } from '@vueuse/core'
import { computed, defineComponent, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { RouteRecordRaw, useRouter } from 'vue-router'
import { useAppStore } from '@/store'
import BaseHeader from './header/base-header.vue'
import BaseSidebar from './sidebar/base-sidebar.vue'
import BaseView from './view/base-view.vue'

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

/**
 * 多标签页布局
 */
export default defineComponent({
  name: 'Layout',
  components: { BaseView, BaseHeader, BaseSidebar },
  setup() {
    const isMobile = useMediaQuery('(max-width: 768px)')
    const store = useAppStore()
    const themeCache = getThemeConfigCache()
    const sidebarLayoutCache = getThemeConfigCacheByKey(EThemeSetting.NavLayout, themeCache)
    const router = useRouter()
    const state = reactive({
      isShowNav: sidebarLayoutCache !== ESidebarLayoutEnum.Top,
      sidebarLayout: sidebarLayoutCache,
      themeClass: getThemeConfigToClass(themeCache),
      loading: false,
      collapseSidebar: getThemeConfigCacheByKey(EThemeSetting.SidebarCollapse) as boolean,
      isSidebarResizing: false,
      sidebarWidth: readSidebarWidth(String(store.user.id || '')),
      mixLayoutRoutes: router.options.routes.find((x) => x.path === '/')?.children ?? ([] as RouteRecordRaw[])
    })
    const sidebarResizer = ref<HTMLElement>()
    const activePointerId = ref<number | null>(null)
    let dragStartX = 0
    let dragStartWidth = state.sidebarWidth
    let pendingSidebarWidth = state.sidebarWidth
    let resizeFrame = 0

    const containerClassNames = computed(() =>
      Object.values(state.themeClass)
        .concat(isMobile.value ? ['ui-mobile'] : [])
        .concat(state.isSidebarResizing ? ['is-sidebar-resizing'] : [])
        .join(' ')
    )
    const layoutStyle = computed(() => ({ '--rr-sidebar-width': `${state.sidebarWidth}px` }))

    const persistSidebarWidth = () => {
      const userId = String(store.user.id || '')
      if (userId) setCache(getSidebarWidthCacheKey(userId), String(state.sidebarWidth))
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

    emits.on(EMitt.OnSelectHeaderNavMenusByMixNav, (path) => {
      state.mixLayoutRoutes = router.options.routes.find((x) => x.path === path)?.children ?? []
    })
    emits.on(EMitt.OnSetTheme, ([type, value]) => {
      state.themeClass[type] = 'ui-' + value
    })
    emits.on(EMitt.OnSetNavLayout, (vl) => {
      if (vl === ESidebarLayoutEnum.Top) finishSidebarResize(false)
      state.sidebarLayout = vl
      state.isShowNav = vl !== ESidebarLayoutEnum.Top
      if (vl === ESidebarLayoutEnum.Mix) {
        const currRoute = getValueByKeys(router.currentRoute.value.matched[0], 'path', '')
        state.mixLayoutRoutes = router.options.routes.find((x) => x.path === currRoute)?.children ?? []
      }
    })
    emits.on(EMitt.OnLoading, (vl) => {
      state.loading = vl
    })
    emits.on(EMitt.OnSwitchLeftSidebar, () => {
      state.collapseSidebar = !state.collapseSidebar
      if (state.collapseSidebar) finishSidebarResize(false)
    })
    watch(
      () => String(store.user.id || ''),
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
    return {
      state,
      sidebarResizer,
      layoutStyle,
      ESidebarLayoutEnum,
      SIDEBAR_MIN_WIDTH,
      SIDEBAR_MAX_WIDTH,
      containerClassNames,
      onSidebarResizeStart,
      onSidebarResizeMove,
      onSidebarResizeEnd,
      onSidebarResizeKeydown,
      resetSidebarWidth
    }
  }
})
</script>
