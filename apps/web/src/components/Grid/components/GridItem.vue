<template>
  <div v-show="isShow" :style="style"><slot /></div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { BreakPoint, GridItemProps } from '../interface'
import { GridBreakPointKey, GridHiddenIndexKey, GridGapKey, GridColsKey } from '../interface'
import { getItemPlacement } from '../layout'

defineOptions({ name: 'GridItem' })
const props = withDefaults(defineProps<GridItemProps>(), { offset: 0, span: 1, suffix: false })
const breakPoint = inject(GridBreakPointKey, ref<BreakPoint>('xl'))
const hiddenIndex = inject(GridHiddenIndexKey, ref(-1))
const gap = inject(GridGapKey, ref(0))
const cols = inject(GridColsKey, ref(4))
const isShow = computed(() => props.suffix || props.index === undefined || hiddenIndex.value === -1 || Number(props.index) < hiddenIndex.value)
const style = computed<CSSProperties>(() => {
  const { offset, occupied } = getItemPlacement(props, breakPoint.value, cols.value)
  return {
    gridColumn: props.suffix
      ? `${String(cols.value - occupied + 1)} / span ${String(occupied)}`
      : `span ${String(occupied)} / span ${String(occupied)}`,
    marginLeft: offset ? `calc(((100% + ${String(gap.value)}px) / ${String(occupied)}) * ${String(offset)})` : undefined,
    minWidth: 0
  }
})
</script>
