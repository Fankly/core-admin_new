<template>
  <vxe-modal
    :model-value="modal.visible"
    :destroy-on-close="true"
    :loading="modal.loading"
    fullscreen
    show-zoom
    resize
    position="center"
    width="80%"
    height="720"
    title="任务详情"
    @close="$emit('close')"
  >
    <div class="tw-p-4 md:tw-p-6 tw-space-y-6 tw-overflow-y-auto tw-w-full tw-h-full tw-flex tw-flex-col tw-text-gray-800">
      <!-- 基本信息区 -->
      <div class="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-x-12 tw-gap-y-2">
        <!-- 左侧 -->
        <div class="tw-space-y-2">
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-py-2">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">项目名称</span>
            <span class="tw-text-[13px] tw-text-gray-800 sm:tw-w-2/3 tw-text-left sm:tw-text-right lg:tw-text-left">{{
              formatEmpty(detailData.xmmc)
            }}</span>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-py-2">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">附件名称</span>
            <span class="tw-text-[13px] tw-text-gray-800 sm:tw-w-2/3 tw-text-left sm:tw-text-right lg:tw-text-left">{{
              formatEmpty(detailData.attachName)
            }}</span>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-py-2">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">转码状态</span>
            <div class="sm:tw-w-2/3 tw-text-left sm:tw-text-right lg:tw-text-left">
              <span
                class="tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-sm tw-text-[12px] tw-font-medium tw-bg-[#00706b]/5 tw-text-[#00706b] tw-border tw-border-[#00706b]/20"
                >{{ getStatusName(detailData.transcodeStatus) }}</span
              >
            </div>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-py-2">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">转码时间</span>
            <span class="tw-text-[13px] tw-text-gray-600 sm:tw-w-2/3 tw-text-left sm:tw-text-right lg:tw-text-left">
              <template v-if="detailData.transcodeStartTime || detailData.transcodeFinishTime || detailData.transcodeEndTime">
                {{ formatTimestamp(detailData.transcodeStartTime) }} -
                {{ formatTimestamp(detailData.transcodeFinishTime || detailData.transcodeEndTime) }}
              </template>
              <template v-else>-</template>
            </span>
          </div>
        </div>
        <!-- 右侧 -->
        <div class="tw-space-y-2">
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-py-2">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">项目编码</span>
            <span class="tw-text-[13px] tw-text-gray-800 sm:tw-w-2/3 tw-text-left sm:tw-text-right lg:tw-text-left">{{
              formatEmpty(detailData.xmbm)
            }}</span>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-py-2">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">附件类型</span>
            <span class="tw-text-[13px] tw-text-gray-800 sm:tw-w-2/3 tw-text-left sm:tw-text-right lg:tw-text-left">{{
              getAttachTypeName(detailData)
            }}</span>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-py-2">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">提取状态</span>
            <div class="sm:tw-w-2/3 tw-text-left sm:tw-text-right lg:tw-text-left">
              <span
                class="tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-sm tw-text-[12px] tw-font-medium tw-bg-[#00706b]/5 tw-text-[#00706b] tw-border tw-border-[#00706b]/20"
                >{{ getStatusName(detailData.extractStatus) }}</span
              >
            </div>
          </div>
          <div class="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-py-2">
            <span class="tw-text-[13px] tw-font-bold tw-text-gray-600 sm:tw-w-1/3 tw-mb-1 sm:tw-mb-0">提取时间</span>
            <span class="tw-text-[13px] tw-text-gray-600 sm:tw-w-2/3 tw-text-left sm:tw-text-right lg:tw-text-left">
              <template v-if="detailData.extractStartTime || detailData.extractFinishTime || detailData.extractEndTime">
                {{ formatTimestamp(detailData.extractStartTime) }} - {{ formatTimestamp(detailData.extractFinishTime || detailData.extractEndTime) }}
              </template>
              <template v-else>-</template>
            </span>
          </div>
        </div>
      </div>

      <!-- 内容对照区 -->
      <div class="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-8 tw-pt-2 tw-flex-1 tw-min-h-0">
        <!-- 文档内容预览 -->
        <div>
          <div class="tw-flex tw-flex-col tw-h-full tw-min-h-[400px]">
            <div class="tw-flex tw-items-center tw-mb-3 tw-pb-2 tw-border-b tw-border-gray-200 tw-shrink-0">
              <h3 class="tw-text-[14px] tw-font-bold tw-text-gray-800 tw-leading-none">markdown文本</h3>
            </div>
            <div class="tw-flex-1 tw-bg-white tw-border tw-border-gray-200 tw-rounded-sm tw-overflow-auto tw-min-h-0 tw-max-h-[50vh]">
              <MarkdownViewer :content="detailData.content || ''" />
            </div>
          </div>
          <div class="tw-flex tw-flex-col tw-py-2">
            <div class="tw-flex tw-items-center tw-mb-3 tw-pb-2 tw-border-b tw-border-gray-200 tw-shrink-0">
              <h3 class="tw-text-[14px] tw-font-bold tw-text-gray-800 tw-leading-none">转码错误信息</h3>
            </div>
            <div
              class="tw-bg-[#fafafa] tw-border tw-border-gray-200 tw-rounded-sm tw-p-4 tw-overflow-y-auto tw-text-[13px] tw-leading-relaxed tw-text-gray-700 tw-whitespace-pre-wrap tw-min-h-[96px]"
            >
              {{ detailData.transcodeMessage || '-' }}
            </div>
          </div>
        </div>
        <!-- 提取信息 JSON -->
        <div>
          <div class="tw-flex tw-flex-col tw-h-full tw-min-h-[400px]">
            <div class="tw-flex tw-items-center tw-mb-3 tw-pb-2 tw-border-b tw-border-gray-200 tw-shrink-0">
              <h3 class="tw-text-[14px] tw-font-bold tw-text-gray-800 tw-leading-none">提取信息（JSON）</h3>
            </div>
            <div class="tw-flex-1 tw-bg-white tw-border tw-border-gray-200 tw-rounded-sm tw-overflow-auto tw-min-h-0 tw-max-h-[50vh]">
              <JsonViewer :value="detailData.extractJson || '{}'" />
            </div>
          </div>
          <div class="tw-flex tw-flex-col tw-py-2">
            <div class="tw-flex tw-items-center tw-mb-3 tw-pb-2 tw-border-b tw-border-gray-200 tw-shrink-0">
              <h3 class="tw-text-[14px] tw-font-bold tw-text-gray-800 tw-leading-none">提取错误信息</h3>
            </div>
            <div
              class="tw-bg-[#fafafa] tw-border tw-border-gray-200 tw-rounded-sm tw-p-4 tw-overflow-y-auto tw-text-[13px] tw-leading-relaxed tw-text-gray-700 tw-whitespace-pre-wrap tw-min-h-[96px]"
            >
              {{ detailData.extractMessage || '-' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import MarkdownViewer from './MarkdownViewer.vue'
import JsonViewer from './JsonViewer.vue'
import { formatEmpty, formatTimestamp, getAttachTypeName, getStatusName } from '../utils'
import type { AttachTaskRow, ModalState } from '../types'

defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  detailData: {
    type: Object as PropType<AttachTaskRow>,
    required: true
  }
})

defineEmits(['close'])
</script>

<style scoped></style>
