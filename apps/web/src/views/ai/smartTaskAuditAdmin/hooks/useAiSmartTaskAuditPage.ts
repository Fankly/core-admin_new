import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'
import { computed, markRaw, nextTick, provide, reactive, ref, shallowRef, unref } from 'vue'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type HelpModal from '@/components/HelpModal/index.vue'
import type { RangeVxeTableExpose } from '@/components/RangeVxeTable/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { getPublicData, getSubProtypeTree, getYearData, getYjflList } from '@/api/common'
import {
  createSmartTaskAudit,
  deleteSmartTaskAudit,
  exportSmartTaskAuditList,
  getEjdwList,
  getFlList,
  getFlowStatusList,
  getSmartTaskAuditList,
  getSmartTaskAuditProjectList,
  getTaskDetailById,
  getTaskDetailByTask,
  getTaskDetailSumByTask,
  getYjdwList,
  redoTask,
  redoTaskWithCompleteRule,
  updatePriority,
  updateTask
} from '@/api/ai/smartTaskAudit'
import { apiExportHandle } from '@/utils/export'
import { createGridOptions } from '../table'
import { createProjectGridOptions } from '../projectTable'
import { createProjectSearchForm, createSearchForm, normalizeOptionList, normalizeTreeOptionList, normalizeYearList, splitCodes } from '../utils'
import type { AiAuditTaskDetailVO, AiAuditTaskDetailSumVO, AiAuditTaskEntity } from '@/api/ai/smartTaskAudit'
import type { OptionItem, PriorityForm, ProjectSearchForm, SearchForm, SmartTaskAuditProjectRow, SmartTaskAuditRow } from '../types'

interface SmartTaskAuditSearchExpose {
  clearValidate: () => void
}

interface CreateTaskModalExpose {
  clearValidate: () => void
  clearCheckboxRow: () => unknown
  getCheckboxRecords: () => SmartTaskAuditProjectRow[]
}

export const useAiSmartTaskAuditPage = () => {
  const store = useStore()
  const isShowPage = ref(false)
  const searchVisible = ref(true)
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()
  const gridRef = ref<RangeVxeTableExpose<SmartTaskAuditRow>>()
  const searchFormRef = ref<SmartTaskAuditSearchExpose>()
  const createTaskModalRef = ref<CreateTaskModalExpose>()
  const priorityFormRef = ref()
  const editTaskFormRef = ref()
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

  const searchForm = reactive<SearchForm>(createSearchForm())
  const projectSearchForm = reactive<ProjectSearchForm>(createProjectSearchForm())
  const taskStatusOptions = shallowRef<OptionItem[]>([])
  const docPreStatusOptions = shallowRef<OptionItem[]>([])
  const yesNoOptions = shallowRef<OptionItem[]>([])
  const priorityOptions = shallowRef<OptionItem[]>([])
  // 修改任务弹窗的三个额外下拉：审核意见 / 审核结果 / 是否历史（是否历史复用 yesNoOptions，无需单独拉）
  const reviewOpinionOptions = shallowRef<OptionItem[]>([])
  const reviewResultOptions = shallowRef<OptionItem[]>([])
  // 人工复核意见 / 人工复核状态 下拉
  const manualReviewOpinionOptions = shallowRef<OptionItem[]>([])
  const manualReviewStatusOptions = shallowRef<OptionItem[]>([])
  const yearList = shallowRef<OptionItem[]>([])
  const yjdwList = shallowRef<OptionItem[]>([])
  const searchEjdwList = shallowRef<OptionItem[]>([])
  const ejdwList = shallowRef<OptionItem[]>([])
  const projectTypeList = shallowRef<any[]>([])
  const yjflList = shallowRef<OptionItem[]>([])
  const ejflList = shallowRef<OptionItem[]>([])
  const sjflList = shallowRef<OptionItem[]>([])
  const flowStatusList = shallowRef<OptionItem[]>([])
  const selectedRows = shallowRef<SmartTaskAuditRow[]>([])
  const selectedProjectRows = shallowRef<SmartTaskAuditProjectRow[]>([])
  const detailRow = shallowRef<SmartTaskAuditRow>({})
  const gridOptions = reactive(createGridOptions())
  const projectGridOptions = reactive(createProjectGridOptions())

  const projectPage = reactive({
    total: 0,
    limit: 20,
    page: 1
  })

  const createTaskModal = reactive({
    visible: false,
    loading: false
  })

  const detailModal = reactive({
    visible: false,
    loading: false
  })

  const priorityModal = reactive({
    visible: false,
    loading: false
  })

  const priorityForm = reactive<PriorityForm>({
    priority: ''
  })

  /** 修改任务弹窗状态与表单：表单直接复用 AiAuditTaskEntity 形状，taskId 必填 */
  const editTaskModal = reactive({
    visible: false,
    loading: false
  })

  /** 修改任务表单的初始值：除 taskId 外全部置空，避免上次打开残留 */
  const createEditTaskForm = (): AiAuditTaskEntity => ({
    taskId: '',
    proId: '',
    taskName: '',
    priority: '',
    startTime: '',
    finishTime: '',
    isHis: '',
    status: '',
    reviewOpinion: '',
    reviewConclude: '',
    reviewProcess: '',
    message: '',
    ruleName: '',
    result: '',
    manualReviewOpinion: '',
    manualReviewStatus: ''
  })

  const editTaskForm = reactive<AiAuditTaskEntity>(createEditTaskForm())

  /** 审核要点详情弹窗：按任务ID拉 getTaskDetailByTask，展示该任务下全部审核要点 */
  const taskDetailModal = reactive({
    visible: false,
    loading: false
  })
  const taskDetailList = shallowRef<AiAuditTaskDetailVO[]>([])
  // 当前打开审核要点详情的任务ID，供修改成功后刷新复用，无需响应式
  let taskDetailTaskId = ''

  /** 审核任务规则详情弹窗：按任务ID拉 getTaskDetailSumByTask，展示该任务下全部审核规则汇总 */
  const taskDetailSumModal = reactive({
    visible: false,
    loading: false
  })
  const taskDetailSumList = shallowRef<AiAuditTaskDetailSumVO[]>([])
  // 当前打开审核规则详情的任务ID，供修改成功后刷新复用，无需响应式
  let taskDetailSumTaskId = ''

  const progressModal = ref()

  let roleLoadSeq = 0
  let projectSearchRequestSeq = 0
  let searchEjdwRequestSeq = 0
  let projectEjdwRequestSeq = 0
  let ejflRequestSeq = 0
  let sjflRequestSeq = 0

  const asGridData = <T>(data: T[] | null | undefined): T[] => markRaw(Array.isArray(data) ? data : [])

  provide(CurrentUserRoleInjectionKey, currentUserRole)

  const getSelectedRows = (): SmartTaskAuditRow[] => {
    return gridRef.value?.getCheckboxRecords() || selectedRows.value || []
  }

  const clearSelectedRows = async () => {
    selectedRows.value = []
    await gridRef.value?.clearCheckboxRow()
  }

  const syncSelectedRows = (records: SmartTaskAuditRow[]) => {
    selectedRows.value = records || []
  }

  const syncSelectedProjectRows = (records: SmartTaskAuditProjectRow[]) => {
    selectedProjectRows.value = records || []
  }

  const buildRoleParams = () => ({
    bmId: currentUserRole.value.bmId,
    dwId: currentUserRole.value.dwId,
    roleId: currentUserRole.value.roleId,
    roleCode: currentUserRole.value.roleCode,
    userId: store.getters.getUserMsg?.id || ''
  })

  const buildSearchParams = () => {
    const { xmbm, ...rest } = searchForm
    return {
      ...buildRoleParams(),
      ...rest,
      xmbmList: splitCodes(xmbm)
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

  const requestTaskList = async (params: { page?: number; limit?: number }) => {
    gridOptions.loading = true
    try {
      const res = await getSmartTaskAuditList({
        ...buildSearchParams(),
        page: params.page || 1,
        limit: params.limit || 20
      })
      if (!res.success) throw new Error(res.msg || '查询失败')
      return res
    } finally {
      gridOptions.loading = false
    }
  }

  const requestTaskListError = (error: unknown) => {
    ElMessage.error(error instanceof Error ? error.message : '查询失败')
  }

  const searchHandle = () => gridRef.value?.getTableList()

  const resetTaskPagination = (resetSize = false) => {
    if (!gridRef.value) return
    gridRef.value.pageable.current = 1
    if (resetSize) gridRef.value.pageable.size = 20
  }

  const searchProjectHandle = async () => {
    const seq = ++projectSearchRequestSeq
    const params = buildProjectSearchParams()
    projectGridOptions.loading = true
    try {
      const res = await getSmartTaskAuditProjectList(params)
      if (seq !== projectSearchRequestSeq) return
      if (res.success) {
        projectGridOptions.data = asGridData<SmartTaskAuditProjectRow>(res.data?.records)
        projectPage.total = res.data?.total || 0
        selectedProjectRows.value = []
        await createTaskModalRef.value?.clearCheckboxRow()
      } else {
        ElMessage.error(res.msg)
        projectGridOptions.data = []
        projectPage.total = 0
      }
    } catch (e: any) {
      if (seq !== projectSearchRequestSeq) return
      ElMessage.error(e.message || '查询项目失败')
      projectGridOptions.data = []
      projectPage.total = 0
    } finally {
      if (seq === projectSearchRequestSeq) {
        projectGridOptions.loading = false
      }
    }
  }

  const initOptions = async (seq: number) => {
    const [
      statusRes,
      docPreStatusRes,
      yesNoRes,
      priorityRes,
      reviewOpinionRes,
      reviewResultRes,
      manualReviewOpinionRes,
      manualReviewStatusRes,
      yearRes,
      yjdwRes,
      projectTypeRes,
      yjflRes,
      flowStatusRes
    ] = await Promise.allSettled([
      getPublicData('AI_AUDIT_TASK_STATUS_COM'),
      getPublicData('AI_AUDIT_DOC_PRE_STATUS_COM'),
      getPublicData('GY_SF'),
      getPublicData('AI_AUDIT_TASK_PRIORITY_COM'),
      getPublicData('AI_AUDIT_REVIEW_OPINION_COM'),
      getPublicData('AI_AUDIT_TASK_RESULT_COM'),
      getPublicData('MANUAL_REVIEW_OPINION_COM'),
      getPublicData('AI_AUDIT_MANUAL_REVIEW_STATUS_COM'),
      getYearData(),
      getYjdwList(buildRoleParams()),
      getSubProtypeTree(),
      getYjflList('GWXMFL'),
      getFlowStatusList(buildRoleParams())
    ])
    if (seq !== roleLoadSeq) return
    if (statusRes.status === 'fulfilled') taskStatusOptions.value = normalizeOptionList(statusRes.value.success ? statusRes.value.data || [] : [])
    if (docPreStatusRes.status === 'fulfilled')
      docPreStatusOptions.value = normalizeOptionList(docPreStatusRes.value.success ? docPreStatusRes.value.data || [] : [])
    if (yesNoRes.status === 'fulfilled') yesNoOptions.value = normalizeOptionList(yesNoRes.value.success ? yesNoRes.value.data || [] : [])
    if (priorityRes.status === 'fulfilled') priorityOptions.value = normalizeOptionList(priorityRes.value.success ? priorityRes.value.data || [] : [])
    if (reviewOpinionRes.status === 'fulfilled')
      reviewOpinionOptions.value = normalizeOptionList(reviewOpinionRes.value.success ? reviewOpinionRes.value.data || [] : [])
    if (reviewResultRes.status === 'fulfilled')
      reviewResultOptions.value = normalizeOptionList(reviewResultRes.value.success ? reviewResultRes.value.data || [] : [])
    if (manualReviewOpinionRes.status === 'fulfilled')
      manualReviewOpinionOptions.value = normalizeOptionList(
        manualReviewOpinionRes.value.success ? manualReviewOpinionRes.value.data || [] : []
      )
    if (manualReviewStatusRes.status === 'fulfilled')
      manualReviewStatusOptions.value = normalizeOptionList(
        manualReviewStatusRes.value.success ? manualReviewStatusRes.value.data || [] : []
      )
    if (yearRes.status === 'fulfilled' && yearRes.value.success) yearList.value = normalizeYearList(yearRes.value.data || [])
    if (yjdwRes.status === 'fulfilled' && yjdwRes.value.success) yjdwList.value = normalizeOptionList(yjdwRes.value.data || [])
    if (projectTypeRes.status === 'fulfilled' && projectTypeRes.value.success) projectTypeList.value = projectTypeRes.value.data || []
    if (yjflRes.status === 'fulfilled' && yjflRes.value.success) yjflList.value = normalizeOptionList(yjflRes.value.data || [])
    if (flowStatusRes.status === 'fulfilled' && flowStatusRes.value.success)
      flowStatusList.value = normalizeTreeOptionList(flowStatusRes.value.data || [])
  }

  const getRoleHandle = async () => {
    const seq = ++roleLoadSeq
    gridRef.value?.invalidateRequest()
    gridOptions.loading = false
    projectSearchRequestSeq += 1
    searchEjdwRequestSeq += 1
    projectEjdwRequestSeq += 1
    ejflRequestSeq += 1
    sjflRequestSeq += 1
    if (!userRoleSelectorRef.value) return
    isShowPage.value = Boolean(unref(userRoleSelectorRef.value.canRender))
    if (!isShowPage.value) {
      gridOptions.loading = false
      projectGridOptions.loading = false
      return
    }

    await nextTick()
    if (seq !== roleLoadSeq) return
    await Promise.all([initOptions(seq), searchHandle()])
  }

  const resetHandle = () => {
    Object.assign(searchForm, createSearchForm())
    searchEjdwList.value = []
    resetTaskPagination(true)
    searchFormRef.value?.clearValidate?.()
    searchHandle()
  }

  const resetProjectHandle = () => {
    Object.assign(projectSearchForm, createProjectSearchForm())
    ejdwList.value = []
    ejflList.value = []
    sjflList.value = []
    projectPage.page = 1
    projectPage.limit = 20
    createTaskModalRef.value?.clearValidate?.()
    searchProjectHandle()
  }

  const projectPageChangeHandle = (currentPageNum: number) => {
    projectPage.page = currentPageNum
    searchProjectHandle()
  }

  const projectLimitChangeHandle = (currentLimitNum: number) => {
    projectPage.page = 1
    projectPage.limit = currentLimitNum
    searchProjectHandle()
  }

  const getHelpMessageHandle = () => {
    if (helpModalRef.value) helpModalRef.value.showModal = true
  }

  const openColSetting = () => {
    gridRef.value?.openColSetting()
  }

  const toggleSearchVisible = () => {
    searchVisible.value = !searchVisible.value
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

  // 查看任务进度
  const openProgressModal = async () => {
    const rows = getSelectedRows()
    if (rows.length != 1) return ElMessage.warning('请选择一个任务')
    const taskIdList = rows.map((row) => row.taskId).filter(Boolean) as string[]
    if (!taskIdList.length) return ElMessage.warning('当前选中任务缺少任务ID')
    const params = {
      taskId: taskIdList[0]
    }
    progressModal.value.acceptParams({ ...params })
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
    createTaskModalRef.value?.clearCheckboxRow()
  }

  const openDetailModal = (row: SmartTaskAuditRow) => {
    // 先写入行数据再打开，避免详情内请求读到空 proId/proType
    detailRow.value = row || {}
    detailModal.visible = true
  }

  const closeDetailModal = () => {
    // 只关弹窗，不清空 detailRow：关闭瞬间左侧 DynamicForm/异步组件可能仍在请求，
    // 若同步置空会丢掉 xmId/proType 等参数导致接口报错；下次 open 会覆盖。
    detailModal.visible = false
  }

  const openPriorityModal = () => {
    const rows = getSelectedRows()
    if (!rows.length) {
      ElMessage.warning('请选择任务')
      return
    }
    priorityForm.priority = ''
    priorityModal.visible = true
  }

  const closePriorityModal = () => {
    priorityModal.visible = false
    priorityForm.priority = ''
    priorityFormRef.value?.clearValidate?.()
  }

  /**
   * 修改任务：必须只选一条任务，按 taskId 调 getTaskDetailById 拉详情回显到表单。
   * 详情字段映射到表单的约定见 EditTaskModal 的字段列表。
   * reviewConclude / reviewProcess / message 改为 textarea 直接绑定 editTaskForm，
   * Object.assign 赋值后即回显，无需编辑器 @show 回显。
   */
  const openEditTaskModal = async () => {
    const rows = getSelectedRows()
    if (rows.length !== 1) {
      ElMessage.warning('请选择一条任务')
      return
    }
    const taskId = rows[0].taskId
    if (!taskId) {
      ElMessage.warning('当前选中任务缺少任务ID')
      return
    }
    Object.assign(editTaskForm, createEditTaskForm(), { taskId })
    editTaskModal.visible = true
    editTaskModal.loading = true
    try {
      const res = await getTaskDetailById(taskId)
      if (!res.success) {
        ElMessage.error(res.msg || '任务详情获取失败')
        return
      }
      const detail = res.data || {}
      // startTime / finishTime 后端返回字符串，前端日期控件无 value-format 时按 Date 绑定，转一下避免回显为空
      const toDate = (val: unknown): Date | string => (val ? new Date(val as string) : '')
      Object.assign(editTaskForm, {
        taskId: detail.taskId ?? taskId,
        proId: detail.proId ?? '',
        taskName: detail.taskName ?? '',
        priority: detail.priority ?? '',
        startTime: toDate(detail.startTime),
        finishTime: toDate(detail.finishTime),
        isHis: detail.isHis ?? '',
        status: detail.status ?? '',
        reviewOpinion: detail.reviewOpinion ?? '',
        reviewConclude: detail.reviewConclude ?? '',
        reviewProcess: detail.reviewProcess ?? '',
        message: detail.message ?? '',
        ruleName: detail.ruleName ?? '',
        result: detail.result ?? '',
        manualReviewOpinion: detail.manualReviewOpinion ?? '',
        manualReviewStatus: detail.manualReviewStatus ?? ''
      })
    } catch (e: any) {
      ElMessage.error(e?.message || '任务详情获取失败')
    } finally {
      editTaskModal.loading = false
    }
  }

  const closeEditTaskModal = () => {
    editTaskModal.visible = false
    Object.assign(editTaskForm, createEditTaskForm())
    editTaskFormRef.value?.clearValidate?.()
  }

  /**
   * 审核要点详情：必须只选一条任务，按 taskId 调 getTaskDetailByTask 拉取该任务下全部审核要点。
   * 弹窗内 vxe-table 展示，长字段靠 show-overflow 的 tooltip 悬浮查看完整内容。
   */
  const openTaskDetailModal = async () => {
    const rows = getSelectedRows()
    if (rows.length !== 1) {
      ElMessage.warning('请选择一条任务')
      return
    }
    const taskId = rows[0].taskId
    if (!taskId) {
      ElMessage.warning('当前选中任务缺少任务ID')
      return
    }
    taskDetailModal.visible = true
    await loadTaskDetail(taskId)
  }

  const loadTaskDetail = async (taskId: string) => {
    if (!taskId) return
    taskDetailList.value = []
    taskDetailModal.loading = true
    try {
      const res = await getTaskDetailByTask(taskId)
      if (!res.success) {
        ElMessage.error(res.msg || '审核要点详情获取失败')
        return
      }
      taskDetailList.value = Array.isArray(res.data) ? res.data : []
      // 记录当前 taskId，供修改成功后刷新复用
      taskDetailTaskId = String(taskId)
    } catch (e: any) {
      ElMessage.error(e?.message || '审核要点详情获取失败')
    } finally {
      taskDetailModal.loading = false
    }
  }

  /** 修改审核要点成功后刷新列表：复用打开时的 taskId */
  const refreshTaskDetail = () => {
    if (!taskDetailModal.visible || !taskDetailTaskId) return
    void loadTaskDetail(taskDetailTaskId)
  }

  const closeTaskDetailModal = () => {
    taskDetailModal.visible = false
    taskDetailList.value = []
    taskDetailTaskId = ''
  }

  /**
   * 审核任务规则详情：必须只选一条任务，按 taskId 调 getTaskDetailSumByTask 拉取该任务下全部审核规则汇总。
   * 弹窗内 vxe-table 展示 ruleName / reviewOpinionName / reviewConclude / originalText 四列，
   * 长字段靠 show-overflow 的 tooltip 悬浮查看完整内容。
   */
  const openTaskDetailSumModal = async () => {
    const rows = getSelectedRows()
    if (rows.length !== 1) {
      ElMessage.warning('请选择一条任务')
      return
    }
    const taskId = rows[0].taskId
    if (!taskId) {
      ElMessage.warning('当前选中任务缺少任务ID')
      return
    }
    taskDetailSumModal.visible = true
    await loadTaskDetailSum(taskId)
  }

  const loadTaskDetailSum = async (taskId: string) => {
    if (!taskId) return
    taskDetailSumList.value = []
    taskDetailSumModal.loading = true
    try {
      const res = await getTaskDetailSumByTask(taskId)
      if (!res.success) {
        ElMessage.error(res.msg || '审核任务规则详情获取失败')
        return
      }
      taskDetailSumList.value = Array.isArray(res.data) ? res.data : []
      // 记录当前 taskId，供修改成功后刷新复用
      taskDetailSumTaskId = String(taskId)
    } catch (e: any) {
      ElMessage.error(e?.message || '审核任务规则详情获取失败')
    } finally {
      taskDetailSumModal.loading = false
    }
  }

  /** 修改审核规则详情成功后刷新列表：复用打开时的 taskId */
  const refreshTaskDetailSum = () => {
    if (!taskDetailSumModal.visible || !taskDetailSumTaskId) return
    void loadTaskDetailSum(taskDetailSumTaskId)
  }

  const closeTaskDetailSumModal = () => {
    taskDetailSumModal.visible = false
    taskDetailSumList.value = []
    taskDetailSumTaskId = ''
  }

  /** 保存修改：弹窗内 textarea 直接绑定 editTaskForm，校验通过后直接发 updateTask */
  const saveEditTaskHandle = async () => {
    if (!editTaskForm.taskId) {
      ElMessage.warning('任务ID缺失，无法保存')
      return
    }
    let valid = true
    try {
      await editTaskFormRef.value?.validate?.()
    } catch {
      valid = false
    }
    if (!valid) return

    editTaskModal.loading = true
    try {
      // 字段原样透传：不再做 `值 || undefined` 转换，否则清空后的空字符串会被 JSON.stringify 丢弃，
      // 后端收不到该字段、无法区分「用户清空」与「未改动」，导致文本框清空不生效。
      const res = await updateTask({
        taskId: editTaskForm.taskId,
        taskName: editTaskForm.taskName,
        priority: editTaskForm.priority,
        startTime: editTaskForm.startTime,
        finishTime: editTaskForm.finishTime,
        isHis: editTaskForm.isHis,
        status: editTaskForm.status,
        reviewOpinion: editTaskForm.reviewOpinion,
        reviewConclude: editTaskForm.reviewConclude,
        reviewProcess: editTaskForm.reviewProcess,
        message: editTaskForm.message,
        ruleName: editTaskForm.ruleName,
        result: editTaskForm.result,
        manualReviewOpinion: editTaskForm.manualReviewOpinion,
        manualReviewStatus: editTaskForm.manualReviewStatus
      })
      if (res.success) {
        ElMessage.success('保存成功')
        closeEditTaskModal()
        await searchHandle()
      } else {
        ElMessage.error(res.msg || '保存失败')
      }
    } catch (e: any) {
      ElMessage.error(e?.message || '保存失败')
    } finally {
      editTaskModal.loading = false
    }
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
        resetTaskPagination()
        await searchHandle()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e.message || '创建失败')
    } finally {
      createTaskModal.loading = false
    }
  }

  const deleteTaskHandle = async () => {
    const rows = getSelectedRows()
    if (!rows.length) {
      ElMessage.warning('请选择任务')
      return
    }

    const taskIdList = rows.map((row) => row.taskId).filter(Boolean) as string[]
    if (!taskIdList.length) {
      ElMessage.warning('当前选中任务缺少任务ID')
      return
    }

    const type = await VXETable.modal.confirm('是否确定删除？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return

    gridOptions.loading = true
    try {
      const res = await deleteSmartTaskAudit(taskIdList)
      if (res.success) {
        ElMessage.success('删除成功')
        resetTaskPagination()
        await searchHandle()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e.message || '删除失败')
    } finally {
      gridOptions.loading = false
    }
  }

  const executeRedoTask = async (execute: (taskId: string) => ReturnType<typeof redoTask>, confirmMessage: string, successMessage: string) => {
    const rows = getSelectedRows()
    if (rows.length !== 1) {
      ElMessage.warning('请选择一条任务')
      return
    }

    const taskId = rows[0].taskId
    if (!taskId) {
      ElMessage.warning('当前选中任务缺少任务ID')
      return
    }

    const type = await VXETable.modal.confirm(confirmMessage, '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return

    gridOptions.loading = true
    try {
      const res = await execute(taskId)
      if (res.success) {
        ElMessage.success(successMessage)
        await searchHandle()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e.message || '重新执行失败')
    } finally {
      gridOptions.loading = false
    }
  }

  const redoTaskHandle = () => executeRedoTask(redoTask, '是否确定按原规则重新执行该任务？', '任务已提交按原规则重新执行')

  const redoTaskWithCompleteRuleHandle = () =>
    executeRedoTask(redoTaskWithCompleteRule, '是否确定补全规则并重新执行该任务？', '任务已提交补全规则并重新执行')

  const exportHandle = async () => {
    gridOptions.loading = true
    try {
      await apiExportHandle(buildSearchParams(), '智能任务审核列表', exportSmartTaskAuditList)
    } catch (e: any) {
      ElMessage.error(e?.message || '导出失败')
    } finally {
      gridOptions.loading = false
    }
  }

  const savePriorityHandle = async () => {
    if (!priorityForm.priority) {
      ElMessage.warning('请选择优先级')
      return
    }

    const taskIdList = getSelectedRows()
      .map((row) => row.taskId)
      .filter(Boolean) as string[]
    if (!taskIdList.length) {
      ElMessage.warning('当前选中任务缺少任务ID')
      return
    }

    priorityModal.loading = true
    try {
      const res = await updatePriority(taskIdList, priorityForm.priority)
      if (res.success) {
        ElMessage.success('保存成功')
        closePriorityModal()
        await searchHandle()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e.message || '保存失败')
    } finally {
      priorityModal.loading = false
    }
  }

  const searchYjdwChangeHandle = async (value: string) => {
    const seq = ++searchEjdwRequestSeq
    searchForm.ejdwList = []
    searchEjdwList.value = []
    if (!value) return
    try {
      const res = await getEjdwList({
        ...buildRoleParams(),
        YJDW: value,
        parentCode: value
      })
      if (seq !== searchEjdwRequestSeq || searchForm.yjdw !== value) return
      if (res.success) {
        searchEjdwList.value = normalizeOptionList(res.data || [])
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      if (seq === searchEjdwRequestSeq && searchForm.yjdw === value) {
        ElMessage.error(e.message || '二级单位获取失败')
      }
    }
  }

  const yjdwChangeHandle = async (value: string) => {
    const seq = ++projectEjdwRequestSeq
    projectSearchForm.ejdwList = []
    ejdwList.value = []
    if (!value) return
    try {
      const res = await getEjdwList({
        ...buildRoleParams(),
        YJDW: value,
        parentCode: value
      })
      if (seq !== projectEjdwRequestSeq || projectSearchForm.yjdw !== value) return
      if (res.success) {
        ejdwList.value = normalizeOptionList(res.data || [])
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      if (seq === projectEjdwRequestSeq && projectSearchForm.yjdw === value) {
        ElMessage.error(e.message || '二级单位获取失败')
      }
    }
  }

  const getClassifyChildren = async (value: string) => {
    const res = await getFlList({
      ...buildRoleParams(),
      code: 'GWXMFL',
      parentCode: value
    })
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
    } catch (e: any) {
      if (seq === ejflRequestSeq && projectSearchForm.yjfl === value) {
        ElMessage.error(e.message || '二级分类获取失败')
      }
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
    } catch (e: any) {
      if (seq === sjflRequestSeq && projectSearchForm.ejfl === value) {
        ElMessage.error(e.message || '三级分类获取失败')
      }
    }
  }

  return {
    isShowPage,
    searchVisible,
    userRoleSelectorRef,
    helpModalRef,
    gridRef,
    searchFormRef,
    createTaskModalRef,
    priorityFormRef,
    searchForm,
    projectSearchForm,
    taskStatusOptions,
    docPreStatusOptions,
    yesNoOptions,
    priorityOptions,
    yearList,
    yjdwList,
    searchEjdwList,
    ejdwList,
    projectTypeList,
    yjflList,
    ejflList,
    sjflList,
    flowStatusList,
    gridOptions,
    requestTaskList,
    requestTaskListError,
    projectGridOptions,
    projectPage,
    createTaskModal,
    detailModal,
    detailRow,
    priorityModal,
    priorityForm,
    reviewOpinionOptions,
    reviewResultOptions,
    manualReviewOpinionOptions,
    manualReviewStatusOptions,
    editTaskModal,
    editTaskForm,
    editTaskFormRef,
    openEditTaskModal,
    closeEditTaskModal,
    saveEditTaskHandle,
    taskDetailModal,
    taskDetailList,
    openTaskDetailModal,
    closeTaskDetailModal,
    refreshTaskDetail,
    taskDetailSumModal,
    taskDetailSumList,
    openTaskDetailSumModal,
    closeTaskDetailSumModal,
    refreshTaskDetailSum,
    getRoleHandle,
    resetHandle,
    resetProjectHandle,
    searchHandle,
    searchProjectHandle,
    projectPageChangeHandle,
    projectLimitChangeHandle,
    getHelpMessageHandle,
    openColSetting,
    toggleSearchVisible,
    openCreateTaskModal,
    closeCreateTaskModal,
    openDetailModal,
    closeDetailModal,
    openPriorityModal,
    closePriorityModal,
    savePriorityHandle,
    createTaskHandle,
    deleteTaskHandle,
    redoTaskHandle,
    redoTaskWithCompleteRuleHandle,
    exportHandle,
    searchYjdwChangeHandle,
    yjdwChangeHandle,
    yjflChangeHandle,
    ejflChangeHandle,
    syncSelectedRows,
    syncSelectedProjectRows,
    selectedProjectRows,
    openProgressModal,
    progressModal
  }
}
