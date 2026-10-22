<template>
  <div
    :class="[
      'spinner-container',
      {
        'spinner-hidden': !showSpinner
      },
      className
    ]"
    aria-hidden="true"
    @transitionend="onTransitionEnd"
  >
    <div v-if="renderSpinner" class="spinner-wrapper">
      <div :class="{ 'spinner-paused': !showSpinner }" class="spinner-loader"></div>
      <div :class="{ 'spinner-paused': !showSpinner }" class="spinner-shadow"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

defineOptions({ name: 'AppSpinner' })
interface Props {
  className?: string
  minLoadingTime?: number
  spinning?: boolean
}
const props = withDefaults(defineProps<Props>(), { minLoadingTime: 50, spinning: false })
const showSpinner = ref(false)
const renderSpinner = ref(false)
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined
const clearTimers = () => {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
}
watch(
  () => props.spinning,
  (show) => {
    clearTimers()
    if (!show) {
      showSpinner.value = false
      // reduced-motion、隐藏祖先等情况下不会发出 transitionend，兜底销毁动画。
      hideTimer = setTimeout(() => {
        renderSpinner.value = false
      }, 500)
      return
    }
    showTimer = setTimeout(
      () => {
        showSpinner.value = true
        renderSpinner.value = true
      },
      Math.max(0, props.minLoadingTime)
    )
  },
  { immediate: true }
)
onBeforeUnmount(clearTimers)
const onTransitionEnd = (event: TransitionEvent) => {
  if (event.target === event.currentTarget && !showSpinner.value) {
    renderSpinner.value = false
    clearTimeout(hideTimer)
  }
}
</script>

<style scoped>
.spinner-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  transition: all 0.5s ease;
}

.spinner-hidden {
  opacity: 0;
  visibility: hidden;
}

.spinner-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
}

.spinner-loader {
  position: absolute;
  width: 48px;
  height: 48px;
  background-color: var(--color-primary, #409eff);
  border-radius: 4px;
  animation: vben-loader-jump-ani 0.5s linear infinite;
}

.spinner-shadow {
  position: absolute;
  width: 40px;
  height: 6px;
  background: color-mix(in srgb, var(--color-primary, #409eff) 40%, transparent);
  border-radius: 50%;
  bottom: -15px;
  left: 50%;
  margin-left: -20px;
  animation: vben-loader-shadow-ani 0.5s linear infinite;
}

.spinner-paused {
  animation-play-state: paused;
}

@keyframes vben-loader-jump-ani {
  15% {
    border-bottom-right-radius: 3px;
  }
  25% {
    transform: translateY(9px) rotate(22.5deg);
  }
  50% {
    transform: translateY(18px) scale(1, 0.9) rotate(45deg);
    border-bottom-right-radius: 40px;
  }
  75% {
    transform: translateY(9px) rotate(67.5deg);
  }
  100% {
    transform: translateY(0) rotate(90deg);
  }
}

@keyframes vben-loader-shadow-ani {
  0%,
  100% {
    transform: scale(0.8, 1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.3, 1);
    opacity: 1;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .spinner-container {
    background-color: rgba(0, 0, 0, 0.8);
  }
}
</style>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .spinner-container {
    transition: none;
  }
  .spinner-loader,
  .spinner-shadow {
    animation: none;
  }
}
</style>
