import { computed, nextTick, reactive, ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type { RangeVxeTableExpose } from '@/components/RangeVxeTable/interface'
import {
  cancelPointTask,
  createPointTask,
  editPointTask,
  exportPointTaskList,
  getAuditPointPool,
  getPointTaskDetailPage,
  getPointTaskPage,
  getPointTaskProgress,
  removePointTask,
  startPointTask
} from '@/api/ai/smartTaskAudit'
import type { PointTaskProgressRow } from '@/api/ai/smartTaskAudit'
import { apiExportHandle } from '@/utils/export'
import {
  POINT_TASK_STATUS_OPTIONS,
  canCancelPointTask,
  canDeletePointTask,
  canEditPointTask,
  canStartPointTask,
  createPointTaskGridOptions,
  pointTaskStatusName
} from '../pointTask'
import type { PointTaskRow, PointTaskRuleOption, PointTaskTaskRow } from '../pointTask'
import type { SmartTaskAuditRow } from '../types'

type PointTaskAction = 'edit' | 'delete' | 'start' | 'cancel'

export interface PointTaskEditState {
  visible: boolean
  loading: boolean
  mode: 'create' | 'edit'
  pointTaskId: string
  ruleId: string
  taskRows: PointTaskTaskRow[]
}

export interface PointTaskSavePayload {
  ruleId: string
  taskIdList: string[]
}

/** 任务进度弹窗状态：标题（审核要点名）+ 每个原始审核任务的执行进度 */
export interface PointTaskProgressState {
  visible: boolean
  loading: boolean
  title: string
  rows: PointTaskProgressRow[]
}

/** 单要点审核任务页签：列表 + 修改/删除/开始/取消/导出 + 创建/修改弹窗状态 */
export const usePointTaskPanel = () => {
  const tableRef = ref<RangeVxeTableExpose<PointTaskRow>>()
  const gridOptions = reactive(createPointTaskGridOptions())
  const statusOptions = POINT_TASK_STATUS_OPTIONS
  const ruleOptions = shallowRef<PointTaskRuleOption[]>([])
  const ruleLoading = ref(false)
  const selectedRows = shallowRef<PointTaskRow[]>([])
  /** 创建时间区间筛选（yyyy-MM-dd），查询时写进 filters */
  const createRange = ref<string[]>([])
  const filters = reactive({
    ruleId: '',
    status: '',
    createTimeStart: '',
    createTimeFinish: ''
  })

  const editModal = reactive<PointTaskEditState>({
    visible: false,
    loading: false,
    mode: 'create',
    pointTaskId: '',
    ruleId: '',
    taskRows: []
  })

  const progressModal = reactive<PointTaskProgressState>({
    visible: false,
    loading: false,
    title: '',
    rows: []
  })

  const selectedSingle = computed(() => (selectedRows.value.length === 1 ? selectedRows.value[0] : null))
  const selectedCount = computed(() => selectedRows.value.length)

  /** 任务进度：只看一条要点任务（getProcessProgress 按 pointTaskId 取） */
  const canProgress = computed(() => selectedRows.value.length === 1)
  const progressDisabledReason = computed(() => {
    if (!selectedRows.value.length) return '请先选择一条要点任务'
    if (selectedRows.value.length > 1) return '任务进度仅支持查看单条'
    return ''
  })

  const actionAllowed = (action: PointTaskAction): boolean => {
    if (!selectedSingle.value) return false
    const row = selectedSingle.value
    if (action === 'edit') return canEditPointTask(row)
    if (action === 'delete') return canDeletePointTask(row)
    if (action === 'start') return canStartPointTask(row)
    return canCancelPointTask(row)
  }

  const actionDisabledReason = (action: PointTaskAction): string => {
    if (!selectedRows.value.length) return '请先选择任务'
    if (selectedRows.value.length > 1) return '仅支持单条任务'
    if (actionAllowed(action)) return ''
    if (action === 'edit') return '仅未开始状态的任务可修改'
    if (action === 'delete') return '处理中、已完成的任务不能删除'
    if (action === 'start') return '仅未开始状态的任务可开始执行'
    return '仅处理中状态的任务可取消执行'
  }

  const canEdit = computed(() => actionAllowed('edit'))
  const canDelete = computed(() => actionAllowed('delete'))
  const canStart = computed(() => actionAllowed('start'))
  const canCancel = computed(() => actionAllowed('cancel'))
  const editDisabledReason = computed(() => actionDisabledReason('edit'))
  const deleteDisabledReason = computed(() => actionDisabledReason('delete'))
  const startDisabledReason = computed(() => actionDisabledReason('start'))
  const cancelDisabledReason = computed(() => actionDisabledReason('cancel'))

  const syncSelectedRows = (records: PointTaskRow[]) => {
    selectedRows.value = records || []
  }

  const getSelectedRows = (): PointTaskRow[] => {
    return tableRef.value?.getCheckboxRecords() || selectedRows.value || []
  }

  const buildSearchParams = () => ({
    ruleId: filters.ruleId || undefined,
    status: filters.status || undefined,
    createTimeStart: filters.createTimeStart || undefined,
    createTimeFinish: filters.createTimeFinish || undefined
  })

  const requestList = async (params: { page?: number; limit?: number }) => {
    gridOptions.loading = true
    try {
      const res = await getPointTaskPage({
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

  const requestError = (error: unknown) => {
    ElMessage.error(error instanceof Error ? error.message : '查询失败')
  }

  /** 审核要点池：一次拉全量，列表内本地过滤（下拉用 filterable） */
  const loadRuleOptions = async () => {
    if (ruleLoading.value) return
    ruleLoading.value = true
    try {
      const res = await getAuditPointPool({ page: 1, limit: 500 })
      if (!res.success) {
        ElMessage.error(res.msg || '审核要点加载失败')
        return
      }
      ruleOptions.value = (res.data?.records || [])
        .map((row) => ({
          value: String(row.pointId ?? row.ruleId ?? ''),
          code: String(row.auditPointCode || ''),
          name: String(row.auditPointName || ''),
          ruleName: String(row.ruleName || ''),
          label: [row.auditPointCode, row.auditPointName].filter(Boolean).join(' ')
        }))
        .filter((item) => item.value)
    } catch (e: any) {
      ElMessage.error(e.message || '审核要点加载失败')
    } finally {
      ruleLoading.value = false
    }
  }

  /** 每次切到页签都重新取列表（需求 2026-10-20：来回切换获取最新数据）；要点池只加载一次、之后复用 */
  const ensureLoaded = async () => {
    if (!ruleOptions.value.length) void loadRuleOptions()
    await nextTick()
    tableRef.value?.doLayout?.()
    await tableRef.value?.getTableList()
  }

  const refresh = () => tableRef.value?.getTableList()

  const resetPagination = () => {
    if (tableRef.value) tableRef.value.pageable.current = 1
  }

  const search = () => {
    filters.createTimeStart = createRange.value?.[0] || ''
    filters.createTimeFinish = createRange.value?.[1] || ''
    resetPagination()
    refresh()
  }

  const resetFilters = () => {
    filters.ruleId = ''
    filters.status = ''
    filters.createTimeStart = ''
    filters.createTimeFinish = ''
    createRange.value = []
    resetPagination()
    refresh()
  }

  const openCreate = (rows: SmartTaskAuditRow[]) => {
    const taskRows = rows
      .map((row) => ({ taskId: String(row.taskId || ''), taskName: String(row.taskName || '').trim() }))
      .filter((row) => row.taskId)
    if (!taskRows.length) {
      ElMessage.warning('当前选中任务缺少任务ID')
      return
    }
    editModal.mode = 'create'
    editModal.pointTaskId = ''
    editModal.ruleId = ''
    editModal.taskRows = taskRows
    editModal.visible = true
    if (!ruleOptions.value.length) void loadRuleOptions()
  }

  const openEdit = async (row: PointTaskRow) => {
    if (!canEditPointTask(row)) {
      ElMessage.warning('仅未开始状态的任务可修改')
      return
    }
    const pointTaskId = String(row.pointTaskId || '')
    if (!pointTaskId) {
      ElMessage.warning('当前任务缺少要点任务ID')
      return
    }
    editModal.mode = 'edit'
    editModal.pointTaskId = pointTaskId
    editModal.ruleId = String(row.ruleId || '')
    editModal.taskRows = []
    editModal.visible = true
    editModal.loading = true
    if (!ruleOptions.value.length) void loadRuleOptions()
    try {
      const res = await getPointTaskDetailPage({ page: 1, limit: 500, pointTaskId })
      if (!res.success) throw new Error(res.msg || '任务明细加载失败')
      editModal.taskRows = (res.data?.records || [])
        .map((item) => ({ taskId: String(item.taskId || ''), taskName: String(item.taskName || '').trim() }))
        .filter((item) => item.taskId)
    } catch (e: any) {
      ElMessage.error(e.message || '任务明细加载失败')
    } finally {
      editModal.loading = false
    }
  }

  const closeEdit = () => {
    editModal.visible = false
    editModal.loading = false
  }

  const save = async (payload: PointTaskSavePayload) => {
    if (!payload.ruleId) {
      ElMessage.warning('请选择审核要点')
      return
    }
    if (!payload.taskIdList.length) {
      ElMessage.warning('请至少保留一个任务')
      return
    }
    editModal.loading = true
    try {
      const res =
        editModal.mode === 'create'
          ? await createPointTask({ ruleId: payload.ruleId, taskIdList: payload.taskIdList })
          : await editPointTask({ pointTaskId: editModal.pointTaskId, ruleId: payload.ruleId, taskIdList: payload.taskIdList })
      if (res.success) {
        ElMessage.success(editModal.mode === 'create' ? '单要点审核任务已创建' : '保存成功')
        closeEdit()
        resetPagination()
        await refresh()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e.message || (editModal.mode === 'create' ? '创建失败' : '保存失败'))
    } finally {
      editModal.loading = false
    }
  }

  const confirmSingle = async (message: string, title: string) => {
    const type = await VXETable.modal.confirm(message, title, {
      status: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消'
    })
    return type === 'confirm'
  }

  const runSingleAction = async (
    action: PointTaskAction,
    title: string,
    message: string,
    successMessage: string,
    execute: (pointTaskId: string) => Promise<any>
  ) => {
    const row = getSelectedRows()
    if (row.length !== 1) {
      ElMessage.warning('请选择一条任务')
      return
    }
    const current = row[0]
    if (!actionAllowed(action)) {
      ElMessage.warning(actionDisabledReason(action))
      return
    }
    const pointTaskId = String(current.pointTaskId || '')
    if (!pointTaskId) {
      ElMessage.warning('当前任务缺少要点任务ID')
      return
    }
    const name = String(current.auditPointName || current.ruleName || '').trim() || '该任务'
    if (!(await confirmSingle(message.replace('{name}', name), title))) return
    gridOptions.loading = true
    try {
      const res = await execute(pointTaskId)
      if (res.success) {
        ElMessage.success(successMessage)
        resetPagination()
        await refresh()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e.message || '操作失败')
    } finally {
      gridOptions.loading = false
    }
  }

  const removeSelected = () =>
    runSingleAction('delete', '删除单要点审核任务', '确认删除「{name}」吗？删除后任务及明细不可恢复。', '删除成功', (pointTaskId) =>
      removePointTask(pointTaskId)
    )

  const startSelected = () =>
    runSingleAction('start', '开始执行', '确认开始执行「{name}」吗？', '已开始执行', (pointTaskId) => startPointTask(pointTaskId))

  const cancelSelected = () =>
    runSingleAction('cancel', '取消执行', '确认取消执行「{name}」吗？取消后不可恢复为处理中。', '已取消执行', (pointTaskId) =>
      cancelPointTask(pointTaskId)
    )

  /** 任务进度：按 pointTaskId 取每个原始审核任务的执行进度（getProcessProgress） */
  const openProgress = async () => {
    const rows = getSelectedRows()
    if (rows.length !== 1) {
      ElMessage.warning(rows.length ? '仅支持查看单条任务' : '请先选择任务')
      return
    }
    const row = rows[0]
    const pointTaskId = String(row.pointTaskId || '')
    if (!pointTaskId) {
      ElMessage.warning('当前任务缺少要点任务ID')
      return
    }
    progressModal.title = String(row.auditPointName || row.ruleName || '').trim()
    progressModal.rows = []
    progressModal.visible = true
    progressModal.loading = true
    try {
      const res = await getPointTaskProgress(pointTaskId)
      if (res.success) {
        progressModal.rows = Array.isArray(res.data) ? res.data : []
      } else {
        ElMessage.error(res.msg || '任务进度加载失败')
      }
    } catch (e: any) {
      ElMessage.error(e.message || '任务进度加载失败')
    } finally {
      progressModal.loading = false
    }
  }

  const closeProgress = () => {
    progressModal.visible = false
    progressModal.rows = []
  }

  const exportList = async () => {
    gridOptions.loading = true
    try {
      await apiExportHandle({ ...buildSearchParams(), page: 1, limit: 20 }, '单要点审核任务列表', exportPointTaskList)
    } catch (e: any) {
      ElMessage.error(e?.message || '导出失败')
    } finally {
      gridOptions.loading = false
    }
  }

  return {
    pointTableRef: tableRef,
    pointGridOptions: gridOptions,
    pointStatusOptions: statusOptions,
    pointRuleOptions: ruleOptions,
    pointRuleLoading: ruleLoading,
    pointFilters: filters,
    pointCreateRange: createRange,
    pointSelectedRows: selectedRows,
    pointSelectedCount: selectedCount,
    pointEditModal: editModal,
    pointProgressModal: progressModal,
    pointCanProgress: canProgress,
    pointProgressReason: progressDisabledReason,
    openPointTaskProgress: openProgress,
    closePointTaskProgress: closeProgress,
    pointCanEdit: canEdit,
    pointCanDelete: canDelete,
    pointCanStart: canStart,
    pointCanCancel: canCancel,
    pointEditReason: editDisabledReason,
    pointDeleteReason: deleteDisabledReason,
    pointStartReason: startDisabledReason,
    pointCancelReason: cancelDisabledReason,
    pointTaskStatusName,
    requestPointTaskList: requestList,
    requestPointTaskListError: requestError,
    syncPointSelectedRows: syncSelectedRows,
    ensurePointTaskLoaded: ensureLoaded,
    refreshPointTaskList: refresh,
    searchPointTask: search,
    resetPointTask: resetFilters,
    openCreatePointTask: openCreate,
    openEditPointTask: openEdit,
    closePointTaskEdit: closeEdit,
    savePointTask: save,
    removeSelectedPointTask: removeSelected,
    startSelectedPointTask: startSelected,
    cancelSelectedPointTask: cancelSelected,
    exportPointTaskList: exportList
  }
}
