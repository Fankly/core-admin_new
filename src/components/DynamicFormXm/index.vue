<template>
  <div v-loading="loading" class="dynamic-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="formConfig.labelWidth || '120px'"
      :label-position="formConfig.labelPosition || 'right'"
    >
      <el-row v-for="(row, rowIndex) in formRows" :key="rowIndex" :gutter="formConfig.gutter || 24">
        <template v-for="field in row">
          <el-col v-if="shouldShowField(field)" :key="field.prop" :span="field.span || Math.floor(24 / formConfig.colsPerRow)">
            <el-form-item
              :style="['upload', 'table_list', 'uploadGroup'].includes(field.type) ? { 'margin-bottom': 0 } : ''"
              :label="['upload', 'table_list', 'uploadGroup'].includes(field.type) ? '' : field.label"
              :prop="field.prop"
            >
              <!-- 输入框 -->
              <el-input
                v-if="field.type === 'input'"
                v-model="formData[field.prop]"
                :maxlength="field.maxLength"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :clearable="field.clearable !== false"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />

              <!-- 数字输入框 -->
              <input
                :maxlength="field.maxLength"
                v-else-if="field.type === 'number'"
                v-model="formData[field.prop]"
                v-number-input="'6'"
                class="number-input"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :min="field.min"
                :max="field.max"
                :step="field.step || 1"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />

              <!-- 选择器 -->
              <el-select
                v-else-if="field.type === 'select'"
                v-model="formData[field.prop]"
                style="width: 100%"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :clearable="field.clearable !== false"
                :multiple="field.multiple"
                :filterable="field.filterable"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              >
                <el-option v-for="option in field.options" :key="option.code" :label="option.name" :value="option.code" :disabled="option.disabled" />
              </el-select>

              <!-- 日期选择器 -->
              <el-date-picker
                v-else-if="field.type === 'date'"
                v-model="formData[field.prop]"
                style="width: 100%"
                :type="field.dateType || 'date'"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :clearable="Boolean(field.clearable !== false)"
                :format="field.format"
                :value-format="field.valueFormat || 'YYYY-MM-DD'"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />

              <!-- 开关 -->
              <el-switch
                v-else-if="field.type === 'switch'"
                v-model="formData[field.prop]"
                :disabled="field.disabled"
                :active-text="field.activeText"
                :inactive-text="field.inactiveText"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />

              <!-- 单选框组 -->
              <el-radio-group
                v-else-if="field.type === 'radio'"
                v-model="formData[field.prop]"
                :disabled="field.disabled"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              >
                <el-radio v-for="option in field.options" :key="option.code" :label="option.code" :disabled="option.disabled">
                  {{ option.name }}
                </el-radio>
              </el-radio-group>

              <!-- 复选框组 -->
              <el-checkbox-group
                v-else-if="field.type === 'checkbox'"
                v-model="formData[field.prop]"
                :disabled="field.disabled"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              >
                <el-checkbox v-for="option in field.options" :key="option.code" :label="option.code" :disabled="option.disabled">
                  {{ option.name }}
                </el-checkbox>
              </el-checkbox-group>

              <!-- 文本域 -->
              <el-input
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.prop]"
                resize="none"
                type="textarea"
                :maxlength="field.maxLength"
                :rows="field.rows || 4"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :clearable="field.clearable !== false"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />

              <!-- 树形选择器 -->
              <TreeSelect
                v-else-if="field.type === 'treeSelect'"
                v-model="formData[field.prop]"
                style="width: 100%"
                :data="field.options"
                :props="field.treeProps || { children: 'children', label: 'name', value: 'id' }"
                :node-key="field.nodeKey || 'id'"
                :multiple="field.multiple"
                :clearable="field.clearable !== false"
                :filterable="field.filterable"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :default-expand-all="field.defaultExpandAll"
                :default-expanded-keys="field.defaultExpandedKeys"
                :check-strictly="field.checkStrictly"
                :popper-class="field.popperClass"
                :onlyLeafSelectable="field.onlyLeafSelectable"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />
              <!-- 上传组件 -->
              <DynamicUpload
                v-else-if="field.type === 'upload'"
                v-model="formData[field.prop]"
                :attach-type="attachType"
                :allData="initialData[field.prop]"
                :title="field.uploadTitle || field.label"
                :limit="field.uploadLimit || 5"
                :accept="field.uploadAccept || ''"
                :action="field.uploadAction || '/api/upload'"
                :tip="field.uploadTip || ''"
                :list-type="field.uploadListType || 'text'"
                :selectData="selectData"
                :fjId="field.fjId"
                :fjTypes="field.fjTypes"
                :multiple="field.uploadMultiple !== false"
                :auto-upload="field.uploadAutoUpload !== false"
                :disabled="field.uploadDisabled || field.disabled || false"
                :drag="field.uploadDrag || false"
                :style-type="field.uploadStyle || 'table'"
                :button-text="field.uploadButtonText || '点击上传'"
                :icon="field.uploadIcon || 'el-icon-upload'"
                :tableHeight="field.rows ? field.rows * 40 + 'px' : field.uploadTableHeight || 'auto'"
                :show-preview="field.uploadShowPreview !== false"
                :show-download="field.uploadShowDownload !== false"
                :show-delete="!field.disabled"
                :show-status="field.uploadShowStatus || false"
                :show-actions="field.uploadShowActions !== false"
                @change="(files:any) => {
                  handleUploadChange(field.prop, files);
                  if (field.uploadChange) field.uploadChange(files);
                }"
              />

              <DynamicUploadGroup
                v-else-if="field.type === 'uploadGroup'"
                v-model="formData[field.prop]"
                :attach-type="attachType"
                :allData="initialData"
                :title="field.uploadTitle || field.label"
                :limit="field.uploadLimit || 5"
                :accept="field.uploadAccept || ''"
                :action="field.uploadAction || '/api/upload'"
                :tip="field.uploadTip || ''"
                :list-type="field.uploadListType || 'text'"
                :selectData="selectData"
                :fjId="field.fjId"
                :fjTypes="field.fjTypes"
                :multiple="field.uploadMultiple !== false"
                :auto-upload="field.uploadAutoUpload !== false"
                :disabled="field.uploadDisabled || field.disabled || false"
                :drag="field.uploadDrag || false"
                :style-type="field.uploadStyle || 'table'"
                :button-text="field.uploadButtonText || '点击上传'"
                :icon="field.uploadIcon || 'el-icon-upload'"
                :tableHeight="field.rows ? field.rows * 40 + 'px' : field.uploadTableHeight || 'auto'"
                :show-preview="field.uploadShowPreview !== false"
                :show-download="field.uploadShowDownload !== false"
                :show-delete="!field.disabled"
                :show-status="field.uploadShowStatus || false"
                :show-actions="field.uploadShowActions !== false"
                @change="(files:any) => {
                  handleUploadGroupChange(files);
                  if (field.uploadChange) field.uploadChange(files);
                }"
                :columns="field.children"
              />

              <!-- 自定义关联合同 -->
              <div v-else-if="field.type === 'table_list'">
                <relatedContract :selectData="selectData"></relatedContract>
              </div>

              <!-- 自定义插槽 -->
              <slot v-else-if="field.type === 'slot'" :name="field.slotName || field.prop" :field="field" :form-data="formData"></slot>

              <!-- 默认输入框 -->
              <el-input
                v-else
                :maxlength="field.maxLength"
                v-model="formData[field.prop]"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :clearable="field.clearable !== false"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />
            </el-form-item>
          </el-col>
        </template>
      </el-row>

      <!-- 表单操作按钮 -->
      <div v-if="showActions" class="form-actions">
        <el-button @click="resetForm">重 置</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <slot name="actions"></slot>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, PropType, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import TreeSelect from '@/components/TreeSelect'
import { FormConfig, FormField } from '@/components/DynamicFormXm/interface'
import baseService from '@/service/baseService'
import DynamicUpload from '@/components/DynamicUpload/index.vue'
import DynamicUploadGroup from '@/components/DynamicFormXm/components/DynamicUploadGroup.vue'
import relatedContract from '@/views/service/xq/components/relatedContract.vue'

export default defineComponent({
  name: 'DynamicFormXm',
  components: {
    DynamicUploadGroup,
    DynamicUpload,
    TreeSelect,
    relatedContract
  },
  props: {
    userInfo: {
      type: Object as any
    },
    selectData: {
      type: Object as any,
      default: null
    },
    globalParams: {
      type: Object as any,
      required: true
    },
    // 表单配置
    formConfig: {
      type: Object as PropType<FormConfig>,
      default: () => ({
        labelWidth: '160px',
        labelPosition: 'right',
        gutter: 24,
        colsPerRow: 2 // 默认每行显示2列
      })
    },
    // 表单字段配置
    fields: {
      type: Array as PropType<FormField[]>,
      required: true,
      default: () => []
    },
    // 初始表单数据
    initialData: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    },
    // 是否显示操作按钮
    showActions: {
      type: Boolean,
      default: true
    },
    attachType: {
      type: String,
      default: ''
    },
    isChange: {
      type: Boolean,
      default: false
    },
    // 平铺的表单验证规则
    flatRules: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    },
    // 表单提交前的验证函数
    beforeSubmit: {
      type: Function as PropType<(formData: Record<string, any>) => Promise<boolean> | boolean>,
      default: null
    },
    customParam: {
      type: Object as any,
      default: () => ({})
    }
  },
  emits: ['submit', 'reset', 'field-change', 'form-valid-change', 'upload-change', 'setValue', 'clearFieldValue'],
  setup(props, { emit, expose }) {
    const formRef = ref<any>(null)
    const formData = reactive<Record<string, any>>({})
    const formRules = reactive<Record<string, any>>({})
    const fieldDependencies = reactive<Record<string, string[]>>({})
    const loading = ref(false)

    // 初始化表单数据和规则
    const initForm = async () => {
      try {
        loading.value = true
        // 获取公共代码
        const ggdmArr = await loadOptionsFormDependencies(props.fields)
        if (ggdmArr && ggdmArr.length > 0) {
          const url: any = ggdmArr[1] || ('/commonCode/getCommonCode' as string)
          if (ggdmArr[0].length > 0) {
            const res = await baseService.post(url, {
              bmId: props.userInfo?.deptId || '',
              dwId: props.userInfo?.dwId || '',
              codes: ggdmArr[0]
            })
            props.fields.forEach((field) => {
              const item: any = res.data.find((data: any) => field.ggdm === data['comCode']) as FormField
              if (item) {
                field.options = item['codes']
              }
            })
          }
        }
        // console.log('====globalParams====', props.globalParams)
        // 初始化表单数据
        for (const field of props.fields) {
          if (field.prop) {
            // 使用初始值或默认值
            if (props.globalParams && props.globalParams[field.prop] !== undefined) {
              if (props.globalParams && Object.keys(props.globalParams).length > 0 && field.dyff) {
                if (field.dependencies) {
                  if (field.ggdm) {
                    const res = await baseService.post(field.dyff, {
                      bmId: props.userInfo?.deptId || '',
                      dwId: props.userInfo?.dwId || '',
                      code: field.ggdm,
                      parentCode: props.globalParams[field.dependencies[0]]
                    })
                    field.options = res.data
                  }
                  if (!field.ggdm) {
                    let params: any = {
                      bmId: props.userInfo?.deptId || '',
                      dwId: props.userInfo?.dwId || ''
                    }
                    if (field.dependencies.length !== 0) {
                      params['parentCode'] = props.globalParams[field.dependencies[0]]
                      let flag = false
                      for (let i = 0; i < field.dependencies.length; i++) {
                        params[field.dependencies[i]] = props.globalParams[field.dependencies[i]]
                      }
                      // console.log('====params====', params)
                      if (!flag) {
                        // 租赁需求录入页面-基本信息-市管审批单位、市管审批部门
                        if (['XJSPDW', 'XJSPBM'].includes(field.prop)) {
                          params = {
                            ...params,
                            ...props.customParam
                          }
                        }
                        const resData = await baseService.post(field.dyff, params)
                        if (resData.success && resData.data) {
                          if (field.type === 'input') {
                            if (field.prop === 'XMBM' && props.globalParams['id']) {
                            } else {
                              formData[field.prop] = resData.data
                              emit('setValue', field, resData.data)
                            }
                          } else {
                            field.options = resData.data
                          }
                        }
                      }
                    }
                  }
                }
              } else {
                formData[field.prop] = props.globalParams[field.prop]
              }
              if (field.type === 'upload' && Array.isArray(props.initialData[field.prop])) {
                const uuidList = props.initialData[field.prop].map((item: any) => item.uuid).filter(Boolean)
                formData[field.prop] = uuidList
                emit('setValue', field, uuidList)
              } else if (field.type === 'uploadGroup') {
                if (field.type === 'uploadGroup' && field.children && field.children.length > 0) {
                  field.children.forEach((item) => {
                    if (props.initialData && props.initialData[item.prop] && Array.isArray(props.initialData[item.prop])) {
                      const uuidList = props.initialData[item.prop].map((item: any) => item.uuid)
                      formData[item.prop] = uuidList
                      emit('setValue', item.prop, uuidList)
                    }
                  })
                }
              } else {
                formData[field.prop] = props.globalParams[field.prop]
              }
            } else if (field.defaultValue !== undefined) {
              formData[field.prop] = field.defaultValue
            } else {
              // 根据字段类型设置默认值
              switch (field.type) {
                case 'checkbox':
                  formData[field.prop] = []
                  break
                case 'number':
                  formData[field.prop] = 0
                  break
                case 'switch':
                  formData[field.prop] = false
                  break
                case 'upload':
                  formData[field.prop] = []
                  break
                case 'uploadGroup':
                  if (field.children) {
                    field.children.forEach((item) => {
                      formData[item.prop] = []
                    })
                  }
                  break
                default:
                  formData[field.prop] = ''
              }
            }

            // 设置表单验证规则
            // 优先使用平铺的规则，如果没有则使用字段内嵌的规则
            if (props.flatRules && props.flatRules[field.prop]) {
              formRules[field.prop] = props.flatRules[field.prop]
            } else if (field.rules) {
              formRules[field.prop] = field.rules
            }
            // 记录字段依赖关系
            if (field.dependencies) {
              field.dependencies.forEach((dep: any) => {
                if (!fieldDependencies[dep]) {
                  fieldDependencies[dep] = []
                }
                if (!fieldDependencies[dep].includes(field.prop)) {
                  fieldDependencies[dep].push(field.prop)
                }
              })
            }
          } else {
            if (field.type === 'uploadGroup' && field.children && field.children.length > 0) {
              field.children.forEach((item) => {
                if (props.initialData && props.initialData[item.prop] && Array.isArray(props.initialData[item.prop])) {
                  const uuidList = props.initialData[item.prop].map((item: any) => item.uuid)
                  formData[item.prop] = uuidList
                  emit('setValue', item.prop, uuidList)
                }
              })
            }
          }
        }
      } catch (error: any) {
        ElMessage.error('加载选项失败，请重试')
        console.error(error.message)
      } finally {
        loading.value = false
      }
    }

    const loadOptionsFormDependencies = async (fields: FormField[]) => {
      const ggdmCodes = []
      let ggdmUrl = ''
      if (!fields || fields.length === 0) return
      for (const field of fields) {
        if (field.dyff && field.ggdm && !field.dependencies) {
          ggdmUrl = field.dyff
          ggdmCodes.push(field.ggdm)
        }
        if (field.dyff && !field.ggdm && !field.dependencies) {
          let params: any = {
            bmId: props.userInfo?.deptId || '',
            dwId: props.userInfo?.dwId || ''
          }
          // 租赁需求录入页面-基本信息-市管审批单位、市管审批部门
          if (['XJSPDW', 'XJSPBM'].includes(field.prop)) {
            params = {
              ...params,
              ...props.customParam
            }
          }
          const customData = await baseService.post(field.dyff, params)
          if (customData.success) {
            field.options = customData.data || []
          }
        }
      }
      return [ggdmCodes, ggdmUrl]
    }

    // 计算表单行
    const formRows = computed<FormField[]>(() => {
      const rows: any = []
      let currentRow: any = []
      let currentRowSpan = 0
      const maxSpan = 24 // Element Plus 栅格系统总共24列

      props.fields.forEach((field) => {
        // 跳过隐藏的字段
        if (field.hidden) return

        const fieldSpan = field.span || Math.floor(24 / props.formConfig.colsPerRow)

        // 如果当前行已满或指定了换行，则创建新行
        if (currentRowSpan + fieldSpan > maxSpan || field.newRow) {
          if (currentRow.length > 0) {
            rows.push(currentRow)
            currentRow = []
            currentRowSpan = 0
          }
        }

        currentRow.push(field as FormField)
        currentRowSpan += fieldSpan

        // 如果刚好填满一行，也创建新行
        if (currentRowSpan === maxSpan) {
          rows.push(currentRow)
          currentRow = []
          currentRowSpan = 0
        }
      })

      // 添加最后一行（如果有）
      if (currentRow.length > 0) {
        rows.push(currentRow)
      }

      return rows
    })

    // 日期计算函数
    const calculateDateDifference = (startDate: string, endDate: string, unit: 'days' | 'months' | 'years' = 'days'): number => {
      if (!startDate || !endDate) return 0

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

      const timeDiff = end.getTime() - start.getTime()

      switch (unit) {
        case 'days':
          return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
        case 'months':
          return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
        case 'years':
          return end.getFullYear() - start.getFullYear()
        default:
          return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
      }
    }

    // 处理日期计算
    const handleDateCalculation = (changedField: string, value: any) => {
      props.fields.forEach((field) => {
        if (field.dateCalculation) {
          const {
            startDateField,
            endDateField,
            targetField,
            unit = 'days',
            validateDateOrder = true,
            errorMessage = '到期日不能早于起租日'
          } = field.dateCalculation

          // 如果当前变化的字段是起始日期或结束日期字段
          if (changedField === startDateField || changedField === endDateField) {
            const startDate = formData[startDateField!]
            const endDate = formData[endDateField!]

            if (startDate && endDate && targetField) {
              const start = new Date(startDate)
              const end = new Date(endDate)

              // 验证日期顺序
              if (validateDateOrder && end < start) {
                // 显示错误提示
                ElMessage.error(errorMessage)

                // 重置目标字段
                formData[targetField] = 0

                // 设置表单验证错误
                if (formRef.value) {
                  nextTick(() => {
                    formRef.value.clearValidate(changedField)
                    const fieldError = { message: errorMessage, field: changedField }
                    formRef.value?.setFields && formRef.value?.setFields({ [changedField]: fieldError })
                  })
                }
              } else {
                // 日期顺序正确，计算差值
                const calculatedValue = calculateDateDifference(startDate, endDate, unit as any)
                nextTick(() => {
                  formData[targetField] = calculatedValue
                  emit('setValue', field, calculatedValue)
                })

                // 清除验证错误
                if (formRef.value) {
                  nextTick(() => {
                    formRef.value.clearValidate([startDateField!, endDateField!])
                  })
                }
              }
            }
          }
        }
      })
    }

    // 处理字段值变化
    const handleFieldChange = async (prop: string, value: any) => {
      emit('field-change', { prop, value, formData })
      // 处理日期计算
      handleDateCalculation(prop, value)
      // 处理联动字段
      if (fieldDependencies[prop]) {
        // 找到依赖于当前字段的所有字段
        const dependentFields = fieldDependencies[prop]
        for (const depField of dependentFields) {
          // 找到依赖字段的配置
          const fieldConfig = props.fields.find((f) => f.prop === depField) as FormField | undefined
          if (fieldConfig) {
            try {
              // 设置加载状态
              fieldConfig.loading = true

              let options: any = null
              if (fieldConfig.loadOptions) {
                // 调用加载选项的函数
                if (fieldConfig.dependencies && fieldConfig.dependencies.length > 0) {
                  options = await fieldConfig.loadOptions(value, formData, fieldConfig.dependencies as string[])
                } else {
                  options = await fieldConfig.loadOptions(value, formData)
                }
              }
              const params: any = {
                bmId: props.userInfo?.deptId || '',
                dwId: props.userInfo?.dwId || ''
              }
              if (fieldConfig.dyff && fieldConfig.ggdm && fieldConfig.dependencies) {
                params['code'] = fieldConfig.ggdm
                if (fieldConfig.dependencies.length === 1) {
                  params['parentCode'] = props.globalParams[fieldConfig.dependencies[0]]
                  const resData = await baseService.post(fieldConfig.dyff, params)
                  if (resData.success && resData.data) {
                    options = resData.data
                  }
                }
              }

              if (fieldConfig.dyff && !fieldConfig.ggdm && fieldConfig.dependencies) {
                if (fieldConfig.dependencies.length !== 0) {
                  params['parentCode'] = props.globalParams[fieldConfig.dependencies[0]]
                  let flag = false
                  for (let i = 0; i < fieldConfig.dependencies.length; i++) {
                    if (props.globalParams[fieldConfig.dependencies[i]]) {
                      params[fieldConfig.dependencies[i]] = props.globalParams[fieldConfig.dependencies[i]]
                    } else {
                      flag = true
                    }
                  }
                  if (!flag) {
                    const resData = await baseService.post(fieldConfig.dyff, params)
                    if (resData.success && resData.data) options = resData.data
                  }
                }
              }
              // 更新字段选项
              fieldConfig.options = options

              // 如果当前值不在新选项中，重置字段值
              const currentValue = formData[depField]
              const valueExists =
                Array.isArray(options) &&
                (Array.isArray(currentValue)
                  ? currentValue.every((v) => options.some((opt: any) => opt.value === v))
                  : options.some((opt) => opt.value === currentValue))
              if (!valueExists) {
                formData[depField] = Array.isArray(currentValue) ? [] : ''
                await handleFieldChange(depField, formData[depField])
              }
            } catch (error) {
              console.error('加载联动选项失败:', error)
              ElMessage.error('加载选项失败，请重试')
            } finally {
              // 清除加载状态
              fieldConfig.loading = false
            }
          }
        }
      }

      // 表单验证
      if (formRef.value) {
        formRef.value.validateField(prop, (valid: boolean) => {
          emit('form-valid-change', { prop, valid, formData })
        })
      }
    }

    // 提交表单
    const submitForm = async () => {
      if (!formRef.value) return

      try {
        await formRef.value.validate()

        // 执行提交前的验证函数（如果有）
        if (props.beforeSubmit) {
          const canSubmit = await props.beforeSubmit(formData)
          if (!canSubmit) return
        }

        emit('submit', formData)
      } catch (error) {
        console.error('表单验证失败:', error)
        ElMessage.error('请检查表单填写是否正确')
      }
    }

    const handleUploadGroupChange = (files: any[]) => {
      // 进行分类处理
      const res = mergeByProp(files)
      if (Array.isArray(res)) {
        res.forEach((item: any) => {
          const uuids = item['uuids']
          const prop = item['prop']
          // 发出上传变化事件
          emit('upload-change', { prop, uuids, formData })
          // 发出字段变化事件
          handleFieldChange(item.prop, item.uuids)
        })
      }
    }

    const mergeByProp = (list: any[]) => {
      const map = new Map<string, any>()
      list.forEach((item) => {
        if (!map.has(item.prop)) {
          map.set(item.prop, {
            ...item,
            uuids: [item.uuid]
          })
        } else {
          map.get(item.prop).uuids.push(item.uuid)
        }
      })
      return Array.from(map.values())
    }

    // 处理上传变化
    const handleUploadChange = (prop: string, files: any[]) => {
      // 创建一个新的数组以确保响应式更新
      if (Array.isArray(files)) {
        const uuids: any = []
        // 只更新特定的上传字段，不影响其他表单数据
        files.forEach((item: any) => {
          if (typeof item === 'string') {
            uuids.push(item)
          } else {
            uuids.push(item.uuid)
          }
        })
        // 发出上传变化事件
        emit('upload-change', { prop, uuids, formData })
        // 发出字段变化事件
        handleFieldChange(prop, uuids)
      }
    }

    // 重置表单
    const resetForm = () => {
      if (formRef.value) {
        formRef.value.resetFields()
        emit('reset', formData)
      }
    }

    // 获取表单数据
    const getFormData = () => {
      return { ...formData }
    }

    // 设置表单数据
    const setFormData = (data: Record<string, any>) => {
      Object.keys(data).forEach((key) => {
        if (formData.hasOwnProperty(key)) {
          formData[key] = data[key]
        }
      })
    }

    // 设置单个表单项的值
    const setFieldValue = (prop: string, value: any) => {
      if (formData.hasOwnProperty(prop)) {
        formData[prop] = value
        handleFieldChange(prop, value)
        return true
      }
      return false
    }

    // 获取单个字段配置
    const getField = (prop: string) => {
      const field = props.fields.find((field) => field.prop === prop)
      return field ? { ...field } : null
    }

    // 更新字段配置
    const updateField = (prop: string, fieldConfig: Partial<FormField>) => {
      const fieldIndex = props.fields.findIndex((field) => field.prop === prop)
      if (fieldIndex !== -1) {
        Object.assign(props.fields[fieldIndex], fieldConfig)
        return true
      }
      return false
    }

    // 验证表单
    const validate = () => {
      return formRef.value ? formRef.value.validate() : Promise.reject('表单实例不存在')
    }

    // 验证特定字段
    const validateField = (prop: string) => {
      return formRef.value ? formRef.value.validateField(prop) : Promise.reject('表单实例不存在')
    }

    const shouldShowField = (field: FormField) => {
      if (field.hidden) {
        clearFieldValue(field)
        return false
      }
      if (!field.showWhen) return true

      let targetField: string
      let targetValue: any
      let defaultValue: any

      if (typeof field.showWhen === 'string') {
        targetField = field.showWhen
        targetValue = true
      } else {
        targetField = field.showWhen.field
        targetValue = field.showWhen.value
      }
      const currentValue = formData[targetField]
      let flag = false
      if (targetField === 'SFAQSC' || targetField === 'SFGMB') {
        if (field.prop !== 'GMBSM') {
          if (!currentValue || currentValue === 0 || currentValue === '0') {
            flag = true
          } else {
            flag = false
          }
        } else {
          if (!currentValue || currentValue === 1 || currentValue === '1') {
            flag = true
          } else {
            flag = false
          }
        }
      } else {
        if (!currentValue || currentValue === 1 || currentValue === '1') {
          flag = true
        } else {
          flag = false
        }
      }
      if (targetValue !== flag) {
        clearFieldValue(field)
        emit('clearFieldValue', field)
      }
      return flag === targetValue
    }

    const clearFieldValue = (field: FormField) => {
      if (field.defaultValue) {
        formData[field.prop] = field.defaultValue
      } else {
        // 根据字段类型设置默认值
        switch (field.type) {
          case 'checkbox':
            formData[field.prop] = []
            break
          case 'number':
            formData[field.prop] = 0
            break
          case 'switch':
            formData[field.prop] = false
            break
          case 'upload':
            formData[field.prop] = []
            break
          case 'date':
            formData[field.prop] = ''
            break
          case 'select':
            formData[field.prop] = field.multiple ? [] : ''
            break
          default:
            formData[field.prop] = ''
        }
      }
    }

    const clearFormExcept = (excludeFields: string[]) => {
      const preservedValues: Record<string, any> = {}
      excludeFields.forEach((field) => {
        if (formData.hasOwnProperty(field)) {
          preservedValues[field] = formData[field]
        }
      })

      Object.keys(formData).forEach((key) => {
        const field = props.fields.find((f) => f.prop === key)
        if (field) {
          clearFieldValue(field)
        }
      })

      Object.keys(preservedValues).forEach((key) => {
        formData[key] = preservedValues[key]
      })
    }

    // 暴露方法
    expose({
      loading,
      formRef,
      clearFormExcept,
      formData,
      getFormData,
      setFormData,
      validate,
      validateField,
      setFieldValue,
      getField,
      updateField,
      resetForm,
      handleUploadChange,
      shouldShowField
    })

    watch(
      () => props.isChange,
      (newVal) => {
        if (newVal) {
          initForm()
        }
      },
      {
        immediate: true
      }
    )

    return {
      handleUploadGroupChange,
      loading,
      formRef,
      formData,
      formRules,
      formRows,
      handleFieldChange,
      handleUploadChange,
      submitForm,
      shouldShowField,
      resetForm
    }
  }
})
</script>

<style scoped>
@import url(./index.less);
.dynamic-form-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  width: 100%;
}

:deep(.el-form-item__content) {
  margin: 0 !important;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  gap: 20px;
}
</style>
