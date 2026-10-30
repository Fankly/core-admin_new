<template>
  <div ref="loadingRef" class="overview-loading" :class="[`is-${variant}`, { 'is-paused': !visible || visibility !== 'visible' }]" role="status">
    <div v-if="variant === 'summary'" class="loading-cards" aria-hidden="true">
      <div v-for="index in 5" :key="index" class="loading-card">
        <span class="skeleton skeleton-icon"></span>
        <span class="skeleton skeleton-title"></span>
        <span class="skeleton skeleton-value"></span>
        <span class="skeleton skeleton-line"></span>
        <span class="skeleton skeleton-line"></span>
      </div>
    </div>
    <div v-else-if="variant === 'table'" class="loading-table" aria-hidden="true">
      <div v-for="row in 5" :key="row" class="loading-row">
        <span v-for="column in 6" :key="column" class="skeleton skeleton-line"></span>
      </div>
    </div>
    <div v-else class="loading-chart" aria-hidden="true">
      <span v-for="index in 8" :key="index" class="skeleton skeleton-bar"></span>
    </div>
    <p class="loading-label"><LoaderCircle :size="18" class="overview-spinner" aria-hidden="true" />{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useDocumentVisibility, useElementVisibility } from '@vueuse/core'
import { LoaderCircle } from '@lucide/vue'

defineProps<{ variant: 'summary' | 'chart' | 'table'; label: string }>()
const loadingRef = shallowRef<HTMLElement | null>(null)
const visible = useElementVisibility(loadingRef)
const visibility = useDocumentVisibility()
</script>

<style scoped lang="less">
.overview-loading {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
// 汇总骨架沿用汇总区的列宽（--summary-columns）与基准字号，占位尺寸随区域缩放，矮屏下也不溢出。
.loading-cards {
  display: grid;
  grid-template-columns: var(--summary-columns, minmax(0, 1fr) repeat(4, minmax(0, clamp(0px, 15.1cqi, 330px))));
  gap: var(--overview-gap);
  height: 100%;
}
.loading-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.9em;
  min-height: 0;
  padding: 1em;
  overflow: hidden;
  border: 1px solid var(--overview-border);
  border-radius: var(--overview-radius, 6px);
  background: #f8fcfb;
}
.loading-card .skeleton-icon {
  width: 2.7em;
  height: 2.7em;
}
.loading-card .skeleton-title {
  height: 1.1em;
}
.loading-card .skeleton-value {
  height: 2.1em;
}
.loading-card .skeleton-line {
  height: 0.8em;
}
.skeleton {
  display: block;
  border-radius: 6px;
  background: #dceeea;
  animation: overview-skeleton-pulse 1.6s ease-in-out infinite;
}
.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 6px;
}
.skeleton-title {
  width: 68%;
  height: 16px;
}
.skeleton-value {
  width: 80%;
  height: 30px;
}
.skeleton-line {
  width: 100%;
  height: 12px;
}
.loading-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 20px;
  height: calc(100% - 72px);
  min-height: 120px;
  margin: 24px 52px 48px;
  padding: 24px 20px 0;
  border-bottom: 1px solid var(--overview-border);
}
.skeleton-bar {
  width: 32px;
  height: 75%;
  min-height: 72px;
  border-radius: 6px 6px 0 0;
}
.loading-table {
  padding: 15px 18px;
}
.loading-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 24px;
  padding: 15px 12px;
  border-bottom: 1px solid var(--overview-border);
}
.loading-row:first-child {
  background: #e6f5f3;
}
.loading-label {
  position: absolute;
  inset: 50% auto auto 50%;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 16px;
  border: 1px solid var(--overview-border);
  border-radius: 6px;
  background: #fff;
  color: #00766e;
  font-size: 14px;
  white-space: nowrap;
  transform: translate(-50%, -50%);
}
.is-paused .skeleton,
.is-paused .overview-spinner {
  animation-play-state: paused;
}
@keyframes overview-skeleton-pulse {
  50% {
    opacity: 0.4;
  }
}
</style>
