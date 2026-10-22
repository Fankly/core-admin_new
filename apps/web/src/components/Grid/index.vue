<template>
  <div :style="style">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  useSlots,
  computed,
  provide,
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUnmounted,
  onDeactivated,
  onActivated,
  Fragment,
  isVNode
} from 'vue'
import type { VNode } from 'vue'
import type { BreakPoint } from './interface/index'
import { GridBreakPointKey, GridHiddenIndexKey, GridGapKey, GridColsKey } from './interface'
import GridItem from './components/GridItem.vue'

defineOptions({ name: 'Grid' })

type Props = {
  cols?: number | Record<BreakPoint, number>
  collapsed?: boolean
  collapsedRows?: number
  gap?: [number, number] | number
}

const props = withDefaults(defineProps<Props>(), {
  cols: () => ({ md: 2, lg: 3, xl: 4 }),
  collapsed: false,
  collapsedRows: 1,
  gap: 0
})

onBeforeMount(() => props.collapsed && findIndex())
onBeforeUpdate(() => props.collapsed && findIndex())
onMounted(() => {
  resize({ target: { innerWidth: window.innerWidth } } as unknown as UIEvent)
  window.addEventListener('resize', resize)
})
onActivated(() => {
  resize({ target: { innerWidth: window.innerWidth } } as unknown as UIEvent)
  window.addEventListener('resize', resize)
})
onUnmounted(() => {
  window.removeEventListener('resize', resize)
})
onDeactivated(() => {
  window.removeEventListener('resize', resize)
})

// 监听屏幕变化
const resize = (e: UIEvent) => {
  let width = (e.target as Window).innerWidth
  switch (!!width) {
    case width < 1200:
      breakPoint.value = 'md'
      break
    case width >= 1200 && width < 1920:
      breakPoint.value = 'lg'
      break
    case width >= 1920:
      breakPoint.value = 'xl'
      break
  }
}

// 注入 gap 间距
provide(
  GridGapKey,
  computed(() => (Array.isArray(props.gap) ? props.gap[0] : props.gap))
)

// 注入响应式断点
const breakPoint = ref<BreakPoint>('xl')
provide(GridBreakPointKey, breakPoint)

// 注入要开始折叠的 index
const hiddenIndex = ref(-1)
provide(GridHiddenIndexKey, hiddenIndex)

// 注入 cols
const gridCols = computed(() => {
  if (typeof props.cols === 'object') return props.cols[breakPoint.value]
  return props.cols
})
provide(GridColsKey, gridCols)

// 寻找需要开始折叠的字段 index
const slots = useSlots()

const findIndex = () => {
  const items: VNode[] = []
  const collectItems = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!isVNode(node)) continue
      if (node.type === Fragment && Array.isArray(node.children)) collectItems(node.children)
      else if (node.type === GridItem) items.push(node)
    }
  }
  collectItems(slots.default?.() ?? [])
  const isSuffix = (item: VNode) => item.props?.suffix === '' || item.props?.suffix === true
  const getColumns = (item: VNode) => {
    const responsive = item.props?.[breakPoint.value]
    return (responsive?.span ?? item.props?.span ?? 1) + (responsive?.offset ?? item.props?.offset ?? 0)
  }
  const suffixCols = items.filter(isSuffix).reduce((total, item) => total + getColumns(item), 0)
  let usedCols = 0
  hiddenIndex.value = items
    .filter((item) => !isSuffix(item))
    .findIndex((item) => {
      usedCols += Math.min(getColumns(item), gridCols.value)
      return usedCols > props.collapsedRows * gridCols.value - suffixCols
    })
}

// 断点变化时执行 findIndex
watch(
  () => breakPoint.value,
  () => {
    if (props.collapsed) findIndex()
  }
)

// 监听 collapsed
watch(
  () => props.collapsed,
  (value) => {
    if (value) {
      findIndex()
      return
    }
    hiddenIndex.value = -1
  }
)

// 设置间距
const gridGap = computed(() => {
  if (typeof props.gap === 'number') return `${props.gap}px`
  if (Array.isArray(props.gap)) return `${props.gap[1]}px ${props.gap[0]}px`
  return 'unset'
})

// 设置 style
const style = computed(() => {
  return {
    display: 'grid',
    gridGap: gridGap.value,
    gridTemplateColumns: `repeat(${gridCols.value}, minmax(0, 1fr))`
  }
})

defineExpose({ breakPoint })
</script>
