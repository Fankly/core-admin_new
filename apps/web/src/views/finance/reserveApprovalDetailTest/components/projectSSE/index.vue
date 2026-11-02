<template>
  <div class="projectSSE">
    <div class="data-section">
      <div class="data-header">
        <h3>模型推理过程</h3>
        <!-- ✅ 优化了 header-actions 布局，增加间距防止积压 -->
        <div class="header-actions">
          <transition name="el-fade-in">
            <div v-if="isCompleted" class="header-completion">
              <el-icon class="ep-icon-circle-check"><EpCircleCheck /></el-icon>
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

<script setup>
import { CircleCheck as EpCircleCheck } from '@element-plus/icons-vue'
import SSEClient from './SSEClient'
import { ElMessage } from 'element-plus'
import { nextTick, reactive, toRef, toRefs, computed, onMounted, onBeforeUnmount, useTemplateRef } from 'vue'
defineOptions({
  name: 'projectSSE'
})
const componentProps = defineProps({
  id: String,
  useItemDiff: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits()
const scrollContainerRef = useTemplateRef('scrollContainer')
const componentData = reactive({
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
})
const sseClient = toRef(componentData, 'sseClient')
const isConnected = toRef(componentData, 'isConnected')
const reconnecting = toRef(componentData, 'reconnecting')
const errorMessage = toRef(componentData, 'errorMessage')
const rawData = toRef(componentData, 'rawData')
const isPaused = toRef(componentData, 'isPaused')
const isCompleted = toRef(componentData, 'isCompleted')
const dataBuffer = toRef(componentData, 'dataBuffer')
const bufferFlushTimer = toRef(componentData, 'bufferFlushTimer')
const countdown = toRef(componentData, 'countdown')
const countdownTimer = toRef(componentData, 'countdownTimer')
// ⬇️ 逻辑完全保留原样 ⬇️
function defaultMethods() {
  if (!componentProps.id) {
    ElMessage.error('id为空')
    return
  }
  const apiPath = componentProps.useItemDiff ? '/api/admin/app/cwProjectItemDiff/execDiff?id=' : '/api/admin/app/cwProjectDiff/execDiff?id='
  componentData.sseClient = new SSEClient(apiPath + componentProps.id, {
    reconnectInterval: 3000,
    autoReconnect: true,
    parseJson: false
  })
  componentData.sseClient.on('open', () => {
    componentData.isConnected = true
    componentData.reconnecting = false
    componentData.errorMessage = ''
  })
  componentData.sseClient.on('message', handleDataChunk)
  componentData.sseClient.on('partial', handleDataChunk)
  componentData.sseClient.on('error', (error) => {
    componentData.errorMessage = error.message || '连接异常'
    componentData.reconnecting = !componentData.isCompleted
  })
  componentData.sseClient.on('reconnect', () => {
    if (!componentData.isCompleted) componentData.reconnecting = true
  })
  componentData.sseClient.on('reconnecting', () => {
    if (!componentData.isCompleted) componentData.reconnecting = true
  })
  componentData.sseClient.on('close', () => {
    componentData.isConnected = false
    if (!componentData.isCompleted) componentData.reconnecting = true
  })
  componentData.sseClient.connect()
}
function startCountdown(number = 5) {
  if (componentData.countdownTimer) clearInterval(componentData.countdownTimer)
  componentData.countdown = number
  componentData.countdownTimer = setInterval(() => {
    componentData.countdown--
    onCountdownTick(componentData.countdown)
    if (componentData.countdown <= 0) {
      clearInterval(componentData.countdownTimer)
      onCountdownEnd()
    }
  }, 1000)
}
function onCountdownTick(secondsRemaining) {}
function onCountdownEnd() {
  emit('onCountdownEnd')
}
function handleDataChunk(chunk) {
  if (componentData.isCompleted || componentData.isPaused) return
  componentData.dataBuffer += chunk
  if (componentData.dataBuffer.includes('[DONE]')) {
    if (componentData.bufferFlushTimer) {
      clearTimeout(componentData.bufferFlushTimer)
      componentData.bufferFlushTimer = null
    }
    const doneIndex = componentData.dataBuffer.indexOf('[DONE]')
    const processedChunk = componentData.dataBuffer.substring(0, doneIndex)
    componentData.rawData += processedChunk
    componentData.dataBuffer = ''
    componentData.isCompleted = true
    closeConnection()
    startCountdown()
    return
  }
  if (!componentData.bufferFlushTimer) {
    componentData.bufferFlushTimer = setTimeout(() => {
      componentData.rawData += componentData.dataBuffer
      if (componentData.rawData.length > 300000) componentData.rawData = componentData.rawData.slice(-150000)
      componentData.dataBuffer = ''
      componentData.bufferFlushTimer = null
      // 自动滚动到最新位置
      nextTick(() => {
        const container = scrollContainerRef.value
        if (container) container.scrollTop = container.scrollHeight
      })
    }, 200)
  }
}
function closeConnection() {
  if (componentData.sseClient) {
    componentData.sseClient.close()
    componentData.isConnected = false
  }
  if (componentData.bufferFlushTimer) {
    clearTimeout(componentData.bufferFlushTimer)
    componentData.bufferFlushTimer = null
  }
}
const processedHtml = computed(() => {
  if (!componentData.rawData) return ''
  return componentData.rawData
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/>\s+</g, '><') // 去除标签间的冗余换行/空格
    .replace(/\n/g, '<br/>') // 将文本换行转为 HTML 换行
})
const statusText = computed(() => {
  if (componentData.errorMessage) return `异常: ${componentData.errorMessage}`
  if (componentData.isCompleted) return '推理完成'
  if (componentData.reconnecting) return '推理中...'
  if (componentData.isConnected) return componentData.isPaused ? '已暂停' : '推理中'
  return '未连接'
})
const statusClass = computed(() => {
  if (componentData.errorMessage) return 'status-error'
  if (componentData.isCompleted) return 'status-completed'
  if (componentData.reconnecting) return 'status-reconnecting'
  if (componentData.isConnected) return componentData.isPaused ? 'status-paused' : 'status-active'
  return 'status-disconnected'
})
onMounted(() => {
  defaultMethods()
})
onBeforeUnmount(() => {
  closeConnection()
  if (componentData.countdownTimer) clearInterval(componentData.countdownTimer)
})
defineExpose({
  EpCircleCheck,
  defaultMethods,
  startCountdown,
  onCountdownTick,
  onCountdownEnd,
  handleDataChunk,
  closeConnection,
  ...toRefs(componentData),
  processedHtml,
  statusText,
  statusClass
})
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
      background-color: @--color-primary;
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
  color: @--color-primary;
}
</style>
