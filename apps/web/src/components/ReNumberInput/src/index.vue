<template>
  <el-input
    v-model="displayValue"
    :class="['re-number-input', `is-align-${align}`]"
    :disabled="disabled"
    :placeholder="placeholder"
    :clearable="clearable"
    :size="size || undefined"
    @input="handleInput"
    @change="handleChange"
    @blur="handleBlur"
  />
</template>

<script setup lang="ts">
defineOptions({ name: "ReNumberInput" })
import Decimal from 'decimal.js'
import type { PropType } from 'vue'
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Number, String] as PropType<number | string | null>,
    default: null
  },
  // 允许的小数位数（限制小数长度，非最大值封顶）
  precision: {
    type: Number,
    default: 6
  },
  // 可选下限/上限，默认不限制（满足「不要最大值」的诉求）
  min: {
    type: Number,
    default: undefined
  },
  max: {
    type: Number,
    default: undefined
  },
  allowNegative: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: ''
  },
  clearable: {
    type: Boolean,
    default: false
  },
  align: {
    type: String as PropType<'left' | 'center' | 'right'>,
    default: 'right'
  },
  size: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'blur'])

const displayValue = ref('')

// 数字/字符串 → 定点字符串：绝不使用科学计数法，也不强制补零（1e32 → 完整数字，3.456 → 3.456）
const toDisplayString = (value: number | string | null): string => {
  if (value === null || value === undefined || value === '') return ''
  try {
    return new Decimal(value).toFixed()
  } catch {
    return ''
  }
}

// 显示串 → 对外模型值：空 / 半成品（"." "-" "-." 及结尾小数点）归一为可被 Decimal 接受的数字串或 null。
// 全程保持字符串、绝不经过 JS number，避免超过 15~16 位有效数字后末尾被抹成 0。
const toModel = (s: string): string | null => {
  if (s === '' || s === '.' || s === '-' || s === '-.') return null
  const cleaned = s.endsWith('.') ? s.slice(0, -1) : s
  if (cleaned === '' || cleaned === '-') return null
  return cleaned
}

watch(
  () => props.modelValue,
  (val) => {
    const incoming = toDisplayString(val)
    // 外部值与当前输入的规范形态一致时不回填，避免打断正在输入的 "0." / "12."
    if (incoming === toDisplayString(toModel(displayValue.value))) return
    displayValue.value = incoming
  },
  { immediate: true }
)

// 过滤非法字符：仅保留数字与单个小数点；整数位长度不设上限，仅按 precision 约束小数位数
const sanitize = (raw: string): string => {
  let s = String(raw ?? '')
  const negative = props.allowNegative && s.trim().startsWith('-')
  s = s.replace(/[^\d.]/g, '')

  const dot = s.indexOf('.')
  let intPart = dot === -1 ? s : s.slice(0, dot)
  let decPart = dot === -1 ? '' : s.slice(dot + 1).replace(/\./g, '')

  // 去掉多余前导零："007" → "7"，"0" 与 "0.5" 保持原样
  intPart = intPart.replace(/^0+(?=\d)/, '')

  // 仅约束小数位数，整数位不限长
  if (props.precision >= 0) decPart = decPart.slice(0, props.precision)

  let out = intPart
  // precision 为 0 时不保留小数点；否则保留用户刚敲下的 "."
  if (dot !== -1 && props.precision > 0) out += `.${decPart}`
  return negative ? `-${out}` : out
}

// 归一显示：用字符串构造 Decimal，避免先转 number 再格式化造成的精度丢失
const normalize = (s: string): string => {
  const model = toModel(s)
  if (model === null) return ''
  try {
    let d = new Decimal(model)
    if (props.min !== undefined && d.lessThan(props.min)) d = new Decimal(props.min)
    if (props.max !== undefined && d.greaterThan(props.max)) d = new Decimal(props.max)
    return d.toFixed()
  } catch {
    return ''
  }
}

const handleInput = (raw: string) => {
  const sanitized = sanitize(raw)
  if (sanitized !== displayValue.value) displayValue.value = sanitized
  emit('update:modelValue', toModel(sanitized))
}

// 失焦/回车时归一：截断到 min/max 范围、清理前导零与多余尾零，重排显示
const handleChange = () => {
  const normalized = normalize(displayValue.value)
  if (normalized !== displayValue.value) displayValue.value = normalized
  const value = normalized === '' ? null : normalized
  emit('update:modelValue', value)
  emit('change', value)
}

const handleBlur = (e: FocusEvent) => {
  emit('blur', e)
}
</script>

<style scoped lang="less">
.re-number-input {
  width: 100%;

  &.is-align-right :deep(.el-input__inner) {
    text-align: right;
  }

  &.is-align-center :deep(.el-input__inner) {
    text-align: center;
  }
}
</style>
