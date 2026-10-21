<template>
  <el-menu
    ref="elm"
    :default-active="props.currRoute ?? state.currRoute"
    :mode="props.mode"
    :collapse="props.isMobile ? false : props.mode === 'vertical' && preferences.sidebarCollapse"
    :router="props.router"
    :on-select="props.onSelect"
    :collapse-transition="false"
    :unique-opened="uniqueOpened"
    class="rr-sidebar-menu"
  >
    <sidebar-menus-items :class-name="popClassName" :menus="state.menus" :hidden-index="state.hiddenIndex" />
  </el-menu>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import { themeSetting } from '@/constants/config'
import { EThemeSetting } from '@/constants/enum'
import type { IObject } from '@/types/interface'
import baseView from '@/layout/view/base-view.vue'
import { useMenuStore, usePreferencesStore } from '@/store'
import { toValidRoutes } from '@/utils/router'
import SidebarMenusItems from './sidebar-menus-items.vue'

/** 侧边栏导航菜单 */
defineOptions({ name: 'BaseSidebar' })

interface Props {
  mode?: string
  menus?: RouteRecordRaw[]
  currRoute?: string
  router?: boolean
  onSelect?: (...args: never[]) => void
  isMobile?: boolean
}
const props = withDefaults(defineProps<Props>(), { mode: 'vertical' })

const vueRouter = useRouter()
const route = useRoute()
const win = useWindowSize()
const menu = useMenuStore()
const preferences = usePreferencesStore()

const resolveMenus = (source?: RouteRecordRaw[]) => toValidRoutes(source ?? menu.routes)

const state = reactive({
  windowWidth: win.width.value || 800,
  hiddenIndex: -1,
  rawMenus: resolveMenus(props.menus) as RouteRecordRaw[],
  menus: resolveMenus(props.menus) as RouteRecordRaw[],
  currRoute: props.currRoute ?? route.path
})

const uniqueOpened = computed(() => Boolean(preferences.config[EThemeSetting.SidebarUniOpened] ?? themeSetting.sidebarUniOpened))
const popClassName = computed(() => {
  const sidebarCache = preferences.config[EThemeSetting.Sidebar]
  return `rr-sidebar-menu-pop-${props.mode === 'vertical' && sidebarCache === 'dark' ? 'dark' : 'light'}`
})

const elm = ref<IObject | null>(null)
const widths = ref<number[]>([])

const computeSidebarLayout = (windowWidth: number) => {
  if (props.mode !== 'horizontal' || windowWidth <= 768 || !elm.value?.$el) return
  const root = elm.value.$el as HTMLElement
  const width = (root.parentNode as HTMLElement | null)?.getBoundingClientRect().width ?? 0
  let liWidth = 0
  let index = -1
  for (let i = 0; i < widths.value.length; i++) {
    liWidth += widths.value[i]
    if (liWidth > width) {
      index = i - 1
      break
    }
  }

  state.hiddenIndex = index
  state.menus =
    index > -1
      ? state.rawMenus.slice(0, index).concat({
          path: '/__more',
          component: baseView,
          meta: { title: '更多菜单', icon: false, isMore: true },
          children: state.rawMenus.slice(index)
        } as RouteRecordRaw)
      : state.rawMenus
}

const initComputeSidebarLayout = (windowWidth: number) => {
  if (props.mode !== 'horizontal' || !elm.value?.$el) return
  const lis = (elm.value.$el as HTMLElement).querySelectorAll('li')
  widths.value = Array.from(lis, (item) => item.getBoundingClientRect().width)
  computeSidebarLayout(windowWidth)
}

onMounted(() => {
  initComputeSidebarLayout(state.windowWidth)
})

watch(
  () => props.menus,
  (value) => {
    const next = resolveMenus(value ?? [...vueRouter.options.routes])
    state.menus = next
    state.rawMenus = next
  }
)

watch(
  () => menu.routes,
  (value) => {
    const next = toValidRoutes(value)
    state.rawMenus = next
    state.menus = next
  }
)

watch(
  () => route.path,
  (path) => {
    if (!route.query.pop) {
      window.setTimeout(() => {
        state.currRoute = path
      }, 10)
    }
  }
)

watch(
  () => win.width.value,
  (width) => {
    state.windowWidth = width || 800
    computeSidebarLayout(state.windowWidth)
  }
)

watch(
  () => state.windowWidth,
  (width) => computeSidebarLayout(width)
)
</script>
