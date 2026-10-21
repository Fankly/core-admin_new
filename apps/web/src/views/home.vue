<template>
  <component :is="comp" v-if="comp" />
  <div v-else class="home-skeleton" v-loading="true" element-loading-text="正在加载工作台…"></div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, shallowRef, watch } from 'vue'
import type { Component } from 'vue'
import { useShellStore } from '@/store'
import { getMenuMessage } from '@/api/process'
import { resolveViewComponent } from '@/router/view-registry'

defineOptions({ name: 'HomePage' })

const shell = useShellStore()

/** 组件对象与 loader 都不能被深层代理。 */
const comp = shallowRef<Component | null>(null)
const cache = new Map<string, Component>()

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
  if (!shell.mainPageRole) {
    setFallback()
    return
  }
  try {
    const res = await getMenuMessage('/home')
    if (!res.success || !res.data?.url) throw new Error(res.msg || '未设置主页')
    comp.value = resolveComponent(String(res.data.url)) ?? resolveComponent('/baseHome') ?? null
  } catch {
    setFallback()
  }
}

onMounted(loadHomePage)
watch(() => shell.mainPageRole, loadHomePage)
</script>

<style scoped lang="less">
.home-skeleton {
  width: 100%;
  height: 100%;
  min-height: 320px;
}
</style>
