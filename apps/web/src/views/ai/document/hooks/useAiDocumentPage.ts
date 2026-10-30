import { CurrentUserRoleInjectionKey } from '@/components/UserRoleSelector/interface'
import { computed, nextTick, provide, reactive, ref, unref } from 'vue'
import { useStore } from '@/store/business'
import { ElMessage } from 'element-plus'
import { VXETable } from 'vxe-table'
import type UserRoleSelector from '@/components/UserRoleSelector/index.vue'
import type HelpModal from '@/components/HelpModal/index.vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { getPublicData, getSubProtypeTree, getYearData, getYjdwFromCm } from '@/api/common'
import { getFlowStatusList, getSmartTaskAuditProjectList } from '@/api/ai/smartTaskAudit'
import {
  addXmAttachProjectTasks,
  downloadAttachById,
  editDocument,
  exportXmAttachTask,
  getGssAttachDetail,
  getJysAttachDetail,
  getKybgAttachDetail,
  getXmAttachTaskDetail,
  getXmAttachTaskPage,
  redoXmAttachTask,
  removeXmAttachTask,
  syncRedoPreDeal,
  updateExtractData,
  updateGssAttach,
  updateJysAttach,
  updateKbBatch,
  updateKybgAttach,
  updateXmAttachTaskPriority
} from '@/api/ai/document/xmAttachTask'
import { listAttachChaptersByTree } from '@/api/ai/document/xmAttachChapter'
import type { AttachChapterRow } from '@/api/ai/document/xmAttachChapter'
import { createGridOptions } from '../table'
import { createProjectGridOptions } from '../projectTable'
import { apiExportHandle } from '@/utils/export'
import {
  createDetailData,
  createEditForm,
  createProjectSearchForm,
  createSearchForm,
  getAttachId,
  getProjectId,
  normalizeOptionList,
  normalizeTreeOptionList,
  normalizeYearList,
  splitCodes
} from '../utils'
import type {
  AttachDocType,
  AttachTaskRow,
  AttachTypeEditModalState,
  EditForm,
  OptionItem,
  PriorityForm,
  ProjectRow,
  ProjectSearchForm,
  SearchForm
} from '../types'
import { ATTACH_TYPE_EDIT_CONFIG } from '../constants'

/** 建议书 / 可研报告 / 估算书：详情与修改按类型分发（fjId 1/2/38） */
const ATTACH_TYPE_DETAIL_API: Record<AttachDocType, (params: { proId?: string; attachId?: string }) => Promise<any>> = {
  jys: getJysAttachDetail,
  kybg: getKybgAttachDetail,
  gss: getGssAttachDetail
}

const ATTACH_TYPE_UPDATE_API: Record<AttachDocType, (params: any) => Promise<any>> = {
  jys: updateJysAttach,
  kybg: updateKybgAttach,
  gss: updateGssAttach
}

/** 金额字段：空值不传，字符串转数字（后端是 BigDecimal） */
const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (value === '' || value == null) return undefined
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

interface DocumentTableRef {
  getCheckboxRecords: () => AttachTaskRow[]
  clearCheckboxRow: () => Promise<void> | void
  setCheckboxRow: (row: AttachTaskRow, checked: boolean) => Promise<void> | void
  openColSetting: () => void
}

interface FormRef {
  clearValidate?: () => void
}

interface CreateTaskModalRef extends FormRef {
  clearCheckboxRow: () => Promise<void> | void
  getCheckboxRecords: () => ProjectRow[]
}

/** 「查看章节」弹窗状态：附件名 + xm-attach-chapter/listByTree 的树序章节列表 */
export interface ChapterModalState {
  visible: boolean
  loading: boolean
  /** 当前查看章节的附件 ID（导出章节切片用） */
  attachId: string
  attachName: string
  rows: AttachChapterRow[]
}

export const useAiDocumentPage = () => {
  const store = useStore()
  const isShowPage = ref(false)
  const searchVisible = ref(true)
  const exporting = ref(false)
  const userRoleSelectorRef = ref<InstanceType<typeof UserRoleSelector>>()
  const helpModalRef = ref<InstanceType<typeof HelpModal>>()
  const gridRef = ref<DocumentTableRef>()
  const searchFormRef = ref<FormRef>()
  const createTaskModalRef = ref<CreateTaskModalRef>()
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
  const yearList = ref<OptionItem[]>([])
  const yjdwList = ref<OptionItem[]>([])
  const attachTypeList = ref<OptionItem[]>([])
  const projectTypeList = ref<any[]>([])
  const flowStatusList = ref<any[]>([])
  const selectedRows = ref<AttachTaskRow[]>([])
  /** 已勾选条数：工具栏用它控制「查看章节」等单行操作的可用状态 */
  const selectedCount = computed(() => selectedRows.value.length)
  /** 唯一勾选行的附件类型（fjId）：工具栏据此决定三项文档编辑是否可用 */
  const selectedFjId = computed(() => {
    if (selectedRows.value.length !== 1) return ''
    const row = selectedRows.value[0]
    return String(row.fjId || row.attachType || '').trim()
  })
  const selectedProjectRows = ref<ProjectRow[]>([])
  const detailData = ref<AttachTaskRow>(createDetailData())
  const editDetailData = ref<AttachTaskRow>(createDetailData())
  const gridOptions = reactive(createGridOptions())
  const projectGridOptions = reactive(createProjectGridOptions())

  const page = reactive({
    total: 0,
    limit: 20,
    page: 1
  })

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

  /** 查看章节（xm-attach-chapter/listByTree，入参 attachId = 行数据的 id） */
  const chapterModal = reactive<ChapterModalState>({
    visible: false,
    loading: false,
    attachId: '',
    attachName: '',
    rows: []
  })

  const priorityModal = reactive({
    visible: false,
    loading: false
  })

  const priorityForm = reactive<PriorityForm>({
    priority: ''
  })

  const editModal = reactive({
    visible: false,
    loading: false
  })

  const editForm = reactive<EditForm>(createEditForm())

  /** 建议书 / 可研报告 / 估算书 编辑弹窗：字段由 constants 里的配置驱动 */
  const attachTypeEditModal = reactive<AttachTypeEditModalState>({
    visible: false,
    loading: false,
    saving: false,
    type: 'jys',
    title: '',
    attachName: '',
    fjName: ''
  })
  const attachTypeEditDetail = ref<Record<string, any>>({})

  provide(CurrentUserRoleInjectionKey, currentUserRole)
  provide(PermissionInjectionKey, {
    get permissions() {
      return unref(userRoleSelectorRef.value?.permissions) || []
    },
    get isLoading() {
      return Boolean(unref((userRoleSelectorRef.value as any)?.loading))
    }
  })

  const getSelectedRows = (): AttachTaskRow[] => {
    return gridRef.value?.getCheckboxRecords() || selectedRows.value || []
  }

  const clearSelectedRows = async () => {
    selectedRows.value = []
    await gridRef.value?.clearCheckboxRow()
  }

  const syncSelectedRows = () => {
    selectedRows.value = getSelectedRows()
  }

  const syncSelectedProjectRows = (records: ProjectRow[]) => {
    selectedProjectRows.value = records || []
  }

  const cellClickHandle = async ({ row, column }: any) => {
    // 点击附件名称列 → 下载附件
    if (column.field === 'attachName') {
      const attachId = getAttachId(row)
      if (!attachId) {
        ElMessage.warning('当前附件缺少附件ID')
        return
      }
      try {
        await downloadAttachById(attachId, row.attachName)
      } catch (e: any) {
        ElMessage.error(e?.message || '下载失败')
      }
      return
    }
    if (column.type !== 'checkbox') {
      await gridRef.value?.clearCheckboxRow()
      gridRef.value?.setCheckboxRow(row, true)
    }
    syncSelectedRows()
  }

  const buildRoleParams = () => ({
    bmId: currentUserRole.value.bmId,
    dwId: currentUserRole.value.dwId,
    roleId: currentUserRole.value.roleId,
    roleCode: currentUserRole.value.roleCode,
    userId: store.getters.getUserMsg?.id || ''
  })

  const buildSearchParams = () => {
    const { xmbm, flowStatusList, ...rest } = searchForm
    return {
      ...rest,
      proTypes: Array.isArray(searchForm.proTypes) ? searchForm.proTypes : [],
      zt: Array.isArray(flowStatusList) ? flowStatusList : [],
      xmbmList: splitCodes(xmbm),
      current: page.page,
      size: page.limit
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

  const searchHandle = async () => {
    gridOptions.loading = true
    try {
      const res = await getXmAttachTaskPage(buildSearchParams())
      if (res.success) {
        gridOptions.data = res.data?.records || []
        page.total = res.data?.total || 0
        await clearSelectedRows()
      } else {
        ElMessage.error(res.msg)
        gridOptions.data = []
        page.total = 0
      }
    } catch (e: any) {
      ElMessage.error(e.message || '查询失败')
      gridOptions.data = []
      page.total = 0
    } finally {
      gridOptions.loading = false
    }
  }

  const searchProjectHandle = async () => {
    projectGridOptions.loading = true
    try {
      const res = await getSmartTaskAuditProjectList(buildProjectSearchParams())
      if (res.success) {
        projectGridOptions.data = res.data?.records || []
        projectPage.total = res.data?.total || 0
        selectedProjectRows.value = []
        await createTaskModalRef.value?.clearCheckboxRow()
      } else {
        ElMessage.error(res.msg)
        projectGridOptions.data = []
        projectPage.total = 0
      }
    } catch (e: any) {
      ElMessage.error(e.message || '查询项目失败')
      projectGridOptions.data = []
      projectPage.total = 0
    } finally {
      projectGridOptions.loading = false
    }
  }

  const initOptions = async () => {
    const [yearRes, yjdwRes, projectTypeRes, attachTypeRes, flowStatusRes] = await Promise.allSettled([
      getYearData(),
      getYjdwFromCm(),
      getSubProtypeTree(),
      getPublicData('FJ_TYPE'),
      getFlowStatusList(buildRoleParams())
    ])
    if (yearRes.status === 'fulfilled' && yearRes.value.success) {
      yearList.value = normalizeYearList(yearRes.value.data || [])
    }
    if (yjdwRes.status === 'fulfilled' && yjdwRes.value.success) {
      yjdwList.value = yjdwRes.value.data || []
    }
    if (projectTypeRes.status === 'fulfilled' && projectTypeRes.value.success) {
      projectTypeList.value = projectTypeRes.value.data || []
    }
    if (attachTypeRes.status === 'fulfilled') {
      attachTypeList.value = normalizeOptionList(attachTypeRes.value.success ? attachTypeRes.value.data || [] : [])
    }
    if (flowStatusRes.status === 'fulfilled' && flowStatusRes.value.success) {
      flowStatusList.value = normalizeTreeOptionList(flowStatusRes.value.data || [])
    }
  }

  const getRoleHandle = async () => {
    if (!userRoleSelectorRef.value) return
    isShowPage.value = Boolean(unref(userRoleSelectorRef.value.canRender))
    if (!isShowPage.value) return

    await nextTick()
    await initOptions()
    // 进入页面就按默认条件取一次清单（与其他列表页一致；此前要点一次「查询」才有数据）
    await searchHandle()
  }

  const resetHandle = () => {
    Object.assign(searchForm, createSearchForm())
    page.page = 1
    page.limit = 20
    searchFormRef.value?.clearValidate?.()
    searchHandle()
  }

  const resetProjectHandle = () => {
    Object.assign(projectSearchForm, createProjectSearchForm())
    projectPage.page = 1
    projectPage.limit = 20
    createTaskModalRef.value?.clearValidate?.()
    searchProjectHandle()
  }

  const pageChangeHandle = (currentPageNum: number) => {
    page.page = currentPageNum
    searchHandle()
  }

  const limitChangeHandle = (currentLimitNum: number) => {
    page.page = 1
    page.limit = currentLimitNum
    searchHandle()
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
    createTaskModal.visible = true
    await nextTick()
    await searchProjectHandle()
  }

  const closeCreateTaskModal = () => {
    createTaskModal.visible = false
    Object.assign(projectSearchForm, createProjectSearchForm())
    selectedProjectRows.value = []
    projectGridOptions.data = []
    projectPage.page = 1
    projectPage.limit = 20
    projectPage.total = 0
    createTaskModalRef.value?.clearCheckboxRow()
  }

  const createTaskHandle = async () => {
    const rows: ProjectRow[] = createTaskModalRef.value?.getCheckboxRecords?.() || selectedProjectRows.value
    if (!rows.length) {
      ElMessage.warning('请选择项目')
      return
    }

    const proIdList = Array.from(new Set(rows.map((row) => getProjectId(row)).filter((id): id is string => Boolean(id))))
    if (!proIdList.length) {
      ElMessage.warning('当前选中项目缺少项目ID')
      return
    }

    createTaskModal.loading = true
    try {
      const res = await addXmAttachProjectTasks(proIdList)
      if (res.success) {
        ElMessage.success('创建成功')
        closeCreateTaskModal()
        page.page = 1
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

  const redoTaskHandle = async () => {
    const rows = getSelectedRows()
    if (rows.length !== 1) {
      ElMessage.warning('请选择一条数据')
      return
    }

    const id = getAttachId(rows[0])
    if (!id) {
      ElMessage.warning('当前数据缺少附件ID')
      return
    }

    const type = await VXETable.modal.confirm('是否确定重新执行该预处理任务？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return

    gridOptions.loading = true
    try {
      const res = await redoXmAttachTask(id)
      if (res.success) {
        ElMessage.success('任务已提交重新执行')
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

  // 异步执行：支持多选批量提交
  const asyncTaskHandle = async () => {
    const rows = getSelectedRows()
    if (rows.length == 0) {
      ElMessage.warning('请选择数据')
      return
    }

    const ids = Array.from(new Set(rows.map((row) => getAttachId(row)).filter((id): id is string => Boolean(id))))
    if (!ids.length) {
      ElMessage.warning('当前数据缺少附件ID')
      return
    }

    const type = await VXETable.modal.confirm('是否确定异步执行该预处理任务？', '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return

    gridOptions.loading = true
    try {
      const res = await syncRedoPreDeal(ids)
      if (res.success) {
        ElMessage.success('任务已提交异步执行')
        await searchHandle()
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e.message || '异步执行失败')
    } finally {
      gridOptions.loading = false
    }
  }

  // 详情与编辑共用：取当前选中行并拉取详情，成功后写入 detailData。
  const loadDetailData = async (currentRow: AttachTaskRow, id: string) => {
    const res = await getXmAttachTaskDetail(id)
    if (!res.success) {
      ElMessage.error(res.msg)
      return false
    }
    const detail = res.data || {}
    detailData.value = {
      ...createDetailData(),
      ...detail,
      xmmc: detail.xmmc || currentRow.xmmc,
      xmbm: detail.xmbm || currentRow.xmbm,
      attachName: detail.attachName || currentRow.attachName,
      attachType: detail.attachType || currentRow.attachType || currentRow.fjId,
      attachTypeName: detail.attachTypeName || detail.fjName || currentRow.attachTypeName || currentRow.fjName,
      fjId: detail.fjId || currentRow.fjId,
      fjName: detail.fjName || currentRow.fjName
    }
    return true
  }

  const getSingleSelectedRow = () => {
    const rows = getSelectedRows()
    if (rows.length !== 1) {
      ElMessage.warning('请选择一条数据')
      return null
    }
    const id = getAttachId(rows[0])
    if (!id) {
      ElMessage.warning('当前数据缺少附件ID')
      return null
    }
    return { row: rows[0], id }
  }

  const openDetailModal = async () => {
    const selected = getSingleSelectedRow()
    if (!selected) return

    detailModal.visible = true
    detailModal.loading = true
    try {
      await loadDetailData(selected.row, selected.id)
    } catch (e: any) {
      ElMessage.error(e.message || '获取详情失败')
    } finally {
      detailModal.loading = false
    }
  }

  const closeDetailModal = () => {
    detailModal.visible = false
    detailData.value = createDetailData()
  }

  const openEditModal = async () => {
    const selected = getSingleSelectedRow()
    if (!selected) return

    Object.assign(editForm, createEditForm())
    editModal.visible = true
    editModal.loading = true
    try {
      const loaded = await loadDetailData(selected.row, selected.id)
      if (!loaded) {
        editModal.visible = false
        return
      }
      // 后端返回什么就填什么，不做任何格式化处理。
      editForm.attachId = getAttachId(detailData.value) || selected.id
      editForm.content = detailData.value.content ?? ''
      editForm.extractJson = detailData.value.extractJson ?? ''
      editForm.extractSchema = detailData.value.extractSchema ?? ''
      editForm.extractStatus = detailData.value.extractStatus ?? ''
      // 详情字段为 transcodeStatus，编辑接口参数为 transcodeStatus
      editForm.transcodeStatus = detailData.value.transcodeStatus ?? detailData.value.transcodeStatus ?? ''
    } catch (e: any) {
      editModal.visible = false
      ElMessage.error(e.message || '获取详情失败')
    } finally {
      editModal.loading = false
    }
  }

  const closeEditModal = () => {
    editModal.visible = false
    Object.assign(editForm, createEditForm())
    detailData.value = createDetailData()
  }

  /* ---------------- 建议书 / 可研报告 / 估算书 编辑（按 fjId 1/2/38 匹配） ---------------- */

  const openAttachTypeEdit = async (type: AttachDocType) => {
    const config = ATTACH_TYPE_EDIT_CONFIG[type]
    if (!config) return

    const selected = getSingleSelectedRow()
    if (!selected) return

    const fjId = String(selected.row.fjId || selected.row.attachType || '').trim()
    if (fjId !== config.fjId) {
      ElMessage.warning(`请选择${config.label}附件`)
      return
    }

    const proId = String(selected.row.proId || '').trim()
    if (!proId) {
      ElMessage.warning('当前数据缺少项目ID')
      return
    }

    attachTypeEditModal.type = type
    attachTypeEditModal.title = config.title
    attachTypeEditModal.attachName = String(selected.row.attachName || '')
    attachTypeEditModal.fjName = String(selected.row.fjName || config.label)
    attachTypeEditDetail.value = {}
    // 先取详情再开弹窗：data 为 null 时不展示空弹窗
    attachTypeEditModal.visible = false
    attachTypeEditModal.loading = true
    try {
      const res = await ATTACH_TYPE_DETAIL_API[type]({ proId, attachId: selected.id })
      if (!res.success) {
        ElMessage.error(res.msg || '获取文档详情失败')
        return
      }
      if (res.data == null) {
        ElMessage.warning(`未查询到${config.label}详情，无法编辑`)
        return
      }
      attachTypeEditDetail.value = res.data
      attachTypeEditModal.visible = true
    } catch (e: any) {
      ElMessage.error(e.message || '获取文档详情失败')
    } finally {
      attachTypeEditModal.loading = false
    }
  }

  const closeAttachTypeEdit = () => {
    attachTypeEditModal.visible = false
    attachTypeEditModal.saving = false
    attachTypeEditDetail.value = {}
  }

  const saveAttachTypeEdit = async (values: Record<string, any>) => {
    const type = attachTypeEditModal.type
    const config = ATTACH_TYPE_EDIT_CONFIG[type]
    if (!config) return

    const payload: Record<string, any> = { attachId: String(values.attachId || '') }
    if (type === 'gss') {
      if (!String(values.projectId || '').trim()) {
        ElMessage.warning('缺少项目ID，无法保存')
        return
      }
      payload.projectId = String(values.projectId)
    } else {
      if (!String(values.id || '').trim()) {
        ElMessage.warning('缺少文档ID，无法保存')
        return
      }
      payload.id = String(values.id)
      payload.proId = String(values.proId || '')
    }

    config.fields.forEach((field) => {
      payload[field.key] = field.kind === 'number' ? toNumberOrUndefined(values[field.key]) : String(values[field.key] ?? '')
    })

    attachTypeEditModal.saving = true
    try {
      const res = await ATTACH_TYPE_UPDATE_API[type](payload)
      if (res.success) {
        ElMessage.success('保存成功')
        closeAttachTypeEdit()
        await searchHandle()
      } else {
        ElMessage.error(res.msg || '保存失败')
      }
    } catch (e: any) {
      ElMessage.error(e.message || '保存失败')
    } finally {
      attachTypeEditModal.saving = false
    }
  }

  const saveEditHandle = async () => {
    if (!editForm.attachId) {
      ElMessage.warning('当前数据缺少附件ID')
      return
    }

    editModal.loading = true
    try {
      const res = await editDocument({
        attachId: editForm.attachId,
        content: editForm.content,
        extractJson: editForm.extractJson,
        extractSchema: editForm.extractSchema,
        extractStatus: editForm.extractStatus,
        transcodeStatus: editForm.transcodeStatus
      })
      if (res.success) {
        ElMessage.success('保存成功')
      } else {
        ElMessage.error(res.msg || '保存失败')
      }
    } catch (e: any) {
      ElMessage.error(e.message || '保存失败')
    } finally {
      editModal.loading = false
    }
  }

  const updateEditHandle = async () => {
    const attachId = editForm.attachId
    if (!attachId) {
      ElMessage.warning('当前数据缺少附件ID')
      return
    }

    editModal.loading = true
    try {
      const extractRes = await updateExtractData({ attachId })
      if (!extractRes.success) {
        ElMessage.error(extractRes.msg || '更新提取数据失败')
        return
      }

      ElMessage.success('更新成功')
      closeEditModal()
      await searchHandle()
    } catch (e: any) {
      ElMessage.error(e.message || '更新失败')
    } finally {
      editModal.loading = false
    }
  }

  const batchUpdateHandle = async () => {
    const rows = getSelectedRows()
    if (!rows.length) {
      ElMessage.warning('请选择数据')
      return
    }

    const attachIdList = Array.from(new Set(rows.map((row) => getAttachId(row)).filter((id): id is string => Boolean(id))))
    if (!attachIdList.length) {
      ElMessage.warning('当前选中数据缺少附件ID')
      return
    }

    gridOptions.loading = true
    try {
      const res = await updateKbBatch(attachIdList)
      if (res.success) {
        ElMessage.success('批量更新成功')
        await searchHandle()
      } else {
        ElMessage.error(res.msg || '批量更新失败')
      }
    } catch (e: any) {
      ElMessage.error(e.message || '批量更新失败')
    } finally {
      gridOptions.loading = false
    }
  }

  const deleteTaskHandle = async () => {
    const rows = getSelectedRows()
    if (!rows.length) {
      ElMessage.warning('请选择数据')
      return
    }

    const attachIds = Array.from(new Set(rows.map((row) => getAttachId(row)).filter((id): id is string => Boolean(id))))
    if (!attachIds.length) {
      ElMessage.warning('当前选中数据缺少附件ID')
      return
    }

    try {
      const type = await VXETable.modal.confirm(`是否确定删除选中的 ${attachIds.length} 条任务？`, '提示', {
        status: 'warning',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
    } catch {
      return
    }

    gridOptions.loading = true
    try {
      const res = await removeXmAttachTask(attachIds)
      if (res.success) {
        ElMessage.success('删除成功')
        await clearSelectedRows()
        await searchHandle()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (e: any) {
      ElMessage.error(e.message || '删除失败')
    } finally {
      gridOptions.loading = false
    }
  }

  // 导出：复用分页查询的筛选条件，分页参数由后端覆盖，无需传入
  const exportHandle = async () => {
    const { current, size, ...exportParams } = buildSearchParams()
    exporting.value = true
    try {
      await apiExportHandle(exportParams, '文档预处理任务', exportXmAttachTask)
    } catch (e: any) {
      ElMessage.error(e.message || '导出失败')
    } finally {
      exporting.value = false
    }
  }

  /** 点击附件名称下载附件：POST xmAttributeConfig/downloadAttachById?id={attachId} */
  const downloadAttachHandle = async (row: AttachTaskRow) => {
    const attachId = getAttachId(row)
    if (!attachId) {
      ElMessage.warning('当前数据缺少附件ID')
      return
    }
    const fileName = String(row.attachName || '').trim()
    try {
      await downloadAttachById(attachId, fileName || undefined)
    } catch (e: any) {
      ElMessage.error(e?.message || '附件下载失败')
    }
  }

  const openPriorityModal = () => {
    const rows = getSelectedRows()
    if (rows.length === 0) {
      ElMessage.warning('请选择数据')
      return
    }
    priorityForm.priority = ''
    priorityModal.visible = true
  }

  /** 查看章节：只取一条数据的 id 当 attachId（接口 xm-attach-chapter/listByTree） */
  const openChapterModal = async () => {
    const rows = getSelectedRows()
    if (rows.length !== 1) {
      ElMessage.warning(rows.length ? '请选择一条数据' : '请选择数据')
      return
    }
    const attachId = getAttachId(rows[0])
    if (!attachId) {
      ElMessage.warning('当前数据缺少附件ID')
      return
    }
    chapterModal.attachId = attachId
    chapterModal.attachName = String(rows[0].attachName || '')
    chapterModal.rows = []
    chapterModal.visible = true
    chapterModal.loading = true
    try {
      const res = await listAttachChaptersByTree(attachId)
      if (res.success) {
        chapterModal.rows = Array.isArray(res.data) ? res.data : []
      } else {
        ElMessage.error(res.msg || '章节加载失败')
      }
    } catch (e: any) {
      ElMessage.error(e.message || '章节加载失败')
    } finally {
      chapterModal.loading = false
    }
  }

  const closeChapterModal = () => {
    chapterModal.visible = false
    chapterModal.attachId = ''
    chapterModal.rows = []
  }

  const closePriorityModal = () => {
    priorityModal.visible = false
    priorityForm.priority = ''
    priorityFormRef.value?.clearValidate?.()
  }

  const savePriorityHandle = async () => {
    if (!priorityForm.priority) {
      ElMessage.warning('请选择优先级')
      return
    }
    const attachIds = getSelectedRows()
      .map((row) => getAttachId(row))
      .filter(Boolean)
    if (attachIds.length === 0) {
      ElMessage.warning('当前数据缺少附件ID')
      return
    }
    priorityModal.loading = true
    try {
      const res = await updateXmAttachTaskPriority(attachIds, priorityForm.priority)
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

  return {
    isShowPage,
    searchVisible,
    exporting,
    userRoleSelectorRef,
    helpModalRef,
    gridRef,
    searchFormRef,
    createTaskModalRef,
    priorityFormRef,
    searchForm,
    projectSearchForm,
    yearList,
    yjdwList,
    attachTypeList,
    projectTypeList,
    flowStatusList,
    gridOptions,
    projectGridOptions,
    page,
    projectPage,
    createTaskModal,
    selectedProjectRows,
    detailModal,
    detailData,
    chapterModal,
    selectedCount,
    priorityModal,
    priorityForm,
    editModal,
    editForm,
    attachTypeEditModal,
    attachTypeEditDetail,
    selectedFjId,
    openAttachTypeEdit,
    closeAttachTypeEdit,
    saveAttachTypeEdit,
    getRoleHandle,
    resetHandle,
    resetProjectHandle,
    searchHandle,
    searchProjectHandle,
    pageChangeHandle,
    limitChangeHandle,
    projectPageChangeHandle,
    projectLimitChangeHandle,
    getHelpMessageHandle,
    openColSetting,
    toggleSearchVisible,
    openCreateTaskModal,
    closeCreateTaskModal,
    createTaskHandle,
    redoTaskHandle,
    asyncTaskHandle,
    openDetailModal,
    closeDetailModal,
    openEditModal,
    closeEditModal,
    saveEditHandle,
    updateEditHandle,
    batchUpdateHandle,
    deleteTaskHandle,
    exportHandle,
    downloadAttachHandle,
    openPriorityModal,
    closePriorityModal,
    openChapterModal,
    closeChapterModal,
    savePriorityHandle,
    cellClickHandle,
    syncSelectedRows,
    syncSelectedProjectRows
  }
}
