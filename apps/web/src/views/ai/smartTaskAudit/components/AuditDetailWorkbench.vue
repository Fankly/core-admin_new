<template>
  <div class="review-workbench audit-detail-workbench">
    <main
      ref="previewStageRef"
      class="review-detail"
      :class="{ 'review-detail--preview-open': isPreviewOpen }"
      :style="{ '--preview-drawer-width': previewWidthStyle }"
    >
      <ProjectSummary
        :project="workbenchProject"
        :expanded="projectInfoExpanded"
        :audit-summary="auditSummary"
        :summary-loading="summaryLoading"
        :exporting="exportingSummary"
        :conclusion-class="conclusionClass"
        :show-project-more="showProjectMore"
        :show-project-info="showProjectInfo"
        detail-summary
        :risk-standards="riskStandards"
        :risk-levels="riskLevelStats"
        @toggle="projectInfoExpanded = !projectInfoExpanded"
        @show-more="$emit('show-project-more')"
        @retry="retrySummary"
        @export="exportSummary"
        @select-risk-level="selectRiskLevel"
        @navigate-price-view="handlePriceViewNavigate"
      />
      <div class="review-workspace-stage">
        <RuleWorkspace
          ref="ruleWorkspaceRef"
          :project-task-id="projectTaskId"
          :selected-rules="rules"
          :filtered-rules="filteredRules"
          :selected-rule="selectedRule"
          :rule-filters="ruleFilters"
          :rule-classifies="ruleClassifies"
          :active-rule-filter="activeRuleFilter"
          :rules-loading="rulesLoading"
          :rule-detail-loading="ruleDetailLoading"
          :rule-empty-text="ruleEmptyText"
          :rule-error-text="ruleLoadError"
          :preview-open="isPreviewOpen"
          :loading-attach-id="previewLoadingAttachId"
          :can-rerun="canRerun"
          :rerunning-rule-ids="rerunningRuleIds"
          :rerun-confirming-rule-id="rerunConfirmingRuleId"
          :hide-pass="hidePassRules"
          :show-hide-pass="!initialDetailId.trim()"
          @filter-change="changeRuleFilter"
          @toggle-hide-pass="toggleHidePassRules"
          @select-rule="selectRule"
          @rerun-rule="rerunRule"
          @rerun-rule-new="rerunRule1"
          @rerun-point="rerunReviewPoint"
          @preview-attach="openMaterialPreview"
          @reload-rules="reloadRules"
          @manual-review-submitted="refreshAfterManualReview"
          @navigate-price-view="handlePriceViewNavigate"
        />
      </div>
      <DocumentPreviewPanel
        v-if="isPreviewOpen"
        ref="previewPanelRef"
        :visible="isPreviewOpen"
        :loading="previewLoading"
        :error-text="previewErrorText"
        :source="previewSource"
        :file-name="previewFileName"
        :file-type="previewFileType"
        :width="previewWidthStyle"
        :width-value="previewWidthValue"
        :min-width="previewMinWidth"
        :max-width="previewMaxWidth"
        :pdf-options="previewPdfOptions"
        :toolbar-options="previewToolbarOptions"
        @close="closePreview"
        @reload="reloadPreview"
        @error="handlePreviewError"
        @resize-start="startPreviewResize"
        @resize-keydown="handlePreviewResizeKeydown"
        @reset-width="resetPreviewWidth"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'

import { computed, inject, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import { getPublicData } from '@/api/common'
import {
  getRuleReview,
  listCategoryRuleReview,
  listRuleReviewNew,
  getXmAuditConclude,
  redoAuditRule,
  exportTaskDetail
} from '@/api/ai/smartTaskAudit'
import type { RuleReviewInfo, RuleReviewInfoRes, TXmAttach } from '@/api/ai/smartTaskAudit'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { AIRiskLevelDict } from '@/staticDict/index.js'
import ProjectSummary from '../../workbenchView/components/ProjectSummary.vue'
import RuleWorkspace from '../../workbenchView/components/RuleWorkspace.vue'
import DocumentPreviewPanel from '../../workbenchView/components/DocumentPreviewPanel.vue'
import { useDocumentPreviewDrawer } from '../../workbenchView/composables/useDocumentPreviewDrawer'
import { getRuleRerunKey, useRuleRerun } from '../../workbenchView/composables/useRuleRerun'
import { useRuleClassifies } from '../../workbenchView/composables/useRuleClassifies'
import type { ReviewRule, RuleResult, WorkbenchAuditSummary, WorkbenchFilterOption, WorkbenchProject } from '../../workbenchView/types'
import {
  auditRiskLevelConfigs,
  auditRiskLevelToneByName,
  auditRiskLevelToneByCode,
  auditConclusionClass,
  auditSummaryLevelConfigs,
  auditSummaryRuleLevelAliasMap,
  getAuditRiskLevelName,
  normalizeAuditSummaryData,
  normalizeReviewTables,
  openPopPage
} from './auditDetailHelpers'
import type { AuditPriceViewPayload } from './auditDetailHelpers'
import { normalizeOptionList } from '../utils'
import { apiExportHandle } from '@/utils/export'
import type { SmartTaskAuditRow } from '../types'

const AUDIT_RESULT_PUBLIC_CODE = 'AI_AUDIT_RESULT_COM'
/** 风险分级判定口径字典（「分级标准怎么定？」弹层内容，2026-10-12 需求） */
const RISK_STANDARD_PUBLIC_CODE = 'AI_AUDIT_TASK_RESULT_DECOMPOSE_COM'
const PRICE_LIBRARY_PATH = '/ai/materialPriceLibrary/index'
/** 审核意见名称 → 规则结果；规则状态以 reviewOpinionName（通过/不通过/待复核）为准 */
const RULE_RESULT_NAME_MAP: Record<string, RuleResult> = {
  通过: 'passed',
  不通过: 'failed',
  待复核: 'warning'
}
const RULE_LEVEL_LABEL_MAP = new Map(auditSummaryLevelConfigs.map((item) => [item.ruleLevel, item.label]))
const FALLBACK_AUDIT_RESULT_MAP = new Map(AIRiskLevelDict.getList().map((item: any) => [String(item.id), item]))

const props = withDefaults(
  defineProps<{
    active: boolean
    detailRow: SmartTaskAuditRow
    reviewOpinions?: string
    projectInfoApi?: string
    showProjectMore?: boolean
    /** 为 false 时隐藏「项目基本信息」卡片，宿主页已有项目信息时使用 */
    showProjectInfo?: boolean
    canRerun?: boolean
    /** 单规则详情入口：传入后规则列表只展示该规则并默认选中，空字符串表示展示全部规则 */
    initialDetailId?: string
  }>(),
  {
    reviewOpinions: '',
    projectInfoApi: '',
    showProjectMore: true,
    showProjectInfo: true,
    canRerun: true,
    initialDetailId: ''
  }
)

defineEmits(['show-project-more'])

const createEmptySummary = (): WorkbenchAuditSummary => ({
  conclusion: '',
  statusText: '',
  statusTone: '',
  counts: { '1': { count: 0 }, '2': { count: 0 }, '3': { count: 0 } }
})

const emptyRule: ReviewRule = {
  id: '',
  code: '',
  ruleLevel: '',
  category: '',
  name: '暂无评审规则',
  result: '',
  level: '',
  ruleDesc: '',
  description: '',
  auditResult: '',
  analysisProcess: '',
  reviewMessage: '',
  points: [],
  extracted: '',
  requirement: '',
  conclusion: '',
  document: '',
  page: 0,
  section: '',
  before: '',
  source: '',
  after: ''
}

const sessionDetailRow = shallowRef<SmartTaskAuditRow>({})
const projectInfoExpanded = ref(false)
const activeRuleFilter = ref('')
/**
 * 「不看通过规则」：只看「不通过 / 待复核 / 不执行」的规则（照原型，页签计数与列表同步联动）。
 * 默认**开启**（需求 2026-10-13）：详情页第一眼该看的是有问题的规则，通过的规则要主动点开关才看。
 */
const hidePassRules = ref(true)
const selectedRuleId = ref('')
const rules = shallowRef<ReviewRule[]>([])
const auditSummary = shallowRef<WorkbenchAuditSummary>(createEmptySummary())
const auditResultOptions = shallowRef<any[]>([])
/** 风险分级判定口径（字典 AI_AUDIT_TASK_RESULT_DECOMPOSE_COM），传给「分级标准怎么定？」弹层 */
const riskStandards = shallowRef<any[]>([])
const rulesLoading = ref(false)
const ruleDetailLoading = ref(false)
const summaryLoading = ref(false)
const ruleEmptyText = ref('请选择任务查看评审信息')
/** 规则列表加载失败的原因；非空时列表区渲染错误态并提供重新加载 */
const ruleLoadError = ref('')
const previewStageRef = ref<HTMLElement | null>(null)
const previewPanelRef = ref<InstanceType<typeof DocumentPreviewPanel> | null>(null)
const ruleWorkspaceRef = ref<InstanceType<typeof RuleWorkspace> | null>(null)

/**
 * 「不看通过规则」的判据：`listCategoryRuleReview` 行上的 **reviewOpinion 码值不等于 '1'**（1 = 通过）。
 * 按码值判，不用按名称推导出来的 result —— 接口实测会少给 reviewOpinionName，
 * 那种行按名称推不出结果，会被「不看通过」漏掉。
 */
const isPassedRule = (rule: ReviewRule) => String(rule.reviewOpinion ?? '').trim() === '1'

/**
 * 左栏页签按**规则分级**区分，标签**由数据动态生成**（需求 2026-10-13）：
 * 不再写死「问题类规则 / 预警类规则 / 异常类规则」，而是取 `listCategoryRuleReview` 各行
 * `ruleLevelName` 的**去重集合**（这就是「按 ruleLevelName 分类统计」的口径）。
 * 顺序：已知等级按分级配置的顺序（问题 → 预警 → 异常），数据里冒出的其它等级名按首次出现顺序排后面。
 * 条数跟随「不看通过规则」开关联动 —— 显示的条数 = 点进去会看到的条数。
 */
const riskLevelNames = computed<string[]>(() => {
  const seen = new Set<string>()
  const names: string[] = []
  rules.value.forEach((rule) => {
    const name = ruleLevelNameOf(rule)
    if (name && !seen.has(name)) {
      seen.add(name)
      names.push(name)
    }
  })
  const known = auditRiskLevelConfigs.map((level) => String(level.name)).filter((name) => seen.has(name))
  return [...known, ...names.filter((name) => !known.includes(name))]
})

const isRiskFinding = (rule: ReviewRule) => ['0', '2'].includes(String(rule.reviewOpinion ?? '').trim())

/**
 * 顶部「总体评审情况」右侧的分级计数：档位与左栏页签同源（动态等级，去掉「全部」），
 * 数字按需求口径 = **reviewOpinion 为 0（不通过）或 2（待复核）的规则数**（与页签的过滤口径不同，
 * 页签计数还受「不看通过规则」开关影响，这里始终是这两档的全量）。
 * 名称用接口实际下发的 ruleLevelName；配色按 ruleLevel 码值（1→红 / 2→橙 / 3→黄），与名称变化无关。
 */
const riskLevelStats = computed(() =>
  riskLevelNames.value.map((name) => {
    const matched = rules.value.filter((rule) => ruleLevelNameOf(rule) === name)
    // 取该名称下第一条非空 ruleLevel 码值定配色（同名称各条的 ruleLevel 码值应一致）
    const code = matched.find((rule) => String(rule?.ruleLevel ?? '').trim())?.ruleLevel ?? ''
    return {
      name,
      tone: auditRiskLevelToneByCode(String(code).trim()),
      count: matched.filter((rule) => isRiskFinding(rule)).length
    }
  })
)

const ruleFilters = computed<WorkbenchFilterOption[]>(() => {
  if (props.initialDetailId.trim()) return [{ label: '全部', value: '' }]
  const base = hidePassRules.value ? rules.value.filter((rule) => !isPassedRule(rule)) : rules.value
  return [
    { label: '全部', value: '', count: base.length },
    ...riskLevelNames.value.map((name) => ({
      label: `${name}类规则`,
      value: name,
      count: base.filter((rule) => ruleLevelNameOf(rule) === name).length
    }))
  ]
})

/**
 * 点顶部「问题/预警/异常」计数或「问题项目」徽标。
 * 计数是开关语义（同一档再点一次取消），徽标是跳转语义（toggle=false，始终落在该档）。
 */
const selectRiskLevel = (name: string, toggle = true) => {
  changeRuleFilter(toggle && activeRuleFilter.value === name ? '' : name)
}
const toggleHidePassRules = () => {
  hidePassRules.value = !hidePassRules.value
  syncSelectedRuleToFilter()
}

const { ruleClassifies, applyRuleClassifies, resetRuleClassifies } = useRuleClassifies()
const {
  visible: isPreviewOpen,
  loading: previewLoading,
  loadingDocumentId: previewLoadingAttachId,
  errorText: previewErrorText,
  source: previewSource,
  fileName: previewFileName,
  fileType: previewFileType,
  widthStyle: previewWidthStyle,
  widthValue: previewWidthValue,
  minWidth: previewMinWidth,
  maxWidth: previewMaxWidth,
  pdfOptions: previewPdfOptions,
  toolbarOptions: previewToolbarOptions,
  open: openPreview,
  close: closePreview,
  reload: reloadPreview,
  clearDocumentCache: clearPreviewCache,
  resetWidth: resetPreviewWidth,
  startResize: startPreviewResize,
  handleResizeKeydown: handlePreviewResizeKeydown,
  handleError: handlePreviewError
} = useDocumentPreviewDrawer(previewStageRef)

const openMaterialPreview = (file: TXmAttach, trigger?: HTMLElement | null) => {
  void openPreview(file, trigger)
}

watch(isPreviewOpen, (visible) => {
  if (visible) {
    void nextTick(() => previewPanelRef.value?.focus({ preventScroll: true }))
  } else {
    // 关闭预览弹窗后重新加载评审规则、审核要点和审核依据
    const taskId = projectTaskId.value
    if (props.active && taskId) {
      const currentSession = sessionSeq
      rules.value = []
      auditSummary.value = createEmptySummary()
      // 与初始加载一致：先审核结论再规则列表
      void loadSummary(taskId, currentSession).then(() => {
        if (!isSessionActive(currentSession, taskId)) return
        void loadRules(taskId, currentSession)
      })
    }
  }
})

/** 宿主未 provide 时（如 CentralizedModification 内嵌）显式给 undefined，避免 Vue 注入缺失告警 */
const currentUserRole = inject<Ref<UserRole> | undefined>(CurrentUserRoleInjectionKey, undefined)

/** 点击 .gwPriceView / .materialNewestPriceView：新标签页打开物料价格库对应 tab，携带当前角色 spRoleId 供目标页比对 */
const handlePriceViewNavigate = (payload: AuditPriceViewPayload) => {
  const tab = payload.type === 'gwPriceView' ? 'materialPriceLibrary' : 'historyPriceSummary'
  const spRoleId = currentUserRole?.value?.spRoleId || ''
  openPopPage(PRICE_LIBRARY_PATH, spRoleId ? { tab, spRoleId } : { tab })
}

let sessionSeq = 0
let ruleListSeq = 0
let ruleDetailSeq = 0
let summarySeq = 0
let pointsSeq = 0

const getRowValue = (row: SmartTaskAuditRow, ...keys: string[]) => {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') return value
  }
  return ''
}

const workbenchProject = computed<WorkbenchProject>(() => {
  const row = sessionDetailRow.value
  const projectId = String(getRowValue(row, 'proId', 'xmId', 'xmid', 'id', 'ID')).trim()
  const projectType = String(getRowValue(row, 'proType', 'pro_type_id', 'proTypeId', 'xmlx', 'XMLX', 'PRO_TYPE')).trim()
  const numericId = Number(getRowValue(row, 'id'))
  return {
    ...row,
    ...(Number.isFinite(numericId) ? { id: numericId } : {}),
    taskId: String(getRowValue(row, 'taskId')).trim(),
    xmId: projectId,
    proId: projectId,
    pro_type_id: projectType,
    xmmc: String(getRowValue(row, 'xmmc', 'XMMC', 'taskName', 'name')),
    xmbm: String(getRowValue(row, 'xmbm', 'XMBM')),
    proTypeName: String(getRowValue(row, 'proTypeName', 'xmlxName', 'XMLX_NAME', 'PRO_TYPE_NAME') || projectType),
    jhssnd: String(getRowValue(row, 'jhssnd', 'JHSSND')),
    // 名称优先、code 兜底：未通过清单等入口的行同时带 yjdw(code)+yjdwName(名称)，
    // 任务管理入口只带 code，两者都要展示可读名称而非编码。
    yjdw: String(getRowValue(row, 'yjdwName', 'YJDW_NAME', 'yjdw', 'YJDW')),
    ejdw: String(getRowValue(row, 'ejdwName', 'EJDW_NAME', 'ejdw', 'EJDW')),
    statusName: String(getRowValue(row, 'statusName', 'STATUS_NAME')),
    ruleName: String(getRowValue(row, 'ruleName', 'RULE_NAME')),
    priorityName: String(getRowValue(row, 'priorityName', 'PRIORITY_NAME')),
    docPreStatusName: String(getRowValue(row, 'docPreStatusName', 'DOC_PRE_STATUS_NAME')),
    createTime: String(getRowValue(row, 'createTime', 'CREATE_TIME')),
    startTime: String(getRowValue(row, 'startTime', 'START_TIME')),
    finishTime: String(getRowValue(row, 'finishTime', 'FINISH_TIME')),
    yssxName: String(getRowValue(row, 'yssxName', 'YSSX_NAME')),
    allInvestTax: getRowValue(row, 'allInvestTax', 'ALL_INVEST_TAX'),
    amount: getRowValue(row, 'amount', 'AMOUNT'),
    progress: Number(getRowValue(row, 'progress')) || 0,
    riskCount: Number(getRowValue(row, 'riskCount')) || 0
  }
})

const projectTaskId = computed(() => String(workbenchProject.value.taskId || ''))

/**
 * 规则的风险等级名：优先取接口实际下发的 **ruleLevelName**（如「提醒」），为空才按 ruleLevel
 * 码值兜底（1 问题 / 2 预警 / 3 异常）。配色始终按 ruleLevel 码值，与名称变化无关。
 */
const ruleLevelNameOf = (rule: ReviewRule) => {
  const name = String(rule?.ruleLevelName ?? '').trim()
  if (name) return name
  return getAuditRiskLevelName(rule)
}

/** 按规则等级码值取配色（1→danger红 / 2→warning橙 / 3→yellow黄）；码值缺失走中性灰 */
const ruleLevelToneOf = (rule: ReviewRule) => auditRiskLevelToneByCode(String(rule?.ruleLevel ?? '').trim())

/**
 * 单规则入口的匹配口径。
 * 规则列表来自 listCategoryRuleReview，实测该接口的 detailId / ruleId 可能为空，
 * 只有 categoryRuleId 稳定有值，所以它才是这里的主键；detailId / ruleId 仅作兜底比对。
 */
const matchesInitialRule = (rule: ReviewRule, initialDetailId: string) => {
  return (
    String(rule.categoryRuleId || '') === initialDetailId ||
    rule.id === initialDetailId ||
    String(rule.detailId || '') === initialDetailId ||
    String(rule.ruleId || '') === initialDetailId
  )
}

const scopedRules = computed(() => {
  const initialDetailId = props.initialDetailId.trim()
  if (!initialDetailId) return rules.value
  const matched = rules.value.filter((rule) => matchesInitialRule(rule, initialDetailId))
  // 匹配不到时回落到完整列表，避免详情弹窗整片空白（宁可多展示，不要什么都不展示）
  return matched.length ? matched : rules.value
})
const filteredRules = computed(() => {
  if (props.initialDetailId.trim()) return scopedRules.value
  // 页签按规则分级筛（值就是等级名 问题/异常/隐患，见 ruleFilters）；
  // 「不看通过规则」再滤掉 reviewOpinion === '1' 的行（按码值判，见 isPassedRule），与页签计数同一口径
  return rules.value.filter((rule) => {
    if (activeRuleFilter.value && ruleLevelNameOf(rule) !== activeRuleFilter.value) return false
    if (hidePassRules.value && isPassedRule(rule)) return false
    return true
  })
})
const selectedRule = computed(() => {
  const initialDetailId = props.initialDetailId.trim()
  if (initialDetailId) {
    const matched = scopedRules.value.find((rule) => matchesInitialRule(rule, initialDetailId))
    if (matched) return matched
  }
  return filteredRules.value.find((rule) => rule.id === selectedRuleId.value) || filteredRules.value[0] || emptyRule
})

/** 结论胶囊配色：与 workbenchView 共用 auditDetailHelpers.auditConclusionClass，两页显示一致 */
const conclusionClass = auditConclusionClass

const getRuleResult = (item: Partial<RuleReviewInfoRes>): RuleResult => {
  if (!String(item.reviewOpinion ?? '').trim()) return ''
  return RULE_RESULT_NAME_MAP[String(item.reviewOpinionName ?? '').trim()] || ''
}

const mapReviewRule = (item: Partial<RuleReviewInfo>, index: number, current?: ReviewRule, fromDetail = false): ReviewRule => {
  const id = String(item.detailId || item.ruleId || item.categoryRuleId || current?.id || `rule-${index}`)
  const reviewConclusion = String(item.reviewConclude || item.reviewOpinionName || current?.auditResult || '')
  return {
    ...(current || emptyRule),
    id,
    detailId: String(item.detailId || current?.detailId || ''),
    ruleId: String(item.ruleId || current?.ruleId || ''),
    code: String(item.ruleCode || current?.code || ''),
    ruleLevel: String(item.ruleLevel || current?.ruleLevel || ''),
    // 等级名称：左栏页签按它分类、要点卡片显示「规则等级」——列表接口下发，详情接口不覆盖它
    ruleLevelName: fromDetail ? String(current?.ruleLevelName || '') : String(item.ruleLevelName || current?.ruleLevelName || ''),
    // 分类同 result：属于列表维度状态，只由 listCategoryRuleReview 决定。
    // 详情接口可能只回分类编码，覆盖会让 isRuleGrouped 判定失败、左侧一级分类整片消失。
    ruleClassify: fromDetail ? String(current?.ruleClassify || '') : String(item.ruleClassify || current?.ruleClassify || ''),
    ruleClassifyName: String(item.ruleClassifyName || current?.ruleClassifyName || ''),
    categoryRuleId: String(item.categoryRuleId || current?.categoryRuleId || ''),
    category: String(item.ruleLevelName || current?.category || ''),
    name: String(item.ruleName || current?.name || '未命名规则'),
    // 列表状态只由 listCategoryRuleReview 更新，详情不能覆盖规则整体状态。
    result: fromDetail ? current?.result ?? '' : getRuleResult(item),
    reviewOpinion: fromDetail ? current?.reviewOpinion ?? '' : String(item.reviewOpinion ?? '').trim(),
    reviewOpinionName: fromDetail ? current?.reviewOpinionName ?? '' : String(item.reviewOpinionName ?? '').trim(),
    // 人工审核意见同样只由列表接口（listCategoryRuleReview）决定，详情接口不覆盖
    mixReviewStatus: fromDetail ? current?.mixReviewStatus ?? '' : String(item.mixReviewStatus ?? '').trim(),
    mixReviewStatusName: fromDetail ? current?.mixReviewStatusName ?? '' : String(item.mixReviewStatusName ?? '').trim(),
    level: String(item.ruleLevelName || RULE_LEVEL_LABEL_MAP.get(String(item.ruleLevel || '')) || current?.level || ''),
    ruleDesc: String(item.ruleDesc || current?.ruleDesc || current?.description || ''),
    description: String(item.ruleDesc || current?.ruleDesc || current?.description || ''),
    ruleviewConclude: String(item.ruleviewConclude || item.reviewConclude || current?.ruleviewConclude || ''),
    auditResult: reviewConclusion,
    analysisProcess: String(item.reviewProcess || current?.analysisProcess || ''),
    reviewMessage: String(item.reviewMessage || current?.reviewMessage || ''),
    reviewTable: 'reviewTable' in item ? normalizeReviewTables(item.reviewTable) : current?.reviewTable,
    // 审核要点的权威来源改为 loadReviewPoints（调 listRuleReviewNew），
    // 列表/详情接口返回的 points 不再采纳，仅保留 current 兜底，避免刷新把已加载要点清空。
    points: current?.points || [],
    extracted: String(item.extracted || current?.extracted || ''),
    requirement: String(item.requirement || current?.requirement || ''),
    conclusion: reviewConclusion,
    document: String(item.document || item.fileName || current?.document || ''),
    page: Number(item.page ?? current?.page) || 0,
    section: String(item.section || current?.section || ''),
    before: String(item.before || current?.before || ''),
    source: String(item.originalText || current?.source || ''),
    after: String(item.after || current?.after || '')
  }
}

const refreshRuleList = async (taskId: string, currentSession: number) => {
  try {
    const res = await listCategoryRuleReview({ taskId })
    if (!isSessionActive(currentSession, taskId)) return
    if (!res.success) {
      ruleLoadError.value = res.msg || '评审规则刷新失败'
      ElMessage.error(ruleLoadError.value)
      return
    }

    const currentRules = new Map(rules.value.map((rule) => [rule.id, rule]))
    const keys = new Set<string>()
    rules.value = (Array.isArray(res.data) ? res.data : [])
      .filter((item) => {
        const key = String(item.detailId || item.ruleId || item.categoryRuleId || '')
        if (!key || keys.has(key)) return false
        keys.add(key)
        return true
      })
      .map((item, index) => {
        const id = String(item.detailId || item.ruleId || item.categoryRuleId || '')
        return mapReviewRule(item, index, currentRules.get(id))
      })
    ruleLoadError.value = ''
    ruleEmptyText.value = rules.value.length ? '当前筛选下暂无规则' : '暂无评审规则'

    // 重新分析后同样要重建分类并重排：否则规则被接口原始 ruleClassify 覆盖后，
    // 左侧一级分类（合规性/经济性等）会因无法匹配分类字典而整片消失。
    await applyRuleClassifies({
      taskId,
      reviewOpinions: props.reviewOpinions,
      getRules: () => rules.value,
      setRules: (nextRules) => {
        rules.value = nextRules
      },
      isActive: () => isSessionActive(currentSession, taskId)
    })
    if (!isSessionActive(currentSession, taskId)) return
    // 结果变化后可能不再匹配原筛选，切回全部以保留当前选中的规则。
    if (rules.value.some((rule) => rule.id === selectedRuleId.value) && !filteredRules.value.some((rule) => rule.id === selectedRuleId.value)) {
      activeRuleFilter.value = ''
    }
  } catch (error: any) {
    if (isSessionActive(currentSession, taskId)) {
      ruleLoadError.value = error?.message || '评审规则刷新失败'
      ElMessage.error(ruleLoadError.value)
    }
  }
}

const { rerunningRuleIds, rerunConfirmingRuleId, rerunRule, rerunRule1, stopAllRuleReruns } = useRuleRerun({
  getTaskId: () => projectTaskId.value,
  isActive: (taskId) => props.active && projectTaskId.value === taskId,
  getActiveRuleKey: () => getRuleRerunKey(selectedRule.value),
  onCompleted: async (rule, data, taskId) => {
    const currentSession = sessionSeq
    if (!isSessionActive(currentSession, taskId)) return

    rules.value = rules.value.map((item, index) => (item.id === rule.id ? mapReviewRule(data, index, item, true) : item))

    await Promise.all([refreshRuleList(taskId, currentSession), loadSummary(taskId, currentSession)])
    if (!isSessionActive(currentSession, taskId)) return

    // 重新分析后重新拉取审核要点（listRuleReviewNew），并刷新审核依据
    const rerunRule = rules.value.find((item) => item.id === rule.id)
    if (rerunRule) await loadReviewPoints(rerunRule, currentSession)
    ruleWorkspaceRef.value?.refreshSelectedPointDetail()

    if (selectedRuleId.value === rule.id && !filteredRules.value.some((item) => item.id === rule.id)) {
      const nextRule = filteredRules.value[0]
      selectedRuleId.value = nextRule?.id || ''
      if (nextRule) await loadRuleDetail(nextRule, currentSession)
    }
  }
})

/** 审核要点级重新分析：按选中要点的 detailId 调 redoAuditRule，轮询完成后刷新该规则的审核要点 */
const RERUN_POINT_POLL_INTERVAL_MS = 15000
const RERUN_POINT_POLL_MAX_ATTEMPTS = 40
const RERUN_POINT_POLL_MAX_DURATION_MS = 10 * 60 * 1000
const rerunPointTimers = new Map<string, ReturnType<typeof setTimeout>>()

const stopPointRerun = (detailId: string) => {
  const timer = rerunPointTimers.get(detailId)
  if (timer) clearTimeout(timer)
  rerunPointTimers.delete(detailId)
  rerunningRuleIds.value = new Set([...rerunningRuleIds.value].filter((id) => id !== detailId))
}

const pollReviewPoint = (detailId: string, taskId: string, startedAt: number, attempts: number) => {
  if (!props.active || projectTaskId.value !== taskId) {
    stopPointRerun(detailId)
    return
  }
  if (attempts >= RERUN_POINT_POLL_MAX_ATTEMPTS || Date.now() - startedAt > RERUN_POINT_POLL_MAX_DURATION_MS) {
    stopPointRerun(detailId)
    ElMessage.error('重新分析超时，请稍后重试')
    return
  }

  const timer = setTimeout(async () => {
    rerunPointTimers.delete(detailId)
    try {
      const res = await getRuleReview({ detailId })
      if (!props.active || projectTaskId.value !== taskId) {
        stopPointRerun(detailId)
        return
      }
      if (!res.success) {
        stopPointRerun(detailId)
        ElMessage.error(res.msg || '获取评审结果失败')
        return
      }
      const status = String(res.data?.status ?? '')
      if (status === '1' || status === '2') {
        pollReviewPoint(detailId, taskId, startedAt, attempts + 1)
        return
      }
      if (status === '4') {
        stopPointRerun(detailId)
        ElMessage.error(String(res.data?.message || '').trim() || '重新分析失败')
        return
      }
      // 同步刷新规则结论和项目审核结论，保留当前规则后再更新要点、依据。
      const currentSession = sessionSeq
      await Promise.all([refreshRuleList(taskId, currentSession), loadSummary(taskId, currentSession)])
      if (!isSessionActive(currentSession, taskId)) {
        stopPointRerun(detailId)
        return
      }
      const rule = selectedRule.value
      if (rule) await loadReviewPoints(rule, currentSession)
      await nextTick()
      if (isSessionActive(currentSession, taskId)) ruleWorkspaceRef.value?.refreshSelectedPointDetail()
      stopPointRerun(detailId)
    } catch (error: any) {
      stopPointRerun(detailId)
      ElMessage.error(error?.message || '获取评审结果失败')
    }
  }, RERUN_POINT_POLL_INTERVAL_MS)
  rerunPointTimers.set(detailId, timer)
}

const rerunReviewPoint = async (detailId: string) => {
  const taskId = projectTaskId.value
  if (!taskId || !detailId) return
  if (rerunningRuleIds.value.has(detailId) || rerunConfirmingRuleId.value === detailId) return

  rerunConfirmingRuleId.value = detailId
  try {
    const type = await VXETable.modal.confirm('是否确认重新分析当前审核要点？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return
  } catch (error: any) {
    ElMessage.error(error?.message || '重新分析确认失败')
    return
  } finally {
    if (rerunConfirmingRuleId.value === detailId) rerunConfirmingRuleId.value = ''
  }

  if (!props.active || projectTaskId.value !== taskId || rerunningRuleIds.value.has(detailId)) return

  rerunningRuleIds.value = new Set([...rerunningRuleIds.value, detailId])
  try {
    const res = await redoAuditRule({ detailId })
    if (!props.active || projectTaskId.value !== taskId) {
      stopPointRerun(detailId)
      return
    }
    if (!res.success) {
      stopPointRerun(detailId)
      ElMessage.error(res.msg || '重新分析失败')
      return
    }
    pollReviewPoint(detailId, taskId, Date.now(), 0)
  } catch (error: any) {
    stopPointRerun(detailId)
    ElMessage.error(error?.message || '重新分析失败')
  }
}

/**
 * 人工复核提交成功后（RuleWorkspace 的复核弹窗冒上来的事件）：
 * 1. 重拉规则列表（listCategoryRuleReview）：左侧状态徽标严格读 mixReviewStatusName，
 *    复核后不重拉会一直显示旧状态；
 * 2. 再重拉当前规则的审核要点，让 `rgReviewOpinion` / `rgReviewOpinionName` 立刻到位，
 *    要点卡片上的「复核通过 / 不通过」签章不用等手动刷新（需求 2026-10-13）。
 *
 * 不重拉审核结论：AI 规则级结论跟这次人工复核无关。
 */
const refreshAfterManualReview = async () => {
  const taskId = projectTaskId.value
  if (!taskId) return
  const currentSession = sessionSeq
  await refreshRuleList(taskId, currentSession)
  if (!isSessionActive(currentSession, taskId)) return
  const rule = selectedRule.value
  if (!rule?.id) return
  await loadReviewPoints(rule, currentSession)
}

const stopAllPointReruns = () => {
  rerunPointTimers.forEach((timer) => clearTimeout(timer))
  rerunPointTimers.clear()
}

const resetState = () => {
  stopAllRuleReruns()
  stopAllPointReruns()
  closePreview({ restoreFocus: false })
  // 换任务后附件集合整体换掉，单条 blob 缓存按 id 命中会跨任务误用，这里连带作废
  clearPreviewCache()
  ruleListSeq += 1
  ruleDetailSeq += 1
  summarySeq += 1
  pointsSeq += 1
  resetRuleClassifies()
  projectInfoExpanded.value = false
  activeRuleFilter.value = ''
  // 「不看通过规则」的默认态是开启：换任务时也回到默认（不能因为上一个任务看过通过规则就带过来）
  hidePassRules.value = true
  selectedRuleId.value = ''
  rules.value = []
  auditSummary.value = createEmptySummary()
  auditResultOptions.value = []
  riskStandards.value = []
  // 各加载函数自己置 true / finally 置 false；这里统一复位成 false。
  // 置 true 会在 loadAudit 提前 return（未激活 / 缺 taskId）时留下无人关闭的加载态。
  rulesLoading.value = false
  ruleDetailLoading.value = false
  summaryLoading.value = false
  ruleEmptyText.value = ''
  ruleLoadError.value = ''
}

const getAuditResultOption = (result: string | number | null) => {
  const key = String(result ?? '')
  const option = auditResultOptions.value.find((item: any) => String(item.code ?? item.id) === key || String(item.id ?? item.code) === key)
  const fallback = FALLBACK_AUDIT_RESULT_MAP.get(key)
  return option ? { ...fallback, ...option, name: option.name || fallback?.name, type: option.type || fallback?.type } : fallback
}

const isSessionActive = (seq: number, taskId: string) => {
  return seq === sessionSeq && props.active && projectTaskId.value === taskId
}

const loadSummary = async (taskId: string, currentSession: number) => {
  const seq = ++summarySeq
  summaryLoading.value = true
  try {
    const [summaryResult, optionsResult, standardsResult] = await Promise.allSettled([
      getXmAuditConclude(taskId),
      getPublicData(AUDIT_RESULT_PUBLIC_CODE),
      getPublicData(RISK_STANDARD_PUBLIC_CODE)
    ])
    if (!isSessionActive(currentSession, taskId) || seq !== summarySeq) return

    if (optionsResult.status === 'fulfilled' && optionsResult.value.success) {
      auditResultOptions.value = normalizeOptionList(optionsResult.value.data || [])
    }
    // 分级判定口径（「分级标准怎么定？」弹层内容）：字典没取到时该按钮不渲染，不退回硬编码文案
    riskStandards.value = standardsResult.status === 'fulfilled' && standardsResult.value.success ? standardsResult.value.data || [] : []
    // 失败原因写 errorText 而不是 conclusion：否则报错会被渲染成「总体评审结论」
    if (summaryResult.status === 'rejected') {
      auditSummary.value = { ...createEmptySummary(), errorText: summaryResult.reason?.message || '审核结论获取失败' }
      return
    }
    if (!summaryResult.value.success) {
      auditSummary.value = { ...createEmptySummary(), errorText: summaryResult.value.msg || '审核结论获取失败' }
      return
    }

    const summary = normalizeAuditSummaryData(summaryResult.value.data)
    const counts = createEmptySummary().counts
    summary.ruleLevelFindNumList.forEach((item) => {
      const level = auditSummaryRuleLevelAliasMap[String(item?.ruleLevel ?? '')] || String(item?.ruleLevel ?? '')
      if (level === '1' || level === '2' || level === '3') {
        // 同一 ruleLevel 可能有多条（按 reviewOpinion 细分），findNum 需累加
        counts[level].count += Number(item.findNum) || 0
        if (!counts[level].name) counts[level].name = String(item?.ruleLevelName ?? '').trim()
      }
    })
    const resultOption = getAuditResultOption(summary.auditResult)
    auditSummary.value = {
      conclusion: String(summary.auditConclude || ''),
      statusText: String(resultOption?.name || ''),
      statusTone: String(resultOption?.type || ''),
      counts
    }
  } catch (error: any) {
    if (isSessionActive(currentSession, taskId) && seq === summarySeq) {
      auditSummary.value = { ...createEmptySummary(), errorText: error?.message || '审核结论获取失败' }
    }
  } finally {
    if (seq === summarySeq) summaryLoading.value = false
  }
}

const loadRuleDetail = async (rule: ReviewRule, currentSession: number) => {
  selectedRuleId.value = rule.id
  const detailId = String(rule.detailId || '').trim()
  const taskId = projectTaskId.value
  if (!taskId) return

  const seq = ++ruleDetailSeq
  ruleDetailLoading.value = true
  try {
    if (detailId) {
      const res = await getRuleReview({ detailId })
      if (!isSessionActive(currentSession, taskId) || seq !== ruleDetailSeq || selectedRuleId.value !== rule.id) return
      if (!res.success) {
        ElMessage.error(res.msg || '评审详情获取失败')
        return
      }
      rules.value = rules.value.map((item, index) =>
        item.id === rule.id ? mapReviewRule((res.data || {}) as RuleReviewInfo, index, item, true) : item
      )
    }
    // 详情回填后单独拉取审核要点（listRuleReviewNew），不依赖详情接口的 points 字段
    const mergedRule = rules.value.find((item) => item.id === rule.id)
    if (mergedRule) void loadReviewPoints(mergedRule, currentSession)
  } catch (error: any) {
    if (isSessionActive(currentSession, taskId) && seq === ruleDetailSeq) ElMessage.error(error?.message || '评审详情获取失败')
  } finally {
    if (seq === ruleDetailSeq) ruleDetailLoading.value = false
  }
}

/** 审核要点的权威来源：单独调 listRuleReviewNew，按规则的 categoryRuleId 拉取该规则下的要点列表 */
const loadReviewPoints = async (rule: ReviewRule, currentSession: number) => {
  const taskId = projectTaskId.value
  const categoryRuleId = String(rule.categoryRuleId || '').trim()
  if (!taskId || !categoryRuleId) return

  const seq = ++pointsSeq
  try {
    const res = await listRuleReviewNew({ taskId, categoryRuleId })
    if (!isSessionActive(currentSession, taskId) || seq !== pointsSeq || selectedRuleId.value !== rule.id) return
    if (!res.success) {
      ElMessage.error(res.msg || '审核要点获取失败')
      return
    }
    const points = (Array.isArray(res.data) ? res.data : []).map((item) => ({
      ...item,
      id: String(item.detailId || item.ruleId || '')
    }))
    rules.value = rules.value.map((item) => (item.id === rule.id ? { ...item, points } : item))
  } catch (error: any) {
    if (isSessionActive(currentSession, taskId) && seq === pointsSeq) ElMessage.error(error?.message || '审核要点获取失败')
  }
}

const loadRules = async (taskId: string, currentSession: number) => {
  const seq = ++ruleListSeq
  rulesLoading.value = true
  ruleEmptyText.value = ''
  ruleLoadError.value = ''
  try {
    const res = await listCategoryRuleReview({ taskId })
    if (!isSessionActive(currentSession, taskId) || seq !== ruleListSeq) return
    if (!res.success) {
      ruleLoadError.value = res.msg || '评审规则获取失败'
      ruleEmptyText.value = ''
      ElMessage.error(ruleLoadError.value)
      return
    }

    const currentRules = new Map(rules.value.map((rule) => [rule.id, rule]))
    const keys = new Set<string>()
    rules.value = (Array.isArray(res.data) ? res.data : [])
      .filter((item) => {
        const key = String(item.detailId || item.ruleId || item.categoryRuleId || '')
        if (!key || keys.has(key)) return false
        keys.add(key)
        return true
      })
      .map((item, index) => {
        const id = String(item.detailId || item.ruleId || item.categoryRuleId || '')
        return mapReviewRule(item, index, currentRules.get(id))
      })
    ruleEmptyText.value = rules.value.length ? '当前筛选下暂无规则' : '暂无评审规则'

    // 等待分类解析并按字典顺序重排后再取首条，保证默认停在第一个分类页签
    await applyRuleClassifies({
      taskId,
      reviewOpinions: props.reviewOpinions,
      getRules: () => rules.value,
      setRules: (nextRules) => {
        rules.value = nextRules
      },
      isActive: () => isSessionActive(currentSession, taskId) && seq === ruleListSeq
    })
    if (!isSessionActive(currentSession, taskId) || seq !== ruleListSeq) return

    const initialDetailId = props.initialDetailId.trim()
    /*
     * 首条规则要从**当前筛选可见**的规则里挑：默认开着「不看通过规则」，
     * 若直接取 rules[0]（可能是条已通过的规则），左侧列表看不到它、中右侧却在展示它。
     */
    const firstRule = initialDetailId
      ? scopedRules.value.find((rule) => matchesInitialRule(rule, initialDetailId)) || scopedRules.value[0]
      : filteredRules.value[0] || rules.value[0]
    if (firstRule) await loadRuleDetail(firstRule, currentSession)
    // 单规则入口下命中的规则可能没有 detailId，loadRuleDetail 会跳过请求且不落 loading；
    // 没有可加载的规则时也要显式收掉详情态，否则右侧详情区一直转圈。
    if (!firstRule) ruleDetailLoading.value = false
  } catch (error: any) {
    if (!isSessionActive(currentSession, taskId) || seq !== ruleListSeq) return
    ruleLoadError.value = error?.message || '评审规则获取失败'
    ruleEmptyText.value = ''
    ElMessage.error(ruleLoadError.value)
  } finally {
    if (seq === ruleListSeq) rulesLoading.value = false
  }
}

/** 规则列表加载失败后的重试入口（对应容错原则的「从错误中恢复」） */
const reloadRules = () => {
  const taskId = projectTaskId.value
  if (!props.active || !taskId) return
  void loadRules(taskId, sessionSeq)
}

/** 审核结论加载失败后的重试入口 */
const retrySummary = () => {
  const taskId = projectTaskId.value
  if (!props.active || !taskId) return
  // 先清掉错误态，让「重试」这一下有立即可见的反馈
  auditSummary.value = createEmptySummary()
  void loadSummary(taskId, sessionSeq)
}

/** 导出当前任务的审核要点结论明细 */
const exportingSummary = ref(false)
const exportSummary = async () => {
  const taskId = projectTaskId.value
  if (!taskId) {
    ElMessage.warning('当前项目缺少审核任务ID')
    return
  }
  exportingSummary.value = true
  try {
    await apiExportHandle(taskId, '审核任务明细', exportTaskDetail)
  } catch (e: any) {
    ElMessage.error(e.message || '导出失败')
  } finally {
    exportingSummary.value = false
  }
}

const loadAudit = async () => {
  const currentSession = ++sessionSeq
  resetState()
  sessionDetailRow.value = { ...(props.detailRow || {}) }
  const taskId = projectTaskId.value
  if (!props.active) return
  if (!taskId) {
    ruleEmptyText.value = '当前项目缺少审核任务ID'
    return
  }
  // 按视觉顺序从上到下加载：先审核结论（顶部摘要），完成后再加载规则列表（链式加载首条规则详情 → 审核要点）
  await loadSummary(taskId, currentSession)
  if (!isSessionActive(currentSession, taskId)) return
  void loadRules(taskId, currentSession)
}

const selectRule = (rule: ReviewRule) => {
  void loadRuleDetail(rule, sessionSeq)
}

/** 页签 / 「不看通过规则」变化后校正选中规则：原选中项仍在可见列表里就保留，否则回落到首个可见规则并加载详情 */
const syncSelectedRuleToFilter = () => {
  const previousRuleId = selectedRuleId.value
  const nextRule = filteredRules.value.find((rule) => rule.id === previousRuleId) || filteredRules.value[0]
  selectedRuleId.value = nextRule?.id || ''
  if (nextRule && nextRule.id !== previousRuleId) void loadRuleDetail(nextRule, sessionSeq)
}

const changeRuleFilter = (value: string) => {
  activeRuleFilter.value = value
  syncSelectedRuleToFilter()
}

watch(
  [() => props.active, () => props.detailRow?.taskId, () => props.reviewOpinions],
  ([active]) => {
    if (active) loadAudit()
    else {
      sessionSeq += 1
      resetState()
      sessionDetailRow.value = {}
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  sessionSeq += 1
  resetState()
})
</script>

<style lang="less">
@import '../../workbenchView/css/index.less';
@import '../../workbenchView/css/preview.less';
</style>

<style scoped lang="less">
.audit-detail-workbench {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  overflow-x: auto;
  overflow-y: hidden;
}

.audit-detail-workbench .review-detail {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.audit-detail-workbench :deep(.rule-workspace) {
  grid-template-columns: minmax(360px, 380px) minmax(0, 1fr);
}

.audit-detail-workbench :deep(.rule-workspace.rule-workspace--list-collapsed) {
  grid-template-columns: 48px minmax(0, 1fr);
}

.audit-detail-workbench :deep(.rule-workspace.rule-workspace--preview-open) {
  grid-template-columns: minmax(520px, 1fr);
}

.audit-detail-workbench :deep(.rule-detail-body) {
  grid-template-columns: minmax(0, 0.36fr) minmax(0, 0.64fr);
}

.audit-detail-workbench :deep(.rule-detail-body--reasoning-collapsed) {
  grid-template-columns: 48px minmax(0, 1fr);
}

@media (max-width: 1440px) {
  .audit-detail-workbench :deep(.rule-workspace) {
    grid-template-columns: minmax(340px, 360px) minmax(0, 1fr);
  }

  .audit-detail-workbench :deep(.rule-workspace.rule-workspace--list-collapsed) {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .audit-detail-workbench :deep(.rule-workspace.rule-workspace--preview-open) {
    grid-template-columns: minmax(520px, 1fr);
  }
}

@media (max-width: 1180px) {
  .audit-detail-workbench :deep(.rule-workspace) {
    grid-template-columns: 300px minmax(0, 1fr);
  }

  .audit-detail-workbench :deep(.rule-workspace.rule-workspace--list-collapsed) {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .audit-detail-workbench :deep(.rule-workspace.rule-workspace--preview-open) {
    grid-template-columns: minmax(520px, 1fr);
  }
}
</style>
