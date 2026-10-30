<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="480px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="air-modal-body air-modal-body--form">
      <div class="air-modal-panel">
        <el-form class="air-modal-form" ref="ruleFormRef" label-suffix=":" label-width="120px" label-position="right" :model="formParams">
          <el-form-item label="方案编码" prop="code" :rules="[{ required: true, message: '请输入方案编码', trigger: 'blur' }]">
            <el-input v-model.trim="formParams.code" :disabled="modalTitle === '编辑方案'" maxlength="50" clearable placeholder="请输入方案编码" />
          </el-form-item>
          <el-form-item label="方案名称" prop="name" :rules="[{ required: true, message: '请输入方案名称', trigger: 'blur' }]">
            <el-input v-model.trim="formParams.name" maxlength="50" clearable placeholder="请输入方案名称" />
          </el-form-item>
        </el-form>
        <div class="air-modal-footer">
          <el-button :loading="loading" :disabled="loading" size="small" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
          <el-button :disabled="loading" size="small" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'directoryModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'

interface DirectoryParams {
  id?: string
  code: string
  name: string
}

const emit = defineEmits<{
  (e: 'success', val: DirectoryParams): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('新增方案')

const formParams = ref<DirectoryParams>({ id: '', code: '', name: '' })

const handleClose = () => {
  ruleFormRef.value?.resetFields()
  isShowModal.value = false
}

const handleSave = () => {
  if (loading.value) return
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    try {
      emit('success', { ...formParams.value })
      handleClose()
    } finally {
      loading.value = false
    }
  })
}

const acceptParams = (params: Partial<DirectoryParams> = {}) => {
  modalTitle.value = params.id ? '编辑方案' : '新增方案'
  formParams.value = {
    id: params.id || '',
    code: params.code || '',
    name: params.name || ''
  }
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
