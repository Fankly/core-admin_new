<template>
  <vxe-modal v-model="visible" destroy-on-close resize show-zoom :loading="loading" :title="modalTitle" width="860px" @close="handleClose">
    <el-form ref="formRef" :model="formData" label-position="right" label-suffix=":" label-width="110px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="附件类型" prop="fjType" :rules="[{ required: true, message: '请选择附件类型' }]">
            <el-select v-model="formData.fjType" clearable filterable placeholder="请选择附件类型" style="width: 100%">
              <el-option v-for="item in attachmentTypes" :key="item.code" :label="item.name" :value="item.code" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模板名称" prop="schemaName" :rules="[{ required: true, message: '请输入模板名称' }]">
            <el-input v-model.trim="formData.schemaName" clearable maxlength="100" placeholder="请输入模板名称" show-word-limit />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="schemaDesc">
            <el-input
              v-model.trim="formData.schemaDesc"
              clearable
              maxlength="500"
              placeholder="请输入备注"
              show-word-limit
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="Schema内容" prop="schemaJson" :rules="schemaJsonRules">
            <el-input
              v-model="formData.schemaJson"
              class="schema-editor"
              placeholder="请输入合法的JSON内容"
              resize="none"
              :rows="18"
              type="textarea"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <div class="modal-actions">
            <el-button v-debounce="[handleSave, `click`, 300]" size="mini" type="primary">保 存</el-button>
            <el-button v-debounce="[handleClose, `click`, 300]" size="mini" plain>关 闭</el-button>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </vxe-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { saveSchema } from '@/api/ai/xmAttachExtractSchemaMenu'
import type { SchemaRow } from '@/api/ai/xmAttachExtractSchemaMenu'

interface AttachmentTypeOption {
  code: string
  name: string
}

interface ModalParams {
  title: string
  row?: SchemaRow
}

interface FormData {
  fjType: string
  schemaId: string
  schemaJson: string
  schemaName: string
  schemaDesc: string
}

defineProps<{
  attachmentTypes: AttachmentTypeOption[]
}>()

const emit = defineEmits<{
  (event: 'saved'): void
}>()

const createEmptyForm = (): FormData => ({ fjType: '', schemaId: '', schemaJson: '', schemaName: '', schemaDesc: '' })

const visible = ref(false)
const loading = ref(false)
const modalTitle = ref('')
const formRef = ref<any>()
const formData = ref<FormData>(createEmptyForm())

const validateSchemaJson = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value?.trim()) return callback(new Error('请输入Schema内容'))
  try {
    JSON.parse(value)
    callback()
  } catch {
    callback(new Error('Schema内容不是合法的JSON'))
  }
}

const schemaJsonRules = [{ required: true, validator: validateSchemaJson, trigger: 'blur' }]

const handleClose = () => {
  formRef.value?.resetFields()
  formData.value = createEmptyForm()
  visible.value = false
}

const handleSave = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return

    const confirmResult = await VXETable.modal.confirm('是否保存，请确定！', '提示', { status: 'warning' })
    if (confirmResult !== 'confirm') return ElMessage.info('已取消')

    loading.value = true
    try {
      const res = await saveSchema({ ...formData.value })
      if (!res.success) return ElMessage.error(res.msg || '保存失败')
      ElMessage.success('保存成功！')
      emit('saved')
      handleClose()
    } catch (error) {
      ElMessage.error((error as Error).message || '保存失败')
    } finally {
      loading.value = false
    }
  })
}

const acceptParams = ({ title, row }: ModalParams) => {
  modalTitle.value = title
  formData.value = row
    ? {
        fjType: row.fjType || '',
        schemaId: row.schemaId || '',
        schemaJson: row.schemaJson || '',
        schemaName: row.schemaName || '',
        schemaDesc: row.schemaDesc || ''
      }
    : createEmptyForm()
  visible.value = true
}

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
.modal-actions {
  width: 100%;
  margin-top: 10px;
  text-align: center;
}

:deep(.schema-editor textarea) {
  font-family: Consolas, 'Courier New', monospace;
  line-height: 1.6;
}
</style>
