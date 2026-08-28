<template>
  <div class="budget-card-container">
    <!-- Header -->
    <cardTitle :title="`各专业预警统计`" />
    <!-- ：${stageTitle} -->

    <!-- Horizontal Stacked Chart Container -->
    <div class="chart-wrapper" ref="chartRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import cardTitle from '@/views/lyg/components/cardTitle.vue'

const props = defineProps<{
  selectedStage?: any
  deptsData?: any[]
}>()

const chartRef = ref<HTMLElement | null>()
let chartInstance: echarts.ECharts | null = null

const stageTitle = computed(() => props.selectedStage?.yjhjName || '项目立项')

// Helper to generate dynamic departmental warning data
const getDeptData = (title: string) => {
  const rawList: any = props.deptsData?.map((dept) => {
    const deptsName = dept.qkjgkbmName
    const txCount = dept.txCount || 0
    const yjCount = dept.yjCount || 0
    const jgCount = dept.jgCount || 0
    const totalCount = dept.totalCount || 0
    const txRate = dept.txRate || 0
    const yjRate = dept.yjRate || 0
    const jgRate = dept.jgRate || 0
    return {
      name: deptsName,
      txCount,
      yjCount,
      jgCount,
      totalCount,
      txRate,
      yjRate,
      jgRate
    }
  })

  rawList.sort((a: any, b: any) => b.totalCount - a.totalCount)

  const top8 = rawList.slice(0, 100)
  return [...top8].reverse()
}

const renderChart = () => {
  if (!chartRef.value) return
  const { clientWidth, clientHeight } = chartRef.value
  if (clientWidth === 0 || clientHeight === 0) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const rawData = getDeptData(stageTitle.value)
  const categories = rawData.map((d) => d.name)
  const remindData = rawData.map((d) => d.txRate)
  const alertData = rawData.map((d) => d.yjRate)
  const warningData = rawData.map((d) => d.jgRate)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 8,
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b', fontSize: 13 },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const idx = params[0].dataIndex
        const d = rawData[idx]
        if (!d) return ''
        const colorMap = {
          提醒: '#FAFD0C',
          预警: '#FC9907',
          警告: '#DB2F2B'
        }
        let res = `<div style="font-weight:bold;margin-bottom:4px;">${d.name}</div>`
        res += `<div style="margin-bottom:4px;">总数: <b>${d.totalCount} 项</b></div>`
        const row = (label: string, count: number, rate: number, color: string) =>
          `<div><span style="display:inline-block;margin-right:6px;border-radius:50%;width:8px;height:8px;background-color:${color}"></span>${label}: <b>${count} 项</b>（${rate}%）</div>`
        res += row('提醒', d.txCount, d.txRate, colorMap.提醒)
        res += row('预警', d.yjCount, d.yjRate, colorMap.预警)
        res += row('警告', d.jgCount, d.jgRate, colorMap.警告)
        return res
      }
    },
    legend: {
      bottom: 0,
      icon: 'circle',
      textStyle: { color: '#475569', fontSize: 13, fontWeight: 500 }
    },
    grid: {
      top: 10,
      left: 10,
      right: 30,
      bottom: 35,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      show: false
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false }
      // axisLabel: {
      //   color: '#1e293b',
      //   fontSize: 10
      //   // fontWeight: 'bold'
      // }
    },
    series: [
      {
        name: '提醒',
        type: 'bar',
        stack: 'total',
        data: remindData,
        label: {
          show: false,
          position: 'inside',
          color: '#78350f',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (p: any) => (p.value > 0 ? `${p.value}%` : '')
        },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#FFFDE7' },
            { offset: 1, color: '#FAFD0C' }
          ])
        }
      },
      {
        name: '预警',
        type: 'bar',
        stack: 'total',
        data: alertData,
        label: {
          show: false,
          position: 'inside',
          color: '#7c2d12',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (p: any) => (p.value > 0 ? `${p.value}%` : '')
        },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#FFF3E0' },
            { offset: 1, color: '#FC9907' }
          ])
        }
      },
      {
        name: '警告',
        type: 'bar',
        stack: 'total',
        data: warningData,
        label: {
          show: false,
          position: 'inside',
          color: '#fff',
          fontSize: 11,
          fontWeight: 'bold',
          formatter: (p: any) => (p.value > 0 ? `${p.value}%` : '')
        },
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#FFEBEE' },
            { offset: 1, color: '#DB2F2B' }
          ])
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  renderChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (!chartInstance) {
        renderChart()
      } else {
        chartInstance.resize()
      }
    })
    resizeObserver.observe(chartRef.value)
  }
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect()
  chartInstance?.dispose()
})

watch(stageTitle, () => {
  renderChart()
})

watch(
  () => props.deptsData,
  () => {
    renderChart()
  },
  { deep: true }
)
</script>

<style scoped>
.budget-card-container {
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 260px;
}
</style>
