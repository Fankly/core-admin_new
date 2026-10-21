<template>
  <header class="ds-page-header">
    <div class="ds-page-header__body">
      <h1 class="ds-page-header__title">{{ title }}</h1>
      <p v-if="description" class="ds-page-header__description">{{ description }}</p>
      <div v-if="$slots.meta" class="ds-page-header__meta">
        <slot name="meta" />
      </div>
    </div>
    <div v-if="$slots.actions" class="ds-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineOptions({ name: 'PageHeader' })

interface Props {
  title: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  description: ''
})
</script>
