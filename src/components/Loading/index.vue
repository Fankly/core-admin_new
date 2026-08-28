<template>
  <div class="route-loading-container" :class="{ show: visible }">
    <div class="loading-content">
      <AppSpinner :spinning="visible" />
      <div v-if="text && visible" class="route-loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'RouteLoading'
}
</script>

<script lang="ts" setup>
import AppSpinner from './spinner.vue'

interface Props {
  visible?: boolean
  text?: string
}

withDefaults(defineProps<Props>(), {
  visible: false,
  text: ''
})
</script>

<style scoped>
.route-loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.route-loading-container.show {
  opacity: 1;
  visibility: visible;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.route-loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: var(--color-primary, #409eff);
  font-weight: 500;
  text-align: center;
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .route-loading-container {
    background-color: rgba(0, 0, 0, 0.8);
  }
}
</style>
