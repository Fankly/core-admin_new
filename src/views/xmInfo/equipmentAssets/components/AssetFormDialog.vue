<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`${mode === 'add' ? '新增' : '编辑'}${config.label}`"
    width="980px"
    top="6vh"
    custom-class="equipment-asset-dialog"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <div class="asset-form-shell">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" class="asset-form">
        <el-tabs v-model="activeGroup" tab-position="left" class="asset-form-tabs">
          <el-tab-pane v-for="group in fieldGroups" :key="group.name" :name="group.name" :label="group.name">
            <div class="asset-form-grid">
              <el-form-item v-for="item in group.fields" :key="item.prop" :label="item.label" :prop="item.prop">
                <el-input-number
                  v-if="item.type === 'number'"
                  v-model="formData[item.prop]"
                  :precision="item.prop === 'defectquantity' ? 0 : 2"
                  :controls="false"
                  :placeholder="`请输入${item.label}`"
                />
                <el-date-picker
                  v-else-if="item.type === 'date'"
                  v-model="formData[item.prop]"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :placeholder="`请选择${item.label}`"
                />
                <el-select v-else-if="item.type === 'boolean'" v-model="formData[item.prop]" clearable :placeholder="`请选择${item.label}`">
                  <el-option label="是" value="1" />
                  <el-option label="否" value="0" />
                </el-select>
                <el-input
                  v-else
                  v-model="formData[item.prop]"
                  :type="item.type === 'textarea' ? 'textarea' : 'text'"
                  :rows="item.type === 'textarea' ? 3 : undefined"
                  :disabled="mode === 'edit' && item.prop === config.projectField"
                  :maxlength="item.type === 'textarea' ? 1000 : 255"
                  show-word-limit
                  :placeholder="`请输入${item.label}`"
                />
              </el-form-item>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer-actions">
        <el-button @click="dialogVisible = false">关 闭</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          <Save :size="15" aria-hidden="true" />
          <span>保 存</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Save } from 'lucide-vue-next'
import type { ElForm } from 'element-plus'
import type { AssetKind, AssetRecord } from '@/api/xmInfo/equipmentAssets'
import { assetKindConfigs } from '../config'

const props = defineProps<{
  modelValue: boolean
  kind: AssetKind
  mode: 'add' | 'edit'
  initialData?: AssetRecord
  projectKey: string
  submitting?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'submit', value: AssetRecord): void
}>()

const formRef = ref<InstanceType<typeof ElForm>>()
const formData = reactive<AssetRecord>({})
const activeGroup = ref('')

const config = computed(() => assetKindConfigs[props.kind])
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const fieldGroups = computed(() => {
  const groups = new Map<string, typeof config.value.fields>()
  config.value.fields.forEach((item) => {
    const fields = groups.get(item.group) || []
    fields.push(item)
    groups.set(item.group, fields)
  })
  return Array.from(groups.entries()).map(([name, fields]) => ({ name, fields }))
})

const rules = computed(() => {
  const result: Record<string, any[]> = {}
  config.value.fields.forEach((item) => {
    if (item.required) {
      result[item.prop] = [{ required: true, message: `请输入${item.label}`, trigger: 'blur' }]
    }
  })
  return result
})

const normalizeDate = (value: any) => {
  if (!value) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const resetForm = () => {
  Object.keys(formData).forEach((key) => delete formData[key])
  const source = props.initialData || {}
  config.value.fields.forEach((item) => {
    const value = source[item.prop]
    formData[item.prop] = item.type === 'date' ? normalizeDate(value) : value ?? ''
  })
  if (source.id != null) formData.id = source.id
  if (props.mode === 'add') formData[config.value.projectField] = props.projectKey
  activeGroup.value = fieldGroups.value[0]?.name || ''
  nextTick(() => formRef.value?.clearValidate())
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    const payload: AssetRecord = { ...formData }
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') payload[key] = null
    })
    emit('submit', payload)
  } catch {
    return
  }
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) resetForm()
  }
)
</script>

<style scoped lang="less">
.asset-form-shell {
  height: min(640px, 72vh);
  min-height: 420px;
  overflow: hidden;
  background: #ffffff;
}

.asset-form {
  height: 100%;
}

.asset-form-tabs {
  height: 100%;

  :deep(.el-tabs__header) {
    width: 156px;
    margin-right: 18px;
    padding: 8px 0;
    background: #f5fbfb;
    border-right: 1px solid #e2e8f0;
  }

  :deep(.el-tabs__item) {
    height: 42px;
    color: #475569;
    font-size: 13px;
    letter-spacing: 0;

    &:hover,
    &.is-active {
      color: #00706b;
    }

    &.is-active {
      background: #e6f4f3;
      font-weight: 600;
    }
  }

  :deep(.el-tabs__active-bar) {
    width: 3px;
    background: #00706b;
  }

  :deep(.el-tabs__content),
  :deep(.el-tab-pane) {
    height: 100%;
    overflow: auto;
  }
}

.asset-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 18px;
  padding: 14px 18px 22px 0;

  :deep(.el-form-item) {
    margin-bottom: 17px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 7px;
    color: #475569;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.3;
  }

  :deep(.el-input),
  :deep(.el-input-number),
  :deep(.el-select),
  :deep(.el-date-editor) {
    width: 100%;
  }

  :deep(.el-input__inner),
  :deep(.el-textarea__inner) {
    border-radius: 6px;
    border-color: #d6e0e5;
    letter-spacing: 0;

    &:hover {
      border-color: #b8ddd9;
    }

    &:focus {
      border-color: #00706b;
    }
  }

  :deep(.el-textarea) {
    grid-column: 1 / -1;
  }
}

.dialog-footer-actions {
  display: flex;
  justify-content: center;
  gap: 10px;

  .el-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 82px;
    height: 36px;
    margin: 0;
    border-radius: 6px;
    letter-spacing: 0;
  }

  .el-button--primary {
    color: #ffffff;
    background: #00706b;
    border-color: #00706b;

    &:hover,
    &:focus {
      background: #2a9a92;
      border-color: #2a9a92;
    }
  }
}
</style>
