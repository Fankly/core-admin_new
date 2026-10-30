<template>
  <span class="overview-value" :style="valueStyle">
    <strong>{{ value }}</strong
    ><span v-if="unit" class="value-unit">{{ unit }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { estimateTextEm } from '../data/format'

const props = withDefaults(defineProps<{ value: string; unit: string; align?: 'start' | 'center' | 'end' }>(), { align: 'start' })
// 数值与单位的字宽估算交给 CSS 换算字号：完整值放不下时整体缩小，不再省略。
const valueStyle = computed<CSSProperties & Record<'--value-em' | '--unit-em', number>>(() => ({
  '--value-em': estimateTextEm(props.value),
  '--unit-em': props.unit ? estimateTextEm(props.unit) : 0,
  justifyContent: props.align
}))
</script>

<style scoped lang="less">
// 期望字号由调用方通过 --value-size / --unit-size 指定（相对汇总区基准字号的 em）；
// 自身作为宽度容器，按「可用宽度 − 单位宽度」÷「数值字宽」取较小值，宽度不足时等比缩小，始终完整显示。
.overview-value {
  --value-size: 1em;
  --unit-size: 0.86em;
  --unit-gap: 0.3em;
  container-type: inline-size;
  display: flex;
  align-items: baseline;
  gap: var(--unit-gap);
  width: 100%;
  min-width: 0;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
// Less 会在编译期计算 min / max 与括号内运算，含 var() 时报错，这里原样输出给浏览器计算。
.overview-value strong {
  flex-shrink: 0;
  // 8px 只是防止算出 0 或负值的兜底；正常数据在最窄工作区也在 10px 以上。
  font-size: ~'max(8px, min(var(--value-size), (100cqi - var(--unit-gap) - var(--unit-size) * var(--unit-em)) / (var(--value-em) * 1.05)))';
  font-family: 'Arial', 'Helvetica Neue', 'Overview Noto Sans SC', sans-serif;
  font-weight: 700;
}
.value-unit {
  flex-shrink: 0;
  color: var(--value-unit-color, inherit);
  font-size: var(--unit-size);
  font-weight: 400;
}
</style>
