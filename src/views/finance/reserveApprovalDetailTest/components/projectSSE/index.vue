<template>
  <div class="projectSSE">
    <div class="data-section">
      <div class="data-header">
        <h3>模型推理过程</h3>
        <!-- ✅ 优化了 header-actions 布局，增加间距防止积压 -->
        <div class="header-actions">
          <transition name="el-fade-in">
            <div v-if="isCompleted" class="header-completion">
              <i class="el-icon-circle-check"></i>
              <span class="completion-text">推理已完成，即将跳转...</span>
              <span v-if="countdown" class="countdown-badge">{{ countdown }}s</span>
            </div>
          </transition>
        </div>
      </div>

      <div class="data-display">
        <!-- ✅ 逻辑：!isCompleted && rawData.length === 0 时显示 AILoading 组件 -->
        <!--  -->
        <div v-if="!isCompleted && rawData.length === 0" class="loading-container">
          <AILoading class="loading-spinner" title="AI 模型推理中" subtitle="请稍后查看" />
        </div>

        <!-- ✅ 修改：将 pre 改为 div + v-html 以支持后端传来的 HTML -->
        <!--  -->
        <div v-else class="content-wrapper">
          <div class="data-content html-render" v-html="processedHtml" ref="scrollContainer"></div>
        </div>
      </div>

      <!-- 数据统计信息 -->
      <div class="data-stats">
        <div class="stat-item">
          <span class="stat-label">输出长度:</span>
          <span class="stat-value">{{ rawData.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">当前状态:</span>
          <span class="stat-value" :class="statusClass">{{ statusText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SSEClient from './SSEClient'

export default {
  components: {}, // ✅ 注册组件
  props: {
    id: String,
    useItemDiff: {
      type: Boolean,
      default: false
    }
  },
  name: 'projectSSE',
  data() {
    return {
      // 保持原有逻辑变量不变
      sseClient: null,
      isConnected: false,
      reconnecting: true,
      errorMessage: '',
      rawData: '',
      isPaused: false,
      isCompleted: false,
      dataBuffer: '',
      bufferFlushTimer: null,
      countdown: undefined,
      countdownTimer: null
    }
  },
  mounted() {
    this.defaultMethods()
  },
  methods: {
    // ⬇️ 逻辑完全保留原样 ⬇️
    defaultMethods() {
      if (!this.id) {
        this.$message.error('id为空')
        return
      }
      const apiPath = this.useItemDiff ? '/api/admin/app/cwProjectItemDiff/execDiff?id=' : '/api/admin/app/cwProjectDiff/execDiff?id='
      this.sseClient = new SSEClient(apiPath + this.id, {
        reconnectInterval: 3000,
        autoReconnect: true,
        parseJson: false
      })

      this.sseClient.on('open', () => {
        this.isConnected = true
        this.reconnecting = false
        this.errorMessage = ''
      })

      this.sseClient.on('message', this.handleDataChunk)
      this.sseClient.on('partial', this.handleDataChunk)

      this.sseClient.on('error', (error) => {
        this.errorMessage = error.message || '连接异常'
        this.reconnecting = !this.isCompleted
      })

      this.sseClient.on('reconnect', () => {
        if (!this.isCompleted) this.reconnecting = true
      })
      this.sseClient.on('reconnecting', () => {
        if (!this.isCompleted) this.reconnecting = true
      })
      this.sseClient.on('close', () => {
        this.isConnected = false
        if (!this.isCompleted) this.reconnecting = true
      })
      this.sseClient.connect()
    },
    startCountdown(number = 5) {
      if (this.countdownTimer) clearInterval(this.countdownTimer)
      this.countdown = number
      this.countdownTimer = setInterval(() => {
        this.countdown--
        this.onCountdownTick(this.countdown)
        if (this.countdown <= 0) {
          clearInterval(this.countdownTimer)
          this.onCountdownEnd()
        }
      }, 1000)
    },
    onCountdownTick(secondsRemaining) {},
    onCountdownEnd() {
      this.$emit('onCountdownEnd')
    },
    handleDataChunk(chunk) {
      if (this.isCompleted || this.isPaused) return
      this.dataBuffer += chunk
      if (this.dataBuffer.includes('[DONE]')) {
        if (this.bufferFlushTimer) {
          clearTimeout(this.bufferFlushTimer)
          this.bufferFlushTimer = null
        }
        const doneIndex = this.dataBuffer.indexOf('[DONE]')
        const processedChunk = this.dataBuffer.substring(0, doneIndex)
        this.rawData += processedChunk
        this.dataBuffer = ''
        this.isCompleted = true
        this.closeConnection()
        this.startCountdown()
        return
      }
      if (!this.bufferFlushTimer) {
        this.bufferFlushTimer = setTimeout(() => {
          this.rawData += this.dataBuffer
          if (this.rawData.length > 300000) this.rawData = this.rawData.slice(-150000)
          this.dataBuffer = ''
          this.bufferFlushTimer = null
          // 自动滚动到最新位置
          this.$nextTick(() => {
            const container = this.$refs.scrollContainer
            if (container) container.scrollTop = container.scrollHeight
          })
        }, 200)
      }
    },
    closeConnection() {
      if (this.sseClient) {
        this.sseClient.close()
        this.isConnected = false
      }
      if (this.bufferFlushTimer) {
        clearTimeout(this.bufferFlushTimer)
        this.bufferFlushTimer = null
      }
    }
  },
  beforeUnmount() {
    this.closeConnection()
    if (this.countdownTimer) clearInterval(this.countdownTimer)
  },
  computed: {
    // ✅ 在原有的 decodeSpecialText 基础上增加 HTML 标签清理，防止 v-html 渲染空行
    processedHtml() {
      if (!this.rawData) return ''
      return this.rawData
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/>\s+</g, '><') // 去除标签间的冗余换行/空格
        .replace(/\n/g, '<br/>') // 将文本换行转为 HTML 换行
    },
    statusText() {
      if (this.errorMessage) return `异常: ${this.errorMessage}`
      if (this.isCompleted) return '推理完成'
      if (this.reconnecting) return '推理中...'
      if (this.isConnected) return this.isPaused ? '已暂停' : '推理中'
      return '未连接'
    },
    statusClass() {
      if (this.errorMessage) return 'status-error'
      if (this.isCompleted) return 'status-completed'
      if (this.reconnecting) return 'status-reconnecting'
      if (this.isConnected) return this.isPaused ? 'status-paused' : 'status-active'
      return 'status-disconnected'
    }
  }
}
</script>

<style lang="less" scoped>
.projectSSE {
  height: 100%;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.data-section {
  width: 100%;
  height: 100%;
  padding: 24px;
  background-color: #ffffff;
  /* ✅ 圆角改为 20px */
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  height: 60px;
  box-sizing: border-box;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #2c3e50;
    font-weight: 600;
    position: relative;
    padding-left: 14px;
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 18px;
      background-color: @color-primary;
      border-radius: 2px;
    }
  }
}

/* ✅ 优化 header-actions，解决积压问题 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-completion {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background-color: rgba(46, 204, 113, 0.08);
  color: #27ae60;
  /* ✅ 这里也统一圆角风格 */
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid rgba(46, 204, 113, 0.2);

  i {
    font-size: 16px;
  }

  .countdown-badge {
    background: #27ae60;
    color: white;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 12px;
    margin-left: 4px;
  }
}

.data-display {
  flex: 1;
  min-height: 0;
  background-color: #fcfcfc;
  border-radius: 16px;
  overflow: auto;
  border: 1px solid #f0f0f0;
  margin-bottom: 16px;
  position: relative;
}

.loading-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.loading-spinner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
}

.data-content {
  margin: 0;
  padding: 24px;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
}

/* 深度支持 HTML 渲染样式 */
.html-render {
  :deep(h3),
  :deep(h4) {
    margin: 16px 0 8px;
    color: #1e293b;
  }
  :deep(p) {
    margin-bottom: 10px;
  }
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    background: #fff;
    th,
    td {
      border: 1px solid #e2e8f0;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
    }
  }
}

.data-stats {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  font-size: 0.85rem;
  color: #94a3b8;
  height: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stat-value {
  font-weight: 600;
}
.status-completed {
  color: #27ae60;
}
.status-active {
  color: @color-primary;
}
</style>
