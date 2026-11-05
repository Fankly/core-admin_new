<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="ai-audit-range-modal"
    resize
    show-zoom
    destroy-on-close
    :loading="loading"
    :title="modalTitle"
    width="760px"
    @close="handleClose"
  >
    <div class="air-modal-body air-modal-body--form">
      <div class="air-modal-panel">
        <el-form
          ref="formRef"
          class="air-modal-form document-config-form"
          label-suffix=":"
          label-width="160px"
          label-position="right"
          :model="formData"
        >
          <el-row :gutter="0">
            <el-col :span="12">
              <el-form-item label="项目类型" prop="id" :rules="isAdd ? [{ required: true, message: '请选择项目类型', trigger: 'change' }] : []">
                <el-select
                  v-if="isAdd"
                  v-model="formData.id"
                  clearable
                  filterable
                  placeholder="请选择未配置的项目类型"
                  style="width: 100%"
                  @change="handleProjectTypeChange"
                >
                  <el-option v-for="item in projectTypeOptions" :key="item.id" :label="item.proTypeName" :value="item.id" />
                </el-select>
                <el-input v-else :model-value="formData.proTypeName" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="专业" prop="zy">
                <el-input v-model="formData.zy" clearable placeholder="请输入专业" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Word文档大小上限" prop="maxDocFileSize">
                <el-input-number
                  v-model="formData.maxDocFileSize"
                  :min="0"
                  :precision="0"
                  controls-position="right"
                  placeholder="请输入上限（MB）"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="PDF文档大小上限" prop="maxPdfFileSize">
                <el-input-number
                  v-model="formData.maxPdfFileSize"
                  :min="0"
                  :precision="0"
                  controls-position="right"
                  placeholder="请输入上限（MB）"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="PDF异步转码" prop="aiPdfSyncTranscode">
                <el-select v-model="formData.aiPdfSyncTranscode" clearable placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in pdfTranscodeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Word异步转码" prop="aiDocSyncTranscode">
                <el-select v-model="formData.aiDocSyncTranscode" clearable placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in wordTranscodeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标题修正" prop="aiDocHeadingFixEnable">
                <el-select v-model="formData.aiDocHeadingFixEnable" clearable placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in yesNoOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="建议书切片提取" prop="aiStartJysChunkExtract">
                <el-select v-model="formData.aiStartJysChunkExtract" clearable placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in yesNoOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="可研报告切片提取" prop="aiStartKybgChunkExtract">
                <el-select v-model="formData.aiStartKybgChunkExtract" clearable placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in yesNoOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="估算书切片提取" prop="aiStartGssChunkExtract">
                <el-select v-model="formData.aiStartGssChunkExtract" clearable placeholder="请选择" style="width: 100%">
                  <el-option v-for="item in yesNoOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <div class="air-modal-footer">
                <el-button :loading="loading" :disabled="loading" size="mini" v-debounce="[handleSave, `click`, 300]" type="primary">
                  保 存
                </el-button>
                <el-button :disabled="loading" size="mini" v-debounce="[handleClose, `click`, 300]" plain>关 闭</el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'documentConfigModal'
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { documentConfigSave, documentConfigUpdate } from '@/api/suzhou/aiAuditInuseRange'

interface ProjectTypeOption {
  id: string
  proTypeName: string
}

interface ModalParams {
  type?: string
  /** 新增时可选的项目类型（未配置） */
  projectTypeOptions?: ProjectTypeOption[]
  searchParams?: Record<string, any>
}

interface DocumentConfigForm {
  id: string
  proTypeName: string
  zy: string
  maxDocFileSize: number | undefined
  maxPdfFileSize: number | undefined
  aiPdfSyncTranscode: string
  aiDocSyncTranscode: string
  aiDocHeadingFixEnable: string
  aiStartJysChunkExtract: string
  aiStartKybgChunkExtract: string
  aiStartGssChunkExtract: string
}

const emit = defineEmits<{
  (e: 'searchHandle', val: { param: string }): void
}>()

const isShowModal = ref(false)
const loading = ref(false)
const formRef = ref()
const modalTitle = ref('')
const modalType = ref<'ADD' | 'EDIT'>('ADD')
const projectTypeOptions = ref<ProjectTypeOption[]>([])

const isAdd = computed(() => modalType.value === 'ADD')

const yesNoOptions = [
  { value: '1', label: '开启' },
  { value: '0', label: '关闭' }
]
const pdfTranscodeOptions = [
  { value: '1', label: '开启' },
  { value: '0', label: '关闭' }
]
/** 文档只给了 1/2/0，未说明 2 的业务文案，先按码值展示，等后端字典下发再替换 */
const wordTranscodeOptions = [
  { value: '1', label: '异步' },
  { value: '2', label: '含图片异步' },
  { value: '0', label: '关闭' }
]

const formData = ref<DocumentConfigForm>({
  id: '',
  proTypeName: '',
  zy: '',
  maxDocFileSize: undefined,
  maxPdfFileSize: undefined,
  aiPdfSyncTranscode: '',
  aiDocSyncTranscode: '',
  aiDocHeadingFixEnable: '',
  aiStartJysChunkExtract: '',
  aiStartKybgChunkExtract: '',
  aiStartGssChunkExtract: ''
})

/** 关闭弹窗 */
const handleClose = () => {
  formRef.value?.resetFields()
  isShowModal.value = false
}

const handleProjectTypeChange = (id: string) => {
  const hit = projectTypeOptions.value.find((item) => item.id === id)
  formData.value.proTypeName = hit?.proTypeName || ''
}

/** 保存：新增走 save，编辑走 update */
const handleSave = () => {
  if (loading.value) return
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    if (!formData.value.id) {
      ElMessage.warning('请选择项目类型')
      return
    }
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

    const payload = {
      id: formData.value.id,
      zy: formData.value.zy || null,
      maxDocFileSize: formData.value.maxDocFileSize ?? null,
      maxPdfFileSize: formData.value.maxPdfFileSize ?? null,
      aiPdfSyncTranscode: formData.value.aiPdfSyncTranscode || null,
      aiDocSyncTranscode: formData.value.aiDocSyncTranscode || null,
      aiDocHeadingFixEnable: formData.value.aiDocHeadingFixEnable || null,
      aiStartJysChunkExtract: formData.value.aiStartJysChunkExtract || null,
      aiStartKybgChunkExtract: formData.value.aiStartKybgChunkExtract || null,
      aiStartGssChunkExtract: formData.value.aiStartGssChunkExtract || null
    }

    loading.value = true
    try {
      const res = modalType.value === 'ADD' ? await documentConfigSave(payload) : await documentConfigUpdate(payload)
      if (!res.success) {
        ElMessage.error(res.msg || '保存失败')
        return
      }
      ElMessage.success('保存成功！')
      emit('searchHandle', { param: 'success' })
      handleClose()
    } catch (e) {
      ElMessage.error((e as Error).message || '保存失败')
    } finally {
      loading.value = false
    }
  })
}

/** 打开弹窗：新增带项目类型下拉，编辑回填详情 */
const acceptParams = (params: ModalParams) => {
  modalType.value = params.type === '编辑' ? 'EDIT' : 'ADD'
  modalTitle.value = isAdd.value ? '新增文档处理配置' : '编辑文档处理配置'
  projectTypeOptions.value = params.projectTypeOptions || []
  const sp = params.searchParams || {}
  const id = String(sp.id ?? '')
  const option = projectTypeOptions.value.find((item) => item.id === id)
  formData.value = {
    id,
    proTypeName: String(sp.proTypeName || option?.proTypeName || ''),
    zy: String(sp.zy ?? ''),
    maxDocFileSize: sp.maxDocFileSize == null || sp.maxDocFileSize === '' ? undefined : Number(sp.maxDocFileSize),
    maxPdfFileSize: sp.maxPdfFileSize == null || sp.maxPdfFileSize === '' ? undefined : Number(sp.maxPdfFileSize),
    aiPdfSyncTranscode: String(sp.aiPdfSyncTranscode ?? ''),
    aiDocSyncTranscode: String(sp.aiDocSyncTranscode ?? ''),
    aiDocHeadingFixEnable: String(sp.aiDocHeadingFixEnable ?? ''),
    aiStartJysChunkExtract: String(sp.aiStartJysChunkExtract ?? ''),
    aiStartKybgChunkExtract: String(sp.aiStartKybgChunkExtract ?? ''),
    aiStartGssChunkExtract: String(sp.aiStartGssChunkExtract ?? '')
  }
  isShowModal.value = true
}

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';

/* 「Word文档大小上限」等长标签保持单行，避免换行后表单行高跳动 */
.document-config-form {
  .el-form-item__label {
    white-space: nowrap;
  }
}
</style>
