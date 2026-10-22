<template>
  <div class="ds-admin" :class="shellClasses" :style="layoutStyle">
    <HeaderBar />

    <div class="ds-admin__body">
      <aside v-if="showRail" class="ds-admin__rail" aria-label="侧边导航">
        <SideNav :menus="railMenus" :router="true" mode="vertical" :is-mobile="false" />
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

      <main id="workspace-main" class="ds-admin__main" tabindex="-1">
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
      aria-label="导航菜单"
      :class="['ds-mobile-drawer', ...Object.values(preferences.themeClasses)]"
    >
      <h2 class="sr-only">导航菜单</h2>
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
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { useMenuStore, usePreferencesStore, useShellStore } from '@/store'
import { ESidebarLayoutEnum } from '@/constants/enum'
import { BrandMark } from '@/design-system'
import HeaderBar from './components/header/HeaderBar.vue'
import SideNav from './components/navigation/SideNav.vue'
import WorkspaceTabs from './components/tabs/WorkspaceTabs.vue'
import ViewOutlet from './components/view/ViewOutlet.vue'
import { useSidebarResize } from './composables/useSidebarResize'

defineOptions({ name: 'AdminLayout' })

const route = useRoute()
const shell = useShellStore()
const preferences = usePreferencesStore()
const menu = useMenuStore()
const isMobile = useMediaQuery('(max-width: 960px)')
const {
  state,
  sidebarResizer,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
  onSidebarResizeStart,
  onSidebarResizeMove,
  onSidebarResizeEnd,
  resetSidebarWidth,
  onSidebarResizeKeydown
} = useSidebarResize()

const showRail = computed(() => !isMobile.value && preferences.navLayout !== ESidebarLayoutEnum.Top)

const railMenus = computed(() => {
  if (preferences.navLayout !== ESidebarLayoutEnum.Mix) return undefined
  const topPath =
    shell.activeTopMenu ||
    menu.routes.find((item) => route.path === item.path || route.path.startsWith(`${item.path}/`))?.path ||
    menu.routes[0]?.path
  return menu.routes.find((item) => item.path === topPath)?.children ?? []
})

const shellClasses = computed(() => [
  ...Object.values(preferences.themeClasses),
  {
    'ds-admin--top': preferences.navLayout === ESidebarLayoutEnum.Top,
    'ds-admin--mobile': isMobile.value,
    'is-sidebar-collapsed': preferences.sidebarCollapse && !isMobile.value && preferences.navLayout !== ESidebarLayoutEnum.Top,
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

watch(
  () => route.path,
  () => {
    if (mobileSidebarOpen.value) mobileSidebarOpen.value = false
  }
)

watch(isMobile, (mobile) => {
  if (!mobile) mobileSidebarOpen.value = false
})
</script>
