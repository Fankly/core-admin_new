<template>
  <component :is="comp" v-if="comp" />
  <div v-else class="home-skeleton" aria-label="正在加载主页">
    <span class="ds-skeleton"></span>
    <span class="ds-skeleton"></span>
    <span class="ds-skeleton"></span>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import type { Component } from 'vue'
import { useMenuStore, useShellStore } from '@/store'
import { getHomeConfiguration } from '@/api/system'
import { resolveViewComponent } from '@/router/view-registry'
import HomeDashboard from './HomeDashboard.vue'

defineOptions({ name: 'HomeResolver' })

const shell = useShellStore()
const menu = useMenuStore()

/** Component objects and loaders must not be deeply proxied. */
const comp = shallowRef<Component | null>(null)
const cache = new Map<string, Component>()
let requestId = 0
onScopeDispose(() => {
  requestId += 1
})

const resolveComponent = (path: string): Component | undefined => {
  const cached = cache.get(path)
  if (cached) return cached
  const loader = resolveViewComponent(path)
  if (!loader) return undefined
  const asyncComponent = defineAsyncComponent(loader as () => Promise<Component>)
  cache.set(path, asyncComponent)
  return asyncComponent
}

// 保留自定义首页；默认首页和旧欢迎页统一使用云卡工作台。
const loadHomePage = async (): Promise<void> => {
  const currentRequest = ++requestId
  if (!shell.mainPageRole) {
    comp.value = HomeDashboard
    return
  }
  try {
    const res = await getHomeConfiguration()
    if (currentRequest !== requestId) return
    const path = res.success ? res.data?.url : ''
    const isDefaultHome = !path || ['/home', '/home/index', '/baseHome'].includes(path)
    // 只有已注册为菜单的自定义主页才允许替换默认工作台，避免加载到不可用的视图。
    const loader = !isDefaultHome && Object.hasOwn(menu.routeToMeta, path) ? resolveComponent(path) : undefined
    comp.value = loader ?? HomeDashboard
  } catch {
    if (currentRequest === requestId) comp.value = HomeDashboard
  }
}

onMounted(loadHomePage)
watch(() => shell.mainPageRole, loadHomePage)
</script>

<style scoped lang="less">
.home-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 320px;
  padding: 10px 14px 16px;

  span {
    width: 100%;
    height: 76px;

    &:nth-child(2) {
      height: 210px;
    }

    &:nth-child(3) {
      width: 60%;
      height: 42px;
    }
  }
}
</style>
