<template>
  <div class="ds-fullscreen" :class="{ 'new-pop-window': Boolean(route.query.pop) }">
    <div ref="pageRef" class="ds-fullscreen__router">
      <router-view />
      <RouteLoading :visible="shell.isRouteLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useShellStore } from '@/store'
import { usePageMotion } from '@/hooks/usePageMotion'
import RouteLoading from '@/components/Loading/index.vue'

defineOptions({ name: 'FullscreenLayout' })

const route = useRoute()
const shell = useShellStore()
const pageRef = ref<HTMLElement | null>(null)
usePageMotion(pageRef, () => route.fullPath)
</script>
