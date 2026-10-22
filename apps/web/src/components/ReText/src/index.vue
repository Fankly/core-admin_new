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

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { useMutationObserver, useResizeObserver } from '@vueuse/core'

defineOptions({ name: 'ReText', inheritAttrs: false })

interface ReTextProps {
  tooltipContent?: string
  lineClamp?: number
  preserveWhitespace?: boolean
}
const props = withDefaults(defineProps<ReTextProps>(), { tooltipContent: '', lineClamp: 1, preserveWhitespace: false })
const lineClamp = computed(() => Math.max(1, Math.floor(props.lineClamp) || 1))

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
  const fonts = Reflect.get(document, 'fonts') as FontFaceSet | undefined
  if (fonts) void fonts.ready.then(scheduleCheckEllipsis)
})

onBeforeUnmount(() => {
  isMounted.value = false
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
  () => [props.lineClamp, props.preserveWhitespace],
  () => {
    scheduleCheckEllipsis()
  }
)

const isTextEllipsis = (el: HTMLElement) => {
  if (lineClamp.value === 1) {
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
  if (!isMounted.value) return
  void nextTick(() => {
    if (!isMounted.value) return
    firstAnimationFrame = requestAnimationFrame(() => {
      checkEllipsis()
      secondAnimationFrame = requestAnimationFrame(checkEllipsis)
    })
  })
}

const textStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    whiteSpace: props.preserveWhitespace ? 'pre' : lineClamp.value > 1 ? 'normal' : 'nowrap'
  }
  if (lineClamp.value > 1) {
    style.display = '-webkit-box'
    // 多行省略在当前浏览器仍需该属性，标准 line-clamp 尚未全面支持。
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    style.WebkitBoxOrient = 'vertical'
    style.WebkitLineClamp = String(lineClamp.value)
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
