import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, shallowRef, unref, watch } from 'vue'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type HelpModal from '@/components/HelpModal/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import {
  createSmartTaskAudit,
  getEjdwList,
  getFlList,
  getFlowStatusList,
  getRuleReview,
  getSmartTaskAuditProjectList,
  getXmAuditConclude,
  getYjdwList,
  listCategoryRuleReview,
  listRuleReviewNew,
  redoAuditRule,
  exportTaskDetail
} from '@/api/ai/smartTaskAudit'
import type { RuleReviewInfo, RuleReviewInfoRes, SmartTaskAuditListItem } from '@/api/ai/smartTaskAudit'
import { getPublicData, getSubProtypeTree, getYearData, getYjflList } from '@/api/common'
import { AIRiskLevelDict } from '@/staticDict/index.js'
import { useSmartTaskAuditList } from '@/composables/useSmartTaskAuditList'
import {
  auditConclusionClass,
  auditSummaryLevelConfigs,
  auditSummaryRuleLevelAliasMap,
  normalizeAuditSummaryData,
  normalizeReviewTables
} from '../smartTaskAudit/components/auditDetailHelpers'
import type { AuditSummaryRuleLevel } from '../smartTaskAudit/components/auditDetailHelpers'
import { createProjectGridOptions } from '../smartTaskAudit/projectTable'
import type { OptionItem, ProjectSearchForm, SmartTaskAuditProjectRow } from '../smartTaskAudit/types'
import { createProjectSearchForm, normalizeOptionList, normalizeTreeOptionList, normalizeYearList, splitCodes } from '../smartTaskAudit/utils'
import { useRuleClassifies } from './composables/useRuleClassifies'
import { getRuleRerunKey, useRuleRerun } from './composables/useRuleRerun'
import { apiExportHandle } from '@/utils/export'
import type { ReviewRule, RuleResult, WorkbenchAuditSummary, WorkbenchFilterOption, WorkbenchProject } from './types'

interface RuleWorkspaceExpose {
  refreshSelectedPointDetail: () => void
}

interface CreateTaskModalExpose {
  clearValidate: () => void
  clearCheckboxRow: () => unknown
  getCheckboxRecords: () => SmartTaskAuditProjectRow[]
}

interface SmartTaskProgressExpose {
  acceptParams: (params: { taskId?: string }) => Promise<void>
}

const STATUS_CLASS_MAP: Record<string, string> = {
  '1': 'waiting',
  '2': 'processing',
  '3': 'completed',
  '4': 'failed',
  等待中: 'waiting',
  待处理: 'waiting',
  处理中: 'processing',
  已完成: 'completed',
  处理失败: 'failed'
}

const KEYWORD_SEARCH_DEBOUNCE_MS = 400

const RULE_LEVEL_LABEL_MAP = new Map(auditSummaryLevelConfigs.map((item) => [item.ruleLevel, item.label]))
const AUDIT_RESULT_PUBLIC_CODE = 'AI_AUDIT_RESULT_COM'
const AUDIT_RESULT_ALIAS_MAP: Record<string, AuditSummaryRuleLevel> = auditSummaryRuleLevelAliasMap
const FALLBACK_AUDIT_RESULT_MAP = new Map(AIRiskLevelDict.getList().map((item: any) => [String(item.id), item]))
const STATUS_PUBLIC_CODE = 'AI_AUDIT_TASK_STATUS_COM'
const REVIEW_OPINION_PUBLIC_CODE = 'AI_AUDIT_REVIEW_OPINION_COM'
/** 审核意见代码 → 规则结果（筛选条按 code 过滤时用） */
const REVIEW_OPINION_RESULT_MAP: Record<string, RuleResult> = {
  '0': 'failed',
  '1': 'passed',
  '2': 'warning'
}
/** 审核意见名称 → 规则结果；规则状态以 reviewOpinionName（通过/不通过/待复核）为准 */
const REVIEW_OPINION_NAME_RESULT_MAP: Record<string, RuleResult> = {
  通过: 'passed',
  不通过: 'failed',
  待复核: 'warning'
}

const prependAllOption = (options: WorkbenchFilterOption[] = []): WorkbenchFilterOption[] => [
  { label: '全部', value: '' },
  ...options.filter((item) => item.value !== '')
]

const createEmptyAuditSummary = (): WorkbenchAuditSummary => ({
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

export function useProjectReviewWorkbench() {
  const store = useStore()
  const isShowPage = ref(false)
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const currentUserRole = ref<UserRole>({
    bmName: '',
    dwName: '',
    bmId: '',
    roleId: '',
    roleCode: '',
    dwId: '',
    specialOrgCode: '',
    spRoleId: ''
  })
  const activeStatus = ref('')
  const keyword = ref('')
  const createTaskModalRef = ref<CreateTaskModalExpose>()
  const projectSearchForm = reactive<ProjectSearchForm>(createProjectSearchForm())
  const projectGridOptions = reactive(createProjectGridOptions())
  const projectPage = reactive({ total: 0, limit: 20, page: 1 })
  const createTaskModal = reactive({ visible: false, loading: false })
  const yearList = shallowRef<OptionItem[]>([])
  const yjdwList = shallowRef<OptionItem[]>([])
  const ejdwList = shallowRef<OptionItem[]>([])
  const projectTypeList = shallowRef<any[]>([])
  const yjflList = shallowRef<OptionItem[]>([])
  const ejflList = shallowRef<OptionItem[]>([])
  const sjflList = shallowRef<OptionItem[]>([])
  const flowStatusList = shallowRef<OptionItem[]>([])
  const selectedProjectRows = shallowRef<SmartTaskAuditProjectRow[]>([])
  const statusTabs = shallowRef<WorkbenchFilterOption[]>(prependAllOption())
  const ruleFilters = shallowRef<WorkbenchFilterOption[]>(prependAllOption())
  provide(CurrentUserRoleInjectionKey, currentUserRole)

  const buildRoleParams = () => ({
    bmId: currentUserRole.value.bmId,
    dwId: currentUserRole.value.dwId,
    roleId: currentUserRole.value.roleId,
    roleCode: currentUserRole.value.roleCode,
    userId: store.getters.getUserMsg?.id || ''
  })

  const buildListParams = () => {
    const query = keyword.value.trim()
    return {
      ...buildRoleParams(),
      yjdw: '',
      isHis: '0',
      orderByType: 1,
      status: activeStatus.value,
      taskName: query
    }
  }

  const buildProjectSearchParams = () => {
    const { xmbm, ...rest } = projectSearchForm
    return {
      ...buildRoleParams(),
      ...rest,
      xmbmList: splitCodes(xmbm),
      page: projectPage.page,
      limit: projectPage.limit
    }
  }

  const mapWorkbenchProject = (record: SmartTaskAuditListItem): WorkbenchProject => {
    const project = record as unknown as Partial<WorkbenchProject>
    const projectId = String(project.proId ?? project.xmId ?? project.id ?? '').trim()
    const projectType = String(project.proType ?? project.pro_type_id ?? project.proTypeId ?? '').trim()
    return {
      ...project,
      // Match the project identifiers expected by the joint-review detail surface.
      xmId: project.xmId || projectId,
      pro_type_id: project.pro_type_id || projectType,
      xmmc: project.xmmc || project.taskName || '',
      progress: Number(project.progress) || 0,
      riskCount: Number(project.riskCount) || 0
    }
  }

  const {
    records: projects,
    loading: refreshing,
    errorMessage: listErrorMessage,
    page,
    search: searchList,
    invalidate: invalidateSearch,
    changePage: changeListPage,
    changeLimit: changeListLimit
  } = useSmartTaskAuditList<WorkbenchProject>({
    buildParams: buildListParams,
    mapRecords: (records) => records.map(mapWorkbenchProject),
    onError: (message) => ElMessage.error(message)
  })

  const searchProjectHandle = async () => {
    const seq = ++projectSearchRequestSeq
    projectGridOptions.loading = true
    try {
      const res = await getSmartTaskAuditProjectList(buildProjectSearchParams())
      if (seq !== projectSearchRequestSeq) return
      if (res.success) {
        projectGridOptions.data = (Array.isArray(res.data?.records) ? res.data.records : []) as SmartTaskAuditProjectRow[]
        projectPage.total = Number(res.data?.total) || 0
        selectedProjectRows.value = []
        await createTaskModalRef.value?.clearCheckboxRow()
      } else {
        projectGridOptions.data = []
        projectPage.total = 0
        ElMessage.error(res.msg || '查询项目失败')
      }
    } catch (error: any) {
      if (seq !== projectSearchRequestSeq) return
      projectGridOptions.data = []
      projectPage.total = 0
      ElMessage.error(error?.message || '查询项目失败')
    } finally {
      if (seq === projectSearchRequestSeq) projectGridOptions.loading = false
    }
  }

  const toFilterOptions = (data: any[]): WorkbenchFilterOption[] =>
    normalizeOptionList(data || [])
      .map((item) => ({ label: item.name, value: item.code }))
      .filter((item) => item.value !== '')

  const initCreateTaskOptions = async (seq: number) => {
    const [statusRes, reviewOpinionRes, yearRes, yjdwRes, projectTypeRes, yjflRes, flowStatusRes] = await Promise.allSettled([
      getPublicData(STATUS_PUBLIC_CODE),
      getPublicData(REVIEW_OPINION_PUBLIC_CODE),
      getYearData(),
      getYjdwList(buildRoleParams()),
      getSubProtypeTree(),
      getYjflList('GWXMFL'),
      getFlowStatusList(buildRoleParams())
    ])
    if (seq !== roleLoadSeq) return
    if (statusRes.status === 'fulfilled' && statusRes.value.success) statusTabs.value = prependAllOption(toFilterOptions(statusRes.value.data || []))
    if (reviewOpinionRes.status === 'fulfilled' && reviewOpinionRes.value.success) {
      const options = toFilterOptions(reviewOpinionRes.value.data || [])
      ruleFilters.value = prependAllOption(options)
    }
    if (yearRes.status === 'fulfilled' && yearRes.value.success) yearList.value = normalizeYearList(yearRes.value.data || [])
    if (yjdwRes.status === 'fulfilled' && yjdwRes.value.success) yjdwList.value = normalizeOptionList(yjdwRes.value.data || [])
    if (projectTypeRes.status === 'fulfilled' && projectTypeRes.value.success) projectTypeList.value = projectTypeRes.value.data || []
    if (yjflRes.status === 'fulfilled' && yjflRes.value.success) yjflList.value = normalizeOptionList(yjflRes.value.data || [])
    if (flowStatusRes.status === 'fulfilled' && flowStatusRes.value.success)
      flowStatusList.value = normalizeTreeOptionList(flowStatusRes.value.data || [])
  }

  const resetProjectHandle = () => {
    Object.assign(projectSearchForm, createProjectSearchForm())
    ejdwList.value = []
    ejflList.value = []
    sjflList.value = []
    projectPage.page = 1
    projectPage.limit = 20
    createTaskModalRef.value?.clearValidate?.()
    void searchProjectHandle()
  }

  const projectPageChangeHandle = (currentPage: number) => {
    projectPage.page = currentPage
    void searchProjectHandle()
  }

  const projectLimitChangeHandle = (currentLimit: number) => {
    projectPage.page = 1
    projectPage.limit = currentLimit
    void searchProjectHandle()
  }

  const openCreateTaskModal = async () => {
    Object.assign(projectSearchForm, createProjectSearchForm())
    selectedProjectRows.value = []
    projectGridOptions.data = []
    projectPage.page = 1
    projectPage.limit = 20
    projectPage.total = 0
    ejdwList.value = []
    ejflList.value = []
    sjflList.value = []
    createTaskModal.visible = true
    await nextTick()
    await searchProjectHandle()
  }

  const closeCreateTaskModal = () => {
    projectSearchRequestSeq += 1
    projectEjdwRequestSeq += 1
    ejflRequestSeq += 1
    sjflRequestSeq += 1
    createTaskModal.visible = false
    projectGridOptions.loading = false
    Object.assign(projectSearchForm, createProjectSearchForm())
    selectedProjectRows.value = []
    projectGridOptions.data = []
    projectPage.page = 1
    projectPage.limit = 20
    projectPage.total = 0
    void createTaskModalRef.value?.clearCheckboxRow()
  }

  const syncSelectedProjectRows = (records: SmartTaskAuditProjectRow[]) => {
    selectedProjectRows.value = records || []
  }

  const createTaskHandle = async () => {
    const rows = createTaskModalRef.value?.getCheckboxRecords?.() || selectedProjectRows.value
    if (!rows.length) {
      ElMessage.warning('请选择项目')
      return
    }
    const proIdList = rows.map((row) => row.xmId).filter(Boolean) as string[]
    if (!proIdList.length) {
      ElMessage.warning('当前选中项目缺少项目ID')
      return
    }
    createTaskModal.loading = true
    try {
      const res = await createSmartTaskAudit(proIdList)
      if (res.success) {
        ElMessage.success('创建成功')
        closeCreateTaskModal()
        page.page = 1
        await refreshData()
      } else {
        ElMessage.error(res.msg || '创建失败')
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '创建失败')
    } finally {
      createTaskModal.loading = false
    }
  }

  const yjdwChangeHandle = async (value: string) => {
    const seq = ++projectEjdwRequestSeq
    projectSearchForm.ejdwList = []
    ejdwList.value = []
    if (!value) return
    try {
      const res = await getEjdwList({ ...buildRoleParams(), YJDW: value, parentCode: value })
      if (seq !== projectEjdwRequestSeq || projectSearchForm.yjdw !== value) return
      if (res.success) ejdwList.value = normalizeOptionList(res.data || [])
      else ElMessage.error(res.msg || '二级单位获取失败')
    } catch (error: any) {
      if (seq === projectEjdwRequestSeq && projectSearchForm.yjdw === value) ElMessage.error(error?.message || '二级单位获取失败')
    }
  }

  const getClassifyChildren = async (value: string) => {
    const res = await getFlList({ ...buildRoleParams(), code: 'GWXMFL', parentCode: value })
    if (res.success) return normalizeOptionList(res.data || [])
    throw new Error(res.msg || '分类获取失败')
  }

  const yjflChangeHandle = async (value: string) => {
    const seq = ++ejflRequestSeq
    sjflRequestSeq += 1
    projectSearchForm.ejfl = ''
    projectSearchForm.sjflList = []
    ejflList.value = []
    sjflList.value = []
    if (!value) return
    try {
      const list = await getClassifyChildren(value)
      if (seq !== ejflRequestSeq || projectSearchForm.yjfl !== value) return
      ejflList.value = list
    } catch (error: any) {
      if (seq === ejflRequestSeq && projectSearchForm.yjfl === value) ElMessage.error(error?.message || '二级分类获取失败')
    }
  }

  const ejflChangeHandle = async (value: string) => {
    const seq = ++sjflRequestSeq
    projectSearchForm.sjflList = []
    sjflList.value = []
    if (!value) return
    try {
      const list = await getClassifyChildren(value)
      if (seq !== sjflRequestSeq || projectSearchForm.ejfl !== value) return
      sjflList.value = list
    } catch (error: any) {
      if (seq === sjflRequestSeq && projectSearchForm.ejfl === value) ElMessage.error(error?.message || '三级分类获取失败')
    }
  }

  const selectedProjectId = ref<string | undefined>('')
  const activeRuleFilter = ref('')
  const selectedRuleId = ref<string | undefined>('')
  const selectedRules = ref<ReviewRule[]>([])
  const auditSummary = ref<WorkbenchAuditSummary>(createEmptyAuditSummary())
  const auditResultOptions = ref<any[]>([])
  const rulesLoading = ref(false)
  const ruleDetailLoading = ref(false)
  const ruleEmptyText = ref('暂无评审规则')
  /** 规则列表加载失败的原因；非空时列表区渲染错误态并提供重新加载 */
  const ruleLoadError = ref('')
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()
  const emptyProject: WorkbenchProject = { progress: 0, riskCount: 0 }
  const progressModal = ref<SmartTaskProgressExpose>()
  const ruleWorkspaceRef = ref<RuleWorkspaceExpose>()
  let roleLoadSeq = 0
  let ruleListLoadSeq = 0
  let ruleDetailLoadSeq = 0
  let auditSummaryLoadSeq = 0
  let pointsLoadSeq = 0
  let auditResultOptionsPromise: Promise<void> | null = null
  let projectSearchRequestSeq = 0
  let projectEjdwRequestSeq = 0
  let ejflRequestSeq = 0
  let sjflRequestSeq = 0
  let keywordSearchTimer: ReturnType<typeof setTimeout> | undefined
  /** clearFilters 主动查询时用它跳过一次 keyword watcher 排定的防抖查询 */
  let suppressKeywordSearch = false

  const selectedProject = computed<WorkbenchProject>(() => {
    return projects.value.find((item) => item.taskId === selectedProjectId.value) || projects.value[0] || emptyProject
  })
  /** 「总体评审情况」三档统计的选中风险等级名（问题/预警/提醒等）；空 = 不按等级过滤 */
  const activeRiskLevelFilter = ref('')
  const filteredRules = computed(() => {
    let rules = !activeRuleFilter.value
      ? selectedRules.value
      : selectedRules.value.filter((rule) => REVIEW_OPINION_RESULT_MAP[activeRuleFilter.value] === rule.result)
    if (activeRiskLevelFilter.value) {
      rules = rules.filter((rule) => String(rule.level || '') === activeRiskLevelFilter.value)
    }
    return rules
  })

  const getFirstRule = (rules: ReviewRule[]) => rules[0]

  const selectedRule = computed(() => filteredRules.value.find((rule) => rule.id === selectedRuleId.value) || filteredRules.value[0] || emptyRule)
  const overviewStatusTabs = computed(() => statusTabs.value.filter((tab) => String(tab.value).trim() !== ''))

  function statusClass(status?: string) {
    return STATUS_CLASS_MAP[String(status ?? '').trim()] || 'default'
  }

  /**
   * 总体评审结论徽标的配色位（结论胶囊的底色）。
   *
   * tone 来自字典 AI_AUDIT_RESULT_COM（兜底 AIRiskLevelDict）的 `type` 字段：
   *   10 success  → AI预审通过（绿）
   *   20 danger   → 问题项目（红）
   *   30 warning-orange → 隐患项目（橙）
   *   40 yellow   → 异常项目（黄）
   *   0  info / 1 primary-blue → 未分析 / 分析中（灰）
   *
   * 映射抽到 auditDetailHelpers.auditConclusionClass，与 smartTaskAudit 详情页共用一份；
   * CSS 侧 .conclusion-badge.{passed,danger,warning,yellow,waiting} 为实色底白字胶囊。
   */
  const conclusionClass = auditConclusionClass

  async function loadAuditResultOptions() {
    if (!auditResultOptionsPromise) {
      auditResultOptionsPromise = getPublicData(AUDIT_RESULT_PUBLIC_CODE)
        .then((res) => {
          if (res.success) auditResultOptions.value = normalizeOptionList(res.data || [])
        })
        .catch(() => undefined)
    }
    await auditResultOptionsPromise
  }

  function getAuditResultOption(result: string | number | null) {
    const key = String(result ?? '')
    const option = auditResultOptions.value.find((item: any) => String(item.code ?? item.id) === key || String(item.id ?? item.code) === key)
    const fallback = FALLBACK_AUDIT_RESULT_MAP.get(key)
    return option ? { ...fallback, ...option, name: option.name || fallback?.name, type: option.type || fallback?.type } : fallback
  }

  function clearAuditSummary() {
    auditSummaryLoadSeq += 1
    auditSummary.value = createEmptyAuditSummary()
  }

  async function loadProjectAuditSummary(project: WorkbenchProject) {
    const seq = ++auditSummaryLoadSeq
    const taskId = String(project.taskId || '').trim()
    auditSummary.value = createEmptyAuditSummary()
    if (!taskId) return

    const [summaryResult] = await Promise.allSettled([getXmAuditConclude(taskId), loadAuditResultOptions()])
    if (seq !== auditSummaryLoadSeq || selectedProjectId.value !== project.taskId) return
    // 失败原因写 errorText 而不是 conclusion：否则报错会被渲染成「总体评审结论」
    if (summaryResult.status === 'rejected') {
      const message = summaryResult.reason?.message || '审核结论获取失败'
      auditSummary.value = { ...createEmptyAuditSummary(), errorText: message }
      ElMessage.error(message)
      return
    }

    const res = summaryResult.value
    if (!res.success) {
      const message = res.msg || '审核结论获取失败'
      auditSummary.value = { ...createEmptyAuditSummary(), errorText: message }
      ElMessage.error(message)
      return
    }

    const summary = normalizeAuditSummaryData(res.data)
    const counts = createEmptyAuditSummary().counts
    for (const item of Array.isArray(summary.ruleLevelFindNumList) ? summary.ruleLevelFindNumList : []) {
      const level = AUDIT_RESULT_ALIAS_MAP[String(item?.ruleLevel ?? '')] || String(item?.ruleLevel ?? '')
      if (level === '1' || level === '2' || level === '3') {
        // 同一 ruleLevel 可能有多条（按 reviewOpinion 细分），findNum 需累加
        counts[level].count += Number(item.findNum) || 0
        // 名称取第一条非空的，接口同 ruleLevel 下各条的 ruleLevelName 应一致
        if (!counts[level].name) counts[level].name = String(item?.ruleLevelName ?? '').trim()
      }
    }
    const option = getAuditResultOption(summary.auditResult ?? '')
    auditSummary.value = {
      conclusion: String(summary.auditConclude ?? ''),
      statusText: String(option?.name ?? ''),
      statusTone: String(option?.type ?? ''),
      counts
    }
  }

  function getRuleResult(item: Partial<RuleReviewInfoRes>): RuleResult {
    if (!String(item.reviewOpinion ?? '').trim()) return ''
    const opinionName = String(item.reviewOpinionName ?? '').trim()
    return REVIEW_OPINION_NAME_RESULT_MAP[opinionName] || ''
  }

  function mapReviewRule(item: Partial<RuleReviewInfo>, index: number, current?: ReviewRule, fromDetail = false): ReviewRule {
    const id = String(item.detailId || item.ruleId || item.categoryRuleId || current?.id || `rule-${index}`)
    const reviewConclusion = String(item.reviewConclude || item.reviewOpinionName || current?.auditResult || '')
    return {
      ...(current || emptyRule),
      id,
      detailId: String(item.detailId || current?.detailId || ''),
      code: String(item.ruleCode || current?.code || ''),
      ruleLevel: String(item.ruleLevel || current?.ruleLevel || ''),
      ruleClassify: String(item.ruleClassify || current?.ruleClassify || ''),
      ruleClassifyName: String(item.ruleClassifyName || current?.ruleClassifyName || ''),
      categoryRuleId: String(item.categoryRuleId || current?.categoryRuleId || ''),
      category: String(item.ruleLevelName || current?.category || ''),
      name: String(item.ruleName || current?.name || '未命名规则'),
      result: fromDetail ? current?.result ?? '' : getRuleResult(item),
      reviewOpinionName: fromDetail ? current?.reviewOpinionName ?? '' : String(item.reviewOpinionName ?? '').trim(),
      level: String(item.ruleLevelName || RULE_LEVEL_LABEL_MAP.get(String(item.ruleLevel || '') as AuditSummaryRuleLevel) || current?.level || ''),
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
      conclusion: reviewConclusion,
      document: String(item.document || item.fileName || current?.document || ''),
      page: Number(item.page ?? current?.page) || 0,
      section: String(item.section || current?.section || ''),
      before: String(item.before || current?.before || ''),
      after: String(item.after || current?.after || ''),
      source: String(item.originalText || current?.source || '')
    }
  }

  const { ruleClassifies, applyRuleClassifies, resetRuleClassifies } = useRuleClassifies()

  const annotateRuleClassifies = async (taskId: string) => {
    await applyRuleClassifies({
      taskId,
      getRules: () => selectedRules.value,
      setRules: (rules) => {
        selectedRules.value = rules
      },
      isActive: () => isShowPage.value && String(selectedProject.value.taskId || '').trim() === taskId
    })
  }

  async function refreshProjectRuleList(taskId: string) {
    const seq = ruleListLoadSeq
    rulesLoading.value = true
    try {
      const res = await listCategoryRuleReview({ taskId })
      if (seq !== ruleListLoadSeq || !isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) return
      if (!res.success) {
        ruleLoadError.value = res.msg || '评审规则刷新失败'
        ElMessage.error(ruleLoadError.value)
        return
      }

      const currentRules = new Map(selectedRules.value.map((rule) => [rule.id, rule]))
      const keys = new Set<string>()
      selectedRules.value = (Array.isArray(res.data) ? res.data : [])
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
      // 结果变化后可能不再匹配原筛选，切回全部以保留当前选中的规则。
      if (
        selectedRules.value.some((rule) => rule.id === selectedRuleId.value) &&
        !filteredRules.value.some((rule) => rule.id === selectedRuleId.value)
      ) {
        activeRuleFilter.value = ''
      }
      ruleLoadError.value = ''
      ruleEmptyText.value = selectedRules.value.length ? '当前筛选下暂无规则' : '暂无评审规则'
      await annotateRuleClassifies(taskId)
    } catch (error: any) {
      if (seq === ruleListLoadSeq && isShowPage.value && String(selectedProject.value.taskId || '').trim() === taskId) {
        ruleLoadError.value = error?.message || '评审规则刷新失败'
        ElMessage.error(ruleLoadError.value)
      }
    } finally {
      if (seq === ruleListLoadSeq && String(selectedProject.value.taskId || '').trim() === taskId) rulesLoading.value = false
    }
  }

  const { rerunningRuleIds, rerunConfirmingRuleId, rerunRule, rerunRule1, stopAllRuleReruns } = useRuleRerun({
    getTaskId: () => String(selectedProject.value.taskId || '').trim(),
    isActive: (taskId) => isShowPage.value && String(selectedProject.value.taskId || '').trim() === taskId,
    getActiveRuleKey: () => getRuleRerunKey(selectedRule.value),
    onCompleted: async (rule, data, taskId) => {
      if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) return

      selectedRules.value = selectedRules.value.map((item, index) => (item.id === rule.id ? mapReviewRule(data, index, item, true) : item))

      await Promise.all([refreshProjectRuleList(taskId), loadProjectAuditSummary(selectedProject.value)])
      if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) return

      // 重新分析后重新拉取审核要点（listRuleReviewNew），并刷新审核依据
      const rerunRule = selectedRules.value.find((item) => item.id === rule.id)
      if (rerunRule) await loadReviewPoints(rerunRule)
      ruleWorkspaceRef.value?.refreshSelectedPointDetail()

      if (selectedRuleId.value === rule.id && !filteredRules.value.some((item) => item.id === rule.id)) {
        const nextRule = filteredRules.value[0]
        selectedRuleId.value = nextRule?.id || ''
        if (nextRule) await loadRuleDetail(nextRule)
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
    if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) {
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
        if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) {
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
        const seq = ruleListLoadSeq
        await Promise.all([refreshProjectRuleList(taskId), loadProjectAuditSummary(selectedProject.value)])
        if (seq !== ruleListLoadSeq || !isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) {
          stopPointRerun(detailId)
          return
        }
        const rule = selectedRule.value
        if (rule) await loadReviewPoints(rule)
        await nextTick()
        if (seq === ruleListLoadSeq && isShowPage.value && String(selectedProject.value.taskId || '').trim() === taskId) {
          ruleWorkspaceRef.value?.refreshSelectedPointDetail()
        }
        stopPointRerun(detailId)
      } catch (error: any) {
        stopPointRerun(detailId)
        ElMessage.error(error?.message || '获取评审结果失败')
      }
    }, RERUN_POINT_POLL_INTERVAL_MS)
    rerunPointTimers.set(detailId, timer)
  }

  const rerunReviewPoint = async (detailId: string) => {
    const taskId = String(selectedProject.value.taskId || '').trim()
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

    if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId || rerunningRuleIds.value.has(detailId)) return

    rerunningRuleIds.value = new Set([...rerunningRuleIds.value, detailId])
    try {
      const res = await redoAuditRule({ detailId })
      if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) {
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

  const stopAllPointReruns = () => {
    rerunPointTimers.forEach((timer) => clearTimeout(timer))
    rerunPointTimers.clear()
  }

  function resetRules(message = '暂无评审规则') {
    stopAllRuleReruns()
    stopAllPointReruns()
    resetRuleClassifies()
    ruleListLoadSeq += 1
    ruleDetailLoadSeq += 1
    pointsLoadSeq += 1
    rulesLoading.value = false
    ruleDetailLoading.value = false
    selectedRules.value = []
    selectedRuleId.value = ''
    ruleEmptyText.value = message
    ruleLoadError.value = ''
  }

  async function loadRuleDetail(rule: ReviewRule) {
    selectedRuleId.value = rule.id
    const detailId = String(rule.detailId || '').trim()
    const taskId = String(selectedProject.value.taskId || '').trim()
    if (!taskId) return

    const seq = ++ruleDetailLoadSeq
    ruleDetailLoading.value = true
    try {
      if (detailId) {
        const res = await getRuleReview({ detailId })
        if (seq !== ruleDetailLoadSeq || selectedRuleId.value !== rule.id) return
        if (!res.success) {
          ElMessage.error(res.msg || '评审详情获取失败')
          return
        }
        selectedRules.value = selectedRules.value.map((item, index) =>
          item.id === rule.id ? mapReviewRule((res.data || {}) as RuleReviewInfo, index, item, true) : item
        )
      }
      // 详情回填后单独拉取审核要点（listRuleReviewNew），不依赖详情接口的 points 字段
      const mergedRule = selectedRules.value.find((item) => item.id === rule.id)
      if (mergedRule) void loadReviewPoints(mergedRule)
    } catch (error: any) {
      if (seq === ruleDetailLoadSeq) ElMessage.error(error?.message || '评审详情获取失败')
    } finally {
      if (seq === ruleDetailLoadSeq) ruleDetailLoading.value = false
    }
  }

  /** 审核要点的权威来源：单独调 listRuleReviewNew，按规则的 categoryRuleId 拉取该规则下的要点列表 */
  async function loadReviewPoints(rule: ReviewRule) {
    const taskId = String(selectedProject.value.taskId || '').trim()
    const categoryRuleId = String(rule.categoryRuleId || '').trim()
    if (!taskId || !categoryRuleId) return

    const seq = ++pointsLoadSeq
    try {
      const res = await listRuleReviewNew({ taskId, categoryRuleId })
      if (seq !== pointsLoadSeq || selectedRuleId.value !== rule.id) return
      if (!res.success) {
        ElMessage.error(res.msg || '审核要点获取失败')
        return
      }
      const points = (Array.isArray(res.data) ? res.data : []).map((item) => ({
        ...item,
        id: String(item.detailId || item.ruleId || '')
      }))
      selectedRules.value = selectedRules.value.map((item) => (item.id === rule.id ? { ...item, points } : item))
    } catch (error: any) {
      if (seq === pointsLoadSeq) ElMessage.error(error?.message || '审核要点获取失败')
    }
  }

  async function loadProjectRules(project: WorkbenchProject) {
    stopAllRuleReruns()
    resetRuleClassifies()
    const seq = ++ruleListLoadSeq
    ruleDetailLoadSeq += 1
    rulesLoading.value = false
    selectedRules.value = []
    selectedRuleId.value = ''
    ruleEmptyText.value = '暂无评审规则'
    ruleLoadError.value = ''

    const taskId = String(project.taskId || '').trim()
    if (!taskId) {
      ruleEmptyText.value = '当前项目缺少审核任务ID'
      return
    }

    rulesLoading.value = true
    try {
      const res = await listCategoryRuleReview({ taskId })
      if (seq !== ruleListLoadSeq || selectedProjectId.value !== project.taskId) return
      if (!res.success) {
        ruleLoadError.value = res.msg || '评审规则获取失败'
        ruleEmptyText.value = ''
        ElMessage.error(ruleLoadError.value)
        return
      }

      const currentRules = new Map(selectedRules.value.map((rule) => [rule.id, rule]))
      const keys = new Set<string>()
      selectedRules.value = (Array.isArray(res.data) ? res.data : [])
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
      ruleEmptyText.value = selectedRules.value.length ? '当前筛选下暂无规则' : '暂无评审规则'
      await annotateRuleClassifies(taskId)
      if (seq !== ruleListLoadSeq || selectedProjectId.value !== project.taskId) return

      const firstRule = getFirstRule(selectedRules.value)
      if (firstRule) await loadRuleDetail(firstRule)
    } catch (error: any) {
      if (seq !== ruleListLoadSeq) return
      ruleLoadError.value = error?.message || '评审规则获取失败'
      ruleEmptyText.value = ''
      ElMessage.error(ruleLoadError.value)
    } finally {
      if (seq === ruleListLoadSeq) rulesLoading.value = false
    }
  }

  /** 规则列表加载失败后的重试入口（对应容错原则的「从错误中恢复」） */
  function reloadRules() {
    const project = selectedProject.value
    if (!isShowPage.value || !String(project.taskId || '').trim()) return
    void loadProjectRules(project)
  }

  /** 审核结论加载失败后的重试入口 */
  function retryAuditSummary() {
    const project = selectedProject.value
    if (!isShowPage.value || !String(project.taskId || '').trim()) return
    void loadProjectAuditSummary(project)
  }

  /** 导出当前任务的审核要点结论明细 */
  const exportingSummary = ref(false)
  async function exportAuditSummary() {
    const taskId = String(selectedProject.value.taskId || '').trim()
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

  function openHelpModal() {
    if (helpModalRef.value) helpModalRef.value.showModal = true
  }

  /** 空结果时一键回到无筛选状态，给用户一条明确的恢复路径 */
  async function clearFilters() {
    // watcher 是 pre-flush 的异步回调，会在本函数同步体之后才排定防抖查询；
    // 这里标记跳过一次，避免清空筛选后 400ms 又打一次重复请求
    if (keyword.value.trim()) suppressKeywordSearch = true
    keyword.value = ''
    if (keywordSearchTimer) {
      clearTimeout(keywordSearchTimer)
      keywordSearchTimer = undefined
    }
    await searchProject('')
  }

  async function syncSelectedProject(loadFirst = false) {
    const project = loadFirst ? projects.value[0] : projects.value.find((item) => item.taskId === selectedProjectId.value) || projects.value[0]
    if (!project) {
      selectedProjectId.value = ''
      resetRules()
      clearAuditSummary()
      return
    }
    selectedProjectId.value = project.taskId
    await Promise.all([loadProjectRules(project), loadProjectAuditSummary(project)])
  }

  function selectProject(project: WorkbenchProject) {
    selectedProjectId.value = project.taskId
    activeRuleFilter.value = ''
    void Promise.all([loadProjectRules(project), loadProjectAuditSummary(project)])
  }

  function selectRule(rule: ReviewRule) {
    void loadRuleDetail(rule)
  }

  function changeRuleFilter(value: string) {
    activeRuleFilter.value = value
    const nextRule = getFirstRule(filteredRules.value)
    selectedRuleId.value = nextRule?.id || ''
    if (nextRule) void loadRuleDetail(nextRule)
  }

  /**
   * 点「总体评审情况」三档统计标签：按风险等级名（ruleLevelName，如 问题/预警/提醒）联动筛选评审规则。
   * 开关语义——再点一次取消，清空等级过滤。
   */
  function selectRiskLevel(name: string) {
    activeRiskLevelFilter.value = activeRiskLevelFilter.value === name ? '' : name
    const nextRule = getFirstRule(filteredRules.value)
    selectedRuleId.value = nextRule?.id || ''
    if (nextRule) void loadRuleDetail(nextRule)
  }

  function openProgress(project: WorkbenchProject) {
    const taskId = String(project.taskId || '').trim()
    if (!taskId) {
      ElMessage.warning('当前任务缺少任务ID')
      return
    }
    // 项目名供进度弹窗标题用（「智能审核规则(项目名)」）
    void progressModal.value?.acceptParams({ taskId, projectName: String(project.xmmc || '').trim() })
  }

  async function refreshData() {
    if (keywordSearchTimer) {
      clearTimeout(keywordSearchTimer)
      keywordSearchTimer = undefined
    }

    await Promise.all([searchList(), syncSelectedProject()])

    const selectedProjectExists = projects.value.some((project) => project.taskId === selectedProjectId.value)
    if (!selectedProjectExists) await syncSelectedProject(true)
  }

  async function searchProject(status: string) {
    if (keywordSearchTimer) {
      clearTimeout(keywordSearchTimer)
      keywordSearchTimer = undefined
    }
    activeStatus.value = status || ''
    page.page = 1
    await searchList()
    await syncSelectedProject(true)
  }

  async function pageChangeHandle(currentPage: number) {
    await changeListPage(currentPage)
    await syncSelectedProject(true)
  }

  async function limitChangeHandle(currentLimit: number) {
    await changeListLimit(currentLimit)
    await syncSelectedProject(true)
  }

  async function getRoleHandle() {
    const seq = ++roleLoadSeq
    invalidateSearch()
    projectSearchRequestSeq += 1
    projectEjdwRequestSeq += 1
    ejflRequestSeq += 1
    sjflRequestSeq += 1
    if (!userRoleSelectorRef.value) return
    isShowPage.value = Boolean(unref(userRoleSelectorRef.value.canRender))
    if (!isShowPage.value) {
      stopAllRuleReruns()
      projectGridOptions.loading = false
      return
    }

    await nextTick()
    if (seq !== roleLoadSeq) return
    await Promise.all([initCreateTaskOptions(seq), searchList()])
    if (seq !== roleLoadSeq) return
    await syncSelectedProject(true)
  }

  onMounted(() => {
    userRoleSelectorRef.value?.getUser()
  })

  // 监听 trim 后的值：输入框保留用户敲的空格，但纯空白变化不该触发查询
  watch(
    () => keyword.value.trim(),
    () => {
      if (suppressKeywordSearch) {
        suppressKeywordSearch = false
        return
      }
      if (keywordSearchTimer) clearTimeout(keywordSearchTimer)
      invalidateSearch()
      keywordSearchTimer = setTimeout(() => {
        keywordSearchTimer = undefined
        if (isShowPage.value) void searchProject(activeStatus.value)
      }, KEYWORD_SEARCH_DEBOUNCE_MS)
    }
  )

  onBeforeUnmount(() => {
    if (keywordSearchTimer) clearTimeout(keywordSearchTimer)
    stopAllRuleReruns()
    stopAllPointReruns()
  })

  return {
    isShowPage,
    userRoleSelectorRef,
    currentUserRole,
    page,
    getRoleHandle,
    pageChangeHandle,
    limitChangeHandle,
    projects,
    statusTabs,
    overviewStatusTabs,
    ruleFilters,
    ruleClassifies,
    activeStatus,
    keyword,
    activeRuleFilter,
    activeRiskLevelFilter,
    selectedRuleId,
    rulesLoading,
    ruleDetailLoading,
    ruleEmptyText,
    ruleLoadError,
    listErrorMessage,
    helpModalRef,
    rerunningRuleIds,
    rerunConfirmingRuleId,
    refreshing,
    progressModal,
    ruleWorkspaceRef,
    selectedProject,
    selectedRules,
    filteredRules,
    selectedRule,
    auditSummary,
    statusClass,
    conclusionClass,
    selectProject,
    selectRule,
    changeRuleFilter,
    selectRiskLevel,
    rerunRule,
    rerunRule1,
    rerunReviewPoint,
    openProgress,
    refreshData,
    searchProject,
    reloadRules,
    retryAuditSummary,
    exportingSummary,
    exportAuditSummary,
    openHelpModal,
    clearFilters,
    createTaskModalRef,
    projectSearchForm,
    projectGridOptions,
    projectPage,
    createTaskModal,
    yearList,
    yjdwList,
    ejdwList,
    projectTypeList,
    yjflList,
    ejflList,
    sjflList,
    flowStatusList,
    selectedProjectRows,
    openCreateTaskModal,
    closeCreateTaskModal,
    resetProjectHandle,
    searchProjectHandle,
    projectPageChangeHandle,
    projectLimitChangeHandle,
    createTaskHandle,
    syncSelectedProjectRows,
    yjdwChangeHandle,
    yjflChangeHandle,
    ejflChangeHandle
  }
}
