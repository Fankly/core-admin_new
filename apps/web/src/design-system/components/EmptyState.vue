<template>
  <div class="ds-empty-state" role="status">
    <span v-if="$slots.icon" class="ds-empty-state__icon" aria-hidden="true"><slot name="icon" /></span>
    <h3 class="ds-empty-state__title">{{ title }}</h3>
    <p v-if="description" class="ds-empty-state__description">{{ description }}</p>
    <div v-if="$slots.actions" class="ds-empty-state__actions"><slot name="actions" /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<style scoped lang="less">
.ds-empty-state {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding: var(--ds-space-7) var(--ds-space-5);
  text-align: center;
}
.ds-empty-state__icon {
  margin-bottom: var(--ds-space-2);
  color: var(--ds-ink-tertiary);
}
.ds-empty-state__title {
  font-size: var(--ds-text-base);
  font-weight: 600;
}
.ds-empty-state__description {
  max-width: 42ch;
  color: var(--ds-ink-secondary);
  font-size: var(--ds-text-md);
}
.ds-empty-state__actions {
  margin-top: var(--ds-space-2);
}
</style>
