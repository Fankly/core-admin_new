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
          <el-form-item label="文件名">
            <span class="file-name-text" :title="formParams.attachName">{{ formParams.attachName || '-' }}</span>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model.trim="formParams.remark"
              type="textarea"
              :rows="4"
              maxlength="200"
              show-word-limit
              placeholder="请输入备注"
              resize="none"
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
  name: 'remarkModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'

interface RemarkParams {
  id: string
  attachName?: string
  remark?: string
}

const emit = defineEmits<{
  (e: 'success', val: { id: string; remark: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('编辑备注')

const formParams = ref<RemarkParams>({ id: '', attachName: '', remark: '' })

const handleClose = () => {
  ruleFormRef.value?.resetFields()
  isShowModal.value = false
}

const handleSave = () => {
  if (loading.value) return
  loading.value = true
  emit('success', { id: formParams.value.id, remark: formParams.value.remark || '' })
  loading.value = false
  handleClose()
}

const acceptParams = (params: RemarkParams) => {
  formParams.value = {
    id: params.id,
    attachName: params.attachName || '',
    remark: params.remark || ''
  }
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';

.file-name-text {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-regular, #475569);
  font-size: 13px;
}
</style>
