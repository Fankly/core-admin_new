<template>
  <div class="ds-nav" :class="[`ds-nav--${props.mode}`, { 'is-collapsed': isCollapsed }]">
    <div v-if="!isHorizontal && !isCollapsed" class="ds-nav__heading">
      <span class="ds-nav__label">工作区导航</span>
    </div>

    <el-menu
      ref="menuRef"
      :default-active="props.currRoute ?? state.currRoute"
      :mode="props.mode"
      :collapse="isCollapsed"
      :router="props.router"
      :on-select="props.onSelect"
      :collapse-transition="false"
      :unique-opened="uniqueOpened"
      :ellipsis="false"
      class="ds-nav__menu"
    >
      <NavMenuTree :class-name="popClassName" :menus="state.menus" />
    </el-menu>
    <p v-if="!state.menus.length && !isCollapsed" class="ds-nav__empty">当前账号暂无可用模块</p>

    <div v-if="!isHorizontal && !isCollapsed && !props.isMobile" class="ds-nav__footer">
      <span class="ds-nav__version">v{{ app.version }}</span>
      <span class="ds-nav__footer-mark">过程管控</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, type RouteRecordRaw } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import { themeSetting } from '@/constants/config'
import { EThemeSetting } from '@/constants/enum'
import { useMenuStore, usePreferencesStore } from '@/store'
import { toValidRoutes } from '@/utils/router'
import app from '@/constants/app'
import NavMenuTree from './NavMenuTree.vue'

defineOptions({ name: 'SideNav' })

interface Props {
  mode?: 'vertical' | 'horizontal'
  menus?: RouteRecordRaw[]
  currRoute?: string
  router?: boolean
  isMobile?: boolean
  onSelect?: (index: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'vertical',
  menus: undefined,
  currRoute: undefined,
  router: false,
  isMobile: false,
  onSelect: undefined
})

const MenuMore = defineComponent({
  name: 'MenuMore',
  render: () => null
})

const route = useRoute()
const win = useWindowSize()
const menu = useMenuStore()
const preferences = usePreferencesStore()

const isHorizontal = computed(() => props.mode === 'horizontal')
const isCollapsed = computed(() => !props.isMobile && !isHorizontal.value && preferences.sidebarCollapse)
const uniqueOpened = computed(() => Boolean(preferences.config[EThemeSetting.SidebarUniOpened] ?? themeSetting.sidebarUniOpened))
const popClassName = computed(() => {
  const sidebarTheme = preferences.config[EThemeSetting.Sidebar]
  return `ds-nav-pop-${sidebarTheme === 'dark' ? 'dark' : 'light'}`
})

const state = reactive({
  windowWidth: win.width.value || 1280,
  rawMenus: [] as RouteRecordRaw[],
  menus: [] as RouteRecordRaw[],
  currRoute: route.path
})

const menuRef = ref<{ $el?: HTMLElement } | null>(null)
const widths = ref<number[]>([])

const sourceMenus = computed(() => {
  const source = props.menus === undefined ? menu.routes : props.menus
  return toValidRoutes(source)
})

const buildOverflowMenus = (windowWidth: number) => {
  if (!isHorizontal.value || windowWidth <= 960 || !menuRef.value?.$el) {
    state.menus = state.rawMenus
    return
  }

  const root = menuRef.value.$el
  const available = (root.parentElement?.getBoundingClientRect().width ?? 0) - 24
  if (!available || widths.value.length === 0) {
    state.menus = state.rawMenus
    return
  }

  let used = 0
  let lastVisibleIndex = -1
  for (let index = 0; index < widths.value.length; index++) {
    used += widths.value[index]
    if (used > available - 104) break
    lastVisibleIndex = index
  }

  if (lastVisibleIndex >= state.rawMenus.length - 1) {
    state.menus = state.rawMenus
    return
  }

  const visible = state.rawMenus.slice(0, lastVisibleIndex + 1)
  const overflow = state.rawMenus.slice(lastVisibleIndex + 1)
  state.menus = [
    ...visible,
    {
      path: '/__more',
      component: MenuMore,
      meta: { title: '更多', icon: false, isMore: true },
      children: overflow
    }
  ]
}

const measureMenuWidths = () => {
  if (!isHorizontal.value || !menuRef.value?.$el) return
  const list = menuRef.value.$el.querySelectorAll<HTMLElement>(':scope > .el-menu-item, :scope > .el-sub-menu')
  widths.value = Array.from(list, (item) => item.getBoundingClientRect().width)
  buildOverflowMenus(state.windowWidth)
}

const refreshMenus = (next: RouteRecordRaw[]) => {
  state.rawMenus = next
  state.menus = next
  void nextTick(measureMenuWidths)
}

watch(
  sourceMenus,
  (next) => {
    refreshMenus(next)
  },
  { immediate: true, deep: false }
)

watch(
  () => props.menus,
  () => {
    refreshMenus(sourceMenus.value)
  }
)

watch(
  () => route.path,
  (path) => {
    if (!route.query.pop) state.currRoute = path
  }
)

watch(
  () => win.width.value,
  (width) => {
    state.windowWidth = width || 1280
    // 先恢复完整菜单再测量；否则窗口变大后会一直沿用上一次折叠出的“更多”。
    state.menus = state.rawMenus
    void nextTick(() => {
      state.menus = state.rawMenus
      void nextTick(measureMenuWidths)
    })
  }
)

onMounted(() => {
  void nextTick(measureMenuWidths)
})
</script>
