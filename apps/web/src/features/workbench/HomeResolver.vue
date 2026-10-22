<template>
  <component :is="comp" v-if="comp" />
  <div v-else class="home-skeleton" aria-label="正在加载工作台">
    <span class="ds-skeleton"></span>
    <span class="ds-skeleton"></span>
    <span class="ds-skeleton"></span>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, onScopeDispose, shallowRef, watch } from 'vue'
import type { Component } from 'vue'
import { useShellStore } from '@/store'
import { getHomeConfiguration } from '@/api/system'
import { resolveViewComponent } from '@/router/view-registry'

defineOptions({ name: 'HomeResolver' })

const shell = useShellStore()

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

const setFallback = () => {
  comp.value = resolveComponent('/baseHome') ?? null
}

const loadHomePage = async () => {
  const currentRequest = ++requestId
  if (!shell.mainPageRole) {
    setFallback()
    return
  }
  try {
    const res = await getHomeConfiguration()
    if (currentRequest !== requestId) return
    const data = res.data
    if (!res.success || !data?.url) throw new Error(res.msg || '未设置主页')
    // A home configuration pointing back to /home must not recursively mount itself.
    comp.value =
      data.url === '/home' ? (resolveComponent('/baseHome') ?? null) : (resolveComponent(data.url) ?? resolveComponent('/baseHome') ?? null)
  } catch {
    if (currentRequest === requestId) setFallback()
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
  padding-top: 10px;

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
