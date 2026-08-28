<template>
  <vxe-modal
    :model-value="modelValue"
    :loading="submitting"
    :title="`${mode === 'add' ? '新增' : '编辑'}自有房产`"
    width="1120"
    height="680"
    resize
    show-zoom
    show-close
    destroy-on-close
    position="center"
    class-name="real-estate-form-modal"
    @close="closeDialog"
  >
    <div class="estate-form-modal">
      <div class="estate-form-modal__body">
        <div ref="formContentRef" class="estate-form-modal__content">
          <el-form ref="formRef" :model="formData" :rules="rules" label-position="right" label-width="150px" label-suffix="：" class="estate-form">
            <div v-for="section in formSections" :key="section.key" class="estate-form__section" :class="{ 'is-root-tail': section.rootTail }">
              <div v-if="section.label" class="estate-form__section-header">
                <h3 :id="`estate-form-section-${section.key}`" class="estate-form__section-title">
                  <i class="vxe-icon-info-circle-fill" aria-hidden="true"></i>
                  {{ section.label }}
                </h3>
              </div>

              <div v-for="(block, blockIndex) in section.blocks" :key="`${section.key}-${block.label || blockIndex}`" class="estate-form__block">
                <h4 v-if="block.label" class="estate-form__block-title">{{ block.label }}</h4>
                <el-row :gutter="18">
                  <el-col v-for="item in block.fields" :key="item.prop" :span="item.type === 'textarea' ? 24 : 12">
                    <el-form-item :label="item.label" :prop="item.prop">
                      <el-input-number
                        v-if="item.type === 'number'"
                        v-model="formData[item.prop]"
                        :precision="item.prop.includes('cs') || item.prop === 'jcnf' ? 0 : 4"
                        :controls="false"
                        :disabled="item.readonly"
                        :placeholder="`请输入${item.label}`"
                      />
                      <el-date-picker
                        v-else-if="item.type === 'date'"
                        v-model="formData[item.prop]"
                        type="date"
                        value-format="YYYY-MM-DD"
                        :disabled="item.readonly"
                        :placeholder="`请选择${item.label}`"
                      />
                      <el-select
                        v-else-if="item.type === 'boolean'"
                        v-model="formData[item.prop]"
                        clearable
                        :disabled="item.readonly"
                        :placeholder="`请选择${item.label}`"
                      >
                        <el-option label="是" value="1" />
                        <el-option label="否" value="0" />
                      </el-select>
                      <el-input
                        v-else
                        v-model="formData[item.prop]"
                        :type="item.type === 'textarea' ? 'textarea' : 'text'"
                        :rows="item.type === 'textarea' ? 4 : undefined"
                        :maxlength="item.type === 'textarea' ? 1000 : 255"
                        :show-word-limit="item.type === 'textarea'"
                        :readonly="item.readonly"
                        :placeholder="`请输入${item.label}`"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-form>
        </div>
      </div>

      <div class="estate-form-modal__actions">
        <el-button size="mini" type="primary" plain :loading="submitting" :disabled="submitting" @click="submitForm">保 存</el-button>
        <el-button size="mini" plain :disabled="submitting" @click="closeDialog">关 闭</el-button>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { ElForm } from 'element-plus'
import type { RealEstateRecord } from '@/api/xmInfo/ownRealEstate'
import { realEstateFields } from '../config'

const props = defineProps<{
  modelValue: boolean
  mode: 'add' | 'edit'
  initialData?: RealEstateRecord
  submitting?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'submit', value: RealEstateRecord): void
}>()

const formRef = ref<InstanceType<typeof ElForm>>()
const formContentRef = ref<HTMLElement>()
const formData = reactive<RealEstateRecord>({})

type EstateField = typeof realEstateFields[number]

interface EstateFormBlock {
  label?: string
  fields: EstateField[]
}

interface EstateFormSection {
  key: string
  label?: string
  rootTail?: boolean
  blocks: EstateFormBlock[]
}

const realEstateFieldMap = new Map(realEstateFields.map((item) => [item.prop, item]))
const selectFields = (props: string[]) => props.map((prop) => realEstateFieldMap.get(prop)).filter((item): item is EstateField => Boolean(item))

const formSections = computed<EstateFormSection[]>(() => [
  {
    key: 'estate',
    label: '自有房产',
    blocks: [{ fields: selectFields(['qkjzybm', 'swid', 'cqdw', 'dataId']) }]
  },
  {
    key: 'basic',
    label: '房产基本信息',
    blocks: [
      { fields: selectFields(['sstdbh', 'sstd', 'fcbh', 'fcmc']) },
      { label: '地址信息', fields: selectFields(['province', 'city', 'county', 'street', 'location', 'lal']) },
      {
        fields: selectFields([
          'ly',
          'tzly',
          'zjly',
          'fcqdsj',
          'fcdl',
          'fcxl',
          'fclx',
          'jzmj',
          'zytdmj',
          'rjl',
          'dscs',
          'dxcs',
          'zjzcs',
          'jcnf',
          'wgtp',
          'wgtpUuid'
        ])
      }
    ]
  },
  {
    key: 'certificate',
    label: '权证信息',
    blocks: [
      { fields: selectFields(['sfyz']) },
      { label: '有证', fields: selectFields(['bdcqzh', 'fczzrmc', 'qztp', 'qztpUuid', 'zdt']) },
      { fields: selectFields(['wzyy']) }
    ]
  },
  {
    key: 'usage',
    label: '使用情况(平方米)',
    blocks: [{ fields: selectFields(['ysymj', 'zymj', 'czmj', 'bzymj', 'xzmj']) }]
  },
  {
    key: 'rental',
    label: '出租情况',
    blocks: [{ fields: selectFields(['ljnzj']) }]
  },
  {
    key: 'asset',
    label: '资产汇总信息',
    blocks: [{ fields: selectFields(['zckp', 'zcyz', 'ljzj', 'zcjz', 'zczt', 'zcyt']) }]
  },
  {
    key: 'estate-tail',
    rootTail: true,
    blocks: [
      { fields: selectFields(['sybgdw', 'sybgbz', 'sybgr', 'gkglbm']) },
      { fields: selectFields(['ssxzsbbm', 'ssxzmc', 'xmbmWbs', 'fssbZcbm']) },
      { fields: selectFields(['remart']) }
    ]
  }
])

const rules = computed(() =>
  Object.fromEntries(
    realEstateFields.filter((item) => item.required).map((item) => [item.prop, [{ required: true, message: `请输入${item.label}`, trigger: 'blur' }]])
  )
)

const normalizeDate = (value: unknown) => {
  if (value === null || value === undefined || value === '') return ''
  const text = String(value).trim()
  const datePart = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (datePart) {
    const year = Number(datePart[1])
    const month = Number(datePart[2])
    const day = Number(datePart[3])
    const date = new Date(year, month - 1, day)
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : text)
  if (Number.isNaN(date.getTime())) return value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return undefined
  const normalized = typeof value === 'string' ? value.replace(/,/g, '').trim() : value
  if (normalized === '') return undefined
  const numberValue = typeof normalized === 'number' ? normalized : Number(normalized)
  return Number.isFinite(numberValue) ? numberValue : undefined
}

const normalizeBoolean = (value: unknown) => {
  if (value === null || value === undefined || value === '') return ''
  if (value === true || value === 1) return '1'
  if (value === false || value === 0) return '0'

  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', '是'].includes(normalized)) return '1'
  if (['0', 'false', 'no', 'n', '否'].includes(normalized)) return '0'
  return String(value)
}

const normalizeFieldValue = (item: EstateField, value: unknown) => {
  if (item.type === 'number') return normalizeNumber(value)
  if (item.type === 'date') return normalizeDate(value)
  if (item.type === 'boolean') return normalizeBoolean(value)
  return value ?? ''
}

const resetForm = () => {
  Object.keys(formData).forEach((key) => delete formData[key])
  const source = props.initialData || {}
  realEstateFields.forEach((item) => {
    formData[item.prop] = normalizeFieldValue(item, source[item.prop])
  })
  Object.entries(source).forEach(([key, value]) => {
    if (!(key in formData)) formData[key] = value
  })
  nextTick(() => formRef.value?.clearValidate())
}

const closeDialog = () => {
  if (props.submitting) return
  emit('update:modelValue', false)
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    const payload: RealEstateRecord = { ...formData }
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '' || payload[key] === undefined) payload[key] = null
    })
    emit('submit', payload)
  } catch {
    await nextTick()
    const invalidControl = formContentRef.value?.querySelector<HTMLElement>(
      '.el-form-item.is-error [tabindex="0"], .el-form-item.is-error input, .el-form-item.is-error textarea'
    )
    invalidControl?.scrollIntoView({ block: 'center' })
    invalidControl?.focus({ preventScroll: true })
  }
}

watch(
  () => [props.modelValue, props.initialData] as const,
  ([visible]) => {
    if (visible) resetForm()
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
@primary-color: #00706b;
@primary-active: #005f5a;
@primary-soft: #f2f9f8;
@primary-hover-fill: #e6f4f3;
@primary-border-soft: #b8ddd9;
@border-soft: #e2e8f0;
@border-faint: #eef2f6;
@text-regular: #475569;
@text-muted: #64748b;

.estate-form-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: @text-regular;

  :deep(.el-button) {
    height: 28px;
    min-height: 28px;
    margin-left: 0;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  :deep(.el-button--primary),
  :deep(.el-button--primary.is-plain) {
    color: @primary-color !important;
    background-color: @primary-soft !important;
    background-image: none !important;
    border-color: @primary-border-soft !important;
  }

  :deep(.el-button--primary:hover:not(.is-disabled)),
  :deep(.el-button--primary:focus:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:hover:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:focus:not(.is-disabled)) {
    color: @primary-color !important;
    background-color: @primary-hover-fill !important;
    border-color: @primary-color !important;
  }

  :deep(.el-button--primary:active:not(.is-disabled)),
  :deep(.el-button--primary.is-plain:active:not(.is-disabled)) {
    color: @primary-active !important;
    border-color: @primary-active !important;
  }
}

.estate-form-modal__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 10px 16px;
  border-top: 1px solid @border-faint;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.estate-form-modal__body {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid @border-soft;
}

.estate-form-modal__content {
  width: 100%;
  height: 100%;
  padding: 14px 20px 8px;
  box-sizing: border-box;
  overflow: auto;
  background-color: #ffffff;
  scrollbar-color: @primary-border-soft transparent;
  scrollbar-width: thin;
}

.estate-form__section {
  &.is-root-tail {
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid @border-faint;
  }
}

.estate-form__section-header {
  margin: 24px 0 14px;
}

.estate-form__section:first-child .estate-form__section-header {
  margin-top: 0;
}

.estate-form__section-title {
  display: flex;
  align-items: center;
  margin: 0;
  color: @primary-color;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;

  i {
    margin-right: 8px;
    font-size: 14px;
  }
}

.estate-form__block-title {
  margin: 2px 0 12px;
  color: @text-muted;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.estate-form__block + .estate-form__block .estate-form__block-title {
  margin-top: 4px;
}

.estate-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    box-sizing: border-box;
    color: @text-regular;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
  }

  :deep(.el-input),
  :deep(.el-input-number),
  :deep(.el-select),
  :deep(.el-date-editor) {
    width: 100%;
  }

  :deep(.el-input__inner) {
    height: 32px;
  }

  :deep(.el-input__inner),
  :deep(.el-textarea__inner) {
    border-color: @border-soft;
    border-radius: 6px;
    color: @text-regular;

    &:hover {
      border-color: @primary-border-soft;
    }

    &:focus,
    &:focus-visible {
      border-color: @primary-color;
      outline: 2px solid fade(@primary-color, 22%);
      outline-offset: 2px;
    }
  }

  :deep(.el-select:focus-within),
  :deep(.el-date-editor:focus-within) {
    border-radius: 6px;
    outline: 2px solid fade(@primary-color, 22%);
    outline-offset: 2px;
  }

  :deep(.el-input__inner::placeholder),
  :deep(.el-textarea__inner::placeholder) {
    color: @text-muted;
  }

  :deep(.el-form-item__error) {
    padding-top: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.el-input__inner),
  :deep(.el-textarea__inner) {
    transition: none !important;
  }
}
</style>
