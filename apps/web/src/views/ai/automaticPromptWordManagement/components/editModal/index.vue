<!-- 提示词管理：新增 / 编辑弹窗 -->
<template>
  <vxe-modal
    ref="modalRef"
    class-name="prompt-word-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="720px"
    @close="handleClose"
    :loading="loading"
  >
    <div class="pwm-modal-body">
      <div class="pwm-modal-panel">
        <el-form class="pwm-modal-form" ref="ruleFormRef" label-suffix=":" label-width="110px" label-position="right" :model="formData">
          <el-row :gutter="0">
            <el-col :span="24">
              <el-form-item label="提示词编码" prop="promptCode" :rules="[{ required: true, message: '请输入提示词编码' }]">
                <el-input
                  clearable
                  :maxlength="64"
                  show-word-limit
                  v-model.trim="formData.promptCode"
                  placeholder="请输入提示词编码，如 PROMPT_AUDIT_001"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="提示词内容" prop="promptContent" :rules="[{ required: true, message: '请输入提示词内容' }]">
                <el-input
                  clearable
                  :maxlength="5000"
                  show-word-limit
                  resize="none"
                  type="textarea"
                  :rows="8"
                  v-model.trim="formData.promptContent"
                  placeholder="请输入提示词内容"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="pwm-modal-footer">
          <el-button :loading="loading" :disabled="loading" size="small" v-debounce="[handleSave, `click`, 300]" type="primary">保 存</el-button>
          <el-button :disabled="loading" size="small" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'automaticPromptWordManagementEditModal'
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getPromptTemplateDetail, saveOrUpdatePromptTemplate } from '@/api/ai/automaticPromptWordManagement'
import type { PromptTemplateVO } from '@/api/ai/automaticPromptWordManagement'

/** 弹窗参数 */
interface ModalParams {
  type: string
  searchParams: Partial<PromptTemplateVO>
}

interface PromptWordFormData {
  templateId?: string | number | null
  promptCode: string
  promptContent: string
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const ruleFormRef = ref()
const modalTitle = ref('')

const createEmptyForm = (): PromptWordFormData => ({ templateId: null, promptCode: '', promptContent: '' })
const formData = ref<PromptWordFormData>(createEmptyForm())

const handleClose = () => {
  ruleFormRef.value?.resetFields()
  formData.value = createEmptyForm()
  isShowModal.value = false
}

const handleSave = () => {
  if (loading.value) return
  ruleFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    try {
      const type = await VXETable.modal.confirm('是否保存，请确定！', '提示', {
        status: 'warning'
      })
      if (type !== 'confirm') {
        ElMessage.info('已取消')
        return
      }
    } catch {
      return
    }

    loading.value = true
    try {
      const res = await saveOrUpdatePromptTemplate({
        templateId: formData.value.templateId ?? null,
        promptCode: formData.value.promptCode,
        promptContent: formData.value.promptContent
      })
      if (res.success) {
        ElMessage.success('保存成功！')
        emit('searchHandle', { param: 'success' })
        handleClose()
      } else {
        // 编码重复等校验失败：直接把后端提示抛给用户
        ElMessage.error(res.msg)
      }
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      loading.value = false
    }
  })
}

const acceptParams = async (params: ModalParams) => {
  modalTitle.value = params.type
  formData.value = {
    templateId: params.searchParams.templateId ?? null,
    promptCode: params.searchParams.promptCode || '',
    promptContent: params.searchParams.promptContent || ''
  }
  isShowModal.value = true

  // 编辑：按主键拉一次最新内容回填（失败时保留列表带入的数据）
  const templateId = formData.value.templateId
  if (templateId === null || templateId === undefined || templateId === '') return
  loading.value = true
  try {
    const res = await getPromptTemplateDetail(templateId)
    if (res?.success && res.data) {
      formData.value = {
        templateId: res.data.templateId,
        promptCode: res.data.promptCode || '',
        promptContent: res.data.promptContent || ''
      }
    }
  } catch (e) {
    // http 层已提示错误，保留列表数据
  } finally {
    loading.value = false
  }
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';
</style>
