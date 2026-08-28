<template>
  <div
    :class="[
      'loading-container',
      {
        'loading-hidden': !showSpinner,
      },
      className
    ]"
    @transitionend="onTransitionEnd"
  >
    <div v-if="renderSpinner" class="loading-content">
      <slot name="icon">
        <div class="antd-spin">
          <div class="antd-spin-dot">
            <span class="antd-spin-dot-item"></span>
            <span class="antd-spin-dot-item"></span>
            <span class="antd-spin-dot-item"></span>
            <span class="antd-spin-dot-item"></span>
          </div>
        </div>
      </slot>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'AppLoading',
};
</script>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  className?: string;
  /** 最小加载时间 */
  minLoadingTime?: number;
  /** 加载状态 */
  spinning?: boolean;
  /** 加载文本 */
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  minLoadingTime: 50,
  spinning: false,
  text: '',
});

const showSpinner = ref(false);
const renderSpinner = ref(false);
const timer = ref<ReturnType<typeof setTimeout>>();

watch(
  () => props.spinning,
  (show) => {
    if (!show) {
      showSpinner.value = false;
      clearTimeout(timer.value);
      return;
    }

    timer.value = setTimeout(() => {
      showSpinner.value = true;
      if (showSpinner.value) {
        renderSpinner.value = true;
      }
    }, props.minLoadingTime);
  },
  {
    immediate: true,
  }
);

function onTransitionEnd() {
  if (!showSpinner.value) {
    renderSpinner.value = false;
  }
}
</script>

<style scoped>
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  transition: all 0.5s ease;
}

.loading-hidden {
  opacity: 0;
  visibility: hidden;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.antd-spin {
  position: relative;
  width: 20px;
  height: 20px;
  margin-bottom: 16px;
}

.antd-spin-dot {
  position: relative;
  width: 20px;
  height: 20px;
  animation: antd-spin-rotate 1.2s infinite linear;
}

.antd-spin-dot-item {
  position: absolute;
  width: 9px;
  height: 9px;
  background-color: var(--color-primary, #409eff);
  border-radius: 100%;
  animation: antd-spin-dot-spin 1s infinite ease-in-out;
  opacity: 0.3;
}

.antd-spin-dot-item:nth-child(1) {
  top: 0;
  left: 0;
  animation-delay: 0s;
}

.antd-spin-dot-item:nth-child(2) {
  top: 0;
  right: 0;
  animation-delay: 0.4s;
}

.antd-spin-dot-item:nth-child(3) {
  bottom: 0;
  right: 0;
  animation-delay: 0.8s;
}

.antd-spin-dot-item:nth-child(4) {
  bottom: 0;
  left: 0;
  animation-delay: 1.2s;
}

.loading-text {
  font-size: 14px;
  color: var(--color-primary, #409eff);
  margin-top: 12px;
  text-align: center;
  line-height: 1.5;
  font-weight: 500;
}

@keyframes antd-spin-rotate {
  to {
    transform: rotate(405deg);
  }
}

@keyframes antd-spin-dot-spin {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .loading-container {
    background-color: rgba(0, 0, 0, 0.9);
  }
  
}
</style>