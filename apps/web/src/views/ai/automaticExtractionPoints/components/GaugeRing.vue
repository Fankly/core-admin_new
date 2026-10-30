<template>
  <div class="aep-gauge">
    <svg width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="toneColor.from" />
          <stop offset="100%" :stop-color="toneColor.to" />
        </linearGradient>
      </defs>

      <!-- 轨道 -->
      <circle v-if="type === 'full'" cx="60" cy="60" :r="RADIUS" fill="none" :stroke="toneColor.track" stroke-width="10" />
      <path v-else :d="trackPath" fill="none" :stroke="toneColor.track" stroke-width="10" stroke-linecap="round" />

      <!-- 进度 -->
      <circle
        v-if="type === 'full'"
        cx="60"
        cy="60"
        :r="RADIUS"
        fill="none"
        :stroke="strokeUrl"
        stroke-width="10"
        stroke-linecap="round"
        transform="rotate(-90 60 60)"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
      />
      <path v-else :d="progressPath" fill="none" :stroke="strokeUrl" stroke-width="10" stroke-linecap="round" />

      <!-- 终点圆点 -->
      <circle class="aep-gauge__dot" :cx="dot.x" :cy="dot.y" r="5" :fill="toneColor.dot" stroke="#fff" stroke-width="2" />

      <!-- 中心文字 -->
      <text x="60" :y="type === 'full' ? 60 : 72" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="600" fill="#1e293b">
        {{ centerText }}
      </text>
      <text x="60" :y="type === 'full' ? 80 : 92" text-anchor="middle" font-size="12" fill="#94a3b8">{{ centerSub }}</text>
    </svg>
  </div>
</template>

<script lang="ts">
export default {
  name: 'AepGaugeRing'
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 环形图配色（最新设计稿的四张卡片：同色系青绿 / 湖水绿 / 湖蓝 / 草木绿）
 * track 为该卡片的轨道底色。
 */
const TONES = {
  teal: { from: '#35a98c', to: '#74cdb4', dot: '#35a98c', track: '#e6f5f1' },
  green: { from: '#2a9d8f', to: '#6ecfc4', dot: '#2a9d8f', track: '#e3f4f0' },
  blue: { from: '#2a8fb0', to: '#6cc2dd', dot: '#2a8fb0', track: '#e2f1f6' },
  orange: { from: '#3f9e6a', to: '#7fd0a0', dot: '#3f9e6a', track: '#e4f2ea' }
}

/** 半径与圆心（viewBox 120x120） */
const RADIUS = 50
const CX = 60
const CY = 60

const props = withDefaults(
  defineProps<{
    /** 比率（0-100） */
    rate: number
    /** full：整圆环形图；gauge：270° 仪表盘 */
    type?: 'full' | 'gauge'
    /** 中心主文字 */
    centerText?: string
    /** 中心说明文字 */
    centerSub?: string
    /** 配色（设计稿四色卡片） */
    tone?: keyof typeof TONES
  }>(),
  {
    type: 'full',
    centerText: '',
    centerSub: '',
    tone: 'teal'
  }
)

/** 当前配色 */
const toneColor = computed(() => TONES[props.tone] || TONES.teal)

/** 唯一渐变 id，避免同页多个 SVG 互相覆盖 */
const gradientId = computed(() => `aep-gauge-${props.tone}-${props.type}-${Math.round(props.rate * 100)}`)
const strokeUrl = computed(() => `url(#${gradientId.value})`)

/** 比率收敛到 0-100 */
const safeRate = computed(() => Math.max(0, Math.min(100, Number(props.rate) || 0)))

const circumference = 2 * Math.PI * RADIUS
const dashOffset = computed(() => circumference * (1 - safeRate.value / 100))

/** 极坐标取点 */
const pointAt = (deg: number): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180
  return { x: Number((CX + RADIUS * Math.cos(rad)).toFixed(2)), y: Number((CY + RADIUS * Math.sin(rad)).toFixed(2)) }
}

/** 仪表盘起始角度 135°，总扫过 270° */
const GAUGE_START = 135
const GAUGE_SWEEP = 270

const trackPath = computed(() => {
  const start = pointAt(GAUGE_START)
  const end = pointAt(GAUGE_START + GAUGE_SWEEP)
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 1 1 ${end.x} ${end.y}`
})

const progressPath = computed(() => {
  const sweep = (GAUGE_SWEEP * safeRate.value) / 100
  const start = pointAt(GAUGE_START)
  const end = pointAt(GAUGE_START + sweep)
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`
})

const dot = computed(() => {
  if (props.type === 'full') return pointAt(-90 + (360 * safeRate.value) / 100)
  return pointAt(GAUGE_START + (GAUGE_SWEEP * safeRate.value) / 100)
})
</script>
