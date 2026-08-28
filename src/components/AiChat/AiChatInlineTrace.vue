<template>
  <section :class="['ai-inline-trace', { 'is-active': isActive }]" :aria-label="summaryLabel">
    <div v-if="processSteps.length" class="ai-inline-trace__reasoning">
      <button type="button" class="ai-inline-trace__summary" :aria-expanded="expanded" :aria-controls="contentId" @click.stop="toggleProcess">
        <span class="ai-inline-trace__summary-icon" aria-hidden="true">
          <LoaderCircle v-if="processActive" :size="15" class="is-spinning" />
          <AlertCircle v-else-if="processErrorCount" :size="15" />
          <BrainCircuit v-else :size="15" />
        </span>
        <span class="ai-inline-trace__summary-copy">
          <strong>思考过程</strong>
          <span v-if="traceModel" class="ai-inline-trace__model">{{ traceModel }}</span>
        </span>
        <span class="ai-inline-trace__state">{{ processSummary }}</span>
        <ChevronDown :size="15" :class="['ai-inline-trace__chevron', { 'is-expanded': expanded }]" aria-hidden="true" />
      </button>

      <div v-show="expanded" :id="contentId" class="ai-inline-trace__content">
        <ol class="ai-inline-trace__steps">
          <li v-for="step in processSteps" :key="step.id" :class="['ai-inline-step', `is-${step.status}`]">
            <span class="ai-inline-step__rail" aria-hidden="true">
              <span class="ai-inline-step__marker">
                <LoaderCircle v-if="step.status === 'running'" :size="14" class="is-spinning" />
                <XCircle v-else-if="step.status === 'error'" :size="14" />
                <Ban v-else-if="step.status === 'cancelled'" :size="14" />
                <Clock3 v-else-if="step.status === 'pending'" :size="14" />
                <component :is="stepIcon(step)" v-else :size="14" />
              </span>
            </span>

            <div class="ai-inline-step__body">
              <div class="ai-inline-step__heading">
                <span
                  ><small class="ai-inline-step__kind">{{ stepKindLabel(step) }}</small
                  >{{ stepTitle(step) }}</span
                >
                <small v-if="duration(step)">{{ duration(step) }}</small>
              </div>
              <p v-if="stepPreview(step)">{{ stepPreview(step) }}</p>
            </div>
          </li>
        </ol>
      </div>
    </div>

    <div v-if="toolSteps.length" class="ai-inline-tools">
      <article v-for="tool in toolSteps" :key="tool.id" :class="['ai-inline-tool', `is-${tool.status}`, { 'is-expanded': isToolExpanded(tool) }]">
        <button type="button" class="ai-inline-tool__header" :aria-expanded="isToolExpanded(tool)" @click.stop="toggleTool(tool)">
          <span class="ai-inline-tool__status" aria-hidden="true">
            <LoaderCircle v-if="tool.status === 'running'" :size="14" class="is-spinning" />
            <XCircle v-else-if="tool.status === 'error'" :size="14" />
            <component :is="stepIcon(tool)" v-else :size="14" />
          </span>
          <span class="ai-inline-tool__name">
            <strong>{{ tool.displayName }}</strong>
            <small v-if="tool.displayName !== tool.name">{{ tool.name }}</small>
          </span>
          <span class="ai-inline-tool__state">{{ statusText(tool) }}</span>
          <ChevronDown :size="14" :class="{ 'is-expanded': isToolExpanded(tool) }" aria-hidden="true" />
        </button>
        <div v-if="!isToolExpanded(tool) && compact(tool.args)" class="ai-inline-tool__args-preview">
          <span>输入参数：</span><code>{{ compact(tool.args) }}</code>
        </div>
        <div v-show="isToolExpanded(tool)" class="ai-inline-tool__body">
          <section v-if="compact(tool.args)"
            ><h4>输入参数</h4><pre>{{ stringify(tool.args) }}</pre>
          </section>
          <section v-if="tool.output"
            ><h4>执行结果</h4><p>{{ compact(tool.output, 240) }}</p></section
          >
          <section v-if="tool.error" class="is-error"
            ><h4>错误信息</h4><p>{{ tool.error }}</p></section
          >
          <div v-if="tool.status === 'running'" class="ai-inline-tool__running"><span></span><span></span><span></span>执行中...</div>
          <button type="button" class="ai-inline-step__open" @click.stop="$emit('open-details', tool.id)">
            右侧面板查看详情
            <ArrowRight :size="12" aria-hidden="true" />
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AlertCircle,
  ArrowRight,
  Ban,
  BrainCircuit,
  ChevronDown,
  CircleDot,
  Clock3,
  Database,
  FileSearch,
  FileText,
  ListChecks,
  LoaderCircle,
  Search,
  Terminal,
  Wrench,
  XCircle
} from 'lucide-vue-next'
import { AiChatTraceStep } from './types'

// 一个组件实例只负责正文里某一个插入点上的步骤，所以只接收该分组的步骤。
const props = defineProps<{ steps: AiChatTraceStep[]; groupId: string }>()
defineEmits<{ (event: 'open-details', stepId: string): void }>()

const isActive = computed(() => props.steps.some((step) => step.status === 'running' || step.status === 'pending'))
const toolSteps = computed(() => props.steps.filter((step) => step.kind === 'tool'))
const processSteps = computed(() => props.steps.filter((step) => step.kind !== 'tool'))
const processActive = computed(() => processSteps.value.some((step) => step.status === 'running' || step.status === 'pending'))
const processErrorCount = computed(() => processSteps.value.filter((step) => step.status === 'error').length)
const processCompletedCount = computed(() => processSteps.value.filter((step) => step.status === 'done').length)
const processSummary = computed(() => {
  const running = processSteps.value.find((step) => step.status === 'running')
  if (running) return stepTitle(running)
  const pending = processSteps.value.filter((step) => step.status === 'pending').length
  if (pending) return `${pending} 项等待处理`
  if (processErrorCount.value) return `${processErrorCount.value} 项异常`
  return processSteps.value.length ? `${processCompletedCount.value}/${processSteps.value.length} 已完成` : ''
})
const contentId = computed(() => `ai-inline-trace-${props.groupId}`)
const traceModel = computed(() => props.steps.find((step) => step.model)?.model || '')

// 进行中的分组自动展开，结束后自动收起，让正文成为主角；用户手动操作后不再自动收放。
const expanded = ref(isActive.value)
const processToggled = ref(false)
const toggleProcess = () => {
  processToggled.value = true
  expanded.value = !expanded.value
}
watch(isActive, (active) => {
  if (!processToggled.value) expanded.value = active
})

// 未记录过用户选择时，工具卡片跟随执行状态展开。
const toolChoices = ref<Record<string, boolean>>({})
const isToolExpanded = (tool: AiChatTraceStep) => toolChoices.value[tool.id] ?? tool.status === 'running'
const toggleTool = (tool: AiChatTraceStep) => {
  toolChoices.value = { ...toolChoices.value, [tool.id]: !isToolExpanded(tool) }
}

const summaryLabel = computed(() => {
  const running = props.steps.find((step) => step.status === 'running')
  if (running) return running.kind === 'tool' ? `正在调用 ${running.displayName}` : running.content || `正在${running.displayName}`
  const errorCount = props.steps.filter((step) => step.status === 'error').length
  if (errorCount) return `${errorCount} 个步骤执行异常`
  return `已完成 ${props.steps.filter((step) => step.status === 'done').length || props.steps.length} 个步骤`
})

const statusText = (step: AiChatTraceStep) => {
  if (step.status === 'running') return '执行中'
  if (step.status === 'pending') return '等待执行'
  if (step.status === 'error') return '执行失败'
  if (step.status === 'cancelled') return '已停止'
  return duration(step) ? `已完成 · ${duration(step)}` : '已完成'
}

const stepIcon = (step: AiChatTraceStep) => {
  if (step.kind === 'reasoning' || step.kind === 'intent') return BrainCircuit
  if (step.kind === 'plan') return ListChecks
  if (step.kind !== 'tool') return CircleDot
  const name = step.name.toLowerCase()
  if (name.includes('terminal')) return Terminal
  if (name.includes('search')) return Search
  if (name.includes('read_file')) return FileSearch
  if (name.includes('document')) return FileText
  if (name.includes('data')) return Database
  return Wrench
}

const stepTitle = (step: AiChatTraceStep) => {
  const action = step.kind === 'tool' ? '调用' : ''
  if (step.status === 'running') return `正在${action}${step.displayName}`
  if (step.status === 'pending') return `等待${action}${step.displayName}`
  if (step.status === 'error') return `${action}${step.displayName}失败`
  if (step.status === 'cancelled') return `${action}${step.displayName}已停止`
  return step.kind === 'tool' ? `已调用 ${step.displayName}` : step.displayName
}

const stepKindLabel = (step: AiChatTraceStep) =>
  ({ intent: '意图', reasoning: '思考', plan: '规划', tool: '工具', status: '状态' }[step.kind] || '过程')

const stringify = (value: unknown) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const compact = (value: unknown, limit = 116) => {
  const text = stringify(value).replace(/\s+/g, ' ').trim()
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

const stepPreview = (step: AiChatTraceStep) => {
  if (step.error) return compact(step.error)
  if (step.status === 'running' && step.kind === 'tool') return compact(step.args) || '正在等待工具返回结果'
  if (step.kind === 'tool') return compact(step.output) || compact(step.args)
  return compact(step.content || step.output)
}

const duration = (step: AiChatTraceStep) => {
  if (!step.completedAt || step.completedAt < step.startedAt) return ''
  const milliseconds = step.completedAt - step.startedAt
  return milliseconds < 1000 ? `${milliseconds}ms` : `${(milliseconds / 1000).toFixed(milliseconds < 10000 ? 1 : 0)}s`
}
</script>

<style scoped lang="less">
.ai-inline-trace {
  width: 100%;
  margin: 2px 0 12px;
  color: #475569;
}
.ai-inline-trace:last-child {
  margin-bottom: 0;
}
.ai-inline-trace__reasoning {
  min-width: 0;
}

.ai-inline-trace__summary {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  padding: 5px 4px;
  border: 0;
  border-radius: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.ai-inline-trace__summary:hover,
.ai-inline-trace__summary:focus-visible {
  background: #eef6f5;
}
.ai-inline-trace__summary:focus-visible {
  outline: 2px solid #b8ddd9;
  outline-offset: 1px;
}

.ai-inline-trace__summary-icon {
  display: inline-flex;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid #b8ddd9;
  border-radius: 50%;
  color: #00706b;
  background: #ffffff;
}
.ai-inline-trace.is-active .ai-inline-trace__summary-icon {
  color: #ffffff;
  background: #00706b;
}

.ai-inline-trace__summary-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
}
.ai-inline-trace__summary-copy strong {
  overflow: hidden;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-inline-trace__model {
  flex: 0 1 auto;
  overflow: hidden;
  padding: 2px 6px;
  border-radius: 4px;
  color: #00706b;
  background: #e6f4f3;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-inline-trace__state {
  max-width: 42%;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-inline-trace.is-active .ai-inline-trace__state {
  color: #00706b;
}
.ai-inline-trace__chevron {
  flex: 0 0 auto;
  color: #64748b;
  transition: transform 160ms ease-out;
}
.ai-inline-trace__chevron.is-expanded {
  transform: rotate(180deg);
}

.ai-inline-trace__content {
  max-height: min(310px, 42vh);
  overflow-y: auto;
  margin-left: 13px;
  padding: 4px 8px 6px 20px;
  border-left: 1px solid #b8ddd9;
  scrollbar-width: thin;
  scrollbar-color: #b8ddd9 transparent;
}
.ai-inline-trace__steps {
  margin: 0;
  padding: 0;
  list-style: none;
}
.ai-inline-step {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  min-height: 42px;
}
.ai-inline-step__rail {
  position: relative;
  display: flex;
  justify-content: center;
}
.ai-inline-step__rail::after {
  position: absolute;
  top: 20px;
  bottom: -1px;
  left: 50%;
  width: 1px;
  background: #d7e3e2;
  content: '';
}
.ai-inline-step:last-child .ai-inline-step__rail::after {
  display: none;
}
.ai-inline-step__marker {
  position: relative;
  z-index: 1;
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border: 1px solid #b8ddd9;
  border-radius: 50%;
  color: #00706b;
  background: #f2f9f8;
}
.ai-inline-step.is-running .ai-inline-step__marker {
  color: #ffffff;
  background: #00706b;
}
.ai-inline-step.is-error .ai-inline-step__marker {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}
.ai-inline-step.is-pending .ai-inline-step__marker,
.ai-inline-step.is-cancelled .ai-inline-step__marker {
  color: #64748b;
  background: #eef2f6;
}
.ai-inline-step__body {
  min-width: 0;
  padding: 0 0 11px 9px;
}
.ai-inline-step__heading {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
}
.ai-inline-step__heading span {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 6px;
  overflow-wrap: anywhere;
}
.ai-inline-step__heading .ai-inline-step__kind {
  flex: 0 0 auto;
  padding: 1px 5px;
  border-radius: 4px;
  color: #00706b;
  background: #e6f4f3;
  font-size: 12px;
  font-weight: 500;
  line-height: 17px;
}
.ai-inline-step__heading small {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 12px;
  font-weight: 400;
}
.ai-inline-step__body p {
  display: -webkit-box;
  overflow: hidden;
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.ai-inline-step.is-error .ai-inline-step__heading,
.ai-inline-step.is-error .ai-inline-step__body p {
  color: #f56c6c;
}
.ai-inline-step__open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 3px 6px;
  border: 0;
  border-radius: 4px;
  color: #00706b;
  background: #f2f9f8;
  font-size: 12px;
  cursor: pointer;
}
.ai-inline-step__open:hover,
.ai-inline-step__open:focus-visible {
  color: #ffffff;
  background: #2a9a92;
}

.ai-inline-tools {
  min-width: 0;
}
.ai-inline-trace__reasoning + .ai-inline-tools {
  margin-top: 8px;
}
.ai-inline-tool {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d7e3e2;
  border-radius: 6px;
  background: #ffffff;
}
.ai-inline-tool + .ai-inline-tool {
  margin-top: 7px;
}
.ai-inline-tool.is-running {
  border-color: #8ac7c2;
}
.ai-inline-tool.is-error {
  border-color: #f3c6c6;
}
.ai-inline-tool__header {
  display: flex;
  width: 100%;
  min-width: 0;
  min-height: 38px;
  box-sizing: border-box;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border: 0;
  color: #475569;
  background: #f8fbfb;
  text-align: left;
  cursor: pointer;
}
.ai-inline-tool__header:hover,
.ai-inline-tool__header:focus-visible {
  background: #eef6f5;
}
.ai-inline-tool__header:focus-visible {
  outline: 2px solid #b8ddd9;
  outline-offset: -2px;
}
.ai-inline-tool__status {
  display: inline-flex;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  color: #00706b;
  background: #e6f4f3;
}
.ai-inline-tool.is-running .ai-inline-tool__status {
  color: #ffffff;
  background: #00706b;
}
.ai-inline-tool.is-error .ai-inline-tool__status {
  color: #f56c6c;
  background: #fef0f0;
}
.ai-inline-tool__name {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: baseline;
  gap: 7px;
}
.ai-inline-tool__name strong,
.ai-inline-tool__name small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-inline-tool__name strong {
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}
.ai-inline-tool__name small {
  color: #94a3b8;
  font-family: monospace;
  font-size: 12px;
}
.ai-inline-tool__state {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 12px;
}
.ai-inline-tool.is-running .ai-inline-tool__state {
  color: #00706b;
}
.ai-inline-tool.is-error .ai-inline-tool__state {
  color: #f56c6c;
}
.ai-inline-tool__header > svg {
  flex: 0 0 auto;
  color: #64748b;
  transition: transform 160ms ease-out;
}
.ai-inline-tool__header > svg.is-expanded {
  transform: rotate(180deg);
}
.ai-inline-tool__args-preview {
  display: flex;
  min-width: 0;
  gap: 4px;
  padding: 7px 10px;
  border-top: 1px solid #eef2f6;
  color: #64748b;
  background: #ffffff;
  font-size: 12px;
  line-height: 1.5;
}
.ai-inline-tool__args-preview span {
  flex: 0 0 auto;
}
.ai-inline-tool__args-preview code {
  min-width: 0;
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ai-inline-tool__body {
  padding: 9px 10px 10px;
  border-top: 1px solid #eef2f6;
  background: #ffffff;
}
.ai-inline-tool__body section + section {
  margin-top: 9px;
}
.ai-inline-tool__body h4 {
  margin: 0 0 5px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}
.ai-inline-tool__body pre,
.ai-inline-tool__body p {
  max-width: 100%;
  box-sizing: border-box;
  overflow: auto;
  margin: 0;
  padding: 7px 8px;
  border-radius: 5px;
  color: #475569;
  background: #f5fbfb;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ai-inline-tool__body pre {
  font-family: monospace;
}
.ai-inline-tool__body .is-error h4,
.ai-inline-tool__body .is-error p {
  color: #f56c6c;
}
.ai-inline-tool__body .is-error p {
  background: #fef0f0;
}
.ai-inline-tool__running {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  color: #00706b;
  font-size: 12px;
}
.ai-inline-tool__running span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #00706b;
  animation: ai-inline-dot 1.1s ease-in-out infinite;
}
.ai-inline-tool__running span:nth-child(2) {
  animation-delay: 0.12s;
}
.ai-inline-tool__running span:nth-child(3) {
  animation-delay: 0.24s;
}

.is-spinning {
  animation: ai-inline-spin 0.9s linear infinite;
}
@keyframes ai-inline-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes ai-inline-dot {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@media (max-width: 768px) {
  .ai-inline-trace__content {
    max-height: min(260px, 38vh);
    margin-left: 10px;
    padding-right: 0;
    padding-left: 16px;
  }
  .ai-inline-trace__summary-copy {
    gap: 6px;
  }
  .ai-inline-trace__state {
    display: none;
  }
  .ai-inline-tool__name small,
  .ai-inline-tool__state {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-inline-trace__chevron,
  .ai-inline-tool__header > svg {
    transition: none;
  }
  .is-spinning,
  .ai-inline-tool__running span {
    animation: none;
  }
}
</style>
