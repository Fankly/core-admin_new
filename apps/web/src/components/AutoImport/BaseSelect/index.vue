<template>
  <el-select
    v-bind="$attrs"
    :model-value="currentValue"
    :disabled="$attrs.disabled || $attrs.readonly"
    @update:modelValue="handleModelChange"
    @change="handleChange"
  >
    <el-option
      v-for="item in _options"
      :key="defaultPropsName.keyFor ? item[defaultPropsName.keyFor] : item[defaultPropsName.value]"
      :label="item[defaultPropsName.label]"
      :value="item[defaultPropsName.value]"
      :disabled="item[defaultPropsName.disabled]"
    >
      <span>
        <span :title="item[defaultPropsName.label]">{{ item[defaultPropsName.label] }}</span>
      </span>
    </el-option>
  </el-select>
</template>

<script setup>
import { reactive, toRef, toRefs, computed, useAttrs } from 'vue'
defineOptions({
  name: 'base-select',
  inheritAttrs: false
})
const componentProps = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Array, Object],
    default: undefined
  },
  value: {
    type: [String, Number, Boolean, Array, Object],
    default: ''
  }
})
const emit = defineEmits(['update:modelValue', 'input', 'change'])
const attrs = useAttrs()
const componentData = reactive({
  width: 0,
  options: [],
  defaultProps: {
    label: 'label',
    value: 'value',
    disabled: 'disabled'
  }
})
const width = toRef(componentData, 'width')
const options = toRef(componentData, 'options')
const defaultProps = toRef(componentData, 'defaultProps')
function handleModelChange(value) {
  emit('update:modelValue', value)
  emit('input', value)
}
function handleChange(value) {
  emit('change', value)
}
const currentValue = computed(() => {
  return componentProps.modelValue !== undefined ? componentProps.modelValue : componentProps.value
})
const _options = computed(() => {
  return attrs.options || componentData.options
})
const defaultPropsName = computed(() => {
  return attrs.defaultProps || componentData.defaultProps
})
defineExpose({
  handleModelChange,
  handleChange,
  ...toRefs(componentData),
  currentValue,
  _options,
  defaultPropsName
})
</script>
<style lang="less">
.span-ellipsis {
  display: inline-block;
  // max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}
</style>
