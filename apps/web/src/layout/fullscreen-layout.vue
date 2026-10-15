<template>
  <div :class="`rr-fullscreen ${route.query.pop ? 'new-pop-window' : ''}`">
    <div class="fullscreen-router-wrapper">
      <router-view />
      <RouteLoading :visible="store.getRouteLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store'

/**
 * 全屏布局
 */
defineOptions({ name: 'FullScreenLayout' })

const route = useRoute()
const store = useAppStore()
</script>
<style lang="less" scoped>
.fullscreen-router-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
