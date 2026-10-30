import { ComputedRef, onBeforeUnmount, onMounted, Ref, ref, watch } from 'vue'

/** 数据行高（与 styles.css 中 --aep-row-height 保持一致） */
const ROW_HEIGHT = 53
/** 表头高度 */
const HEADER_HEIGHT = 50
/** 填充行上限，避免异常数据下渲染过多节点 */
const MAX_EMPTY_ROWS = 40

/**
 * 计算表格空白填充行数：数据不足一行时用空白行铺满容器（与设计稿一致）
 * @param containerRef 表格滚动容器
 * @param rowsCount 当前数据行数
 */
export const useEmptyRows = (containerRef: Ref<HTMLElement | undefined>, rowsCount: Ref<number> | ComputedRef<number>) => {
  const emptyRows = ref(0)

  const compute = (): void => {
    const el = containerRef.value
    if (!el) {
      emptyRows.value = 0
      return
    }
    const rest = el.clientHeight - HEADER_HEIGHT - rowsCount.value * ROW_HEIGHT
    emptyRows.value = Math.min(MAX_EMPTY_ROWS, Math.max(0, Math.floor(rest / ROW_HEIGHT)))
  }

  let observer: ResizeObserver | undefined

  onMounted(() => {
    compute()
    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      observer = new ResizeObserver(() => compute())
      observer.observe(containerRef.value)
    }
  })

  watch(rowsCount, () => compute(), { flush: 'post' })
  onBeforeUnmount(() => observer?.disconnect())

  return { emptyRows, computeEmptyRows: compute }
}
