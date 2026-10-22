<template>
  <svg aria-hidden="true" :class="['iconfont', className]" :style="[{ width, height, color }, style]" focusable="false">
    <use :href="symbolId" :xlink:href="symbolId" />
  </svg>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { StyleValue } from 'vue'

/**
 * 自定义svg图标，可自行将svg图标下载后存放在/src/assets/icons/svg目录下
 * `使用方法：<svg-icon name="earth" color="red"></svg-icon>`
 */
defineOptions({ name: 'SvgIcon' })

interface Props {
  prefix?: string
  name: string
  color?: string
  width?: string | number
  height?: string | number
  className?: string
  style?: StyleValue
}
const props = withDefaults(defineProps<Props>(), {
  prefix: 'icon',
  color: '',
  className: '',
  style: () => ''
})

const symbolId = computed(() => `#${props.prefix}-${props.name.replace(/^icon-/, '')}`)
</script>
