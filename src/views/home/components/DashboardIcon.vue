<template>
  <svg class="d-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <use :href="`${icons}#${name}`" />
  </svg>
</template>

<script setup lang="ts">
import icons from '@/assets/images/home/dashboard-icons.svg'

defineProps<{ name: string }>()
</script>

<style scoped>
.d-ico {
  display: block;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}
</style>
