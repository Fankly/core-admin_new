<template>
  <div class="ds-view" :class="{ 'ds-view--flush': route.meta.fullBleed }">
    <div class="ds-view__content">
      <div class="ds-view__router">
        <router-view v-if="isShowView">
          <template #default="{ Component, route: currentRoute }">
            <KeepAliveFrame :curr-comp="Component" :curr-route="currentRoute">
              <template #default="{ Comp, fullPath, frameInfo }">
                <keep-alive v-if="enabledKeepAlive" :include="tabs.cachedViews">
                  <component :is="Comp" :key="fullPath" :frame-info="frameInfo" />
                </keep-alive>
                <component v-else :is="Comp" :key="fullPath" :frame-info="frameInfo" />
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
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useShellStore, useTabsStore } from '@/store'
import app from '@/constants/app'
import KeepAliveFrame from './KeepAliveFrame/index.vue'
import RouteLoading from '@/components/Loading/index.vue'

defineOptions({ name: 'ViewOutlet' })

const route = useRoute()
const shell = useShellStore()
const tabs = useTabsStore()
const isShowView = ref(true)
const enabledKeepAlive = app.enabledKeepAlive

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
