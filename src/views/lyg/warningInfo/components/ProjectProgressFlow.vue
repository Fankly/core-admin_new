<template>
  <div class="flow-card-container">
    <!-- Header -->
    <cardTitle :title="`项目执行关键节点预警`" />

    <!-- 3D Carousel Stage Flow Area -->
    <div class="carousel-stage-area" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
      <div class="perspective-wrapper">
        <div
          v-for="(stage, idx) in STAGES_DATA"
          :key="stage.yjhj"
          @click="handleCardClick(idx, stage)"
          class="stage-card"
          :class="{ 'center-card': idx === activeIndex }"
          :style="getCardStyle(idx)"
        >
          <div class="stage-card-title">{{ stage.yjhjName }}</div>
          <div class="metrics-container">
            <!-- 提醒 Item -->
            <div class="metric-label" @click.stop="handleMetricClick(stage, 'TX')">
              <span class="dot dot-remind"></span>
              <span>{{ stage.yjhjName !== '项目结算' ? `${stage.yjhjName}提醒` : `季度未结算` }}</span>
            </div>
            <div class="metric-value" @click.stop="handleMetricClick(stage, 'TX')">{{ stage.txCount }}</div>

            <!-- 预警 Item -->
            <div class="metric-label" @click.stop="handleMetricClick(stage, 'YJ')">
              <span class="dot dot-alert"></span>
              <span>{{ stage.yjhjName !== '项目结算' ? `${stage.yjhjName}预警` : `结算进度为零` }}</span>
            </div>
            <div class="metric-value" @click.stop="handleMetricClick(stage, 'YJ')">{{ stage.yjCount }}</div>
          </div>
          <!-- 警告 Item -->
          <div class="metric-label" @click.stop="handleMetricClick(stage, 'JG')">
            <span class="dot dot-warning"></span>
            <span>{{ stage.yjhjName !== '项目结算' ? `${stage.yjhjName}警告` : `纯物资领用项目` }}</span>
          </div>
          <div class="metric-value" @click.stop="handleMetricClick(stage, 'JG')">{{ stage.jgCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { StageInfo, StageKey } from '@/views/lyg/warningInfo/data/types'
import cardTitle from '@/views/lyg/components/cardTitle.vue'

const props = defineProps<{
  activeStageKey?: StageKey | null
  STAGES_DATA: any[]
}>()

const emit = defineEmits<{
  (e: 'selectStage', stage: any): void
  (e: 'openDetail', payload: { stage: any; yjlx: string }): void
}>()

const activeIndex = ref(0)
const isPlaying = ref(true)
const isHovered = ref(false)

let timer: ReturnType<typeof setInterval> | null = null

const startAutoPlay = () => {
  stopAutoPlay()
  timer = setInterval(() => {
    if (isPlaying.value && !isHovered.value) {
      const nextIndex = (activeIndex.value + 1) % props.STAGES_DATA.length
      activeIndex.value = nextIndex
      emit('selectStage', props.STAGES_DATA[nextIndex])
    }
  }, 10000)
}

const stopAutoPlay = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const getCardStyle = (idx: number) => {
  let offset = idx - activeIndex.value
  if (offset > props.STAGES_DATA.length / 2) offset -= props.STAGES_DATA.length
  if (offset < -props.STAGES_DATA.length / 2) offset += props.STAGES_DATA.length

  const isCenter = offset === 0

  if (isCenter) {
    return {
      transform: 'translateX(0px) translateZ(50px) scale(1.08)',
      opacity: 1,
      zIndex: 40
    }
  } else {
    const sideOffset = offset * 180
    return {
      transform: `translateX(${sideOffset}px) translateZ(0px) scale(0.9)`,
      opacity: 0.82,
      zIndex: 20 - Math.abs(offset)
    }
  }
}

const handleCardClick = (idx: number, stage: any) => {
  activeIndex.value = idx
  emit('selectStage', stage)
}

const handleMetricClick = (stage: any, position: any) => {
  let yjlx = position
  emit('openDetail', { stage, yjlx })
}

watch(
  () => props.activeStageKey,
  (newKey) => {
    if (newKey) {
      const idx = props.STAGES_DATA.findIndex((s) => s.yjhj === newKey)
      if (idx !== -1) {
        activeIndex.value = idx
      }
    }
  }
)

onMounted(() => {
  startAutoPlay()
})

onBeforeUnmount(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.flow-card-container {
  border-radius: 12px;
  padding: 10px;
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.carousel-stage-area {
  position: relative;
  padding: 10px 8px;
  height: 250px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  user-select: none;
}

.perspective-wrapper {
  width: 100%;
  position: relative;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
}

.stage-card {
  position: absolute;
  width: 170px;
  cursor: pointer;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.stage-card.center-card {
  background: linear-gradient(to bottom, #ffffff, rgba(204, 251, 241, 0.5), rgba(209, 250, 229, 0.4));
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 2px solid rgba(0, 112, 107, 0.5);
}

.stage-card-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.025em;
  margin-top: 2px;
}

.metrics-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  align-items: center;
  width: 100%;
}

.metric-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.metric-label:hover {
  color: #00706b;
}

/* Dots */
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-remind {
  background-color: #fafd0c;
  box-shadow: 0 0 4px #fafd0c;
}

.dot-alert {
  background-color: #fc9907;
  box-shadow: 0 0 4px #fc9907;
}

.dot-warning {
  background-color: #db2f2b;
  box-shadow: 0 0 4px #db2f2b;
}

.metric-value {
  font-weight: 800;
  color: #000000;
  font-family: monospace;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.metric-value:hover {
  color: #00706b;
}
</style>
