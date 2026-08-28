<script setup lang="ts">
import { computed } from 'vue'
import type { Stage } from './data/progress-data'
import StageCard from './StageCard.vue'

const props = defineProps<{ stages: Stage[] }>()

const activeIndex = computed(() => {
  for (let i = props.stages.length - 1; i >= 0; i--) {
    const v = props.stages[i].fields[0]?.value
    // v !== undefined && v !== null && String(v).trim() !== '' &&
    if (v !== '-') {
      return i
    }
  }
  return -1
})
</script>

<template>
  <div class="timeline-scroll">
    <div class="timeline-grid">
      <div v-for="(stage, index) in stages" :key="stage.title" class="timeline-col" :class="{ 'timeline-col--inactive': index > activeIndex }">
        <!-- 上方卡片槽位 -->
        <div class="timeline-col__slot timeline-col__slot--top">
          <StageCard v-if="index % 2 === 0" :stage="stage" :inactive="index > activeIndex" />
        </div>

        <!-- 节点行（含连接线） -->
        <div class="timeline-col__node-row">
          <div class="timeline-col__line" />
          <div v-if="index === stages.length - 1" class="timeline-col__arrow" />
          <div class="timeline-col__node" />
        </div>

        <!-- 下方卡片槽位 -->
        <div class="timeline-col__slot timeline-col__slot--bottom">
          <StageCard v-if="index % 2 !== 0" :stage="stage" :inactive="index > activeIndex" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-scroll {
  overflow-x: auto;
  padding-bottom: 16px;
}

.timeline-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  column-gap: 16px;
  max-width: 1800px;
  margin: 0 auto;
}

.timeline-col {
  display: grid;
  grid-template-rows: minmax(200px, 1fr) auto minmax(200px, 1fr);
}

.timeline-col__slot {
  display: flex;
  justify-content: center;
}

.timeline-col__slot--top {
  align-items: flex-end;
  padding-bottom: 16px;
}

.timeline-col__slot--bottom {
  align-items: flex-start;
  padding-top: 16px;
}

.timeline-col__node-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
}

.timeline-col__line {
  position: absolute;
  left: -8px;
  right: -8px;
  top: 50%;
  height: 4px;
  transform: translateY(-50%);
  background-color: #00706b;
  overflow: hidden;
}

.timeline-col__line::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent);
  animation: timeline-flow 2s linear infinite;
}

@keyframes timeline-flow {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
}

.timeline-col__arrow {
  position: absolute;
  right: -14px;
  top: 50%;
  width: 0;
  height: 0;
  transform: translateY(-50%);
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 16px solid #00706b;
}

.timeline-col__node {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #00706b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  outline: 2px solid #fff;
}

.timeline-col__node::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6);
  animation: timeline-pulse 2s ease-out infinite;
}

@keyframes timeline-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6);
  }
  100% {
    box-shadow: 0 0 0 12px rgba(255, 255, 255, 0);
  }
}

.timeline-col--inactive .timeline-col__line {
  background-color: #c4c4c4;
}

.timeline-col--inactive .timeline-col__line::before {
  display: none;
}

.timeline-col--inactive .timeline-col__arrow {
  border-left-color: #c4c4c4;
}

.timeline-col--inactive .timeline-col__node {
  background-color: #c4c4c4;
}

.timeline-col--inactive .timeline-col__node::after {
  display: none;
}
</style>
