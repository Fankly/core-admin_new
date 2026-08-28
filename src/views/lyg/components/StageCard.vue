<script setup lang="ts">
import type { Stage } from './data/progress-data'

defineProps<{
  stage: Stage
  inactive?: boolean
}>()
</script>

<template>
  <div class="stage-card" :class="{ 'stage-card--inactive': inactive }">
    <div class="stage-card__title">{{ stage.title }}</div>
    <div class="stage-card__body">
      <div v-for="field in stage.fields" :key="field.label" class="stage-card__field">
        <span>{{ field.label }}</span>
        <span>{{ field.value ? `: ${field.value}` : '：' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage-card {
  width: 100%;
  border: 1px solid #00706b;
  border-radius: 3px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.stage-card__title {
  padding: 8px 16px;
  border-bottom: 1px solid #00706b;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #00706b;
}

.stage-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
}

.stage-card__field {
  font-size: 12px;
  line-height: 1.5;
  color: #666;
}

.stage-card--inactive {
  border-color: #c4c4c4;
}

.stage-card--inactive .stage-card__title {
  color: #c4c4c4;
  border-bottom-color: #c4c4c4;
}
</style>
