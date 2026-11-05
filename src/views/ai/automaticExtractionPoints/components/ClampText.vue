<template>
  <span ref="elRef" class="aep-clamp" @mouseenter="handleEnter" @mouseleave="hide">
    {{ text }}
    <Teleport to="body">
      <div v-if="visible" class="aep-clamp-tip" :style="tipStyle">{{ text }}</div>
    </Teleport>
  </span>
</template>

<script lang="ts">
export default {
  name: 'AepClampText'
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  /** 单元格文本：最多展示两行，被截断时鼠标悬浮浮出完整内容 */
  text: string | number | null | undefined
}>()

const elRef = ref<HTMLElement>()
const visible = ref(false)
const tipStyle = ref<Record<string, string>>({})

/** 悬浮：只有内容被截断（超过行数 / 单行放不下）才浮出完整内容 */
const handleEnter = (): void => {
  const el = elRef.value
  if (!el || !props.text) return
  // 纵向（多行截断）或横向（单行省略）任一溢出即视为被截断
  const verticalOverflow = el.scrollHeight - el.clientHeight >= 4
  const horizontalOverflow = el.scrollWidth - el.clientWidth >= 4
  if (!verticalOverflow && !horizontalOverflow) return
  const rect = el.getBoundingClientRect()
  const left = Math.max(12, Math.min(rect.left, window.innerWidth - 440))
  // 靠近视口底部时向上翻转，避免浮层超出屏幕
  const flip = rect.bottom > window.innerHeight - 140
  tipStyle.value = flip
    ? { left: `${left}px`, top: `${rect.top - 6}px`, transform: 'translateY(-100%)' }
    : { left: `${left}px`, top: `${rect.bottom + 6}px` }
  visible.value = true
}

const hide = (): void => {
  visible.value = false
}

/** 列表滚动 / 视口变化时收起浮层，避免与单元格错位 */
watch(visible, (show) => {
  if (show) {
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide, true)
  } else {
    window.removeEventListener('scroll', hide, true)
    window.removeEventListener('resize', hide, true)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', hide, true)
  window.removeEventListener('resize', hide, true)
})
</script>
