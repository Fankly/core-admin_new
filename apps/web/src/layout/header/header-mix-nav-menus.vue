<template>
  <base-sidebar
    mode="horizontal"
    :menus="topHeaderMenus"
    :router="false"
    :currRoute="currRoute"
    :is-mobile="false"
    :onSelect="onSelect"
  ></base-sidebar>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { useAppStore } from '@/store'
import { EMitt, ESidebarLayoutEnum, EThemeSetting } from '@/constants/enum'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey } from '@/utils/theme'
import { getValueByKeys } from '@/utils/utils'
import BaseSidebar from '../sidebar/base-sidebar.vue'

/**
 * 顶部导航菜单，混合布局模式下用到
 */
defineOptions({ name: 'HeaderMixNavMenus' })

const store = useAppStore()
const router = useRouter()
const route = useRoute()
const routers = router.options.routes
const currRoute = ref(getValueByKeys(router.currentRoute.value.matched[0], 'path', ''))

watch(
  () => route.path,
  () => {
    if (getThemeConfigCacheByKey(EThemeSetting.NavLayout) === ESidebarLayoutEnum.Mix) {
      const routePath = getValueByKeys(router.currentRoute.value.matched[0], 'path', '')
      currRoute.value = routePath
      emits.emit(EMitt.OnSelectHeaderNavMenusByMixNav, routePath)
    }
  }
)
const topHeaderMenus = computed(() => {
  const rs: any[] = []
  store.routes.forEach((x: RouteRecordRaw) => {
    rs.push({
      path: x.path,
      children: [],
      meta: x.meta ? x.meta : {}
    })
  })
  return rs
})
const onSelect = (path: string) => {
  const curr = routers.find((x) => x.path === path)

  if (!curr?.children?.length) {
    router.push(path)
  } else {
    currRoute.value = path
    emits.emit(EMitt.OnSelectHeaderNavMenusByMixNav, path)
  }
}
</script>
