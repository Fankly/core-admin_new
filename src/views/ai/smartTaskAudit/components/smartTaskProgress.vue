<!-- 任务进度 -->
<template>
  <vxe-modal
    v-model="isShowTable"
    class-name="smart-task-progress-modal"
    :destroy-on-close="true"
    :close-on-press-escape="false"
    resize
    show-zoom
    fullscreen
    position="center"
    width="90%"
    height="760"
    :title="`任务进度`"
    @close="closeSxModal"
  >
    <main class="progress-fit-shell" :class="{ 'is-data-ready': dataReady }" aria-label="任务进度">
      <div class="progress-fit-box">
        <section class="progress-artboard">
          <div class="progress-source-canvas">
            <section
              v-for="(panel, panelIndex) in taskPanels"
              :key="panel.key"
              class="task-panel"
              :class="[`panel-${panel.key}`, `is-${panel.state}`]"
            >
              <div class="panel-phase-node" aria-hidden="true">
                <span>{{ panelIndex + 1 }}</span>
              </div>

              <div class="panel-copy">
                <h2>{{ panel.title }}</h2>
                <p>{{ panel.description[0] }}<br />{{ panel.description[1] }}</p>
              </div>

              <div class="task-visual" aria-hidden="true">
                <img class="task-platform" :src="platformIllustration" alt="" />
                <i class="visual-orbit"></i>
                <i class="visual-scan"></i>
                <img class="task-illustration" :src="panel.illustration" alt="" />
              </div>

              <div
                class="workflow"
                :class="`stage-count-${panel.stages.length}`"
                :style="workflowRevealStyle(panel)"
                :aria-label="`${panel.title}流程`"
              >
                <div
                  v-for="(stage, stageIndex) in panel.stages"
                  :key="stage.title"
                  class="stage"
                  :class="[`is-${stage.state}`, { 'is-revealed': stageIndex < panel.revealCount }]"
                  :style="{ '--reveal-delay': stage.revealDelay }"
                >
                  <span class="stage-number">{{ String(stageIndex + 1).padStart(2, '0') }}</span>
                  <span class="stage-copy">
                    <strong>{{ stage.title }}</strong>
                    <span>{{ stage.subtitle }}</span>
                  </span>
                  <i class="stage-state-icon" aria-hidden="true"></i>
                </div>
                <i
                  v-for="connectorIndex in panel.stages.length - 1"
                  :key="connectorIndex"
                  class="connector"
                  :class="[
                    `c${connectorIndex}`,
                    `is-${getConnectorState(panel.stages[connectorIndex - 1].state, panel.stages[connectorIndex].state)}`
                  ]"
                  aria-hidden="true"
                ></i>
              </div>

              <div class="task-table-wrap" :class="{ 'is-empty': !panel.rows.length }">
                <table class="task-table" :aria-label="`${panel.title}${panel.nameColumnTitle}列表`">
                  <colgroup><col /><col /><col /><col /><col /></colgroup>
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>{{ panel.nameColumnTitle }}</th>
                      <th>开始时间</th>
                      <th>结束时间</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIndex) in panel.rows" :key="`${panel.key}-${rowIndex}-${row.name || ''}`">
                      <td>{{ rowIndex + 1 }}</td>
                      <td
                        class="file-cell"
                        :class="{ 'file-cell--plain': !getFileIcon(row.name, panel.iconOccurrence) }"
                        :title="displayValue(row.name)"
                      >
                        <img
                          v-if="getFileIcon(row.name, panel.iconOccurrence)"
                          class="file-icon"
                          :src="getFileIcon(row.name, panel.iconOccurrence)"
                          alt=""
                        />
                        <span>{{ displayValue(row.name) }}</span>
                      </td>
                      <td :title="displayValue(row.startTime)">{{ displayValue(row.startTime) }}</td>
                      <td :title="displayValue(row.finishTime)">{{ displayValue(row.finishTime) }}</td>
                      <td>
                        <span class="status" :class="`is-${getRowStatusTone(row, panel.key)}`"
                          ><i class="status-count" aria-hidden="true"></i>{{ displayStatus(row, panel.key) }}</span
                        >
                      </td>
                    </tr>
                    <tr v-if="!panel.rows.length" class="empty-row">
                      <td colspan="5">暂无数据</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div v-if="loading" class="loading-mask" aria-live="polite">
              <span class="loading-spinner" aria-hidden="true"></span>
              <span>任务进度加载中</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  </vxe-modal>
</template>

<script lang="ts">
export default {
  name: 'smartTaskProgress'
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getProcessProgress } from '@/api/ai/smartTaskAudit'
import transcodeIllustration from '@/assets/images/smart-review/task-progress/assets/illustrations/prototype/prototype-transcode-subject.png'
import parseIllustration from '@/assets/images/smart-review/task-progress/assets/illustrations/prototype/prototype-parse-subject.png'
import reviewIllustration from '@/assets/images/smart-review/task-progress/assets/illustrations/prototype/prototype-review-subject.png'
import platformIllustration from '@/assets/images/smart-review/task-progress/assets/illustrations/prototype/prototype-platform.png'
import docIcon01 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-doc-01.png'
import docIcon02 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-doc-02.png'
import docIcon03 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-doc-03.png'
import pdfIcon01 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-pdf-01.png'
import pdfIcon02 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-pdf-02.png'
import pdfIcon03 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-pdf-03.png'
import xlsIcon01 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-xls-01.png'
import xlsIcon02 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-xls-02.png'
import xlsIcon03 from '@/assets/images/smart-review/task-progress/assets/icons/icon-file-xls-03.png'

type StatusTone = 'waiting' | 'running' | 'done' | 'failed'
type PanelKey = 'transcode' | 'parse' | 'review'
type ProgressDataKey = 'transcode' | 'extract' | 'aiAudit'
type IconOccurrence = 1 | 2 | 3

interface ProcessRow {
  name?: string
  startTime?: string
  finishTime?: string
  status?: string | number
  statusName?: string
  [key: string]: unknown
}

interface ProgressData {
  transcode: ProcessRow[]
  extract: ProcessRow[]
  aiAudit: ProcessRow[]
}

interface StageConfig {
  title: string
  subtitle: string
}

interface PanelConfig {
  key: PanelKey
  dataKey: ProgressDataKey
  title: string
  description: [string, string]
  illustration: string
  nameColumnTitle: string
  iconOccurrence: IconOccurrence
  activeStageIndex: number
  initialDoneCount: number
  stages: StageConfig[]
}

interface TaskPanelStage extends StageConfig {
  state: StatusTone
  revealDelay: string
}

interface TaskPanel extends PanelConfig {
  rows: ProcessRow[]
  revealCount: number
  state: StatusTone
  stages: TaskPanelStage[]
}

const panelConfigs: PanelConfig[] = [
  {
    key: 'transcode',
    dataKey: 'transcode',
    title: '文档预处理-转码',
    description: ['将上传文档转换为', '标准可处理格式'],
    illustration: transcodeIllustration,
    nameColumnTitle: '文件名',
    iconOccurrence: 1,
    activeStageIndex: 2,
    initialDoneCount: 1,
    stages: [
      { title: '上传文档', subtitle: '文档上传成功' },
      { title: '等待转码', subtitle: '任务排队中' },
      { title: '转码中', subtitle: '文档转码进行中' },
      { title: '转码完成', subtitle: '文档转码完成' }
    ]
  },
  {
    key: 'parse',
    dataKey: 'extract',
    title: '文档预处理-解析',
    description: ['对文档内容进行解析', '提取结构化信息'],
    illustration: parseIllustration,
    nameColumnTitle: '文件名',
    iconOccurrence: 2,
    activeStageIndex: 1,
    initialDoneCount: 0,
    stages: [
      { title: '等待解析', subtitle: '文档已就绪' },
      { title: '解析中', subtitle: '智能解析进行中' },
      { title: '解析完成', subtitle: '文档解析完成' }
    ]
  },
  {
    key: 'review',
    dataKey: 'aiAudit',
    title: '规则审核关联性',
    description: ['对解析结果进行规则', '审核与关联校验'],
    illustration: reviewIllustration,
    nameColumnTitle: '规则名称',
    iconOccurrence: 3,
    activeStageIndex: 1,
    initialDoneCount: 0,
    stages: [
      { title: '待审核', subtitle: '规则待审核' },
      { title: '审核中', subtitle: '审核进行中' },
      { title: '审核完成', subtitle: '审核已完成' }
    ]
  }
]

const fileIconMap: Record<string, string> = {
  'doc-1': docIcon01,
  'doc-2': docIcon02,
  'doc-3': docIcon03,
  'pdf-1': pdfIcon01,
  'pdf-2': pdfIcon02,
  'pdf-3': pdfIcon03,
  'xls-1': xlsIcon01,
  'xls-2': xlsIcon02,
  'xls-3': xlsIcon03
}

const isShowTable = ref(false)
const loading = ref(false)
const dataReady = ref(false)
const stageCount = (states: StatusTone[]) => {
  const done = states.filter((state) => state === 'done').length
  return states.some((state) => state === 'running' || state === 'failed') ? done + 1 : done
}
const formData = ref<{ taskId?: string }>({})
const progressData = ref<ProgressData>({ transcode: [], extract: [], aiAudit: [] })
let requestSequence = 0

const getStatusTone = (value: unknown): StatusTone => {
  const status = String(value ?? '').trim()
  if (/失败|错误|异常|不通过|终止/.test(status)) return 'failed'
  if (/处理中|进行中|转码中|解析中|审核中|执行中/.test(status)) return 'running'
  if (/等待|待|未开始|未处理|排队|未完成/.test(status)) return 'waiting'
  if (/已完成|完成|成功|通过|结束/.test(status)) return 'done'
  return 'waiting'
}

const isTranscodeFailure = (row: ProcessRow, panelKey: PanelKey) => panelKey === 'transcode' && String(row.status ?? '').trim() === '4'

const getRowStatusTone = (row: ProcessRow, panelKey: PanelKey): StatusTone => {
  if (isTranscodeFailure(row, panelKey)) return 'failed'
  return getStatusTone(row.statusName)
}

const getStageStates = (config: PanelConfig, rows: ProcessRow[]): StatusTone[] => {
  const states: StatusTone[] = config.stages.map(() => 'waiting')
  const tones = rows.map((row) => getRowStatusTone(row, config.key))
  const activeIndex = config.activeStageIndex
  const failureIndex = config.key === 'transcode' ? config.stages.length - 1 : activeIndex

  if (tones.length && tones.every((tone) => tone === 'done')) return states.map(() => 'done')

  for (let index = 0; index < config.initialDoneCount; index += 1) states[index] = 'done'
  if (tones.includes('failed')) {
    for (let index = 0; index < failureIndex; index += 1) states[index] = 'done'
    states[failureIndex] = 'failed'
  } else if (tones.includes('running') || tones.includes('done')) {
    for (let index = 0; index < activeIndex; index += 1) states[index] = 'done'
    states[activeIndex] = 'running'
  }
  return states
}

const getConnectorState = (fromState: StatusTone, toState: StatusTone): StatusTone => {
  if (toState === 'failed') return 'failed'
  if (toState === 'running') return 'running'
  if (fromState === 'done') return 'done'
  return 'waiting'
}

const getPanelState = (states: StatusTone[]): StatusTone => {
  if (states.includes('failed')) return 'failed'
  if (states.includes('running')) return 'running'
  if (states.length && states.every((state) => state === 'done')) return 'done'
  return 'waiting'
}

const REVEAL_STEP_MS = 140

const taskPanels = computed<TaskPanel[]>(() => {
  let offset = 0
  return panelConfigs.map((config) => {
    const rows = progressData.value[config.dataKey]
    const states = getStageStates(config, rows)
    const hasTranscodeFailure = config.key === 'transcode' && rows.some((row) => isTranscodeFailure(row, config.key))
    const revealCount = dataReady.value ? stageCount(states) : 0
    const panel = {
      ...config,
      rows,
      revealCount,
      state: getPanelState(states),
      stages: config.stages.map((stage, index) => {
        const isFailureStage = hasTranscodeFailure && index === config.stages.length - 1
        return {
          ...stage,
          title: isFailureStage ? '转码失败' : stage.title,
          subtitle: isFailureStage ? '文档转码失败' : stage.subtitle,
          state: index < revealCount ? states[index] : ('waiting' as StatusTone),
          revealDelay: `${(offset + index) * REVEAL_STEP_MS}ms`
        }
      })
    }
    offset += revealCount
    return panel
  })
})

const displayValue = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text || '--'
}

const workflowRevealStyle = (panel: { stages: { revealDelay: string }[] }) => {
  const vars: Record<string, string> = {}
  panel.stages.forEach((stage, index) => {
    vars[`--stage-delay-${index + 1}`] = stage.revealDelay
  })
  return vars
}

const displayStatus = (row: ProcessRow, panelKey: PanelKey) => {
  if (isTranscodeFailure(row, panelKey)) return '转码失败'
  const text = String(row.statusName ?? '').trim()
  return text || '等待中'
}

const getFileIcon = (fileName: unknown, occurrence: IconOccurrence) => {
  const name = String(fileName ?? '')
    .toLowerCase()
    .split(/[?#]/)[0]
  const extension = name.includes('.') ? name.split('.').pop() || '' : ''
  const type = extension === 'pdf' ? 'pdf' : ['doc', 'docx'].includes(extension) ? 'doc' : ['xls', 'xlsx'].includes(extension) ? 'xls' : ''
  return type ? fileIconMap[`${type}-${occurrence}`] : ''
}

const toRows = (value: unknown): ProcessRow[] =>
  Array.isArray(value) ? value.filter((row): row is ProcessRow => Boolean(row && typeof row === 'object')) : []

const clearProgressData = () => {
  progressData.value = { transcode: [], extract: [], aiAudit: [] }
}

const closeSxModal = () => {
  requestSequence += 1
  loading.value = false
  dataReady.value = false
  isShowTable.value = false
  formData.value = {}
  clearProgressData()
}

const loadProgress = async () => {
  const taskId = String(formData.value.taskId || '').trim()
  if (!taskId) {
    ElMessage.warning('当前任务缺少任务ID')
    return
  }

  const currentRequest = ++requestSequence
  loading.value = true
  clearProgressData()
  try {
    const res: any = await getProcessProgress(taskId)
    if (currentRequest !== requestSequence) return
    if (!res.success) {
      ElMessage.error(res.msg || '任务进度获取失败')
      return
    }
    const data = res.data || {}
    progressData.value = {
      transcode: toRows(data.transcode),
      extract: toRows(data.extract),
      aiAudit: toRows(data.aiAudit)
    }
    dataReady.value = true
  } catch (error: any) {
    if (currentRequest === requestSequence) ElMessage.error(error?.message || '任务进度获取失败')
  } finally {
    if (currentRequest === requestSequence) loading.value = false
  }
}

const acceptParams = async (param: { taskId?: string }) => {
  formData.value = { ...param }
  dataReady.value = false
  isShowTable.value = true
  await loadProgress()
}

onBeforeUnmount(() => {
  requestSequence += 1
})

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
:global(.smart-task-progress-modal .vxe-modal--body),
:global(.smart-task-progress-modal .vxe-modal--content) {
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background: #f3faf9;
}

:global(.smart-task-progress-modal .vxe-modal--content) {
  height: 100%;
}

.progress-fit-shell {
  --board-w: 1920;
  --board-h: 1081;
  --source-w: 1618;
  --source-h: 911;
  --normalize-scale: 1.1866501854;
  --page-bg: #f3faf9;
  --ink: #2e3f48;
  --muted: #8d9aa0;
  --line: #e6eeee;
  --green: #0ba97d;
  --green-dark: #006f57;
  --panel-bg: rgba(255, 255, 255, 0.91);
  display: grid;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  container-type: inline-size;
  color: var(--ink);
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
  letter-spacing: 0;
  background: var(--page-bg);
}

.progress-fit-shell,
.progress-fit-shell * {
  box-sizing: border-box;
}

.progress-fit-box {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.progress-artboard {
  position: relative;
  width: calc(var(--board-w) * 1px);
  height: calc(var(--board-h) * 1px);
  overflow: hidden;
  background: var(--page-bg);
}

.progress-source-canvas {
  position: absolute;
  inset: 0 auto auto 0;
  width: calc(var(--source-w) * 1px);
  height: calc(var(--source-h) * 1px);
  overflow: hidden;
  background: linear-gradient(180deg, rgba(239, 250, 248, 0.92) 0, rgba(247, 252, 251, 0.98) 62px, #f4faf9 100%);
  transform: scale(var(--normalize-scale));
  transform-origin: top left;
}

.task-panel {
  position: absolute;
  left: 15px;
  width: 1589px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: var(--panel-bg);
  box-shadow: none;
}

.task-panel::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 228px;
  width: 1px;
  content: '';
  background: rgba(225, 235, 234, 0.96);
}

.panel-transcode {
  top: 16px;
  height: 301px;
}

.panel-parse {
  top: 330px;
  height: 269px;
}

.panel-review {
  top: 612px;
  height: 281px;
}

.panel-copy {
  position: absolute;
  top: 23px;
  left: 21px;
  z-index: 3;
  width: 191px;
}

.panel-copy h2 {
  margin: 0 0 12px 21px;
  color: #007b58;
  font-size: 18px;
  font-weight: 700;
  line-height: 23px;
  white-space: nowrap;
  letter-spacing: 0;
}

.panel-copy h2::before {
  position: absolute;
  top: 2px;
  left: 0;
  width: 6px;
  height: 20px;
  content: '';
  border-radius: 4px;
  background: linear-gradient(180deg, #29c59b, #079b74);
  box-shadow: 0 2px 7px rgba(3, 166, 121, 0.2);
}

.panel-copy p {
  margin: 0 0 0 21px;
  color: #33464e;
  font-size: 14px;
  font-weight: 400;
  line-height: 23px;
  letter-spacing: 0;
}

.task-visual {
  position: absolute;
  left: 25px;
  z-index: 2;
  width: 175px;
  height: 158px;
}

.panel-transcode .task-visual {
  top: 123px;
  height: 156px;
}

.panel-parse .task-visual {
  top: 109px;
  height: 150px;
}

.panel-review .task-visual {
  top: 112px;
  height: 158px;
}

.task-platform {
  position: absolute;
  bottom: 0;
  left: 50%;
  z-index: 1;
  width: 158px;
  height: auto;
  pointer-events: none;
  transform: translateX(-50%);
  transform-origin: 50% 100%;
  filter: drop-shadow(0 8px 10px rgba(0, 112, 90, 0.08));
}

.task-illustration {
  position: absolute;
  top: 10px;
  right: 30px;
  bottom: 50px;
  left: 30px;
  z-index: 3;
  width: calc(100% - 60px);
  height: calc(100% - 60px);
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 9px 10px rgba(0, 112, 90, 0.11));
  transform-origin: 50% 78%;
}

.panel-review .task-illustration {
  right: 42px;
  left: 42px;
  width: calc(100% - 84px);
}

.visual-orbit {
  position: absolute;
  right: 2px;
  bottom: 4px;
  left: 2px;
  z-index: 4;
  height: 56px;
  pointer-events: none;
  border: 1px solid rgba(11, 169, 125, 0.3);
  border-right-color: transparent;
  border-left-color: transparent;
  border-radius: 50%;
  transform: rotate(-8deg);
}

.visual-orbit::before,
.visual-orbit::after {
  position: absolute;
  width: 5px;
  height: 5px;
  content: '';
  border-radius: 50%;
  background: #29c59b;
  box-shadow: 0 0 0 3px rgba(41, 197, 155, 0.12);
}

.visual-orbit::before {
  top: 8px;
  left: 12px;
}

.visual-orbit::after {
  right: 13px;
  bottom: 8px;
}

.visual-scan {
  position: absolute;
  top: 16px;
  right: 23px;
  bottom: 28px;
  left: 23px;
  z-index: 5;
  overflow: hidden;
  pointer-events: none;
  border-radius: 40%;
}

.visual-scan::after {
  position: absolute;
  top: -38%;
  right: -30%;
  width: 45px;
  height: 180%;
  content: '';
  opacity: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.88), transparent);
  filter: blur(2px);
  transform: rotate(18deg);
}

.progress-fit-shell.is-data-ready .task-illustration {
  will-change: transform, filter;
  animation: task-progress-subject-idle 4.2s ease-in-out infinite;
}

.progress-fit-shell.is-data-ready .task-platform {
  will-change: transform, filter;
  animation: task-progress-platform-idle 4.8s ease-in-out infinite;
}

.panel-parse .task-illustration,
.panel-parse .task-platform {
  animation-delay: -1.3s;
}

.panel-review .task-illustration,
.panel-review .task-platform {
  animation-delay: -2.6s;
}

.task-panel.is-running .task-illustration {
  will-change: transform, filter;
  animation: task-progress-visual-float 2.4s ease-in-out infinite;
  animation-delay: 0s;
}

.task-panel.is-running .task-platform {
  will-change: transform, filter;
  animation: task-progress-platform-pulse 2.4s ease-in-out infinite;
  animation-delay: 0s;
}

.task-panel.is-running .visual-orbit {
  will-change: transform;
  animation: task-progress-orbit 5s linear infinite;
}

.task-panel.is-running .visual-orbit::before,
.task-panel.is-running .visual-orbit::after {
  animation: task-progress-orbit-node 1.2s ease-in-out infinite;
}

.task-panel.is-running .visual-orbit::after {
  animation-delay: 600ms;
}

.task-panel.is-running .visual-scan::after {
  animation: task-progress-visual-scan 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.task-panel.is-done .task-illustration {
  animation: task-progress-visual-arrive 520ms cubic-bezier(0.16, 1, 0.3, 1) both, task-progress-subject-idle 4.2s 520ms ease-in-out infinite;
}

.task-panel.is-failed .task-visual {
  filter: saturate(0.64);
}

.task-panel.is-failed .task-illustration,
.task-panel.is-failed .task-platform {
  animation: none;
}

.workflow {
  position: absolute;
  z-index: 4;
  height: 88px;
}

.panel-transcode .workflow {
  top: 24px;
  left: 260px;
  width: 1238px;
}

.panel-parse .workflow,
.panel-review .workflow {
  top: 24px;
  left: 305px;
  width: 1193px;
}

.stage {
  position: absolute;
  top: 2px;
  z-index: 1;
  width: 200px;
  height: 67px;
  border: 1px solid rgba(225, 233, 233, 0.82);
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.48);
  box-shadow: 0 7px 16px rgba(64, 101, 97, 0.035);
}

.stage:nth-of-type(1) {
  left: 45px;
}
.stage:nth-of-type(2) {
  left: 294px;
}
.stage:nth-of-type(3) {
  left: 531px;
}
.stage:nth-of-type(4) {
  left: 775px;
}
.panel-parse .stage:nth-of-type(1),
.panel-review .stage:nth-of-type(1) {
  left: 0;
}
.panel-parse .stage:nth-of-type(2),
.panel-review .stage:nth-of-type(2) {
  left: 249px;
}
.panel-parse .stage:nth-of-type(3),
.panel-review .stage:nth-of-type(3) {
  left: 487px;
}
.panel-parse .stage:nth-of-type(4),
.panel-review .stage:nth-of-type(4) {
  left: 731px;
}
.stage {
  transition: border-color 300ms ease, background-color 300ms ease, box-shadow 300ms ease;
}

.stage.is-waiting {
  --stage-a: #e4ebec;
  --stage-b: #cbd5d7;
  --stage-ink: #7e8d93;
  --stage-glow: rgba(150, 165, 170, 0.14);
}

.stage.is-running {
  --stage-a: #4ec0ea;
  --stage-b: #1f9dd8;
  --stage-ink: #1a7fae;
  --stage-glow: rgba(31, 157, 216, 0.2);
}

.stage.is-done {
  --stage-a: #29c59b;
  --stage-b: #008d69;
  --stage-ink: #007553;
  --stage-glow: rgba(25, 194, 145, 0.22);
}

.stage.is-failed {
  --stage-a: #f08379;
  --stage-b: #e3574c;
  --stage-ink: #c2382d;
  --stage-glow: rgba(227, 87, 76, 0.18);
}

.stage.is-running,
.stage.is-done,
.stage.is-failed {
  border-color: color-mix(in srgb, var(--stage-b) 42%, transparent);
  background: rgba(252, 255, 254, 0.86);
  box-shadow: 0 7px 20px var(--stage-glow);
}

.stage-number {
  position: absolute;
  top: 11px;
  left: 14px;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(219, 230, 230, 0.9);
  border-radius: 50%;
  color: #7a898e;
  font-size: 17px;
  font-weight: 700;
  line-height: 20px;
  background: linear-gradient(145deg, #fff, #f2f7f7);
  box-shadow: 0 5px 9px rgba(59, 89, 88, 0.14);
}

.stage.is-running .stage-number,
.stage.is-done .stage-number,
.stage.is-failed .stage-number {
  border-color: transparent;
  color: #fff;
  background: linear-gradient(145deg, var(--stage-a), var(--stage-b));
  box-shadow: 0 8px 17px var(--stage-glow);
}

.stage.is-running .stage-number::after,
.stage.is-done .stage-number::after,
.stage.is-failed .stage-number::after {
  position: absolute;
  top: 37px;
  left: -20px;
  width: 84px;
  height: 31px;
  content: '';
  pointer-events: none;
  border-bottom: 1px solid color-mix(in srgb, var(--stage-b) 22%, transparent);
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    var(--stage-glow) 0 18%,
    color-mix(in srgb, var(--stage-glow) 45%, transparent) 40%,
    transparent 72%
  );
}

.stage-copy {
  position: absolute;
  top: 13px;
  right: 26px;
  left: 73px;
  white-space: nowrap;
}

.stage-copy strong,
.stage-copy span {
  display: block;
  overflow: hidden;
  text-overflow: clip;
}

.stage-copy strong {
  margin-bottom: 5px;
  color: #5d6d73;
  font-size: 14px;
  font-weight: 700;
  line-height: 18px;
}

.stage-copy span {
  color: #a5afb2;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
}

.stage.is-running .stage-copy strong,
.stage.is-done .stage-copy strong,
.stage.is-failed .stage-copy strong {
  color: var(--stage-ink);
}

.stage.is-running .stage-copy span,
.stage.is-done .stage-copy span,
.stage.is-failed .stage-copy span {
  color: #566f6a;
}

.stage-state-icon {
  position: absolute;
  top: 27px;
  right: 16px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.stage.is-waiting .stage-state-icon {
  border: 2px solid #b3c1c4;
}

.stage.is-running .stage-state-icon,
.stage.is-done .stage-state-icon,
.stage.is-failed .stage-state-icon {
  background: var(--stage-b);
}

.stage.is-running .stage-state-icon {
  animation: task-progress-processing 1.4s linear infinite;
}

.stage.is-running .stage-state-icon::before,
.stage.is-running .stage-state-icon::after {
  position: absolute;
  top: 4px;
  left: 7px;
  width: 2px;
  content: '';
  border-radius: 1px;
  background: #fff;
  transform-origin: bottom center;
}

.stage.is-running .stage-state-icon::before {
  height: 5px;
}
.stage.is-running .stage-state-icon::after {
  height: 4px;
  transform: rotate(80deg);
}

.stage.is-done .stage-state-icon::after {
  position: absolute;
  top: 3px;
  left: 5px;
  width: 4px;
  height: 7px;
  content: '';
  border-right: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(45deg);
}

.stage.is-failed .stage-state-icon::before,
.stage.is-failed .stage-state-icon::after {
  position: absolute;
  top: 4px;
  left: 7px;
  width: 2px;
  height: 8px;
  content: '';
  border-radius: 1px;
  background: #fff;
}

.stage.is-failed .stage-state-icon::before {
  transform: rotate(45deg);
}
.stage.is-failed .stage-state-icon::after {
  transform: rotate(-45deg);
}

.connector {
  --connector-start: #d7e1e1;
  --connector-end: #c4d0d1;
  --connector-arrow: #9babad;
  position: absolute;
  top: 33px;
  z-index: 0;
  width: 49px;
  height: 6px;
  border: 1px solid rgba(193, 208, 208, 0.72);
  border-radius: 999px;
  background: #e8eeee;
  box-shadow: inset 0 1px 2px rgba(70, 100, 98, 0.08);
}

.connector::before {
  position: absolute;
  inset: 1px;
  content: '';
  border-radius: inherit;
  background: linear-gradient(90deg, var(--connector-start), var(--connector-end));
}

.connector::after {
  position: absolute;
  top: 50%;
  right: 5px;
  width: 6px;
  height: 6px;
  content: '';
  border-top: 2px solid var(--connector-arrow);
  border-right: 2px solid var(--connector-arrow);
  transform: translateY(-50%) rotate(45deg);
}

.connector.is-done,
.connector.is-failed,
.connector.is-running {
  transition: border-color 300ms ease, background-color 300ms ease, box-shadow 300ms ease;
}

.connector.is-done {
  --connector-start: #29c59b;
  --connector-end: #0aa47b;
  --connector-arrow: #fff;
  border-color: rgba(10, 164, 123, 0.25);
  background: rgba(41, 197, 155, 0.12);
}

.connector.is-running {
  --connector-start: #29c59b;
  --connector-end: #1f9dd8;
  --connector-arrow: #fff;
  border-color: rgba(31, 157, 216, 0.26);
  background: rgba(31, 157, 216, 0.1);
  box-shadow: inset 0 1px 2px rgba(31, 157, 216, 0.1), 0 2px 7px rgba(31, 157, 216, 0.14);
}

.connector.is-running::before {
  background: linear-gradient(90deg, #29c59b 0 22%, #91e3ce 38%, #1f9dd8 56% 100%);
  background-size: 190% 100%;
  animation: task-progress-flow 1.4s linear infinite;
}

/* Authored reveal: stages snap in along the flow once data lands; the
   connector in front of each stage fills from the stage behind it. */
.progress-fit-shell.is-data-ready .stage.is-revealed {
  animation: task-progress-stage-reveal 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--reveal-delay, 0ms);
}

.progress-fit-shell.is-data-ready .stage.is-revealed .stage-state-icon {
  animation-name: task-progress-icon-pop;
  animation-duration: 340ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  animation-fill-mode: both;
  animation-delay: calc(var(--reveal-delay, 0ms) + 130ms);
}

.progress-fit-shell.is-data-ready .stage.is-revealed.is-running .stage-state-icon {
  animation-name: task-progress-icon-pop, task-progress-processing;
  animation-duration: 340ms, 1.4s;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1), linear;
  animation-fill-mode: both, none;
  animation-iteration-count: 1, infinite;
  animation-delay: calc(var(--reveal-delay, 0ms) + 130ms), calc(var(--reveal-delay, 0ms) + 470ms);
}

.connector.c1 {
  --prev-delay: var(--stage-delay-1, 0ms);
}
.connector.c2 {
  --prev-delay: var(--stage-delay-2, 0ms);
}
.connector.c3 {
  --prev-delay: var(--stage-delay-3, 0ms);
}

.connector.is-done::before,
.connector.is-failed::before,
.connector.is-running::before {
  clip-path: inset(0 100% 0 0);
}

.progress-fit-shell.is-data-ready .connector.is-done::before,
.progress-fit-shell.is-data-ready .connector.is-failed::before {
  animation: task-progress-connector-fill 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--prev-delay, 0ms);
}

.progress-fit-shell.is-data-ready .connector.is-running::before {
  animation: task-progress-flow 1.4s linear infinite, task-progress-connector-fill 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 0ms, var(--prev-delay, 0ms);
}

.progress-fit-shell:not(.is-data-ready) .connector.is-running::before {
  clip-path: none;
  animation: task-progress-flow 1.4s linear infinite;
}

.connector.is-failed {
  --connector-start: #29c59b;
  --connector-end: #e3574c;
  --connector-arrow: #fff;
  border-color: rgba(227, 87, 76, 0.24);
  background: rgba(227, 87, 76, 0.1);
}

.connector.c1 {
  left: 245px;
}
.connector.c2 {
  left: 494px;
}
.connector.c3 {
  left: 731px;
}
.panel-parse .connector.c1,
.panel-review .connector.c1 {
  left: 200px;
}
.panel-parse .connector.c2,
.panel-review .connector.c2 {
  left: 449px;
}
.panel-parse .connector.c3,
.panel-review .connector.c3 {
  left: 687px;
}
.task-table-wrap {
  position: absolute;
  left: 252px;
  z-index: 3;
  width: 1318px;
  height: 150px;
  overflow: auto;
  border: 1px solid rgba(221, 232, 232, 0.92);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.72);
}

.panel-transcode .task-table-wrap {
  top: 132px;
}
.panel-parse .task-table-wrap,
.panel-review .task-table-wrap {
  top: 115px;
}

.task-table {
  width: 100%;
  min-width: 100%;
  border-spacing: 0;
  border-collapse: separate;
  table-layout: fixed;
  color: #4b5e66;
  font-size: 13px;
  line-height: 18px;
}

.task-table col:nth-child(1) {
  width: 80px;
}
.task-table col:nth-child(2) {
  width: 428px;
}
.task-table col:nth-child(3) {
  width: 270px;
}
.task-table col:nth-child(4) {
  width: 270px;
}
.task-table col:nth-child(5) {
  width: 270px;
}

.task-table th,
.task-table td {
  height: 38px;
  padding: 0 12px;
  overflow: hidden;
  border-right: 1px solid rgba(224, 234, 234, 0.9);
  border-bottom: 1px solid rgba(224, 234, 234, 0.9);
  font-weight: 400;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.task-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 36px;
  color: #33464e;
  font-size: 13px;
  font-weight: 700;
  background: linear-gradient(180deg, rgba(246, 251, 250, 0.98), rgba(249, 252, 252, 0.98));
}

.task-table tr:last-child td {
  border-bottom: 0;
}
.task-table th:last-child,
.task-table td:last-child {
  border-right: 0;
}

.file-cell {
  position: relative;
  padding: 0 8px 0 50px !important;
  text-align: left !important;
}

.file-cell--plain {
  padding-left: 20px !important;
}

.file-icon {
  position: absolute;
  top: 7px;
  left: 17px;
  width: 20px;
  height: 23px;
  object-fit: contain;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--status-ink, #4b5e66);
}

.status::before {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  content: '';
  border-radius: 50%;
  background: var(--status-dot, #cbd5d7);
}

.status.is-waiting {
  --status-dot: #cbd5d7;
  --status-ink: #7e8d93;
}
.status.is-running {
  --status-dot: #1f9dd8;
  --status-ink: #1a7fae;
}
.status.is-done {
  --status-dot: #0ba97d;
  --status-ink: #007553;
}
.status.is-failed {
  --status-dot: #e3574c;
  --status-ink: #c2382d;
}

.status.is-running .status-count {
  animation: task-progress-status-pulse 1.4s ease-in-out infinite;
}

/* Row feedback: status pill shows a small count badge after the reveal. */
.progress-fit-shell.is-data-ready .status .status-count {
  display: inline-grid;
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  background: var(--status-dot, #cbd5d7);
  animation: task-progress-count-rise 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: 720ms;
}

.status .status-count {
  display: none;
}

.empty-row td {
  height: 112px;
  color: #98a6aa;
  text-align: center !important;
}

.loading-mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #087b69;
  font-size: 15px;
  background: rgba(244, 250, 249, 0.7);
  backdrop-filter: blur(1px);
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(11, 169, 125, 0.18);
  border-top-color: #0ba97d;
  border-radius: 50%;
  animation: task-progress-spin 800ms linear infinite;
}

/* Follow DetailModal's fluid content model: the modal owns the viewport while
   panels and dense data regions adapt to the available content box. */
.progress-fit-box {
  min-width: 0;
  min-height: 0;
}

.progress-artboard {
  width: 100%;
  height: 100%;
}

.progress-source-canvas {
  position: relative;
  inset: auto;
  display: grid;
  grid-template-rows: minmax(220px, 1.12fr) repeat(2, minmax(210px, 1fr));
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 16px;
  overflow: auto;
  container-type: inline-size;
  transform: none;
}

.progress-source-canvas::before {
  position: absolute;
  top: 52px;
  bottom: 52px;
  left: 50px;
  z-index: 0;
  width: 2px;
  content: '';
  border-radius: 2px;
  background: linear-gradient(180deg, #0ba97d 0 31%, #d8e5e3 31% 35%, #0ba97d 35% 64%, #d8e5e3 64% 68%, #aebfbc 68% 100%);
}

.task-panel {
  position: relative;
  left: auto;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  grid-template-rows: 92px minmax(112px, 1fr);
  width: 100%;
  min-width: 0;
  min-height: 210px;
}

.task-panel::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 33px;
  z-index: 1;
  width: 2px;
  content: '';
  background: var(--phase-rail, #d8e5e3);
}

.task-panel.is-waiting {
  --phase-color: #a5b4b7;
  --phase-rail: #d8e5e3;
  --phase-soft: rgba(148, 163, 184, 0.16);
}

.task-panel.is-running {
  --phase-color: #1f9dd8;
  --phase-rail: linear-gradient(180deg, #29c59b, #1f9dd8 68%, #d8e5e3 68%);
  --phase-soft: rgba(31, 157, 216, 0.18);
}

.task-panel.is-done {
  --phase-color: #008d69;
  --phase-rail: #0ba97d;
  --phase-soft: rgba(11, 169, 125, 0.17);
}

.task-panel.is-failed {
  --phase-color: #e3574c;
  --phase-rail: linear-gradient(180deg, #0ba97d, #e3574c 68%, #d8e5e3 68%);
  --phase-soft: rgba(227, 87, 76, 0.16);
}

.panel-phase-node {
  position: absolute;
  top: 19px;
  left: 18px;
  z-index: 6;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 2px solid var(--phase-color);
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  background: var(--phase-color);
  box-shadow: 0 4px 10px var(--phase-soft);
}

.task-panel.is-waiting .panel-phase-node {
  color: #6b7c81;
  background: #fff;
}

.task-panel.is-running .panel-phase-node::after {
  position: absolute;
  inset: -7px;
  content: '';
  border: 1px solid var(--phase-color);
  border-radius: 50%;
  animation: task-progress-phase-pulse 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

.task-panel.is-failed .panel-phase-node {
  animation: task-progress-error-settle 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.panel-transcode,
.panel-parse,
.panel-review {
  top: auto;
  height: auto;
}

.task-panel::after {
  left: 220px;
}

.panel-copy {
  position: relative;
  top: auto;
  left: auto;
  grid-column: 1;
  grid-row: 1;
  width: auto;
  padding: 22px 18px 0 20px;
}

.panel-copy h2 {
  margin-left: 46px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
}

.panel-copy h2::before {
  display: none;
}

.panel-copy p {
  margin-left: 46px;
}

.task-panel > .task-visual {
  position: relative;
  top: auto;
  left: auto;
  grid-column: 1;
  grid-row: 2;
  align-self: center;
  justify-self: center;
  width: min(160px, 78%);
  height: min(140px, 92%);
}

.workflow,
.panel-transcode .workflow,
.panel-parse .workflow,
.panel-review .workflow {
  position: relative;
  top: auto;
  left: auto;
  display: grid;
  grid-column: 2;
  grid-row: 1;
  grid-template-columns:
    minmax(118px, 200px) minmax(16px, 1fr)
    minmax(118px, 200px) minmax(16px, 1fr)
    minmax(118px, 200px) minmax(16px, 1fr)
    minmax(118px, 200px);
  align-items: center;
  width: 100%;
  height: auto;
  padding: 10px 18px;
}

.workflow.stage-count-3 {
  grid-template-columns:
    minmax(118px, 200px) minmax(16px, 1fr)
    minmax(118px, 200px) minmax(16px, 1fr)
    minmax(118px, 200px);
}

.stage,
.stage:nth-of-type(1),
.stage:nth-of-type(2),
.stage:nth-of-type(3),
.stage:nth-of-type(4),
.panel-parse .stage:nth-of-type(n),
.panel-review .stage:nth-of-type(n) {
  position: relative;
  top: auto;
  left: auto;
  grid-row: 1;
  width: 100%;
  min-width: 0;
  height: 64px;
}

.stage:nth-of-type(1) {
  grid-column: 1;
}
.stage:nth-of-type(2) {
  grid-column: 3;
}
.stage:nth-of-type(3) {
  grid-column: 5;
}
.stage:nth-of-type(4) {
  grid-column: 7;
}
.stage-number {
  top: 9px;
  left: 10px;
}

.stage-copy {
  right: 25px;
  left: 64px;
}

.stage-state-icon {
  right: 10px;
}

.connector,
.connector.c1,
.connector.c2,
.connector.c3,
.panel-parse .connector.c1,
.panel-parse .connector.c2,
.panel-parse .connector.c3,
.panel-review .connector.c1,
.panel-review .connector.c2,
.panel-review .connector.c3 {
  position: relative;
  top: auto;
  left: auto;
  grid-row: 1;
  width: 100%;
}

.connector.c1 {
  grid-column: 2;
}
.connector.c2 {
  grid-column: 4;
}
.connector.c3 {
  grid-column: 6;
}
.task-table-wrap,
.panel-transcode .task-table-wrap,
.panel-parse .task-table-wrap,
.panel-review .task-table-wrap {
  position: relative;
  top: auto;
  left: auto;
  grid-column: 2;
  grid-row: 2;
  width: calc(100% - 36px);
  height: calc(100% - 14px);
  min-width: 0;
  min-height: 112px;
  margin: 0 18px 14px;
}

.task-table {
  min-width: 720px;
}

.task-table-wrap.is-empty {
  overflow: hidden;
}

.task-table-wrap.is-empty .task-table {
  height: 100%;
  min-width: 0;
}

.task-table-wrap.is-empty .empty-row td {
  height: auto;
}

.task-table col:nth-child(1) {
  width: 7%;
}
.task-table col:nth-child(2) {
  width: 35%;
}
.task-table col:nth-child(3),
.task-table col:nth-child(4) {
  width: 20%;
}
.task-table col:nth-child(5) {
  width: 18%;
}

@container (max-width: 1120px) {
  .task-panel {
    grid-template-columns: 180px minmax(0, 1fr);
  }

  .task-panel::after {
    left: 180px;
  }

  .panel-copy {
    padding-inline: 14px;
  }

  .panel-copy h2 {
    margin-left: 48px;
    font-size: 16px;
  }

  .panel-copy p {
    margin-left: 48px;
    font-size: 13px;
  }

  .task-panel .workflow {
    grid-template-columns: minmax(106px, 1fr) 14px minmax(106px, 1fr) 14px minmax(106px, 1fr) 14px minmax(106px, 1fr);
    padding-inline: 14px;
  }

  .task-panel .workflow.stage-count-3 {
    grid-template-columns: minmax(106px, 1fr) 14px minmax(106px, 1fr) 14px minmax(106px, 1fr);
  }

  .stage-copy {
    right: 22px;
    left: 58px;
  }

  .stage-copy span {
    display: none;
  }

  .stage-copy strong {
    margin-top: 9px;
  }

  .task-table-wrap,
  .panel-transcode .task-table-wrap,
  .panel-parse .task-table-wrap,
  .panel-review .task-table-wrap {
    width: calc(100% - 28px);
    margin-inline: 14px;
  }
}

@container (max-width: 760px) {
  .progress-source-canvas {
    grid-template-rows: repeat(3, minmax(300px, auto));
    padding: 10px;
  }

  .progress-source-canvas::before {
    left: 42px;
  }

  .task-panel {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 68px 82px minmax(128px, 1fr);
    min-height: 300px;
  }

  .task-panel::after {
    top: 68px;
    right: 0;
    bottom: auto;
    left: 0;
    width: auto;
    height: 1px;
  }

  .panel-copy {
    grid-column: 1;
    grid-row: 1;
    padding: 14px 16px;
  }

  .panel-copy h2 {
    margin: 0 0 5px 44px;
  }

  .panel-copy p {
    margin-left: 44px;
    line-height: 18px;
  }

  .panel-copy p br {
    display: none;
  }

  .task-panel > .task-visual {
    display: none;
  }

  .workflow,
  .panel-transcode .workflow,
  .panel-parse .workflow,
  .panel-review .workflow {
    grid-column: 1;
    grid-row: 2;
    grid-template-columns: 128px 20px 128px 20px 128px 20px 128px;
    min-width: 0;
    padding: 9px 12px;
    overflow-x: auto;
  }

  .task-panel .workflow.stage-count-3 {
    grid-template-columns: 128px 20px 128px 20px 128px;
  }

  .task-table-wrap,
  .panel-transcode .task-table-wrap,
  .panel-parse .task-table-wrap,
  .panel-review .task-table-wrap {
    grid-column: 1;
    grid-row: 3;
    width: calc(100% - 24px);
    height: calc(100% - 12px);
    margin: 0 12px 12px;
  }
}

@keyframes task-progress-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes task-progress-processing {
  to {
    transform: rotate(360deg);
  }
}

@keyframes task-progress-flow {
  to {
    background-position: -190% 0;
  }
}

@keyframes task-progress-stage-reveal {
  0% {
    opacity: 0.32;
    transform: translateY(7px) scale(0.975);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes task-progress-icon-pop {
  0% {
    transform: scale(0.3);
  }
  62% {
    transform: scale(1.22);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes task-progress-connector-fill {
  0% {
    clip-path: inset(0 100% 0 0);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes task-progress-count-rise {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes task-progress-phase-pulse {
  0% {
    opacity: 0.65;
    transform: scale(0.82);
  }
  75%,
  100% {
    opacity: 0;
    transform: scale(1.22);
  }
}

@keyframes task-progress-status-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(31, 157, 216, 0.24);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(31, 157, 216, 0);
  }
}

@keyframes task-progress-error-settle {
  0%,
  100% {
    transform: translateX(0);
  }
  35% {
    transform: translateX(-3px);
  }
  68% {
    transform: translateX(2px);
  }
}

@keyframes task-progress-subject-idle {
  0%,
  100% {
    filter: drop-shadow(0 8px 9px rgba(0, 112, 90, 0.1));
    transform: translateY(1px) rotate(-0.25deg) scale(0.995);
  }
  50% {
    filter: drop-shadow(0 12px 12px rgba(0, 112, 90, 0.15));
    transform: translateY(-6px) rotate(0.25deg) scale(1.012);
  }
}

@keyframes task-progress-platform-idle {
  0%,
  100% {
    filter: drop-shadow(0 7px 9px rgba(0, 112, 90, 0.08)) brightness(0.99);
    transform: translateX(-50%) scaleX(0.99) scaleY(0.985);
  }
  50% {
    filter: drop-shadow(0 10px 13px rgba(0, 112, 90, 0.14)) brightness(1.04);
    transform: translateX(-50%) scaleX(1.018) scaleY(1.01);
  }
}

@keyframes task-progress-visual-float {
  0%,
  100% {
    filter: drop-shadow(0 7px 8px rgba(0, 112, 90, 0.09));
    transform: translateY(2px) rotate(-0.5deg) scale(0.99);
  }
  50% {
    filter: drop-shadow(0 13px 12px rgba(0, 112, 90, 0.16));
    transform: translateY(-8px) rotate(0.5deg) scale(1.02);
  }
}

@keyframes task-progress-platform-pulse {
  0%,
  100% {
    filter: drop-shadow(0 7px 9px rgba(0, 112, 90, 0.08)) brightness(0.98);
    transform: translateX(-50%) scale(0.985);
  }
  50% {
    filter: drop-shadow(0 10px 14px rgba(0, 112, 90, 0.16)) brightness(1.06);
    transform: translateX(-50%) scale(1.015);
  }
}

@keyframes task-progress-orbit {
  to {
    transform: rotate(352deg);
  }
}

@keyframes task-progress-orbit-node {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(0.75);
  }
  50% {
    opacity: 1;
    transform: scale(1.35);
  }
}

@keyframes task-progress-visual-scan {
  0%,
  18% {
    opacity: 0;
    transform: translateX(-115px) rotate(18deg);
  }
  38% {
    opacity: 0.7;
  }
  65%,
  100% {
    opacity: 0;
    transform: translateX(155px) rotate(18deg);
  }
}

@keyframes task-progress-visual-arrive {
  0% {
    filter: drop-shadow(0 9px 10px rgba(0, 112, 90, 0.11)) brightness(1.12);
    transform: translateY(-5px) scale(0.97);
  }
  100% {
    filter: drop-shadow(0 9px 10px rgba(0, 112, 90, 0.11)) brightness(1);
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner,
  .stage.is-running .stage-state-icon,
  .stage.is-revealed,
  .stage.is-revealed .stage-state-icon,
  .connector.is-running::before,
  .connector.is-done::before,
  .connector.is-failed::before,
  .status.is-running .status-count,
  .status .status-count::after,
  .task-panel.is-running .panel-phase-node::after,
  .task-panel.is-failed .panel-phase-node,
  .progress-fit-shell.is-data-ready .task-illustration,
  .progress-fit-shell.is-data-ready .task-platform,
  .task-panel.is-running .task-illustration,
  .task-panel.is-running .task-platform,
  .task-panel.is-running .visual-orbit,
  .task-panel.is-running .visual-orbit::before,
  .task-panel.is-running .visual-orbit::after,
  .task-panel.is-running .visual-scan::after,
  .task-panel.is-done .task-illustration {
    animation: none;
  }

  .stage,
  .connector {
    transition: none;
  }
}
</style>
