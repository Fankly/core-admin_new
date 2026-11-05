<template>
  <vxe-modal
    :loading="loading"
    @show="showModalHandle"
    :class-name="props.glass ? 'help-modal--glass' : 'help-modal'"
    :transfer="true"
    :mask="true"
    :lock-view="true"
    height="600"
    :width="props.glass ? '720px' : '900px'"
    :destroy-on-close="true"
    :title="props.title"
    :show-footer="props.glass"
    :show-zoom="!props.glass"
    v-model="showModal"
    :resize="!props.glass"
    position="center"
  >
    <!-- 玻璃风变体（仅页眉「用户手册」使用）：与首页「更多」弹窗同款头部 -->
    <template v-if="props.glass" #title>
      <div class="help-glass-head">
        <span class="help-glass-head-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M11.4 5.2C9.4 4 6.9 3.8 4.6 4.6c-.7.2-1.1.8-1.1 1.5v11.1c0 1 .9 1.6 1.8 1.3 1.9-.7 3.9-.5 5.5.6.5.3 1.1.3 1.5 0 1.6-1.1 3.6-1.3 5.5-.6.9.3 1.8-.3 1.8-1.3V6.1c0-.7-.4-1.3-1.1-1.5-2.3-.8-4.8-.6-6.8.6-.2.1-.6.1-.9 0Z"
            />
            <path d="M12 5.9v12.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".65" />
          </svg>
        </span>
        <span class="help-glass-head-text">
          <span class="help-glass-title">{{ props.title }}</span>
          <span class="help-glass-sub">已发布文件 · 共 {{ attachments.length }} 个</span>
        </span>
      </div>
    </template>
    <div v-if="props.glass" class="help-glass">
      <div v-if="!attachments.length" class="help-glass-status">{{ loading ? '正在加载用户手册…' : '暂无附件' }}</div>
      <ul v-else class="help-glass-list">
        <li v-for="file in attachments" :key="file.uuid">
          <button type="button" :title="file.fjmc" :disabled="loading" @click="downloadFile(file.fjmc, file.uuid)">
            <span class="help-glass-tag" :class="file.fjmc.toLowerCase().endsWith('.pdf') ? 'help-glass-tag--pdf' : 'help-glass-tag--doc'">{{
              getFileExtension(file.fjmc)
            }}</span>
            <span class="help-glass-name">{{ file.fjmc }}</span>
            <span class="help-glass-act">下载</span>
          </button>
        </li>
      </ul>
    </div>
    <div v-else class="help-modal-content">
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
          <div v-if="helpText.trim()" :class="helpText.trim() ? '' : help - text" v-html="formatHelpText(helpText)"></div>
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
    <!-- 玻璃风变体：底部左侧数量、右侧批量下载 -->
    <template v-if="props.glass" #footer>
      <div class="help-glass-foot">
        <span class="help-glass-count">共 {{ attachments.length }} 个文件</span>
        <button class="help-glass-all" type="button" :disabled="loading || !attachments.length" @click="downloadAllFiles">
          {{ loading ? '正在下载…' : '批量下载' }}
        </button>
      </div>
    </template>
  </vxe-modal>
</template>

<script lang="ts">
import { downloadFj, getConfigByMenuId, listFj } from '@/api/metrics'
import { getMenuMessage } from '@/api/process'
import { defineComponent, ref, computed, watch, toRefs } from 'vue'
import { useStore } from 'vuex'
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
    },
    // 玻璃风外观（与首页「更多」弹窗一致）：仅页眉「用户手册」入口启用，默认关闭不影响其他页面
    glass: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { expose }) {
    const showModal = ref(false)
    const activeTab = ref(props.showHelpInfo ? 'help' : 'attachments')
    const loading = ref(false)
    const helpText = ref('')
    const store = useStore()
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
        const url = (props.menuUrl || '').trim() || store.getters.getMenuMsg.url || ''
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

<style lang="less">
/* ---------- 玻璃风变体：与首页「更多」弹窗同一套设计语言 ----------
   仅 .help-modal--glass（页眉「用户手册」入口）生效；vxe-modal transfer 到 body 后
   scoped 样式打不到内部结构，故放全局块，并统一以 .help-modal--glass 作命名空间 */
.help-modal--glass {
  &.vxe-modal--wrapper {
    max-width: 94vw;
  }

  .vxe-modal--box {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 94vw;
    overflow: hidden;
    border: 1px solid #e3efec;
    border-radius: 12px;
    box-shadow: 0 30px 70px -32px rgba(11, 94, 89, 0.45);
  }

  .vxe-modal--header {
    display: flex;
    align-items: center;
    padding: 14px 16px 13px 20px;
    background: linear-gradient(180deg, #ffffff, #f7fcfb);
    border-bottom: 1px solid #eef2f4;
  }

  .vxe-modal--header-title {
    display: flex;
    flex: 1;
    align-items: center;
    min-width: 0;
  }

  .vxe-modal--body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    background: #fff;
  }

  .vxe-modal--close-btn {
    color: #94a3b8;

    &:hover {
      color: #0f9d8f;
    }
  }

  .vxe-modal--footer {
    padding: 10px 20px 14px;
    background: #fbfdfd;
    border-top: 1px solid #eef2f4;
  }

  .help-glass-head {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }

  .help-glass-head-icon {
    display: grid;
    place-items: center;
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    color: #0f9d8f;
    background: #ddf8f2;
    border-radius: 9px;

    svg {
      width: 19px;
      height: 19px;
    }
  }

  .help-glass-head-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .help-glass-title {
    color: #1e293b;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.3px;
    line-height: 1.25;
  }

  .help-glass-sub {
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.3;
  }

  .help-glass {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 6px 10px 8px;
    overflow-y: auto;
  }

  .help-glass-status {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    color: #94a3b8;
    font-size: 13px;
  }

  .help-glass-list {
    margin: 0;
    padding: 0;
    list-style: none;

    li + li {
      margin-top: 2px;
    }

    button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px;
      color: #334155;
      font: inherit;
      text-align: left;
      background: #fff;
      border: 1px solid transparent;
      border-radius: 9px;
      cursor: pointer;
      transition: background 0.16s, border-color 0.16s;

      &:hover {
        background: #f6fbfa;
        border-color: #d8efe9;

        .help-glass-name,
        .help-glass-act {
          color: #0f9d8f;
        }
      }

      &:focus-visible {
        outline: 2px solid #0f9d8f;
        outline-offset: 2px;
      }

      &:disabled {
        cursor: not-allowed;
      }
    }
  }

  .help-glass-tag {
    display: grid;
    place-items: center;
    flex: 0 0 30px;
    width: 30px;
    height: 32px;
    color: #fff;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.2px;
    border-radius: 5px;
  }

  .help-glass-tag--pdf {
    background: linear-gradient(180deg, #f4666a, #e94b4b);
  }

  .help-glass-tag--doc {
    background: linear-gradient(180deg, #5a9cf8, #3b82f6);
  }

  .help-glass-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: #334155;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    text-overflow: ellipsis;
    transition: color 0.16s;
  }

  .help-glass-act {
    flex: 0 0 auto;
    color: #94a3b8;
    font-size: 12px;
    transition: color 0.16s;
  }

  .help-glass-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .help-glass-count {
    color: #94a3b8;
    font-size: 12px;
  }

  .help-glass-all {
    padding: 0;
    color: #0f9d8f;
    font-size: 12.5px;
    font-weight: 500;
    background: none;
    border: 0;
    cursor: pointer;

    &:hover {
      color: #0b857a;
    }

    &:disabled {
      color: #cbd5e1;
      cursor: not-allowed;
    }
  }
}
</style>
