<template>
  <div class="chart-card">
    <cardTitle :title="title" />
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import cardTitle from '@/views/lyg/components/cardTitle.vue'

interface DataVo {
  TOP_CITIES_COMPLETION: any[]
  title: string
}

const props = defineProps<DataVo>()

const chartRef = ref<HTMLDivElement | null>()
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const buildOption = (): echarts.EChartsOption => {
  return {
    grid: {
      top: 15,
      bottom: 10,
      left: 55,
      right: 55,
      containLabel: false
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(45, 212, 191, 0.4)',
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const item = params[0]
        return `
          <div style="font-weight: bold; margin-bottom: 4px; color: #5EEAD4;">${item.name}市</div>
          <div>完成率: <span style="font-weight: bold; color: #34D399;">${item.value}%</span></div>
        `
      }
    },
    xAxis: {
      type: 'value',
      show: false
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: props.TOP_CITIES_COMPLETION.map((c: any) => c.dwName),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#334155',
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    series: [
      {
        name: '完成率',
        type: 'bar',
        barWidth: 14,
        data: props.TOP_CITIES_COMPLETION.map((c: any) => c.wcl),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: '#818CF8' }
          ])
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          color: '#1E293B',
          fontSize: 14,
          fontWeight: 'bold'
        }
      }
    ]
  }
}

const updateChart = () => {
  if (!chartInstance) return
  chartInstance.setOption(buildOption())
}

const initChart = () => {
  if (!chartRef.value) return
  const { clientWidth, clientHeight } = chartRef.value
  if (clientWidth === 0 || clientHeight === 0) return
  if (chartInstance) return
  chartInstance = echarts.init(chartRef.value)

  chartInstance.setOption(buildOption())
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(
  () => props.TOP_CITIES_COMPLETION,
  () => {
    updateChart()
  },
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  initChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (!chartInstance) {
        initChart()
      } else {
        chartInstance.resize()
      }
    })
    resizeObserver.observe(chartRef.value)
  }
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  chartInstance?.dispose()
})
</script>

<style scoped>
.chart-card {
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.chart-container {
  width: 100%;
  flex: 1;
  min-height: 120px;
}
</style>
