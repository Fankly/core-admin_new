import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridInstance } from 'vxe-table'
import { getPublicData, getSubProtypeTree, getYearData, getYjdwFromCm } from '@/api/common'
import { exportGssParse, exportJysParse, exportKyParse, getGssParsePage, getJysParsePage, getKyParsePage } from '@/api/ai/documentParsing'
import type { DocParseQuery, ParseDocType, ParseRow } from '@/api/ai/documentParsing'
import {
  getGssAttachDetail,
  getJysAttachDetail,
  getKybgAttachDetail,
  updateGssAttach,
  updateJysAttach,
  updateKybgAttach
} from '@/api/ai/document/xmAttachTask'
import { apiExportHandle } from '@/utils/export'
import { ATTACH_TYPE_EDIT_CONFIG } from '@/views/ai/document/constants'
import type { AttachDocType, AttachTypeEditModalState } from '@/views/ai/document/types'
import { normalizeOptionList, normalizeYearList } from '@/views/ai/document/utils'
import { PARSE_TABS, createParseColumns, createParseSearchForm } from '../constants'
import type { ParseOption, ParseSearchForm } from '../constants'

const PAGE_API: Record<ParseDocType, (params: DocParseQuery) => Promise<any>> = {
  jys: getJysParsePage,
  ky: getKyParsePage,
  gss: getGssParsePage
}

const EXPORT_API: Record<ParseDocType, (params: DocParseQuery) => Promise<any>> = {
  jys: exportJysParse,
  ky: exportKyParse,
  gss: exportGssParse
}

/** 修改复用文档预处理的三类文档详情/保存接口（按附件ID查询 info 表） */
const DETAIL_API: Record<AttachDocType, (params: { proId?: string; attachId?: string }) => Promise<any>> = {
  jys: getJysAttachDetail,
  kybg: getKybgAttachDetail,
  gss: getGssAttachDetail
}

const UPDATE_API: Record<AttachDocType, (params: any) => Promise<any>> = {
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

export const useDocumentParsing = () => {
  const activeTab = ref<ParseDocType>('jys')
  const searchForm = reactive<ParseSearchForm>(createParseSearchForm())
  const yearList = ref<ParseOption[]>([])
  const yjdwList = ref<ParseOption[]>([])
  const projectTypeList = ref<any[]>([])
  const flowStatusList = ref<ParseOption[]>([])
  const rows = ref<ParseRow[]>([])
  const loading = ref(false)
  const exporting = ref(false)
  const selectedRows = ref<ParseRow[]>([])
  const gridRef = ref<VxeGridInstance>()
  const page = reactive({
    page: 1,
    limit: 20,
    total: 0
  })

  const tabConfig = computed(() => PARSE_TABS.find((tab) => tab.key === activeTab.value) || PARSE_TABS[0])
  const columns = computed(() => createParseColumns(tabConfig.value))

  /** 修改弹窗：字段配置与文档预处理的三个弹窗共用 */
  const editModal = reactive<AttachTypeEditModalState>({
    visible: false,
    loading: false,
    saving: false,
    type: 'jys',
    title: '',
    attachName: '',
    fjName: ''
  })
  const editDetail = ref<Record<string, any>>({})

  const editDisabledReason = computed(() => {
    if (loading.value) return ''
    if (selectedRows.value.length === 0) return '请先选择一条数据'
    if (selectedRows.value.length > 1) return '仅支持修改单条数据'
    return ''
  })

  const syncSelectedRows = () => {
    const row = gridRef.value?.getRadioRecord()
    selectedRows.value = row ? [row] : []
  }

  const clearSelectedRows = () => {
    selectedRows.value = []
    gridRef.value?.clearRadioRow()
  }

  const buildQuery = (): DocParseQuery => ({
    xmbm: searchForm.xmbm.trim(),
    xmmc: searchForm.xmmc.trim(),
    proTypes: Array.isArray(searchForm.proTypes) ? [...searchForm.proTypes] : [],
    jhssnd: searchForm.jhssnd,
    yjdw: searchForm.yjdw,
    zt: Array.isArray(searchForm.zt) ? [...searchForm.zt] : [],
    attachName: searchForm.attachName.trim()
  })

  const searchHandle = async () => {
    loading.value = true
    try {
      const res = await PAGE_API[activeTab.value]({ ...buildQuery(), page: page.page, limit: page.limit })
      if (res.success) {
        rows.value = res.data?.records || []
        page.total = Number(res.data?.total || 0)
      } else {
        ElMessage.error(res.msg || '查询失败')
        rows.value = []
        page.total = 0
      }
    } catch (e: any) {
      ElMessage.error(e.message || '查询失败')
      rows.value = []
      page.total = 0
    } finally {
      loading.value = false
      clearSelectedRows()
    }
  }

  const resetHandle = () => {
    Object.assign(searchForm, createParseSearchForm())
    page.page = 1
    searchHandle()
  }

  const pageChangeHandle = (currentPage: number) => {
    page.page = currentPage
    searchHandle()
  }

  const limitChangeHandle = (limit: number) => {
    page.limit = limit
    page.page = 1
    searchHandle()
  }

  const exportHandle = async () => {
    exporting.value = true
    try {
      // 导出忽略 page/limit：只传查询条件
      await apiExportHandle(buildQuery(), tabConfig.value.label, EXPORT_API[activeTab.value])
    } catch (e: any) {
      ElMessage.error(e.message || '导出失败')
    } finally {
      exporting.value = false
    }
  }

  const openEditModal = async () => {
    if (selectedRows.value.length !== 1) {
      ElMessage.warning('请选择一条数据')
      return
    }
    const row = selectedRows.value[0]
    const type = tabConfig.value.editType
    const config = ATTACH_TYPE_EDIT_CONFIG[type]
    const proId = String(row.proId || '').trim()
    const attachId = String(row.attachId || '').trim()
    if (!proId || !attachId) {
      ElMessage.warning('当前数据缺少项目ID或附件ID')
      return
    }

    editModal.type = type
    editModal.title = config.title
    editModal.attachName = String(row.attachName || '')
    editModal.fjName = String(row.fjName || config.label)
    editDetail.value = {}
    // 先取详情再开弹窗：data 为 null 时不展示空弹窗
    editModal.visible = false
    editModal.loading = true
    try {
      const res = await DETAIL_API[type]({ proId, attachId })
      if (!res.success) {
        ElMessage.error(res.msg || '获取文档详情失败')
        return
      }
      if (res.data == null) {
        ElMessage.warning(`未查询到${config.label}详情，无法编辑`)
        return
      }
      editDetail.value = res.data
      editModal.visible = true
    } catch (e: any) {
      ElMessage.error(e.message || '获取文档详情失败')
    } finally {
      editModal.loading = false
    }
  }

  const closeEditModal = () => {
    editModal.visible = false
    editModal.saving = false
    editDetail.value = {}
  }

  const saveEdit = async (values: Record<string, any>) => {
    const type = editModal.type
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

    editModal.saving = true
    try {
      const res = await UPDATE_API[type](payload)
      if (res.success) {
        ElMessage.success('保存成功')
        closeEditModal()
        await searchHandle()
      } else {
        ElMessage.error(res.msg || '保存失败')
      }
    } catch (e: any) {
      ElMessage.error(e.message || '保存失败')
    } finally {
      editModal.saving = false
    }
  }

  const initOptions = async () => {
    const [yearRes, yjdwRes, projectTypeRes, statusRes] = await Promise.allSettled([
      getYearData(),
      getYjdwFromCm(),
      getSubProtypeTree(),
      getPublicData('ZLYS_XMZT')
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
    if (statusRes.status === 'fulfilled' && statusRes.value.success) {
      flowStatusList.value = normalizeOptionList(statusRes.value.data || [])
    }
  }

  // 切页签：条件保留，页码回到第一页并重新取数
  watch(activeTab, () => {
    page.page = 1
    page.total = 0
    rows.value = []
    searchHandle()
  })

  onMounted(async () => {
    await initOptions()
    await searchHandle()
  })

  return {
    activeTab,
    searchForm,
    yearList,
    yjdwList,
    projectTypeList,
    flowStatusList,
    rows,
    loading,
    exporting,
    selectedRows,
    gridRef,
    page,
    tabConfig,
    columns,
    editModal,
    editDetail,
    editDisabledReason,
    searchHandle,
    resetHandle,
    pageChangeHandle,
    limitChangeHandle,
    exportHandle,
    syncSelectedRows,
    openEditModal,
    closeEditModal,
    saveEdit
  }
}
