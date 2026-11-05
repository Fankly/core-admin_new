<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

interface StepProcessingRecord {
  recordId: string
  sequence: number
  processorName: string
  processorRole: string
  processTime: string
  status: string
  comment: string
  isSuggestedProcessor?: boolean
}

interface WorkflowStep {
  id: string
  stageId: string
  stageName: string
  stepName: string
  role: string
  isGeneralOp?: boolean
  note?: string
  isWorkflowApproval?: boolean
  isProcessed?: boolean
  status?: string
  processingRecords?: StepProcessingRecord[]
}

const props = defineProps<{
  projectName?: string
  stages?: any[]
  steps?: any[]
}>()

const emit = defineEmits<{
  (e: 'timeSortChange', orderType: number): void
}>()

const workflowStages = computed(() => props.stages ?? [])
const workflowSteps = computed(() => props.steps ?? [])
const workflowProjectName = computed(() => props.projectName || '2026年电网数字化改造与输变电建设专项工程')

// --- Component State ---
const activeTab = ref<'stage' | 'time'>('stage')
const timeSortOrder = ref<'desc' | 'asc'>('desc')

const expandedStages = ref<Record<string, boolean>>({})
const collapsedSteps = ref<Record<string, boolean>>({})

const mainCardRef = ref<HTMLElement | null>(null)
// 并发锁：onMounted / watch / ResizeObserver 三路触发 locateToProcessingStep 时防止互相覆盖展开状态
const locating = ref(false)
let resizeObserver: ResizeObserver | null = null

// Keep expansion state in sync when workflow data is loaded asynchronously.
watch(
  workflowStages,
  (stages) => {
    const next: Record<string, boolean> = {}
    const keys = Object.keys(stages || {})
    if (keys.length > 0) {
      keys.forEach((key) => {
        // 模板用对象 key 读取展开状态，这里同步用同一 key
        next[key] = expandedStages.value[key] ?? true
      })
      expandedStages.value = next
    }
  },
  { immediate: true, deep: true }
)

watch(
  workflowSteps,
  (steps) => {
    const stepIds = new Set(steps.map((step: any) => step.code))
    collapsedSteps.value = Object.fromEntries(Object.entries(collapsedSteps.value).filter(([stepCode]) => stepIds.has(stepCode)))
  },
  { deep: true }
)

// 定位到第一个「处理中」(status == '2') 的步骤：展开所在环节 + 展开步骤明细 + 滚动到位
const locateToProcessingStep = async () => {
  // 并发锁：运行中直接跳过，避免 onMounted / watch / ResizeObserver 互相覆盖展开状态
  if (locating.value) return
  locating.value = true

  try {
    const stages = workflowStages.value

    if (!stages || (Array.isArray(stages) ? stages.length === 0 : Object.keys(stages).length === 0)) {
      return
    }

    let targetStageKey: string | null = null
    let targetStepCode: string | null = null

    // 兼容两种数据结构：对象 { 环节名: [步骤数组] } 或数组 [环节对象]
    const entries: Array<[string, any]> = Array.isArray(stages) ? stages.map((item: any, idx: number) => [String(idx), item]) : Object.entries(stages)

    for (const [key, steps] of entries) {
      // steps 可能是数组（直接是步骤列表）或对象（需取 .steps 或 .children）
      const stepList: any[] = Array.isArray(steps) ? steps : steps?.steps ?? steps?.children ?? steps?.list ?? []
      if (stepList.length === 0) continue

      const processing = stepList.find((st: any) => st.status == '2')
      if (processing) {
        targetStageKey = key
        targetStepCode = processing.code
        break
      }
    }

    // 没有处理中的步骤则不做定位
    if (targetStageKey === null || targetStepCode === null) return

    // 展开目标环节、展开目标步骤明细
    expandedStages.value[targetStageKey] = true
    collapsedSteps.value[targetStepCode] = false

    // 等待 v-if 渲染出 DOM，再用 querySelector 定位元素滚动
    await nextTick()
    await nextTick()

    // 找最近的可滚动祖先（.stage-view-content 或外层宿主滚动容器）
    const findScrollContainer = (el: HTMLElement): HTMLElement | null => {
      let node: HTMLElement | null = el.parentElement
      while (node) {
        const style = getComputedStyle(node)
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
          return node
        }
        node = node.parentElement
      }
      return null
    }

    // 累加 offsetTop 至滚动容器内部，得到目标元素相对容器的偏移
    const getOffsetTopWithin = (el: HTMLElement, container: HTMLElement): number => {
      let offset = 0
      let node: HTMLElement | null = el
      while (node && node !== container) {
        offset += node.offsetTop
        node = node.offsetParent as HTMLElement | null
      }
      return offset
    }

    // 轮询等待目标元素出现：异步组件首次挂载时 DOM 可能延迟 commit，需更长重试窗口
    const MAX_RETRY = 60
    let retryCount = 0

    const tryScroll = () => {
      retryCount++
      const el = document.querySelector<HTMLElement>(`[data-step-code="${targetStepCode}"]`)
      if (!el) {
        if (retryCount < MAX_RETRY) requestAnimationFrame(tryScroll)
        return
      }

      // 元素已出现：再等一帧让滚动容器 scrollHeight 稳定
      requestAnimationFrame(() => {
        const container = findScrollContainer(el)
        if (container) {
          // 直接计算偏移并设置容器 scrollTop，避免 scrollIntoView 连带滚动外层祖先
          const offsetTop = getOffsetTopWithin(el, container)
          const target = Math.max(0, offsetTop - (container.clientHeight - el.offsetHeight) / 2)
          container.scrollTo({ top: target, behavior: 'smooth' })
        } else {
          // 无可滚动祖先时退化为 scrollIntoView
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }
    requestAnimationFrame(tryScroll)
  } finally {
    // 锁在 rAF 链异步进行中即释放？不——锁需覆盖整个 rAF 轮询窗口，否则 watch 可能在轮询中插入
    // 但 rAF 轮询无法用 await；这里用 setTimeout 在合理窗口后释放
    setTimeout(() => {
      locating.value = false
    }, 1200)
  }
}

// 切换到「按环节展示」并定位到处理中步骤
const switchToStageView = async () => {
  activeTab.value = 'stage'
  await nextTick()
  await locateToProcessingStep()
}

// 组件挂载后定位（父组件在 loading=false 后才渲染本组件，数据已就绪）
// 两轮 nextTick：第一轮让 expandedStages 的 immediate watch 同步 + stage body v-if 渲染，
// 第二轮让内层步骤明细 v-if 渲染，再交给 locateToProcessingStep 内部的 rAF 轮询兜底
// 另用 ResizeObserver 观察 .main-card：当容器从 0 尺寸（display:none / 弹窗动画中）变为非 0（显式）时，
// 自动重新定位——覆盖 el-tabs 切换到本 tab 与 vxe-modal 打开动画结束两类场景，无需父级钩子
onMounted(() => {
  nextTick()
    .then(() => nextTick())
    .then(() => locateToProcessingStep())

  // 布局就绪自愈：尺寸从 0 → 非 0 时，组件刚从隐藏变为可见，重新定位
  if (mainCardRef.value && typeof ResizeObserver !== 'undefined') {
    let prevW = mainCardRef.value.clientWidth
    let prevH = mainCardRef.value.clientHeight
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const w = entry.contentRect.width
      const h = entry.contentRect.height
      // 仅在「从无到有」时触发，避免运行中尺寸微抖动反复定位
      const wasHidden = (prevW === 0 || prevH === 0) && w > 0 && h > 0
      prevW = w
      prevH = h
      if (wasHidden && activeTab.value === 'stage') {
        nextTick().then(() => locateToProcessingStep())
      }
    })
    resizeObserver.observe(mainCardRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 数据变化后自动定位到处理中步骤
watch(
  [workflowStages, workflowSteps],
  async () => {
    if (activeTab.value === 'stage') {
      await nextTick()
      await locateToProcessingStep()
    }
  },
  { deep: true }
)

// --- Methods ---
const toggleStage = (stageId: any) => {
  expandedStages.value[stageId] = !expandedStages.value[stageId]
}

const toggleStep = (stepCode: string) => {
  collapsedSteps.value[stepCode] = !collapsedSteps.value[stepCode]
}

const expandAllMerged = () => {
  const allExp: Record<string, boolean> = {}
  Object.keys(workflowStages.value || {}).forEach((key) => {
    allExp[key] = true
  })
  expandedStages.value = allExp
  collapsedSteps.value = {}
}

const collapseAllMerged = () => {
  const allCol: Record<string, boolean> = {}
  Object.keys(workflowStages.value || {}).forEach((key) => {
    allCol[key] = false
  })
  expandedStages.value = allCol

  const allStepCol: Record<string, boolean> = {}
  workflowSteps.value.forEach((st) => {
    allStepCol[st.id] = true
  })
  collapsedSteps.value = allStepCol
}

// 根据步骤状态返回节点按钮的状态类名：已处理=主题绿、处理中=橙色、未处理=灰色
const getStepNodeStatusClass = (status: any): string => {
  if (status == '1') return 'status-processed'
  if (status == '2') return 'status-processing'
  return 'status-pending'
}

const getStepProcessingRecords = (step: any): any[] => {
  let processingRecords: any[] = []
  processingRecords = step.reviewInfoLists ?? step.mainOpLogs ?? step.lcLists ?? []
  return processingRecords
}

// 大环节起止时间展示：遍历环节下所有步骤的全部处理记录，取 reviewTime 最小值 ~ 最大值；
// 若一条时间记录都没有，返回「未开始」
const getStageTimeDisplay = (steps: any[]): string => {
  if (!steps || steps.length === 0) return ''

  const times: string[] = []
  steps.forEach((step: any) => {
    const recs = getStepProcessingRecords(step)
    if (!recs || typeof recs !== 'object') return
    Object.keys(recs).forEach((key) => {
      const arr = recs[key]
      if (!Array.isArray(arr)) return
      arr.forEach((r: any) => {
        const t = r?.reviewTime
        if (t) times.push(t)
      })
    })
  })

  if (times.length === 0) return '未开始'
  // reviewTime 形如 "YYYY-MM-DD HH:mm:ss"，字典序即时间序
  times.sort()
  return `${times[0]} ~ ${times.length == 1 ? '--' : times[times.length - 1]}`
}

// --- Computed ---
const stepsByStageMap = computed(() => {
  const map: Record<string, WorkflowStep[]> = {}
  workflowStages.value.forEach((s) => {
    map[s.id] = workflowSteps.value.filter((st) => st.stageId === s.id)
  })
  return map
})

const allTimeRecords = computed(() => {
  const list: Array<
    StepProcessingRecord & {
      stepCode: string
      stepName: string
      stageId: string
      stageName: string
    }
  > = []

  workflowSteps.value.forEach((step: any) => {
    const records = getStepProcessingRecords(step)
    if (records.length > 0) {
      records.forEach((r) => {
        list.push({
          ...r,
          stepCode: step.code,
          groupName: step.groupName,
          groupCode: step.groupCode,
          stageName: step.stageName
        })
      })
    }
  })
  return list
})

// 切换时间排序方向并通知父组件重新查询接口：desc→orderType=2，asc→orderType=1
const handleTimeSortToggle = () => {
  timeSortOrder.value = timeSortOrder.value === 'desc' ? 'asc' : 'desc'
  const orderType = timeSortOrder.value === 'desc' ? 2 : 1
  emit('timeSortChange', orderType)
}

const totalStages = (val: any[]) => {
  return (val || []).length
}
const processedStages = (val: any[]) => {
  return (val || []).filter((st: any) => st.status == '1').length
}
const waritingStages = (val: any[]) => {
  return (val || []).filter((st: any) => st.status == '2').length
}

const classType = (value: any[]) => {
  return waritingStages(value) > 0 ? 'wariting' : processedStages(value) === totalStages(value) ? 'processed' : 'pending'
}

const nameJoin = (list: any[]) => {
  const nameList = list.map((item: any) => item.expertName)
  return nameList.join(',')
}
</script>

<template>
  <!-- Main Container Card -->
  <div ref="mainCardRef" class="main-card">
    <!-- Header Bar -->
    <div class="header-bar">
      <div class="project-title-group">
        <div class="icon-badge">
          <svg class="svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6.429 9.75L2.25 12l10 5.25 10-5.25-4.179-2.25M6.429 14.25L2.25 16.5l10 5.25 10-5.25-4.179-2.25M12 3L2.25 7.5 12 12l9.75-4.5L12 3z"
            />
          </svg>
        </div>
        <h3 class="project-title">{{ workflowProjectName }}</h3>
      </div>

      <div class="header-controls">
        <!-- View Switcher -->
        <div class="tab-switcher">
          <button @click="switchToStageView" :class="['tab-btn', { active: activeTab === 'stage' }]">
            <svg class="svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.429 9.75L2.25 12l10 5.25 10-5.25-4.179-2.25M6.429 14.25L2.25 16.5l10 5.25 10-5.25-4.179-2.25M12 3L2.25 7.5 12 12l9.75-4.5L12 3z"
              />
            </svg>
            <span>按环节展示</span>
          </button>
          <button @click="activeTab = 'time'" :class="['tab-btn', { active: activeTab === 'time' }]">
            <svg class="svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
            <span>按时间展示</span>
          </button>
        </div>

        <!-- Actions -->
        <div v-if="activeTab === 'stage'" class="action-buttons">
          <button @click="expandAllMerged" class="action-btn">
            <svg class="svg-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15m-11.25 5.25v-4.5m0 4.5h4.5m-4.5 0L9 15"
              />
            </svg>
            <span>全部展开</span>
          </button>
          <button @click="collapseAllMerged" class="action-btn">
            <svg class="svg-icon gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9V4.5M15 9h4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25"
              />
            </svg>
            <span>全部收起</span>
          </button>
        </div>

        <button v-else @click="handleTimeSortToggle" class="action-btn">
          <svg class="svg-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
          <span>时间排序：{{ timeSortOrder === 'desc' ? '最新在前 (降序)' : '最早在前 (升序)' }}</span>
        </button>
      </div>
    </div>

    <!-- View Content: Stage View -->
    <div v-if="activeTab === 'stage'" class="stage-view-content">
      <div class="outer-timeline">
        <div v-for="(value, key) in workflowStages" :key="key" class="stage-card">
          <!-- Stage Toggle Node Button directly on Left Timeline Line -->
          <button
            @click.stop="toggleStage(key)"
            :class="['node-btn stage-node-btn', classType(value), { active: expandedStages[key] }]"
            :title="expandedStages[key] ? '点击收起当前环节' : '点击展开当前环节'"
          >
            <svg v-if="expandedStages[key]" class="node-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
            </svg>
            <svg v-else class="node-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          <!-- Stage Header Accordion -->
          <div @click="toggleStage(key)" class="stage-header">
            <div class="stage-header-left">
              <div class="folder-icon-wrap" :class="[classType(value)]">
                <svg v-if="expandedStages[key]" class="svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.75 9.75A1.5 1.5 0 015.25 8.25h4.379a1.5 1.5 0 011.06.44l1.32 1.32a1.5 1.5 0 001.06.44h5.18a1.5 1.5 0 011.5 1.5v6.75a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V9.75z"
                  />
                </svg>
                <svg v-else class="svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 004.5 15h15a2.25 2.25 0 002.25-2.25m-19.5 0v.243a2.25 2.25 0 001.07 1.916l7.5 4.615a2.25 2.25 0 002.36 0l7.5-4.615a2.25 2.25 0 001.07-1.916V12.75"
                  />
                </svg>
              </div>

              <div class="stage-info">
                <h4 class="stage-name">{{ key }}</h4>
                <span class="stage-time">{{ getStageTimeDisplay(value) }}</span>
                <p class="stage-desc">{{ value[0].remark || '' }}</p>
              </div>
            </div>

            <div class="stage-header-right">
              <span class="badge gray">共 {{ totalStages(value) }} 项步骤</span>
              <span class="badge" :class="[classType(value)]"> 处理进度 {{ processedStages(value) }} / {{ totalStages(value) }} </span>
            </div>
          </div>

          <!-- Stage Body Steps -->
          <div v-if="expandedStages[key]" class="stage-body">
            <div v-if="(value || []).length === 0" class="empty-steps"> 暂无处理步骤 </div>

            <div v-else class="inner-timeline">
              <div
                v-for="step in value"
                :key="step.code"
                :data-step-code="step.code"
                :class="['step-card', { 'step-processing': step.status == '2' }]"
              >
                <!-- Step Toggle Node Button -->
                <button
                  @click.stop="toggleStep(step.code)"
                  :class="['node-btn step-node-btn', getStepNodeStatusClass(step.status), { active: !collapsedSteps[step.code] }]"
                  :title="collapsedSteps[step.code] ? '点击展开步骤明细' : '点击收起步骤明细'"
                >
                  <svg v-if="!collapsedSteps[step.code]" class="node-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
                  </svg>
                  <svg v-else class="node-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>

                <!-- Step Header -->
                <div @click="toggleStep(step.code)" class="step-header">
                  <div class="step-header-left">
                    <h5 class="step-name">{{ step.name }}</h5>

                    <span class="badge role-badge" :class="[step.status === '1' ? 'processed' : step.status === '2' ? 'wariting' : 'pending']">
                      <svg class="mini-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                      <span>责任角色: {{ step.operationRole }}</span>
                    </span>

                    <span v-if="step.status == '1'" class="badge processed-badge">
                      <svg class="mini-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>已处理</span>
                    </span>
                    <span v-else-if="step.status == '2'" class="badge wariting-badge">
                      <svg class="mini-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>处理中</span>
                    </span>
                    <span v-else class="badge pending-badge">
                      <svg class="mini-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 9.75v4.5m-6-4.5v4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>未处理</span>
                    </span>
                  </div>
                </div>

                <!-- Step Records -->
                <div v-if="!collapsedSteps[step.code]" class="step-records-wrap animate-fadeIn">
                  <div class="records-title">
                    <svg
                      :class="['mini-icon', step.status === '1' ? 'teal' : step.status === '2' ? 'wariting-icon' : 'pending-icon']"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                    <span v-if="getStepProcessingRecords(step).length == 0">暂无处理记录</span>
                    <span v-else>
                      {{ step.status == '3' ? `建议处理信息` : `共${Object.keys(getStepProcessingRecords(step)).length}次处理记录` }}</span
                    >
                  </div>
                  <div v-if="Object.keys(getStepProcessingRecords(step)).length > 0" class="records-list">
                    <div v-for="(value1, key1) in getStepProcessingRecords(step)" :key="key1" class="record-row">
                      <div class="record-row-title" v-if="step.status !== '3'">
                        {{ `第${key1}次处理记录` }}{{ value1.length > 0 ? `（共 ${value1.length} 条明细）` : '（暂无明细）' }}
                      </div>
                      <div class="record-row-body" v-if="step.status !== '3'">
                        <template v-for="(item, index) in value1" :key="index">
                          <div class="record-cols">
                            <!-- Field 1: Processor Name -->
                            <div class="record-col col-processor">
                              <div class="col-label">
                                <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                  />
                                </svg>
                                <span>{{ '处理人' }}</span>
                              </div>
                              <div class="col-val bold">{{ item.expertName }}</div>
                            </div>

                            <!-- Field 2: Process Time -->
                            <div class="record-col col-time">
                              <div class="col-label">
                                <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>处理时间</span>
                              </div>
                              <div class="col-val">{{ item.reviewTime || '-' }}</div>
                            </div>

                            <!-- Field 3: Comment / Opinion -->
                            <div class="record-col col-comment">
                              <div class="col-label">
                                <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                                  />
                                </svg>
                                <span>处理意见 / 说明</span>
                              </div>
                              <div class="col-val comment-box" v-if="step.operationType != '1'">
                                <div>
                                  <strong>处理意见：</strong>
                                  <span>{{ item.reviewOpinion || '-' }}</span> <br />
                                </div>
                                <div>
                                  <strong>处理说明：</strong>
                                  <span>{{ item.reason || '-' }}</span>
                                </div>
                              </div>
                              <div class="col-val comment-boxOne" v-else>
                                <span>{{ step.opeartionDes || '-' }}</span> <br />
                              </div>
                            </div>
                            <!-- Field 4: Status -->
                            <div class="record-col col-status">
                              <div class="col-label">
                                <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                  />
                                </svg>
                                <span>处理状态</span>
                              </div>
                              <div class="col-val">
                                <span :class="['status-chip', step.status === '1' ? 'processed' : step.status === '2' ? 'wariting' : 'pending']">
                                  {{ step.status === '1' ? '已处理' : step.status === '2' ? '处理中' : '未处理' }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </template>
                      </div>
                      <div class="record-row-body" v-else>
                        <div class="record-cols">
                          <!-- Field 1: Processor Name -->
                          <div class="record-col col-processor">
                            <div class="col-label">
                              <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                                />
                              </svg>
                              <span>{{ '处理人' }}</span>
                            </div>
                            <div class="col-val bold comment-box1">{{ nameJoin(value1) }}</div>
                          </div>

                          <!-- Field 2: Process Time -->
                          <div class="record-col col-time">
                            <div class="col-label">
                              <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>处理时间</span>
                            </div>
                            <div class="col-val">{{ '-' }}</div>
                          </div>

                          <!-- Field 3: Comment / Opinion -->
                          <div class="record-col col-comment">
                            <div class="col-label">
                              <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                                />
                              </svg>
                              <span>处理意见 / 说明</span>
                            </div>
                            <div class="col-val comment-box" v-if="step.operationType != '1'">
                              <div>
                                <strong>处理意见：</strong>
                                <span>{{ '-' }}</span> <br />
                              </div>
                              <div>
                                <strong>处理说明：</strong>
                                <span>{{ '-' }}</span>
                              </div>
                            </div>
                            <div class="col-val comment-box" v-else>
                              <span>{{ step.opeartionDes || '-' }}</span> <br />
                            </div>
                          </div>
                          <!-- Field 4: Status -->
                          <div class="record-col col-status">
                            <div class="col-label">
                              <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                                />
                              </svg>
                              <span>处理状态</span>
                            </div>
                            <div class="col-val">
                              <span :class="['status-chip', step.status === '1' ? 'processed' : step.status === '2' ? 'wariting' : 'pending']">
                                {{ step.status === '1' ? '已处理' : step.status === '2' ? '处理中' : '未处理' }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Content: Time View -->
    <div v-else class="time-view-content">
      <div v-if="workflowSteps.length === 0" class="empty-time-view"> 暂无时间处理记录 </div>

      <div v-else class="time-timeline">
        <div v-for="(rec, idx) in workflowSteps" :key="idx" class="time-item">
          <!-- Timeline Pin Circle -->
          <div :class="['time-pin', getStepNodeStatusClass(rec.status)]">{{ idx + 1 }}</div>

          <!-- Time Card Header -->
          <div class="time-card">
            <div class="time-card-header">
              <div class="time-header-left">
                <span :class="['status-chip', rec.status === '1' ? 'processed' : rec.status === '2' ? 'wariting' : 'pending']">
                  <svg class="mini-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ rec.reviewTime || '未发生' }}</span>
                </span>

                <span class="badge stage-badge">
                  <svg class="mini-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 004.5 15h15a2.25 2.25 0 002.25-2.25m-19.5 0v.243a2.25 2.25 0 001.07 1.916l7.5 4.615a2.25 2.25 0 002.36 0l7.5-4.615a2.25 2.25 0 001.07-1.916V12.75"
                    />
                  </svg>
                  <span>{{ rec.groupName }}</span>
                </span>

                <h5 class="time-step-name">{{ rec.name }}</h5>

                <span class="badge role-badge">
                  <svg class="mini-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <span>{{ rec.operationRole }}</span>
                </span>
              </div>

              <span :class="['status-chip', rec.status === '1' ? 'processed' : rec.status === '2' ? 'wariting' : 'pending']">
                {{ rec.status === '1' ? '已处理' : rec.status === '2' ? '处理中' : '未处理' }}
              </span>
            </div>

            <!-- Time Card Body (4 Fields) -->
            <div class="time-card-body">
              <div class="record-row1 flex-nowrap">
                <!-- Field 1: Processor -->
                <div class="record-col col-processor">
                  <div class="col-label">
                    <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                    <span>{{ '处理人' }}</span>
                  </div>
                  <div class="col-val bold">{{ rec.userName }}</div>
                </div>

                <!-- Field 2: Stage & Step -->
                <div class="record-col col-time">
                  <div class="col-label">
                    <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6.429 9.75L2.25 12l10 5.25 10-5.25-4.179-2.25M6.429 14.25L2.25 16.5l10 5.25 10-5.25-4.179-2.25M12 3L2.25 7.5 12 12l9.75-4.5L12 3z"
                      />
                    </svg>
                    <span>处理时间</span>
                  </div>
                  <div class="col-val">{{ rec.reviewTime || '-' }}</div>
                </div>

                <!-- Field 3: Comment -->
                <div class="record-col col-comment">
                  <div class="col-label">
                    <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                      />
                    </svg>
                    <span>处理意见 / 说明</span>
                  </div>
                  <div class="col-val comment-box" v-if="rec.operationType != '1'">
                    <div>
                      <strong>处理意见：</strong>
                      <span>{{ rec.reviewOpinion || '-' }}</span> <br />
                    </div>
                    <div>
                      <strong>处理说明：</strong>
                      <span>{{ rec.reason || '-' }}</span>
                    </div>
                  </div>
                  <div class="col-val comment-box" v-else>
                    <span>{{ rec.opeartionDes || '-' }}</span> <br />
                  </div>
                </div>

                <!-- Field 4: Status -->
                <div class="record-col col-status">
                  <div class="col-label">
                    <svg class="mini-icon teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                      />
                    </svg>
                    <span>处理状态</span>
                  </div>
                  <div class="col-val">
                    <span :class="['status-chip', rec.status === '1' ? 'processed' : rec.status === '2' ? 'wariting' : 'pending']">
                      {{ rec.status === '1' ? '已处理' : rec.status === '2' ? '处理中' : '未处理' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import './css/WorkflowTreeView.less';
</style>
