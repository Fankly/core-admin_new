<template>
  <aside class="ai-session-panel" aria-label="聊天会话">
    <div class="ai-session-panel__brand">
      <div class="ai-session-panel__brand-mark" aria-hidden="true"><img :src="mascotImage" alt="" /></div>
      <div class="ai-session-panel__brand-copy">
        <strong>工作会话</strong>
      </div>
      <button type="button" class="ai-session-panel__close" aria-label="收起会话列表" title="收起会话列表" @click="$emit('close')">
        <PanelLeftClose :size="16" aria-hidden="true" />
      </button>
    </div>

    <button type="button" class="ai-session-panel__new" :disabled="locked" @click="$emit('new')">
      <Plus :size="16" aria-hidden="true" />
      <span>新建会话</span>
    </button>

    <div class="ai-session-panel__section-title">
      <span>所有会话</span>
      <span class="ai-session-panel__count">{{ sessions.length }}</span>
    </div>

    <div v-if="!sessions.length" class="ai-session-panel__empty">暂无会话</div>
    <nav v-else class="ai-session-panel__list" aria-label="所有会话">
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="['ai-session-item', { 'is-active': session.id === activeId, 'is-editing': editingId === session.id }]"
      >
        <button v-if="editingId !== session.id" type="button" class="ai-session-item__select" :disabled="locked" @click="$emit('select', session.id)">
          <MessageSquare :size="15" aria-hidden="true" />
          <span class="ai-session-item__content">
            <strong :title="session.title">{{ session.title }}</strong>
            <small
              >{{ formatTime(session.updatedAt) }}<template v-if="session.messages.length"> · {{ session.messages.length }} 条</template></small
            >
          </span>
        </button>
        <input
          v-else
          ref="editingInput"
          v-model="editingTitle"
          class="ai-session-item__input"
          aria-label="会话名称"
          maxlength="80"
          @click.stop
          @keydown.enter.prevent="commitRename(session.id)"
          @keydown.esc.prevent="cancelRename"
          @blur="commitRename(session.id)"
        />
        <div v-if="editingId !== session.id" class="ai-session-item__actions">
          <button type="button" aria-label="重命名会话" title="重命名" :disabled="locked" @click.stop="startRename(session)"
            ><Pencil :size="13" aria-hidden="true"
          /></button>
          <button type="button" aria-label="删除会话" title="删除" :disabled="locked" @click.stop="$emit('delete', session.id)"
            ><Trash2 :size="13" aria-hidden="true"
          /></button>
        </div>
      </div>
    </nav>

    <p class="ai-session-panel__hint">会话仅保存在当前浏览器</p>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { MessageSquare, PanelLeftClose, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import mascotImage from '@/assets/images/ai-chat/sudian-ai-mascot.png'
import { AiChatSession } from './types'

defineProps<{
  sessions: AiChatSession[]
  activeId: string
  locked: boolean
}>()

const emit = defineEmits<{
  (event: 'new'): void
  (event: 'select', id: string): void
  (event: 'rename', id: string, title: string): void
  (event: 'delete', id: string): void
  (event: 'close'): void
}>()

const editingId = ref('')
const editingTitle = ref('')
const editingInput = ref<HTMLInputElement[]>()

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}
const startRename = (session: AiChatSession) => {
  editingId.value = session.id
  editingTitle.value = session.title
  nextTick(() => editingInput.value?.[0]?.focus())
}
const cancelRename = () => {
  editingId.value = ''
  editingTitle.value = ''
}
const commitRename = (id: string) => {
  if (editingId.value !== id) return
  const title = editingTitle.value.trim()
  if (title) emit('rename', id, title)
  cancelRename()
}
</script>

<style scoped lang="less">
.ai-session-panel {
  display: flex;
  width: 224px;
  min-width: 224px;
  min-height: 0;
  flex: 0 0 224px;
  flex-direction: column;
  padding: 14px 10px 10px;
  border-right: 1px solid #e2e8f0;
  background: #f5fbfb;
}
.ai-session-panel__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 5px 15px;
}
.ai-session-panel__brand-mark {
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f2f9f8;
  overflow: hidden;
}
.ai-session-panel__brand-mark img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}
.ai-session-panel__brand-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}
.ai-session-panel__brand-copy strong {
  color: #1e293b;
  font-size: 14px;
}
.ai-session-panel__close,
.ai-session-item__actions button {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: #64748b;
  background: transparent;
  cursor: pointer;
}
.ai-session-panel__close:hover,
.ai-session-panel__close:focus-visible,
.ai-session-item__actions button:hover:not(:disabled),
.ai-session-item__actions button:focus-visible:not(:disabled) {
  color: #00706b;
  background: #e6f4f3;
}
.ai-session-panel__new {
  display: flex;
  height: 34px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: 0 1px 18px;
  border: 1px solid #00706b;
  border-radius: 6px;
  color: #ffffff;
  background: #00706b;
  font-size: 13px;
  cursor: pointer;
}
.ai-session-panel__new:hover:not(:disabled),
.ai-session-panel__new:focus-visible:not(:disabled) {
  background: #2a9a92;
}
.ai-session-panel__new:disabled {
  border-color: #a8cfcb;
  background: #a8cfcb;
  cursor: not-allowed;
}
.ai-session-panel__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 7px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}
.ai-session-panel__count {
  min-width: 18px;
  padding: 1px 5px;
  border-radius: 8px;
  color: #00706b;
  background: #e6f4f3;
  text-align: center;
  font-size: 12px;
}
.ai-session-panel__list {
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 1px 0;
  scrollbar-width: thin;
  scrollbar-color: #b8ddd9 transparent;
}
.ai-session-panel__empty {
  padding: 30px 10px;
  color: #94a3b8;
  text-align: center;
  font-size: 12px;
}
.ai-session-item {
  position: relative;
  display: flex;
  min-height: 52px;
  align-items: center;
  border-radius: 7px;
}
.ai-session-item.is-active {
  background: #d8efec;
}
.ai-session-item__select {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
  padding: 8px 7px;
  border: 0;
  color: #64748b;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.ai-session-item__select:hover:not(:disabled),
.ai-session-item__select:focus-visible:not(:disabled) {
  color: #00706b;
  background: #e6f4f3;
}
.ai-session-item__select:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}
.ai-session-item__select > svg {
  flex: 0 0 auto;
  color: #00706b;
}
.ai-session-item__content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}
.ai-session-item__content strong {
  overflow: hidden;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-session-item.is-active .ai-session-item__content strong {
  color: #005f5a;
}
.ai-session-item__content small {
  color: #94a3b8;
  font-size: 12px;
}
.ai-session-item__actions {
  position: absolute;
  right: 3px;
  display: flex;
  gap: 1px;
  opacity: 0;
  background: inherit;
  transition: opacity 0.16s ease;
}
.ai-session-item:hover .ai-session-item__actions,
.ai-session-item:focus-within .ai-session-item__actions {
  opacity: 1;
}
.ai-session-item__actions button:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}
.ai-session-item__input {
  width: calc(100% - 12px);
  margin: 6px;
  padding: 6px 7px;
  border: 1px solid #00706b;
  border-radius: 6px;
  outline: 0;
  color: #475569;
  background: #ffffff;
  font: inherit;
  font-size: 12px;
}
.ai-session-panel__hint {
  margin: 10px 5px 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid #b8ddd9;
  outline-offset: 2px;
}
@media (max-width: 768px) {
  .ai-session-panel {
    width: min(290px, 86vw);
    min-width: min(290px, 86vw);
    flex-basis: min(290px, 86vw);
    box-shadow: 8px 0 24px rgba(15, 23, 42, 0.14);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ai-session-item__actions {
    transition: none;
  }
}
</style>
