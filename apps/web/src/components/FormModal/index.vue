<template>
  <vxe-modal
    ref="modalRef"
    :destroy-on-close="true"
    :loading="loading"
    @show="handleShow"
    @close="handleClose"
    class-name="form-modal"
    :height="modalHeight"
    v-model="visible"
    :width="props.width"
    :title="modalTitle"
    show-zoom
    resize
  >
    <div class="modal-content">
      <div class="form-container">
        <el-form label-suffix=":" ref="formRef" :model="formData" :rules="formRules" :label-width="props.labelWidth" label-position="right">
          <el-row :gutter="20">
            <template v-for="field in formFields" :key="field.prop">
              <input v-if="field.type === 'hidden'" type="hidden" v-model="formData[field.prop]" />
              <el-col v-else :span="field.fullWidth ? 24 : 12">
                <el-form-item :label="field.label" :prop="field.prop">
                  <!-- 输入框 -->
                  <el-input
                    :show-word-limit="Boolean(field.maxlength)"
                    v-if="field.type === 'input'"
                    v-model.trim="formData[field.prop]"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                    :disabled="isViewMode || field.disabled"
                    :maxlength="field.maxlength"
                    style="width: 100%"
                    @blur="handleFieldChange(field)"
                  />

                  <!-- 文本域 -->
                  <el-input
                    v-else-if="field.type === 'textarea'"
                    :show-word-limit="Boolean(field.maxlength)"
                    v-model.trim="formData[field.prop]"
                    type="textarea"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                    :disabled="isViewMode || field.disabled"
                    :rows="field.rows || 3"
                    :maxlength="field.maxlength"
                    style="width: 100%"
                    resize="none"
                    @blur="handleFieldChange(field)"
                  />

                  <!-- 数字输入框 -->
                  <el-input-number
                    v-else-if="field.type === 'number'"
                    v-model="formData[field.prop]"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                    :disabled="isViewMode || field.disabled"
                    :min="field.min"
                    :max="field.max"
                    :precision="field.precision"
                    :step="field.step || 1"
                    style="width: 100%"
                    @change="handleFieldChange(field, true)"
                  />

                  <!-- 选择器 -->
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="formData[field.prop]"
                    :placeholder="field.placeholder || `请选择${field.label}`"
                    :disabled="isViewMode || field.disabled"
                    :multiple="field.multiple"
                    :clearable="field.clearable !== false"
                    style="width: 100%"
                    @change="handleSelectChange(field, $event)"
                  >
                    <el-option
                      v-for="option in getFieldOptions(field)"
                      :key="option.value || option.code"
                      :label="option.label || option.name"
                      :value="option.value || option.code"
                    />
                  </el-select>

                  <!-- 日期选择器 -->
                  <el-date-picker
                    v-else-if="field.type === 'year'"
                    v-model="formData[field.prop]"
                    type="year"
                    :placeholder="field.placeholder || `请选择${field.label}`"
                    :disabled="isViewMode || field.disabled"
                    format="YYYY"
                    value-format="YYYY"
                    style="width: 100%"
                    @change="handleFieldChange(field, true)"
                  />

                  <!-- 日期选择器 -->
                  <el-date-picker
                    v-else-if="field.type === 'date'"
                    v-model="formData[field.prop]"
                    type="date"
                    :placeholder="field.placeholder || `请选择${field.label}`"
                    :disabled="isViewMode || field.disabled"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                    @change="handleFieldChange(field, true)"
                  />

                  <!-- 日期时间选择器 -->
                  <el-date-picker
                    v-else-if="field.type === 'datetime'"
                    v-model="formData[field.prop]"
                    type="datetime"
                    :placeholder="field.placeholder || `请选择${field.label}`"
                    :disabled="isViewMode || field.disabled"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                    @change="handleFieldChange(field, true)"
                  />

                  <!-- 开关 -->
                  <el-switch
                    v-else-if="field.type === 'switch'"
                    v-model="formData[field.prop]"
                    :disabled="isViewMode || field.disabled"
                    :active-value="field.activeValue || true"
                    :inactive-value="field.inactiveValue || false"
                    @change="handleFieldChange(field, true)"
                  />

                  <!-- 单选框组 -->
                  <el-radio-group
                    v-else-if="field.type === 'radio'"
                    v-model="formData[field.prop]"
                    :disabled="isViewMode || field.disabled"
                    @change="handleFieldChange(field, true)"
                  >
                    <el-radio v-for="option in field.options" :key="option.value || option.code" :label="option.value || option.code">
                      {{ option.label || option.name }}
                    </el-radio>
                  </el-radio-group>

                  <!-- 多选框组 -->
                  <el-checkbox-group
                    v-else-if="field.type === 'checkbox'"
                    v-model="formData[field.prop]"
                    :disabled="isViewMode || field.disabled"
                    @change="handleFieldChange(field, true)"
                  >
                    <el-checkbox v-for="option in field.options" :key="option.value || option.code" :label="option.value || option.code">
                      {{ option.label || option.name }}
                    </el-checkbox>
                  </el-checkbox-group>

                  <!-- 自定义插槽 -->
                  <slot v-else-if="field.type === 'slot'" :name="field.prop" :field="field" :formData="formData" :isViewMode="isViewMode" />
                </el-form-item>
              </el-col>
            </template>
          </el-row>
        </el-form>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <el-button v-if="!isViewMode" type="primary" @click="handleSave"> 保 存 </el-button>
        <el-button @click="handleClose"> 关 闭 </el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'FormModal'
}
</script>

<script setup lang="ts">
import baseService from '@/service/baseService'
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'

export interface FormField {
  prop: string
  label: string
  type: 'input' | 'hidden' | 'textarea' | 'number' | 'select' | 'year' | 'date' | 'datetime' | 'switch' | 'radio' | 'checkbox' | 'slot'
  placeholder?: string
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
  maxlength?: number
  rows?: number
  min?: number
  max?: number
  precision?: number
  step?: number
  multiple?: boolean
  clearable?: boolean
  options?: Array<{ label?: string; value: any; name?: string; code?: string }>
  apiConfig?: {
    url: string
    method?: 'get' | 'post'
    params?: Record<string, any>
    labelField?: string
    valueField?: string
    transfrom?: (data: any) => Array<{ label?: string; value: any; name?: string; code?: string }>
  }
  activeValue?: any
  inactiveValue?: any
  rules?: any[]
  // 联动配置
  dependsOn?: string // 依赖的字段名
  optionsLoader?: (
    parentValue: any,
    formData: Record<string, any>
  ) =>
    Promise<Array<{ label?: string; value: any; name?: string; code?: string }>> | Array<{ label?: string; value: any; name?: string; code?: string }>
  cascadeConfig?: {
    parentField: string
    optionsMap: Record<string, Array<{ label?: string; value: any; name?: string; code?: string }>>
  }
  multiDependsOn?: {
    fields: string[]
    apiConfig?: {
      url: string
      method?: 'get' | 'post'
      params?: Record<string, any>
      transfrom?: (data: any) => Array<{ label?: string; value: any; name?: string; code?: string }>
    }
    loader?: (dependentValues: Record<string, any>, formData: Record<string, any>) => Promise<any> | any
    clearOnChange?: boolean
  }
}

interface Props {
  title?: string
  mode?: 'add' | 'edit' | 'view'
  showModeTitle?: boolean
  fields: FormField[]
  data?: Record<string, any>
  width?: string
  labelWidth?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '表单',
  mode: 'add',
  showModeTitle: true,
  width: '60%',
  labelWidth: '120px',
  height: '600px'
})

const emit = defineEmits(['save', 'close'])

const modalRef = ref()
const formRef = ref()
const visible = ref(false)
const loading = ref(false)
const formData = reactive<Record<string, any>>({})
const dynamicOptions = reactive<Record<string, Array<{ label?: string; value: any; name?: string; code?: string }>>>({})

const multiDependencyLoading = reactive<Record<string, boolean>>({})

const debounceTimers = reactive<Record<string, ReturnType<typeof setTimeout>>>({})

const debouncedHandleMultiDependency = (fieldProp: string, delay = 300) => {
  if (debounceTimers[fieldProp]) {
    clearTimeout(debounceTimers[fieldProp])
  }

  debounceTimers[fieldProp] = setTimeout(async () => {
    await handleMultiDependencyChange(fieldProp)
    delete debounceTimers[fieldProp]
  }, delay)
}

const checkMultiDependencyCondition = (field: FormField): boolean => {
  if (!field.multiDependsOn?.fields?.length) return false
  const result = field.multiDependsOn.fields.every((fieldName) => {
    const value = formData[fieldName]
    const isVaild = value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
    return isVaild
  })
  return result
}

const loadDataFromMultiDependency = async (field: FormField): Promise<void> => {
  if (!field.multiDependsOn) return
  if (multiDependencyLoading[field.prop]) return
  const { fields, apiConfig, loader } = field.multiDependsOn
  const dependentValues: Record<string, any> = {}
  fields.forEach((fieldName) => {
    dependentValues[fieldName] = formData[fieldName]
  })

  try {
    multiDependencyLoading[field.prop] = true
    let result: any

    if (loader) {
      result = await Promise.resolve(loader(dependentValues, { ...formData }))
    } else if (apiConfig) {
      const { url, method = 'get', params = {}, transfrom } = apiConfig
      const requestParams = { ...params, ...dependentValues }
      const data = null
      result = transfrom ? transfrom(data) : data
    }
    if (result !== undefined && result !== null) {
      formData[field.prop] = result
    }
  } catch (error) {
    formData[field.prop] = field.type === 'checkbox' ? [] : ''
  } finally {
    multiDependencyLoading[field.prop] = false
  }
}

const handleMultiDependencyChange = async (changedFieldProp: string): Promise<void> => {
  const affectedFields = props.fields.filter((field) => field.multiDependsOn?.fields?.includes(changedFieldProp))
  if (affectedFields.length === 0) return
  const updatePromises = affectedFields.map(async (field) => {
    try {
      if (field.multiDependsOn?.clearOnChange !== false) {
        formData[field.prop] = field.type === 'checkbox' ? [] : ''
      }
      if (checkMultiDependencyCondition(field)) {
        await loadDataFromMultiDependency(field)
      }
    } catch (error) {
      console.error(`处理字段${field.label}的多字段依赖失败:`, error)
    }
  })
  await Promise.allSettled(updatePromises)
}

const loadOptionsFromApi = async (field: FormField) => {
  if (!field.apiConfig) return []
  try {
    const { url, method = 'get', params, labelField = 'label', valueField = 'value', transfrom } = field.apiConfig

    const response = await baseService[method](url, params)
    const data: any[] = response.data || []
    if (transfrom) {
      return transfrom(data)
    }
    return data.map((item: any) => ({
      label: item[labelField],
      value: item[valueField]
    }))
  } catch (error) {
    return []
  }
}

const isViewMode = computed(() => props.mode === 'view')

const modeMap = {
  add: '新增',
  edit: '编辑',
  view: '查看'
}

const modalTitle = computed(() => `${props.showModeTitle ? modeMap[props.mode] : ''}${props.title}`)

const modalHeight = computed(() => props.height)

const formFields = computed(() => props.fields)

// 获取字段选项（支持静态和动态）
const getFieldOptions = (field: FormField) => {
  if (dynamicOptions[field.prop]) {
    return dynamicOptions[field.prop]
  }
  return field.options || []
}

const handleFieldChange = async (field: FormField, immediate = false) => {
  const needsDebounce = ['input', 'textarea', 'number'].includes(field.type) && !immediate
  if (needsDebounce) {
    debouncedHandleMultiDependency(field.prop)
  } else {
    await handleMultiDependencyChange(field.prop)
  }
}

// 处理选择框变化
const handleSelectChange = async (field: FormField, value: any) => {
  formData[field.prop] = value
  // 递归清空所有依赖此字段的下级字段（包括间接依赖）
  clearDependentFields(field.prop)

  // 更新直接依赖此字段的下级字段选项
  const directDependentFields = props.fields.filter((f) => f.dependsOn === field.prop || f.cascadeConfig?.parentField === field.prop)

  const cascadePromises = directDependentFields.map((depField) => loadCascadeOptions(depField, value))

  await Promise.all([...cascadePromises, handleFieldChange(field, true)])
}

// 递归清空依赖字段
const clearDependentFields = (changedFieldProp: string) => {
  const dependentFields = props.fields.filter((f) => f.dependsOn === changedFieldProp || f.cascadeConfig?.parentField === changedFieldProp)

  dependentFields.forEach((depField) => {
    // 清空字段值和选项
    formData[depField.prop] = depField.multiple ? [] : ''
    dynamicOptions[depField.prop] = []

    // 递归清空此字段的依赖字段
    clearDependentFields(depField.prop)
  })
}

// 加载联动选项
const loadCascadeOptions = async (field: FormField, parentValue: any) => {
  if (!parentValue) {
    dynamicOptions[field.prop] = []
    return
  }

  try {
    let options: Array<{ label?: string; value: any; name?: string; code?: string }> = []

    // 使用 optionsLoader 加载选项
    if (field.optionsLoader) {
      const result = await field.optionsLoader(parentValue, formData)
      options = Array.isArray(result) ? result : []
    }
    // 使用 cascadeConfig 映射选项
    else if (field.cascadeConfig?.optionsMap) {
      options = field.cascadeConfig.optionsMap[parentValue] || []
    }

    dynamicOptions[field.prop] = options
  } catch (error) {
    console.error(`加载 ${field.label} 选项失败:`, error)
    dynamicOptions[field.prop] = []
  }
}

const initMultiDependencies = async () => {
  const multiDependencyFields = props.fields.filter((field) => field.multiDependsOn)

  for (const field of multiDependencyFields) {
    if (checkMultiDependencyCondition(field)) {
      await loadDataFromMultiDependency(field)
    }
  }
}

// 初始化联动选项
const initCascadeOptions = async () => {
  const cascadeFields = props.fields.filter((field) => field.dependsOn || field.cascadeConfig)

  for (const field of cascadeFields) {
    const parentField = field.dependsOn || field.cascadeConfig?.parentField
    if (parentField && formData[parentField]) {
      await loadCascadeOptions(field, formData[parentField])
    }
  }
}

const initApiOptions = async () => {
  const apiFields = props.fields.filter((field) => field.apiConfig && field.type === 'select')

  for (const field of apiFields) {
    const options = await loadOptionsFromApi(field)
    dynamicOptions[field.prop] = options
  }
}

const formRules = computed(() => {
  const rules: Record<string, any[]> = {}

  props.fields.forEach((field) => {
    const fieldRules = []

    if (field.required) {
      fieldRules.push({
        required: true,
        message: `请${field.type === 'select' ? '选择' : '输入'}${field.label}`,
        trigger: field.type === 'select' ? 'change' : 'blur'
      })
    }

    if (field.rules) {
      fieldRules.push(...field.rules)
    }

    if (fieldRules.length > 0) {
      rules[field.prop] = fieldRules
    }
  })

  return rules
})

const initFormData = () => {
  const data: Record<string, any> = {}
  props.fields.forEach((field) => {
    if (props.data && props.data[field.prop] !== undefined) {
      data[field.prop] = props.data[field.prop]
    } else {
      switch (field.type) {
        case 'number':
          data[field.prop] = field.min || 0
          break
        case 'switch':
          data[field.prop] = field.inactiveValue || false
          break
        case 'checkbox':
          data[field.prop] = []
          break
        default:
          data[field.prop] = ''
      }
    }
  })

  Object.assign(formData, data)
}

const handleShow = async () => {
  initFormData()
  await initApiOptions()
  await initCascadeOptions()
  await initMultiDependencies()
}

const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true
    // 清空数据
    emit('save', { ...formData })
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  clearAllTimers()
  visible.value = false
  emit('close')
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.keys(formData).forEach((key) => {
    delete formData[key]
  })
  Object.keys(debounceTimers).forEach((key) => {
    delete debounceTimers[key]
  })
}

const clearAllTimers = () => {
  Object.values(debounceTimers).forEach((timer) => {
    if (timer && typeof timer === 'number') clearTimeout(timer)
  })
  Object.keys(debounceTimers).forEach((key) => {
    delete debounceTimers[key]
  })
}

onBeforeUnmount(() => {
  clearAllTimers()
})

watch(
  () => props.data,
  async () => {
    if (visible.value) {
      initFormData()
      await initApiOptions()
      await initCascadeOptions()
      await initMultiDependencies()
    }
  },
  { deep: true }
)

const open = () => {
  visible.value = true
}

const close = () => {
  visible.value = false
}

const openLoading = () => {
  loading.value = true
}

const closeLoading = () => {
  loading.value = false
}

defineExpose({
  open,
  close,
  openLoading,
  closeLoading,
  resetForm
})
</script>

<style scoped lang="less">
.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.form-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
}

.modal-footer {
  text-align: center;
  padding: 20px 0 10px;
  border-top: 1px solid #ebeef5;
  margin-top: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: normal;
}
</style>
