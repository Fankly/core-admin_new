<template>
  <component v-if="comp" :is="comp" />
  <div v-else class="home-loading" role="status">正在加载首页…</div>
</template>

<script setup lang="ts" name="/home">
import { useStore } from 'vuex'
import { defineAsyncComponent, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import type { Component } from 'vue'
import { getSysRouteMap, toSysViewComponentPath } from '@/router'
import { getMenuMessage } from '@/api/process'
import emits from '@/utils/emits'
import HomeDashboard from './home/index.vue'

const store = useStore()
const comp = shallowRef<Component | null>(null)
let requestId = 0

// 保留自定义首页；默认首页和旧欢迎页统一使用新的云卡工作台。
const setPath = async () => {
  const currentRequest = ++requestId
  try {
    const res = await getMenuMessage('/home')
    if (currentRequest !== requestId) return
    const path = res.success ? res.data?.url : ''
    const isDefaultHome = !path || ['/home', '/home/index', '/baseHome'].includes(path)
    const loader = !isDefaultHome && store.state.routeToMeta?.[path] ? getSysRouteMap()[toSysViewComponentPath(path)] : null
    comp.value = loader ? defineAsyncComponent(loader) : HomeDashboard
  } catch {
    if (currentRequest === requestId) comp.value = HomeDashboard
  }
}

const setComponent = (isMainPageRole: boolean) => {
  if (isMainPageRole) {
    setPath()
  } else {
    requestId++
    comp.value = HomeDashboard
  }
}

emits.on('isMainPageRole', setComponent)
onMounted(setPath)
onBeforeUnmount(() => {
  requestId++
  emits.off('isMainPageRole', setComponent)
})
</script>

<style scoped>
.home-loading {
  display: grid;
  min-height: 240px;
  height: 100%;
  place-items: center;
  color: #64748b;
  background: #f6fcfb;
}
</style>
