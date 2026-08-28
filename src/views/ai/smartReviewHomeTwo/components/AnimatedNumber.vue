<template>
  <span class="srh2-count-up" :class="{ 'is-counting': isAnimating }" :aria-label="finalText">
    <span aria-hidden="true">{{ displayText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type NumericValue = number | string | null | undefined

const props = withDefaults(
  defineProps<{
    value: NumericValue
    duration?: number
    delay?: number
    precision?: number
    useGrouping?: boolean
  }>(),
  {
    duration: 760,
    delay: 0,
    precision: undefined,
    useGrouping: true
  }
)

const toFiniteNumber = (value: NumericValue) => {
  const normalized = String(value ?? 0)
    .replace(/,/g, '')
    .trim()
  const parsed = Number(normalized.match(/-?\d+(?:\.\d+)?/)?.[0] || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const inferPrecision = (value: NumericValue) => {
  const normalized = String(value ?? '')
    .replace(/,/g, '')
    .trim()
  const decimals = normalized.match(/\.(\d+)/)?.[1]
  return decimals?.length || 0
}

const prefersReducedMotion = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const easeOutQuint = (progress: number) => 1 - Math.pow(1 - progress, 5)
const targetValue = computed(() => toFiniteNumber(props.value))
const decimalPlaces = computed(() => props.precision ?? inferPrecision(props.value))
const displayValue = ref(0)
const isAnimating = ref(false)

let animationFrame = 0
let settleTimer: ReturnType<typeof setTimeout> | null = null
let hasMounted = false

const formatValue = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    useGrouping: props.useGrouping,
    minimumFractionDigits: decimalPlaces.value,
    maximumFractionDigits: decimalPlaces.value
  }).format(value)

const displayText = computed(() => formatValue(displayValue.value))
const finalText = computed(() => formatValue(targetValue.value))

const stopAnimation = () => {
  cancelAnimationFrame(animationFrame)
  animationFrame = 0
  if (settleTimer) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
}

const animateTo = (target: number, delay = 0) => {
  stopAnimation()

  const start = hasMounted ? displayValue.value : 0
  const duration = Math.max(0, props.duration)
  if (prefersReducedMotion() || duration === 0 || start === target) {
    displayValue.value = target
    isAnimating.value = false
    return
  }

  const startAt = performance.now() + Math.max(0, delay)
  isAnimating.value = true

  const frame = (now: number) => {
    if (now < startAt) {
      animationFrame = requestAnimationFrame(frame)
      return
    }

    const progress = Math.min(1, (now - startAt) / duration)
    displayValue.value = start + (target - start) * easeOutQuint(progress)

    if (progress < 1) {
      animationFrame = requestAnimationFrame(frame)
      return
    }

    displayValue.value = target
    settleTimer = setTimeout(() => {
      isAnimating.value = false
      settleTimer = null
    }, 140)
  }

  animationFrame = requestAnimationFrame(frame)
}

onMounted(() => {
  animateTo(targetValue.value, props.delay)
  hasMounted = true
})

watch(targetValue, (target) => animateTo(target))

onBeforeUnmount(stopAnimation)
</script>

<style scoped>
.srh2-count-up {
  display: inline-block;
  color: inherit;
  font-variant-numeric: tabular-nums lining-nums;
  transition: color 180ms ease-out;
}

.srh2-count-up.is-counting {
  color: #00706b;
}
</style>
