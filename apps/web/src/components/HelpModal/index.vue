<template>
  <vxe-modal
    :loading="loading"
    @show="showModalHandle"
    class-name="help-modal"
    :transfer="true"
    :mask="true"
    :lock-view="true"
    height="600"
    width="900px"
    :destroy-on-close="true"
    :title="props.title"
    v-model="showModal"
    show-zoom
    resize
    position="center"
  >
    <div class="help-modal-content">
      <!-- 导航标签 -->
      <div class="help-tabs" role="tablist" aria-label="帮助内容">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'help'"
          v-if="props.showHelpInfo"
          class="help-tab"
          :class="{ active: activeTab === 'help' }"
          @click="activeTab = 'help'"
        >
          <el-icon><QuestionFilled /></el-icon>
          <span>帮助信息</span>
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'attachments'"
          class="help-tab"
          :class="{ active: activeTab === 'attachments' }"
          @click="activeTab = 'attachments'"
        >
          <el-icon><Paperclip /></el-icon>
          <span>附件下载</span>
          <span v-if="attachments.length > 0" class="tab-badge">{{ attachments.length }}</span>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="help-content">
        <!-- 帮助信息 -->
        <div v-if="props.showHelpInfo && activeTab === 'help'" class="help-info">
          <div v-if="helpText.trim()" v-html="formatHelpText(helpText)"></div>
          <div v-else class="empty-content">
            <el-icon><InfoFilled /></el-icon>
            <p>暂无帮助信息</p>
          </div>
        </div>

        <!-- 附件列表 -->
        <div v-else class="attachment-section">
          <div v-if="attachments.length === 0" class="empty-content">
            <el-icon><FolderOpened /></el-icon>
            <p>暂无附件</p>
          </div>
          <div v-else>
            <!-- 工具栏 -->
            <div class="attachment-toolbar">
              <div class="toolbar-info">
                <el-icon><Files /></el-icon>
                <span>共 {{ attachments.length }} 个文件</span>
              </div>
              <div class="toolbar-actions">
                <button class="download-all-btn" @click="downloadAllFiles" :disabled="loading" title="批量下载">
                  <el-icon><Download /></el-icon>
                  批量下载
                </button>
              </div>
            </div>

            <!-- 文件列表 -->
            <div class="file-list">
              <div
                v-for="(file, idx) in attachments"
                :key="file.uuid"
                class="file-item"
                role="button"
                tabindex="0"
                @keydown.enter="downloadFile(file.fjmc, file.uuid)"
                @keydown.space.prevent="downloadFile(file.fjmc, file.uuid)"
                @click="downloadFile(file.fjmc, file.uuid)"
              >
                <div class="file-icon">
                  <el-icon><component :is="getFileIcon(file.fjmc)" /></el-icon>
                </div>
                <div class="file-info">
                  <div class="file-name" :title="file.fjmc">{{ file.fjmc }}</div>
                  <div class="file-meta">
                    <span class="file-index">{{ idx + 1 }}</span>
                    <span class="file-ext">{{ getFileExtension(file.fjmc) }}</span>
                  </div>
                </div>
                <div class="file-actions">
                  <el-icon><Download /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import type { Component } from 'vue'
import {
  Box,
  Document,
  Download,
  Files,
  FolderOpened,
  Grid,
  Headset,
  InfoFilled,
  Paperclip,
  Picture,
  Present,
  QuestionFilled,
  VideoCamera
} from '@element-plus/icons-vue'
import { useHelp } from './useHelp'
import type { HelpModalProps } from './useHelp'
import { formatHelpText, getFileExtension } from './content'

defineOptions({ name: 'HelpModal' })
const props = withDefaults(defineProps<HelpModalProps>(), { showHelpInfo: true, menuUrl: '', title: '帮助中心' })
const { showModal, activeTab, loading, helpText, attachments, isHide, showModalHandle, downloadFile, downloadAllFiles, open } = useHelp(props)
watch(
  () => props.showHelpInfo,
  (visible) => {
    if (!visible) activeTab.value = 'attachments'
  }
)
const iconMap: Record<string, Component> = {
  PDF: Document,
  DOC: Document,
  DOCX: Document,
  XLS: Grid,
  XLSX: Grid,
  PPT: Present,
  PPTX: Present,
  ZIP: Box,
  RAR: Box,
  '7Z': Box,
  JPG: Picture,
  JPEG: Picture,
  PNG: Picture,
  GIF: Picture,
  MP4: VideoCamera,
  AVI: VideoCamera,
  MOV: VideoCamera,
  MP3: Headset,
  WAV: Headset
}
const getFileIcon = (filename: string) => iconMap[getFileExtension(filename)] ?? Document
defineExpose({ showModal, attachments, isHide, helpText, activeTab, open })
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
