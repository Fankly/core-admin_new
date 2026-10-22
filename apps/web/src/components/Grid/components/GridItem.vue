<template>
  <div v-show="isShow" :style="style">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { BreakPoint, Responsive } from '../interface/index'
import { GridBreakPointKey, GridHiddenIndexKey, GridGapKey, GridColsKey } from '../interface'

defineOptions({ name: 'GridItem' })

type Props = {
  index?: number | string
  offset?: number
  span?: number
  suffix?: boolean
  md?: Responsive
  lg?: Responsive
  xl?: Responsive
}

const props = withDefaults(defineProps<Props>(), {
  offset: 0,
  span: 1,
  suffix: false,
  md: undefined,
  lg: undefined,
  xl: undefined
})

// 注入断点
const breakPoint = inject(GridBreakPointKey, ref<BreakPoint>('xl'))
const shouldHiddenIndex = inject(GridHiddenIndexKey, ref(-1))
const isShow = computed(
  () => props.suffix || props.index === undefined || shouldHiddenIndex.value === -1 || Number(props.index) < shouldHiddenIndex.value
)

const gap = inject(GridGapKey, ref(0))
const cols = inject(GridColsKey, ref(4))
const style = computed(() => {
  let span = props[breakPoint.value]?.span ?? props.span
  let offset = props[breakPoint.value]?.offset ?? props.offset
  if (props.suffix) {
    return {
      gridColumnStart: cols.value - span - offset + 1,
      gridColumnEnd: `span ${span + offset}`,
      marginLeft: offset !== 0 ? `calc(((100% + ${gap.value}px) / ${span + offset}) * ${offset})` : 'unset'
    }
  } else {
    return {
      gridColumn: `span ${span + offset > cols.value ? cols.value : span + offset}/span ${span + offset > cols.value ? cols.value : span + offset}`,
      marginLeft: offset !== 0 ? `calc(((100% + ${gap.value}px) / ${span + offset}) * ${offset})` : 'unset'
    }
  }
})
</script>
