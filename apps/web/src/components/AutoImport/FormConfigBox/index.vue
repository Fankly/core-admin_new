<template>
  <el-form
    :label-position="config.labelPosition || 'right'"
    class="FormConfigBox"
    ref="form"
    :model="formModel"
    :rules="_config.rules"
    :label-width="_config.labelWidth"
    :size="defaultFormItemSize"
    @submit.prevent
  >
    <el-row
      style="height: 100%; display: flex; flex-wrap: wrap"
      :type="config.justify ? 'flex' : ''"
      :justify="config.justify"
      :gutter="config.gutter || 20"
      :class="{ 'flex-warp': flexWarp }"
    >
      <template v-for="(option, index) in options.filter((item) => item)" :key="index">
        <el-col :span="config.span || option.span || 24">
          <slot v-if="option.formSlot" :name="option.prop" />
          <el-form-item
            v-else
            :rules="option.rules"
            :label="`${option.label}：`"
            :prop="option.prop"
            :clearable="option.clearable || _config.clearable"
          >
            <ConfigItem
              v-model:objectRef="objectRefs[option.prop]"
              customClass="configForm-item"
              :option="{
                ...option,
                attrs: { ...option.attrs, options: option.dict && !option.attrs?.options ? dictOptions[option.dict] || [] : option.attrs?.options }
              }"
              v-model="formModel[option.prop]"
              :disabled="disabled"
              :readonly="readonly || option.readonly"
              :size="defaultFormItemSize"
            >
              <!-- {{(option.dict && !option.attrs?.options) }} -->
              <slot v-if="option.slot" :name="option.prop" />
            </ConfigItem>
            <template v-if="option.errorSlot" #error="{ error }">
              <slot :name="option.prop + 'ErrorSlot'" :error="error" />
            </template>
          </el-form-item>
        </el-col>
      </template>
    </el-row>
  </el-form>
</template>
<script setup>
import ConfigItem from '../ConfigItem/index.vue'
import { SysGlobalDictController } from '@/api'
import _ from 'lodash'
import { reactive, toRef, toRefs, computed, onMounted, getCurrentInstance, useTemplateRef } from 'vue'
defineOptions({
  name: 'FormConfigBox'
})
const componentProps = defineProps({
  config: {
    // 绑定值
    type: Object,
    default: () => ({})
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
  onSubmit: {
    // 绑定值
    type: Function,
    default: () => {}
  },
  flexWarp: Boolean,
  readonly: Boolean,
  disabled: Boolean
})
const emit = defineEmits()
const componentInstance = getCurrentInstance().proxy
const formRef = useTemplateRef('form')
const componentData = reactive({
  objectRefs: {},
  defaultConfig: {
    labelWidth: '120px',
    clearable: true,
    rules: {}
  },
  dictOptions: {}
})
const objectRefs = toRef(componentData, 'objectRefs')
const defaultConfig = toRef(componentData, 'defaultConfig')
const dictOptions = toRef(componentData, 'dictOptions')
componentData.defaultValues = undefined
const defaultValues = toRef(componentData, 'defaultValues')
function loadDictDropdownList(dictCode) {
  return new Promise((resolve, reject) => {
    let params = {
      dictCode
    }
    SysGlobalDictController.listAll(componentInstance, params)
      .then((res) => {
        resolve(res?.fullResultList)
      })
      .catch((e) => {
        reject(e)
      })
  })
}
function handleSubmit(callback = () => {}) {
  formRef.value.validate((valid, errors) => {
    if (valid) {
      callback(formModel.value)
      componentProps.onSubmit(formModel.value)
    }
  })
}
function validate(callback = () => {}) {
  formRef.value.validate((valid, errors) => {
    callback(valid, errors)
  })
}
function handleReset() {
  formRef.value.resetFields()
  const newObj = _.cloneDeep(componentData.defaultValues)
  emitModelChange(newObj)
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
onMounted(() => {
  const dictOptions = componentProps.options || []
  dictOptions
    .filter((item) => item?.dict)
    .forEach((obj) => {
      loadDictDropdownList(obj.dict).then((res) => {
        componentData.dictOptions[obj.dict] = obj.optionFormatter ? obj.optionFormatter(res) : res
      })
    })
})
;(() => {
  componentData.defaultValues = _.cloneDeep(formModel.value)
})()
defineExpose({
  loadDictDropdownList,
  handleSubmit,
  validate,
  handleReset,
  emitModelChange,
  ...toRefs(componentData),
  formModel,
  _config
})
</script>
<style lang="less" scoped>
.FormConfigBox {
  .config-item {
    width: 100%;
  }
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}
</style>
