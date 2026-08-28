<template>
  <div class="progress-flow-section">
    <!-- Header -->
    <div class="flow-header">
      <div class="search_style">
        <h2 class="flow-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sparkle-icon">
            <path
              d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
            ></path>
            <path d="M5 3v4"></path>
            <path d="M19 17v4"></path>
            <path d="M3 5h4"></path>
            <path d="M17 19h4"></path>
          </svg>
          项目执行进度
        </h2>
        <span class="total-badge">
          项目总数: <strong>{{ totalCurrentCount.toLocaleString() }}</strong>
        </span>
      </div>
      <div>
        <div class="search_style">
          <!-- 项目类型 -->
          <div class="filter-item1">
            <span class="filter-label1">项目类型:</span>
            <ElTreeSelect
              v-model="filtersPro.projectTypeList"
              clearable
              :data="PROJECT_TYPES"
              :props="projectTypeProps"
              :multiple="true"
              :show-checkbox="true"
              :collapse-tags="true"
              :check-on-click-node="false"
              node-key="middleId"
              placeholder="请选择"
              @visible-change="handleFilterBlur"
              @clear="handleFilterClear"
            />
          </div>
          <!-- 实施部门 -->
          <div class="filter-item1">
            <span class="filter-label1">实施部门:</span>
            <ElTreeSelect
              v-model="filtersPro.ssbmList"
              clearable
              :data="IMPLEMENTATION_DEPTS"
              :props="cbzxProps"
              :multiple="true"
              :show-checkbox="true"
              :collapse-tags="true"
              :check-on-click-node="false"
              node-key="objCode"
              placeholder="请选择"
              @visible-change="handleFilterBlur"
              @clear="handleFilterClear"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Stacked Bar Chart -->
    <div class="stacked-bar-wrapper">
      <div class="stacked-bar-track">
        <div
          v-for="(stage, index) in STAGES_DATA"
          :key="'bar-' + stage.key"
          @click="handleCardClick(index, stage.key)"
          :class="['bar-segment', { active: index === activeIndex }]"
          :style="{
            width: (stage.currentCount / totalCurrentCount) * 100 + '%',
            background: `linear-gradient(to right, ${stage.color}, ${stage.color}80)`
          }"
        >
          <span v-if="index === activeIndex" class="bar-pct-label"> {{ ((stage.currentCount / totalCurrentCount || 0) * 100).toFixed(1) }}% </span>
        </div>
      </div>

      <!-- Legend -->
      <div class="legend-list">
        <div
          v-for="(stage, index) in STAGES_DATA"
          :key="'leg-' + stage.key"
          @click="handleCardClick(index, stage.key)"
          :class="['legend-item', { active: index === activeIndex }]"
        >
          <div class="legend-dot" :style="{ backgroundColor: stage.color }"></div>
          <span class="legend-title">{{ stage.title }}</span>
          <span :class="['legend-pct', { active: index === activeIndex }]">
            {{ ((stage.currentCount / totalCurrentCount || 0) * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- 3D Carousel Stage -->
    <div class="carousel-scene-container" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
      <div class="carousel-3d-stage">
        <div
          v-for="(stage, idx) in STAGES_DATA"
          :key="stage.key"
          @click="handleCardClick(idx, stage.key)"
          class="stage-arrow-card"
          :style="getCardStyle(idx, stage)"
        >
          <div class="arrow-card-inner" :style="getCardInnerStyle(idx, stage)">
            <div class="card-title">{{ stage.title }}</div>
            <div class="card-subtitle">当前阶段项目数</div>
            <div class="card-count" @click.stop="handleViewInfo(stage.nowStatus)">{{ stage.currentCount.toLocaleString() }}</div>
            <div class="card-subtitle">{{ stage.title }}数量</div>
            <div class="card-count" @click.stop="handleViewInfo(stage.allStatus)">{{ stage.cumulativeCount.toLocaleString() }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, PropType } from 'vue'
import { StageInfo, StageKey } from '@/views/lyg/overviewMap/data/types'
import ElTreeSelect from '@/components/ElTreeSelect/index'

interface DataVo {
  activeStageKey: StageKey | null
  STAGES_DATA: any[]
  IMPLEMENTATION_DEPTS: any[]
  PROJECT_TYPES: any[]
}
interface FilterState {
  projectTypeList: string[]
  ssbmList: string[]
}

const props = defineProps<DataVo>()
const emit = defineEmits(['selectStage', 'selectCard', 'filterChange'])
const filtersPro = ref<FilterState>({
  projectTypeList: [],
  ssbmList: []
})

const activeIndex = ref(0)
const isPlaying = ref(true)
const isHovered = ref(false)
const projectTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

// 成本中心树形结构props
const cbzxProps = {
  children: 'children',
  label: 'text'
}

const totalCurrentCount = computed(() => props.STAGES_DATA.reduce((acc, curr) => acc + curr.currentCount, 0))

let timer: any = null

const startTimer = () => {
  stopTimer()
  timer = setInterval(() => {
    if (isPlaying.value && !isHovered.value) {
      activeIndex.value = (activeIndex.value + 1) % props.STAGES_DATA.length
    }
  }, 6000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(
  () => props.activeStageKey,
  (newVal) => {
    if (newVal) {
      const idx = props.STAGES_DATA.findIndex((s: any) => s.key === newVal)
      if (idx !== -1) {
        activeIndex.value = idx
      }
    }
  }
)

const handleCardClick = (idx: number, stageKey: StageKey) => {
  activeIndex.value = idx
  emit('selectStage', stageKey)
}

const handleViewInfo = (status: any) => {
  emit('selectCard', status)
}

const handleFilterBlur = (visible: boolean) => {
  if (!visible) {
    emit('filterChange', { ...filtersPro.value })
  }
}

const handleFilterClear = () => {
  emit('filterChange', { ...filtersPro.value })
}

const resetProjectType = () => {
  filtersPro.value.projectTypeList = []
}

defineExpose({ resetProjectType })

const getCardStyle = (idx: number, stage: StageInfo) => {
  let offset = idx - activeIndex.value
  if (offset > props.STAGES_DATA.length / 2) offset -= props.STAGES_DATA.length
  if (offset < -props.STAGES_DATA.length / 2) offset += props.STAGES_DATA.length

  const isCenter = offset === 0
  let transform = ''
  let opacity = 1
  let zIndex = 10

  if (isCenter) {
    transform = 'translateX(0px) translateZ(50px) scale(1.1)'
    opacity = 1
    zIndex = 40
  } else {
    const sideOffset = offset * 180
    transform = `translateX(${sideOffset}px) translateZ(0px) scale(0.9)`
    opacity = 0.8
    zIndex = 20 - Math.abs(offset)
  }

  return {
    transform,
    opacity,
    zIndex,
    clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)',
    backgroundColor: isCenter ? `${stage.color}80` : '#CBD5E1',
    transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
  }
}

const getCardInnerStyle = (idx: number, stage: StageInfo) => {
  let offset = idx - activeIndex.value
  if (offset > props.STAGES_DATA.length / 2) offset -= props.STAGES_DATA.length
  if (offset < -props.STAGES_DATA.length / 2) offset += props.STAGES_DATA.length
  const isCenter = offset === 0

  return {
    clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%, 15% 50%)',
    background: isCenter ? `linear-gradient(to bottom, ${stage.color}CC, ${stage.color}1A)` : '#FFFFFF'
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.progress-flow-section {
  padding: 0 20px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.flow-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flow-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  letter-spacing: 0.02em;
}

.sparkle-icon {
  width: 20px;
  height: 20px;
  color: #00706b;
}

.total-badge {
  font-size: 13px;
  color: #475569;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.total-badge strong {
  color: #00706b;
  font-weight: 800;
}

.stacked-bar-wrapper {
  margin-top: 10px;
  padding-bottom: 10px;
}

.stacked-bar-track {
  display: flex;
  width: 100%;
  height: 30px;
  background-color: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  position: relative;
}

.bar-segment {
  height: 100%;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.bar-segment:hover {
  filter: brightness(1.05);
}

.bar-segment.active {
  z-index: 30;
  filter: brightness(1.1);
  transform: scaleY(1.35);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.3);
  outline: 2px solid #fff;
  border-radius: 2px;
}

.bar-pct-label {
  font-size: 14px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  padding: 0 4px;
  user-select: none;
}

.legend-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: center;
  margin-top: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  color: #475569;
}

.legend-item:hover {
  color: #0f172a;
  background-color: #f8fafc;
}

.legend-item.active {
  background-color: #f0fdfa;
  border: 1px solid #5eead4;
  color: #00706b;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transform: scale(1.05);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-title {
  white-space: nowrap;
}

.legend-pct {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: #94a3b8;
}

.legend-pct.active {
  color: #00706b;
  font-weight: 800;
}

.carousel-scene-container {
  position: relative;
  padding: 8px;
  min-height: 270px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.carousel-3d-stage {
  width: 100%;
  height: 160px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1200px;
}

.stage-arrow-card {
  position: absolute;
  width: 200px;
  height: 150px;
  cursor: pointer;
  padding: 2px;
  box-sizing: border-box;
}

.arrow-card-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 4px;
  box-sizing: border-box;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.card-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.card-count {
  font-size: 18px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.search_style {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-item1 {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-item1:hover {
  border-color: #2dd4bf;
}

.filter-label1 {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
}
</style>
