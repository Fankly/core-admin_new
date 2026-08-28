<template>
  <vxe-modal
    :model-value="modelValue"
    :loading="submitting"
    :title="dialogTitle"
    width="820"
    height="auto"
    resize
    show-zoom
    show-close
    destroy-on-close
    position="center"
    class-name="annual-key-task-form-modal"
    @close="closeDialog"
  >
    <div class="task-form-modal">
      <div class="task-form-modal__body">
        <el-form ref="formRef" :model="formData" :rules="rules" label-position="right" label-width="136px" label-suffix="：" class="task-form">
          <el-row :gutter="18">
            <el-col v-for="item in fields" :key="item.prop" :span="item.type === 'textarea' ? 24 : 12">
              <el-form-item :label="item.label" :prop="item.prop">
                <el-select v-if="item.type === 'select'" v-model="formData[item.prop]" :disabled="isReadonly" :placeholder="`请选择${item.label}`">
                  <el-option v-for="opt in yearOptions" :key="opt.yearCode" :label="opt.yearName" :value="opt.yearCode" />
                </el-select>
                <el-date-picker
                  v-else-if="item.type === 'date'"
                  v-model="formData[item.prop]"
                  type="date"
                  value-format="YYYY-MM-DD"
                  :disabled="isReadonly"
                  :placeholder="`请选择${item.label}`"
                />
                <el-input
                  v-else
                  v-model="formData[item.prop]"
                  :type="item.type === 'textarea' ? 'textarea' : 'text'"
                  :rows="item.type === 'textarea' ? 4 : undefined"
                  :maxlength="item.type === 'textarea' ? 1000 : 255"
                  :show-word-limit="item.type === 'textarea' && !isReadonly"
                  :readonly="isReadonly"
                  :placeholder="`请输入${item.label}`"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="task-form-modal__actions">
        <el-button v-if="!isReadonly" size="mini" type="primary" plain :loading="submitting" :disabled="submitting" @click="submitForm">
          保 存
        </el-button>
        <el-button size="mini" plain :disabled="submitting" @click="closeDialog">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { ElForm } from 'element-plus'
import type { AnnualKeyTaskRecord } from '@/api/xmInfo/annualKeyTask'
import { annualKeyTaskFields } from '../config'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    mode: 'add' | 'edit' | 'view'
    initialData?: AnnualKeyTaskRecord
    submitting?: boolean
    yearOptions?: Array<{
      yearCode: string
      yearName: string
    }>
  }>(),
  {
    initialData: () => ({}),
    submitting: false,
    yearOptions: () => []
  }
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'submit', value: AnnualKeyTaskRecord): void
}>()

interface AnnualKeyTaskFormRule {
  required: boolean
  message: string
  trigger: 'blur' | 'change'
}

const formRef = ref<InstanceType<typeof ElForm>>()
const formData = reactive<AnnualKeyTaskRecord>({})
const fields = annualKeyTaskFields

const isReadonly = computed(() => props.mode === 'view')
const dialogTitle = computed(() => {
  if (props.mode === 'add') return '新增年度重点任务'
  if (props.mode === 'edit') return '修改年度重点任务'
  return '查看年度重点任务'
})

const rules = fields.reduce<Record<string, AnnualKeyTaskFormRule[]>>((ruleMap, item) => {
  if (!item.required) return ruleMap
  const isChoice = item.type === 'date' || item.type === 'select'
  ruleMap[item.prop] = [
    {
      required: true,
      message: `${isChoice ? '请选择' : '请输入'}${item.label}`,
      trigger: isChoice ? 'change' : 'blur'
    }
  ]
  return ruleMap
}, {})

const resetFormData = () => {
  Object.keys(formData).forEach((key) => delete formData[key])
  fields.forEach((item) => {
    formData[item.prop] = props.initialData[item.prop] ?? ''
  })
  if (props.initialData.id !== undefined && props.initialData.id !== null) {
    formData.id = props.initialData.id
  }
}

watch(
  () => [props.modelValue, props.initialData, props.mode] as const,
  async ([visible]) => {
    if (!visible) return
    resetFormData()
    await nextTick()
    formRef.value?.clearValidate()
  },
  { immediate: true }
)

const submitForm = () => {
  if (isReadonly.value) return
  formRef.value?.validate((valid: boolean) => {
    if (!valid) return
    emit('submit', { ...formData })
  })
}

const closeDialog = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped lang="less">
.task-form-modal {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 0;
  overflow: hidden;
  background-color: #ffffff;
}

.task-form-modal__body {
  min-height: 0;
  padding: 18px 20px 8px;
  box-sizing: border-box;
  overflow: visible;
}

.task-form {
  :deep(.el-form-item__label) {
    color: #475569;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }

  :deep(.el-select),
  :deep(.el-date-editor.el-input) {
    width: 100%;
  }

  :deep(.el-textarea__inner) {
    border-radius: 6px;
    color: #475569;
    font-size: 13px;
  }
}

.task-form-modal__actions {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #eef2f6;
  background-color: #fcffff;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}
</style>

<style lang="less">
.annual-key-task-form-modal {
  .vxe-modal--body,
  .vxe-modal--content {
    height: auto;
    padding: 0;
    overflow: visible;
  }
}
</style>
