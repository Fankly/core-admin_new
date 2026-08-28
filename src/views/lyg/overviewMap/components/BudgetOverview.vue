<template>
  <div class="budget-overview-card">
    <!-- Card Header -->
    <cardTitle :title="`单位预算执行概览`" />

    <!-- Metrics List -->
    <div class="metrics-list">
      <!-- 目标值 -->
      <div class="metric-row sky">
        <span class="metric-label">目标值</span>
        <div class="metric-value-wrap">
          <span class="metric-number">{{ metrics.mbz }} 万元</span>
          <div class="metric-icon-box sky-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
          </div>
        </div>
      </div>

      <!-- 完成值 -->
      <div class="metric-row emerald">
        <span class="metric-label">完成值</span>
        <div class="metric-value-wrap">
          <span class="metric-number emerald-text">{{ metrics.wcz }} 万元</span>
          <div class="metric-icon-box emerald-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <!-- 完成率 -->
      <div class="metric-row teal">
        <span class="metric-label">完成率</span>
        <div class="metric-value-wrap">
          <span class="metric-number teal-text highlight">{{ metrics.wcl }}%</span>
          <div class="metric-icon-box teal-icon-solid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg-white">
              <line x1="19" y1="5" x2="5" y2="19"></line>
              <circle cx="6.5" cy="6.5" r="2.5"></circle>
              <circle cx="17.5" cy="17.5" r="2.5"></circle>
            </svg>
          </div>
        </div>
      </div>

      <!-- 省平均完成率 -->
      <div class="metric-row blue">
        <span class="metric-label">省平均完成率</span>
        <div class="metric-value-wrap">
          <span class="metric-number blue-text">{{ metrics.sgspjwcl }}%</span>
          <div class="metric-icon-box blue-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <!-- 上年同期完成率 -->
      <div class="metric-row purple">
        <span class="metric-label">上年同期完成率</span>
        <div class="metric-value-wrap">
          <span class="metric-number purple-text">{{ metrics.sndtqwcl }}%</span>
          <div class="metric-icon-box purple-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
        </div>
      </div>

      <!-- 省上年同期完成率 -->
      <div class="metric-row indigo">
        <span class="metric-label">省上年同期完成率</span>
        <div class="metric-value-wrap">
          <span class="metric-number indigo-text">{{ metrics.sndtqsgspjwcl }}%</span>
          <div class="metric-icon-box indigo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- 地市公司排名 -->
      <div class="metric-row amber">
        <span class="metric-label">地市公司排名</span>
        <div class="metric-value-wrap">
          <span class="metric-number amber-text">第 {{ metrics.dspm }} 名</span>
          <div class="metric-icon-box amber-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7"></path>
              <path d="M14 14.66V17c0 .55.45 1 1 1h2"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
            </svg>
          </div>
        </div>
      </div>
      <!-- 较全省上年金额偏差 -->
      <div class="metric-row" :class="metrics.gsjlcmbz >= 0 ? 'emerald' : 'rose'">
        <span class="metric-label">较全省上年金额偏差</span>
        <div class="metric-value-wrap">
          <span class="metric-number" :class="metrics.gsjlcmbz >= 0 ? 'emerald-text' : 'rose-text'">{{ metrics.gsjlcmbz }} 万元</span>
          <div class="metric-icon-box" :class="metrics.gsjlcmbz >= 0 ? 'emerald-icon' : 'rose-icon'">
            <svg v-if="metrics.gsjlcmbz >= 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg">
              <line x1="5" y1="19" x2="19" y2="5"></line>
              <polyline points="9 5 19 5 19 15"></polyline>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="metric-svg">
              <line x1="5" y1="5" x2="19" y2="19"></line>
              <polyline points="9 19 19 19 19 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import cardTitle from '@/views/lyg/components/cardTitle.vue'
const props = defineProps<{ metrics: any }>()
</script>

<style scoped>
.budget-overview-card {
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}
.metrics-list {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  overflow: hidden;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.metric-row:hover {
  transform: translateY(-1px);
}

.metric-row.sky {
  background: rgba(240, 249, 255, 0.85);
  border-color: #e0f2fe;
}
.metric-row.sky:hover {
  border-color: #7dd3fc;
}
.metric-row.emerald {
  background: rgba(236, 253, 245, 0.85);
  border-color: #d1fae5;
}
.metric-row.emerald:hover {
  border-color: #6ee7b7;
}
.metric-row.teal {
  background: rgba(240, 253, 250, 0.85);
  border-color: #ccfbf1;
}
.metric-row.teal:hover {
  border-color: #5eead4;
}
.metric-row.blue {
  background: rgba(239, 246, 255, 0.85);
  border-color: #dbeafe;
}
.metric-row.blue:hover {
  border-color: #93c5fd;
}
.metric-row.amber {
  background: rgba(254, 252, 232, 0.85);
  border-color: #fef08a;
}
.metric-row.amber:hover {
  border-color: #fde047;
}
.metric-row.rose {
  background: rgba(255, 241, 242, 0.85);
  border-color: #ffe4e6;
}
.metric-row.rose:hover {
  border-color: #fda4af;
}
.metric-row.purple {
  background: rgba(250, 245, 255, 0.85);
  border-color: #f3e8ff;
}
.metric-row.purple:hover {
  border-color: #d8b4fe;
}
.metric-row.indigo {
  background: rgba(238, 242, 255, 0.85);
  border-color: #e0e7ff;
}
.metric-row.indigo:hover {
  border-color: #a5b4fc;
}

.metric-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.metric-value-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.metric-number {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.emerald-text {
  color: #047857;
}
.teal-text {
  color: #00706b;
}
.blue-text {
  color: #1d4ed8;
}
.amber-text {
  color: #b45309;
}
.rose-text {
  color: #be123c;
}
.purple-text {
  color: #7e22ce;
}
.indigo-text {
  color: #4338ca;
}

.metric-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sky-icon {
  background: #e0f2fe;
  color: #0284c7;
}
.emerald-icon {
  background: #d1fae5;
  color: #059669;
}
.teal-icon-solid {
  background: #00706b;
  color: #fff;
}
.blue-icon {
  background: #dbeafe;
  color: #2563eb;
}
.amber-icon {
  background: #fef08a;
  color: #d97706;
}
.rose-icon {
  background: #ffe4e6;
  color: #e11d48;
}
.purple-icon {
  background: #f3e8ff;
  color: #9333ea;
}
.indigo-icon {
  background: #e0e7ff;
  color: #4f46e5;
}

.metric-svg {
  width: 16px;
  height: 16px;
}

.metric-svg-white {
  width: 16px;
  height: 16px;
  color: #fff;
}
</style>
