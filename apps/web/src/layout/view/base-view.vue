<template>
  <tabs v-if="state.openTabsPage" :tabs="store.tabs" :activeTabName="store.activeTabName"></tabs>
  <div class="rr-view-ctx">
    <!--    判断 -->
    <el-card shadow="never" class="rr-view-ctx-card">
      <div class="router-view-wrapper" v-loading="loading" element-loading-text="加载中...">
        <router-view v-if="state.isShowView">
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

<script lang="ts">
import app from '@/constants/app'
import { EMitt, EThemeSetting } from '@/constants/enum'
import emits from '@/utils/emits'
import { getThemeConfigCacheByKey } from '@/utils/theme'
import { computed, defineComponent, nextTick, reactive } from 'vue'
import { useAppStore } from '@/store'
import Tabs from './tabs.vue'
import KeepAliveFrame from '@/layout/component/keepAliveFrame/index.vue'
import RouteLoading from '@/components/Loading/index.vue'

/**
 * 业务内容视图框架
 */
export default defineComponent({
  name: 'View',
  components: { Tabs, KeepAliveFrame, RouteLoading },
  setup() {
    const store = useAppStore()
    const loading = computed(() => store.loading)
    const state = reactive({
      openTabsPage: getThemeConfigCacheByKey(EThemeSetting.OpenTabsPage),
      isShowView: true
    })
    emits.on(EMitt.OnSetThemeTabsPage, (vl) => {
      state.openTabsPage = vl
    })
    emits.on(EMitt.OnReloadTabPage, () => {
      state.isShowView = false
      nextTick(() => {
        state.isShowView = true
      })
    })

    return { state, store, enabledKeepAlive: app.enabledKeepAlive, loading }
  }
})
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
