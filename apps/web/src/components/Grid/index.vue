<template>
  <div :style="style"><slot /></div>
</template>

<script setup lang="ts">
import { computed, Fragment, isVNode, onBeforeMount, onBeforeUpdate, provide, ref, useSlots, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import type { CSSProperties } from 'vue'
import type { GridItemProps, GridProps } from './interface'
import { GridBreakPointKey, GridHiddenIndexKey, GridGapKey, GridColsKey } from './interface'
import { getBreakPoint, getGridColumns, getHiddenIndex } from './layout'
import GridItem from './components/GridItem.vue'

// 保留既有组件名称，兼容调用方和调试工具。
// eslint-disable-next-line vue/multi-word-component-names
defineOptions({ name: 'Grid' })
const props = withDefaults(defineProps<GridProps>(), {
  cols: () => ({ md: 2, lg: 3, xl: 4 }),
  collapsed: false,
  collapsedRows: 1,
  gap: 0
})
const slots = useSlots()
const breakPoint = ref(getBreakPoint(typeof window === 'undefined' ? 1920 : window.innerWidth))
const hiddenIndex = ref(-1)
const gridCols = computed(() => getGridColumns(props.cols, breakPoint.value))
const horizontalGap = computed(() => (Array.isArray(props.gap) ? props.gap[0] : props.gap))
provide(GridBreakPointKey, breakPoint)
provide(GridHiddenIndexKey, hiddenIndex)
provide(GridGapKey, horizontalGap)
provide(GridColsKey, gridCols)
useEventListener('resize', () => {
  breakPoint.value = getBreakPoint(window.innerWidth)
})

const collectItems = (nodes: unknown[]): GridItemProps[] => {
  const items: GridItemProps[] = []
  for (const node of nodes) {
    if (!isVNode(node)) continue
    if (node.type === Fragment && Array.isArray(node.children)) items.push(...collectItems(node.children))
    else if (node.type === GridItem) {
      const item = node.props as GridItemProps | null
      items.push({ ...item, suffix: item?.suffix === true || node.props?.suffix === '' })
    }
  }
  return items
}
const updateHiddenIndex = () => {
  hiddenIndex.value = props.collapsed
    ? getHiddenIndex(collectItems(slots.default?.() ?? []), breakPoint.value, gridCols.value, props.collapsedRows)
    : -1
}
onBeforeMount(updateHiddenIndex)
onBeforeUpdate(updateHiddenIndex)
watch(() => [props.collapsed, props.collapsedRows, gridCols.value, breakPoint.value], updateHiddenIndex)
const style = computed<CSSProperties>(() => ({
  display: 'grid',
  gap: Array.isArray(props.gap) ? `${String(props.gap[1])}px ${String(props.gap[0])}px` : `${String(props.gap)}px`,
  gridTemplateColumns: `repeat(${String(gridCols.value)}, minmax(0, 1fr))`
}))
defineExpose({ breakPoint, hiddenIndex })
</script>
