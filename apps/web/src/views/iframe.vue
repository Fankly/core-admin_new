<template>
  <IframePage :frame-info="frameInfo" />
</template>

<script setup lang="ts">
import IframePage from '@/features/embed/IframePage.vue'

defineOptions({ name: 'IframeRoute' })
defineProps<{ frameInfo?: { frameSrc?: string; fullPath?: string } }>()
</script>
