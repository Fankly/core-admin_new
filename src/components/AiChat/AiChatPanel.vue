<template>
  <div class="ai-chat-panel">
    <div class="ai-chat-context" aria-label="当前智能体">
      <div class="ai-chat-context__identity">
        <el-tooltip v-if="!sessionPanelVisible" content="展开会话列表" placement="bottom">
          <button type="button" class="ai-chat-context__panel-toggle" aria-label="展开会话列表" @click="$emit('show-sessions')">
            <PanelLeft :size="16" aria-hidden="true" />
          </button>
        </el-tooltip>
        <span v-else class="ai-chat-context__icon" aria-hidden="true"><img :src="mascotImage" alt="" /></span>
        <span class="ai-chat-context__label">当前智能体</span>
        <strong :title="selectedAgentName">{{ selectedAgentName }}</strong>
      </div>
      <div class="ai-chat-context__actions">
        <span :class="['ai-chat-context__state', { 'is-active': isStreaming }]">
          {{ isStreaming ? '正在处理' : '已就绪' }}
        </span>
        <el-tooltip v-if="stepsToggleVisible && !stepsVisible" content="展开步骤" placement="bottom">
          <button type="button" class="ai-chat-context__panel-toggle" aria-label="展开步骤" @click="$emit('show-steps')">
            <PanelRightOpen :size="16" aria-hidden="true" />
            <span v-if="traceCount" :class="['ai-chat-context__step-badge', { 'has-update': unreadSteps }]">{{
              traceCount > 99 ? '99+' : traceCount
            }}</span>
          </button>
        </el-tooltip>
      </div>
    </div>

    <div ref="messageListRef" class="ai-chat-messages" role="log" aria-live="polite" aria-label="聊天消息">
      <div class="ai-chat-messages__inner">
        <div v-if="messages.length === 0" class="ai-chat-empty">
          <div class="ai-chat-empty__brand" aria-hidden="true">
            <span class="ai-chat-empty__mark"><img :src="mascotImage" alt="" /></span>
          </div>
          <div class="ai-chat-empty__copy">
            <span class="ai-chat-empty__agent">{{ selectedAgentName }}</span>
            <h3>请问有什么可以帮您？</h3>
            <p>输入业务问题，我会结合当前智能体为您处理。</p>
          </div>
        </div>

        <article
          v-for="message in messages"
          :key="message.id"
          :class="[
            'ai-chat-message',
            `ai-chat-message--${message.role}`,
            { 'has-trace': Boolean(message.trace?.length), 'is-selected': message.id === selectedAssistantId }
          ]"
        >
          <div v-if="message.role === 'assistant'" class="ai-chat-message__avatar" aria-hidden="true">
            <img :src="mascotImage" alt="" />
          </div>
          <div class="ai-chat-message__main">
            <div v-if="message.role === 'assistant'" class="ai-chat-message__name">
              <span>{{ message.agentName }}</span>
            </div>
            <template v-for="segment in messageSegments(message)" :key="segment.id">
              <AiChatInlineTrace
                v-if="segment.kind === 'trace'"
                :steps="segment.steps"
                :group-id="segment.id"
                @open-details="$emit('select-message', message.id, $event)"
              />
              <div
                v-else
                :class="['ai-chat-message__content', { 'is-markdown': message.role === 'assistant', 'is-answer': message.role === 'assistant' }]"
                v-html="segment.html"
              ></div>
            </template>
            <div
              v-if="!message.content && (message.status === 'pending' || message.status === 'streaming')"
              class="ai-chat-thinking"
              aria-label="正在生成回答"
            >
              <span></span><span></span><span></span>
            </div>
            <div v-if="message.status === 'error'" class="ai-chat-error" role="alert">
              <AlertCircle :size="15" aria-hidden="true" />
              <div class="ai-chat-error__detail">
                <span>{{ message.error || '回答生成失败,请稍后重试。' }}</span>
                <span v-if="message.stopReason && message.stopReason !== message.error" class="ai-chat-error__reason"
                  >终止原因: {{ message.stopReason }}</span
                >
              </div>
            </div>
            <div v-else-if="message.status === 'cancelled'" class="ai-chat-cancelled" role="status">
              <Ban :size="15" aria-hidden="true" />
              <span>{{ message.stopReason || '已停止生成' }}</span>
            </div>
            <button
              v-if="message.role === 'assistant' && (message.status === 'error' || message.status === 'cancelled')"
              type="button"
              class="ai-chat-retry"
              :disabled="isStreaming"
              @click.stop="$emit('retry', message.id)"
            >
              <RotateCcw :size="14" aria-hidden="true" />
              重新生成
            </button>
            <div
              v-if="message.role === 'assistant' && message.content && message.status !== 'error' && message.status !== 'cancelled'"
              class="ai-chat-message__actions"
            >
              <el-tooltip :content="copiedMessageId === message.id ? '已复制' : '复制回答'" placement="top">
                <button type="button" :aria-label="copiedMessageId === message.id ? '回答已复制' : '复制回答'" @click="copyMessage(message)">
                  <Check v-if="copiedMessageId === message.id" :size="15" aria-hidden="true" />
                  <Copy v-else :size="15" aria-hidden="true" />
                </button>
              </el-tooltip>
              <el-tooltip content="重新生成" placement="top">
                <button type="button" :disabled="isStreaming" aria-label="重新生成回答" @click="$emit('retry', message.id)">
                  <RotateCcw :size="15" aria-hidden="true" />
                </button>
              </el-tooltip>
            </div>
          </div>
        </article>
      </div>
    </div>

    <div class="ai-chat-input-dock">
      <div v-if="identityError || !userCode" class="ai-chat-user-error" role="alert">
        <AlertCircle :size="15" aria-hidden="true" />
        {{ identityError ? `${identityError}，请联系管理员检查公共代码配置。` : '未获取到登录账号，暂时无法发送消息。' }}
      </div>

      <div class="ai-chat-composer">
        <textarea
          ref="composerRef"
          v-model="draftModel"
          maxlength="15000"
          rows="1"
          placeholder="有问题随时来找预算助手"
          aria-label="输入消息"
          :disabled="!userCode || !selectedAgentCode || Boolean(identityError)"
          @keydown="handleKeydown"
          @input="resizeComposer"
        ></textarea>
        <div class="ai-chat-composer__actions">
          <div class="ai-chat-composer__left">
            <img :src="mascotImage" class="ai-chat-composer__agent-icon" alt="" aria-hidden="true" />
            <el-tooltip content="切换智能体" placement="top">
              <el-select
                class="ai-chat-agent-select"
                :model-value="selectedAgentCode"
                :disabled="isStreaming || !agentOptions.length"
                :placeholder="agentOptions.length ? '选择智能体' : '加载智能体'"
                aria-label="切换智能体"
                @change="$emit('select-agent', $event)"
              >
                <el-option v-for="agent in agentOptions" :key="agent.code" :label="agent.name" :value="agent.code" />
              </el-select>
            </el-tooltip>
          </div>
          <div class="ai-chat-composer__right">
            <span class="ai-chat-composer__count" aria-live="polite">{{ draftModel.length }}/15000</span>
            <el-tooltip v-if="isStreaming" content="停止生成" placement="top">
              <button type="button" class="ai-chat-action ai-chat-action--stop" aria-label="停止生成" @click="$emit('stop')">
                <Square :size="15" fill="currentColor" aria-hidden="true" />
              </button>
            </el-tooltip>
            <el-tooltip v-else content="发送消息" placement="top">
              <button type="button" class="ai-chat-action ai-chat-action--send" aria-label="发送消息" :disabled="!canSend" @click="$emit('send')">
                <Send :size="17" aria-hidden="true" />
              </button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { AlertCircle, Ban, Check, Copy, PanelLeft, PanelRightOpen, RotateCcw, Send, Square } from 'lucide-vue-next'
import mascotImage from '@/assets/images/ai-chat/sudian-ai-mascot.png'
import AiChatInlineTrace from './AiChatInlineTrace.vue'
import { AiChatAgentOption, AiChatMessage, AiChatTraceStep } from './types'

const props = defineProps<{
  messages: AiChatMessage[]
  draft: string
  isStreaming: boolean
  canSend: boolean
  userCode: string
  identityError: string
  agentOptions: AiChatAgentOption[]
  selectedAgentCode: string
  selectedAssistantId: string
  sessionPanelVisible: boolean
  stepsVisible: boolean
  stepsToggleVisible: boolean
  traceCount: number
  unreadSteps: boolean
  scrollVersion: number
}>()

const emit = defineEmits<{
  (event: 'update:draft', value: string): void
  (event: 'send'): void
  (event: 'stop'): void
  (event: 'retry', id: string): void
  (event: 'select-agent', agentCode: string): void
  (event: 'select-message', id: string, stepId?: string): void
  (event: 'show-sessions'): void
  (event: 'show-steps'): void
}>()

const messageListRef = ref<HTMLElement>()
const composerRef = ref<HTMLTextAreaElement>()
const copiedMessageId = ref('')
let copyResetTimer: ReturnType<typeof setTimeout> | undefined
const draftModel = computed({
  get: () => props.draft,
  set: (value: string) => emit('update:draft', value)
})
const selectedAgentName = computed(() => props.agentOptions.find((agent) => agent.code === props.selectedAgentCode)?.name || '预算助手')
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true })
const defaultLinkOpen = markdown.renderer.rules.link_open || ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options))
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen(tokens, index, options, env, self)
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character))
const renderContent = (message: AiChatMessage, content = message.content) =>
  message.role === 'assistant' ? markdown.render(content) : escapeHtml(content).replace(/\n/g, '<br>')

// 步骤记录的 contentIndex 是字符偏移，直接按它切会把表格、代码块拦腰截断，
// 所以先退到所在行的行首，若正好落在未闭合的代码围栏里，就顺延到围栏结束之后。
const safeSplitOffset = (content: string, index: number) => {
  if (index <= 0) return 0
  if (index >= content.length) return content.length
  const lineStart = content.lastIndexOf('\n', index - 1) + 1
  const fenceCount = (content.slice(0, lineStart).match(/^\s{0,3}(```|~~~)/gm) || []).length
  if (fenceCount % 2 === 0) return lineStart
  const closing = /^\s{0,3}(```|~~~).*$/m.exec(content.slice(lineStart))
  return closing ? lineStart + closing.index + closing[0].length : content.length
}

type MessageSegment = { id: string; kind: 'trace'; steps: AiChatTraceStep[] } | { id: string; kind: 'text'; html: string }

// 把步骤按“它开始时正文输出到哪里”插回正文，让思考过程跟着聊天走而不是全部堆在顶部。
const messageSegments = (message: AiChatMessage): MessageSegment[] => {
  const steps = message.role === 'assistant' ? message.trace || [] : []
  const textSegment = (from: number, to: number): MessageSegment[] => {
    const slice = message.content.slice(from, to)
    return slice.trim() ? [{ id: `${message.id}-text-${from}`, kind: 'text', html: renderContent(message, slice) }] : []
  }
  if (!steps.length) return textSegment(0, message.content.length)

  const groups = new Map<number, AiChatTraceStep[]>()
  steps.forEach((step) => {
    const offset = safeSplitOffset(message.content, Math.max(0, step.contentIndex || 0))
    const group = groups.get(offset)
    if (group) group.push(step)
    else groups.set(offset, [step])
  })

  const offsets = [...groups.keys()].sort((a, b) => a - b)
  return offsets.flatMap((offset, index) => [
    ...textSegment(index === 0 ? 0 : offsets[index - 1], offset),
    { id: `${message.id}-trace-${offset}`, kind: 'trace' as const, steps: groups.get(offset)! },
    ...(index === offsets.length - 1 ? textSegment(offset, message.content.length) : [])
  ])
}
const scrollToLatest = async () => {
  await nextTick()
  if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}
const resizeComposer = () => {
  const textarea = composerRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
}
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
  event.preventDefault()
  if (props.canSend) emit('send')
}
const copyMessage = async (message: AiChatMessage) => {
  if (!message.content) return
  try {
    await navigator.clipboard.writeText(message.content)
    copiedMessageId.value = message.id
    if (copyResetTimer) clearTimeout(copyResetTimer)
    copyResetTimer = setTimeout(() => (copiedMessageId.value = ''), 1800)
  } catch {
    copiedMessageId.value = ''
  }
}
const focusComposer = () => nextTick(() => composerRef.value?.focus())

watch(() => props.scrollVersion, scrollToLatest)
watch(
  () => props.draft,
  () => nextTick(resizeComposer)
)

defineExpose({ focusComposer, scrollToLatest })
</script>

<style scoped lang="less">
.ai-chat-panel {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
  background: #f8fbfb;
}

.ai-chat-context {
  display: flex;
  min-width: 0;
  min-height: 48px;
  flex: 0 0 48px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}
.ai-chat-context__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}
.ai-chat-context__icon {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  place-items: center;
  border: 1px solid #b8ddd9;
  border-radius: 7px;
  background: #f2f9f8;
  overflow: hidden;
}
.ai-chat-context__icon img {
  width: 31px;
  height: 31px;
  object-fit: contain;
}
.ai-chat-context__panel-toggle {
  position: relative;
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #b8ddd9;
  border-radius: 7px;
  color: #00706b;
  background: #f2f9f8;
  cursor: pointer;
}
.ai-chat-context__panel-toggle:hover,
.ai-chat-context__panel-toggle:focus-visible {
  border-color: #00706b;
  background: #e6f4f3;
  outline: 0;
}
.ai-chat-context__label {
  color: #64748b;
  font-size: 12px;
}
.ai-chat-context__identity strong {
  min-width: 0;
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-chat-context__state {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 12px;
}
.ai-chat-context__state::before {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #67c23a;
  content: '';
}
.ai-chat-context__state.is-active {
  color: #00706b;
}
.ai-chat-context__state.is-active::before {
  background: #00706b;
  box-shadow: 0 0 0 3px rgba(0, 112, 107, 0.12);
  animation: ai-chat-status-pulse 1.2s ease-in-out infinite;
}
.ai-chat-context__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}
.ai-chat-context__step-badge {
  position: absolute;
  top: -5px;
  right: -5px;
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
.ai-chat-context__step-badge.has-update {
  color: #ffffff;
  background: #f56c6c;
}

.ai-chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #b8ddd9 transparent;
}
.ai-chat-messages__inner {
  width: min(100%, 940px);
  height: 100%;
  min-height: 100%;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 22px clamp(18px, 3vw, 40px) 18px;
}

.ai-chat-empty {
  display: flex;
  height: 100%;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 18px;
  padding: 36px 20px 54px;
  text-align: center;
}

.ai-chat-empty__brand {
  display: flex;
  width: 76px;
  height: 76px;
  align-items: center;
  justify-content: center;
  border: 1px solid #b8ddd9;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
}
.ai-chat-empty__mark {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
}
.ai-chat-empty__mark img {
  width: 82px;
  height: 82px;
  object-fit: contain;
}
.ai-chat-empty__copy {
  display: flex;
  align-items: center;
  flex-direction: column;
}
.ai-chat-empty__agent {
  margin-bottom: 7px;
  color: #00706b;
  font-size: 13px;
  font-weight: 600;
}
.ai-chat-empty h3 {
  margin: 0 0 7px;
  color: #1e293b;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
}
.ai-chat-empty p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.ai-chat-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 0 auto 24px;
  width: 100%;
}
.ai-chat-message--user {
  justify-content: flex-end;
  padding-left: 72px;
}

.ai-chat-message__avatar {
  display: flex;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  border: 1px solid #b8ddd9;
  border-radius: 8px;
  background: #f2f9f8;
  overflow: hidden;
}
.ai-chat-message__avatar img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.ai-chat-message__main {
  min-width: 0;
  width: min(calc(100% - 46px), 840px);
}
.ai-chat-message--assistant .ai-chat-message__main {
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
}
.ai-chat-message--assistant.is-selected .ai-chat-message__main {
  border-color: #b8ddd9;
}
.ai-chat-message--user .ai-chat-message__main {
  width: auto;
  max-width: min(74%, 620px);
}
.ai-chat-message__name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 7px;
  color: #1e293b;
  font-size: 13px;
  font-weight: 600;
}

.ai-chat-message__content {
  color: #475569;
  font-size: 14px;
  line-height: 1.75;
  overflow-wrap: anywhere;
}
.ai-chat-message__content.is-answer {
  padding: 2px 0 0;
}
.ai-chat-message--user .ai-chat-message__content {
  padding: 10px 14px;
  border-radius: 10px 4px 10px 10px;
  color: #ffffff;
  background: #00706b;
}

.is-markdown :deep(p) {
  margin: 0 0 9px;
}
.is-markdown :deep(h1),
.is-markdown :deep(h2),
.is-markdown :deep(h3),
.is-markdown :deep(h4),
.is-markdown :deep(h5),
.is-markdown :deep(h6) {
  margin: 16px 0 7px;
  color: #1e293b;
  font-weight: 700;
  line-height: 1.4;
}
.is-markdown :deep(h1:first-child),
.is-markdown :deep(h2:first-child),
.is-markdown :deep(h3:first-child) {
  margin-top: 0;
}
.is-markdown :deep(h1) {
  font-size: 16px;
}
.is-markdown :deep(h2) {
  font-size: 16px;
}
.is-markdown :deep(h3),
.is-markdown :deep(h4),
.is-markdown :deep(h5),
.is-markdown :deep(h6) {
  font-size: 14px;
}
.is-markdown :deep(strong) {
  color: #1e293b;
  font-weight: 700;
}
.is-markdown :deep(hr) {
  height: 1px;
  margin: 14px 0;
  border: 0;
  background: #e2e8f0;
}
.is-markdown :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  border-radius: 8px;
}
.is-markdown :deep(p:last-child),
.is-markdown :deep(ul:last-child),
.is-markdown :deep(ol:last-child),
.is-markdown :deep(pre:last-child) {
  margin-bottom: 0;
}
.is-markdown :deep(ul),
.is-markdown :deep(ol) {
  margin: 6px 0 10px;
  padding-left: 20px;
}
.is-markdown :deep(a) {
  color: #00706b;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.is-markdown :deep(blockquote) {
  margin: 8px 0;
  padding: 7px 10px;
  border-left: 2px solid #2a9a92;
  color: #475569;
  background: #eef8f7;
}
.is-markdown :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
  margin: 8px 0;
  padding: 10px;
  border-radius: 6px;
  color: #e2e8f0;
  background: #263238;
  font-size: 12px;
  line-height: 1.55;
}
.is-markdown :deep(code) {
  font-family: monospace;
}
.is-markdown :deep(:not(pre) > code) {
  padding: 1px 4px;
  border-radius: 3px;
  color: #005f5a;
  background: #e6f4f3;
}
.is-markdown :deep(table) {
  width: 100%;
  margin: 8px 0;
  border-spacing: 0;
  border-collapse: collapse;
  font-size: 12px;
}
.is-markdown :deep(th),
.is-markdown :deep(td) {
  padding: 6px 8px;
  border: 1px solid #d7e3e2;
  text-align: left;
}
.is-markdown :deep(th) {
  color: #005f5a;
  background: #dff3f0;
}

.ai-chat-thinking {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 2px;
}
.ai-chat-thinking span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2a9a92;
  animation: ai-chat-thinking 1.1s ease-in-out infinite;
}
.ai-chat-thinking span:nth-child(2) {
  animation-delay: 0.14s;
}
.ai-chat-thinking span:nth-child(3) {
  animation-delay: 0.28s;
}

.ai-chat-error,
.ai-chat-user-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 7px;
  padding: 7px 9px;
  border-radius: 6px;
  color: #303133;
  background: rgba(245, 108, 108, 0.1);
  font-size: 12px;
  line-height: 1.45;
}

.ai-chat-cancelled {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 7px;
  padding: 7px 9px;
  border-radius: 6px;
  color: #64748b;
  background: rgba(100, 116, 139, 0.1);
  font-size: 12px;
  line-height: 1.45;
}
.ai-chat-cancelled svg {
  flex: 0 0 auto;
  color: #64748b;
}

.ai-chat-user-error {
  flex: 0 0 auto;
  width: min(100%, 900px);
  box-sizing: border-box;
  margin: 0 auto 8px;
}

.ai-chat-error svg,
.ai-chat-user-error svg {
  flex: 0 0 auto;
  color: #f56c6c;
}
.ai-chat-error__detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ai-chat-error__reason {
  color: #94a3b8;
  font-size: 11px;
}
.ai-chat-retry {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 7px;
  padding: 5px 8px;
  border: 1px solid #b8ddd9;
  border-radius: 6px;
  color: #00706b;
  background: #ffffff;
  font-size: 12px;
  cursor: pointer;
}
.ai-chat-retry:hover:not(:disabled),
.ai-chat-retry:focus-visible:not(:disabled) {
  color: #ffffff;
  background: #2a9a92;
  border-color: #2a9a92;
}
.ai-chat-retry:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}
.ai-chat-message__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0 0;
}
.ai-chat-message__actions button {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: #64748b;
  background: transparent;
  cursor: pointer;
}
.ai-chat-message__actions button:hover:not(:disabled),
.ai-chat-message__actions button:focus-visible:not(:disabled) {
  color: #00706b;
  background: #e6f4f3;
}
.ai-chat-message__actions button:focus-visible {
  outline: 2px solid #b8ddd9;
  outline-offset: 1px;
}
.ai-chat-message__actions button:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.ai-chat-input-dock {
  flex: 0 0 auto;
  box-sizing: border-box;
  width: 100%;
  padding: 10px 20px max(16px, env(safe-area-inset-bottom));
  border-top: 1px solid #eef2f6;
  background: #ffffff;
}

.ai-chat-composer {
  width: min(100%, 900px);
  box-sizing: border-box;
  margin: 0 auto;
  border: 1px solid #a9ccc9;
  border-radius: 12px;
  background: #ffffff;
}

.ai-chat-composer textarea {
  display: block;
  width: 100%;
  min-height: 62px;
  max-height: 120px;
  box-sizing: border-box;
  resize: none;
  padding: 15px 16px 7px;
  border: 0;
  outline: 0;
  color: #475569;
  background: transparent;
  font: inherit;
  font-size: 14px;
  line-height: 1.55;
}
.ai-chat-composer textarea::placeholder {
  color: #64748b;
}
.ai-chat-composer textarea:disabled {
  cursor: not-allowed;
}
.ai-chat-composer:focus-within {
  border-color: #00706b;
  box-shadow: 0 0 0 2px rgba(0, 112, 107, 0.1);
}

.ai-chat-composer__actions {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 9px 7px 12px;
}
.ai-chat-composer__left,
.ai-chat-composer__right {
  display: flex;
  align-items: center;
  gap: 7px;
}
.ai-chat-composer__left {
  min-width: 0;
}
.ai-chat-composer__agent-icon {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  object-fit: contain;
}
.ai-chat-agent-select {
  width: 172px;
  min-width: 0;
}

.ai-chat-agent-select :deep(.el-input__inner) {
  height: 30px;
  padding-inline: 8px 26px;
  border-color: transparent;
  border-radius: 6px;
  color: #475569;
  background: #f2f9f8;
  font-size: 12px;
  text-overflow: ellipsis;
}

.ai-chat-agent-select :deep(.el-input__inner:hover) {
  border-color: #b8ddd9;
}

.ai-chat-agent-select :deep(.el-input.is-focus .el-input__inner) {
  border-color: #00706b;
}
.ai-chat-composer__count {
  color: #64748b;
  font-size: 12px;
}

.ai-chat-action {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
.ai-chat-action--send {
  color: #ffffff;
  background: #00706b;
}
.ai-chat-action--send:hover:not(:disabled),
.ai-chat-action--send:focus-visible:not(:disabled) {
  background: #2a9a92;
}
.ai-chat-action--stop {
  color: #ffffff;
  background: #f56c6c;
}
.ai-chat-action:disabled {
  color: #cbd5e1;
  background: #eef2f6;
  cursor: not-allowed;
}
.ai-chat-action:focus-visible {
  outline: 2px solid #b8ddd9;
  outline-offset: 2px;
}

@keyframes ai-chat-thinking {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
@keyframes ai-chat-status-pulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .ai-chat-messages__inner {
    padding: 18px 12px 12px;
  }
  .ai-chat-context {
    min-height: 44px;
    flex-basis: 44px;
    padding: 0 12px;
  }
  .ai-chat-context__label {
    display: none;
  }
  .ai-chat-empty {
    gap: 18px;
    padding: 30px 10px 82px;
  }
  .ai-chat-empty h3 {
    font-size: 16px;
  }
  .ai-chat-input-dock {
    padding: 8px 10px max(10px, env(safe-area-inset-bottom));
  }
  .ai-chat-action {
    width: 34px;
    height: 34px;
  }
  .ai-chat-agent-select {
    width: min(142px, 36vw);
  }
  .ai-chat-message--user .ai-chat-message__main {
    max-width: 92%;
  }
  .ai-chat-message__content.is-answer {
    padding: 1px 0 0;
  }
  .ai-chat-message--assistant .ai-chat-message__main {
    padding: 10px 11px;
  }
  .ai-chat-message__actions button {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 420px) {
  .ai-chat-message {
    gap: 0;
  }
  .ai-chat-message__avatar {
    display: none;
  }
  .ai-chat-message__main {
    width: 100%;
  }
  .ai-chat-composer__agent-icon {
    display: none;
  }
  .ai-chat-composer__actions {
    padding-left: 8px;
  }
  .ai-chat-composer__count {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-chat-messages {
    scroll-behavior: auto;
  }
  .ai-chat-thinking span {
    animation: none;
  }
  .ai-chat-context__state.is-active::before {
    animation: none;
  }
}
</style>
