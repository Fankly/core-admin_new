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
      <div class="help-tabs">
        <div v-if="props.showHelpInfo" class="help-tab" :class="{ active: activeTab === 'help' }" @click="activeTab = 'help'">
          <el-icon><QuestionFilled /></el-icon>
          <span>帮助信息</span>
        </div>
        <div class="help-tab" :class="{ active: activeTab === 'attachments' }" @click="activeTab = 'attachments'">
          <el-icon><Paperclip /></el-icon>
          <span>附件下载</span>
          <span v-if="attachments.length > 0" class="tab-badge">{{ attachments.length }}</span>
        </div>
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
              <div v-for="(file, idx) in attachments" :key="file.uuid" class="file-item" @click="downloadFile(file.fjmc, file.uuid)">
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
import { computed, ref, watch, type Component } from 'vue'
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
import { useMenuStore } from '@/store'
import { downloadFj, getConfigByMenuId, listFj } from '@/api/metrics'
import { getMenuMessage } from '@/api/process'
import { handleError } from '@/utils/error'

defineOptions({ name: 'HelpModal' })

interface Props {
  showHelpInfo?: boolean
  menuUrl?: string
  title?: string
}
const props = withDefaults(defineProps<Props>(), {
  showHelpInfo: true,
  menuUrl: '',
  title: '帮助中心'
})

interface AttachmentItem {
  fjmc: string
  uuid: string
}

const showModal = ref(false)
const activeTab = ref(props.showHelpInfo ? 'help' : 'attachments')
const loading = ref(false)
const helpText = ref('')
const menu = useMenuStore()

const attachments = ref<AttachmentItem[]>([])
// 判断是否隐藏
const isHide = computed(() => !helpText.value.trim() && attachments.value.length === 0)

watch(
  () => props.showHelpInfo,
  (visible) => {
    if (!visible && activeTab.value === 'help') {
      activeTab.value = 'attachments'
    }
  }
)

const downloadFile = async (fjmc: string, uuid: string): Promise<void> => {
  try {
    loading.value = true
    const blob: any = await downloadFj({ fileName: fjmc, uuid: uuid })
    const dom = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    dom.href = url
    // 获取文件名
    dom.download = decodeURIComponent(fjmc)
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  } catch (e: any) {
    console.error('文件下载失败:', e.toString())
    handleError(e as Error, '文件下载失败')
  } finally {
    loading.value = false
  }
}

// 批量下载文件
const downloadAllFiles = async (): Promise<void> => {
  if (attachments.value.length === 0) return
  try {
    loading.value = true
    // 依次下载文件，避免同时下载过多文件
    for (const file of attachments.value) {
      await downloadFile(file.fjmc, file.uuid)
      // 添加小延迟避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  } catch (e: any) {
    handleError(e as Error, '批量下载失败')
  } finally {
    loading.value = false
  }
}

// 格式化帮助文本，支持基础HTML
const formatHelpText = (text: string): string => {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

// 获取文件扩展名
const getFileExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ext ? ext.toUpperCase() : 'FILE'
}

// 获取文件图标
const getFileIcon = (filename: string): Component => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, Component> = {
    pdf: Document,
    doc: Document,
    docx: Document,
    xls: Grid,
    xlsx: Grid,
    ppt: Present,
    pptx: Present,
    txt: Document,
    zip: Box,
    rar: Box,
    '7z': Box,
    jpg: Picture,
    jpeg: Picture,
    png: Picture,
    gif: Picture,
    mp4: VideoCamera,
    avi: VideoCamera,
    mov: VideoCamera,
    mp3: Headset,
    wav: Headset
  }
  return iconMap[ext] || Document
}

const showModalHandle = async (): Promise<void> => {
  try {
    loading.value = true
    const url = (props.menuUrl || '').trim() || menu.menuMsg.url || ''
    activeTab.value = props.showHelpInfo ? 'help' : 'attachments'
    const result = await getMenuMessage(url)

    if (result.success) {
      const [helpMessage, downloadFile] = await Promise.allSettled([getConfigByMenuId(result.data.id), listFj(result.data.id)])
      if (helpMessage.status === 'fulfilled' && helpMessage.value.success && helpMessage.value.data && helpMessage.value.data.status === '1') {
        helpText.value = helpMessage.value.data.helpInfo || ''
        if (downloadFile.status === 'fulfilled' && downloadFile.value.success && downloadFile.value.data) {
          attachments.value = downloadFile.value.data || []
        }
      } else {
        helpText.value = ''
        attachments.value = []
      }
    } else {
      throw new Error(result.msg)
    }
  } catch (e) {
    helpText.value = ''
    attachments.value = []
  } finally {
    loading.value = false
  }
}

defineExpose({
  showModal,
  attachments,
  isHide,
  helpText,
  activeTab
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
