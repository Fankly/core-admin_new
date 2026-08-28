<template>
  <Teleport v-if="props.available && chatConfigured" to="body">
    <button
      v-if="!visible"
      type="button"
      class="ai-chat-trigger"
      :style="{ top: `${triggerY}px` }"
      aria-label="打开预算助手"
      title="预算助手"
      @pointerdown="startTriggerDrag"
      @click="handleTriggerClick"
      @keydown.enter.prevent="open"
      @keydown.space.prevent="open"
    >
      <span class="ai-chat-trigger__shadow" aria-hidden="true"></span>
      <span class="ai-chat-trigger__stage" aria-hidden="true">
        <img :src="mascotImage" alt="" draggable="false" />
        <span class="ai-chat-trigger__signal"></span>
      </span>
    </button>

    <section
      v-else
      ref="widgetRef"
      class="ai-chat-widget"
      :class="{ 'is-mobile': isMobile, 'is-compact': isCompact, 'is-maximized': isMaximized, 'has-step-panel': stepsVisible && !isMobile }"
      :style="widgetStyle"
      role="dialog"
      aria-modal="false"
      aria-label="预算助手聊天工作台"
    >
      <header class="ai-chat-widget__header" @pointerdown="startPanelDrag">
        <div class="ai-chat-widget__identity">
          <span class="ai-chat-widget__logo" aria-hidden="true"><img :src="mascotImage" alt="" /></span>
          <div class="ai-chat-widget__identity-copy">
            <h2>预算助手</h2>
          </div>
        </div>
        <div class="ai-chat-widget__tools">
          <el-tooltip v-if="!isMobile && !isCompact" :content="isMaximized ? '还原窗口' : '最大化'" placement="bottom">
            <button type="button" :aria-label="isMaximized ? '还原窗口' : '最大化聊天窗口'" :aria-pressed="isMaximized" @click="toggleMaximize">
              <Minimize2 v-if="isMaximized" :size="17" aria-hidden="true" />
              <Maximize2 v-else :size="17" aria-hidden="true" />
            </button>
          </el-tooltip>
          <el-tooltip content="收起" placement="bottom">
            <button type="button" aria-label="收起聊天窗口" @click="close"><X :size="18" aria-hidden="true" /></button>
          </el-tooltip>
        </div>
      </header>

      <nav v-if="isMobile" class="ai-chat-mobile-tabs" aria-label="聊天视图">
        <button type="button" :class="{ 'is-active': mobileView === 'chat' }" @click="mobileView = 'chat'">对话</button>
        <button type="button" :class="{ 'is-active': mobileView === 'steps' }" @click="showMobileSteps">
          步骤<span v-if="traceCount">{{ traceCount }}</span>
        </button>
      </nav>

      <div v-if="isCompact && sessionPanelVisible" class="ai-chat-session-drawer">
        <button class="ai-chat-session-drawer__scrim" type="button" aria-label="关闭会话列表" @click="sessionPanelVisible = false"></button>
        <AiChatSessionPanel
          :sessions="sessions"
          :active-id="activeSessionId"
          :locked="sessionLocked"
          @new="handleNewSession"
          @select="handleSelectSession"
          @rename="renameSession"
          @delete="confirmDeleteSession"
          @close="sessionPanelVisible = false"
        />
      </div>

      <div class="ai-chat-widget__body" :style="bodyStyle">
        <AiChatSessionPanel
          v-if="!isCompact && sessionPanelVisible"
          :sessions="sessions"
          :active-id="activeSessionId"
          :locked="sessionLocked"
          @new="handleNewSession"
          @select="handleSelectSession"
          @rename="renameSession"
          @delete="confirmDeleteSession"
          @close="sessionPanelVisible = false"
        />

        <div v-show="!isMobile || mobileView === 'chat'" class="ai-chat-widget__chat-pane">
          <AiChatPanel
            ref="panelRef"
            :messages="messages"
            :draft="draft"
            :is-streaming="isStreaming"
            :can-send="canSend"
            :user-code="userCode"
            :identity-error="identityError"
            :agent-options="agentOptions"
            :selected-agent-code="selectedAgentCode"
            :selected-assistant-id="selectedAssistantId"
            :session-panel-visible="sessionPanelVisible"
            :steps-visible="stepsVisible"
            :steps-toggle-visible="!isMobile"
            :trace-count="traceCount"
            :unread-steps="unreadSteps"
            :scroll-version="scrollVersion"
            @update:draft="draft = $event"
            @send="send"
            @stop="stop"
            @retry="retry"
            @select-agent="selectAgent"
            @select-message="handleSelectMessage"
            @show-sessions="sessionPanelVisible = true"
            @show-steps="expandSteps"
          />
        </div>

        <button
          v-if="stepsVisible && !isMobile"
          type="button"
          class="ai-chat-widget__divider"
          aria-label="调整步骤面板宽度"
          title="拖动调整步骤面板宽度"
          @pointerdown="startTraceResize"
        ></button>

        <div v-if="stepsVisible || isMobile" v-show="!isMobile || mobileView === 'steps'" class="ai-chat-widget__trace-pane">
          <aside class="ai-business-panel" aria-label="智能体业务功能">
            <div class="ai-business-panel__tabs" role="tablist" aria-label="业务功能">
              <button type="button" role="tab" aria-selected="true" class="ai-business-panel__tab is-active">
                <ListTree :size="15" aria-hidden="true" />
                <span>步骤输出</span>
                <span v-if="traceCount" class="ai-business-panel__count">{{ traceCount > 99 ? '99+' : traceCount }}</span>
              </button>
              <el-tooltip v-if="!isMobile" content="收起步骤" placement="bottom">
                <button type="button" class="ai-business-panel__close" aria-label="收起步骤" @click="collapseSteps()">
                  <PanelRightClose :size="16" aria-hidden="true" />
                </button>
              </el-tooltip>
            </div>
            <AiChatTracePanel :message="selectedTraceMessage" :preferred-step-id="preferredTraceStepId" />
          </aside>
        </div>
      </div>

      <button
        v-if="!isMobile && !isCompact"
        type="button"
        class="ai-chat-widget__resize-handle"
        aria-label="调整聊天窗口大小"
        title="拖动调整窗口大小"
        @pointerdown="startPanelResize"
        @keydown="handleResizeKeydown"
      ></button>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { ElMessageBox } from 'element-plus'
import { ListTree, Maximize2, Minimize2, PanelRightClose, X } from 'lucide-vue-next'
import { getCache, setCache } from '@/utils/cache'
import mascotImage from '@/assets/images/ai-chat/sudian-ai-mascot.png'
import AiChatPanel from './AiChatPanel.vue'
import AiChatSessionPanel from './AiChatSessionPanel.vue'
import AiChatTracePanel from './AiChatTracePanel.vue'
import { useAiChat } from './useAiChat'
import { AiChatPanelGeometry } from './types'

const props = withDefaults(defineProps<{ available?: boolean }>(), { available: true })
const isMobile = useMediaQuery('(max-width: 768px)')
const isCompact = useMediaQuery('(max-width: 1024px)')
const visible = ref(false)
const isMaximized = ref(false)
const sessionPanelVisible = ref(!isCompact.value)
const stepsVisible = ref(!isMobile.value)
const mobileView = ref<'chat' | 'steps'>('chat')
const unreadSteps = ref(false)
const preferredTraceStepId = ref('')
const triggerY = ref(Number(getCache('ai-chat-trigger-y', undefined, Math.max(90, window.innerHeight / 2 - 54))) || 120)
const traceWidth = ref(Number(getCache('ai-chat-trace-width', undefined, 340)) || 340)
const widgetRef = ref<HTMLElement>()
const panelRef = ref<InstanceType<typeof AiChatPanel>>()
const defaultWidth = Math.min(1440, Math.max(960, Math.round(window.innerWidth * 0.82)))
const defaultHeight = Math.min(860, Math.max(600, Math.round(window.innerHeight * 0.84)))
const geometry = reactive<AiChatPanelGeometry>({
  width: defaultWidth,
  height: defaultHeight,
  x: (window.innerWidth - defaultWidth) / 2,
  y: (window.innerHeight - defaultHeight) / 2
})
let triggerMoved = false
let suppressTriggerClick = false
let suppressedAutoOpenVersion = -1
let removeActivePointerListeners: (() => void) | null = null

const {
  sessions,
  activeSessionId,
  messages,
  draft,
  isStreaming,
  sessionLocked,
  selectedAssistantId,
  selectedTraceMessage,
  userCode,
  identityError,
  chatConfigured,
  agentOptions,
  selectedAgentCode,
  canSend,
  scrollVersion,
  traceAutoOpenVersion,
  send,
  retry,
  stop,
  selectAssistant,
  selectAgent,
  newSession,
  selectSession,
  renameSession,
  deleteSession
} = useAiChat()

const traceCount = computed(() => selectedTraceMessage.value?.trace?.length || 0)
const widgetStyle = computed(() =>
  isMobile.value || isMaximized.value
    ? undefined
    : { width: `${geometry.width}px`, height: `${geometry.height}px`, left: `${geometry.x}px`, top: `${geometry.y}px` }
)
const bodyStyle = computed(() => ({ '--ai-trace-width': `${traceWidth.value}px` }))
const currentMinWidth = () => Math.min(isCompact.value ? 620 : stepsVisible.value ? 880 : 720, Math.max(340, window.innerWidth - 24))
const clampGeometry = () => {
  const minHeight = Math.min(520, Math.max(280, window.innerHeight - 24))
  const maxWidth = Math.max(340, window.innerWidth - 24)
  const minWidth = currentMinWidth()
  geometry.width = Math.min(Math.max(geometry.width, minWidth), maxWidth)
  geometry.height = Math.min(Math.max(geometry.height, minHeight), Math.max(minHeight, window.innerHeight - 24))
  geometry.x = Math.min(Math.max(geometry.x, 12), Math.max(12, window.innerWidth - geometry.width - 12))
  geometry.y = Math.min(Math.max(geometry.y, 12), Math.max(12, window.innerHeight - geometry.height - 12))
  traceWidth.value = Math.min(Math.max(traceWidth.value, 280), Math.max(280, geometry.width - 360))
}
const persistGeometry = () => {
  setCache('ai-chat-geometry', { ...geometry })
  setCache('ai-chat-trace-width', String(traceWidth.value))
}
const syncGeometryFromElement = () => {
  const rect = widgetRef.value?.getBoundingClientRect()
  if (!rect?.width || !rect.height) return
  geometry.width = Math.round(rect.width)
  geometry.height = Math.round(rect.height)
  geometry.x = Math.round(rect.left)
  geometry.y = Math.round(rect.top)
}
const trackPointer = (move: (event: PointerEvent) => void, finish: () => void) => {
  removeActivePointerListeners?.()
  let finished = false
  const end = () => {
    if (finished) return
    finished = true
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', end)
    removeActivePointerListeners = null
    finish()
  }
  removeActivePointerListeners = end
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', end)
  window.addEventListener('pointercancel', end)
}
const expandSteps = () => {
  if (isMobile.value) return
  stepsVisible.value = true
  unreadSteps.value = false
  clampGeometry()
  persistGeometry()
}
const collapseSteps = (manual = true) => {
  if (!stepsVisible.value) return
  stepsVisible.value = false
  if (manual) suppressedAutoOpenVersion = traceAutoOpenVersion.value
  clampGeometry()
  persistGeometry()
}
const showMobileSteps = () => {
  mobileView.value = 'steps'
  unreadSteps.value = false
}
const handleSelectMessage = (messageId: string, stepId = '') => {
  preferredTraceStepId.value = stepId
  selectAssistant(messageId)
  if (isMobile.value) showMobileSteps()
  else expandSteps()
}
const open = () => {
  visible.value = true
  isMaximized.value = false
  if (!isMobile.value) stepsVisible.value = true
  nextTick(() => {
    clampGeometry()
    panelRef.value?.scrollToLatest()
    panelRef.value?.focusComposer()
  })
}
const close = () => {
  if (!isMobile.value && !isCompact.value && !isMaximized.value) {
    syncGeometryFromElement()
    clampGeometry()
    persistGeometry()
  }
  visible.value = false
  isMaximized.value = false
}
const toggleMaximize = () => {
  if (isMobile.value || isCompact.value) return
  if (!isMaximized.value) {
    syncGeometryFromElement()
    persistGeometry()
    isMaximized.value = true
    return
  }
  isMaximized.value = false
  nextTick(() => {
    clampGeometry()
    persistGeometry()
  })
}
const confirmDeleteSession = async (id: string) => {
  const session = sessions.value.find((item) => item.id === id)
  if (!session) return
  try {
    await ElMessageBox.confirm(`确定删除会话“${session.title}”吗？删除后无法恢复。`, '删除会话', {
      confirmButtonText: '删 除',
      cancelButtonText: '取 消',
      type: 'warning',
      modalClass: 'ai-chat-clear-overlay'
    })
    await deleteSession(id)
  } catch {
    // User cancelled.
  }
}
const handleNewSession = async () => {
  await newSession()
  sessionPanelVisible.value = !isCompact.value
  nextTick(() => panelRef.value?.focusComposer())
}
const handleSelectSession = (id: string) => {
  selectSession(id)
  if (isCompact.value) sessionPanelVisible.value = false
  nextTick(() => panelRef.value?.scrollToLatest())
}
const startPanelDrag = (event: PointerEvent) => {
  if (isMobile.value || event.button !== 0 || (event.target as HTMLElement).closest('button')) return
  event.preventDefault()
  syncGeometryFromElement()
  const startX = event.clientX,
    startY = event.clientY,
    originX = geometry.x,
    originY = geometry.y
  document.body.classList.add('ai-chat-is-dragging')
  const move = (moveEvent: PointerEvent) => {
    geometry.x = originX + moveEvent.clientX - startX
    geometry.y = originY + moveEvent.clientY - startY
    clampGeometry()
  }
  const end = () => {
    document.body.classList.remove('ai-chat-is-dragging')
    persistGeometry()
  }
  trackPointer(move, end)
}
const startPanelResize = (event: PointerEvent) => {
  if (event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  syncGeometryFromElement()
  const startX = event.clientX,
    startY = event.clientY,
    originWidth = geometry.width,
    originHeight = geometry.height
  document.body.classList.add('ai-chat-is-panel-resizing')
  const move = (moveEvent: PointerEvent) => {
    geometry.width = originWidth + moveEvent.clientX - startX
    geometry.height = originHeight + moveEvent.clientY - startY
    clampGeometry()
  }
  const end = () => {
    document.body.classList.remove('ai-chat-is-panel-resizing')
    persistGeometry()
  }
  trackPointer(move, end)
}
const handleResizeKeydown = (event: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  const increment = event.shiftKey ? 40 : 10
  if (event.key === 'ArrowLeft') geometry.width -= increment
  if (event.key === 'ArrowRight') geometry.width += increment
  if (event.key === 'ArrowUp') geometry.height -= increment
  if (event.key === 'ArrowDown') geometry.height += increment
  clampGeometry()
  persistGeometry()
}
const startTraceResize = (event: PointerEvent) => {
  if (event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  const startX = event.clientX,
    originWidth = traceWidth.value
  document.body.classList.add('ai-chat-is-resizing')
  const move = (moveEvent: PointerEvent) => {
    traceWidth.value = Math.min(Math.max(originWidth - (moveEvent.clientX - startX), 280), Math.max(280, geometry.width - 360))
  }
  const end = () => {
    document.body.classList.remove('ai-chat-is-resizing')
    persistGeometry()
  }
  trackPointer(move, end)
}
const startTriggerDrag = (event: PointerEvent) => {
  if (event.button !== 0) return
  event.preventDefault()
  const originY = triggerY.value,
    startY = event.clientY
  triggerMoved = false
  const move = (moveEvent: PointerEvent) => {
    if (Math.abs(moveEvent.clientY - startY) > 4) triggerMoved = true
    triggerY.value = Math.min(Math.max(60, originY + moveEvent.clientY - startY), Math.max(60, window.innerHeight - 116))
  }
  const end = () => {
    setCache('ai-chat-trigger-y', String(triggerY.value))
    if (triggerMoved) {
      suppressTriggerClick = true
      window.setTimeout(() => (suppressTriggerClick = false), 0)
    }
  }
  trackPointer(move, end)
}
const handleTriggerClick = () => {
  if (!suppressTriggerClick) open()
}
const handleViewportResize = () => {
  triggerY.value = Math.min(triggerY.value, Math.max(60, window.innerHeight - 116))
  if (!isMobile.value && !isMaximized.value) {
    clampGeometry()
    persistGeometry()
  }
}
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && visible.value) close()
}

watch(traceAutoOpenVersion, (version) => {
  unreadSteps.value = true
  if (!isMobile.value && version !== suppressedAutoOpenVersion) expandSteps()
})
watch(isMobile, (mobile) => {
  if (mobile) isMaximized.value = false
  if (mobile) {
    mobileView.value = 'chat'
    sessionPanelVisible.value = false
  } else {
    mobileView.value = 'chat'
    stepsVisible.value = true
    sessionPanelVisible.value = true
  }
})
watch(isCompact, (compact) => {
  if (compact) isMaximized.value = false
  if (compact) sessionPanelVisible.value = false
})

onMounted(() => {
  clampGeometry()
  window.addEventListener('resize', handleViewportResize)
  window.addEventListener('keydown', handleEscape)
})
onBeforeUnmount(() => {
  removeActivePointerListeners?.()
  window.removeEventListener('resize', handleViewportResize)
  window.removeEventListener('keydown', handleEscape)
  document.body.classList.remove('ai-chat-is-dragging', 'ai-chat-is-resizing', 'ai-chat-is-panel-resizing')
})
</script>

<style scoped lang="less">
.ai-chat-trigger {
  position: fixed;
  right: -38px;
  z-index: 1800;
  width: 96px;
  height: 112px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: grab;
  perspective: 320px;
  touch-action: none;
  transition: right 0.42s cubic-bezier(0.16, 1, 0.3, 1), filter 0.18s ease;
}
.ai-chat-trigger__stage {
  position: absolute;
  inset: 0;
  display: block;
  transform-style: preserve-3d;
  animation: ai-chat-mascot-idle 3.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.ai-chat-trigger__stage img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(-2px 5px 5px rgba(15, 23, 42, 0.2));
  pointer-events: none;
  transform: rotateY(0deg) rotateZ(0deg);
  transform-origin: 50% 76%;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
  user-select: none;
}
.ai-chat-trigger__shadow {
  position: absolute;
  right: 20px;
  bottom: 3px;
  left: 20px;
  height: 12px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.22);
  filter: blur(5px);
  transform: scaleX(0.84);
  animation: ai-chat-mascot-shadow 3.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.ai-chat-trigger__signal {
  position: absolute;
  top: 3px;
  left: 43px;
  width: 10px;
  height: 10px;
  box-sizing: border-box;
  border: 2px solid rgba(255, 188, 69, 0.78);
  border-radius: 50%;
  animation: ai-chat-mascot-signal 2.4s ease-out infinite;
}
.ai-chat-trigger:hover,
.ai-chat-trigger:focus-visible {
  right: 6px;
  filter: brightness(1.04) saturate(1.04);
  outline: 0;
}
.ai-chat-trigger:hover .ai-chat-trigger__stage img,
.ai-chat-trigger:focus-visible .ai-chat-trigger__stage img {
  filter: drop-shadow(-4px 8px 7px rgba(15, 23, 42, 0.24));
  transform: rotateY(-11deg) rotateZ(-2deg) scale(1.06);
}
.ai-chat-trigger:focus-visible::after {
  position: absolute;
  inset: 4px;
  border: 2px solid #00706b;
  border-radius: 12px;
  content: '';
}
.ai-chat-trigger:active {
  right: 6px;
  cursor: grabbing;
}
.ai-chat-trigger:active .ai-chat-trigger__stage img {
  transform: rotateY(-5deg) scale(0.96);
}
.ai-chat-widget {
  position: fixed;
  z-index: 1800;
  display: flex;
  min-width: 340px;
  min-height: min(520px, calc(100dvh - 24px));
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 24px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #d7e3e2;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.2);
  animation: ai-chat-enter 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.ai-chat-widget.has-step-panel {
  min-width: min(880px, calc(100vw - 24px));
}
.ai-chat-widget.is-maximized {
  inset: 12px !important;
  width: auto !important;
  height: auto !important;
  max-width: none;
  max-height: none;
}
.ai-chat-widget__header {
  display: flex;
  height: 60px;
  flex: 0 0 60px;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 14px;
  color: #ffffff;
  background: #00706b;
  cursor: move;
  user-select: none;
  touch-action: none;
}
.ai-chat-widget__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}
.ai-chat-widget__logo {
  display: flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f2f9f8;
  overflow: hidden;
}
.ai-chat-widget__logo img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 2px 2px rgba(0, 73, 69, 0.2));
}
.ai-chat-widget__identity-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.ai-chat-widget h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}
.ai-chat-widget__tools {
  display: flex;
  align-items: center;
  gap: 2px;
}
.ai-chat-widget__tools button {
  position: relative;
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: #ffffff;
  background: transparent;
  cursor: pointer;
}
.ai-chat-widget__tools button:hover:not(:disabled),
.ai-chat-widget__tools button:focus-visible:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
}
.ai-chat-widget__tools button:disabled {
  color: rgba(255, 255, 255, 0.45);
  cursor: not-allowed;
}
.ai-chat-widget__step-badge {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 14px;
  height: 14px;
  box-sizing: border-box;
  padding: 0 3px;
  border-radius: 7px;
  color: #00706b;
  background: #ffffff;
  font-size: 12px;
  font-weight: 700;
  line-height: 14px;
}
.ai-chat-widget__step-badge.has-update {
  color: #ffffff;
  background: #f56c6c;
}
.ai-chat-widget__body {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  background: #ffffff;
}
.ai-chat-widget__chat-pane {
  display: flex;
  width: 0;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}
.ai-chat-widget__trace-pane {
  display: flex;
  width: var(--ai-trace-width);
  min-width: 280px;
  min-height: 0;
  flex: 0 0 var(--ai-trace-width);
}
.ai-business-panel {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: #f8fbfb;
}
.ai-business-panel__tabs {
  display: grid;
  min-height: 52px;
  flex: 0 0 52px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 0 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}
.ai-business-panel__tabs button {
  position: relative;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
  border: 0;
  color: #64748b;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
}
.ai-business-panel__tabs .ai-business-panel__close {
  width: 30px;
  height: 30px;
  align-self: center;
  justify-self: end;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #64748b;
}
.ai-business-panel__tabs .ai-business-panel__close:hover,
.ai-business-panel__tabs .ai-business-panel__close:focus-visible {
  color: #00706b;
  background: #e6f4f3;
  outline: 0;
}
.ai-business-panel__tabs button:hover,
.ai-business-panel__tabs button:focus-visible {
  color: #00706b;
  background: #f5fbfb;
  outline: 0;
}
.ai-business-panel__tabs button.is-active {
  color: #00706b;
  font-weight: 600;
}
.ai-business-panel__tabs button.is-active::after {
  position: absolute;
  right: 18%;
  bottom: -1px;
  left: 18%;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: #00706b;
  content: '';
}
.ai-business-panel__count {
  min-width: 17px;
  height: 17px;
  box-sizing: border-box;
  padding: 0 4px;
  border-radius: 8px;
  color: #ffffff;
  background: #00706b;
  font-size: 12px;
  line-height: 17px;
  text-align: center;
}
.ai-chat-widget__divider {
  position: relative;
  width: 6px;
  flex: 0 0 6px;
  padding: 0;
  border: 0;
  border-right: 1px solid #e2e8f0;
  border-left: 1px solid #e2e8f0;
  background: #f8fafc;
  cursor: col-resize;
  touch-action: none;
}
.ai-chat-widget__divider:hover,
.ai-chat-widget__divider:focus-visible {
  background: #dff3f0;
  outline: 0;
}
.ai-chat-widget__resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 4;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: nwse-resize;
  touch-action: none;
}
.ai-chat-widget__resize-handle::before,
.ai-chat-widget__resize-handle::after {
  position: absolute;
  right: 4px;
  bottom: 4px;
  border-right: 2px solid #94a3b8;
  border-bottom: 2px solid #94a3b8;
  content: '';
}
.ai-chat-widget__resize-handle::before {
  width: 11px;
  height: 11px;
}
.ai-chat-widget__resize-handle::after {
  width: 5px;
  height: 5px;
}
.ai-chat-widget__resize-handle:hover::before,
.ai-chat-widget__resize-handle:hover::after,
.ai-chat-widget__resize-handle:focus-visible::before,
.ai-chat-widget__resize-handle:focus-visible::after {
  border-color: #00706b;
}
.ai-chat-mobile-tabs {
  display: flex;
  height: 42px;
  flex: 0 0 42px;
  align-items: stretch;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}
.ai-chat-mobile-tabs button {
  position: relative;
  flex: 1 1 50%;
  border: 0;
  color: #64748b;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.ai-chat-mobile-tabs button.is-active {
  color: #00706b;
}
.ai-chat-mobile-tabs button.is-active::after {
  position: absolute;
  right: 28%;
  bottom: 0;
  left: 28%;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: #00706b;
  content: '';
}
.ai-chat-mobile-tabs button span {
  display: inline-block;
  min-width: 16px;
  margin-left: 5px;
  padding: 0 4px;
  border-radius: 4px;
  color: #00706b;
  background: #e6f4f3;
  font-size: 12px;
  line-height: 16px;
}
.ai-chat-session-drawer {
  position: absolute;
  inset: 60px 0 0;
  z-index: 8;
  display: flex;
}
.ai-chat-session-drawer__scrim {
  position: absolute;
  inset: 0;
  width: 100%;
  border: 0;
  background: rgba(15, 23, 42, 0.18);
  cursor: pointer;
}
.ai-chat-session-drawer .ai-session-panel {
  position: relative;
  z-index: 1;
  height: 100%;
}
.ai-chat-widget.is-mobile {
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  min-width: 0;
  min-height: 0;
  max-width: none;
  max-height: none;
  resize: none;
  border: 0;
  border-radius: 0;
}
.ai-chat-widget.is-mobile .ai-chat-widget__header {
  height: calc(60px + env(safe-area-inset-top));
  flex-basis: calc(60px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  cursor: default;
}
.ai-chat-widget.is-mobile .ai-chat-widget__trace-pane,
.ai-chat-widget.is-mobile .ai-chat-widget__chat-pane {
  width: 100%;
  min-width: 0;
  flex: 1 1 100%;
}
.ai-chat-widget.is-mobile .ai-chat-widget__body {
  position: relative;
}
button:focus-visible {
  outline: 2px solid #b8ddd9;
  outline-offset: 2px;
}
@keyframes ai-chat-enter {
  from {
    opacity: 0;
    transform: translateX(18px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes ai-chat-mascot-idle {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotateY(0deg);
  }
  48% {
    transform: translate3d(0, -7px, 9px) rotateY(-3deg);
  }
  55% {
    transform: translate3d(0, -7px, 9px) rotateY(3deg);
  }
}
@keyframes ai-chat-mascot-shadow {
  0%,
  100% {
    opacity: 0.72;
    transform: scaleX(0.84);
  }
  50% {
    opacity: 0.42;
    transform: scaleX(0.68);
  }
}
@keyframes ai-chat-mascot-signal {
  0% {
    opacity: 0.9;
    transform: scale(0.5);
  }
  70%,
  100% {
    opacity: 0;
    transform: scale(2.1);
  }
}
@media (max-width: 1024px) and (min-width: 769px) {
  .ai-chat-widget {
    inset: 12px !important;
    width: auto !important;
    height: auto !important;
    max-width: none;
    max-height: none;
  }
  .ai-chat-widget__trace-pane {
    width: min(34vw, 360px);
    flex-basis: min(34vw, 360px);
  }
}
@media (max-width: 768px) {
  .ai-chat-trigger {
    right: -32px;
    width: 82px;
    height: 98px;
  }
  .ai-chat-trigger:hover,
  .ai-chat-trigger:focus-visible,
  .ai-chat-trigger:active {
    right: 4px;
  }
  .ai-chat-widget__tools button {
    width: 42px;
    height: 42px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ai-chat-widget,
  .ai-chat-trigger__stage,
  .ai-chat-trigger__shadow,
  .ai-chat-trigger__signal {
    animation: none;
  }
  .ai-chat-trigger {
    transition: none;
  }
  .ai-chat-trigger__stage img {
    transition: none;
  }
}
</style>

<style>
body.ai-chat-is-dragging {
  cursor: move !important;
  user-select: none !important;
}
body.ai-chat-is-resizing {
  cursor: col-resize !important;
  user-select: none !important;
}
body.ai-chat-is-panel-resizing {
  cursor: nwse-resize !important;
  user-select: none !important;
}
.ai-chat-clear-overlay .el-message-box {
  width: min(420px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  box-sizing: border-box;
}
.ai-chat-clear-overlay .el-message-box__content {
  overflow-wrap: anywhere;
}
</style>
