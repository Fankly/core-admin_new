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

defineOptions({ name: 'HorizontalNav' })

const menu = useMenuStore()
const shell = useShellStore()
const preferences = usePreferencesStore()
const router = useRouter()
const route = useRoute()

const isTopLayout = computed(() => preferences.navLayout === ESidebarLayoutEnum.Top)
const currRoute = ref(router.currentRoute.value.matched[0]?.path ?? '')

const menus = computed<RouteRecordRaw[]>(() => {
  if (isTopLayout.value) return menu.routes
  return menu.routes.map((item) => ({
    ...item,
    children: []
  }))
})

const syncActiveTopMenu = () => {
  if (preferences.navLayout !== ESidebarLayoutEnum.Mix) return
  const topPath = route.matched[0]?.path ?? ''
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
  () => {
    syncActiveTopMenu()
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
</script>
