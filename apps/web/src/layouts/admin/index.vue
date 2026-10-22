<template>
  <div class="ds-admin" :class="shellClasses" :style="layoutStyle">
    <HeaderBar />

    <div class="ds-admin__body">
      <aside v-if="showRail" class="ds-admin__rail" aria-label="侧边导航">
        <SideNav :menus="railMenus" :heading="railHeading" :router="true" mode="vertical" />
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
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore, usePreferencesStore, useShellStore } from '@/store'
import { ESidebarLayoutEnum } from '@/constants/enum'
import { findNavigationRoot } from '@/router/navigation'
import { toValidRoutes } from '@/utils/router'
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
const validMenus = computed(() => toValidRoutes(menu.routes))
const activeModule = computed(() => validMenus.value.find((item) => item.path === shell.activeTopMenu))

const railMenus = computed(() => {
  if (preferences.navLayout !== ESidebarLayoutEnum.Mix) return undefined
  return activeModule.value?.children ?? []
})
const railHeading = computed(() => (preferences.navLayout === ESidebarLayoutEnum.Mix ? activeModule.value?.meta?.title : undefined))

watch(
  [() => preferences.navLayout, () => route.path, validMenus],
  () => {
    if (preferences.navLayout !== ESidebarLayoutEnum.Mix) return
    const currentModule = findNavigationRoot(validMenus.value, route.path)
    const nextModule = currentModule ?? activeModule.value ?? validMenus.value.at(0)
    shell.setActiveTopMenu(nextModule?.path ?? '')
  },
  { immediate: true }
)

const shellClasses = computed(() => [
  ...Object.values(preferences.themeClasses),
  {
    'ds-admin--top': preferences.navLayout === ESidebarLayoutEnum.Top,
    'ds-admin--mix': preferences.navLayout === ESidebarLayoutEnum.Mix,
    'is-sidebar-collapsed': preferences.sidebarCollapse && preferences.navLayout !== ESidebarLayoutEnum.Top,
    'is-sidebar-resizing': state.isSidebarResizing
  }
])

const layoutStyle = computed(() => ({ '--ds-sidebar-width': `${String(state.sidebarWidth)}px` }))
</script>
