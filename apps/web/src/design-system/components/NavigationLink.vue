<template>
  <a v-if="external" :href="to" target="_blank" rel="noopener noreferrer" v-bind="$attrs"><slot /></a>
  <RouterLink v-else :to="to" v-bind="$attrs"><slot /></RouterLink>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
defineOptions({ inheritAttrs: false })
defineProps<{ to: string; external?: boolean }>()
</script>
