<template>
  <div :class="`rr-fullscreen ${route.query.pop ? 'new-pop-window' : ''}`">
    <div class="fullscreen-router-wrapper">
      <router-view />
      <RouteLoading :visible="shell.isRouteLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useShellStore } from '@/store'
import RouteLoading from '@/components/Loading/index.vue'

/** 全屏布局 */
defineOptions({ name: 'FullScreenLayout' })

const route = useRoute()
const shell = useShellStore()
</script>

<style lang="less" scoped>
.fullscreen-router-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
