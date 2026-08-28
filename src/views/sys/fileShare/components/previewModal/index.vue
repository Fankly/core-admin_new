<template>
  <vxe-modal
    ref="modalRef"
    class-name="ai-audit-range-modal file-preview-modal"
    resize
    show-zoom
    v-model="isShowModal"
    destroy-on-close
    :title="modalTitle"
    width="900px"
    height="600px"
    @close="handleClose"
    :loading="downloading"
  >
    <div class="air-modal-body air-modal-body--preview">
      <OfficePreview
        v-if="isShowModal"
        ref="previewRef"
        :src="previewSource"
        :file-name="attachName"
        height="100%"
        :empty-text="errorMessage || '暂无可预览文件'"
        @error="handlePreviewError"
      />
    </div>
  </vxe-modal>
  <el-image-viewer v-if="isImageViewerShow && imageUrl" :url-list="[imageUrl]" hide-on-click-modal teleported @close="handleClose" />
</template>

<script lang="ts">
export default {
  name: 'previewModal'
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { ElMessage, ElImageViewer } from 'element-plus'
import OfficePreview from '@/components/OfficePreview/index.vue'
import type { OfficePreviewSource } from '@/components/OfficePreview'
import { getOfficeFileExtension } from '@/components/OfficePreview'
import { downloadAttach } from '@/api/sys/fileShare'

interface PreviewParams {
  uuid: string
  attachName?: string
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']

const isImageFile = (fileName?: string) => IMAGE_EXTS.includes(getOfficeFileExtension(fileName) || '')

const isShowModal = ref(false)
const downloading = ref(false)
const modalTitle = ref('文件预览')
const attachName = ref<string>('')
const previewSource = shallowRef<OfficePreviewSource>(null)
const errorMessage = ref('')
const previewRef = ref<InstanceType<typeof OfficePreview> | null>(null)
const isImageViewerShow = ref(false)
const imageUrl = ref<string>('')

const revokeImageUrl = () => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
}

const handleClose = () => {
  previewSource.value = null
  errorMessage.value = ''
  attachName.value = ''
  isShowModal.value = false
  isImageViewerShow.value = false
  revokeImageUrl()
}

const handlePreviewError = (error: Error) => {
  errorMessage.value = error.message || '文件预览失败'
}

const acceptParams = async (params: PreviewParams) => {
  errorMessage.value = ''
  attachName.value = params.attachName || ''
  modalTitle.value = `文件预览 - ${params.attachName || ''}`
  const isImage = isImageFile(params.attachName)
  // 先清空旧数据，避免 destroy-on-close 重建前渲染上一份文件
  previewSource.value = null
  revokeImageUrl()
  isImageViewerShow.value = false
  isShowModal.value = !isImage
  downloading.value = true
  try {
    const blob: any = await downloadAttach({ uuid: params.uuid, fileName: params.attachName || '' })
    if (!blob || !(blob instanceof Blob)) {
      throw new Error('文件下载失败，未获取到有效内容')
    }
    if (isImage) {
      imageUrl.value = URL.createObjectURL(blob)
      isImageViewerShow.value = true
    } else {
      previewSource.value = blob
    }
  } catch (e) {
    const msg = (e as Error)?.message || '文件预览失败，请稍后重试'
    errorMessage.value = msg
    ElMessage.error(msg)
    isShowModal.value = false
    isImageViewerShow.value = false
    revokeImageUrl()
  } finally {
    downloading.value = false
  }
}

onBeforeUnmount(() => {
  revokeImageUrl()
})

defineExpose({ acceptParams })
</script>

<style lang="less">
@import '../../css/modal.less';

.file-preview-modal {
  .vxe-modal--body {
    padding: 0;
  }
}

.air-modal-body--preview {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 12px;
  box-sizing: border-box;

  .office-preview {
    width: 100%;
    height: 100%;
  }
}
</style>
