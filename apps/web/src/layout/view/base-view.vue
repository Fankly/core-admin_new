<template>
  <tabs v-if="openTabsPage" :tabs="store.tabs" :activeTabName="store.activeTabName"></tabs>
  <div class="rr-view-ctx">
    <!--    判断 -->
    <el-card shadow="never" class="rr-view-ctx-card">
      <div class="router-view-wrapper" v-loading="loading" element-loading-text="加载中...">
        <router-view v-if="isShowView">
          <template v-slot="{ Component, route }">
            <KeepAliveFrame :curr-comp="Component" :curr-route="route">
              <template #default="{ Comp, fullPath, frameInfo }">
                <keep-alive v-if="enabledKeepAlive" :include="store.caches">
                  <component :is="Comp" :key="fullPath" :frameInfo="frameInfo" />
                </keep-alive>
                <component v-else :is="Comp" :key="fullPath" :frameInfo="frameInfo" />
              </template>
            </KeepAliveFrame>
          </template>
        </router-view>
        <RouteLoading :visible="store.getRouteLoading" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useAppStore } from '@/store'
import app from '@/constants/app'
import { EMitt, EThemeSetting } from '@/constants/enum'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey } from '@/utils/theme'
import KeepAliveFrame from '@/layout/component/keepAliveFrame/index.vue'
import RouteLoading from '@/components/Loading/index.vue'
import Tabs from './tabs.vue'

/**
 * 业务内容视图框架
 */
defineOptions({ name: 'View' })

const store = useAppStore()

const loading = computed(() => store.loading)
const openTabsPage = ref(getThemeConfigCacheByKey(EThemeSetting.OpenTabsPage))
const isShowView = ref(true)

emits.on(EMitt.OnSetThemeTabsPage, (vl) => {
  openTabsPage.value = vl
})
emits.on(EMitt.OnReloadTabPage, () => {
  isShowView.value = false
  nextTick(() => {
    isShowView.value = true
  })
})

const enabledKeepAlive = app.enabledKeepAlive
</script>

<style lang="less" scoped>
.router-view-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

.rr-view-ctx-card {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;

  :deep(.el-card__body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
