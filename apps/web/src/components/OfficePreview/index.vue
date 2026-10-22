<template>
  <div class="office-preview" :class="rootClass" :style="containerStyle" v-loading="loading">
    <!-- PDF：浏览器内置预览（iframe + blob URL），不引入 PDF 渲染依赖 -->
    <iframe
      v-if="pdfObjectUrl && rendererType === 'pdf'"
      :key="`pdf-${renderKey}`"
      class="office-preview__pdf"
      :src="pdfIframeSource"
      title="PDF 预览"
      @load="handlePdfRendered"
    />
    <!-- Word/Excel：@file-viewer（renderer-word / renderer-spreadsheet） -->
    <div v-show="isOfficeRenderer" ref="viewerHostRef" class="office-preview__viewer" />
    <el-empty v-if="showEmpty" key="office-preview-empty" :description="errorMessage || emptyText" />
  </div>
</template>

<script setup lang="ts">
import type { OfficePreviewProps, OfficePreviewEmits } from './types'
import { useOfficePreview } from './useOfficePreview'

defineOptions({ name: 'OfficePreview' })
const props = withDefaults(defineProps<OfficePreviewProps>(), { height: '100%', emptyText: '暂无可预览文件', toolbar: () => false })
const emit = defineEmits<OfficePreviewEmits>()
const {
  loading,
  errorMessage,
  rendererType,
  pdfObjectUrl,
  renderKey,
  viewerHostRef,
  isOfficeRenderer,
  showEmpty,
  containerStyle,
  rootClass,
  pdfIframeSource,
  handlePdfRendered,
  reload
} = useOfficePreview(props, emit)
defineExpose({ reload })
</script>

<style scoped lang="less">
.office-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  box-sizing: border-box;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;

  &__pdf {
    display: block;
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    min-height: 0;
    border: 0;
  }

  &__viewer {
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  &--pdf {
    overflow: hidden;
    background: #475569;
  }

  &--excel,
  &--word {
    overflow: hidden;
  }

  :deep(.el-empty) {
    margin: auto;
  }
}
</style>
