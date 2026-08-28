<template>
  <!-- 佐证材料预览（与 materialTaskDetailModal 文件预览一致） -->
  <vxe-modal
    :model-value="filePreviewModal.visible"
    :destroy-on-close="true"
    :show-footer="false"
    show-zoom
    resize
    position="center"
    width="55%"
    height="95%"
    title="文件预览"
    class-name="material-task-file-preview-modal"
    @close="closeFilePreview"
  >
    <div class="audit-file-preview">
      <div v-if="activePreviewFile" class="audit-file-preview__toolbar">
        <div class="audit-file-preview__title-wrap">
          <span class="audit-file-preview__title-bar" aria-hidden="true"></span>
          <span class="audit-file-preview__label">预览文件</span>
        </div>
        <el-select
          v-if="previewFiles.length > 1"
          v-model="activePreviewFileKey"
          class="audit-file-preview__select"
          placeholder="请选择文件"
          @change="switchPreviewFile"
        >
          <el-option
            v-for="file in previewFiles"
            :key="getPreviewFileKey(file)"
            :label="getPreviewFileName(file)"
            :value="getPreviewFileKey(file)"
          />
        </el-select>
        <span v-else class="audit-file-preview__filename" :title="getPreviewFileName(activePreviewFile)">
          {{ getPreviewFileName(activePreviewFile) }}
        </span>
        <span class="audit-file-preview__count"> {{ activePreviewIndex + 1 }}/{{ previewFiles.length }} </span>
      </div>
      <div v-loading="filePreviewModal.loading" class="audit-file-preview__body">
        <div class="audit-file-preview__canvas">
          <OfficePreview
            v-if="activePreviewFile"
            :src="previewSource"
            :file-name="getPreviewFileName(activePreviewFile)"
            height="100%"
            empty-text="暂无可预览文件"
          />
          <div v-else class="audit-file-preview__empty">暂无可预览文件</div>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="materialFilePreview">
import { computed, reactive, ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { previewMaterialTaskFile } from '@/api/suzhou/materialTask'
import OfficePreview, { getOfficeFileExtension } from '@/components/OfficePreview'
import type { OfficePreviewSource } from '@/components/OfficePreview'
import type { MaterialTaskDetailRow } from '@/views/suzhou/common/types/material'
import { getFileItems, type MaterialFileItem } from '@/views/suzhou/materialTaskDetail/utils/filePreview'

// 与 smartTaskAudit 预览一致：后端 doc 已转可预览格式，前端按扩展名放行
const SUPPORTED_PREVIEW_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xlsx', 'xls', 'et'])
const MAX_PREVIEW_BYTES = 30 * 1024 * 1024

const decodePreviewFileName = (value: unknown) => {
  let result = String(value ?? '').trim()
  if (!result) return '未命名附件'
  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(result)
      if (decoded === result) break
      result = decoded
    } catch {
      break
    }
  }
  return result
}

const getPreviewFileKey = (file: MaterialFileItem) => String(file.fileId || file.fileName || '')
const getPreviewFileName = (file: MaterialFileItem) => decodePreviewFileName(file.fileName)
const getPreviewFileExtension = (file: MaterialFileItem) => getOfficeFileExtension(getPreviewFileName(file))
const isSupportedPreviewFile = (file: MaterialFileItem) => {
  const extension = getPreviewFileExtension(file)
  return Boolean(extension && SUPPORTED_PREVIEW_EXTENSIONS.has(extension))
}

const filePreviewModal = reactive({
  visible: false,
  loading: false
})
const previewFiles = shallowRef<MaterialFileItem[]>([])
const activePreviewFileKey = ref('')
const previewSource = shallowRef<OfficePreviewSource>(null)
let previewListLoadSeq = 0
let previewFileLoadSeq = 0

const activePreviewFile = computed(() => {
  return previewFiles.value.find((file) => getPreviewFileKey(file) === activePreviewFileKey.value) || previewFiles.value[0]
})
const activePreviewIndex = computed(() => {
  if (!activePreviewFile.value) return -1
  return previewFiles.value.findIndex((file) => getPreviewFileKey(file) === getPreviewFileKey(activePreviewFile.value!))
})

const resetFilePreview = () => {
  filePreviewModal.visible = false
  filePreviewModal.loading = false
  previewFiles.value = []
  activePreviewFileKey.value = ''
  previewSource.value = null
}

const closeFilePreview = () => {
  previewListLoadSeq += 1
  previewFileLoadSeq += 1
  resetFilePreview()
}

/** previewMaterialTaskFile 直接返回文件流；若业务错误以 JSON/text blob 返回则解析 msg */
const resolvePreviewBlob = async (res: unknown): Promise<Blob> => {
  const blob = res instanceof Blob ? res : new Blob([res as BlobPart])
  const contentType = String(blob.type || '').toLowerCase()
  if (contentType.includes('application/json') || contentType.includes('text/')) {
    const text = await blob.text()
    try {
      const json = JSON.parse(text)
      throw new Error(json?.msg || json?.message || '文件获取失败')
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(text.trim() || '文件获取失败')
      }
      throw e
    }
  }
  if (!blob.size) throw new Error('文件内容为空')
  if (blob.size > MAX_PREVIEW_BYTES) {
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1)
    throw new Error(`文件过大（${sizeMb} MB），超过 30 MB 预览上限，请下载后本地查看`)
  }
  return blob
}

const loadPreviewFile = async (file: MaterialFileItem) => {
  const fileKey = getPreviewFileKey(file)
  const fileId = String(file.fileId || '').trim()
  if (!fileId) {
    ElMessage.error('文件缺少标识，无法预览')
    return
  }

  const seq = ++previewFileLoadSeq
  filePreviewModal.loading = true
  previewSource.value = null
  try {
    const res = await previewMaterialTaskFile(fileId)
    if (seq !== previewFileLoadSeq || !filePreviewModal.visible || activePreviewFileKey.value !== fileKey) return
    previewSource.value = await resolvePreviewBlob(res)
  } catch (e: any) {
    if (seq !== previewFileLoadSeq || !filePreviewModal.visible || activePreviewFileKey.value !== fileKey) return
    ElMessage.error(e?.message || '文件获取失败')
  } finally {
    if (seq === previewFileLoadSeq) {
      filePreviewModal.loading = false
    }
  }
}

const switchPreviewFile = (key: string) => {
  const file = previewFiles.value.find((item) => getPreviewFileKey(item) === String(key))
  if (file) loadPreviewFile(file)
}

/** 与 materialTaskDetailModal.handlePreviewFile 一致的预览入口 */
const handlePreviewFile = async (selectedFile: MaterialFileItem, row?: MaterialTaskDetailRow) => {
  const filesFromList = row ? getFileItems(row) : [selectedFile]
  const previewableFiles = filesFromList.filter((file) => file && getPreviewFileKey(file) && isSupportedPreviewFile(file))
  const targetKey = getPreviewFileKey(selectedFile)
  const hasFileId = Boolean(String(selectedFile.fileId || '').trim())

  const targetFile =
    previewableFiles.find((file) => getPreviewFileKey(file) === targetKey) ||
    (isSupportedPreviewFile(selectedFile) ? selectedFile : undefined) ||
    (hasFileId && getPreviewFileKey(selectedFile) ? selectedFile : undefined)

  if (!targetFile) {
    ElMessage.warning('暂不支持预览该文件，仅支持 PDF、DOC、DOCX、XLSX、XLS、ET')
    return
  }
  if (!String(targetFile.fileId || '').trim()) {
    ElMessage.warning('文件ID缺失，无法预览')
    return
  }

  const resolvedFiles = previewableFiles.length ? previewableFiles : [targetFile]
  previewListLoadSeq += 1
  previewFiles.value = resolvedFiles
  activePreviewFileKey.value = getPreviewFileKey(targetFile)
  previewSource.value = null
  filePreviewModal.visible = true
  await loadPreviewFile(targetFile)
}

defineExpose({
  handlePreviewFile
})
</script>

<style scoped lang="less">
/* 与 smartTaskAudit / materialTaskDetailModal 文件预览弹窗样式保持一致 */
:global(.material-task-file-preview-modal) {
  --vxe-modal-body-background-color: #f5fbfb;
  --vxe-modal-header-background-color: #f8fbfb;
}

:global(.material-task-file-preview-modal .vxe-modal--header) {
  color: #173c40;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
  border-bottom: 1px solid rgba(14, 139, 141, 0.1);
  box-shadow: inset 0 1px 0 #fff;
}

:global(.material-task-file-preview-modal .vxe-modal--body),
:global(.material-task-file-preview-modal .vxe-modal--content) {
  padding: 0;
  overflow: hidden;
  background: radial-gradient(circle at top right, rgba(14, 139, 141, 0.08), transparent 34%),
    linear-gradient(165deg, #f7fbfb 0%, #f3f6f8 52%, #eef3f5 100%);
}

.audit-file-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #153f45;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
}

.audit-file-preview__toolbar {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 12px;
  min-height: 52px;
  padding: 10px 18px;
  box-sizing: border-box;
  background: linear-gradient(100deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 251, 250, 0.96) 55%, rgba(236, 248, 246, 0.94) 100%);
  border-bottom: 1px solid #c5e5e2;
  box-shadow: inset 0 1px 0 #fff, 0 2px 8px rgba(31, 151, 145, 0.06);
}

.audit-file-preview__title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.audit-file-preview__title-bar {
  flex: 0 0 auto;
  width: 3px;
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(0, 112, 107, 0.85), rgba(85, 202, 187, 0.65));
  box-shadow: 0 0 0 1px rgba(0, 112, 107, 0.08);
}

.audit-file-preview__label {
  flex: 0 0 auto;
  color: #173c40;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.audit-file-preview__select {
  width: min(520px, 62%);
}

.audit-file-preview__select :deep(.el-input__inner) {
  height: 34px;
  color: #1f2937;
  font-family: inherit;
  font-size: 13px;
  line-height: 34px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 112, 107, 0.2);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.audit-file-preview__select :deep(.el-input__inner:hover),
.audit-file-preview__select :deep(.el-input.is-focus .el-input__inner) {
  border-color: rgba(0, 112, 107, 0.42);
  box-shadow: 0 0 0 2px rgba(0, 112, 107, 0.08);
}

.audit-file-preview__filename {
  min-width: 0;
  overflow: hidden;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-file-preview__count {
  flex: 0 0 auto;
  margin-left: auto;
  min-height: 24px;
  padding: 0 10px;
  color: #00706b;
  font-size: 12px;
  font-weight: 600;
  line-height: 24px;
  white-space: nowrap;
  background: rgba(0, 112, 107, 0.08);
  border: 1px solid rgba(0, 112, 107, 0.14);
  border-radius: 999px;
}

.audit-file-preview__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 16px 16px;
  box-sizing: border-box;
  background: transparent;
}

.audit-file-preview__canvas {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #cfe6e3;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(31, 151, 145, 0.1), inset 0 1px 0 #fff;
}

.audit-file-preview__body :deep(.office-preview) {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: 12px;
}

.audit-file-preview__empty {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}
</style>
