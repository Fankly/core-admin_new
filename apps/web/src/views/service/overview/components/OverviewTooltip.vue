<script setup lang="ts">
import { cloneVNode, h, ref, useSlots } from 'vue'
import { ElTooltip } from 'element-plus'

const props = defineProps<{ content: string }>()
const slots = useSlots()
const isOverflow = ref(false)
const checkOverflow = (event: Event) => {
  const trigger = event.currentTarget as HTMLElement
  const value = trigger.querySelector('strong') || trigger
  isOverflow.value = value.scrollWidth > value.clientWidth + 1
}
// Reuse the trigger vnode so the tooltip does not change its flex/grid sizing.
const TooltipContent = () => h(
  ElTooltip,
  { content: props.content, disabled: !isOverflow.value, effect: 'light', placement: 'top', popperClass: 'overview-value-tooltip' },
  { default: () => slots.default?.().map((node) => cloneVNode(node, { onMouseover: checkOverflow, onFocus: checkOverflow }, true)) }
)
</script>

<template>
  <TooltipContent />
</template>

<style lang="less">
.overview-value-tooltip.el-popper {
  box-sizing: border-box;
  max-width: min(480px, calc(100vw - 32px));
  color: #334155;
  white-space: normal;
  overflow-wrap: anywhere;
  border-color: #dfe7eb;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.14);
}
</style>
