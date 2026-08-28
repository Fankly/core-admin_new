<template>
  <div class="copy-text-box">
    <el-input
      v-model="inputValue"
      :title="inputValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :clearable="true"
      @input="handleSingleInput"
      @change="handleInputChange"
      @clear="clear"
      class="copy-text-input"
      size="small"
    >
      <template #prepend v-if="showPrepend">
        <div class="input-prepend">{{ prependLabel }}</div>
      </template>
      <template #append>
        <el-button
          @click="addData"
          :icon="dialogIcon"
          :disabled="disabled"
          :type="buttonType"
          :title="tooltipText || dialogTitle"
          :aria-label="tooltipText || dialogTitle"
          class="add-button"
          size="small"
        ></el-button>
      </template>
    </el-input>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="dialogVisible" class="modal-backdrop">
          <div class="modal-container" :style="{ width: dialogWidth }">
            <div class="modal-header">
              <h3 class="modal-title">{{ dialogTitle }}</h3>
            </div>
            <div class="modal-body">
              <div class="dialog-tips" v-if="showTips">
                <div class="tips-icon">
                  <i class="el-icon-info"></i>
                  <span>每行一个值,确认后将以逗号隔开(最多支持1000行)</span>
                </div>
              </div>
              <div class="modal-content">
                <el-input
                  resize="none"
                  type="textarea"
                  v-model="ids"
                  :rows="rows"
                  :placeholder="placeholder"
                  class="batch-textarea"
                  ref="textareaRef"
                  @input="handleTextareaInput"
                ></el-input>
                <div v-if="showWordLimit" class="line-count" :class="{ 'line-count-exceed': currentLineCount > maxLines }">
                  {{ currentLineCount }} / {{ maxLines }}
                </div>
              </div>
              <div class="dialog-actions">
                <el-button @click="cancel" :plain="true" size="small">取 消</el-button>
                <el-button @click="determine" type="primary" size="small">确 定</el-button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts" name="ReMultipleText">
import { ElMessage } from 'element-plus'
import type { PropType } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  maxlength: {
    type: [String, Number] as PropType<string | number>,
    default: 100
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '请输入值,多个值用逗号分隔'
  },
  dialogTitle: {
    type: String,
    default: '批量输入'
  },
  showTips: {
    type: Boolean,
    default: true
  },
  dialogIcon: {
    type: String,
    default: 'el-icon-circle-plus-outline'
  },
  tooltipText: {
    type: String,
    default: '批量输入'
  },
  buttonType: {
    type: String,
    default: 'primary'
  },
  dialogWidth: {
    type: String,
    default: '450px'
  },
  rows: {
    type: Number,
    default: 8
  },
  showPrepend: {
    type: Boolean,
    default: false
  },
  prependLabel: {
    type: String,
    default: '编码'
  },
  showWordLimit: {
    type: Boolean,
    default: true
  },
  maxLines: {
    type: Number,
    default: 10000
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const dialogVisible = ref(false)
const ids = ref('')
const inputValue = ref('')
const textareaRef = ref<any>(null)

const normalizeText = (value: string) => value.replace(/\r\n/g, '\n').replace(/，/g, ',')

const splitValues = (value: string) =>
  normalizeText(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)

const joinValues = (value: string) => splitValues(value).join(',')

const splitNonEmptyLines = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const normalizeSingleInputValue = (value: string) => {
  const normalizedValue = value.replace(/，/g, ',')
  const max = normalizedMaxlength.value

  if (!max) {
    return normalizedValue
  }

  return normalizedValue
    .split(',')
    .map((item) => (item.length > max ? item.slice(0, max) : item))
    .join(',')
}

const normalizeTextareaValue = (value: string) => {
  const max = normalizedMaxlength.value
  const lines = value.replace(/\r\n/g, '\n').split('\n')

  if (!max) {
    return lines.join('\n')
  }

  return lines.map((line) => (line.length > max ? line.slice(0, max) : line)).join('\n')
}

const normalizedMaxlength = computed(() => {
  const length = Number(props.maxlength)
  return Number.isFinite(length) && length > 0 ? length : undefined
})

const currentLineCount = computed(() => splitNonEmptyLines(ids.value).length)

const emitValue = (value: string) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const validateLineLimit = (lineCount: number) => {
  if (lineCount > props.maxLines) {
    ElMessage.warning(`最多支持${props.maxLines}行数据`)
    return false
  }
  return true
}

watch(
  () => props.modelValue,
  (newVal) => {
    inputValue.value = joinValues(newVal || '')
  },
  { immediate: true }
)

watch(dialogVisible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      const input = textareaRef.value?.textarea || textareaRef.value?.$el?.querySelector('textarea')
      input?.focus?.()
    })
  }
})

const handleSingleInput = (value: string) => {
  const nextValue = normalizeSingleInputValue(value)
  if (nextValue !== inputValue.value) {
    inputValue.value = nextValue
  }
}

const handleInputChange = (value: string) => {
  const items = splitValues(normalizeSingleInputValue(value))

  const cleanedValue = items.join(',')
  inputValue.value = cleanedValue
  emitValue(cleanedValue)
}

const handleTextareaInput = (value: string) => {
  const nextValue = normalizeTextareaValue(value)
  if (nextValue !== ids.value) {
    ids.value = nextValue
  }
}

const addData = () => {
  ids.value = splitValues(inputValue.value || props.modelValue || '').join('\n')
  dialogVisible.value = true
}

const cancel = () => {
  dialogVisible.value = false
}

const determine = () => {
  ids.value = normalizeTextareaValue(ids.value)
  const lineCount = splitNonEmptyLines(ids.value).length
  const items = splitValues(ids.value)
  if (items.length === 0) {
    clear()
    dialogVisible.value = false
    return
  }

  if (!validateLineLimit(lineCount)) {
    return
  }

  const value = items.join(',')
  ids.value = items.join('\n')
  inputValue.value = value
  emitValue(value)
  dialogVisible.value = false
}

const clear = () => {
  emitValue('')
  ids.value = ''
  inputValue.value = ''
}
</script>

<style scoped lang="less">
@import url('./index');
</style>
