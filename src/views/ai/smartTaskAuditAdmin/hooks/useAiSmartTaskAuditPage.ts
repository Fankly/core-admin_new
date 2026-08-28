import { computed, markRaw, nextTick, provide, reactive, ref, shallowRef, unref } from 'vue'
import { useStore } from 'vuex'
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
  getYjdwList,
  redoTask,
  redoTaskWithCompleteRule,
  updatePriority
} from '@/api/ai/smartTaskAudit'
import { apiExportHandle } from '@/utils/export'
import { createGridOptions } from '../table'
import { createProjectGridOptions } from '../projectTable'
import { createProjectSearchForm, createSearchForm, normalizeOptionList, normalizeTreeOptionList, normalizeYearList, splitCodes } from '../utils'
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

  const progressModal = ref()

  let roleLoadSeq = 0
  let projectSearchRequestSeq = 0
  let searchEjdwRequestSeq = 0
  let projectEjdwRequestSeq = 0
  let ejflRequestSeq = 0
  let sjflRequestSeq = 0

  const asGridData = <T>(data: T[] | null | undefined): T[] => markRaw(Array.isArray(data) ? data : [])

  provide('currentUserRole', currentUserRole)

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
    const [statusRes, docPreStatusRes, yesNoRes, priorityRes, yearRes, yjdwRes, projectTypeRes, yjflRes, flowStatusRes] = await Promise.allSettled([
      getPublicData('AI_AUDIT_TASK_STATUS_COM'),
      getPublicData('AI_AUDIT_DOC_PRE_STATUS_COM'),
      getPublicData('GY_SF'),
      getPublicData('AI_AUDIT_TASK_PRIORITY_COM'),
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
