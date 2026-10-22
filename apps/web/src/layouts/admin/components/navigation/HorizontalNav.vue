<template>
  <nav class="ds-header__nav" aria-label="主导航">
    <SideNav
      mode="horizontal"
      :menus="menus"
      :router="isTopLayout"
      :curr-route="currRoute"
      :is-mobile="false"
      :on-select="isTopLayout ? undefined : onSelect"
    />
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { ESidebarLayoutEnum } from '@/constants/enum'
import { useMenuStore, usePreferencesStore, useShellStore } from '@/store'
import SideNav from './SideNav.vue'
import { toValidRoutes } from '@/utils/router'

defineOptions({ name: 'HorizontalNav' })

const menu = useMenuStore()
const shell = useShellStore()
const preferences = usePreferencesStore()
const router = useRouter()
const route = useRoute()

const isTopLayout = computed(() => preferences.navLayout === ESidebarLayoutEnum.Top)
const currRoute = ref(route.path)
const validRoutes = computed(() => toValidRoutes(menu.routes))

const menus = computed<RouteRecordRaw[]>(() => {
  if (isTopLayout.value) return validRoutes.value
  return validRoutes.value.map((item) => ({
    ...item,
    children: []
  }))
})

const resolveActiveTopPath = (): string => {
  const matchedPaths = route.matched.map((record) => record.path)
  return matchedPaths.find((path) => validRoutes.value.some((item) => item.path === path)) ?? validRoutes.value[0]?.path ?? ''
}

const syncActiveTopMenu = () => {
  if (preferences.navLayout !== ESidebarLayoutEnum.Mix) return
  const topPath = resolveActiveTopPath()
  currRoute.value = topPath
  shell.setActiveTopMenu(topPath)
}

const onSelect = (path: string) => {
  const target = menu.routes.find((item) => item.path === path)
  if (!target?.children?.length) {
    void router.push(path)
    return
  }
  currRoute.value = path
  shell.setActiveTopMenu(path)
}

watch(
  () => route.path,
  (path) => {
    if (preferences.navLayout === ESidebarLayoutEnum.Mix) {
      syncActiveTopMenu()
    } else {
      currRoute.value = path
    }
  },
  { immediate: true }
)

watch(
  () => preferences.navLayout,
  (layout) => {
    if (layout === ESidebarLayoutEnum.Mix) syncActiveTopMenu()
    else shell.setActiveTopMenu('')
  }
)

// 菜单在首屏是异步加载的；加载完成后重新对齐混合导航的一级选中项。
watch(
  () => menu.routes.length,
  () => {
    if (menu.routes.length) syncActiveTopMenu()
  }
)
</script>
