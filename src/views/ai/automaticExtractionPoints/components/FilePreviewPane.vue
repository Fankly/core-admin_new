<template>
  <div class="aep-file-preview">
    <div v-loading="loading" class="aep-file-preview__inner">
      <img v-if="imageUrl" class="aep-file-preview__image" :src="imageUrl" :alt="attachName || '文件预览'" />
      <OfficePreview
        v-else-if="previewSource"
        :src="previewSource"
        :file-name="attachName"
        height="100%"
        :empty-text="emptyText"
        @error="handlePreviewError"
      />
      <div v-else class="aep-file-preview__empty">{{ loading ? '文件加载中…' : displayEmptyText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { downloadAttach } from '@/api/sys/fileShare'
import OfficePreview from '@/components/OfficePreview/index.vue'
import type { OfficePreviewSource } from '@/components/OfficePreview'
import { getOfficeFileExtension } from '@/components/OfficePreview'

/**
 * 文件预览画布（无弹窗壳）
 *
 * 与「文件共享」页的 previewModal 同一套取数方式：按 uuid 下载带鉴权的文件流，
 * 图片用 <img> 直接渲染，其余交给 OfficePreview（PDF 由浏览器内置阅读器渲染）。
 * 这里只负责画布本身，供审核要点确认弹窗左侧复用。
 */
const props = withDefaults(
  defineProps<{
    /** 文件 UUID */
    uuid?: string
    /** 文件名（用于判断图片 / 交给 OfficePreview 识别类型） */
    attachName?: string
    /** 是否激活：关闭弹窗时置 false，清掉 blob，重新打开时再取 */
    active?: boolean
    /** 空态文案 */
    emptyText?: string
  }>(),
  { uuid: '', attachName: '', active: true, emptyText: '暂无可预览文件' }
)

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico']

const isImageFile = computed(() => IMAGE_EXTS.includes(getOfficeFileExtension(props.attachName) || ''))
const loading = ref(false)
const previewSource = shallowRef<OfficePreviewSource>(null)
const imageUrl = ref('')
const errorMessage = ref('')

const displayEmptyText = computed(() => errorMessage.value || props.emptyText)

/** 取数序号：快速切换文件/关闭弹窗时丢弃旧响应 */
let loadSeq = 0

const revokeImageUrl = (): void => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = ''
  }
}

const reset = (): void => {
  loadSeq += 1
  loading.value = false
  previewSource.value = null
  errorMessage.value = ''
  revokeImageUrl()
}

const handlePreviewError = (error: Error): void => {
  errorMessage.value = error.message || '文件预览失败'
}

const loadFile = async (): Promise<void> => {
  reset()
  if (!props.active || !props.uuid) return
  const seq = loadSeq
  loading.value = true
  try {
    const blob: any = await downloadAttach({ uuid: props.uuid, fileName: props.attachName || '' })
    if (seq !== loadSeq) return
    if (!blob || !(blob instanceof Blob)) {
      throw new Error('文件下载失败，未获取到有效内容')
    }
    if (isImageFile.value) {
      imageUrl.value = URL.createObjectURL(blob)
    } else {
      previewSource.value = blob
    }
  } catch (e) {
    if (seq !== loadSeq) return
    errorMessage.value = (e as Error)?.message || '文件预览失败，请稍后重试'
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

watch(() => [props.uuid, props.attachName, props.active] as const, loadFile, { immediate: true })

onBeforeUnmount(() => {
  loadSeq += 1
  revokeImageUrl()
})
</script>
