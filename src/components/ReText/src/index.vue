<template>
  <el-tooltip :content="resolvedTooltipContent" placement="top" effect="light" :disabled="tooltipDisabled" popper-class="re-text-tooltip">
    <div
      ref="textRef"
      class="re-text"
      :style="textStyle"
      :tabindex="isEllipsis ? 0 : undefined"
      v-bind="$attrs"
      @mouseenter="checkEllipsis"
      @focus="checkEllipsis"
    >
      <slot />
    </div>
  </el-tooltip>
</template>

<script setup lang="ts" name="ReText">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMutationObserver, useResizeObserver } from '@vueuse/core'

const props = defineProps({
  tooltipContent: {
    type: String,
    default: ''
  },
  lineClamp: {
    type: Number,
    default: 1,
    validator: (val: number) => val >= 1
  },
  preserveWhitespace: {
    type: Boolean,
    default: false
  }
})

const textRef = ref<HTMLElement>()
const isEllipsis = ref<boolean>(false)
const isMounted = ref<boolean>(false)
const measuredTooltipContent = ref('')
let firstAnimationFrame = 0
let secondAnimationFrame = 0

const resolvedTooltipContent = computed(() => props.tooltipContent || measuredTooltipContent.value)
const tooltipDisabled = computed(() => !isMounted.value || !isEllipsis.value || !resolvedTooltipContent.value)

onMounted(() => {
  isMounted.value = true
  scheduleCheckEllipsis()
  document.fonts?.ready.then(scheduleCheckEllipsis)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(firstAnimationFrame)
  cancelAnimationFrame(secondAnimationFrame)
})

useResizeObserver(textRef, () => {
  scheduleCheckEllipsis()
})

useMutationObserver(
  textRef,
  () => {
    scheduleCheckEllipsis()
  },
  {
    childList: true,
    characterData: true,
    subtree: true
  }
)

watch(
  () => props.lineClamp,
  () => {
    scheduleCheckEllipsis()
  }
)

const isTextEllipsis = (el: HTMLElement) => {
  if (!el) return false
  if (props.lineClamp === 1) {
    return el.scrollWidth - el.clientWidth > 1
  } else {
    return el.scrollHeight - el.clientHeight > 1
  }
}

const checkEllipsis = () => {
  if (textRef.value) {
    measuredTooltipContent.value = textRef.value.textContent || ''
    isEllipsis.value = isTextEllipsis(textRef.value)
  }
}

const scheduleCheckEllipsis = () => {
  cancelAnimationFrame(firstAnimationFrame)
  cancelAnimationFrame(secondAnimationFrame)
  nextTick(() => {
    firstAnimationFrame = requestAnimationFrame(() => {
      checkEllipsis()
      secondAnimationFrame = requestAnimationFrame(checkEllipsis)
    })
  })
}

const textStyle = computed(() => {
  const style: any = {
    whiteSpace: props.preserveWhitespace ? 'pre' : props.lineClamp > 1 ? 'normal' : 'nowrap'
  }
  if (props.lineClamp > 1) {
    style.display = '-webkit-box'
    style.WebkitBoxOrient = 'vertical'
    style.WebkitLineClamp = String(props.lineClamp)
  }
  return style
})
</script>

<style scoped>
.re-text {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.re-text:focus-visible {
  outline: 2px solid var(--color-primary, #00706b);
  outline-offset: 2px;
}
</style>

<style>
/* 与智能评审页青绿体系一致：白底、青描边、限定宽度自动换行 */
.re-text-tooltip.el-popper,
.re-text-tooltip {
  max-width: min(360px, 42vw) !important;
  padding: 10px 12px !important;
  color: #475569 !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.55 !important;
  word-break: break-word !important;
  white-space: pre-wrap !important;
  background: #f7fdfd !important;
  border: 1px solid #b8ddd9 !important;
  border-radius: 6px !important;
  box-shadow:
    0 8px 20px rgba(0, 112, 107, 0.12),
    0 2px 6px rgba(0, 112, 107, 0.06) !important;
}

.re-text-tooltip .el-popper__arrow::before,
.re-text-tooltip.el-popper.is-light .el-popper__arrow::before,
.re-text-tooltip.el-popper.is-dark .el-popper__arrow::before {
  background: #f7fdfd !important;
  border: 1px solid #b8ddd9 !important;
}

.re-text-tooltip .el-tooltip__content,
.re-text-tooltip .el-popper__content {
  max-width: 100%;
  padding: 0;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  word-break: inherit;
  white-space: inherit;
  background: transparent;
  border: 0;
  box-shadow: none;
}
</style>
