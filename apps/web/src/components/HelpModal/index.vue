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
          <i class="el-icon-question"></i>
          <span>帮助信息</span>
        </div>
        <div class="help-tab" :class="{ active: activeTab === 'attachments' }" @click="activeTab = 'attachments'">
          <i class="el-icon-paperclip"></i>
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
            <i class="el-icon-info"></i>
            <p>暂无帮助信息</p>
          </div>
        </div>

        <!-- 附件列表 -->
        <div v-else class="attachment-section">
          <div v-if="attachments.length === 0" class="empty-content">
            <i class="el-icon-folder-opened"></i>
            <p>暂无附件</p>
          </div>
          <div v-else>
            <!-- 工具栏 -->
            <div class="attachment-toolbar">
              <div class="toolbar-info">
                <i class="el-icon-files"></i>
                <span>共 {{ attachments.length }} 个文件</span>
              </div>
              <div class="toolbar-actions">
                <button class="download-all-btn" @click="downloadAllFiles" :disabled="loading" title="批量下载">
                  <i class="el-icon-download"></i>
                  批量下载
                </button>
              </div>
            </div>

            <!-- 文件列表 -->
            <div class="file-list">
              <div v-for="(file, idx) in attachments" :key="file.uuid" class="file-item" @click="downloadFile(file.fjmc, file.uuid)">
                <div class="file-icon">
                  <i :class="getFileIcon(file.fjmc)"></i>
                </div>
                <div class="file-info">
                  <div class="file-name" :title="file.fjmc">{{ file.fjmc }}</div>
                  <div class="file-meta">
                    <span class="file-index">{{ idx + 1 }}</span>
                    <span class="file-ext">{{ getFileExtension(file.fjmc) }}</span>
                  </div>
                </div>
                <div class="file-actions">
                  <i class="el-icon-download"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </vxe-modal>
</template>

<script lang="ts">
import { downloadFj, getConfigByMenuId, listFj } from '@/api/metrics'
import { getMenuMessage } from '@/api/process'
import { defineComponent, ref, computed, watch, toRefs } from 'vue'
import { useAppStore } from '@/store'
import { handleError } from '@/utils/error'

export default defineComponent({
  name: 'HelpModal',
  props: {
    showHelpInfo: {
      type: Boolean,
      default: true
    },
    menuUrl: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: '帮助中心'
    }
  },
  setup(props, { expose }) {
    const showModal = ref(false)
    const activeTab = ref(props.showHelpInfo ? 'help' : 'attachments')
    const loading = ref(false)
    const helpText = ref('')
    const store = useAppStore()
    interface AttachmentItem {
      fjmc: string
      uuid: string
    }

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
        let dom = document.createElement('a')
        let url = window.URL.createObjectURL(blob)
        dom.href = url
        // 获取文件名
        let filename = fjmc
        dom.download = decodeURIComponent(filename)
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
    const getFileIcon = (filename: string): string => {
      const ext = filename.split('.').pop()?.toLowerCase() || ''
      const iconMap: Record<string, string> = {
        pdf: 'el-icon-document',
        doc: 'el-icon-document',
        docx: 'el-icon-document',
        xls: 'el-icon-s-grid',
        xlsx: 'el-icon-s-grid',
        ppt: 'el-icon-present',
        pptx: 'el-icon-present',
        txt: 'el-icon-document',
        zip: 'el-icon-box',
        rar: 'el-icon-box',
        '7z': 'el-icon-box',
        jpg: 'el-icon-picture',
        jpeg: 'el-icon-picture',
        png: 'el-icon-picture',
        gif: 'el-icon-picture',
        mp4: 'el-icon-video-camera',
        avi: 'el-icon-video-camera',
        mov: 'el-icon-video-camera',
        mp3: 'el-icon-headset',
        wav: 'el-icon-headset'
      }
      return iconMap[ext] || 'el-icon-document'
    }

    const showModalHandle = async (): Promise<void> => {
      try {
        loading.value = true
        const url = (props.menuUrl || '').trim() || store.getMenuMsg.url || ''
        activeTab.value = props.showHelpInfo ? 'help' : 'attachments'
        const result = await getMenuMessage(url)
        console.log(result)

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

    expose({
      showModal,
      attachments,
      isHide,
      helpText,
      activeTab
    })

    return {
      showModal,
      showModalHandle,
      downloadFile,
      downloadAllFiles,
      formatHelpText,
      getFileExtension,
      getFileIcon,
      attachments,
      helpText,
      props,
      activeTab,
      loading
    }
  }
})
</script>

<style scoped lang="less">
@import url(./index.less);
</style>
