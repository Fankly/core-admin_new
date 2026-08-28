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
        <el-form class="air-modal-form" ref="ruleFormRef" label-suffix=":" label-width="80px" label-position="right" :model="formParams">
          <el-form-item label="目录名" prop="directoryName" :rules="[{ required: true, message: '请输入目录名', trigger: 'blur' }]">
            <el-input v-model.trim="formParams.directoryName" maxlength="50" clearable placeholder="请输入目录名" />
          </el-form-item>
          <el-form-item label="排序" prop="sortCode" :rules="[{ required: true, message: '请输入排序', trigger: 'blur' }]">
            <el-input type="number" v-model.trim="formParams.sortCode" maxlength="50" clearable placeholder="请输入排序" />
          </el-form-item>
          <el-form-item label="是否末级" prop="leaf">
            <el-switch
              :disabled="modalTitle == '编辑目录'"
              v-model="formParams.leaf"
              :active-value="'1'"
              :inactive-value="'0'"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-form>
        <div class="air-modal-footer">
          <el-button :loading="loading" :disabled="loading" size="mini" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
          <el-button :disabled="loading" size="mini" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
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
  parentId?: string
  directoryName: string
  sortCode?: number
  leaf?: number
}

const emit = defineEmits<{
  (e: 'success', val: DirectoryParams): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('新增目录')

const formParams = ref<DirectoryParams>({ id: '', parentId: '', directoryName: '', sortCode: 0, leaf: 0 })

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

const acceptParams = (params: Partial<DirectoryParams>) => {
  modalTitle.value = params.id ? '编辑目录' : '新增目录'
  formParams.value = {
    id: params.id || '',
    parentId: params.parentId || '',
    directoryName: params.directoryName || '',
    sortCode: params.sortCode || 0,
    leaf: params.leaf ?? 0
  }
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
