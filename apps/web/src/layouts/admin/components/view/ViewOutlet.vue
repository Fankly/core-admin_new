<template>
  <div class="ds-view" :class="{ 'ds-view--flush': route.meta.fullBleed }">
    <div class="ds-view__content">
      <div ref="pageRef" class="ds-view__router">
        <router-view v-if="isShowView">
          <template #default="{ Component, route: currentRoute }">
            <KeepAliveFrame :curr-comp="Component" :curr-route="currentRoute">
              <template #default="{ Comp, fullPath, frameInfo }">
                <keep-alive v-if="enabledKeepAlive" :include="cachedNames">
                  <component v-if="Comp" :is="resolveCachedView(fullPath)" :key="fullPath" :view="Comp" :frame-info="frameInfo" />
                </keep-alive>
                <component v-else-if="Comp" :is="Comp" :key="fullPath" :frame-info="frameInfo" />
              </template>
            </KeepAliveFrame>
          </template>
        </router-view>
        <RouteLoading :visible="shell.isRouteLoading" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, ref, watch } from 'vue'
import type { Component } from 'vue'
import { useRoute } from 'vue-router'
import { useShellStore, useTabsStore } from '@/store'
import app from '@/constants/app'
import { usePageMotion } from '@/hooks/usePageMotion'
import KeepAliveFrame from './KeepAliveFrame/index.vue'
import RouteLoading from '@/components/Loading/index.vue'

defineOptions({ name: 'ViewOutlet' })

const route = useRoute()
const shell = useShellStore()
const tabs = useTabsStore()
const isShowView = ref(true)
const enabledKeepAlive = app.enabledKeepAlive
const pageRef = ref<HTMLElement | null>(null)
usePageMotion(pageRef, () => [route.fullPath, shell.reloadToken])

/**
 * keep-alive 的 include 匹配组件 name，而 tabs store 保存的是 fullPath。
 * 给每个缓存路径生成一个稳定的具名包装组件，既保持 store 的 path 语义，
 * 又让 include 真正命中；否则缓存配置只会是一个不起作用的开关。
 */
const cacheWrappers = new Map<string, Component>()

const pathHash = (path: string): string => {
  let hash = 0
  for (let index = 0; index < path.length; index++) {
    hash = (hash * 31 + path.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

const toCacheName = (path: string): string => `CachedView_${pathHash(path)}`
const cachedNames = computed(() => tabs.cachedViews.map(toCacheName))

const resolveCachedView = (path: string): Component => {
  const name = toCacheName(path)
  const cached = cacheWrappers.get(name)
  if (cached) return cached

  const wrapper = defineComponent({
    name,
    inheritAttrs: false,
    props: {
      view: {
        type: [Object, Function],
        required: true
      }
    },
    setup(props, { attrs }) {
      return () => h(props.view as Component, attrs)
    }
  })
  cacheWrappers.set(name, wrapper)
  return wrapper
}

// “刷新当前页”只重建 router-view，不动 tabs / 路由状态。
watch(
  () => shell.reloadToken,
  () => {
    isShowView.value = false
    void nextTick(() => {
      isShowView.value = true
    })
  }
)
</script>

<style scoped lang="less">
.ds-view__router {
  position: relative;
  flex: 1;
  width: 100%;
  min-height: 0;
}
</style>
