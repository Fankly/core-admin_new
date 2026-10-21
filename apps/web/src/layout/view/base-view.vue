<template>
  <tabs v-if="preferences.openTabsPage" />
  <div class="rr-view-ctx">
    <el-card shadow="never" class="rr-view-ctx-card">
      <div class="router-view-wrapper" v-loading="shell.isLoading" element-loading-text="加载中...">
        <router-view v-if="isShowView">
          <template #default="{ Component, route }">
            <KeepAliveFrame :curr-comp="Component" :curr-route="route">
              <template #default="{ Comp, fullPath, frameInfo }">
                <keep-alive v-if="enabledKeepAlive" :include="tabs.cachedViews">
                  <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" />
                </keep-alive>
                <component v-else :is="Comp" :key="fullPath" :frameInfo="frameInfo" />
              </template>
            </KeepAliveFrame>
          </template>
        </router-view>
        <RouteLoading :visible="shell.isRouteLoading" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { usePreferencesStore, useShellStore, useTabsStore } from '@/store'
import app from '@/constants/app'
import KeepAliveFrame from '@/layout/component/keepAliveFrame/index.vue'
import RouteLoading from '@/components/Loading/index.vue'
import Tabs from './tabs.vue'

/** 业务内容视图框架 */
defineOptions({ name: 'View' })

const shell = useShellStore()
const tabs = useTabsStore()
const preferences = usePreferencesStore()
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

<style lang="less" scoped>
.router-view-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.rr-view-ctx-card {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;

  :deep(.el-card__body) {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
}
</style>
