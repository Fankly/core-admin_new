<template>
  <div class="ds-nav" :class="[`ds-nav--${props.mode}`, { 'is-collapsed': isCollapsed }]">
    <div v-if="!isHorizontal && !isCollapsed" class="ds-nav__heading">
      <span class="ds-nav__label" :title="props.heading">{{ props.heading }}</span>
    </div>

    <el-menu
      ref="menuRef"
      :default-active="props.currRoute ?? state.currRoute"
      :mode="props.mode"
      :collapse="isCollapsed"
      :router="props.router"
      @select="props.onSelect"
      :collapse-transition="false"
      :unique-opened="true"
      :ellipsis="false"
      class="ds-nav__menu"
    >
      <NavMenuTree :class-name="popClassName" :menus="state.menus" />
    </el-menu>
    <p v-if="!state.menus.length && !isCollapsed" class="ds-nav__empty">当前账号暂无可用模块</p>

    <div v-if="!isHorizontal && !isCollapsed" class="ds-nav__footer">
      <span class="ds-nav__version">v{{ app.version }}</span>
      <span class="ds-nav__footer-mark">过程管控</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, type RouteRecordRaw } from 'vue-router'
import { useResizeObserver } from '@vueuse/core'
import { EThemeSetting } from '@/constants/enum'
import { useMenuStore, usePreferencesStore } from '@/store'
import { toValidRoutes } from '@/utils/router'
import app from '@/constants/app'
import NavMenuTree from './NavMenuTree.vue'

defineOptions({ name: 'SideNav' })

interface Props {
  mode?: 'vertical' | 'horizontal'
  heading?: string
  menus?: RouteRecordRaw[]
  currRoute?: string
  router?: boolean
  onSelect?: (index: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'vertical',
  heading: '工作区导航',
  menus: undefined,
  currRoute: undefined,
  router: false,
  onSelect: undefined
})

const MenuMore = defineComponent({
  name: 'MenuMore',
  render: () => null
})

const route = useRoute()
const menu = useMenuStore()
const preferences = usePreferencesStore()

const isHorizontal = computed(() => props.mode === 'horizontal')
const isCollapsed = computed(() => !isHorizontal.value && preferences.sidebarCollapse)
const popClassName = computed(() => {
  const sidebarTheme = preferences.config[EThemeSetting.Sidebar]
  return `ds-nav-pop-${sidebarTheme === 'dark' ? 'dark' : 'light'}`
})

const state = reactive({
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

const buildOverflowMenus = () => {
  if (!isHorizontal.value || !menuRef.value?.$el) {
    state.menus = state.rawMenus
    return
  }

  const root = menuRef.value.$el
  const available = (root.parentElement?.getBoundingClientRect().width ?? 0) - 24
  if (!available || widths.value.length === 0) {
    state.menus = state.rawMenus
    return
  }

  if (widths.value.reduce((total, width) => total + width, 0) <= available) {
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
  buildOverflowMenus()
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

useResizeObserver(
  () => menuRef.value?.$el?.parentElement,
  () => {
    if (!isHorizontal.value) return
    // 窗口或侧栏宽度变化后，恢复完整菜单再计算“更多”。
    state.menus = state.rawMenus
    void nextTick(measureMenuWidths)
  }
)

onMounted(() => {
  void nextTick(measureMenuWidths)
})
</script>
