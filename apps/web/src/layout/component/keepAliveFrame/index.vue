<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { Component } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useMultiFrame } from '@/layout/component/keepAliveFrame/useMultiFrame'
import app from '@/constants/app'
import { useTabsStore } from '@/store'

const props = defineProps<{
  currRoute: RouteLocationNormalizedLoaded
  currComp: Component
}>()

const compList = shallowRef<Array<[string, Component]>>([])
const { setMap, getMap, MAP, delMap } = useMultiFrame()
const tabs = useTabsStore()

const keep = computed(() => app.enabledKeepAlive && Boolean(props.currRoute.meta.isIframe) && Boolean(props.currRoute.meta.frameSrc))
// 避免重新渲染 frameView
const normalComp = computed(() => !keep.value && props.currComp)

const iframeTabs = () => tabs.tabs.filter((tab) => Boolean(tab.meta?.frameSrc))

// 标签页关闭后同步释放 iframe 缓存。
watch(
  () => tabs.tabs,
  () => {
    if (!keep.value) return
    if (iframeTabs().length >= MAP.size) return
    for (const path of MAP.keys()) {
      if (!tabs.tabs.some((tab) => tab.path === path)) {
        delMap(path)
        compList.value = getMap()
      }
    }
  },
  { deep: true }
)

watch(
  () => props.currRoute.fullPath,
  (path) => {
    if (keep.value && iframeTabs().length !== MAP.size) {
      const sameKey = [...MAP.keys()].find((key) => path === key)
      if (!sameKey) setMap(path, props.currComp)
    }
    if (MAP.size > 0) compList.value = getMap()
  },
  { immediate: true }
)
</script>

<template>
  <template v-for="[fullPath, Comp] in compList" :key="fullPath">
    <div v-show="fullPath === props.currRoute.fullPath" class="w-full h-full">
      <slot :full-path="fullPath" :Comp="Comp" :frame-info="{ frameSrc: currRoute.meta?.frameSrc, fullPath }" />
    </div>
  </template>
  <div v-show="!keep" class="comp-layout">
    <slot :Comp="normalComp" :full-path="props.currRoute.fullPath" :frame-info="{ fullPath: props.currRoute.fullPath }" />
  </div>
</template>

<style lang="less" scoped>
.comp-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
