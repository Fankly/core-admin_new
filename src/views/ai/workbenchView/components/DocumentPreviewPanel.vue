<template>
  <Transition name="preview-drawer">
    <section v-if="visible" ref="panelRef" class="preview-drawer" :style="{ width }" tabindex="-1" aria-label="项目材料预览">
      <div class="preview-drawer__pane">
        <div class="preview-drawer__header">
          <div class="preview-drawer__copy">
            <span class="title-icon title-icon--small" aria-hidden="true"
              ><el-icon><Document /></el-icon
            ></span>
            <h3 class="review-process-column__title preview-drawer__title">
              <ReText>{{ fileName || '项目材料预览' }}</ReText>
            </h3>
            <span v-if="fileType" class="preview-drawer__type">{{ fileType }}</span>
          </div>
          <button type="button" class="preview-drawer__close" title="关闭预览（Esc）" @click="$emit('close')">
            <el-icon aria-hidden="true"><Close /></el-icon>
            <span>关 闭</span>
          </button>
        </div>

        <div v-loading="loading" element-loading-text="正在加载材料" class="preview-drawer__body" aria-live="polite">
          <OfficePreview
            v-if="source"
            :src="source"
            :file-name="fileName"
            :pdf-options="pdfOptions"
            :toolbar="toolbarOptions"
            height="100%"
            empty-text="暂无可预览材料"
            @error="$emit('error', $event)"
          />
          <div v-else-if="!loading" class="preview-drawer__empty">
            <span class="preview-drawer__empty-icon" aria-hidden="true"
              ><el-icon><Document /></el-icon
            ></span>
            <p class="preview-drawer__empty-text">{{ errorText || '暂无可预览材料' }}</p>
            <button type="button" class="preview-drawer__empty-action" @click="$emit('reload')">
              <el-icon aria-hidden="true"><Refresh /></el-icon>
              <span>重新加载</span>
            </button>
          </div>
        </div>
      </div>

      <div
        class="preview-drawer__resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整预览宽度，方向键微调，双击复位"
        :aria-valuenow="widthValue"
        :aria-valuemin="minWidth"
        :aria-valuemax="maxWidth"
        tabindex="0"
        title="拖动调整预览宽度，双击复位"
        @pointerdown="$emit('resize-start', $event)"
        @keydown="$emit('resize-keydown', $event)"
        @dblclick="$emit('reset-width')"
      >
        <span class="preview-drawer__resizer-grip" aria-hidden="true"></span>
      </div>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { OfficePdfOptions, OfficePreviewSource, OfficeToolbarOptions } from '@/components/OfficePreview'
import OfficePreview from '@/components/OfficePreview'
import ReText from '@/components/ReText/src/index.vue'
import { Close, Document, Refresh } from '../icons'

const panelRef = ref<HTMLElement | null>(null)

defineProps<{
  visible: boolean
  loading: boolean
  errorText: string
  source: OfficePreviewSource
  fileName: string
  fileType: string
  width: string
  widthValue: number
  minWidth: number
  maxWidth: number
  pdfOptions: OfficePdfOptions
  toolbarOptions: OfficeToolbarOptions
}>()

defineEmits<{
  (event: 'close'): void
  (event: 'reload'): void
  (event: 'error', error: Error): void
  (event: 'resize-start', event: PointerEvent): void
  (event: 'resize-keydown', event: KeyboardEvent): void
  (event: 'reset-width'): void
}>()

defineExpose({
  focus: (options?: FocusOptions) => panelRef.value?.focus(options)
})
</script>
