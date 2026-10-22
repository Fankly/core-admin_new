<template>
  <nav class="ds-header__nav" aria-label="主导航">
    <SideNav mode="horizontal" :menus="menus" :router="isTopLayout" :curr-route="currRoute" :on-select="isTopLayout ? undefined : onSelect" />
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
const currRoute = computed(() => (isTopLayout.value ? route.path : shell.activeTopMenu))
const validRoutes = computed(() => toValidRoutes(menu.routes))

const menus = computed<RouteRecordRaw[]>(() => {
  if (isTopLayout.value) return validRoutes.value
  return validRoutes.value.map((item) => ({
    ...item,
    children: []
  }))
})

const onSelect = (path: string) => {
  const target = validRoutes.value.find((item) => item.path === path)
  if (!target) return
  if (!target.children?.length) {
    void router.push(path)
    return
  }
  shell.setActiveTopMenu(path)
}
</script>
