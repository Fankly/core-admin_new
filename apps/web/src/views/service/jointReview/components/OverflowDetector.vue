<template>
  <slot :set-overflow-target="setOverflowTarget" :is-overflowing="isOverflowing" />
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const props = defineProps({
  content: {
    type: [String, Number],
    default: ''
  }
})

const overflowTarget = ref<HTMLElement>()
const isOverflowing = ref(false)

const updateOverflow = async () => {
  await nextTick()
  const element = overflowTarget.value
  isOverflowing.value = !!element && (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth)
}

const setOverflowTarget = (element: HTMLElement | null) => {
  overflowTarget.value = element || undefined
  updateOverflow()
}

useResizeObserver(overflowTarget, updateOverflow)
watch(() => props.content, updateOverflow, { immediate: true, flush: 'post' })
</script>
