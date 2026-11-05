import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'

// 项目使用的 TypeScript 4.3 DOM 类型尚未包含 Font Loading API。
type FontLoadingDocument = Document & { fonts: { ready: Promise<unknown> } }

export const useOverviewChart = (options: {
  enabled: () => boolean
  option: () => echarts.EChartsOption
  filename: () => string
  /** 图表点击回调（如饼图扇区筛选）；参数为 ECharts 事件对象，含 dataIndex。 */
  onClick?: (params: unknown) => void
  /** 记录用户手动切换图例的状态，供后续数据更新与下载使用。 */
  onLegendSelectChanged?: (params: unknown) => void
  /** 悬停图形元素（如圆环扇区），用于和图例联动。 */
  onMouseOver?: (params: unknown) => void
  /** 指针离开图形元素（如从扇区移到圆环中心空白处），画布内也会触发。 */
  onMouseOut?: (params: unknown) => void
  /** 指针离开整张图表（含画布外），用于收起联动状态。 */
  onGlobalOut?: (params: unknown) => void
  /** 单系列图表中持续突出显示的选中项；-1 表示未选中，与鼠标/图例的临时高亮独立。 */
  selectedDataIndex?: () => number
  /** 圆环外径占画布短边的比例（含悬停外弹余量）：设置后提示框放到圆环左右外侧，不遮挡圆心读数。 */
  ringRadius?: number
}) => {
  const chartRef = shallowRef<HTMLDivElement | null>(null)
  const chartAvailable = ref(false)
  const active = ref(true)
  const enabled = computed(options.enabled)
  const selectedDataIndex = computed(() => options.selectedDataIndex?.() ?? -1)
  const tooltipPosition: echarts.TooltipComponentOption['position'] = (point, _params, _element, _target, { contentSize }) => {
    const bounds = chartRef.value!.getBoundingClientRect()
    const [width, height] = contentSize
    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight
    const pointerX = bounds.left + point[0]
    const pointerY = bounds.top + point[1]
    const gap = 12
    const margin = 8
    let left = pointerX + gap
    let top = pointerY + gap
    if (options.ringRadius) {
      // 圆环：优先放在指针所在半边的圆环外侧，放不下再换另一侧；纵向以指针为中心。
      const centerX = bounds.left + bounds.width / 2
      const radius = (Math.min(bounds.width, bounds.height) * options.ringRadius) / 2
      const rightSide = centerX + radius + gap
      const leftSide = centerX - radius - gap - width
      const fitsRight = rightSide + width <= viewportWidth - margin
      const fitsLeft = leftSide >= margin
      left = pointerX >= centerX ? (fitsRight || !fitsLeft ? rightSide : leftSide) : fitsLeft || !fitsRight ? leftSide : rightSide
      top = pointerY - height / 2
    } else {
      if (left + width > viewportWidth - margin) left = pointerX - width - gap
      if (top + height > viewportHeight - margin) top = pointerY - height - gap
    }
    // 提示挂在 body 上，按浏览器视口避让，再转回 ECharts 所需的图表局部坐标。
    return [
      Math.max(margin, Math.min(left, viewportWidth - width - margin)) - bounds.left,
      Math.max(margin, Math.min(top, viewportHeight - height - margin)) - bounds.top
    ]
  }
  const chartOption = computed(() => {
    // 表格视图和缓存到后台的页面不构建整份图表数据，重新显示时再取最新值。
    if (!enabled.value || !active.value) return null
    const option = options.option()
    return { ...option, tooltip: { ...option.tooltip, position: tooltipPosition } }
  })
  let chart: echarts.ECharts | null = null
  let resizeObserver: ResizeObserver | null = null
  let mounted = false
  let renderFrame = 0
  let renderedOption: echarts.EChartsOption | null = null
  let renderedSelection = -1
  let chartWidth = 0
  let chartHeight = 0
  let fontResizePending = false

  const syncSelectedHighlight = () => {
    if (!chart || !options.selectedDataIndex) return
    // 用独立的高亮键保留选中态，移出扇区或图例的 downplay 不会清除它。
    const target = { seriesIndex: 0, highlightKey: 'overview-selection' }
    chart.dispatchAction({ type: 'downplay', ...target })
    if (selectedDataIndex.value >= 0) chart.dispatchAction({ type: 'highlight', ...target, dataIndex: selectedDataIndex.value })
  }

  const disposeChart = () => {
    chart?.dispose()
    chart = null
    renderedOption = null
    renderedSelection = -1
    chartWidth = 0
    chartHeight = 0
    chartAvailable.value = false
  }

  const drawChart = () => {
    renderFrame = 0
    if (!mounted || !active.value) return
    const element = chartRef.value
    // 每帧只读一次容器尺寸，init / resize 使用同一份像素值，避免重复同步布局。
    const width = element?.clientWidth ?? 0
    const height = element?.clientHeight ?? 0
    if (!enabled.value) {
      chartAvailable.value = false
      // 退出过渡仍需保留画布，待模板移除容器后再销毁。
      // 同时兼容阶段详情的 v-show：容器隐藏时也应释放实例。
      if (!element || !width || !height) disposeChart()
      return
    }
    if (!element || !width || !height) return
    const isInitialRender = !chart
    let resized = false
    if (!chart) {
      chart = echarts.init(element, undefined, { width, height })
      // 事件回调读取闭包里的最新实现；实例重建后重新绑定，扇区点击始终对应当前筛选状态。
      chart.on('click', (params: unknown) => options.onClick?.(params))
      chart.on('legendselectchanged', (params: unknown) => options.onLegendSelectChanged?.(params))
      chart.on('mouseover', (params: unknown) => options.onMouseOver?.(params))
      chart.on('mouseout', (params: unknown) => options.onMouseOut?.(params))
      chart.on('globalout', (params: unknown) => options.onGlobalOut?.(params))
    } else if (width !== chartWidth || height !== chartHeight || fontResizePending) {
      chart.resize({ width, height, animation: { duration: 0 } })
      resized = true
    }
    chartWidth = width
    chartHeight = height
    fontResizePending = false
    const option = chartOption.value
    if (option !== renderedOption) {
      chart.setOption(
        {
          ...option,
          // 首帧完整绘制，由容器负责淡入；后续更新保留图表的数据过渡。
          animation: true,
          animationDuration: isInitialRender ? 0 : 480,
          animationDurationUpdate: 260,
          animationEasing: 'cubicOut',
          animationEasingUpdate: 'cubicOut'
        },
        { replaceMerge: ['series'] }
      )
      syncSelectedHighlight()
      renderedOption = option
    } else if (resized || selectedDataIndex.value !== renderedSelection) {
      // 只改高亮时不重新提交整份数据。
      syncSelectedHighlight()
    }
    renderedSelection = selectedDataIndex.value
    chartAvailable.value = true
  }

  // props、容器挂载、字体和 ResizeObserver 共用一条队列，DOM 更新后每帧最多绘制一次。
  const renderChart = () => {
    if (!mounted || !active.value || renderFrame) return
    renderFrame = requestAnimationFrame(drawChart)
  }

  const downloadChart = () => {
    if (!chart || !chartAvailable.value || !enabled.value) return
    const link = document.createElement('a')
    link.download = options.filename()
    // 下载始终使用完整数据帧，避免截取到柱形生长或切换中的中间状态。
    chart.setOption({ ...chartOption.value, animation: false }, { replaceMerge: ['series'] })
    syncSelectedHighlight()
    chart.getZr().flush()
    link.href = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
    chart.setOption({ animation: true })
    link.click()
  }

  /** 外部（如左侧图例）悬停时联动高亮图形元素；单系列图表传 dataIndex 即可。 */
  const highlightData = (dataIndex: number) => {
    if (!chart || !chartAvailable.value) return
    chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex })
  }
  const downplayData = () => {
    if (!chart || !chartAvailable.value) return
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
  }

  watch(
    chartRef,
    (element, previous) => {
      if (previous) {
        resizeObserver?.unobserve(previous)
        disposeChart()
      }
      if (element) {
        if (active.value) resizeObserver?.observe(element)
        // 新容器挂载后立即绘制，与旧内容的退出过渡并行。
        renderChart()
      }
    },
    { flush: 'post' }
  )
  watch([enabled, chartOption, selectedDataIndex], renderChart, { flush: 'post' })
  onMounted(() => {
    mounted = true
    resizeObserver = new ResizeObserver(renderChart)
    if (chartRef.value) resizeObserver.observe(chartRef.value)
    renderChart()
    const fontLoadingDocument = document as FontLoadingDocument
    fontLoadingDocument.fonts.ready.then(() => {
      // 字体在首帧之前就绪时无需再 resize；之后加载完成则重算标签布局。
      if (mounted && active.value && chart) {
        fontResizePending = true
        renderChart()
      }
    })
  })
  const suspendChart = () => {
    if (renderFrame) cancelAnimationFrame(renderFrame)
    renderFrame = 0
    fontResizePending = false
    resizeObserver?.disconnect()
    disposeChart()
  }
  // 主工作区使用 keep-alive：离开页签不会卸载组件，需主动释放画布及尺寸监听。
  onDeactivated(() => {
    active.value = false
    suspendChart()
  })
  onActivated(() => {
    active.value = true
    if (chartRef.value) resizeObserver?.observe(chartRef.value)
    renderChart()
  })
  onBeforeUnmount(() => {
    mounted = false
    suspendChart()
  })

  return { chartRef, chartAvailable, renderChart, downloadChart, highlightData, downplayData }
}
