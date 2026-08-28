<template>
  <aside class="ai-trace-panel" aria-label="执行步骤">
    <header class="ai-trace-panel__header">
      <div class="ai-trace-panel__title-wrap">
        <span :class="['ai-trace-panel__signal', { 'is-running': runningCount }]" aria-hidden="true"></span>
        <h3>{{ selectedStep?.displayName || '当前回答' }}</h3>
      </div>
      <span v-if="runningCount" class="ai-trace-panel__running">{{ runningCount }} 项执行中</span>
      <span v-else class="ai-trace-panel__summary">{{ displaySteps.length ? `${completedCount}/${displaySteps.length} 已完成` : '等待提问' }}</span>
    </header>

    <div v-if="!message || !displaySteps.length" class="ai-trace-empty">
      <ListTree :size="25" aria-hidden="true" />
      <strong>暂无执行步骤</strong>
      <span>发送问题后，这里会显示智能体的处理过程。</span>
    </div>

    <template v-else>
      <div class="ai-trace-detail">
        <div v-if="selectedStep" class="ai-trace-detail__body">
          <div class="ai-trace-detail__heading">
            <span :class="['ai-trace-status', `is-${selectedStep.status}`]" aria-hidden="true">
              <LoaderCircle v-if="selectedStep.status === 'running'" :size="15" class="is-spinning" />
              <CheckCircle2 v-else-if="selectedStep.status === 'done'" :size="15" />
              <XCircle v-else-if="selectedStep.status === 'error'" :size="15" />
              <Ban v-else :size="15" />
            </span>
            <div>
              <strong>{{ selectedStep.displayName }}</strong>
              <span
                >{{ statusLabel(selectedStep) }}<template v-if="duration(selectedStep)"> · {{ duration(selectedStep) }}</template></span
              >
            </div>
          </div>
          <div v-if="selectedStep.stage || selectedStep.model" class="ai-trace-detail__meta">
            <span v-if="selectedStep.stage">{{ stageLabel(selectedStep.stage) }}</span>
            <span v-if="selectedStep.model">{{ selectedStep.model }}</span>
          </div>

          <div class="ai-trace-rich">
            <section v-if="selectedStep.content" class="ai-trace-rich__section ai-trace-rich__section--context">
              <h4>{{ contentLabel(selectedStep) }}</h4>
              <div class="ai-trace-rich__markdown" v-html="renderMarkdown(selectedStep.content)"></div>
            </section>
            <section v-if="hasArgs(selectedStep)" class="ai-trace-rich__section">
              <div class="ai-trace-rich__section-title"
                ><h4>输入参数</h4
                ><button type="button" aria-label="复制输入参数" title="复制输入参数" @click="copyValue(formatValue(selectedStep.args))"
                  ><Copy :size="13" aria-hidden="true" /></button
              ></div>
              <pre>{{ formatValue(selectedStep.args) }}</pre>
            </section>
            <section v-if="selectedStep.output" class="ai-trace-rich__section">
              <div class="ai-trace-rich__section-title">
                <h4>执行结果</h4>
                <button type="button" aria-label="复制执行结果" title="复制执行结果" @click="copyValue(selectedStep.output)">
                  <Check v-if="copied" :size="13" aria-hidden="true" />
                  <Copy v-else :size="13" aria-hidden="true" />
                </button>
              </div>
              <div v-if="isJsonOutput" class="ai-trace-result-tabs" role="tablist" aria-label="执行结果视图">
                <button
                  type="button"
                  role="tab"
                  :aria-selected="viewMode === 'summary'"
                  :class="{ 'is-active': viewMode === 'summary' }"
                  @click="viewMode = 'summary'"
                  >富文本</button
                >
                <button
                  type="button"
                  role="tab"
                  :aria-selected="viewMode === 'json'"
                  :class="{ 'is-active': viewMode === 'json' }"
                  @click="viewMode = 'json'"
                  >JSON</button
                >
              </div>
              <pre v-if="isJsonOutput && viewMode === 'json'" class="ai-trace-detail__json">{{ formattedOutput }}</pre>
              <div v-else-if="isJsonOutput" class="ai-trace-result-table-wrap">
                <table class="ai-trace-result-table">
                  <tbody>
                    <tr v-for="entry in outputEntries" :key="entry.key">
                      <th>{{ entry.key }}</th>
                      <td>
                        <pre v-if="entry.structured">{{ entry.value }}</pre>
                        <span v-else>{{ entry.value }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="ai-trace-rich__markdown ai-trace-result-text" v-html="renderMarkdown(selectedStep.output)"></div>
            </section>
            <section v-if="selectedStep.error" class="ai-trace-rich__section ai-trace-rich__section--error">
              <h4>错误信息</h4>
              <div class="ai-trace-detail__error" role="alert"
                ><AlertCircle :size="14" aria-hidden="true" /><span>{{ selectedStep.error }}</span></div
              >
            </section>
            <div v-if="!selectedStep.content && !hasArgs(selectedStep) && !selectedStep.output && !selectedStep.error" class="ai-trace-rich__empty">{{
              selectedStep.status === 'running' ? '正在等待步骤输出…' : '该步骤没有返回详细信息。'
            }}</div>
          </div>
        </div>
      </div>

      <div class="ai-trace-list" aria-label="步骤列表">
        <div class="ai-trace-list__heading"
          ><span>{{ toolSteps.length ? '工具调用' : '执行过程' }}</span
          ><span>共 {{ displaySteps.length }} 项</span></div
        >
        <div class="ai-trace-list__track">
          <button
            v-for="(step, index) in displaySteps"
            :key="step.id"
            type="button"
            :class="['ai-trace-step', { 'is-selected': step.id === selectedStepId }]"
            @click="selectStep(step.id)"
          >
            <span :class="['ai-trace-step__dot', `is-${step.status}`]" aria-hidden="true"></span>
            <span class="ai-trace-step__copy"
              ><strong :title="step.displayName">{{ step.displayName }}</strong></span
            >
            <span class="ai-trace-step__meta"
              ><template v-if="step.status === 'done'">{{ index + 1 }}/{{ displaySteps.length }}</template
              ><template v-else>{{ statusLabel(step) }}</template></span
            >
          </button>
        </div>
        <p v-if="message.traceDetailsExpired" class="ai-trace-expired">较早会话仅保留步骤摘要，详细参数和结果已从本地缓存中移除。</p>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { AlertCircle, Ban, Check, CheckCircle2, Copy, ListTree, LoaderCircle, XCircle } from 'lucide-vue-next'
import { AiChatMessage, AiChatTraceStep } from './types'

const props = defineProps<{ message: AiChatMessage | null; preferredStepId?: string }>()
const selectedStepId = ref('')
const viewMode = ref<'summary' | 'json'>('summary')
const copied = ref(false)
let copyTimer: number | undefined
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true })
const steps = computed(() => props.message?.trace || [])
const toolSteps = computed(() => steps.value.filter((step) => step.kind === 'tool'))
const displaySteps = computed(() => (toolSteps.value.length ? toolSteps.value : steps.value))
const selectedStep = computed(
  () => displaySteps.value.find((step) => step.id === selectedStepId.value) || displaySteps.value[displaySteps.value.length - 1] || null
)
const runningCount = computed(() => displaySteps.value.filter((step) => step.status === 'running').length)
const completedCount = computed(() => displaySteps.value.filter((step) => ['done', 'error', 'cancelled'].includes(step.status)).length)
const stageNames: Record<string, string> = {
  OTHER_COMMON: '通用处理',
  MAIN_CONVERSATION: '自主规划',
  PLANNING: '任务规划',
  SKILL_GENERATE: '技能处理',
  INTENT_RECOGNITION: '意图识别'
}
const stageLabel = (stage: string) => stageNames[stage] || stage
const statusLabel = (step: AiChatTraceStep) =>
  ({ pending: '等待执行', running: '执行中', done: '已完成', error: '执行失败', cancelled: '已停止' }[step.status])
const duration = (step: AiChatTraceStep) => {
  if (!step.completedAt || !step.startedAt) return ''
  const milliseconds = Math.max(0, step.completedAt - step.startedAt)
  return milliseconds < 1000 ? `${milliseconds}ms` : `${(milliseconds / 1000).toFixed(1)}s`
}
const formatValue = (value: unknown) => {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
const hasArgs = (step: AiChatTraceStep) => Boolean(formatValue(step.args))
const parsedOutput = computed(() => {
  const output = selectedStep.value?.output?.trim()
  if (!output || (!output.startsWith('{') && !output.startsWith('['))) return null
  try {
    return JSON.parse(output) as unknown
  } catch {
    return null
  }
})
const isJsonOutput = computed(() => parsedOutput.value !== null)
const formattedOutput = computed(() => (parsedOutput.value === null ? '' : JSON.stringify(parsedOutput.value, null, 2)))
const outputEntries = computed(() => {
  const value = parsedOutput.value
  if (value === null) return []
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index + 1), item] as const)
    : Object.entries(value as Record<string, unknown>)
  return entries.slice(0, 50).map(([key, entry]) => ({
    key,
    structured: typeof entry === 'object' && entry !== null,
    value: typeof entry === 'object' && entry !== null ? JSON.stringify(entry, null, 2) : String(entry ?? '')
  }))
})
const contentLabel = (step: AiChatTraceStep) =>
  ({ intent: '意图识别', reasoning: '思考过程', plan: '任务规划', tool: '上下文', status: '过程信息' }[step.kind] || '上下文')
const renderMarkdown = (content: string) => markdown.render(content)
const selectStep = (id: string) => {
  selectedStepId.value = id
  viewMode.value = 'summary'
}
const copyValue = async (content: string) => {
  if (!content) return
  try {
    await navigator.clipboard.writeText(content)
    copied.value = true
    if (copyTimer) window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => (copied.value = false), 1500)
  } catch {
    copied.value = false
  }
}
watch(
  () => [props.message?.id, props.preferredStepId],
  () => {
    selectedStepId.value =
      displaySteps.value.find((step) => step.id === props.preferredStepId)?.id ||
      displaySteps.value.find((step) => step.status === 'running' || step.status === 'error')?.id ||
      displaySteps.value[displaySteps.value.length - 1]?.id ||
      ''
    viewMode.value = 'summary'
  },
  { immediate: true }
)
watch(
  () => steps.value.map((step) => `${step.id}:${step.status}:${step.content?.length || 0}:${step.output?.length || 0}`).join('|'),
  () => {
    if (!selectedStepId.value || !displaySteps.value.some((step) => step.id === selectedStepId.value))
      selectedStepId.value = displaySteps.value[displaySteps.value.length - 1]?.id || ''
  }
)
</script>

<style scoped lang="less">
.ai-trace-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  background: #f8fbfb;
}
.ai-trace-panel__header {
  display: flex;
  min-height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}
.ai-trace-panel__title-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #00706b;
}
.ai-trace-panel__signal {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: #67c23a;
}
.ai-trace-panel__signal.is-running {
  background: #00706b;
  box-shadow: 0 0 0 3px rgba(0, 112, 107, 0.12);
  animation: ai-trace-pulse 1.2s ease-in-out infinite;
}
.ai-trace-panel__header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}
.ai-trace-panel__badge {
  min-width: 18px;
  padding: 1px 5px;
  border-radius: 8px;
  color: #ffffff;
  background: #00706b;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
}
.ai-trace-panel__running {
  flex: 0 0 auto;
  padding: 2px 6px;
  border: 0;
  border-radius: 4px;
  color: #00706b;
  background: #e6f4f3;
  font-size: 12px;
  font-weight: 600;
}
.ai-trace-panel__summary {
  color: #64748b;
  font-size: 12px;
}
.ai-trace-empty {
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 28px;
  color: #94a3b8;
  text-align: center;
}
.ai-trace-empty strong {
  color: #475569;
  font-size: 13px;
}
.ai-trace-empty span {
  max-width: 230px;
  font-size: 12px;
  line-height: 1.6;
}
.ai-trace-detail {
  display: flex;
  min-height: 0;
  flex: 1 1 58%;
  flex-direction: column;
  background: #ffffff;
}
.ai-trace-detail__body {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px 20px;
  scrollbar-width: thin;
  scrollbar-color: #b8ddd9 transparent;
}
.ai-trace-detail__heading {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.ai-trace-status {
  display: inline-flex;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #94a3b8;
  background: #f1f5f9;
}
.ai-trace-status.is-running {
  color: #00706b;
  background: #e6f4f3;
}
.ai-trace-status.is-done {
  color: #67c23a;
  background: #f2f9f8;
}
.ai-trace-status.is-error {
  color: #f56c6c;
  background: #fef0f0;
}
.ai-trace-detail__heading > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.ai-trace-detail__heading strong {
  overflow-wrap: anywhere;
  color: #475569;
  font-size: 14px;
}
.ai-trace-detail__heading span {
  color: #64748b;
  font-size: 12px;
}
.ai-trace-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin: 10px 0 0 34px;
}
.ai-trace-detail__meta span {
  padding: 3px 6px;
  border-radius: 4px;
  color: #00706b;
  background: #e6f4f3;
  font-size: 12px;
}
.ai-trace-rich {
  margin: 16px 0 0;
}
.ai-trace-rich__section {
  padding: 12px 0;
  border-top: 1px solid #eef2f6;
}
.ai-trace-rich__section:first-child {
  padding-top: 0;
  border-top: 0;
}
.ai-trace-rich__section h4 {
  margin: 0 0 7px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}
.ai-trace-rich__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ai-trace-rich__section-title button {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: #64748b;
  background: transparent;
  cursor: pointer;
}
.ai-trace-rich__section-title button:hover {
  color: #00706b;
  background: #e6f4f3;
}
.ai-trace-rich__section--context .ai-trace-rich__markdown {
  padding: 8px 10px;
  border-radius: 6px;
  background: #f8fafc;
}
.ai-trace-rich__section--error {
  border-top-color: #fef0f0;
}
.ai-trace-rich__markdown {
  color: #475569;
  font-size: 12px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}
.ai-trace-rich__markdown :deep(p) {
  margin: 0 0 7px;
}
.ai-trace-rich__markdown :deep(p:last-child) {
  margin-bottom: 0;
}
.ai-trace-rich__markdown :deep(ul),
.ai-trace-rich__markdown :deep(ol) {
  margin: 5px 0 7px;
  padding-left: 18px;
}
.ai-trace-rich__markdown :deep(code) {
  padding: 1px 3px;
  border-radius: 3px;
  color: #005f5a;
  background: #e6f4f3;
}
.ai-trace-rich__markdown :deep(pre) {
  overflow-x: auto;
  margin: 6px 0;
  padding: 8px;
  border-radius: 6px;
  color: #e2e8f0;
  background: #263238;
  font-size: 12px;
}
.ai-trace-rich__section pre,
.ai-trace-detail__json {
  max-width: 100%;
  box-sizing: border-box;
  overflow: auto;
  margin: 0;
  padding: 9px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  background: #f5fbfb;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ai-trace-detail__json {
  max-height: 400px;
  color: #475569;
  background: #f8fafc;
}
.ai-trace-result-tabs {
  display: flex;
  margin: 0 0 10px;
  border-bottom: 1px solid #e2e8f0;
}
.ai-trace-result-tabs button {
  position: relative;
  flex: 1 1 50%;
  padding: 6px 0;
  border: 0;
  color: #64748b;
  background: #ffffff;
  font-size: 13px;
  cursor: pointer;
}
.ai-trace-result-tabs button.is-active {
  color: #00706b;
  font-weight: 600;
}
.ai-trace-result-tabs button.is-active::after {
  position: absolute;
  right: 24%;
  bottom: -1px;
  left: 24%;
  height: 2px;
  background: #00706b;
  content: '';
}
.ai-trace-result-table-wrap {
  max-height: 400px;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}
.ai-trace-result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.ai-trace-result-table tr + tr {
  border-top: 1px solid #eef2f6;
}
.ai-trace-result-table tr:hover {
  background: #f5fbfb;
}
.ai-trace-result-table th,
.ai-trace-result-table td {
  padding: 7px 9px;
  vertical-align: top;
  text-align: left;
}
.ai-trace-result-table th {
  width: 1%;
  min-width: 72px;
  color: #00706b;
  font-weight: 500;
  white-space: nowrap;
}
.ai-trace-result-table td {
  color: #475569;
  overflow-wrap: anywhere;
}
.ai-trace-result-table pre {
  margin: 0;
  padding: 6px 8px;
  border: 0;
  background: #f8fafc;
}
.ai-trace-result-text {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f5f7fa;
}
.ai-trace-detail__error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px;
  border-radius: 6px;
  color: #f56c6c;
  background: #fef0f0;
  font-size: 12px;
  line-height: 1.5;
}
.ai-trace-rich__empty {
  color: #94a3b8;
  font-size: 12px;
}
.ai-trace-list {
  min-height: 0;
  max-height: 230px;
  flex: 0 0 auto;
  overflow-y: auto;
  padding: 10px 12px 8px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  scrollbar-width: thin;
  scrollbar-color: #b8ddd9 transparent;
}
.ai-trace-list__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 2px 9px;
  color: #64748b;
  font-size: 12px;
}
.ai-trace-list__heading span:first-child {
  color: #475569;
  font-weight: 600;
}
.ai-trace-list__track {
  position: relative;
}
.ai-trace-list__track::before {
  display: none;
}
.ai-trace-step {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  margin-bottom: 4px;
  padding: 7px 9px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #64748b;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.ai-trace-step:hover,
.ai-trace-step:focus-visible,
.ai-trace-step.is-selected {
  color: #00706b;
  border-color: transparent;
  background: #e6f4f3;
  outline: 0;
}
.ai-trace-step__dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  color: #94a3b8;
  background: #cbd5e1;
}
.ai-trace-step__dot.is-running {
  background: #00706b;
  box-shadow: 0 0 0 3px rgba(0, 112, 107, 0.14);
  animation: ai-trace-pulse 1.2s ease-in-out infinite;
}
.ai-trace-step__dot.is-done {
  background: #67c23a;
}
.ai-trace-step__dot.is-error {
  background: #f56c6c;
}
.ai-trace-step__copy {
  display: flex;
  min-width: 0;
  flex: 1;
  justify-content: flex-start;
}
.ai-trace-step__copy strong {
  overflow: hidden;
  color: #475569;
  font-size: 13px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-trace-step__meta {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 12px;
}
.ai-trace-expired {
  margin: 8px 2px 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.5;
}
.is-spinning {
  animation: ai-trace-spin 0.9s linear infinite;
}
@keyframes ai-trace-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes ai-trace-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(0, 112, 107, 0.14);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(0, 112, 107, 0.06);
  }
}
@media (max-width: 768px) {
  .ai-trace-list {
    max-height: 38%;
    flex-basis: 38%;
  }
  .ai-trace-detail__body {
    padding: 12px;
  }
  .ai-trace-rich,
  .ai-trace-detail__meta {
    margin-left: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .is-spinning,
  .ai-trace-step__dot.is-running {
    animation: none;
  }
}
</style>
