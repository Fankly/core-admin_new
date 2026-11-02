<template>
  <el-form
    :class="{ filterConfigBox: true, 'filterConfigBox-style': type == 'card' }"
    ref="form"
    :model="formModel"
    :rules="_config.rules"
    :label-width="_config.labelWidth"
    :size="defaultFormItemSize"
    label-position="right"
    @submit.prevent
  >
    <filter-box @search="handleSearch(true)" @reset="onReset">
      <template v-for="(option, index) in options" :key="index">
        <el-col :span="option.span || config.span">
          <el-form-item :label="option.label" :prop="option.prop" :label-width="option.labelWidth || config.labelWidth" :clearable="option.clearable">
            <template v-if="option.labelPrompt" v-slot:label>
              <div class="label-with-tooltip">
                {{ option.label }}
                <el-tooltip v-if="option.labelPrompt" :content="option.labelPrompt" placement="top">
                  <el-icon class="ep-icon-info tooltip-icon"><EpInfoFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <ConfigItem
              customStyle="width: 100%;"
              :option="option"
              v-model="formModel[option.prop]"
              :disabled="disabled"
              :readonly="readonly || option.readonly"
            />
          </el-form-item>
        </el-col>
      </template>
    </filter-box>
    <template v-slot:operation>
      <slot name="operation"></slot>
    </template>
  </el-form>
</template>

<script setup>
import { InfoFilled as EpInfoFilled } from '@element-plus/icons-vue'
import ConfigItem from '../ConfigItem/index.vue'
import FilterBox from '../FilterBox/index.vue'
import _ from 'lodash'
import { reactive, toRef, toRefs, computed, useTemplateRef } from 'vue'
defineOptions({
  name: 'FilterConfigBox'
})
const componentProps = defineProps({
  type: {
    type: String,
    default: ''
  },
  config: {
    // 绑定值
    type: Object,
    default: () => ({
      labelWidth: '100px',
      span: 4
    })
  },
  options: {
    // 表单项
    type: Array,
    default: () => []
  },
  value: {
    // 绑定值
    type: Object,
    default: () => ({})
  },
  modelValue: {
    // Vue 3 v-model
    type: Object,
    default: undefined
  },
  readonly: Boolean,
  disabled: Boolean
})
const emit = defineEmits()
const formRef = useTemplateRef('form')
const componentData = reactive({
  defaultConfig: {
    labelWidth: '75px'
  },
  defaultValues: {}
})
const defaultConfig = toRef(componentData, 'defaultConfig')
const defaultValues = toRef(componentData, 'defaultValues')
function handleSearch() {
  emitModelChange(formModel.value)
  emit('search', formModel.value)
}
function onReset() {
  formRef.value.resetFields()
  const newObj = _.cloneDeep(componentData.defaultValues)
  emitModelChange(newObj)
  emit('onReset', newObj)
}
function emitModelChange(value) {
  emit('update:modelValue', value)
  emit('on-model-change', value)
}
const formModel = computed(() => {
  return componentProps.modelValue ?? componentProps.value
})
const _config = computed(() => {
  return {
    ...componentData.defaultConfig,
    ...componentProps.config
  }
})
;(() => {
  componentData.defaultValues = _.cloneDeep(formModel.value)
})()
defineExpose({
  EpInfoFilled,
  handleSearch,
  onReset,
  emitModelChange,
  ...toRefs(componentData),
  formModel,
  _config
})
</script>
<style lang="less" scoped>
.filterConfigBox {
  // border-radius: 5px;
  // overflow: hidden;
  margin-bottom: 16px;
  .flex-box {
    margin-bottom: 0;
  }
}
.label-with-tooltip {
  display: flex;
  align-items: center;
  display: inline-block;
}
.tooltip-icon {
  // margin-left: 5px;
  color: #909399;
  cursor: pointer;
}
.tooltip-icon:hover {
  color: @--color-primary;
}
</style>
