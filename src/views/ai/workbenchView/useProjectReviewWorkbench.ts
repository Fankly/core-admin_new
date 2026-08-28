import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, shallowRef, unref, watch } from 'vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type HelpModal from '@/components/HelpModal/index.vue'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import {
  createSmartTaskAudit,
  getEjdwList,
  getFlList,
  getFlowStatusList,
  getRuleReview,
  getRuleReviewInfo,
  getSmartTaskAuditProjectList,
  getXmAuditConclude,
  getYjdwList
} from '@/api/ai/smartTaskAudit'
import type { RuleReviewInfo, RuleReviewInfoRes, SmartTaskAuditListItem } from '@/api/ai/smartTaskAudit'
import { getPublicData, getSubProtypeTree, getYearData, getYjflList } from '@/api/common'
import { AIRiskLevelDict } from '@/staticDict/index.js'
import { useSmartTaskAuditList } from '@/composables/useSmartTaskAuditList'
import {
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
import type { ReviewRule, RuleResult, WorkbenchAuditSummary, WorkbenchFilterOption, WorkbenchProject } from './types'

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
const REVIEW_OPINION_RESULT_MAP: Record<string, RuleResult> = {
  '0': 'failed',
  '1': 'passed',
  '2': 'warning'
}

const prependAllOption = (options: WorkbenchFilterOption[] = []): WorkbenchFilterOption[] => [
  { label: '全部', value: '' },
  ...options.filter((item) => item.value !== '')
]

const createEmptyAuditSummary = (): WorkbenchAuditSummary => ({
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
  provide('currentUserRole', currentUserRole)

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
  let roleLoadSeq = 0
  let ruleListLoadSeq = 0
  let ruleDetailLoadSeq = 0
  let auditSummaryLoadSeq = 0
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
  const filteredRules = computed(() =>
    !activeRuleFilter.value
      ? selectedRules.value
      : selectedRules.value.filter((rule) => REVIEW_OPINION_RESULT_MAP[activeRuleFilter.value] === rule.result)
  )

  const getFirstRule = (rules: ReviewRule[]) => rules[0]

  const selectedRule = computed(() => filteredRules.value.find((rule) => rule.id === selectedRuleId.value) || filteredRules.value[0] || emptyRule)
  const overviewStatusTabs = computed(() => statusTabs.value.filter((tab) => String(tab.value).trim() !== ''))

  function statusClass(status?: string) {
    return STATUS_CLASS_MAP[String(status ?? '').trim()] || 'default'
  }

  function conclusionClass(tone?: string) {
    if (tone === 'success') return 'passed'
    if (tone === 'info' || tone === 'primary-blue') return 'waiting'
    return 'warning'
  }

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
      if (level === '1' || level === '2' || level === '3') counts[level] = Number(item.findNum) || 0
    }
    const option = getAuditResultOption(summary.auditResult ?? '')
    auditSummary.value = {
      conclusion: String(summary.auditConclude ?? ''),
      statusText: String(option?.name ?? ''),
      statusTone: String(option?.type ?? ''),
      counts
    }
  }

  function getRuleResult(item: Partial<RuleReviewInfoRes>, fallback: RuleResult = ''): RuleResult {
    const opinion = String(item.reviewOpinion ?? '')
    if (opinion === '1') return 'passed'
    if (opinion === '2') return 'warning'
    if (opinion === '0') return 'failed'
    return fallback
  }

  function mapReviewRule(item: Partial<RuleReviewInfo>, index: number, current?: ReviewRule): ReviewRule {
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
      level: String(item.ruleLevelName || RULE_LEVEL_LABEL_MAP.get(String(item.ruleLevel || '') as AuditSummaryRuleLevel) || current?.level || ''),
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
      const res = await getRuleReviewInfo({
        taskId,
        ruleClassify: '',
        reviewOpinions: ''
      })
      if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) return
      if (!res.success) {
        ruleLoadError.value = res.msg || '评审规则刷新失败'
        ElMessage.error(ruleLoadError.value)
        return
      }

      const currentRules = new Map(selectedRules.value.map((rule) => [rule.id, rule]))
      const keys = new Set<string>()
      selectedRules.value = (Array.isArray(res.data) ? res.data : [])
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
      ruleEmptyText.value = selectedRules.value.length ? '当前筛选下暂无规则' : '暂无评审规则'
      await annotateRuleClassifies(taskId)
    } catch (error: any) {
      if (isShowPage.value && String(selectedProject.value.taskId || '').trim() === taskId) {
        ruleLoadError.value = error?.message || '评审规则刷新失败'
        ElMessage.error(ruleLoadError.value)
      }
    } finally {
      if (seq === ruleListLoadSeq && String(selectedProject.value.taskId || '').trim() === taskId) rulesLoading.value = false
    }
  }

  const { rerunningRuleIds, rerunConfirmingRuleId, rerunRule, stopAllRuleReruns } = useRuleRerun({
    getTaskId: () => String(selectedProject.value.taskId || '').trim(),
    isActive: (taskId) => isShowPage.value && String(selectedProject.value.taskId || '').trim() === taskId,
    getActiveRuleKey: () => getRuleRerunKey(selectedRule.value),
    onCompleted: async (rule, data, taskId) => {
      if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) return

      selectedRules.value = selectedRules.value.map((item, index) => (item.id === rule.id ? mapReviewRule(data, index, item) : item))

      await Promise.all([refreshProjectRuleList(taskId), loadProjectAuditSummary(selectedProject.value)])
      if (!isShowPage.value || String(selectedProject.value.taskId || '').trim() !== taskId) return

      if (selectedRuleId.value === rule.id && !filteredRules.value.some((item) => item.id === rule.id)) {
        const nextRule = filteredRules.value[0]
        selectedRuleId.value = nextRule?.id || ''
        if (nextRule) await loadRuleDetail(nextRule)
      }
    }
  })

  function resetRules(message = '暂无评审规则') {
    stopAllRuleReruns()
    resetRuleClassifies()
    ruleListLoadSeq += 1
    ruleDetailLoadSeq += 1
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
    if (!detailId) return

    const seq = ++ruleDetailLoadSeq
    ruleDetailLoading.value = true
    try {
      const res = await getRuleReview({ detailId })
      if (seq !== ruleDetailLoadSeq || selectedRuleId.value !== rule.id) return
      if (!res.success) {
        ElMessage.error(res.msg || '评审详情获取失败')
        return
      }

      selectedRules.value = selectedRules.value.map((item, index) =>
        item.id === rule.id ? mapReviewRule((res.data || {}) as RuleReviewInfo, index, item) : item
      )
    } catch (error: any) {
      if (seq === ruleDetailLoadSeq) ElMessage.error(error?.message || '评审详情获取失败')
    } finally {
      if (seq === ruleDetailLoadSeq) ruleDetailLoading.value = false
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
      const res = await getRuleReviewInfo({
        taskId,
        ruleClassify: '',
        reviewOpinions: ''
      })
      if (seq !== ruleListLoadSeq || selectedProjectId.value !== project.taskId) return
      if (!res.success) {
        ruleLoadError.value = res.msg || '评审规则获取失败'
        ruleEmptyText.value = ''
        ElMessage.error(ruleLoadError.value)
        return
      }

      const keys = new Set<string>()
      selectedRules.value = (Array.isArray(res.data) ? res.data : [])
        .filter((item) => {
          const key = String(item.detailId || item.ruleId || '')
          if (!key || keys.has(key)) return false
          keys.add(key)
          return true
        })
        .map((item, index) => mapReviewRule(item, index))
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

  function openProgress(project: WorkbenchProject) {
    const taskId = String(project.taskId || '').trim()
    if (!taskId) {
      ElMessage.warning('当前任务缺少任务ID')
      return
    }
    void progressModal.value?.acceptParams({ taskId })
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
    rerunRule,
    openProgress,
    refreshData,
    searchProject,
    reloadRules,
    retryAuditSummary,
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
