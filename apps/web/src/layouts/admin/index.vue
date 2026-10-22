<template>
  <div class="ds-admin" :class="shellClasses" :style="layoutStyle">
    <HeaderBar />

    <div class="ds-admin__body">
      <aside v-if="showRail" class="ds-admin__rail" aria-label="侧边导航">
        <SideNav :menus="railMenus" :router="true" mode="vertical" />
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore, usePreferencesStore, useShellStore } from '@/store'
import { ESidebarLayoutEnum } from '@/constants/enum'
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

const showRail = computed(() => preferences.navLayout !== ESidebarLayoutEnum.Top)

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
    'is-sidebar-collapsed': preferences.sidebarCollapse && preferences.navLayout !== ESidebarLayoutEnum.Top,
    'is-sidebar-resizing': state.isSidebarResizing
  }
])

const layoutStyle = computed(() => ({ '--ds-sidebar-width': `${String(state.sidebarWidth)}px` }))
</script>
