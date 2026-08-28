<template>
  <vxe-modal
    :model-value="modal.visible"
    :destroy-on-close="true"
    :loading="modal.loading"
    :show-footer="false"
    show-zoom
    fullscreen
    resize
    position="center"
    width="90%"
    height="760"
    title="项目详情"
    class-name="smart-task-audit-detail-modal"
    @close="$emit('close')"
  >
    <div class="audit-detail-page" :class="{ 'audit-detail-page--motion-paused': isUnderlayMotionPaused }">
      <section class="audit-detail-column">
        <div class="audit-detail-title">
          <FolderKanban class="audit-detail-title__icon" :stroke-width="2" aria-hidden="true" />
          <h2>项目基本信息</h2>
        </div>
        <div v-loading="projectLoading" class="audit-panel audit-panel--scroll" :class="{ 'audit-panel--scroll-bg': isFirstProjectTab }">
          <div v-if="formConfigs.length" class="project-tabs" :class="{ 'project-tabs--scrollable': projectTabsScrollable }">
            <button
              type="button"
              class="project-tabs__nav project-tabs__nav--prev"
              :disabled="!canScrollProjectTabsPrev"
              aria-label="向左查看页签"
              @click="scrollProjectTabs('prev')"
            >
              <ChevronLeft class="project-tabs__nav-icon" :stroke-width="2.5" aria-hidden="true" />
            </button>
            <div ref="projectTabsTrackRef" class="project-tabs__track" @scroll.passive="updateProjectTabsScrollState">
              <button
                v-for="formItem in formConfigs"
                :key="formItem.stepId"
                type="button"
                class="audit-tab-btn"
                :class="{ active: tabName === formItem.stepId }"
                @click="tabName = formItem.stepId"
              >
                {{ formItem.stepName }}
              </button>
            </div>
            <button
              type="button"
              class="project-tabs__nav project-tabs__nav--next"
              :disabled="!canScrollProjectTabsNext"
              aria-label="向右查看页签"
              @click="scrollProjectTabs('next')"
            >
              <ChevronRight class="project-tabs__nav-icon" :stroke-width="2.5" aria-hidden="true" />
            </button>
          </div>

          <div class="project-form">
            <template v-if="formConfigs.length">
              <!-- 仅挂载当前页签，避免多步骤 DynamicForm/异步组件常驻撑爆内存 -->
              <template v-for="formItem in formConfigs" :key="formItem.stepId">
                <div v-if="tabName === formItem.stepId" class="project-form__pane">
                  <div v-if="formItem.path" class="project-comp">
                    <component
                      :is="formItem.path"
                      :globalParams="globalParams"
                      :initialData="formItem.data"
                      :opType="'VIEW'"
                      :selectData="projectSelectData"
                      v-bind="getProjectComponentExtraProps(formItem)"
                    ></component>
                  </div>
                  <DynamicForm
                    v-else
                    :selectData="projectSelectData"
                    :customParam="{}"
                    :isChange="isChange"
                    :globalParams="globalParams"
                    op-type="VIEW"
                    :userInfo="resolvedProjectUserInfo"
                    :attach-type="projectInfoApi"
                    :fields="formItem.fields"
                    :form-config="formItem.config"
                    :initial-data="formItem.data"
                    :show-actions="false"
                  ></DynamicForm>
                </div>
              </template>
            </template>
            <div v-else class="project-empty">{{ projectEmptyText }}</div>
          </div>
        </div>
      </section>

      <section class="audit-detail-column audit-detail-column--review">
        <div v-loading="auditLoading" class="audit-review-stack">
          <div class="audit-review-hero">
            <div class="audit-detail-title audit-detail-title--review">
              <ChartNoAxesCombined class="audit-detail-title__icon" :stroke-width="2" aria-hidden="true" />
              <h2>AI 智能评审</h2>
            </div>
            <div class="audit-summary">
              <div class="audit-summary__content">
                <div class="audit-summary__header">
                  <div class="audit-summary__title">AI评审总体结论</div>
                  <div v-if="auditSummaryStatusText" :class="['audit-summary__review', `audit-summary__review--${auditSummaryReviewTone}`]">
                    <component :is="auditSummaryStatusIcon" class="audit-summary__review-icon" :stroke-width="2" aria-hidden="true" />
                    {{ auditSummaryStatusText }}
                  </div>
                </div>
                <div class="audit-summary__desc">
                  <span v-if="auditSummaryError" class="audit-summary__error" role="alert">{{ auditSummaryError }}</span>
                  <ReText class="audit-summary__conclude">
                    <TypewriterText :text="auditSummaryConclude" :animate="false" />
                  </ReText>
                </div>
                <div class="audit-summary-metrics" aria-label="风险等级合计">
                  <div v-for="item in auditSummaryItems" :key="item.key" :class="['audit-summary-metric', `audit-summary-metric--${item.tone}`]">
                    <component :is="item.icon" class="audit-summary-metric__icon" :stroke-width="2" aria-hidden="true" />
                    <span class="audit-summary-metric__label">{{ item.label }}</span>
                    <span class="audit-summary-metric__count">
                      {{ item.count }}
                      <span class="audit-summary-metric__unit">个</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="audit-summary__visual" aria-hidden="true">
              <picture class="audit-summary__cube">
                <source :srcset="aiCubeTransparentWebp" type="image/webp" />
                <img :src="aiCubeTransparentPng" alt="" />
              </picture>
            </div>
            <div v-if="auditTabs.length" class="audit-tabs" :class="{ 'audit-tabs--scrollable': auditTabsScrollable }">
              <button
                type="button"
                class="audit-tabs__nav audit-tabs__nav--prev"
                :disabled="!canScrollAuditTabsPrev"
                aria-label="向左查看评审页签"
                @click="scrollAuditTabs('prev')"
              >
                <ChevronLeft class="audit-tabs__nav-icon" :stroke-width="2.5" aria-hidden="true" />
              </button>
              <div ref="auditTabsTrackRef" class="audit-tabs__track" @scroll.passive="updateAuditTabsScrollState">
                <button
                  v-for="tab in auditTabs"
                  :key="tab.code"
                  type="button"
                  class="audit-tabs__tab"
                  :class="{ active: activeAuditTab === tab.code }"
                  :title="tab.name"
                  @click="switchAuditTab(tab.code)"
                >
                  <span class="audit-tab__name">
                    <span class="audit-tab__label">{{ tab.name }}</span>
                    <span v-if="getAuditTabFailedCount(tab)" class="audit-tab__badge">{{ getAuditTabFailedCount(tab) }}</span>
                  </span>
                </button>
              </div>
              <button
                type="button"
                class="audit-tabs__nav audit-tabs__nav--next"
                :disabled="!canScrollAuditTabsNext"
                aria-label="向右查看评审页签"
                @click="scrollAuditTabs('next')"
              >
                <ChevronRight class="audit-tabs__nav-icon" :stroke-width="2.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div class="audit-panel audit-review-panel">
            <AuditRuleList :items="auditItems" :empty-text="auditEmptyText" @detail="openAuditDetailModal" />
          </div>
        </div>
      </section>
    </div>
  </vxe-modal>

  <RuleReviewDetailModal
    :visible="isOpenRuleReview"
    :item="activeAuditDetailItem"
    :loading="activeAuditDetailLoading"
    :rerunning="activeAuditDetailRerunning"
    :ready="activeAuditDetailReady"
    :can-rerun="canRerun"
    :previewing="auditPreviewPreparing"
    :typewriter-animate="auditTypewriterAnimate"
    :conclude-persist-key="activeAuditDetailConcludePersistKey"
    :process-persist-key="activeAuditDetailProcessPersistKey"
    @close="closeAuditDetailModal"
    @preview="openAuditFilePreview"
    @rerun="rerunActiveAuditRule"
  />
  <xsxReviewDetailModal
    :visible="isOpenXsxReview"
    :item="activeAuditDetailItem"
    :loading="activeAuditDetailLoading"
    :rerunning="activeAuditDetailRerunning"
    :ready="activeAuditDetailReady"
    :can-rerun="canRerun"
    :previewing="auditPreviewPreparing"
    :typewriter-animate="auditTypewriterAnimate"
    :display-mode="activeAuditDetailDisplayMode"
    :conclude-persist-key="activeAuditDetailConcludePersistKey"
    :process-persist-key="activeAuditDetailProcessPersistKey"
    @close="closeAuditDetailModal"
    @preview="openAuditFilePreview"
    @rerun="rerunActiveAuditRule"
  />

  <AuditFilePreviewModal
    :visible="auditFilePreviewVisible"
    :files="auditPreviewFiles"
    :active-key="activeAuditPreviewKey"
    @close="closeAuditFilePreview"
  />
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, inject, markRaw, nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  BadgeCheck,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  FolderKanban,
  Info,
  Siren
} from 'lucide-vue-next'
import type { Component, PropType, Ref } from 'vue'
import { getPublicData } from '@/api/common'
import { getRuleReview, getRuleReviewInfo, getXmAuditConclude, listAttach, redoAuditRule } from '@/api/ai/smartTaskAudit'
import type { RuleReviewInfo, TXmAttach } from '@/api/ai/smartTaskAudit'
import { pageGetXmInfo } from '@/api/service/jointReview'
import { getTabColumns, getXmInfo } from '@/api/service/requirement'
import DynamicForm from '@/components/DynamicForm/index.vue'
import ReText from '@/components/ReText/src/index.vue'
import baseService from '@/service/baseService'
import AuditFilePreviewModal from './AuditFilePreviewModal.vue'
import AuditRuleList from './AuditRuleList.vue'
import TypewriterText from './TypewriterText.vue'
import RuleReviewDetailModal from './RuleReviewDetailModal.vue'
import xsxReviewDetailModal from './xsxReviewDetailModal.vue'
import { getAuditPreviewFileKey, isSupportedAuditPreviewFile, resolveAuditPreviewTarget, UNSUPPORTED_AUDIT_PREVIEW_TIP } from './auditFilePreview'
import {
  auditSummaryLevelConfigs,
  auditSummaryRuleLevelAliasMap,
  createRerunPollContext,
  hasRerunPollExpired,
  isRuleReviewDetailComplete,
  isSameRerunPollContext,
  normalizeAuditSummaryData,
  normalizeRuleReviewDetail
} from './auditDetailHelpers'
import type { RuleReviewDetailItem } from './auditDetailHelpers'
import { normalizeOptionList } from '../utils'
import type { ModalState, OptionItem, SmartTaskAuditRow } from '../types'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { AIRiskLevelDict } from '@/staticDict/index.js'
import aiCubeTransparentWebp from '@/assets/images/smart-review/ai-cube-transparent.webp'
import aiCubeTransparentPng from '@/assets/images/smart-review/ai-cube-transparent.png'

interface ProjectFormConfig {
  stepId: string | number
  stepName: string
  stepType: string
  stepEnname: string
  fields: any[]
  config: {
    labelWidth: string
    labelPosition: string
    gutter: number
    colsPerRow: number
  }
  data: Record<string, any>
  path?: any
}

type AuditTab = Pick<OptionItem, 'code' | 'name'>
type AuditStatus = 'passed' | 'pending' | 'failed' | ''
type TypewriterField = 'conclude' | 'process'
type AuditRuleItem = RuleReviewDetailItem
interface AuditReviewItem {
  code?: string | number
  id?: string | number
  name?: string
  type?: string
  [key: string]: any
}
interface AuditSummaryItem {
  key: string | number
  label: string
  count: number | string
  tone: 'danger' | 'warning' | 'primary'
  icon: Component
}
interface AuditSummaryRecord {
  findNum?: number | string
  ruleLevel?: string | number
  ruleLevelName?: string
}
const props = defineProps({
  modal: {
    type: Object as PropType<ModalState>,
    required: true
  },
  detailRow: {
    type: Object as PropType<SmartTaskAuditRow>,
    default: () => ({})
  },
  reviewOpinions: {
    type: String,
    default: ''
  },
  projectInfoApi: {
    type: String,
    default: ''
  },
  userInfo: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({})
  },
  /** 规则详情是否展示「重新分析」，默认开启 */
  canRerun: {
    type: Boolean,
    default: true
  }
})

const getRuleReviewParams = (taskId: string, ruleClassify: string) => {
  return {
    taskId,
    ruleClassify,
    reviewOpinions: props.reviewOpinions.trim()
  }
}

defineEmits(['close'])

const currentUserRole = inject<Ref<UserRole>>('currentUserRole')

const assetGssdbDetailsLoader = () => import('@/views/service/xq/components/AssetgssdbDetails.vue')
const xmbgxxLoader = () => import('@/views/service/xq/components/xmbgxx.vue')
const assetDdqdDetailsLoader = () => import('@/views/service/xq/components/AssetDdqdDetails.vue')

const componentMap: Record<string, () => Promise<any>> = {
  AssetDetails: () => import('@/views/service/xq/components/AssetDetails.vue'),
  ProjectScale: () => import('@/views/service/xq/components/ProjectScale.vue'),
  AssetYfDetails: () => import('@/views/service/xq/components/AssetYfDetails.vue'),
  AssetZwyfDetails: () => import('@/views/service/xq/components/AssetZwyfDetails.vue'),
  AssetZyfcDetails: () => import('@/views/service/xq/components/AssetZyfcDetails.vue'),
  AssetYfZwjxDetails: () => import('@/views/service/xq/components/AssetYfZwjxDetails.vue'),
  AssetGssdbDetails: assetGssdbDetailsLoader,
  AssetgssdbDetails: assetGssdbDetailsLoader,
  xmbgxx: xmbgxxLoader,
  XMBGXX: xmbgxxLoader,
  Xmbgxx: xmbgxxLoader,
  AssetDdqdDetails: assetDdqdDetailsLoader,
  AssetddqdDetails: assetDdqdDetailsLoader
}
const componentModules = import.meta.glob('/src/views/service/xq/components/*.vue')

const asyncComponentCache = new Map<() => Promise<any>, ReturnType<typeof defineAsyncComponent>>()

const normalizeComponentName = (name: any = '') => String(name || '').toLowerCase()
const getComponentLoader = (componentName: string) => {
  return (
    componentMap[componentName] ||
    componentMap[normalizeComponentName(componentName)] ||
    (componentModules[`/src/views/service/xq/components/${componentName}.vue`] as () => Promise<any>) ||
    (componentModules[`/src/views/service/xq/components/${normalizeComponentName(componentName)}.vue`] as () => Promise<any>)
  )
}

const getAsyncComponent = (componentName: string) => {
  const loader = getComponentLoader(componentName)
  if (!loader) return undefined
  const cachedComponent = asyncComponentCache.get(loader)
  if (cachedComponent) return cachedComponent
  const component = markRaw(defineAsyncComponent(loader))
  asyncComponentCache.set(loader, component)
  return component
}

const getProjectPageType = () => (props.projectInfoApi ? '2' : '')
const getProjectComponentExtraProps = (formItem: ProjectFormConfig) => {
  const componentName = normalizeComponentName(formItem.stepEnname)
  const pageType = getProjectPageType()
  if (componentName === 'assetddqddetails') {
    return pageType ? { pageType } : {}
  }
  if (componentName !== 'xmbgxx') return {}
  return {
    projectChangeEditable: false,
    ...(pageType ? { pageType } : {})
  }
}

const commonFormConfig = {
  labelWidth: 'auto',
  labelPosition: 'right',
  gutter: 32,
  colsPerRow: 2
}

const projectFullWidthFieldTypes = new Set(['upload', 'uploadGroup', 'table_list'])

const normalizeProjectFieldForView = (field: any) => {
  if (!field || typeof field !== 'object' || Array.isArray(field)) return field

  const isAttachmentField = field.type === 'upload' || field.type === 'uploadGroup'
  const canDownloadAttachment = field.uploadShowDownload !== false
  return {
    ...field,
    disabled: true,
    ...(projectFullWidthFieldTypes.has(field.type) ? { span: 24 } : {}),
    ...(isAttachmentField
      ? {
          uploadDisabled: true,
          uploadShowActions: canDownloadAttachment,
          uploadShowDownload: canDownloadAttachment,
          children: Array.isArray(field.children) ? field.children.map((child: any) => ({ ...child, disabled: true })) : field.children
        }
      : {})
  }
}

// 重新分析后轮询获取评审结果的间隔：固定 15 秒
const RERUN_POLL_INTERVAL_MS = 15000
const AUDIT_RESULT_PUBLIC_CODE = 'AI_AUDIT_RESULT_COM'
// 总体结论下的风险等级合计：问题 / 隐患 / 异常（图标与规则列表风险等级保持一致）
const auditSummaryLevelIcons = {
  '1': markRaw(Siren),
  '2': markRaw(CircleAlert),
  '3': markRaw(BadgeCheck)
} as const

// AI 初评结论字典映射：id -> { name, type }，顶层构建一次复用
const aiRiskLevelMap = new Map(AIRiskLevelDict.getList().map((item: any) => [String(item.id), item]))

const normalizeAuditSummaryRuleLevel = (ruleLevel: any) => {
  const value = String(ruleLevel ?? '')
  return auditSummaryRuleLevelAliasMap[value] || value
}

const buildDefaultSummaryItems = (): AuditSummaryItem[] =>
  auditSummaryLevelConfigs.map((item) => ({
    key: item.ruleLevel,
    label: item.label,
    count: 0,
    tone: item.tone,
    icon: auditSummaryLevelIcons[item.ruleLevel]
  }))

const projectLoading = ref(false)
const projectEmptyText = ref('请选择任务查看项目基本信息')
const tabName = ref<string | number>('')
const isChange = ref(false)
const formConfigs = shallowRef<ProjectFormConfig[]>([])
const globalParams = reactive<Record<string, any>>({})
/** 打开详情时冻结的行快照：关闭过程中 props.detailRow 可能被清空，左侧模块仍依赖 proId/proType */
const sessionDetailRow = shallowRef<SmartTaskAuditRow>({})
const getSessionTaskId = () => sessionDetailRow.value?.taskId || props.detailRow?.taskId || ''
const isSessionTaskActive = (taskId: string) => props.modal.visible && getSessionTaskId() === taskId
let loadSeq = 0

// 多页签横向滚动：隐藏滚动条，两侧箭头控制位移
const projectTabsTrackRef = ref<HTMLElement | null>(null)
const canScrollProjectTabsPrev = ref(false)
const canScrollProjectTabsNext = ref(false)
const projectTabsScrollable = computed(() => canScrollProjectTabsPrev.value || canScrollProjectTabsNext.value)
// 仅第一个项目信息页签展示底图，其它页签保持纯色背景
const isFirstProjectTab = computed(() => {
  const firstStepId = formConfigs.value[0]?.stepId
  return firstStepId !== undefined && firstStepId !== null && firstStepId !== '' && tabName.value === firstStepId
})
let projectTabsResizeObserver: ResizeObserver | null = null

const updateProjectTabsScrollState = () => {
  const track = projectTabsTrackRef.value
  if (!track) {
    canScrollProjectTabsPrev.value = false
    canScrollProjectTabsNext.value = false
    return
  }
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
  const scrollLeft = track.scrollLeft
  canScrollProjectTabsPrev.value = scrollLeft > 1
  canScrollProjectTabsNext.value = scrollLeft < maxScroll - 1
}

const scrollProjectTabs = (direction: 'prev' | 'next') => {
  const track = projectTabsTrackRef.value
  if (!track) return
  const delta = Math.max(140, Math.floor(track.clientWidth * 0.7))
  track.scrollBy({ left: direction === 'prev' ? -delta : delta, behavior: 'smooth' })
}

const scrollActiveProjectTabIntoView = async () => {
  await nextTick()
  const track = projectTabsTrackRef.value
  if (!track) {
    updateProjectTabsScrollState()
    return
  }
  const activeBtn = track.querySelector('.audit-tab-btn.active') as HTMLElement | null
  if (activeBtn) {
    const trackRect = track.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()
    if (btnRect.left < trackRect.left) {
      track.scrollBy({ left: btnRect.left - trackRect.left - 8, behavior: 'smooth' })
    } else if (btnRect.right > trackRect.right) {
      track.scrollBy({ left: btnRect.right - trackRect.right + 8, behavior: 'smooth' })
    }
  }
  updateProjectTabsScrollState()
}

const bindProjectTabsObserver = async () => {
  await nextTick()
  const track = projectTabsTrackRef.value
  if (!track) {
    updateProjectTabsScrollState()
    return
  }
  if (!projectTabsResizeObserver) {
    projectTabsResizeObserver = new ResizeObserver(() => {
      updateProjectTabsScrollState()
    })
  }
  projectTabsResizeObserver.disconnect()
  projectTabsResizeObserver.observe(track as Element)
  updateProjectTabsScrollState()
}

const auditLoading = ref(false)
const auditTabs = shallowRef<AuditTab[]>([])
const activeAuditTab = ref('')
const auditTabsTrackRef = ref<HTMLElement | null>(null)
const canScrollAuditTabsPrev = ref(false)
const canScrollAuditTabsNext = ref(false)
const auditTabsScrollable = computed(() => canScrollAuditTabsPrev.value || canScrollAuditTabsNext.value)
let auditTabsResizeObserver: ResizeObserver | null = null
const auditCache = shallowRef<Record<string, AuditRuleItem[]>>({})
const auditDetailModal = reactive({
  visible: false,
  ruleClassify: '',
  detailId: '',
  itemIndex: -1
})
const auditFilePreviewVisible = ref(false)
const auditPreviewPreparing = ref(false)
/** 规则详情/文件预览弹窗盖在上层时，底层装饰动效（AI 立方体、扫描线、网格漂移等）无需继续跑 */
const isUnderlayMotionPaused = computed(() => auditDetailModal.visible || auditFilePreviewVisible.value)
const auditPreviewFiles = shallowRef<TXmAttach[]>([])
const activeAuditPreviewKey = ref('')
let auditPreviewListLoadSeq = 0
// 标记最近一次由接口新拉取的评审分类；命中缓存切换时不重播打字机
const freshClassify = ref('')
const auditEmptyText = ref('请选择任务查看评审信息')
const auditSummaryConclude = ref('')
const auditSummaryResult = ref<string | number | null>('')
const auditSummaryItems = shallowRef<AuditSummaryItem[]>(buildDefaultSummaryItems())
const auditResultOptions = shallowRef<AuditReviewItem[]>([])
const auditSummaryError = ref('')
const typewriterResetKey = ref(0)
const typewriterSessionMap = reactive<Record<string, number>>({})
const rerunningRuleMap = reactive<Record<string, boolean>>({})
const auditDetailLoadingMap = reactive<Record<string, boolean>>({})
const auditDetailLoadedMap = reactive<Record<string, boolean>>({})
// 重新分析轮询定时器，按 detailId 记录，无需响应式
const rerunPollTimers: Record<string, ReturnType<typeof setTimeout>> = {}
const rerunPollContexts: Record<string, ReturnType<typeof createRerunPollContext>> = {}
// 详情接口返回 reviewOpinion 前保持加载态，按 detailId 做条件轮询
const auditDetailPollTimers: Record<string, ReturnType<typeof setTimeout>> = {}
const auditDetailPollContexts: Record<string, ReturnType<typeof createRerunPollContext>> = {}
let auditLoadSeq = 0
let auditSummaryLoadSeq = 0

// 多页签横向滚动：与左侧项目页签保持同一套箭头与滚动逻辑
const updateAuditTabsScrollState = () => {
  const track = auditTabsTrackRef.value
  if (!track) {
    canScrollAuditTabsPrev.value = false
    canScrollAuditTabsNext.value = false
    return
  }
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
  const scrollLeft = track.scrollLeft
  canScrollAuditTabsPrev.value = scrollLeft > 1
  canScrollAuditTabsNext.value = scrollLeft < maxScroll - 1
}

const scrollAuditTabs = (direction: 'prev' | 'next') => {
  const track = auditTabsTrackRef.value
  if (!track) return
  const delta = Math.max(140, Math.floor(track.clientWidth * 0.7))
  track.scrollBy({ left: direction === 'prev' ? -delta : delta, behavior: 'smooth' })
}

const scrollActiveAuditTabIntoView = async () => {
  await nextTick()
  const track = auditTabsTrackRef.value
  if (!track) {
    updateAuditTabsScrollState()
    return
  }
  const activeBtn = track.querySelector('.audit-tabs__tab.active') as HTMLElement | null
  if (activeBtn) {
    const trackRect = track.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()
    if (btnRect.left < trackRect.left) {
      track.scrollBy({ left: btnRect.left - trackRect.left - 8, behavior: 'smooth' })
    } else if (btnRect.right > trackRect.right) {
      track.scrollBy({ left: btnRect.right - trackRect.right + 8, behavior: 'smooth' })
    }
  }
  updateAuditTabsScrollState()
}

const bindAuditTabsObserver = async () => {
  await nextTick()
  const track = auditTabsTrackRef.value
  if (!track) {
    updateAuditTabsScrollState()
    return
  }
  if (!auditTabsResizeObserver) {
    auditTabsResizeObserver = new ResizeObserver(() => {
      updateAuditTabsScrollState()
    })
  }
  auditTabsResizeObserver.disconnect()
  auditTabsResizeObserver.observe(track as Element)
  updateAuditTabsScrollState()
}

const projectSelectData = computed(() => {
  const row = sessionDetailRow.value
  return {
    ...row,
    id: row?.proId,
    proId: row?.proId,
    proType: row?.proType,
    xmId: row?.proId || row?.xmId,
    xmid: row?.proId || row?.xmid || row?.xmId,
    xmlx: globalParams.xmlx || globalParams.XMLX || row?.proType || ''
  }
})
const resolvedProjectUserInfo = computed(() => {
  if (Object.keys(props.userInfo || {}).length) return props.userInfo
  return {
    bmId: currentUserRole?.value?.bmId || '',
    deptId: currentUserRole?.value?.bmId || '',
    deptName: currentUserRole?.value?.bmName || '',
    dwId: currentUserRole?.value?.dwId || '',
    dwName: currentUserRole?.value?.dwName || '',
    roleId: currentUserRole?.value?.roleId || '',
    roleCode: currentUserRole?.value?.roleCode || '',
    spRoleId: currentUserRole?.value?.spRoleId || '',
    specialorgcode: currentUserRole?.value?.specialOrgCode || ''
  }
})

const auditItems = computed(() => (activeAuditTab.value ? auditCache.value[activeAuditTab.value] || [] : []))
const activeAuditDetailEntry = computed(() => {
  const list = auditCache.value[auditDetailModal.ruleClassify] || []
  const detailIndex = auditDetailModal.detailId ? list.findIndex((item) => String(item.detailId || '') === auditDetailModal.detailId) : -1
  const index = detailIndex >= 0 ? detailIndex : auditDetailModal.itemIndex
  const item = list[index]
  return item ? { item, index } : undefined
})
const activeAuditDetailItem = computed(() => activeAuditDetailEntry.value?.item)
// 10001 使用证据关键词展示，30005 使用相似性分析展示；两者沿用同一套当前管理端详情弹窗样式。
const activeAuditDetailDisplayMode = computed(() =>
  String(activeAuditDetailItem.value?.ruleCode ?? '') === '30005' ? 'similarity-analysis' : 'evidence-keywords'
)
const isOpenXsxReview = computed(() => {
  const ruleCode = String(activeAuditDetailItem.value?.ruleCode ?? '')
  return auditDetailModal.visible && (ruleCode === '10001' || ruleCode === '30005')
})
const isOpenRuleReview = computed(() => {
  const ruleCode = String(activeAuditDetailItem.value?.ruleCode ?? '')
  return auditDetailModal.visible && ruleCode !== '10001' && ruleCode !== '30005'
})
const activeAuditDetailIndex = computed(() => activeAuditDetailEntry.value?.index ?? 0)
const auditTypewriterAnimate = computed(() => Boolean(activeAuditTab.value) && activeAuditTab.value === freshClassify.value)
const activeAuditDetailLoading = computed(() => Boolean(activeAuditDetailItem.value && isAuditDetailLoading(activeAuditDetailItem.value)))
const activeAuditDetailRerunning = computed(() => Boolean(activeAuditDetailItem.value && isAuditRuleRerunning(activeAuditDetailItem.value)))
const activeAuditDetailReady = computed(() => Boolean(activeAuditDetailItem.value && isAuditDetailReady(activeAuditDetailItem.value)))
const activeAuditDetailConcludePersistKey = computed(() =>
  activeAuditDetailItem.value
    ? getTypewriterPersistKey(activeAuditDetailItem.value, activeAuditDetailIndex.value, 'conclude', auditDetailModal.ruleClassify)
    : ''
)
const activeAuditDetailProcessPersistKey = computed(() =>
  activeAuditDetailItem.value
    ? getTypewriterPersistKey(activeAuditDetailItem.value, activeAuditDetailIndex.value, 'process', auditDetailModal.ruleClassify)
    : ''
)
// 右上角初评结论：优先用公共代码转换，公共代码缺失时沿用当前静态字典行为
const auditSummaryReviewItem = computed(() => {
  const result = auditSummaryResult.value
  if (result === '' || result === null || result === undefined) return undefined
  const codeItem = auditResultOptions.value.find((item) => String(item.code) === String(result) || String(item.id) === String(result))
  const fallbackItem = aiRiskLevelMap.get(String(result))
  if (!codeItem) return fallbackItem
  return {
    ...fallbackItem,
    ...codeItem,
    name: codeItem.name || fallbackItem?.name,
    type: codeItem.type || fallbackItem?.type
  }
})
const auditSummaryReviewTone = computed(() => auditSummaryReviewItem.value?.type || '')
const auditSummaryStatusText = computed(() => auditSummaryReviewItem.value?.name || '')
const auditSummaryStatusIconMap: Record<string, Component> = {
  info: markRaw(Info),
  'primary-blue': markRaw(Clock3),
  success: markRaw(CircleCheck),
  danger: markRaw(CircleX)
}
const auditSummaryStatusIcon = computed(() => auditSummaryStatusIconMap[auditSummaryReviewTone.value] || markRaw(CircleAlert))

const resetAuditFilePreview = () => {
  auditFilePreviewVisible.value = false
  auditPreviewPreparing.value = false
  auditPreviewFiles.value = []
  activeAuditPreviewKey.value = ''
}

const closeAuditFilePreview = () => {
  auditPreviewListLoadSeq += 1
  resetAuditFilePreview()
}

const passedAuditOpinions = new Set(['1'])
const failedAuditOpinions = new Set(['0'])
const pendingAuditOpinions = new Set(['2'])

const getAuditStatus = (item: AuditRuleItem): AuditStatus => {
  const reviewOpinion = String(item.reviewOpinion ?? '')
  if (passedAuditOpinions.has(reviewOpinion)) return 'passed'
  if (pendingAuditOpinions.has(reviewOpinion)) return 'pending'
  if (failedAuditOpinions.has(reviewOpinion)) return 'failed'
  return ''
}

const resetProjectState = () => {
  tabName.value = ''
  isChange.value = false
  formConfigs.value = []
  projectEmptyText.value = '请选择任务查看项目基本信息'
  Object.keys(globalParams).forEach((key) => {
    delete globalParams[key]
  })
}

const clearReactiveRecord = (record: Record<string, unknown>) => {
  Object.keys(record).forEach((key) => {
    delete record[key]
  })
}

const resetAuditDetailModal = () => {
  closeAuditFilePreview()
  auditDetailModal.visible = false
  auditDetailModal.ruleClassify = ''
  auditDetailModal.detailId = ''
  auditDetailModal.itemIndex = -1
}

const resetAuditState = () => {
  auditTabsResizeObserver?.disconnect()
  canScrollAuditTabsPrev.value = false
  canScrollAuditTabsNext.value = false
  auditTabs.value = []
  activeAuditTab.value = ''
  auditCache.value = {}
  resetAuditDetailModal()
  freshClassify.value = ''
  auditEmptyText.value = '请选择任务查看评审信息'
  auditSummaryConclude.value = ''
  auditSummaryResult.value = ''
  auditSummaryItems.value = buildDefaultSummaryItems()
  auditResultOptions.value = []
  auditSummaryError.value = ''
  auditSummaryLoadSeq += 1
  typewriterResetKey.value += 1
  clearReactiveRecord(typewriterSessionMap)
  clearReactiveRecord(rerunningRuleMap)
  clearReactiveRecord(auditDetailLoadingMap)
  clearReactiveRecord(auditDetailLoadedMap)
  clearAllRerunPollTimers()
  clearAllAuditDetailPollTimers()
}

const normalizeAuditTabs = (data: any[]) => {
  return normalizeOptionList(data)
    .filter((item) => item.code)
    .map((item) => ({
      code: String(item.code),
      name: item.name || String(item.code)
    }))
}

const normalizeAuditResultOptions = (data: any[]): AuditReviewItem[] => {
  return normalizeOptionList(data)
    .filter((item) => item.code || item.id)
    .map((item) => ({
      ...item,
      code: item.code ?? item.id,
      id: item.id ?? item.code,
      name: item.name || String(item.code ?? item.id)
    }))
}

const getAuditTabFailedCount = (tab: AuditTab) => {
  return (auditCache.value[String(tab.code)] || []).filter((item) => {
    const status = getAuditStatus(item)
    return status === 'failed' || status === 'pending'
  }).length
}

const getAuditSummaryList = (data: any): AuditSummaryRecord[] => {
  if (!data || typeof data !== 'object') return []
  if (Array.isArray(data.ruleLevelFindNumList)) return data.ruleLevelFindNumList
  return []
}

const setAuditSummary = (data: any) => {
  const summary = normalizeAuditSummaryData(data)
  const list = getAuditSummaryList(summary)
  const recordMap = list.reduce((map, record) => {
    const ruleLevel = normalizeAuditSummaryRuleLevel(record.ruleLevel)
    if (ruleLevel) map.set(ruleLevel, record)
    return map
  }, new Map<string, AuditSummaryRecord>())
  auditSummaryItems.value = buildDefaultSummaryItems().map((item) => {
    const record = recordMap.get(String(item.key))
    if (!record) return item
    return {
      ...item,
      count: record.findNum ?? item.count
    }
  })
  auditSummaryConclude.value = summary.auditConclude
  auditSummaryResult.value = summary.auditResult
  auditSummaryError.value = ''
}

const setAuditSummaryError = (message: string) => {
  const hasExistingSummary = Boolean(auditSummaryConclude.value || auditSummaryResult.value)
  auditSummaryError.value = hasExistingSummary ? `${message}，当前展示可能不是最新结果` : message
}

const loadAuditSummaryInfo = async (taskId: string, showError = false) => {
  if (!taskId) return
  const seq = ++auditSummaryLoadSeq
  try {
    const res = await getXmAuditConclude(taskId)
    // 关闭弹窗或任务切换后丢弃；用会话 taskId，避免 props.detailRow 被提前清空
    if (seq !== auditSummaryLoadSeq || !props.modal.visible || getSessionTaskId() !== taskId) return
    if (res.success) {
      setAuditSummary(res.data)
      return
    }
    const message = res.msg || '审核结论获取失败'
    setAuditSummaryError(message)
    if (showError) {
      ElMessage.error(message)
    }
  } catch (e: any) {
    if (seq !== auditSummaryLoadSeq || !props.modal.visible || getSessionTaskId() !== taskId) return
    const message = e.message || '审核结论获取失败'
    setAuditSummaryError(message)
    if (showError) {
      ElMessage.error(message)
    }
  }
}

const isProjectLoadActive = (seq: number, proId?: string | number) => {
  return seq === loadSeq && props.modal.visible && Boolean(proId) && String(sessionDetailRow.value?.proId || '') === String(proId)
}

const loadProjectInfo = async () => {
  const seq = ++loadSeq
  // 优先用打开时的会话快照，避免关闭瞬间 props.detailRow 被清空
  const proId = sessionDetailRow.value?.proId || props.detailRow?.proId
  const protypeId = sessionDetailRow.value?.proType || props.detailRow?.proType
  // 先卸载旧表单，避免在途请求回来后与新/空参数叠在一起
  resetProjectState()
  if (!props.modal.visible) return
  if (!proId) {
    projectEmptyText.value = '当前任务缺少项目ID'
    return
  }
  if (!protypeId) {
    projectEmptyText.value = '当前任务缺少项目类型'
    return
  }

  projectLoading.value = true
  try {
    const [data, columns] = await Promise.all([
      props.projectInfoApi ? pageGetXmInfo(proId) : getXmInfo(proId),
      getTabColumns({
        protypeId,
        opType: 'VIEW',
        xmid: proId,
        ...(props.projectInfoApi ? { pageType: '2' } : {})
      })
    ])
    // 关闭弹窗或切换任务后丢弃过期结果，不再往已清空的 globalParams 写数据
    if (!isProjectLoadActive(seq, proId)) return

    if (!data.success || !columns.success) {
      projectEmptyText.value = '项目基本信息获取失败'
      ElMessage.error(data.msg || columns.msg || '项目基本信息获取失败')
      return
    }

    const projectData = data.data && typeof data.data === 'object' ? data.data : {}
    const dynamicLevelParams: Record<string, unknown> = {}
    Object.values(projectData).forEach((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return
      Object.entries(item as Record<string, unknown>).forEach(([itemKey, itemValue]) => {
        if (itemKey === '__proto__' || itemKey === 'prototype' || itemKey === 'constructor') return
        globalParams[itemKey] = itemValue
        if (itemKey === 'SJFL' || itemKey === 'IS_DISPATCH') {
          dynamicLevelParams[itemKey] = itemValue
        }
      })
    })
    globalParams.id = proId
    globalParams.ID = globalParams.ID || proId
    globalParams.xmlx = globalParams.xmlx || globalParams.XMLX || globalParams.PRO_TYPE || protypeId

    const dynamicLevelResult = props.projectInfoApi ? await baseService.post('/xmAttributeConfig/getDydj', dynamicLevelParams) : null
    if (!isProjectLoadActive(seq, proId)) return

    const columnData = Array.isArray(columns.data) ? columns.data : []
    formConfigs.value = columnData.map((item: any) => {
      const fields = Array.isArray(item.columns) ? item.columns.map(normalizeProjectFieldForView) : []
      const component = item.stepEnname ? getAsyncComponent(item.stepEnname) : undefined
      if (!component && dynamicLevelResult?.success) {
        fields.forEach((field: any) => {
          if (field?.prop === 'DYDJ') field.options = dynamicLevelResult.data
        })
      }
      const formItem: ProjectFormConfig = {
        stepId: item.stepId,
        stepName: item.stepName,
        stepType: item.stepType,
        stepEnname: item.stepEnname || '',
        fields,
        config: commonFormConfig,
        data: data.data?.[item.stepId] || {}
      }
      if (component) formItem.path = component
      return formItem
    })

    tabName.value = formConfigs.value[0]?.stepId || ''
    isChange.value = true
    projectEmptyText.value = formConfigs.value.length ? '' : '暂无项目基本信息'
    await bindProjectTabsObserver()
    if (!isProjectLoadActive(seq, proId)) return
    await scrollActiveProjectTabIntoView()
  } catch (e: any) {
    if (!isProjectLoadActive(seq, proId)) return
    projectEmptyText.value = '项目基本信息获取失败'
    ElMessage.error(e.message || '项目基本信息获取失败')
  } finally {
    if (seq === loadSeq) {
      projectLoading.value = false
    }
  }
}

const isAuditRuleRerunning = (item: AuditRuleItem) => {
  return Boolean(item.detailId && rerunningRuleMap[item.detailId])
}

const setAuditRuleRerunning = (detailId: string, rerunning: boolean) => {
  if (rerunning) {
    rerunningRuleMap[detailId] = true
  } else {
    delete rerunningRuleMap[detailId]
  }
}

const setAuditDetailLoading = (detailId: string, loading: boolean) => {
  if (loading) {
    auditDetailLoadingMap[detailId] = true
  } else {
    delete auditDetailLoadingMap[detailId]
  }
}

const setAuditDetailLoaded = (detailId: string, loaded: boolean) => {
  if (loaded) {
    auditDetailLoadedMap[detailId] = true
  } else {
    delete auditDetailLoadedMap[detailId]
  }
}

const isAuditDetailLoading = (item: AuditRuleItem) => Boolean(item.detailId && auditDetailLoadingMap[item.detailId])

const isAuditDetailLoaded = (item: AuditRuleItem) => Boolean(item.detailId && auditDetailLoadedMap[item.detailId])

const bumpTypewriterSession = (detailId: string) => {
  typewriterSessionMap[detailId] = (typewriterSessionMap[detailId] || 0) + 1
}

const clearRerunPollTimer = (detailId: string) => {
  const timer = rerunPollTimers[detailId]
  if (timer) {
    clearTimeout(timer)
    delete rerunPollTimers[detailId]
  }
}

const clearRerunPollContext = (detailId: string) => {
  delete rerunPollContexts[detailId]
}

const stopRerunPoll = (detailId: string) => {
  clearRerunPollTimer(detailId)
  clearRerunPollContext(detailId)
  setAuditRuleRerunning(detailId, false)
}

const clearAllRerunPollTimers = () => {
  Object.keys(rerunPollTimers).forEach((detailId) => clearRerunPollTimer(detailId))
  Object.keys(rerunPollContexts).forEach((detailId) => clearRerunPollContext(detailId))
}

const clearAuditDetailPollTimer = (detailId: string) => {
  const timer = auditDetailPollTimers[detailId]
  if (timer) {
    clearTimeout(timer)
    delete auditDetailPollTimers[detailId]
  }
}

const clearAuditDetailPollContext = (detailId: string) => {
  delete auditDetailPollContexts[detailId]
}

const stopAuditDetailPoll = (detailId: string) => {
  clearAuditDetailPollTimer(detailId)
  clearAuditDetailPollContext(detailId)
  setAuditDetailLoading(detailId, false)
}

const clearAllAuditDetailPollTimers = () => {
  Object.keys(auditDetailPollTimers).forEach((detailId) => clearAuditDetailPollTimer(detailId))
  Object.keys(auditDetailPollContexts).forEach((detailId) => clearAuditDetailPollContext(detailId))
}

const getRerunPollInterval = () => RERUN_POLL_INTERVAL_MS

const isAuditDetailReady = (item: AuditRuleItem) => isAuditDetailLoaded(item) && isRuleReviewDetailComplete(item)

const shouldPollRuleReview = (data: Partial<RuleReviewInfo>) => String(data.status ?? '') === '2'

const stripAuditDetailContent = (item: AuditRuleItem): AuditRuleItem => {
  const { reviewProcess, reviewTable, ...summary } = item //reviewConclude,
  return summary as AuditRuleItem
}

const normalizeAuditRuleList = (data: any): AuditRuleItem[] => (Array.isArray(data) ? data.map((item) => stripAuditDetailContent(item)) : [])

// 将单条评审详情合并进缓存；重新分析结果需要刷新打字机 session
const applyRuleReviewResult = (ruleClassify: string, detailId: string, data: Partial<RuleReviewInfo>, replayTypewriter = false) => {
  const list = auditCache.value[ruleClassify]
  if (!Array.isArray(list)) return
  const index = list.findIndex((rule) => rule.detailId === detailId)
  if (index === -1) return
  const nextList = list.slice()
  nextList[index] = { ...nextList[index], ...normalizeRuleReviewDetail(data) }
  auditCache.value = { ...auditCache.value, [ruleClassify]: nextList }
  setAuditDetailLoaded(detailId, true)
  setAuditDetailLoading(detailId, false)
  if (replayTypewriter) {
    bumpTypewriterSession(detailId)
  }
  freshClassify.value = ruleClassify
}

const getTypewriterPersistKey = (item: AuditRuleItem, index: number, field: TypewriterField, ruleClassify = activeAuditTab.value) => {
  const detailKey = item.detailId || String(item.ruleId || index)
  return [typewriterResetKey.value, typewriterSessionMap[detailKey] || 0, getSessionTaskId(), ruleClassify, detailKey, field].join('-')
}

/** 关闭规则详情后回收大字段，列表仍保留摘要（含 reviewConclude） */
const releaseAuditDetailHeavyFields = (detailId: string, ruleClassify: string) => {
  if (!detailId || !ruleClassify) return
  const list = auditCache.value[ruleClassify]
  if (!Array.isArray(list)) return
  const index = list.findIndex((rule) => String(rule.detailId || '') === detailId)
  if (index === -1) return
  const current = list[index]
  if (!current || (!('reviewProcess' in current) && !('reviewTable' in current))) return
  const nextList = list.slice()
  nextList[index] = stripAuditDetailContent(current)
  auditCache.value = { ...auditCache.value, [ruleClassify]: nextList }
  setAuditDetailLoaded(detailId, false)
}

const closeAuditDetailModal = () => {
  const detailId = auditDetailModal.detailId
  const ruleClassify = auditDetailModal.ruleClassify
  resetAuditDetailModal()
  if (detailId) {
    stopAuditDetailPoll(detailId)
    // 重新分析中的项不 strip，避免轮询结果合并前丢失
    if (!rerunningRuleMap[detailId]) {
      releaseAuditDetailHeavyFields(detailId, ruleClassify)
    }
  }
}

const openAuditFilePreview = async (selectedFile?: TXmAttach, filesFromList?: TXmAttach[]) => {
  if (auditPreviewPreparing.value) return

  // 下拉列表已选中具体附件时，直接打开对应预览（列表已过滤可预览文件）
  if (selectedFile && Array.isArray(filesFromList) && filesFromList.length) {
    const resolved = resolveAuditPreviewTarget(selectedFile, filesFromList)
    if (!resolved) {
      ElMessage.warning(UNSUPPORTED_AUDIT_PREVIEW_TIP)
      return
    }

    auditPreviewListLoadSeq += 1
    auditPreviewFiles.value = resolved.files
    activeAuditPreviewKey.value = getAuditPreviewFileKey(resolved.targetFile)
    auditFilePreviewVisible.value = true
    return
  }

  const detailId = activeAuditDetailItem.value?.detailId
  if (!detailId) {
    ElMessage.warning('当前评审详情缺少明细ID')
    return
  }

  const seq = ++auditPreviewListLoadSeq
  auditPreviewPreparing.value = true
  try {
    const res = await listAttach(detailId)
    if (seq !== auditPreviewListLoadSeq || !auditDetailModal.visible || auditDetailModal.detailId !== detailId) return
    if (!res.success) {
      ElMessage.error(res.msg || '源文件列表获取失败')
      return
    }

    const files = (Array.isArray(res.data) ? res.data : []).filter((file) => file && getAuditPreviewFileKey(file))
    const previewableFiles = files.filter(isSupportedAuditPreviewFile)
    if (!previewableFiles.length) {
      ElMessage.warning(files.length ? '暂无支持预览的文件，仅支持 PDF、DOC、DOCX、XLSX、XLS、ET' : '暂无可预览文件')
      return
    }

    const preferredKey = selectedFile ? getAuditPreviewFileKey(selectedFile) : ''
    const targetFile = (preferredKey && previewableFiles.find((file) => getAuditPreviewFileKey(file) === preferredKey)) || previewableFiles[0]

    auditPreviewFiles.value = previewableFiles
    activeAuditPreviewKey.value = getAuditPreviewFileKey(targetFile)
    auditFilePreviewVisible.value = true
  } catch (e: any) {
    if (seq !== auditPreviewListLoadSeq) return
    ElMessage.error(e.message || '源文件列表获取失败')
  } finally {
    if (seq === auditPreviewListLoadSeq) {
      auditPreviewPreparing.value = false
    }
  }
}

const loadRuleReviewInfo = async (ruleClassify: string) => {
  if (!ruleClassify) return
  if (auditCache.value[ruleClassify]) return

  const seq = ++auditLoadSeq
  const taskId = getSessionTaskId()
  if (!taskId) {
    auditEmptyText.value = '当前任务缺少任务ID'
    return
  }

  auditLoading.value = true
  auditEmptyText.value = ''
  try {
    const res = await getRuleReviewInfo(getRuleReviewParams(taskId, ruleClassify))
    if (seq !== auditLoadSeq) return

    if (!res.success) {
      auditEmptyText.value = '评审信息获取失败'
      ElMessage.error(res.msg || '评审信息获取失败')
      return
    }

    const list = normalizeAuditRuleList(res.data)
    auditCache.value = { ...auditCache.value, [ruleClassify]: list }
    freshClassify.value = ruleClassify
    auditEmptyText.value = list.length ? '' : '暂无评审信息'
  } catch (e: any) {
    if (seq !== auditLoadSeq) return
    auditEmptyText.value = '评审信息获取失败'
    ElMessage.error(e.message || '评审信息获取失败')
  } finally {
    if (seq === auditLoadSeq) {
      auditLoading.value = false
    }
  }
}

const pollAuditRuleDetail = (ruleClassify: string, detailId: string, taskId: string) => {
  clearAuditDetailPollTimer(detailId)
  const context = auditDetailPollContexts[detailId]
  if (!isSameRerunPollContext(context, taskId, ruleClassify) || !isSessionTaskActive(taskId)) return
  if (!auditCache.value[ruleClassify]) {
    stopAuditDetailPoll(detailId)
    return
  }
  if (hasRerunPollExpired(context)) {
    ElMessage.error('评审详情加载超时，请稍后重试')
    stopAuditDetailPoll(detailId)
    return
  }

  context.attempts += 1
  getRuleReview({ detailId })
    .then((res) => {
      const currentContext = auditDetailPollContexts[detailId]
      if (!isSameRerunPollContext(currentContext, taskId, ruleClassify) || !isSessionTaskActive(taskId)) return
      if (!auditCache.value[ruleClassify]) {
        stopAuditDetailPoll(detailId)
        return
      }
      if (!res.success) {
        ElMessage.error(res.msg || '评审详情获取失败')
        stopAuditDetailPoll(detailId)
        return
      }

      const data = (res.data || {}) as Partial<RuleReviewInfo>
      if (!shouldPollRuleReview(data)) {
        applyRuleReviewResult(ruleClassify, detailId, data, false)
        clearAuditDetailPollContext(detailId)
        return
      }

      if (hasRerunPollExpired(currentContext)) {
        ElMessage.error('评审详情加载超时，请稍后重试')
        stopAuditDetailPoll(detailId)
        return
      }

      setAuditDetailLoading(detailId, true)
      auditDetailPollTimers[detailId] = setTimeout(() => pollAuditRuleDetail(ruleClassify, detailId, taskId), getRerunPollInterval())
    })
    .catch((e: any) => {
      if (isSameRerunPollContext(auditDetailPollContexts[detailId], taskId, ruleClassify) && isSessionTaskActive(taskId)) {
        ElMessage.error(e.message || '评审详情获取失败')
        stopAuditDetailPoll(detailId)
      }
    })
}

const loadAuditRuleDetail = (item: AuditRuleItem, ruleClassify = activeAuditTab.value) => {
  const detailId = item.detailId
  const taskId = getSessionTaskId()
  if (!detailId || !ruleClassify || !taskId) return
  if (isAuditDetailReady(item) || isAuditDetailLoading(item)) return

  auditDetailPollContexts[detailId] = createRerunPollContext(taskId, ruleClassify)
  setAuditDetailLoaded(detailId, false)
  setAuditDetailLoading(detailId, true)
  pollAuditRuleDetail(ruleClassify, detailId, taskId)
}

const openAuditDetailModal = (item: AuditRuleItem, index: number) => {
  const ruleClassify = activeAuditTab.value
  if (auditDetailModal.visible && auditDetailModal.detailId && auditDetailModal.detailId !== String(item.detailId || '')) {
    closeAuditDetailModal()
  }
  auditDetailModal.ruleClassify = ruleClassify
  auditDetailModal.detailId = String(item.detailId || '')
  auditDetailModal.itemIndex = index
  auditDetailModal.visible = true
  loadAuditRuleDetail(item, ruleClassify)
}

// 轮询单条规则的评审结果，status 为 2 时继续等待
const pollRuleReview = (ruleClassify: string, detailId: string, taskId: string) => {
  clearRerunPollTimer(detailId)
  const context = rerunPollContexts[detailId]
  if (!isSameRerunPollContext(context, taskId, ruleClassify) || !isSessionTaskActive(taskId)) return
  if (hasRerunPollExpired(context)) {
    ElMessage.error('重新分析超时，请稍后重试')
    stopRerunPoll(detailId)
    return
  }

  context.attempts += 1
  getRuleReview({ detailId })
    .then((res) => {
      // 分类缓存已被清理或任务已切换（关闭/重开弹窗），停止旧轮询
      const currentContext = rerunPollContexts[detailId]
      if (!isSameRerunPollContext(currentContext, taskId, ruleClassify) || !isSessionTaskActive(taskId)) {
        return
      }
      if (!auditCache.value[ruleClassify]) {
        stopRerunPoll(detailId)
        return
      }
      if (!res.success) {
        ElMessage.error(res.msg || '获取评审结果失败')
        stopRerunPoll(detailId)
        return
      }

      const data = (res.data || {}) as Partial<RuleReviewInfo>
      if (!shouldPollRuleReview(data)) {
        applyRuleReviewResult(ruleClassify, detailId, data, true)
        stopRerunPoll(detailId)
        loadAuditSummaryInfo(taskId, true)
        return
      }

      if (hasRerunPollExpired(currentContext)) {
        ElMessage.error('重新分析超时，请稍后重试')
        stopRerunPoll(detailId)
        return
      }

      // 仍在分析中，继续轮询
      rerunPollTimers[detailId] = setTimeout(() => pollRuleReview(ruleClassify, detailId, taskId), getRerunPollInterval())
    })
    .catch((e: any) => {
      if (isSameRerunPollContext(rerunPollContexts[detailId], taskId, ruleClassify) && isSessionTaskActive(taskId)) {
        ElMessage.error(e.message || '获取评审结果失败')
        stopRerunPoll(detailId)
      }
    })
}

const redoAuditRuleHandle = async (item: AuditRuleItem, ruleClassify = activeAuditTab.value) => {
  const detailId = item.detailId
  const taskId = getSessionTaskId()
  if (!detailId || !ruleClassify || !taskId || !props.modal.visible || isAuditRuleRerunning(item)) return
  if (!isSessionTaskActive(taskId)) return

  // rerunning 状态从触发一直保持到轮询结束
  rerunPollContexts[detailId] = createRerunPollContext(taskId, ruleClassify)
  setAuditRuleRerunning(detailId, true)
  try {
    const res = await redoAuditRule({ detailId })
    if (!res.success) {
      ElMessage.error(res.msg || '重新分析失败')
      stopRerunPoll(detailId)
      return
    }
    pollRuleReview(ruleClassify, detailId, taskId)
  } catch (e: any) {
    if (isSameRerunPollContext(rerunPollContexts[detailId], taskId, ruleClassify) && isSessionTaskActive(taskId)) {
      ElMessage.error(e.message || '重新分析失败')
      stopRerunPoll(detailId)
    }
  }
}

const rerunActiveAuditRule = async () => {
  if (!activeAuditDetailItem.value) return
  await redoAuditRuleHandle(activeAuditDetailItem.value, auditDetailModal.ruleClassify)
}

const switchAuditTab = (ruleClassify: string) => {
  if (activeAuditTab.value === ruleClassify) {
    if (!auditCache.value[ruleClassify] && !auditLoading.value) {
      loadRuleReviewInfo(ruleClassify)
    }
    return
  }
  closeAuditDetailModal()
  activeAuditTab.value = ruleClassify
  if (auditCache.value[ruleClassify]) {
    auditLoadSeq += 1
    auditLoading.value = false
    freshClassify.value = ''
  }
  auditEmptyText.value = auditCache.value[ruleClassify]?.length ? '' : '暂无评审信息'
  loadRuleReviewInfo(ruleClassify)
}

const loadAuditInfo = async () => {
  const seq = ++auditLoadSeq
  const taskId = getSessionTaskId()
  resetAuditState()
  if (!props.modal.visible) return
  if (!taskId) {
    auditEmptyText.value = '当前任务缺少任务ID'
    return
  }

  auditLoading.value = true
  try {
    const [classifyResult, , auditResultCodeResult] = await Promise.allSettled([
      getPublicData('AI_AUDIT_RULE_CLASSIFY_COM'),
      loadAuditSummaryInfo(taskId),
      getPublicData(AUDIT_RESULT_PUBLIC_CODE)
    ])
    if (seq !== auditLoadSeq) return

    if (auditResultCodeResult.status === 'fulfilled' && auditResultCodeResult.value.success) {
      auditResultOptions.value = normalizeAuditResultOptions(auditResultCodeResult.value.data || [])
    }

    if (classifyResult.status === 'rejected') {
      auditEmptyText.value = '评审分类获取失败'
      ElMessage.error(classifyResult.reason?.message || '评审分类获取失败')
      return
    }

    const res = classifyResult.value
    if (!res.success) {
      auditEmptyText.value = '评审分类获取失败'
      ElMessage.error(res.msg || '评审分类获取失败')
      return
    }

    auditTabs.value = normalizeAuditTabs(res.data || [])
    activeAuditTab.value = auditTabs.value[0]?.code || ''
    auditEmptyText.value = activeAuditTab.value ? '' : '暂无评审分类'
    await bindAuditTabsObserver()
    await scrollActiveAuditTabIntoView()

    if (auditTabs.value.length) {
      try {
        // 预拉取所有分类的评审列表，保证各 tab 右上角数量在首次进入时即准确显示（列表数据较轻量，详情按需再拉）
        const ruleReviewResults = await Promise.allSettled(auditTabs.value.map((tab) => getRuleReviewInfo(getRuleReviewParams(taskId, tab.code))))
        if (seq !== auditLoadSeq) return

        const nextCache: Record<string, AuditRuleItem[]> = {}
        let hasSuccess = false
        let hasError = false
        auditTabs.value.forEach((tab, index) => {
          const result = ruleReviewResults[index]
          if (result.status === 'fulfilled' && result.value.success) {
            nextCache[tab.code] = normalizeAuditRuleList(result.value.data)
            hasSuccess = true
          } else {
            hasError = true
          }
        })

        auditCache.value = nextCache
        freshClassify.value = activeAuditTab.value

        if (activeAuditTab.value in nextCache) {
          auditEmptyText.value = nextCache[activeAuditTab.value].length ? '' : '暂无评审信息'
        } else {
          auditEmptyText.value = '评审信息获取失败'
          if (!hasSuccess) {
            ElMessage.error('评审信息获取失败')
          }
        }

        if (hasError && hasSuccess) {
          ElMessage.error('部分评审信息获取失败')
        }
      } catch (e: any) {
        if (seq !== auditLoadSeq) return
        auditEmptyText.value = '评审信息获取失败'
        ElMessage.error(e.message || '评审信息获取失败')
        return
      }
    }
  } catch (e: any) {
    if (seq !== auditLoadSeq) return
    auditEmptyText.value = '评审分类获取失败'
    ElMessage.error(e.message || '评审分类获取失败')
  } finally {
    if (seq === auditLoadSeq) {
      auditLoading.value = false
    }
  }
}

watch(
  [() => props.modal.visible, () => props.detailRow?.proId, () => props.detailRow?.proType],
  ([visible]) => {
    if (visible) {
      // 打开时冻结行参数，供左侧模块与在途请求使用
      sessionDetailRow.value = { ...(props.detailRow || {}) }
      loadProjectInfo()
    } else {
      // 先作废在途 loadProjectInfo，再卸载表单，最后清会话快照
      loadSeq += 1
      projectLoading.value = false
      resetProjectState()
      sessionDetailRow.value = {}
      canScrollProjectTabsPrev.value = false
      canScrollProjectTabsNext.value = false
    }
  },
  {
    immediate: true
  }
)

watch(
  [() => props.modal.visible, () => props.detailRow?.taskId, () => props.reviewOpinions],
  ([visible]) => {
    if (visible) {
      // 与项目侧保持同一会话快照（taskId 用于评审请求）
      if (!sessionDetailRow.value?.taskId && props.detailRow?.taskId) {
        sessionDetailRow.value = { ...(props.detailRow || {}) }
      }
      loadAuditInfo()
    } else {
      auditLoadSeq += 1
      auditLoading.value = false
      resetAuditState()
    }
  },
  {
    immediate: true
  }
)

watch(tabName, () => {
  scrollActiveProjectTabIntoView()
})

watch(activeAuditTab, () => {
  scrollActiveAuditTabIntoView()
})

onBeforeUnmount(() => {
  projectTabsResizeObserver?.disconnect()
  projectTabsResizeObserver = null
  auditTabsResizeObserver?.disconnect()
  auditTabsResizeObserver = null
  clearAllRerunPollTimers()
  clearAllAuditDetailPollTimers()
})
</script>

<style scoped lang="less">
:global(.smart-task-audit-detail-modal .vxe-modal--body) {
  padding: 0;
  overflow: hidden;
  background: #f5fbfb;
}

:global(.smart-task-audit-detail-modal .vxe-modal--content) {
  height: 100%;
  padding: 0;
  overflow: hidden;
  background: #f5fbfb;
}

.audit-detail-page {
  --audit-motion-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --audit-primary: #009c91;
  --audit-line: rgba(44, 190, 183, 0.34);
  --audit-layout-gap: 16px;
  position: relative;
  isolation: isolate;
  display: flex;
  gap: var(--audit-layout-gap);
  width: 100%;
  height: 100%;
  padding: 16px 24px 16px 16px;
  overflow: hidden;
  box-sizing: border-box;
  color: #153f45;
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif;
  background: radial-gradient(circle at 74% 20%, rgba(95, 234, 212, 0.16), transparent 31%),
    radial-gradient(circle at 15% 94%, rgba(14, 139, 141, 0.1), transparent 34%), #f5fbfb;
  animation: audit-page-enter 520ms var(--audit-motion-ease) both;
}

.audit-detail-page::after {
  position: absolute;
  inset: 0;
  z-index: -1;
  content: '';
  pointer-events: none;
}

.audit-detail-page::after {
  opacity: 0.52;
  background: linear-gradient(110deg, transparent 12%, rgba(112, 255, 239, 0.14) 43%, transparent 64%);
  transform: translateX(-120%);
  animation: audit-page-scan 9s ease-in-out 1.2s infinite;
}

.audit-detail-column {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 2 1 0;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(47, 198, 191, 0.55);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 112, 107, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.65);
  animation: audit-panel-enter 560ms var(--audit-motion-ease) both;
}

.audit-detail-column::before {
  position: absolute;
  inset: 0;
  z-index: 2;
  content: '';
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: inherit;
  box-shadow: inset 0 0 22px rgba(90, 232, 218, 0.05);
}

.audit-detail-column:nth-child(2) {
  flex: 3 1 0;
  animation-delay: 90ms;
}

/* 左侧「项目基本信息」：外层白底描边，底图放在内层面板底部，避免文字被烘焙进图 */
.audit-detail-column:first-child {
  position: relative;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 253, 253, 0.96) 58%, rgba(240, 250, 249, 0.92) 100%);
  border-color: rgba(35, 190, 182, 0.58);
  border-left: 0;
  border-bottom: 0;
  box-shadow: 8px -8px 16px -12px rgba(0, 156, 145, 0.5), 0 8px 22px rgba(0, 112, 107, 0.11);
}

.audit-detail-column--review {
  position: relative;
  background: linear-gradient(180deg, #f3fbfa 0%, #eaf6f5 100%);
  box-shadow: inset 0 0 26px rgba(0, 112, 107, 0.07), -8px -8px 16px -12px rgba(0, 156, 145, 0.5), 0 8px 22px rgba(0, 112, 107, 0.14);
}

.audit-detail-title {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  flex: 0 0 56px;
  height: 56px;
  margin: 0;
  padding: 0 16px;
  box-sizing: border-box;
  color: #00484e;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
}

.audit-detail-title h2 {
  margin: 0;
  color: inherit;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0;
}

.audit-detail-title__icon {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  color: #009f91;
  filter: drop-shadow(0 0 7px rgba(0, 190, 177, 0.28));
  animation: audit-icon-pulse 3.8s ease-in-out infinite;
}

.audit-panel {
  min-height: 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  border: 0;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
}

.audit-panel--scroll {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin: 0 12px 16px 12px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.9);
  background-image: none;
  background-repeat: no-repeat;
  /* 设计稿 534x889 中城市场景约在下半区，真实分辨率下贴底并略放大，避免 1:1 硬抄裁切 */
  background-position: center bottom;
  background-size: 108% auto;
  border: 1px solid rgba(74, 195, 188, 0.28);
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

/* 仅第一个页签展示城市场景底图 + 顶部渐隐遮罩 */
.audit-panel--scroll-bg {
  background-color: rgba(255, 255, 255, 0.55);
  background-image: url('@/assets/images/smart-review/smart-grid-panel-bg.webp');
  background-image: image-set(
    url('@/assets/images/smart-review/smart-grid-panel-bg.webp') type('image/webp'),
    url('@/assets/images/smart-review/smart-grid-panel-bg.png') type('image/png')
  );
}

.audit-panel--scroll::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: '';
  pointer-events: none;
  background: transparent;
}

.audit-panel--scroll-bg::before {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.72) 0%,
    rgba(255, 255, 255, 0.42) 42%,
    rgba(255, 255, 255, 0.08) 72%,
    rgba(255, 255, 255, 0) 100%
  );
}

.audit-panel--scroll > * {
  position: relative;
  z-index: 1;
}

.project-tabs {
  display: flex;
  align-items: stretch;
  flex: 0 0 48px;
  min-width: 0;
  height: 48px;
  padding: 0;
  overflow: hidden;
  box-sizing: border-box;
  background: rgba(252, 255, 255, 0.88);
  border-bottom: 1px solid rgba(49, 192, 185, 0.36);
}

.project-tabs__track {
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  padding: 0 2px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.project-tabs__track::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.project-tabs__nav {
  display: none;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 100%;
  margin: 0;
  padding: 0;
  color: #2a8f88;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(236, 250, 248, 0.96) 100%);
  border: 0;
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, opacity 160ms ease;
}

.project-tabs--scrollable .project-tabs__nav {
  display: inline-flex;
}

.project-tabs__nav:hover:not(:disabled) {
  color: #008d83;
  background: rgba(225, 251, 248, 0.95);
}

.project-tabs__nav:disabled {
  color: rgba(42, 77, 82, 0.28);
  cursor: not-allowed;
  opacity: 0.55;
}

.project-tabs__nav--prev {
  border-right: 1px solid rgba(49, 192, 185, 0.22);
}

.project-tabs__nav--next {
  border-left: 1px solid rgba(49, 192, 185, 0.22);
}

.project-tabs__nav-icon {
  width: 18px;
  height: 18px;
}

.project-tabs .audit-tab-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: max-content;
  height: 48px;
  margin: 0;
  padding: 0 16px;
  color: #2a4d52;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  box-shadow: none;
  transition: color 160ms ease, background-color 160ms ease;
}

.project-tabs .audit-tab-btn:hover {
  color: #008d83;
  background: rgba(225, 251, 248, 0.4);
}

.project-tabs .audit-tab-btn.active {
  color: #008d83;
  font-weight: 600;
  background: transparent;
  border-bottom: 3px solid #13bdb0;
}

.project-tabs .audit-tab-btn:focus-visible,
.project-tabs__nav:focus-visible {
  outline: 2px solid #0cb8ac;
  outline-offset: -3px;
}

.project-form {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 16px 16px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
  background: transparent;
  scrollbar-gutter: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 166, 159, 0.4) transparent;
  overscroll-behavior: contain;
}

.project-form::-webkit-scrollbar,
.audit-list::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.project-form::-webkit-scrollbar-thumb,
.audit-list::-webkit-scrollbar-thumb {
  background: rgba(34, 166, 159, 0.38);
  border-radius: 5px;
}

.project-form :deep(.dynamic-form-container),
.project-form :deep(.el-form) {
  display: block;
  width: 100%;
  height: auto;
  min-height: 0;
  margin: 0;
}

.project-form :deep(.el-row) {
  row-gap: 4px;
}

.project-form :deep(.el-col) {
  min-width: 0;
}

.project-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.project-form :deep(.el-form-item__label) {
  color: #294c51;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}

.project-form :deep(.el-form-item__content) {
  min-width: 0;
}

.project-form :deep(.el-input),
.project-form :deep(.el-select),
.project-form :deep(.el-date-editor),
.project-form :deep(.number-input),
.project-form :deep(.el-textarea) {
  width: 100%;
}

.project-form :deep(.el-input__inner),
.project-form :deep(.el-textarea__inner),
.project-form :deep(.number-input) {
  color: #263d43;
  background: rgba(242, 249, 249, 0.92);
  border: 1px solid rgba(91, 180, 177, 0.12);
  border-radius: 4px;
  box-shadow: none;
}

.project-form :deep(.el-input.is-disabled .el-input__inner),
.project-form :deep(.el-textarea.is-disabled .el-textarea__inner),
.project-form :deep(.number-input:disabled) {
  color: #2e454b;
  background: rgba(242, 249, 249, 0.92);
  border-color: rgba(91, 180, 177, 0.12);
  cursor: default;
  -webkit-text-fill-color: #2e454b;
}

.project-form :deep(.dynamic-upload),
.project-form :deep(.dynamic-upload-table),
.project-form :deep(.dynamic-upload-table .file-table) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.project-form__pane,
.project-comp {
  width: 100%;
  min-width: 0;
  min-height: 100%;
}

.project-empty,
.audit-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 180px;
  color: #537176;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}

.audit-review-stack {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  padding: 0;
  container-type: inline-size;
}

.audit-review-hero {
  position: relative;
  display: flex;
  flex: 0 0 clamp(252px, 26vh, 284px);
  flex-direction: column;
  min-height: clamp(252px, 26vh, 284px);
  margin: 0;
  /* 允许 tab 悬浮上浮阴影溢出，背景裁切改由 ::before 伪层承担 */
  overflow: visible;
  background: transparent;
  border: 0;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: -6px 7px 18px -10px rgba(0, 143, 137, 0.12);
  container-type: size;
  --audit-review-title-height: 56px;
  --audit-ai-agent-size: clamp(136px, min(10.2vw, 18.2vh), 200px);
  --audit-ai-agent-visible-bottom: clamp(112px, min(8.63vw, 15.4vh), 168px);
  --audit-ai-agent-right: clamp(64px, min(4.9vw, 8.72vh), 104px);
  --audit-ai-agent-top: calc(56.5% - var(--audit-ai-agent-visible-bottom));
}

@supports (height: 1cqh) {
  .audit-review-hero {
    --audit-ai-agent-size: clamp(138px, 62cqh, 198px);
    --audit-ai-agent-visible-bottom: clamp(117px, 52.5cqh, 168px);
    --audit-ai-agent-right: clamp(42px, 26.5cqh, 92px);
    --audit-ai-agent-top: calc(56.5cqh - var(--audit-ai-agent-visible-bottom));
  }
}

.audit-review-hero::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: '';
  pointer-events: none;
  overflow: hidden;
  background-color: #f7fdfd;
  background-image: url('@/assets/images/smart-review/ai-review-header-bg-circuit.webp');
  background-repeat: no-repeat;
  background-position: right center;
  /* 以设计稿高度等比缩放，避免宽屏下平台与立方体被 cover 过度放大。 */
  background-size: auto 100%;
  border-radius: 6px;
}

.audit-review-hero::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  content: '';
  pointer-events: none;
  background: repeating-linear-gradient(180deg, transparent 0, transparent 13px, rgba(34, 183, 174, 0.035) 14px, transparent 15px);
  border: 1px solid rgba(76, 207, 198, 0.3);
  border-radius: 6px;
  mask-image: linear-gradient(180deg, #000, transparent 86%);
  animation: audit-hero-scan 6s linear infinite;
}

.audit-detail-title--review {
  position: relative;
  z-index: 2;
  flex: 0 0 var(--audit-review-title-height);
  height: var(--audit-review-title-height);
  padding: 0 16px;
}

.audit-detail-title--review h2 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.audit-summary {
  --audit-summary-block-gap: 12px;
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: flex-start;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  margin: 0;
  /* 三张统计卡片上下使用与正文相同的间距 */
  padding: 12px 50% var(--audit-summary-block-gap) 24px;
  overflow: visible;
  box-sizing: border-box;
  background: transparent;
  border: 0;
  border-radius: 0;
}

.audit-summary::before {
  position: absolute;
  inset: 2px 10px 5px;
  z-index: 0;
  display: block;
  content: '';
  pointer-events: none;
  border: 1px solid rgba(57, 191, 185, 0.42);
  border-radius: 7px;
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 86%, rgba(0, 0, 0, 0.6) 95%, transparent 100%);
  mask-image: linear-gradient(90deg, #000 0%, #000 86%, rgba(0, 0, 0, 0.6) 95%, transparent 100%);
}

.audit-summary::after {
  display: none;
}

.audit-summary__content,
.audit-summary__header,
.audit-summary__desc,
.audit-summary-metrics {
  position: relative;
  z-index: 1;
}

.audit-summary__content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  /* desc 与 metrics 间距 = metrics 下方间距（summary padding-bottom） */
  gap: var(--audit-summary-block-gap);
  min-width: 0;
  min-height: 0;
  padding: 0;
}

.audit-summary__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  min-width: 0;
  margin-bottom: 0;
}

.audit-summary__title {
  color: #0b444a;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.audit-summary__review {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 0 0 auto;
  min-width: 96px;
  min-height: 32px;
  padding: 0 12px;
  box-sizing: border-box;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid currentColor;
  border-radius: 999px;
}

.audit-summary__review-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  color: currentColor;
  stroke: #fff;
}

.audit-summary__review--info {
  color: #718489;
  border-color: #aebfc2;
}

.audit-summary__review--primary-blue {
  color: #0389c5;
  border-color: #67c9e8;
}

.audit-summary__review--success {
  color: #32a84a;
  border-color: #92d9a0;
}

.audit-summary__review--danger {
  color: #ff4242;
  border-color: #ff9e9e;
}

.audit-summary__review--warning-orange,
.audit-summary__review--yellow {
  color: #ff8b15;
  border-color: #ffc477;
}

.audit-summary__desc {
  display: flex;
  /* 按内容高度排布，避免 flex 撑开后把 metrics 上下间距拉得不一致 */
  flex: 0 1 auto;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
  min-height: 0;
  max-height: 100%;
  margin: 0;
  overflow-x: hidden;
  overflow-y: auto;
  color: #29464c;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 166, 159, 0.34) transparent;
}

.audit-summary__error {
  color: #d45228;
}

.audit-summary__conclude {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-summary__conclude :deep(.typewriter),
.audit-summary__conclude :deep(p),
.audit-summary__conclude :deep(span),
.audit-summary__conclude :deep(div) {
  display: inline;
  margin: 0;
  padding: 0;
  line-height: inherit;
}

.audit-summary__visual {
  position: absolute;
  top: var(--audit-ai-agent-top);
  right: var(--audit-ai-agent-right);
  z-index: 4;
  display: block;
  width: var(--audit-ai-agent-size);
  height: var(--audit-ai-agent-size);
  pointer-events: none;
  opacity: 0;
  transform-origin: center;
  /* 静态阴影替代动画 filter:drop-shadow，降低 GPU 光栅成本 */
  filter: drop-shadow(0 10px 18px rgba(0, 171, 178, 0.28));
  user-select: none;
  animation: audit-summary-cube-enter 520ms var(--audit-motion-ease) 80ms both, audit-summary-cube-float 4.8s ease-in-out 600ms infinite;
}

.audit-summary__cube {
  position: absolute;
  display: block;
  pointer-events: none;
}

.audit-summary__cube {
  inset: 0;
  z-index: 2;
  transform-origin: center;
}

.audit-summary__cube img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: audit-summary-cube-tilt 7.5s ease-in-out 1.1s infinite;
  transform-origin: center;
}

@keyframes audit-summary-cube-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 12px, 0) scale(0.93);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes audit-summary-cube-float {
  0%,
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(-0.25deg) scale(1);
  }

  50% {
    opacity: 0.98;
    transform: translate3d(-4px, -10px, 0) rotate(0.8deg) scale(1.02);
  }
}

@keyframes audit-summary-cube-tilt {
  0%,
  100% {
    transform: rotate3d(0, 1, 0, -1.5deg) rotate3d(1, 0, 0, 1deg);
  }

  50% {
    transform: rotate3d(0, 1, 0, 2deg) rotate3d(1, 0, 0, -1.5deg);
  }
}

.audit-review-panel {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  margin: 0 12px 12px;
  padding: 0;
  overflow: hidden;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.audit-review-panel::before {
  display: none;
  position: absolute;
  top: 0;
  right: 14%;
  left: 10px;
  height: 1px;
  content: '';
  background: linear-gradient(90deg, transparent, rgba(75, 228, 213, 0.78), transparent);
  opacity: 0.8;
  animation: audit-line-breathe 3.2s ease-in-out infinite;
}

.audit-review-panel::after {
  display: none;
}

.audit-review-panel :deep(.audit-list) {
  --section-x: 0px;
  --level-column: 104px;
  --result-column: 216px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0;
  scrollbar-gutter: auto;
}

.audit-review-panel :deep(.audit-rule-section:last-child) {
  margin-bottom: 0;
}

.audit-review-panel :deep(.audit-collapse) {
  flex: 1 0 auto;
  width: 100%;
  min-height: 100%;
  margin: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  transform: none;
  transition: none;
}

.audit-review-panel :deep(.audit-collapse:hover) {
  box-shadow: none;
  transform: none;
}

.audit-review-panel :deep(.audit-rule-group--header) {
  position: relative;
  margin-right: 0;
  overflow: hidden;
  background: linear-gradient(105deg, #f8ffff 0%, #dff6f2 47%, #eafcff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.98), 0 3px 8px rgba(29, 144, 138, 0.14);
}

.audit-review-panel :deep(.audit-collapse-title) {
  position: relative;
  border-color: rgba(88, 168, 164, 0.2);
  box-shadow: 0 3px 8px rgba(31, 139, 133, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.96);
  transition: none;
}

.audit-review-panel :deep(.audit-collapse-title:hover) {
  border-color: rgba(88, 168, 164, 0.28);
  box-shadow: 0 7px 14px rgba(31, 139, 133, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.98);
  transform: none;
}

.audit-review-panel :deep(.audit-status) {
  box-shadow: 0 3px 8px rgba(34, 126, 121, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.audit-review-panel :deep(.audit-rule-section__side),
.audit-review-panel :deep(.audit-collapse-title) {
  min-height: 56px;
}

/* 风险等级合计：放在结论内容容器内，按内容宽度排布，不占满整行；略下移以贴近下方页签 */
.audit-summary-metrics {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  width: auto;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.audit-summary-metric {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  flex: 0 0 auto;
  width: auto;
  min-width: 0;
  min-height: 32px;
  padding: 4px 12px;
  overflow: hidden;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid transparent;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(16, 107, 103, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.92);
  transform: translate3d(0, 0, 0);
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms var(--audit-motion-ease);
}

.audit-summary-metric::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -45%;
  z-index: 0;
  width: 34%;
  content: '';
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.76), transparent);
  transform: skewX(-18deg);
  animation: audit-card-sheen 7s ease-in-out 900ms infinite;
}

.audit-summary-metric > * {
  position: relative;
  z-index: 1;
}

.audit-summary-metric:nth-child(2)::after {
  animation-delay: 1.55s;
}

.audit-summary-metric:nth-child(3)::after {
  animation-delay: 2.2s;
}

.audit-summary-metric:hover {
  box-shadow: 0 7px 14px rgba(16, 107, 103, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.96);
  transform: translate3d(0, -2px, 0);
}

.audit-summary-metric__icon {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  color: currentColor;
}

.audit-summary-metric__label {
  flex: 0 0 auto;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}

.audit-summary-metric__count {
  display: inline-flex;
  align-items: baseline;
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.audit-summary-metric__unit {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
  opacity: 0.85;
}

.audit-summary-metric--danger {
  background: linear-gradient(145deg, rgba(255, 248, 247, 0.96) 0%, rgba(255, 236, 234, 0.9) 100%);
  border-color: rgba(255, 111, 102, 0.28);
  color: #e03b3b;

  .audit-summary-metric__label,
  .audit-summary-metric__count {
    color: #e03b3b;
  }
}

.audit-summary-metric--warning {
  background: linear-gradient(145deg, rgba(255, 250, 244, 0.96) 0%, rgba(255, 239, 220, 0.9) 100%);
  border-color: rgba(255, 139, 21, 0.3);
  color: #e07a12;

  .audit-summary-metric__label,
  .audit-summary-metric__count {
    color: #e07a12;
  }
}

.audit-summary-metric--primary {
  background: linear-gradient(145deg, rgba(255, 253, 244, 0.96) 0%, rgba(255, 246, 214, 0.9) 100%);
  border-color: rgba(212, 168, 28, 0.32);
  color: #b8860b;

  .audit-summary-metric__label,
  .audit-summary-metric__count {
    color: #b8860b;
  }
}

.audit-tabs {
  --audit-tab-slant: clamp(16px, min(1.434vw, 2.55vh), 24px);
  --audit-tab-quarter-overlap: clamp(6px, min(1.076vw, 1.913vh), 12px);
  /* 斜切后的视觉缝：用负 margin 抵消 clip-path 空角，视口最多容纳四个页签 */
  --audit-tab-gap: 8px;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  gap: 0;
  flex: 0 0 48px;
  min-width: 0;
  width: 73.5%;
  height: 48px;
  /* 收紧与上方合计条的间距，避免页签悬空感 */
  margin: 8px 0 0 12px;
  padding: 0;
  overflow: visible;
  box-sizing: border-box;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  perspective: 720px;
}

.audit-tabs__track {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.audit-tabs__track::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.audit-tabs__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 calc(25% + var(--audit-tab-quarter-overlap));
  min-width: 0;
  height: calc(100% - 4px);
  min-height: 0;
  margin: 0;
  padding: 0 calc(var(--audit-tab-slant) + 4px);
  overflow: visible;
  box-sizing: border-box;
  color: #0a4f54;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
  /* 提高饱和度，避免未选中态发灰发淡 */
  background: linear-gradient(165deg, #e6f7f5 0%, #c8ebe6 48%, #a9ddd6 100%);
  border: 0;
  border-radius: 0;
  /* 默认平行四边形：与第一个 tab 反方向斜切；clip-path 会裁掉 box-shadow，立体感用 filter:drop-shadow */
  clip-path: polygon(0 0, calc(100% - var(--audit-tab-slant)) 0, 100% 100%, var(--audit-tab-slant) 100%);
  cursor: pointer;
  filter: drop-shadow(0 2px 5px rgba(0, 120, 114, 0.16));
  transform: translate3d(0, 0, 0);
  transform-style: preserve-3d;
  transition: color 180ms ease, background 180ms ease, transform 220ms var(--audit-motion-ease);
}

/* 后续 tab 左移，抵消斜切空角，只保留 --audit-tab-gap 细缝 */
.audit-tabs__tab + .audit-tabs__tab {
  margin-left: calc(0px - var(--audit-tab-slant) + var(--audit-tab-gap));
}

/* 第一个 tab 恢复原梯形样式：左边竖直、右边斜切。 */
.audit-tabs__tab:nth-child(1) {
  clip-path: polygon(0 0, calc(100% - var(--audit-tab-slant)) 0, 100% 100%, 0 100%);
}

/* 内高光 + 描边（不受 clip-path 外阴影影响） */
.audit-tabs__tab::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: '';
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 42%);
  box-shadow: inset 0 0 0 1px rgba(0, 156, 145, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

/* 选中下划线：与 tab 底边同宽 */
.audit-tabs__tab::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  height: 3px;
  content: '';
  background: transparent;
  box-shadow: none;
  transition: background 180ms ease, box-shadow 180ms ease;
}

.audit-tabs__tab > * {
  position: relative;
  z-index: 2;
}

.audit-tabs__tab:focus-visible,
.audit-tabs__nav:focus-visible {
  outline: 2px solid #0cb8ac;
  outline-offset: -3px;
}

.audit-tabs__tab:hover:not(.active) {
  z-index: 2;
  color: #04363a;
  background: linear-gradient(165deg, #f0fbf9 0%, #bfe9e3 52%, #96d8cf 100%);
  filter: drop-shadow(0 6px 10px rgba(0, 130, 124, 0.2));
  transform: translate3d(0, -2px, 2px);
}

/* 选中态：悬浮立体效果 */
.audit-tabs__tab.active {
  z-index: 3;
  color: #023033;
  font-weight: 600;
  background: linear-gradient(160deg, #ffffff 0%, #c9f3ec 42%, #7fd9cb 100%);
  filter: drop-shadow(0 10px 14px rgba(0, 130, 124, 0.26)) drop-shadow(0 3px 0 rgba(0, 143, 137, 0.18)) drop-shadow(0 1px 0 rgba(255, 255, 255, 0.85));
  transform: translate3d(0, -3px, 9px) rotateX(5deg);
}

.audit-tabs__tab.active::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.06) 48%, rgba(0, 156, 145, 0.1) 100%);
  box-shadow: inset 0 0 0 1px rgba(0, 156, 145, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.98), inset 0 -10px 18px rgba(0, 156, 145, 0.12);
}

.audit-tabs__tab.active::after {
  background: #009c91;
  box-shadow: 0 -1px 6px rgba(0, 156, 145, 0.48);
}

.audit-tabs__tab.active:hover {
  filter: drop-shadow(0 14px 18px rgba(0, 130, 124, 0.26)) drop-shadow(0 4px 0 rgba(0, 143, 137, 0.16));
  transform: translate3d(0, -5px, 11px) rotateX(6deg);
}

.audit-tabs__nav {
  position: relative;
  z-index: 2;
  display: none;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  width: 44px;
  height: calc(100% - 4px);
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  color: #0a4f54;
  background: linear-gradient(165deg, #e6f7f5 0%, #c8ebe6 48%, #a9ddd6 100%);
  border: 0;
  border-radius: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 156, 145, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.72);
  cursor: pointer;
  filter: drop-shadow(0 2px 5px rgba(0, 120, 114, 0.16));
  transition: color 180ms ease, background 180ms ease, filter 180ms ease, opacity 180ms ease;
}

.audit-tabs--scrollable .audit-tabs__nav {
  display: inline-flex;
}

.audit-tabs__nav:hover:not(:disabled) {
  color: #04363a;
  background: linear-gradient(165deg, #f0fbf9 0%, #bfe9e3 52%, #96d8cf 100%);
  filter: drop-shadow(0 5px 8px rgba(0, 130, 124, 0.2));
}

.audit-tabs__nav:disabled {
  color: rgba(10, 79, 84, 0.34);
  cursor: not-allowed;
  filter: none;
  opacity: 0.62;
}

.audit-tabs__nav--prev {
  z-index: 4;
  padding-left: 4px;
  border-right: 1px solid rgba(0, 156, 145, 0.24);
  clip-path: polygon(var(--audit-tab-slant) 0, 100% 0, 100% 100%, 0 100%);
}

.audit-tabs__nav--next {
  z-index: 4;
  margin-left: calc(0px - var(--audit-tab-slant));
  padding-left: var(--audit-tab-slant);
  border-left: 1px solid rgba(0, 156, 145, 0.24);
  clip-path: polygon(0 0, 100% 0, 100% 100%, var(--audit-tab-slant) 100%);
}

.audit-tabs__nav-icon {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
}

@keyframes audit-page-enter {
  from {
    opacity: 0;
    transform: scale(0.992);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes audit-panel-enter {
  from {
    opacity: 0;
    transform: translateY(10px) rotateX(1deg);
  }

  to {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}

@keyframes audit-page-scan {
  0%,
  18% {
    transform: translateX(-120%);
  }

  52%,
  100% {
    transform: translateX(120%);
  }
}

@keyframes audit-icon-pulse {
  0%,
  100% {
    opacity: 0.82;
    transform: scale(0.98);
  }

  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}

@keyframes audit-line-breathe {
  0%,
  100% {
    opacity: 0.28;
    transform: scaleX(0.72);
    transform-origin: left center;
  }

  50% {
    opacity: 0.95;
    transform: scaleX(1);
  }
}

@keyframes audit-card-sheen {
  0%,
  28% {
    left: -45%;
  }

  58%,
  100% {
    left: 125%;
  }
}

@keyframes audit-hero-scan {
  from {
    background-position: 0 -24px;
  }

  to {
    background-position: 0 24px;
  }
}

.audit-tab__name {
  position: relative;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  padding-right: 20px;
  line-height: 1;
}

.audit-tab__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-tab__badge {
  position: absolute;
  /* 挪入斜切页签的安全区域，避免被按钮自身的 clip-path 裁掉。 */
  top: -8px;
  right: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  box-sizing: border-box;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  background: #ff6f66;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(222, 74, 65, 0.24);
}

@container (max-width: 980px) {
  .audit-summary {
    padding-right: 40%;
  }

  .audit-summary__visual {
    right: var(--audit-ai-agent-right);
  }
}

@container (max-width: 760px) {
  .audit-review-hero {
    flex-basis: clamp(252px, 26vh, 276px);
    min-height: clamp(252px, 26vh, 276px);
  }

  .audit-summary {
    --audit-summary-block-gap: 12px;
    margin: 0;
    padding: 8px 38% var(--audit-summary-block-gap) 16px;
  }

  .audit-summary__header {
    gap: 12px;
  }

  .audit-summary__title {
    font-size: 18px;
  }

  .audit-summary__review {
    min-width: 96px;
    padding: 0 12px;
    font-size: 12px;
  }

  .audit-summary__desc {
    gap: 8px;
    min-height: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  .audit-summary__visual {
    top: var(--audit-ai-agent-top);
    right: var(--audit-ai-agent-right);
    width: var(--audit-ai-agent-size);
    height: var(--audit-ai-agent-size);
  }

  .audit-tabs {
    width: calc(100% - 24px);
    margin-left: 12px;
  }

  .audit-summary-metrics {
    width: auto;
    max-width: 100%;
    margin: 0;
    gap: 8px;
  }

  .audit-summary-metric {
    min-height: 32px;
    padding: 4px 12px;
  }

  .audit-summary-metric__icon {
    width: 16px;
    height: 16px;
  }

  .audit-summary-metric__label {
    font-size: 12px;
  }

  .audit-summary-metric__count {
    font-size: 18px;
  }

  .audit-tabs__tab {
    padding: 0 calc(var(--audit-tab-slant) + 2px);
    font-size: 14px;
  }

  .audit-tabs__tab.active {
    transform: translate3d(0, -3px, 8px) rotateX(5deg);
  }

  .audit-tabs__tab.active:hover {
    transform: translate3d(0, -4px, 10px) rotateX(6deg);
  }
}

/* 上层弹窗（规则详情 / 文件预览）打开时冻结底层装饰动效：
   用 animation-play-state 而非 animation: none，保留立方体等当前帧位置，关闭后原地续播不跳变 */
.audit-detail-page--motion-paused::after,
.audit-detail-page--motion-paused .audit-detail-title__icon,
.audit-detail-page--motion-paused .audit-review-hero::after,
.audit-detail-page--motion-paused .audit-review-panel::before,
.audit-detail-page--motion-paused .audit-summary__visual,
.audit-detail-page--motion-paused .audit-summary__cube img,
.audit-detail-page--motion-paused .audit-summary-metric::after {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .audit-detail-page,
  .audit-detail-column,
  .audit-detail-page::after,
  .audit-detail-title__icon,
  .audit-review-panel::before,
  .audit-summary-metric::after,
  .audit-review-hero::after {
    animation: none;
  }

  .audit-detail-page,
  .audit-detail-column {
    transform: none;
  }

  .audit-summary__visual {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .audit-summary__cube img,
  .audit-summary__visual {
    animation: none;
  }

  .audit-summary-metric,
  .audit-summary-metric:hover {
    transform: none;
    transition: none;
  }

  .audit-tabs__tab,
  .audit-tabs__tab:hover:not(.active),
  .audit-tabs__tab.active,
  .audit-tabs__tab.active:hover,
  .audit-tabs__nav {
    transform: none;
    filter: none;
    transition: color 160ms ease, background 160ms ease;
  }
}
</style>
