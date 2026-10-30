<template>
  <div ref="rootRef" class="overview-select" @focusout="handleFocusOut">
    <!-- 原生 select 的下拉列表由系统绘制、无法定制样式，这里按 WAI-ARIA「仅选择型组合框」自绘：
         焦点始终留在触发按钮上，通过 aria-activedescendant 指向键盘当前项。 -->
    <button
      type="button"
      role="combobox"
      class="filter-field"
      :class="{ 'is-open': open, 'is-applied': applied, 'is-disabled': disabled }"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="open ? listId : undefined"
      :aria-activedescendant="open && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      :aria-labelledby="`${labelId} ${valueId}`"
      @click="toggle"
      @keydown="handleKeydown"
      @keyup.space.prevent
    >
      <span :id="labelId" class="filter-label">{{ label }}</span>
      <span :id="valueId" class="filter-value">{{ selectedOption ? selectedOption.label : placeholder }}</span>
      <span class="filter-arrow" aria-hidden="true"><ChevronDown :size="14" :stroke-width="2.2" /></span>
    </button>
    <Transition name="filter-menu">
      <ul v-if="open" :id="listId" ref="listRef" class="filter-menu" role="listbox" :aria-labelledby="labelId" @mousedown.prevent>
        <li
          v-for="(option, index) in options"
          :id="optionId(index)"
          :key="option.value"
          class="filter-option"
          :class="{ 'is-selected': option.value === modelValue, 'is-active': index === activeIndex }"
          role="option"
          :aria-selected="option.value === modelValue"
          :title="option.label"
          @mousemove="activeIndex = index"
          @click="choose(index)"
        >
          <span class="filter-option-text">{{ option.label }}</span>
          <Check v-if="option.value === modelValue" :size="14" :stroke-width="2.4" class="filter-option-check" aria-hidden="true" />
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script lang="ts">
// 每个实例的 listbox / option id 需要全页唯一，供 aria-controls 与 aria-activedescendant 引用。
let selectSeed = 0
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import type { OverviewSelectOption } from '../types'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    options: OverviewSelectOption[]
    disabled?: boolean
    /** 当前值不在选项中（如年度接口未返回）时的占位文字。 */
    placeholder?: string
    /** 已设置非默认值：胶囊改为浅青底，提示条件已生效。 */
    applied?: boolean
  }>(),
  { disabled: false, placeholder: '--', applied: false }
)
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>()

const uid = `overview-select-${++selectSeed}`
const labelId = `${uid}-label`
const valueId = `${uid}-value`
const listId = `${uid}-list`
const optionId = (index: number) => `${uid}-option-${index}`

const rootRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)
const selectedIndex = computed(() => props.options.findIndex((option) => option.value === props.modelValue))
const selectedOption = computed(() => props.options[selectedIndex.value])

const scrollActiveIntoView = () => {
  nextTick(() => {
    if (activeIndex.value < 0) return
    listRef.value?.querySelector<HTMLElement>(`#${optionId(activeIndex.value)}`)?.scrollIntoView({ block: 'nearest' })
  })
}

const openMenu = (index = selectedIndex.value) => {
  if (props.disabled || !props.options.length) return
  open.value = true
  activeIndex.value = Math.min(Math.max(index, 0), props.options.length - 1)
  scrollActiveIntoView()
}

const closeMenu = () => {
  open.value = false
  activeIndex.value = -1
}

const toggle = () => (open.value ? closeMenu() : openMenu())

const choose = (index: number) => {
  const option = props.options[index]
  if (option && option.value !== props.modelValue) emit('update:modelValue', option.value)
  closeMenu()
}

const moveActive = (index: number) => {
  activeIndex.value = Math.min(Math.max(index, 0), props.options.length - 1)
  scrollActiveIntoView()
}

// 键位参照 WAI-ARIA 组合框：收起时上下键 / Enter / 空格展开；展开后上下键移动、Home / End 跳首尾、Enter / 空格选中，
// Esc 收起（阻止冒泡，避免同时触发筛选栏「Esc 收起更多筛选」），Tab 收起并照常移走焦点。
const handleKeydown = (event: KeyboardEvent) => {
  const lastIndex = props.options.length - 1
  if (!open.value) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      openMenu()
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      openMenu(event.key === 'Home' ? 0 : lastIndex)
    }
    return
  }
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveActive(activeIndex.value + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (event.altKey) choose(activeIndex.value)
      else moveActive(activeIndex.value - 1)
      break
    case 'Home':
    case 'PageUp':
      event.preventDefault()
      moveActive(0)
      break
    case 'End':
    case 'PageDown':
      event.preventDefault()
      moveActive(lastIndex)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      choose(activeIndex.value)
      break
    case 'Escape':
      event.preventDefault()
      event.stopPropagation()
      closeMenu()
      break
    case 'Tab':
      closeMenu()
      break
  }
}

const handleFocusOut = (event: FocusEvent) => {
  if (open.value && !rootRef.value?.contains(event.relatedTarget as Node | null)) closeMenu()
}

// Safari 点击按钮不会聚焦，单靠 focusout 收不起来；展开期间额外监听页面按下，点到组件外即收起。
const handlePointerDown = (event: PointerEvent) => {
  if (!rootRef.value?.contains(event.target as Node)) closeMenu()
}
watch(open, (value) => {
  if (value) document.addEventListener('pointerdown', handlePointerDown, true)
  else document.removeEventListener('pointerdown', handlePointerDown, true)
})
watch(
  () => props.disabled,
  (value) => value && closeMenu()
)
onBeforeUnmount(() => document.removeEventListener('pointerdown', handlePointerDown, true))
</script>

<style scoped lang="less">
@import '../styles/filter-field.less';

.overview-select {
  position: relative;
  display: inline-flex;
  flex: none;
}
</style>
