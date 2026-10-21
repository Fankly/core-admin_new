<template>
  <base-sidebar
    mode="horizontal"
    :menus="topHeaderMenus"
    :router="false"
    :curr-route="currRoute"
    :is-mobile="false"
    :on-select="onSelect"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { ESidebarLayoutEnum } from '@/constants/enum'
import { useMenuStore, usePreferencesStore, useShellStore } from '@/store'
import BaseSidebar from '../sidebar/base-sidebar.vue'

/** 顶部导航菜单，混合布局模式下用到 */
defineOptions({ name: 'HeaderMixNavMenus' })

const menu = useMenuStore()
const shell = useShellStore()
const preferences = usePreferencesStore()
const router = useRouter()
const route = useRoute()
const currRoute = ref(String(router.currentRoute.value.matched[0]?.path ?? ''))

watch(
  () => route.path,
  () => {
    if (preferences.navLayout !== ESidebarLayoutEnum.Mix) return
    const routePath = String(router.currentRoute.value.matched[0]?.path ?? '')
    currRoute.value = routePath
    shell.setActiveTopMenu(routePath)
  }
)

const topHeaderMenus = computed(() =>
  menu.routes.map((item: RouteRecordRaw) => ({
    path: item.path,
    children: [],
    meta: item.meta ?? {}
  }))
)

const onSelect = (path: string) => {
  const target = menu.routes.find((item) => item.path === path)
  if (!target?.children?.length) {
    void router.push(path)
    return
  }
  currRoute.value = path
  shell.setActiveTopMenu(path)
}
</script>
