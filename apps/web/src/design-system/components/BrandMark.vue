<template>
  <div class="ds-brand" :class="{ 'ds-brand--hero': hero, 'is-compact': compact }">
    <span class="ds-brand__mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.5 9.5v7.1a5.9 5.9 0 0 0 5.9 5.9h9.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M12.9 22.5h4.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
        <path d="M22.5 8v4.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
        <circle cx="8.5" cy="9.5" r="2.15" fill="currentColor" />
        <circle cx="12.9" cy="22.5" r="1.45" fill="currentColor" opacity="0.55" />
        <circle cx="23.5" cy="22.5" r="2.15" fill="currentColor" />
      </svg>
    </span>
    <span v-if="!compact" class="ds-brand__type">
      <span class="ds-brand__name">项目过程管控平台</span>
      <span class="ds-brand__descriptor">Project Governance</span>
    </span>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'BrandMark' })

interface Props {
  /** Mark only, used for collapsed navigation. */
  compact?: boolean
  /** Larger lockup for the sign-in surface. */
  hero?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false,
  hero: false
})
</script>
