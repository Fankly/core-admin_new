<template>
  <div class="dropdown-table-selector">
    <el-input v-model="displayLabel" :placeholder="placeholder" readonly clearable @clear="handleClear" @click="openModal" class="selector-input">
      <template #suffix>
        <i class="el-icon-arrow-down"></i>
      </template>
    </el-input>
    <teleport to="body">
      <TableSelectorModal
        ref="modalRef"
        v-model="modalVisible"
        :title="title"
        :width="width"
        :height="height"
        :id-field="idField"
        :label-field="labelField"
        :search-fields="searchFields"
        :table-columns="tableColumns"
        :api="api"
        @confirm="handleConfirm"
        @close="handleClose"
      />
    </teleport>
  </div>
</template>

<script setup lang="ts" name="dropdownTableSelector">
import { ref, watch, defineProps, defineEmits } from 'vue'
import TableSelectorModal from './TableSelectorModal.vue'

interface SearchField {
  field: string
  label: string
  type?: string
}

interface TableColumn {
  field: string
  title: string
  width?: number
}

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  labelValue: {
    type: String,
    default: ''
  },
  idField: {
    type: String,
    required: true
  },
  labelField: {
    type: String,
    required: true
  },
  searchFields: {
    type: Array as () => SearchField[],
    default: () => []
  },
  tableColumns: {
    type: Array as () => TableColumn[],
    required: true
  },
  api: {
    type: Function,
    required: true
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  title: {
    type: String,
    default: '选择数据'
  },
  width: {
    type: [String, Number],
    default: '70%'
  },
  height: {
    type: [String, Number],
    default: '600px'
  }
})

const emit = defineEmits(['update:modelValue', 'update:labelValue', 'change', 'confirm'])

const modalRef = ref()
const modalVisible = ref(false)
const displayLabel = ref('')

watch(
  () => props.labelValue,
  (newVal) => {
    displayLabel.value = newVal
  },
  { immediate: true }
)

const openModal = () => {
  modalVisible.value = true
  modalRef.value?.open()
}

const handleConfirm = ({ id, label, ...someData }: { id: string | number; label: string; [key: string]: any }) => {
  displayLabel.value = label
  emit('update:modelValue', id)
  emit('update:labelValue', label)
  emit('change', { id: id, label: label })
  emit('confirm', { id, label, ...someData })
  modalVisible.value = false
}

const handleClose = () => {
  modalVisible.value = false
}

const handleClear = () => {
  displayLabel.value = ''
  emit('update:modelValue', '')
  emit('update:labelValue', '')
  emit('change', { id: '', label: '' })
}

defineExpose({
  openModal,
  handleClear
})
</script>

<style scoped lang="less">
.dropdown-table-selector {
  width: 100%;

  .selector-input {
    :deep(.el-input__suffix) {
      cursor: pointer;
    }

    :deep(input) {
      cursor: pointer;
    }
  }
}
</style>
