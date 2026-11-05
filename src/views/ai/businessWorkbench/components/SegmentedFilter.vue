<template>
  <div class="tw-flex tw-items-center tw-gap-1 tw-bg-slate-100/80 tw-p-1 tw-rounded-full tw-shrink-0 tw-overflow-x-auto scrollbar-none">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="tw-px-3.5 tw-py-1.5 tw-text-sm tw-font-bold tw-rounded-full tw-transition-all tw-shrink-0"
      :class="
        modelValue === option.value
          ? 'tw-bg-white tw-text-sggreen-600 tw-shadow-sm'
          : 'tw-text-slate-500 hover:tw-text-slate-800 hover:tw-bg-white/40'
      "
      :disabled="disabled"
      @click="handleChange(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { FilterOption, LevelFilter, StatusFilter } from '../types'

type SegmentedFilterValue = LevelFilter | StatusFilter

interface Props {
  modelValue: SegmentedFilterValue
  options: FilterOption<SegmentedFilterValue>[]
  disabled?: boolean
}

defineProps<Props>()
const emit = defineEmits(['change'])

const handleChange = (value: SegmentedFilterValue) => {
  emit('change', value)
}
</script>
