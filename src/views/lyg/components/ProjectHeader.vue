<script setup lang="ts">
import type { ProjectHeaderItem } from './data/progress-data'

defineProps<{ items: ProjectHeaderItem[] }>()
</script>

<template>
  <div class="project-header">
    <div v-for="item in items" :key="item.label" class="project-header__item">
      <span class="project-header__label">{{ item.label }}:</span>
      <span class="project-header__value" :class="{ 'project-header__value--highlight': item.highlight }">
        {{ item.value }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.project-header {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px 32px;
  padding: 16px 24px;
  border: 1px solid rgba(0, 112, 107, 0.2);
  border-radius: 3px;
  background-color: rgba(230, 240, 239, 0.4);
}

.project-header__item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.project-header__label {
  color: rgba(31, 41, 55, 0.6);
}

.project-header__value {
  font-weight: 500;
  color: #1f2937;
  max-width: 260px;
}

.project-header__value--highlight {
  font-weight: 600;
  color: #00706b;
}

@media (max-width: 1024px) {
  .project-header {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .project-header {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
