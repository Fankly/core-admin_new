<template>
  <span :class="`rr-header-ctx-logo-img-wrap ${'enabled-logo-' + app.enabledLogo}`"> </span>
  <span class="rr-header-ctx-logo-text">{{ props.logoName }}</span>
</template>

<script setup lang="ts">
import app from '@/constants/app'

/**
 * 顶部logo
 */
defineOptions({ name: 'Logo' })

interface Props {
  logoUrl?: string
  logoName?: string
}
const props = withDefaults(defineProps<Props>(), { logoName: 'logo' })
</script>
