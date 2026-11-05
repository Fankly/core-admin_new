<script setup lang="ts">
import type { ModuleItem } from '../types'

interface Props {
  module: ModuleItem
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'click-card', module: ModuleItem): void
}>()
</script>

<template>
  <div class="bpm-module-card" @click="emit('click-card', module)">
    <!-- Card Background Image -->
    <div v-if="module.bgImage" class="bpm-card-bg-img" :style="{ backgroundImage: `url(${module.bgImage})` }"></div>
    <div class="bpm-card-bg-gradient"></div>

    <!-- Center Content -->
    <div class="bpm-card-content">
      <div class="bpm-card-icon-box">
        <component :is="module.icon" class="bpm-card-icon" />
      </div>

      <h4 class="bpm-card-title">
        {{ module.name }}
      </h4>

      <span class="bpm-card-center-badge">
        {{ module.centerName }}
      </span>

      <p class="bpm-card-desc">
        {{ module.description }}
      </p>
    </div>

    <!-- Card Footer -->
    <div class="bpm-card-footer">
      <span class="bpm-card-status-tag">
        {{ module.statusText }}
      </span>
    </div>
  </div>
</template>
