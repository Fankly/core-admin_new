<template>
  <vxe-modal
    :model-value="visible"
    :destroy-on-close="true"
    :show-footer="false"
    show-zoom
    resize
    transfer
    position="center"
    width="55%"
    height="95%"
    title="文件预览"
    class-name="smart-task-audit-file-preview-modal"
    @close="handleClose"
  >
    <div class="audit-file-preview">
      <div v-if="activeFile" class="audit-file-preview__toolbar">
        <div class="audit-file-preview__title-wrap">
          <span class="audit-file-preview__title-bar" aria-hidden="true"></span>
          <span class="audit-file-preview__label">预览文件</span>
        </div>
        <el-select v-if="files.length > 1" v-model="activeUuid" class="audit-file-preview__select" placeholder="请选择文件" @change="switchFile">
          <el-option
            v-for="file in files"
            :key="getAuditPreviewFileKey(file)"
            :label="getAuditPreviewFileName(file)"
            :value="getAuditPreviewFileKey(file)"
          />
        </el-select>
        <span v-else class="audit-file-preview__filename" :title="getAuditPreviewFileName(activeFile)">
          {{ getAuditPreviewFileName(activeFile) }}
        </span>
        <span class="audit-file-preview__count"> {{ activeIndex + 1 }}/{{ files.length }} </span>
      </div>
      <div v-loading="loading" class="audit-file-preview__body">
        <div class="audit-file-preview__canvas">
          <OfficePreview
            v-if="activeFile"
            :src="previewSource"
            :file-name="getAuditPreviewFileName(activeFile)"
            :pdf-options="auditPdfOptions"
            :toolbar="officeZoomToolbarOptions"
            height="100%"
            empty-text="暂无可预览文件"
          />
          <div v-else class="audit-file-preview__empty">暂无可预览文件</div>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { PropType } from 'vue'
import { ElMessage } from 'element-plus'
import { previewAttach } from '@/api/ai/smartTaskAudit'
import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import OfficePreview from '@/components/OfficePreview'
import type { OfficePdfOptions, OfficePreviewSource, OfficeToolbarOptions } from '@/components/OfficePreview'
import { getAuditPreviewFileKey, getAuditPreviewFileName, resolvePreviewAttachBlob } from './auditFilePreview'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  /** 可切换的附件列表（调用方需保证均为可预览文件） */
  files: {
    type: Array as PropType<TXmAttach[]>,
    default: () => []
  },
  /** 初始选中附件的 key（uuid 优先，其次 id） */
  activeKey: {
    type: String,
    default: ''
  }
})

const emit = defineEmits<{
  (event: 'close'): void
}>()

const loading = ref(false)
const activeUuid = ref('')
const previewSource = shallowRef<OfficePreviewSource>(null)
const auditPdfOptions: OfficePdfOptions = { pageMode: 'none', zoom: 85 }
const officeZoomToolbarOptions: OfficeToolbarOptions = {
  download: false,
  print: false,
  exportHtml: false,
  zoom: true,
  search: false,
  theme: false,
  position: 'top-center'
}
let fileLoadSeq = 0

const activeFile = computed(() => props.files.find((file) => getAuditPreviewFileKey(file) === activeUuid.value) || props.files[0])

const activeIndex = computed(() => {
  if (!activeFile.value) return -1
  return props.files.findIndex((file) => getAuditPreviewFileKey(file) === getAuditPreviewFileKey(activeFile.value!))
})

const loadFile = async (file: TXmAttach) => {
  const fileKey = getAuditPreviewFileKey(file)
  // previewAttach 的 attachId 对应附件类型 id；接口直接返回文件二进制流
  const attachId = String(file.id || '').trim()
  if (!attachId) {
    ElMessage.error('文件缺少附件类型标识，无法预览')
    return
  }

  const seq = ++fileLoadSeq
  loading.value = true
  previewSource.value = null
  try {
    const res = await previewAttach(attachId)
    if (seq !== fileLoadSeq || !props.visible || activeUuid.value !== fileKey) return
    previewSource.value = await resolvePreviewAttachBlob(res)
  } catch (e: any) {
    if (seq !== fileLoadSeq || !props.visible || activeUuid.value !== fileKey) return
    ElMessage.error(e?.message || '文件获取失败')
  } finally {
    if (seq === fileLoadSeq) {
      loading.value = false
    }
  }
}

const switchFile = (uuid: string) => {
  const file = props.files.find((item) => getAuditPreviewFileKey(item) === String(uuid))
  if (file) loadFile(file)
}

const reset = () => {
  fileLoadSeq += 1
  loading.value = false
  activeUuid.value = ''
  previewSource.value = null
}

const handleClose = () => {
  reset()
  emit('close')
}

watch(
  () => [props.visible, props.activeKey, props.files] as const,
  () => {
    if (!props.visible) {
      reset()
      return
    }

    const target = props.files.find((file) => getAuditPreviewFileKey(file) === props.activeKey) || props.files[0]
    if (!target) {
      reset()
      return
    }

    const targetKey = getAuditPreviewFileKey(target)
    if (activeUuid.value === targetKey && previewSource.value) return
    activeUuid.value = targetKey
    loadFile(target)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  fileLoadSeq += 1
})
</script>

<style scoped lang="less">
:global(.smart-task-audit-file-preview-modal) {
  --vxe-modal-body-background-color: #f5fbfb;
  --vxe-modal-header-background-color: #f8fbfb;
}

:global(.smart-task-audit-file-preview-modal .vxe-modal--header) {
  color: #173c40;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
  border-bottom: 1px solid rgba(14, 139, 141, 0.1);
  box-shadow: inset 0 1px 0 #fff;
}

:global(.smart-task-audit-file-preview-modal .vxe-modal--body),
:global(.smart-task-audit-file-preview-modal .vxe-modal--content) {
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
