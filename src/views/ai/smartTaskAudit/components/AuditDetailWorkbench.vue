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
        :conclusion-class="conclusionClass"
        :show-project-more="showProjectMore"
        :show-project-info="showProjectInfo"
        @toggle="projectInfoExpanded = !projectInfoExpanded"
        @show-more="$emit('show-project-more')"
        @retry="retrySummary"
        @navigate-price-view="handlePriceViewNavigate"
      />
      <div class="review-workspace-stage">
        <RuleWorkspace
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
          :can-rerun="canRerun"
          :rerunning-rule-ids="rerunningRuleIds"
          :rerun-confirming-rule-id="rerunConfirmingRuleId"
          @filter-change="changeRuleFilter"
          @select-rule="selectRule"
          @rerun-rule="rerunRule"
          @preview-attach="openMaterialPreview"
          @reload-rules="reloadRules"
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
import { computed, inject, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPublicData } from '@/api/common'
import { getRuleReview, getRuleReviewInfo, getXmAuditConclude } from '@/api/ai/smartTaskAudit'
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
  auditSummaryLevelConfigs,
  auditSummaryRuleLevelAliasMap,
  normalizeAuditSummaryData,
  normalizeReviewTables,
  openPopPage
} from './auditDetailHelpers'
import type { AuditPriceViewPayload } from './auditDetailHelpers'
import { normalizeOptionList } from '../utils'
import type { SmartTaskAuditRow } from '../types'

const AUDIT_RESULT_PUBLIC_CODE = 'AI_AUDIT_RESULT_COM'
const PRICE_LIBRARY_PATH = '/ai/materialPriceLibrary/index'
const RULE_RESULT_MAP: Record<string, RuleResult> = {
  '0': 'failed',
  '1': 'passed',
  '2': 'warning'
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
  counts: { '1': 0, '2': 0, '3': 0 }
})

const emptyRule: ReviewRule = {
  id: '',
  code: '',
  ruleLevel: '',
  category: '',
  name: '暂无评审规则',
  result: 'warning',
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
const selectedRuleId = ref('')
const rules = shallowRef<ReviewRule[]>([])
const auditSummary = shallowRef<WorkbenchAuditSummary>(createEmptySummary())
const auditResultOptions = shallowRef<any[]>([])
const rulesLoading = ref(false)
const ruleDetailLoading = ref(false)
const ruleEmptyText = ref('请选择任务查看评审信息')
/** 规则列表加载失败的原因；非空时列表区渲染错误态并提供重新加载 */
const ruleLoadError = ref('')
const previewStageRef = ref<HTMLElement | null>(null)
const previewPanelRef = ref<InstanceType<typeof DocumentPreviewPanel> | null>(null)
const ruleFilters = computed<WorkbenchFilterOption[]>(() => {
  if (props.initialDetailId.trim()) return [{ label: '全部', value: '' }]
  return [
    { label: '全部', value: '' },
    { label: '未通过', value: '0' },
    { label: '待复核', value: '2' },
    { label: '通过', value: '1' }
  ]
})

const { ruleClassifies, applyRuleClassifies, resetRuleClassifies } = useRuleClassifies()
const {
  visible: isPreviewOpen,
  loading: previewLoading,
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
  resetWidth: resetPreviewWidth,
  startResize: startPreviewResize,
  handleResizeKeydown: handlePreviewResizeKeydown,
  handleError: handlePreviewError
} = useDocumentPreviewDrawer(previewStageRef)

const openMaterialPreview = (file: TXmAttach, trigger?: HTMLElement | null) => {
  void openPreview(file, trigger)
}

watch(isPreviewOpen, (visible) => {
  if (visible) void nextTick(() => previewPanelRef.value?.focus({ preventScroll: true }))
})

/** 宿主未 provide 时（如 CentralizedModification 内嵌）显式给 undefined，避免 Vue 注入缺失告警 */
const currentUserRole = inject<Ref<UserRole> | undefined>('currentUserRole', undefined)

/** 点击 .gwPriceView / .materialNewestPriceView：新标签页打开物料价格库对应 tab，携带当前角色 spRoleId 供目标页比对 */
const handlePriceViewNavigate = (payload: AuditPriceViewPayload) => {
  const tab = payload.type === 'gwPriceView' ? 'materialPriceLibrary' : 'historyPrice'
  const spRoleId = currentUserRole?.value?.spRoleId || ''
  openPopPage(PRICE_LIBRARY_PATH, spRoleId ? { tab, spRoleId } : { tab })
}

let sessionSeq = 0
let ruleListSeq = 0
let ruleDetailSeq = 0
let summarySeq = 0

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
    yjdw: String(getRowValue(row, 'yjdw', 'YJDW', 'yjdwName', 'YJDW_NAME')),
    ejdw: String(getRowValue(row, 'ejdw', 'EJDW', 'ejdwName', 'EJDW_NAME')),
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
const scopedRules = computed(() => {
  const initialDetailId = props.initialDetailId.trim()
  if (!initialDetailId) return rules.value
  return rules.value.filter((rule) => String(rule.detailId || '') === initialDetailId || rule.id === initialDetailId)
})
const filteredRules = computed(() => {
  if (props.initialDetailId.trim()) return scopedRules.value
  if (!activeRuleFilter.value) return rules.value
  return rules.value.filter((rule) => RULE_RESULT_MAP[activeRuleFilter.value] === rule.result)
})
const selectedRule = computed(() => {
  const initialDetailId = props.initialDetailId.trim()
  if (initialDetailId) {
    const matched = scopedRules.value.find((rule) => String(rule.detailId || '') === initialDetailId || rule.id === initialDetailId)
    if (matched) return matched
  }
  return filteredRules.value.find((rule) => rule.id === selectedRuleId.value) || filteredRules.value[0] || emptyRule
})

const conclusionClass = (tone?: string) => {
  if (tone === 'success') return 'passed'
  if (tone === 'info' || tone === 'primary-blue') return 'waiting'
  return 'warning'
}

const getRuleResult = (item: Partial<RuleReviewInfoRes>, fallback: RuleResult = 'warning'): RuleResult => {
  return RULE_RESULT_MAP[String(item.reviewOpinion ?? '')] || fallback
}

const mapReviewRule = (item: Partial<RuleReviewInfo>, index: number, current?: ReviewRule): ReviewRule => {
  const id = String(item.detailId || item.ruleId || current?.id || `rule-${index}`)
  const reviewConclusion = String(item.reviewConclude || item.reviewOpinionName || current?.auditResult || '')
  return {
    ...(current || emptyRule),
    id,
    detailId: String(item.detailId || current?.detailId || ''),
    code: String(item.ruleCode || current?.code || ''),
    ruleLevel: String(item.ruleLevel || current?.ruleLevel || ''),
    ruleClassify: String(item.ruleClassify || current?.ruleClassify || ''),
    category: String(item.ruleLevelName || current?.category || ''),
    name: String(item.ruleName || current?.name || '未命名规则'),
    result: getRuleResult(item, current?.result),
    level: String(item.ruleLevelName || RULE_LEVEL_LABEL_MAP.get(String(item.ruleLevel || '')) || current?.level || ''),
    ruleDesc: String(item.ruleDesc || current?.ruleDesc || current?.description || ''),
    description: String(item.ruleDesc || current?.ruleDesc || current?.description || ''),
    ruleviewConclude: String(item.ruleviewConclude || item.reviewConclude || current?.ruleviewConclude || ''),
    auditResult: reviewConclusion,
    analysisProcess: String(item.reviewProcess || current?.analysisProcess || ''),
    reviewMessage: String(item.reviewMessage || current?.reviewMessage || ''),
    reviewTable: 'reviewTable' in item ? normalizeReviewTables(item.reviewTable) : current?.reviewTable,
    // 列表接口可能在重新分析刚完成时返回空/旧的 points，此时保留详情接口已写入的 current.points，
    // 避免重新分析后列表刷新把正确的审核要点覆盖成「暂无审核要点」。
    points: Array.isArray(item.points) && item.points.length ? item.points : current?.points || [],
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
    const res = await getRuleReviewInfo({
      taskId,
      ruleClassify: '',
      reviewOpinions: props.reviewOpinions.trim()
    })
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
        const key = String(item.detailId || item.ruleId || '')
        if (!key || keys.has(key)) return false
        keys.add(key)
        return true
      })
      .map((item, index) => {
        const id = String(item.detailId || item.ruleId || '')
        return mapReviewRule(item, index, currentRules.get(id))
      })
    ruleLoadError.value = ''
    ruleEmptyText.value = rules.value.length ? '当前筛选下暂无规则' : '暂无评审规则'
  } catch (error: any) {
    if (isSessionActive(currentSession, taskId)) {
      ruleLoadError.value = error?.message || '评审规则刷新失败'
      ElMessage.error(ruleLoadError.value)
    }
  }
}

const { rerunningRuleIds, rerunConfirmingRuleId, rerunRule, stopAllRuleReruns } = useRuleRerun({
  getTaskId: () => projectTaskId.value,
  isActive: (taskId) => props.active && projectTaskId.value === taskId,
  getActiveRuleKey: () => getRuleRerunKey(selectedRule.value),
  onCompleted: async (rule, data, taskId) => {
    const currentSession = sessionSeq
    if (!isSessionActive(currentSession, taskId)) return

    rules.value = rules.value.map((item, index) => (item.id === rule.id ? mapReviewRule(data, index, item) : item))

    await Promise.all([refreshRuleList(taskId, currentSession), loadSummary(taskId, currentSession)])
    if (!isSessionActive(currentSession, taskId)) return

    if (selectedRuleId.value === rule.id && !filteredRules.value.some((item) => item.id === rule.id)) {
      const nextRule = filteredRules.value[0]
      selectedRuleId.value = nextRule?.id || ''
      if (nextRule) await loadRuleDetail(nextRule, currentSession)
    }
  }
})

const resetState = () => {
  stopAllRuleReruns()
  closePreview({ restoreFocus: false })
  ruleListSeq += 1
  ruleDetailSeq += 1
  summarySeq += 1
  resetRuleClassifies()
  projectInfoExpanded.value = false
  activeRuleFilter.value = ''
  selectedRuleId.value = ''
  rules.value = []
  auditSummary.value = createEmptySummary()
  auditResultOptions.value = []
  rulesLoading.value = false
  ruleDetailLoading.value = false
  ruleEmptyText.value = '请选择任务查看评审信息'
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
  try {
    const [summaryResult, optionsResult] = await Promise.allSettled([getXmAuditConclude(taskId), getPublicData(AUDIT_RESULT_PUBLIC_CODE)])
    if (!isSessionActive(currentSession, taskId) || seq !== summarySeq) return

    if (optionsResult.status === 'fulfilled' && optionsResult.value.success) {
      auditResultOptions.value = normalizeOptionList(optionsResult.value.data || [])
    }
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
      if (level === '1' || level === '2' || level === '3') counts[level] = Number(item.findNum) || 0
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
  }
}

const loadRuleDetail = async (rule: ReviewRule, currentSession: number) => {
  selectedRuleId.value = rule.id
  const detailId = String(rule.detailId || '').trim()
  const taskId = projectTaskId.value
  if (!detailId || !taskId) return

  const seq = ++ruleDetailSeq
  ruleDetailLoading.value = true
  try {
    const res = await getRuleReview({ detailId })
    if (!isSessionActive(currentSession, taskId) || seq !== ruleDetailSeq || selectedRuleId.value !== rule.id) return
    if (!res.success) {
      ElMessage.error(res.msg || '评审详情获取失败')
      return
    }
    rules.value = rules.value.map((item, index) => (item.id === rule.id ? mapReviewRule((res.data || {}) as RuleReviewInfo, index, item) : item))
  } catch (error: any) {
    if (isSessionActive(currentSession, taskId) && seq === ruleDetailSeq) ElMessage.error(error?.message || '评审详情获取失败')
  } finally {
    if (seq === ruleDetailSeq) ruleDetailLoading.value = false
  }
}

const loadRules = async (taskId: string, currentSession: number) => {
  const seq = ++ruleListSeq
  rulesLoading.value = true
  ruleEmptyText.value = ''
  ruleLoadError.value = ''
  try {
    const res = await getRuleReviewInfo({
      taskId,
      ruleClassify: '',
      reviewOpinions: props.reviewOpinions.trim()
    })
    if (!isSessionActive(currentSession, taskId) || seq !== ruleListSeq) return
    if (!res.success) {
      ruleLoadError.value = res.msg || '评审规则获取失败'
      ruleEmptyText.value = ''
      ElMessage.error(ruleLoadError.value)
      return
    }

    const keys = new Set<string>()
    rules.value = (Array.isArray(res.data) ? res.data : [])
      .filter((item) => {
        const key = String(item.detailId || item.ruleId || '')
        if (!key || keys.has(key)) return false
        keys.add(key)
        return true
      })
      .map((item, index) => mapReviewRule(item, index))
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

    const firstRule = props.initialDetailId.trim()
      ? scopedRules.value.find((rule) => String(rule.detailId || '') === props.initialDetailId.trim() || rule.id === props.initialDetailId.trim()) || scopedRules.value[0]
      : rules.value[0]
    if (firstRule) await loadRuleDetail(firstRule, currentSession)
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

const loadAudit = () => {
  const currentSession = ++sessionSeq
  resetState()
  sessionDetailRow.value = { ...(props.detailRow || {}) }
  const taskId = projectTaskId.value
  if (!props.active) return
  if (!taskId) {
    ruleEmptyText.value = '当前项目缺少审核任务ID'
    return
  }
  void Promise.all([loadRules(taskId, currentSession), loadSummary(taskId, currentSession)])
}

const selectRule = (rule: ReviewRule) => {
  void loadRuleDetail(rule, sessionSeq)
}

const changeRuleFilter = (value: string) => {
  const previousRuleId = selectedRuleId.value
  activeRuleFilter.value = value
  const nextRule = filteredRules.value.find((rule) => rule.id === previousRuleId) || filteredRules.value[0]
  selectedRuleId.value = nextRule?.id || ''
  if (nextRule && nextRule.id !== previousRuleId) void loadRuleDetail(nextRule, sessionSeq)
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
