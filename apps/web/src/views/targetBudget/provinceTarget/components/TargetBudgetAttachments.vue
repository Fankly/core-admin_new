<template>
  <div v-loading="busy" class="target-budget-attachments" element-loading-text="正在处理附件...">
    <div v-if="!readonly" class="target-budget-attachments__toolbar">
      <input ref="fileInputRef" type="file" multiple :accept="acceptedTypes" hidden @change="handleUpload" />
      <el-button type="primary" plain size="small" :disabled="busy || !versionId" @click="openFilePicker">上传附件</el-button>
      <span class="target-budget-attachments__hint">支持 PDF、Word、Excel、ZIP，单个文件不超过 50MB</span>
    </div>
    <div v-if="listError" class="target-budget-attachments__error" role="alert">
      <span>{{ listError }}</span>
      <el-button v-if="versionId" type="text" size="small" :disabled="busy" @click="loadAttachments">重新加载</el-button>
    </div>
    <el-table v-if="attachments.length" :data="attachments" border size="small" :max-height="176" row-key="uuid">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="attachName" label="附件名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="uploadUserName" label="上传人" width="100" align="center" show-overflow-tooltip />
      <el-table-column label="操作" :width="readonly ? 120 : 180" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="text" size="small" :disabled="busy" @click="handlePreview(row)">查 看</el-button>
          <el-button type="text" size="small" :disabled="busy" @click="handleDownload(row)">下 载</el-button>
          <el-button v-if="!readonly" class="target-budget-attachments__delete" type="text" size="small" :disabled="busy" @click="handleDelete(row)"
            >删 除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <span v-else-if="!listError && !busy" class="target-budget-attachments__hint">暂无附件</span>
  </div>
  <vxe-modal v-model="previewVisible" title="附件查看" width="88%" height="80%" destroy-on-close show-zoom resize @close="closePreview">
    <div v-loading="previewLoading" class="target-budget-attachment-preview" element-loading-text="正在加载附件...">
      <div class="target-budget-attachment-preview__toolbar">
        <span class="target-budget-attachment-preview__name" :title="previewFile?.attachName">{{ previewFile?.attachName }}</span>
        <el-button type="primary" plain size="small" :disabled="busy || !previewFile" @click="handleDownload(previewFile)">下载附件</el-button>
        <el-button plain size="small" @click="closePreview">关 闭</el-button>
      </div>
      <div class="target-budget-attachment-preview__body">
        <OfficePreview v-if="previewSource" :src="previewSource" :file-name="previewFile?.attachName" height="100%" />
        <el-empty v-else-if="previewError" :description="previewError" />
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
defineOptions({ name: "TargetBudgetAttachments" })
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import OfficePreview, { getOfficeFileExtension } from '@/components/OfficePreview'
import { deleteAttachByUUID, downloadAttach, getAttachList, TargetBudgetAttachment, uploadAttachBatch } from '@/api/targetBudget/provinceTarget'

interface AttachmentProps {
  versionId?: string | number
  readonly?: boolean
}

const props = withDefaults(defineProps<AttachmentProps>(), { readonly: true })
const versionId = computed(() => String(props.versionId ?? '').trim())
const fileTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip']
const acceptedTypes = fileTypes.map((type) => `.${type}`).join(',')
const fileInputRef = ref<HTMLInputElement>()
const attachments = ref<TargetBudgetAttachment[]>([])
const listLoading = ref(false)
const operationLoading = ref(false)
const busy = computed(() => listLoading.value || operationLoading.value)
const listError = ref('')
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewError = ref('')
const previewFile = ref<TargetBudgetAttachment>()
const previewSource = shallowRef<Blob | null>(null)
let contextSequence = 0
let previewSequence = 0
let filePickerSequence = 0

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : '请求失败，请稍后重试')
const canEdit = () => !props.readonly && Boolean(versionId.value)

const closePreview = () => {
  previewSequence += 1
  previewVisible.value = false
  previewLoading.value = false
  previewSource.value = null
  previewFile.value = undefined
  previewError.value = ''
}

const loadAttachments = async () => {
  if (!versionId.value) {
    listError.value = '版本信息缺失，无法加载附件'
    return
  }
  const sequence = contextSequence
  listLoading.value = true
  listError.value = ''
  try {
    const res = await getAttachList(versionId.value)
    if (!res.success) throw new Error(res.msg || '附件列表获取失败')
    if (!Array.isArray(res.data)) throw new Error('附件列表返回格式错误')
    if (sequence === contextSequence) attachments.value = res.data
  } catch (error) {
    if (sequence === contextSequence) listError.value = `附件列表加载失败：${getErrorMessage(error)}`
  } finally {
    if (sequence === contextSequence) listLoading.value = false
  }
}

const openFilePicker = () => {
  if (!canEdit() || busy.value) return
  filePickerSequence = contextSequence
  fileInputRef.value?.click()
}

const handleUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length || !canEdit() || busy.value || filePickerSequence !== contextSequence) return

  const sequence = contextSequence
  operationLoading.value = true
  try {
    const formData = new FormData()
    for (const file of files) {
      const extension = getOfficeFileExtension(file.name)
      if (!extension || !fileTypes.includes(extension)) throw new Error(`“${file.name}”格式不支持，请选择 PDF、Word、Excel 或 ZIP 文件`)
      if (!file.size) throw new Error(`“${file.name}”为空文件，无法上传`)
      if (file.size > 50 * 1024 * 1024) throw new Error(`“${file.name}”超过 50MB，无法上传`)
      formData.append('files', file)
    }
    const res = await uploadAttachBatch({
      attachNames: files.map((file) => file.name),
      files: formData,
      versionId: versionId.value
    })
    if (!res.success) throw new Error(res.msg || '附件上传失败')
    if (sequence !== contextSequence) return
    ElMessage.success('附件上传成功')
    await loadAttachments()
  } catch (error) {
    if (sequence === contextSequence) ElMessage.error(`附件上传失败：${getErrorMessage(error)}`)
  } finally {
    if (sequence === contextSequence) operationLoading.value = false
  }
}

const handleDelete = async (file: TargetBudgetAttachment) => {
  if (!canEdit() || busy.value) return
  const sequence = contextSequence
  operationLoading.value = true
  try {
    const result = await VXETable.modal.confirm(`确认删除附件“${file.attachName}”？`, '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (result !== 'confirm' || sequence !== contextSequence || !canEdit()) return
    const res = await deleteAttachByUUID(file.uuid)
    if (!res.success) throw new Error(res.msg || '附件删除失败')
    if (sequence !== contextSequence) return
    attachments.value = attachments.value.filter((item) => item.uuid !== file.uuid)
    ElMessage.success('附件删除成功')
    await loadAttachments()
  } catch (error) {
    if (sequence === contextSequence) ElMessage.error(`附件删除失败：${getErrorMessage(error)}`)
  } finally {
    if (sequence === contextSequence) operationLoading.value = false
  }
}

const getAttachmentBlob = async (file: TargetBudgetAttachment): Promise<Blob> => {
  if (!file.uuid) throw new Error('附件标识缺失')
  const response: unknown = await downloadAttach(file.uuid)
  if (!(response instanceof Blob)) throw new Error('接口未返回有效的附件文件')
  // 下载接口的业务错误也可能以 Blob 返回，不能将错误内容保存为附件。
  if (response.type.toLowerCase().includes('json')) {
    const result = JSON.parse(await response.text())
    throw new Error(result.msg || result.message || '附件文件获取失败')
  }
  if (!response.size) throw new Error('附件内容为空')
  return response
}

const handleDownload = async (file?: TargetBudgetAttachment) => {
  if (!file || busy.value) return
  const sequence = contextSequence
  operationLoading.value = true
  try {
    const blob = await getAttachmentBlob(file)
    if (sequence !== contextSequence) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    try {
      link.href = url
      link.download = file.attachName
      document.body.appendChild(link)
      link.click()
    } finally {
      link.remove()
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    if (sequence === contextSequence) ElMessage.error(`附件下载失败：${getErrorMessage(error)}`)
  } finally {
    if (sequence === contextSequence) operationLoading.value = false
  }
}

const handlePreview = async (file: TargetBudgetAttachment) => {
  if (busy.value) return
  closePreview()
  previewFile.value = file
  previewVisible.value = true
  const extension = getOfficeFileExtension(file.attachName)
  if (!extension || !['pdf', 'doc', 'docx', 'xls', 'xlsx', 'et'].includes(extension)) {
    previewError.value = '该格式暂不支持在线查看，请下载后查看'
    return
  }
  const sequence = previewSequence
  previewLoading.value = true
  try {
    const blob = await getAttachmentBlob(file)
    if (sequence === previewSequence) previewSource.value = blob
  } catch (error) {
    if (sequence === previewSequence) previewError.value = `附件加载失败：${getErrorMessage(error)}`
  } finally {
    if (sequence === previewSequence) previewLoading.value = false
  }
}

watch(
  versionId,
  () => {
    contextSequence += 1
    attachments.value = []
    listLoading.value = false
    operationLoading.value = false
    closePreview()
    void loadAttachments()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  contextSequence += 1
  closePreview()
})
</script>

<style scoped lang="less">
.target-budget-attachments {
  width: 100%;
  min-width: 0;
  line-height: 1.5;

  &__toolbar,
  &__error {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 8px;
  }

  &__hint {
    color: var(--el-text-color-secondary, #64748b);
    font-size: 12px;
  }

  &__error,
  &__delete:not(:disabled) {
    color: var(--el-color-danger, #f56c6c);
  }
}

.target-budget-attachment-preview {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__body {
    flex: 1;
    min-height: 0;
  }
}
</style>
