<template>
  <vxe-modal
    ref="modalRef"
    :destroy-on-close="true"
    :loading="loading"
    @show="handleShow"
    @close="handleClose"
    class-name="form-modal"
    v-model="visible"
    fullscreen
    width="60%"
    height="800px"
    :title="modalTitle"
    show-zoom
    resize
    show-footer
  >
    <div class="modal-content">
      <div class="form-container">
        <div class="section-title">动因内容</div>
        <el-form label-suffix=":" ref="formRef" :model="formData" :rules="formRules" :label-width="props.labelWidth" label-position="right">
          <el-row :gutter="20">
            <template v-for="field in formFields" :key="field.prop">
              <input v-if="field.type === 'hidden'" type="hidden" v-model="formData[field.prop]" />
              <el-col v-else :span="field.fullWidth ? 24 : 12">
                <el-form-item :label="getPlainLabel(field.label)" :prop="field.prop">
                  <template v-if="isMultilineLabel(field.label)" #label>
                    <span class="form-item-label--multiline">
                      <span v-for="line in getLabelLines(field.label)" :key="line">{{ line }}</span>
                    </span>
                  </template>
                  <!-- 输入框 -->
                  <el-input
                    :show-word-limit="Boolean(field.maxlength)"
                    v-if="field.type === 'input'"
                    v-model.trim="formData[field.prop]"
                    :placeholder="field.placeholder || `请输入${getPlainLabel(field.label)}`"
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
                    :placeholder="field.placeholder || `请输入${getPlainLabel(field.label)}`"
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
                    :placeholder="field.placeholder || `请输入${getPlainLabel(field.label)}`"
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
                    :placeholder="field.placeholder || `请选择${getPlainLabel(field.label)}`"
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
                    :placeholder="field.placeholder || `请选择${getPlainLabel(field.label)}`"
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
                    :placeholder="field.placeholder || `请选择${getPlainLabel(field.label)}`"
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
                    :placeholder="field.placeholder || `请选择${getPlainLabel(field.label)}`"
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
                  <slot
                    v-else-if="field.type === 'slot'"
                    :disabled="isViewMode || field.disabled"
                    :name="field.prop"
                    :field="field"
                    :formData="formData"
                    :isViewMode="isViewMode"
                    :setFieldValue="setFieldValue"
                  />
                </el-form-item>
              </el-col>
            </template>
          </el-row>
        </el-form>
      </div>
      <div class="table">
        <div class="section-title">工作量及内容</div>
        <div style="margin-bottom: 10px" v-if="!isViewMode">
          <el-button type="primary" plain size="mini" @click="addHandle(-1)">新 增</el-button>
          <el-button type="primary" plain size="mini" @click="delHandle">删 除</el-button>
          <el-button type="primary" plain size="mini" @click="gzlImport">工作量导入</el-button>
        </div>
        <vxe-table
          keep-source
          :edit-config="{
            trigger: 'click',
            mode: 'cell',
            showStatus: true
          }"
          ref="tableRef"
          resizable
          show-overflow
          show-header-overflow
          align="center"
          header-align="center"
          border
          stripe
          :row-config="{ height: 32 }"
          height="100%"
          :data="gzljnrData"
        >
          <vxe-column type="checkbox" width="50" />
          <vxe-colgroup title="人工" header-align="center">
            <vxe-column width="180" field="rgmc" title="名称" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
              <template #edit="{ row }">
                <input class="my-sbsm" maxlength="127" v-model="row['rgmc']" />
              </template>
            </vxe-column>
            <vxe-column width="180" field="rgsl" title="数量" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
              <template #edit="{ row }">
                <input class="my-sbsm" maxlength="127" v-model="row['rgsl']" />
              </template>
            </vxe-column>
          </vxe-colgroup>
          <vxe-colgroup title="机械" header-align="center">
            <vxe-column width="180" field="jxmc" title="名称" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
              <template #edit="{ row }">
                <input class="my-sbsm" maxlength="127" v-model="row['jxmc']" />
              </template>
            </vxe-column>
            <vxe-column width="180" field="jxsl" title="数量" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
              <template #edit="{ row }">
                <input class="my-sbsm" maxlength="127" v-model="row['jxsl']" />
              </template>
            </vxe-column>
          </vxe-colgroup>
          <vxe-colgroup title="装置性材料" header-align="center">
            <vxe-column width="180" field="clmc" title="名称" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
              <template #edit="{ row }">
                <input class="my-sbsm" maxlength="127" v-model="row['clmc']" />
              </template>
            </vxe-column>
            <vxe-column width="180" field="clsl" title="数量" :edit-render="{ name: 'input', autofocus: '.my-sbsm', autoselect: true }">
              <template #edit="{ row }">
                <input class="my-sbsm" maxlength="127" v-model="row['clsl']" />
              </template>
            </vxe-column>
          </vxe-colgroup>
        </vxe-table>
      </div>
    </div>
    <template #footer>
      <div style="text-align: center">
        <el-button v-if="!isViewMode" type="primary" @click="handleSave"> 保 存 </el-button>
        <el-button @click="handleClose"> 关 闭 </el-button>
      </div>
    </template>
  </vxe-modal>
  <!-- 导入 -->
  <ImportExcel ref="importRef" />
</template>

<script lang="ts">
export default {
  name: 'FormTableModal'
}
</script>

<script setup lang="ts">
import baseService from '@/service/baseService'
import { ref, reactive, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import ImportExcel from '@/components/ImportExcel/indexZx.vue' //导入组件
import { getImportTemplateByDyGzljnr, importExcelGzljnr, deleteGzljnrHandler, queryGzljnrByDyid } from '@/api/service/xmcs/index'

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
    | Promise<Array<{ label?: string; value: any; name?: string; code?: string }>>
    | Array<{ label?: string; value: any; name?: string; code?: string }>
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
  fields: FormField[]
  data?: Record<string, any>
  width?: string
  labelWidth?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '表单',
  mode: 'add',
  width: '60%',
  labelWidth: '120px',
  height: '600px'
})

const emit = defineEmits(['save', 'close', 'fieldChange'])

const tableRef = ref()
const gzljnrData = ref<any[]>([])
const modalRef = ref()
const formRef = ref()
const visible = ref(false)
const loading = ref(false)
const formData = reactive<Record<string, any>>({})
const dynamicOptions = reactive<Record<string, Array<{ label?: string; value: any; name?: string; code?: string }>>>({})
const multiDependencyLoading = reactive<Record<string, boolean>>({})
const importRef = ref()
const dyid = ref('')
const debounceTimers = reactive<Record<string, number>>({})

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

const modalTitle = computed(() => {
  const modeMap = {
    add: '新增',
    edit: '编辑',
    view: '查看'
  }
  return `${modeMap[props.mode]}${props.title}`
})

const modalHeight = computed(() => props.height)

const formFields = computed(() => props.fields)

const setFieldValue = (field: string, value: any) => {
  formData[field] = value
  nextTick(() => {
    if (!formRules.value[field]) return
    const validateResult = formRef.value?.validateField(field)
    if (validateResult && typeof validateResult.catch === 'function') {
      validateResult.catch(() => undefined)
    }
  })
}

const getLabelLines = (label: string) => label.split('\n')

const getPlainLabel = (label: string) => label.replace(/\n/g, '')

const isMultilineLabel = (label: string) => label.includes('\n')

// 获取字段选项（支持静态和动态）
const getFieldOptions = (field: FormField) => {
  if (dynamicOptions[field.prop]) {
    return dynamicOptions[field.prop]
  }
  return field.options || []
}

const handleFieldChange = async (field: FormField, immediate = false) => {
  // 通知外部字段值已变更（input/textarea 在失焦时触发，其余在 change 时触发），
  // 便于父组件做跨字段联动校验（如各专业调整单价 vs 国网标准的预警校验）
  emit('fieldChange', { field, formData: { ...formData } })
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
  emit('fieldChange', { field, formData: { ...formData } })
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
      const requiredAction = ['select', 'slot'].includes(field.type) ? '选择' : '输入'
      fieldRules.push({
        required: true,
        message: `请${requiredAction}${getPlainLabel(field.label)}`,
        trigger: ['select', 'slot'].includes(field.type) ? 'change' : 'blur'
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
    if (gzljnrData.value.length == 0) return ElMessage.warning('工作量及内容必填！')
    const isInvalid = gzljnrData.value.some((item: any) => {
      const rgValid = item.rgmc != '' && item.rgsl != ''
      const jxValid = item.jxmc != '' && item.jxsl != ''
      return !rgValid && !jxValid
    })
    if (isInvalid) return ElMessage.warning('人工和机械至少填写一项，且名称和数量必须都有值！')
    emit('save', { ...formData, gzljnrList: gzljnrData.value })
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

const addHandle = async (row?: number) => {
  const $table = tableRef.value
  if ($table) {
    gzljnrData.value.push({
      rgmc: '',
      rgsl: '',
      jxmc: '',
      jxsl: '',
      clmc: '',
      clsl: ''
    })
  }
}

const updateGzl = async () => {
  let res = await queryGzljnrByDyid(dyid.value)
  if (res.success) {
    gzljnrData.value = res.data || []
  }
}

const gzlImport = () => {
  let newParmas = { dyid: dyid.value }
  importRef.value.fromData = { ...newParmas }
  let tempApi: any = getImportTemplateByDyGzljnr
  let importApi: any = importExcelGzljnr
  if (!tempApi && !importApi) return
  let params = {
    tempApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return tempApi(newImportParams)
    },
    importApi: (importParams: any) => {
      let newImportParams = {
        ...newParmas,
        excelFormData: importParams.excelFormData
      }
      return importApi(newImportParams)
    },
    title: '工作量清单',
    specialorgid: '',
    getTableList: updateGzl
  }
  if (importRef.value) importRef.value.acceptParams(params)
}

const delHandle = async () => {
  const $table = tableRef.value
  if ($table) {
    const selectRecords = $table.getCheckboxRecords()
    if (selectRecords.length == 0) {
      ElMessage.warning('请选择数据进行删除')
      return
    }
    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning'
    })
    if (type === 'confirm') {
      const ids = selectRecords.map(({ id }: any) => id)
      const delApi = await deleteGzljnrHandler({ ids: ids })
      if (!delApi.success) return ElMessage.error(delApi.msg)
      ElMessage.success('删除成功！')
      updateGzl()
    }
  }
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

const open = async (param: any) => {
  visible.value = true
  console.log(param, 'param')
  if (param && param.dyid) {
    dyid.value = param.dyid
    updateGzl()
  }
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
  resetForm,
  setFieldValue
})
</script>

<style scoped lang="less">
.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.form-container {
  flex: 0 0 420px;
  min-height: 0;
  padding: 0 20px;
  overflow: auto;
}

.modal-footer {
  text-align: center;
  padding: 20px 0 10px;
  border-top: 1px solid #ebeef5;
  margin-top: 20px;
}
.table {
  flex: 1;
  min-height: 0;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: normal;
}

.form-item-label--multiline {
  height: 32px;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  line-height: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 2px solid var(--color-primary, #00857c);
  line-height: 1.2;
}
</style>
