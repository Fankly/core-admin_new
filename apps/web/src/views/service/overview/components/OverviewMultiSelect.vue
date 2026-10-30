<template>
  <div ref="rootRef" class="overview-multi-select" @focusout="handleFocusOut">
    <!-- 多选版组合框：外观与 OverviewSelect 一致，选项可连续勾选、面板不关闭；
         「全部」固定为首项，选中即清空，等价于不筛选。 -->
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
      :title="valueTitle"
      @click="toggle"
      @keydown="handleKeydown"
      @keyup.space.prevent
    >
      <span :id="labelId" class="filter-label">{{ label }}</span>
      <span :id="valueId" class="filter-value">{{ valueText }}</span>
      <span class="filter-arrow" aria-hidden="true"><ChevronDown :size="14" :stroke-width="2.2" /></span>
    </button>
    <Transition name="filter-menu">
      <ul
        v-if="open"
        :id="listId"
        ref="listRef"
        class="filter-menu"
        role="listbox"
        aria-multiselectable="true"
        :aria-labelledby="labelId"
        @mousedown.prevent
      >
        <li
          v-for="(item, index) in menuOptions"
          :id="optionId(index)"
          :key="item.value"
          class="filter-option"
          :class="{ 'is-selected': isSelected(item.value), 'is-active': index === activeIndex }"
          role="option"
          :aria-selected="isSelected(item.value)"
          :title="item.label"
          @mousemove="activeIndex = index"
          @click="choose(index)"
        >
          <span class="filter-option-text">{{ item.label }}</span>
          <Check v-if="isSelected(item.value)" :size="14" :stroke-width="2.4" class="filter-option-check" aria-hidden="true" />
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script lang="ts">
// 每个实例的 listbox / option id 需要全页唯一，供 aria-controls 与 aria-activedescendant 引用。
let multiSelectSeed = 0
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import type { OverviewSelectOption } from '../types'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    label: string
    options: OverviewSelectOption[]
    disabled?: boolean
    /** 已设置非默认值：胶囊改为浅青底，提示条件已生效。 */
    applied?: boolean
  }>(),
  { disabled: false, applied: false }
)
const emit = defineEmits<{ (event: 'update:modelValue', value: string[]): void }>()

const uid = `overview-multi-select-${++multiSelectSeed}`
const labelId = `${uid}-label`
const valueId = `${uid}-value`
const listId = `${uid}-list`
const optionId = (index: number) => `${uid}-option-${index}`

// 首项「全部」的 value 用空字符串表示不筛选；单位 / 专业编码不会为空。
const ALL_VALUE = ''
const menuOptions = computed<OverviewSelectOption[]>(() => [{ value: ALL_VALUE, label: '全部' }, ...props.options])
const isSelected = (value: string) => (value === ALL_VALUE ? !props.modelValue.length : props.modelValue.includes(value))

const selectedLabels = computed(() => props.modelValue.map((value) => props.options.find((option) => option.value === value)?.label ?? value))
// 多个已选值时胶囊只显示数量，避免长单位名把整行条件挤换行；完整名称放在悬停提示里。
const valueText = computed(() => {
  if (!props.modelValue.length) return '全部'
  if (selectedLabels.value.length === 1) return selectedLabels.value[0]
  return `已选 ${selectedLabels.value.length} 项`
})
const valueTitle = computed(() => (props.modelValue.length ? selectedLabels.value.join('、') : '全部'))

const rootRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const open = ref(false)
const activeIndex = ref(-1)

const scrollActiveIntoView = () => {
  nextTick(() => {
    if (activeIndex.value < 0) return
    listRef.value?.querySelector<HTMLElement>(`#${optionId(activeIndex.value)}`)?.scrollIntoView({ block: 'nearest' })
  })
}

// 打开时定位到第一个已选项；没有选中则停在「全部」。
const firstSelectedIndex = () => {
  const index = menuOptions.value.findIndex((item) => item.value !== ALL_VALUE && props.modelValue.includes(item.value))
  return index >= 0 ? index : 0
}

const openMenu = (index = firstSelectedIndex()) => {
  if (props.disabled || !props.options.length) return
  open.value = true
  activeIndex.value = Math.min(Math.max(index, 0), menuOptions.value.length - 1)
  scrollActiveIntoView()
}

const closeMenu = () => {
  open.value = false
  activeIndex.value = -1
}

const toggle = () => (open.value ? closeMenu() : openMenu())

// 多选：点「全部」清空，点其它项在已选集合里增删；面板保持展开，便于连续勾选。
const choose = (index: number) => {
  const item = menuOptions.value[index]
  if (!item) return
  if (item.value === ALL_VALUE) {
    if (props.modelValue.length) emit('update:modelValue', [])
    return
  }
  const next = props.modelValue.includes(item.value) ? props.modelValue.filter((value) => value !== item.value) : [...props.modelValue, item.value]
  emit('update:modelValue', next)
}

const moveActive = (index: number) => {
  activeIndex.value = Math.min(Math.max(index, 0), menuOptions.value.length - 1)
  scrollActiveIntoView()
}

// 键位与单选的组合框一致，区别只是 Enter / 空格勾选后不收起面板。
const handleKeydown = (event: KeyboardEvent) => {
  const lastIndex = menuOptions.value.length - 1
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
      moveActive(activeIndex.value - 1)
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

.overview-multi-select {
  position: relative;
  display: inline-flex;
  flex: none;
}
</style>
