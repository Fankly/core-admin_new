<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-range-modal"
    destroy-on-close
    resize
    show-zoom
    :loading="loading"
    :title="modalTitle"
    width="680px"
    @close="handleClose"
  >
    <div class="air-modal-body air-modal-body--form">
      <div class="air-modal-panel">
        <el-form ref="formRef" class="air-modal-form" label-suffix=":" label-width="110px" label-position="right" :model="formData">
          <el-form-item label="相似性匹配" prop="similarityJson">
            <el-input
              v-model="formData.similarityJson"
              type="textarea"
              :rows="12"
              placeholder="请输入相似性匹配内容"
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
  name: 'similarityModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { aiAuditSimilarityEdit } from '@/api/suzhou/aiAuditInuseRange'

interface ModalParams {
  type: string
  searchParams: {
    proTypeList: string[]
    similarityJson?: string
  }
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const formRef = ref()
const modalTitle = ref('')
const formData = ref({ proTypeList: [] as string[], similarityJson: '' })

const handleClose = () => {
  formRef.value?.resetFields()
  isShowModal.value = false
}

const handleSave = () => {
  if (loading.value) return
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', { status: 'warning' })
      if (type !== 'confirm') return ElMessage.info('已取消')
    } catch {
      return
    }

    loading.value = true
    try {
      const res = await aiAuditSimilarityEdit(formData.value)
      if (!res.success) return ElMessage.error(res.msg || '保存失败')
      ElMessage.success('保存成功！')
      emit('searchHandle', { param: 'success' })
      handleClose()
    } catch (error) {
      ElMessage.error((error as Error).message || '保存失败')
    } finally {
      loading.value = false
    }
  })
}

const acceptParams = (params: ModalParams) => {
  const searchParams = params.searchParams || { proTypeList: [] }
  modalTitle.value = params.type
  formData.value = {
    proTypeList: [...(searchParams.proTypeList || [])],
    // 批量编辑不回显，避免误将某一行的内容覆盖到全部选中项目类型。
    similarityJson: params.type === '编辑' ? String(searchParams.similarityJson || '') : ''
  }
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
