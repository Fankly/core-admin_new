<template>
  <div class="map-container">
    <button class="city-overview-btn" @click="handleSelectAll">全 市</button>
    <div ref="chartRef" class="map-chart-stage map-3d-stage"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl'
import lianyungangJson from '@/views/lyg/overviewMap/data/lianyungang'

// Register map
echarts.registerMap('lianyungang', lianyungangJson as any)

const props = defineProps<{
  districts: any[]
  labelFormatter: (district: any, params: any) => string
}>()

const emit = defineEmits<{
  (e: 'selectDistrict', districtName: string): void
  (e: 'selectAll'): void
}>()

const chartRef = ref()
let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
const selectedDistrictName = ref<string>('')

const DEFAULT_ALPHA = 50
const DEFAULT_BETA = 2

const handleSelectAll = () => {
  selectedDistrictName.value = ''
  updateChart()
  emit('selectAll')
}

const buildOption = () => {
  const selectedName = selectedDistrictName.value
  return {
    backgroundColor: 'transparent',
    geo3D: [
      {
        map: 'lianyungang',
        shading: 'lambert',
        realisticMaterial: { detailTexture: 'none', roughness: 1, metalness: 0 },
        light: {
          main: { intensity: 1.2, shadow: false, alpha: 30, beta: 40 },
          ambient: { intensity: 0.6 }
        },
        viewControl: {
          autoRotate: false,
          distance: 130,
          alpha: DEFAULT_ALPHA,
          beta: DEFAULT_BETA,
          animation: true,
          panMouseButton: 'left',
          rotateMouseButton: 'left',
          autoRotateAfterStill: 0
        },
        regionHeight: 2,
        boxWidth: 110,
        boxDepth: 110,
        boxHeight: 2,
        environment: 'none',
        silent: true,
        itemStyle: {
          color: '#0F766E',
          opacity: 0.55,
          borderWidth: 1,
          borderColor: '#0F766E'
        }
      }
    ],
    series: [
      {
        type: 'map3D',
        map: 'lianyungang',
        shading: 'lambert',
        realisticMaterial: { detailTexture: 'none', roughness: 1, metalness: 0 },
        light: {
          main: { intensity: 1.2, shadow: false, alpha: 30, beta: 40 },
          ambient: { intensity: 0.6 }
        },
        viewControl: {
          autoRotate: false,
          distance: 130,
          alpha: DEFAULT_ALPHA,
          beta: DEFAULT_BETA,
          animation: true,
          panMouseButton: 'left',
          rotateMouseButton: 'left',
          autoRotateAfterStill: 0
        },
        regionHeight: 2,
        boxWidth: 110,
        boxDepth: 110,
        boxHeight: 2,
        environment: 'none',
        label: {
          show: true,
          position: 'top',
          distance: 5,
          formatter: (params: any) => {
            const district = props.districts.find((d) => d.name === params.name)
            return props.labelFormatter(district, params)
          },
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          backgroundColor: 'rgba(13, 148, 136, 0.9)',
          padding: [6, 8],
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.5)',
          shadowBlur: 8,
          shadowColor: 'rgba(0, 0, 0, 0.4)'
        },
        emphasis: {
          label: {
            show: true,
            color: '#fff',
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            color: '#008B84',
            opacity: 0.95,
            borderWidth: 1.5,
            borderColor: '#5EEAD4'
          }
        },
        itemStyle: {
          color: '#14B8A6',
          opacity: 0.92,
          borderWidth: 1.2,
          borderColor: '#5EEAD4'
        },
        data: props.districts.map((d) => ({
          name: d.name,
          value: d.center || [0, 0],
          itemStyle:
            d.name === selectedName
              ? {
                  color: '#008B84',
                  opacity: 0.95,
                  borderWidth: 2,
                  borderColor: '#5EEAD4'
                }
              : undefined
        }))
      }
    ]
  }
}

const updateChart = () => {
  if (!chartInstance) return
  chartInstance.setOption(buildOption() as any)
}

const restoreTilt = () => {
  if (!chartInstance) return
  chartInstance.setOption(
    {
      geo3D: [{ viewControl: { alpha: DEFAULT_ALPHA, beta: DEFAULT_BETA } }],
      series: [{ viewControl: { alpha: DEFAULT_ALPHA, beta: DEFAULT_BETA } }]
    } as any,
    { lazyUpdate: true }
  )
}

const initMap = () => {
  if (!chartRef.value) return
  const { clientWidth, clientHeight } = chartRef.value
  if (clientWidth === 0 || clientHeight === 0) return
  if (chartInstance) return
  chartInstance = echarts.init(chartRef.value)

  chartInstance.setOption(buildOption() as any)

  chartInstance.on('click', (params: any) => {
    if (!params.name) return
    if (params.componentType === 'series' || params.componentType === 'geo3D') {
      const district = props.districts.find((d) => d.name === params.name)
      if (!district) return
      selectedDistrictName.value = selectedDistrictName.value === params.name ? '' : params.name
      updateChart()
      emit('selectDistrict', district.code)
      return
    }
  })

  chartInstance.on('globalout', () => {
    setTimeout(restoreTilt, 400)
  })
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(
  () => props.districts,
  () => {
    updateChart()
  },
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  initMap()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (!chartInstance) {
        initMap()
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
.map-container {
  position: relative;
  overflow: hidden;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.map-chart-stage {
  position: relative;
  width: 100%;
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-3d-stage {
  position: relative;
}

.city-overview-btn {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  padding: 4px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  background-color: rgba(0, 112, 107, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  transition: background-color 0.2s ease;
}

.city-overview-btn:hover {
  background-color: rgba(0, 139, 132, 0.95);
}
</style>
