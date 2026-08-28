<script lang="ts">
import app from '@/constants/app'
import { defineComponent } from 'vue'
interface ILogo {
  logoUrl?: string
  logoName?: string
}

/**
 * 顶部logo
 */
export default defineComponent({
  name: 'Logo',
  props: {
    logoUrl: String,
    logoName: {
      type: String,
      default: 'logo'
    }
  },
  setup(props: ILogo) {
    return { props, app }
  }
})
</script>

<template>
  <span :class="`rr-header-ctx-logo-img-wrap ${'enabled-logo-' + app.enabledLogo}`"> </span>
  <span class="rr-header-ctx-logo-text">{{ props.logoName }}</span>
</template>
