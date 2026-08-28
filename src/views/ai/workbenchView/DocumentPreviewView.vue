<template>
  <section class="document-preview-page">
    <header class="document-preview-toolbar">
      <button type="button" class="document-preview-back" title="返回项目智能评审工作台" @click="goBack">
        <ArrowLeft aria-hidden="true" />
        <span>返回工作台</span>
      </button>

      <div class="document-preview-title-wrap">
        <span class="document-preview-icon" aria-hidden="true"><Document /></span>
        <div class="document-preview-title-content">
          <h1 :title="fileName">{{ fileName }}</h1>
          <span v-if="fileType">{{ fileType }}</span>
        </div>
      </div>

      <button type="button" class="document-preview-reload" title="重新加载文档" :disabled="loading" @click="loadPreview">
        <RefreshCw :class="{ rotating: loading }" aria-hidden="true" />
        <span>重新加载</span>
      </button>
    </header>

    <main class="document-preview-content">
      <div v-loading="loading" class="document-preview-canvas" aria-live="polite">
        <OfficePreview
          v-if="previewSource && !previewError"
          :src="previewSource"
          :file-name="fileName"
          :pdf-options="pdfOptions"
          :toolbar="toolbarOptions"
          height="100%"
          empty-text="暂无可预览文件"
          @error="handlePreviewError"
        />
        <div v-else-if="!loading" class="document-preview-empty">
          <Document aria-hidden="true" />
          <strong>{{ previewError || '暂无可预览文件' }}</strong>
          <button type="button" class="document-preview-empty-action" @click="loadPreview">
            <RefreshCw aria-hidden="true" />
            <span>重新加载</span>
          </button>
        </div>
      </div>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document, Refresh as RefreshCw } from './icons'
import { listAttach, previewAttach } from '@/api/ai/smartTaskAudit'
import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import OfficePreview from '@/components/OfficePreview'
import type { OfficePdfOptions, OfficePreviewSource, OfficeToolbarOptions } from '@/components/OfficePreview'
import {
  decodeAuditPreviewFileName,
  getAuditPreviewFileExtension,
  getAuditPreviewFileKey,
  resolvePreviewAttachBlob
} from '../smartTaskAudit/components/auditFilePreview'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const previewSource = shallowRef<OfficePreviewSource>(null)
const previewError = ref('')
const activeFile = ref<TXmAttach | null>(null)
const requestSequence = ref(0)

const pdfOptions: OfficePdfOptions = { pageMode: 'none', zoom: 85 }
const toolbarOptions: OfficeToolbarOptions = {
  download: false,
  print: false,
  exportHtml: false,
  zoom: true,
  search: true,
  theme: false,
  position: 'top-center'
}

const queryValue = (value: unknown) => (Array.isArray(value) ? String(value[0] || '') : String(value || '')).trim()
const attachId = computed(() => queryValue(route.query.attachId))
const detailId = computed(() => queryValue(route.query.detailId))
const attachKey = computed(() => queryValue(route.query.attachKey))
const routeFileName = computed(() => decodeAuditPreviewFileName(queryValue(route.query.attachName)))
const fileName = computed(() => activeFile.value?.name || routeFileName.value || '文档预览')
const fileType = computed(() => {
  const extension = getAuditPreviewFileExtension({ name: fileName.value } as TXmAttach)
  return extension ? extension.toUpperCase() : ''
})

const createRouteFile = (): TXmAttach => ({
  id: attachId.value,
  uuid: attachKey.value || attachId.value,
  name: routeFileName.value || '未命名附件',
  fjId: '',
  size: 0,
  proId: ''
})

const findRouteFile = (files: TXmAttach[]) => {
  const key = attachKey.value || attachId.value
  return files.find((file) => getAuditPreviewFileKey(file) === key || String(file.id || '') === attachId.value || String(file.uuid || '') === key)
}

const loadPreview = async () => {
  const sequence = ++requestSequence.value
  loading.value = true
  previewError.value = ''
  previewSource.value = null
  activeFile.value = null

  const targetId = attachId.value
  if (!targetId) {
    previewError.value = '附件标识缺失，无法预览'
    loading.value = false
    return
  }

  try {
    let file = createRouteFile()
    if (detailId.value) {
      try {
        const listResult = await listAttach(detailId.value)
        if (listResult.success) file = findRouteFile(Array.isArray(listResult.data) ? listResult.data : []) || file
      } catch {
        // The preview endpoint is still usable when the detail attachment list is unavailable.
      }
    }
    if (routeFileName.value) file = { ...file, name: routeFileName.value }

    const response = await previewAttach(targetId)
    const blob = await resolvePreviewAttachBlob(response)
    if (sequence !== requestSequence.value) return
    activeFile.value = file
    previewSource.value = blob
  } catch (error: any) {
    if (sequence !== requestSequence.value) return
    previewError.value = error?.message || '文件预览失败'
    ElMessage.error(previewError.value)
  } finally {
    if (sequence === requestSequence.value) loading.value = false
  }
}

const handlePreviewError = (error: Error) => {
  previewError.value = error?.message || '文件预览失败'
}

const goBack = () => {
  if (window.opener && !window.opener.closed) {
    window.close()
    return
  }
  void router.push('/ai/workbenchView')
}

watch(
  () => route.fullPath,
  () => void loadPreview(),
  { immediate: true }
)

onBeforeUnmount(() => {
  requestSequence.value += 1
})
</script>

<style scoped lang="less">
.document-preview-page {
  --preview-primary: #00706b;
  --preview-primary-soft: #f2f9f8;
  --preview-border: #dcebe9;
  --preview-text: #1e293b;
  --preview-muted: #64748b;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--preview-text);
  background: #f5fbfb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.document-preview-toolbar {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 16px;
  min-height: 58px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid var(--preview-border);
}

.document-preview-back,
.document-preview-reload,
.document-preview-empty-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 5px 10px;
  color: var(--preview-primary);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  background: var(--preview-primary-soft);
  border: 1px solid #b8ddd9;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.document-preview-back:hover,
.document-preview-reload:hover:not(:disabled),
.document-preview-empty-action:hover {
  background: #e6f4f3;
  border-color: var(--preview-primary);
}

.document-preview-back:focus-visible,
.document-preview-reload:focus-visible,
.document-preview-empty-action:focus-visible {
  outline: 2px solid var(--preview-primary);
  outline-offset: 2px;
}

.document-preview-reload:disabled {
  color: #94a3b8;
  background: #f8fafc;
  border-color: #e2e8f0;
  cursor: not-allowed;
}

.document-preview-back svg,
.document-preview-reload svg,
.document-preview-empty-action svg {
  width: 15px;
  height: 15px;
}

.document-preview-title-wrap {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  gap: 10px;
  min-width: 0;
}

.document-preview-icon {
  display: grid;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  place-items: center;
  color: var(--preview-primary);
  background: var(--preview-primary-soft);
  border: 1px solid #b8ddd9;
  border-radius: 6px;
}

.document-preview-icon svg {
  width: 16px;
  height: 16px;
}

.document-preview-title-content {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.document-preview-title-content h1 {
  max-width: min(60vw, 720px);
  margin: 0;
  overflow: hidden;
  color: var(--preview-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-preview-title-content span {
  flex: 0 0 auto;
  color: var(--preview-muted);
  font-size: 12px;
  text-transform: uppercase;
}

.document-preview-content {
  flex: 1 1 0;
  min-height: 0;
  padding: 12px;
}

.document-preview-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--preview-border);
  border-radius: 6px;
}

.document-preview-canvas :deep(.office-preview) {
  width: 100%;
  height: 100%;
}

.document-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  color: var(--preview-muted);
  font-size: 13px;
}

.document-preview-empty > svg {
  width: 30px;
  height: 30px;
  color: #9ccbc6;
}

.rotating {
  animation: document-preview-rotate 0.8s linear infinite;
}

@keyframes document-preview-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
