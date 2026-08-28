import { getProtypeByGkbmId, getPublicData } from '@/api/common'
import { exportWqrDetailDataList, getWqrDetailDataList, saveDetailData } from '@/api/targetBudget/provinceTarget'
import type { UserRole } from '@/components/UserRoleSelector/interface'
import { ElMessage } from 'element-plus'
import type { Ref } from 'vue'
import { computed, inject, reactive, ref, watch } from 'vue'
import { VxeGridProps, VxeTableInstance } from 'vxe-table'
import { ProjectDetailAdjustmentType, ProjectDetailRow } from '../../types/provinceTarget'
import { validatePro } from '../../utils'
import { apiExportHandle } from '@/utils/export'

interface AdjustmentTypeOption {
  label: string
  value: ProjectDetailAdjustmentType
}

interface ProjectTreeNode {
  code?: string
  id?: string | number
  middleId?: string | number
  name?: string
  children?: ProjectTreeNode[]
  [key: string]: any
}

interface SelectOption {
  label: string
  value: string
}

interface AcceptParams {
  defaultYear?: string
  gkbmId?: string
  versionId?: string
  columns?: any[]
}

interface ProjectDetailAddModalProps {
  adjustmentTypeOptions?: AdjustmentTypeOption[]
  columns?: any[]
}

type ProjectDetailAddModalEmits = {
  (event: 'confirm'): void
}

const YEAR_PUBLIC_CODE = 'NDCX'
const DEFAULT_PAGE_SIZE = 500
const PROJECT_DETAIL_ROW_KEY_FIELD = '__rowKey'
const WQR_DETAIL_EXPORT_FILE_NAME = '待确认项目清单'

const DEFAULT_ADJUSTMENT_TYPE_OPTIONS: AdjustmentTypeOption[] = [
  { label: '新增', value: '1' },
  { label: '调整', value: '2' },
  { label: '取消', value: '3' }
]

const STATUS_CONFIG: Record<ProjectDetailAdjustmentType, { label: string; codes: string[] }> = {
  '1': { label: '待出库、出库确认退回、申请出库待确认；A计划:预算编制待提交', codes: ['320', '330', '380'] },
  '2': { label: '已立项、已关闭', codes: ['600', '800'] },
  '3': { label: '已立项、已关闭', codes: ['600', '800'] }
}

const getCurrentYear = () => new Date().getFullYear().toString()

const normalizeMultipleTextArray = (value: string) =>
  String(value || '')
    .replace(/，/g, ',')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

function getTreeNodeKey(node: ProjectTreeNode, keyFields: string[]) {
  for (const key of keyFields) {
    const value = node?.[key]
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim()
    }
  }
  return ''
}

const normalizeProjectTypeTreeNodes = (nodes: ProjectTreeNode[] = []): ProjectTreeNode[] => {
  return nodes
    .map((node) => {
      const middleId = getTreeNodeKey(node, ['middleId', 'id', 'code', 'value'])
      if (!middleId) return null
      return {
        ...node,
        middleId,
        name: String(node?.name || node?.label || middleId),
        children: normalizeProjectTypeTreeNodes(node.children || [])
      }
    })
    .filter(Boolean) as ProjectTreeNode[]
}

const normalizeReadonlyColumns = (columns: any[] = []) => {
  return columns.map((column) => {
    const nextColumn = { ...column }
    delete nextColumn.editRender
    if (nextColumn.slots?.edit && Object.keys(nextColumn.slots).length === 1) {
      delete nextColumn.slots
    }
    return nextColumn
  })
}

const normalizeYearOptions = (yearList: Array<Record<string, any>> = []) => {
  return yearList
    .map((item) => {
      const code = String(item?.code || item?.yearCode || item?.value || '').trim()
      if (!code) return null
      return {
        code,
        name: String(item?.name || item?.yearName || item?.label || code).trim() || code
      }
    })
    .filter((item): item is { code: string; name: string } => !!item)
}

const flattenTreeNodesToOptions = (
  nodes: ProjectTreeNode[] = [],
  valueField: 'code' | 'middleId',
  optionsMap = new Map<string, SelectOption>(),
  parentLabels: string[] = [],
  leafOnly = false
) => {
  nodes.forEach((node) => {
    const value = getTreeNodeKey(node, [valueField, 'id', 'code', 'value'])
    const name = String(node?.name || node?.label || value).trim()
    if (!value || !name) return

    const pathLabels = [...parentLabels, name]
    const children = Array.isArray(node.children) ? node.children : []
    const isLeafNode = children.length === 0
    if ((!leafOnly || isLeafNode) && !optionsMap.has(value)) {
      optionsMap.set(value, {
        value,
        label: pathLabels.join(' / ')
      })
    }

    if (children.length > 0) {
      flattenTreeNodesToOptions(children, valueField, optionsMap, pathLabels, leafOnly)
    }
  })

  return Array.from(optionsMap.values())
}

type ProjectDetailField = keyof ProjectDetailRow
type ProjectDetailAmountField = 'amount' | 'dnys' | 'dnysTzh'

const projectDetailFieldAliases: Record<ProjectDetailField, string[]> = {
  id: ['id', 'detailId', 'xmDetailId'],
  nd: ['nd', 'year'],
  xmmc: ['xmmc', 'projectName'],
  xmbm: ['xmbm', 'projectCode'],
  tzlx: ['tzlx', 'adjustType'],
  xmlxName: ['xmlxName', 'projectType', 'xmlx'],
  yjdwName: ['yjdwName', 'projectOrg', 'projectBelongUnit', 'xmssdw', 'ssdw'],
  ejdwName: ['ejdwName', 'secondUnitName', 'ejdw'],
  xmxzName: ['xmxzName', 'projectNature', 'xmxz'],
  jsksnd: ['jsksnd', 'buildStartYear', 'jsksnx', 'kgnd'],
  jsjsnd: ['jsjsnd', 'buildEndYear', 'jsjsnx', 'wcnd'],
  amount: ['amount', 'declareAmount', 'sbbje', 'sbje'],
  dnys: ['dnys', 'currentBudget'],
  dnysTzh: ['dnysTzh', 'adjustedCurrentBudget', 'dnystzh', 'tzhdnys'],
  tzfd: ['tzfd', 'adjustRange', 'adjustAmount'],
  kypfwh: ['kypfwh', 'feasibilityReplyNo', 'kypfwjh'],
  sfyap: ['sfyap', 'isYap'],
  xmyxjName: ['xmyxjName', 'xmyxj_name'],
  remark: ['remark', 'bz']
}

const getListRecords = (data: any): Array<Record<string, any>> => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.list)) return data.list
  return []
}

const getListTotal = (data: any, records: Array<Record<string, any>>) => {
  const total = Number(data?.total ?? records.length)
  return Number.isFinite(total) ? total : records.length
}

const getFirstMatchedValue = (row: Record<string, any>, aliases: string[]) => {
  for (const alias of aliases) {
    const value = row?.[alias]
    if (value !== undefined && value !== null) return value
  }
  return ''
}

const parseProjectDetailDecimal = (value: unknown) => {
  if (value === undefined || value === null || String(value).trim() === '') return null
  const numberValue = Number(String(value).trim())
  return Number.isFinite(numberValue) ? numberValue : null
}

const formatProjectDetailAmount = (value: unknown, emptyValue = '') => {
  const numberValue = parseProjectDetailDecimal(value)
  return numberValue === null ? emptyValue : numberValue.toFixed(6)
}

const formatProjectDetailAdjustRange = (adjustedBudget: unknown, currentBudget: unknown, emptyValue = '') => {
  const adjustedBudgetValue = parseProjectDetailDecimal(adjustedBudget)
  const currentBudgetValue = parseProjectDetailDecimal(currentBudget)
  if (adjustedBudgetValue === null || currentBudgetValue === null) return emptyValue
  return (adjustedBudgetValue - currentBudgetValue).toFixed(6)
}

const normalizeProjectDetailAdjustType = (value: unknown): ProjectDetailRow['tzlx'] => {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) return ''
  if (normalizedValue === '新增项目预算' || normalizedValue === '新增') return '1'
  if (normalizedValue === '调整项目预算' || normalizedValue === '调整') return '2'
  if (normalizedValue === '取消项目预算' || normalizedValue === '取消') return '3'
  if (normalizedValue === '1' || normalizedValue === '2' || normalizedValue === '3') {
    return normalizedValue as ProjectDetailRow['tzlx']
  }
  return ''
}

const getProjectDetailRowKey = (row: Partial<ProjectDetailRow> & Record<string, any>) => {
  const id = String(row?.id || '').trim()
  if (id) return `id:${id}`
  const xmbm = String(row?.xmbm || row?.projectCode || '').trim()
  if (xmbm) return `xmbm:${xmbm}`
  const xmmc = String(row?.xmmc || row?.projectName || '').trim()
  const xmlxName = String(row?.xmlxName || row?.projectType || row?.xmlx || '').trim()
  return `xmmc:${xmmc}::xmlx:${xmlxName}`
}

const isProjectDetailAdjustAdd = (row: ProjectDetailRow) => row.tzlx === '1'
const isProjectDetailAdjustCancel = (row: ProjectDetailRow) => row.tzlx === '3'

const applyProjectDetailAdjustRules = (row: ProjectDetailRow) => {
  if (isProjectDetailAdjustCancel(row)) {
    row.dnysTzh = formatProjectDetailAmount(0, '0.000000')
  } else if (isProjectDetailAdjustAdd(row)) {
    row.dnysTzh = formatProjectDetailAmount(row.dnys)
  }
  row.tzfd = formatProjectDetailAdjustRange(row.dnysTzh, row.dnys)
}

const normalizeProjectDetailRow = (row: Record<string, any>): ProjectDetailRow => {
  const nextRow = {
    ...row,
    id: String(getFirstMatchedValue(row, projectDetailFieldAliases.id) || ''),
    nd: String(getFirstMatchedValue(row, projectDetailFieldAliases.nd) || ''),
    xmmc: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmmc) || ''),
    xmbm: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmbm) || ''),
    tzlx: normalizeProjectDetailAdjustType(getFirstMatchedValue(row, projectDetailFieldAliases.tzlx)),
    xmlxName: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmlxName) || ''),
    yjdwName: String(getFirstMatchedValue(row, projectDetailFieldAliases.yjdwName) || ''),
    ejdwName: String(getFirstMatchedValue(row, projectDetailFieldAliases.ejdwName) || ''),
    xmxzName: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmxzName) || ''),
    jsksnd: String(getFirstMatchedValue(row, projectDetailFieldAliases.jsksnd) || ''),
    jsjsnd: String(getFirstMatchedValue(row, projectDetailFieldAliases.jsjsnd) || ''),
    amount: String(getFirstMatchedValue(row, projectDetailFieldAliases.amount) || ''),
    dnys: String(getFirstMatchedValue(row, projectDetailFieldAliases.dnys) || ''),
    dnysTzh: String(getFirstMatchedValue(row, projectDetailFieldAliases.dnysTzh) || ''),
    tzfd: String(getFirstMatchedValue(row, projectDetailFieldAliases.tzfd) || ''),
    kypfwh: String(getFirstMatchedValue(row, projectDetailFieldAliases.kypfwh) || ''),
    sfyap: String(getFirstMatchedValue(row, projectDetailFieldAliases.sfyap) || ''),
    xmyxjName: String(getFirstMatchedValue(row, projectDetailFieldAliases.xmyxjName) || ''),
    remark: String(getFirstMatchedValue(row, projectDetailFieldAliases.remark) || '')
  } as ProjectDetailRow

  ;(['amount', 'dnys', 'dnysTzh'] as ProjectDetailAmountField[]).forEach((field) => {
    nextRow[field] = formatProjectDetailAmount(nextRow[field])
  })
  applyProjectDetailAdjustRules(nextRow)
  nextRow[PROJECT_DETAIL_ROW_KEY_FIELD] = getProjectDetailRowKey(nextRow)
  return nextRow
}

const serializeProjectDetailRow = (row: ProjectDetailRow) => {
  const normalizedRow = normalizeProjectDetailRow(row) as ProjectDetailRow & Record<string, any>
  const { [PROJECT_DETAIL_ROW_KEY_FIELD]: _rowKey, ...rowData } = normalizedRow
  return {
    ...rowData,
    projectCode: normalizedRow.xmbm,
    adjustType: normalizedRow.tzlx,
    tzlx: normalizedRow.tzlx,
    xmssdw: normalizedRow.yjdwName,
    ssdw: normalizedRow.yjdwName,
    xmxz: normalizedRow.xmxzName,
    jsksnx: normalizedRow.jsksnd,
    kgnd: normalizedRow.jsksnd,
    jsjsnx: normalizedRow.jsjsnd,
    wcnd: normalizedRow.jsjsnd,
    sbbje: normalizedRow.amount,
    sbje: normalizedRow.amount,
    declareAmount: normalizedRow.amount,
    currentBudget: normalizedRow.dnys,
    dnystzh: normalizedRow.dnysTzh,
    tzhdnys: normalizedRow.dnysTzh,
    adjustedCurrentBudget: normalizedRow.dnysTzh,
    kypfwjh: normalizedRow.kypfwh,
    feasibilityReplyNo: normalizedRow.kypfwh,
    bz: normalizedRow.remark
  }
}

const mergeTreeNodes = (nodes: ProjectTreeNode[], keyFields: string[]) => {
  const nodeMap = new Map<string, ProjectTreeNode>()

  const mergeNode = (node: ProjectTreeNode) => {
    const nodeKey = getTreeNodeKey(node, keyFields)
    if (!nodeKey) return

    const currentNode = nodeMap.get(nodeKey)
    if (!currentNode) {
      nodeMap.set(nodeKey, {
        ...node,
        children: mergeTreeNodes(node.children || [], keyFields)
      })
      return
    }

    currentNode.children = mergeTreeNodes([...(currentNode.children || []), ...(node.children || [])], keyFields)
  }

  nodes.forEach(mergeNode)
  return Array.from(nodeMap.values())
}

export const useProjectDetailAddModal = (props: ProjectDetailAddModalProps, emit: ProjectDetailAddModalEmits) => {
  const currentUserRole = inject<Ref<UserRole> | undefined>('currentUserRole')
  const formRef = ref()
  const gridRef = ref<VxeTableInstance>()
  const showModal = ref(false)
  const loading = ref(false)
  const projectTypeLoading = ref(false)
  const initialYear = ref(getCurrentYear())
  const currentDeptId = ref('')
  const linkedDeptIds = ref<string[]>([])
  const currentVersionId = ref('')
  const yearOptions = ref<Array<{ code: string; name: string }>>([])
  const projectTypeTreeData = ref<ProjectTreeNode[]>([])
  let projectTypeRequestId = 0
  const modalColumns = ref<any[]>([])
  const formData = reactive({
    nd: '',
    protypeIds: [] as string[],
    xmbms: [] as string[],
    tzlx: '1' as ProjectDetailAdjustmentType
  })
  const projectCodeText = computed({
    get: () => formData.xmbms.join(','),
    set: (value: string) => {
      formData.xmbms = normalizeMultipleTextArray(value)
    }
  })
  const pageInfo = reactive({
    total: 0,
    limit: DEFAULT_PAGE_SIZE,
    page: 1,
    current: 1
  })
  const hasQueried = ref(false)
  const tableData = ref<ProjectDetailRow[]>([])

  const adjustmentTypeOptions = computed(() => {
    return props.adjustmentTypeOptions?.length ? props.adjustmentTypeOptions : DEFAULT_ADJUSTMENT_TYPE_OPTIONS
  })

  const projectTypeOptions = computed(() => flattenTreeNodesToOptions(projectTypeTreeData.value, 'middleId', new Map(), [], true))
  const statusInfo = computed(() => STATUS_CONFIG[formData.tzlx] || STATUS_CONFIG['1'])
  const readonlyColumns = computed(() => normalizeReadonlyColumns(modalColumns.value.length ? modalColumns.value : props.columns || []))

  const gridOptions = reactive<VxeGridProps<ProjectDetailRow>>({
    border: true,
    columnConfig: {
      resizable: true
    },
    checkboxConfig: {
      highlight: true,
      reserve: true,
      range: true,
      trigger: 'row'
    },
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    showHeaderOverflow: true,
    height: '100%',
    rowConfig: {
      height: 32,
      keyField: PROJECT_DETAIL_ROW_KEY_FIELD
    },
    columns: readonlyColumns.value
  })

  watch(
    readonlyColumns,
    (columns) => {
      gridOptions.columns = columns
    },
    { immediate: true }
  )

  const clearSelection = () => {
    gridRef.value?.clearCheckboxRow?.()
    gridRef.value?.clearCheckboxReserve?.()
  }

  const resetPagination = (resetLimit = false) => {
    pageInfo.total = 0
    pageInfo.page = 1
    pageInfo.current = 1
    if (resetLimit) pageInfo.limit = DEFAULT_PAGE_SIZE
  }

  const resetQueryState = (resetLimit = false) => {
    hasQueried.value = false
    tableData.value = []
    resetPagination(resetLimit)
    clearSelection()
  }

  const loadYearOptions = async () => {
    const res = await getPublicData(YEAR_PUBLIC_CODE)
    if (!res.success) throw new Error(res.msg)
    yearOptions.value = normalizeYearOptions(Array.isArray(res.data) ? res.data : [])
    if (yearOptions.value.every((item) => item.code !== initialYear.value)) {
      yearOptions.value = [{ code: initialYear.value, name: initialYear.value }, ...yearOptions.value]
    }
  }

  const normalizeLinkedDeptIds = (gkbmId?: string) => {
    return String(gkbmId || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const loadProjectTypeTreeData = async (year = formData.nd) => {
    const requestId = ++projectTypeRequestId
    projectTypeLoading.value = true
    try {
      if (!year || linkedDeptIds.value.length === 0) {
        projectTypeTreeData.value = []
        return
      }

      const results = await Promise.allSettled(linkedDeptIds.value.map((gkbmId) => getProtypeByGkbmId(gkbmId, year)))
      if (requestId !== projectTypeRequestId) return

      const successResults = results
        .filter((item): item is PromiseFulfilledResult<any> => item.status === 'fulfilled')
        .map((item) => item.value)
        .filter((item) => item?.success)
        .flatMap((item) => item.data || [])

      if (successResults.length === 0) {
        projectTypeTreeData.value = []
        throw new Error('获取项目类型失败')
      }

      projectTypeTreeData.value = normalizeProjectTypeTreeNodes(mergeTreeNodes(successResults, ['middleId', 'id', 'code']))
    } finally {
      if (requestId === projectTypeRequestId) {
        projectTypeLoading.value = false
      }
    }
  }

  const handleYearChange = async (year: string) => {
    formData.nd = String(year || '').trim()
    formData.protypeIds = []
    projectTypeTreeData.value = []
    resetQueryState()
    if (!formData.nd) return
    try {
      await loadProjectTypeTreeData(formData.nd)
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }

  const resetFormState = (defaultYear?: string, options: { clearProjectTypeTree?: boolean } = {}) => {
    const { clearProjectTypeTree = false } = options
    formData.nd = defaultYear || getCurrentYear()
    formData.protypeIds = []
    formData.xmbms = []
    formData.tzlx = '1'
    if (clearProjectTypeTree) {
      projectTypeTreeData.value = []
    }
    resetQueryState(true)
  }

  const getCurrentDeptId = () => {
    // 待确认项目清单的部门必须绑定当前版本的归口部门，避免混用角色部门。
    const deptId = String(currentDeptId.value || '').trim()
    if (!deptId) {
      throw new Error('当前版本归口部门信息缺失')
    }
    return deptId
  }

  const getWqrDetailQueryParams = () => {
    if (!formData.nd) {
      ElMessage.warning('请选择年度')
      return null
    }

    const userRole = currentUserRole?.value
    const bmId = getCurrentDeptId()
    if (!userRole?.dwId || !userRole?.roleCode || !userRole?.roleId) {
      throw new Error('当前用户角色信息缺失')
    }
    if (!currentVersionId.value) {
      throw new Error('版本信息缺失')
    }

    return {
      bmId,
      dwId: userRole.dwId,
      versionId: currentVersionId.value,
      roleCode: userRole.roleCode,
      roleId: userRole.roleId,
      page: pageInfo.page,
      limit: pageInfo.limit,
      flowStatus: statusInfo.value.codes,
      nd: formData.nd,
      tzlx: formData.tzlx,
      xmbms: formData.xmbms,
      ...(formData.protypeIds.length > 0 ? { xmlxs: formData.protypeIds } : {})
    }
  }

  const loadProjectList = async () => {
    const queryParams = getWqrDetailQueryParams()
    if (!queryParams) return
    loading.value = true
    try {
      const res = await getWqrDetailDataList(queryParams)
      if (!res.success) throw new Error(res.msg || '查询项目清单失败')
      const records = getListRecords(res.data)
      tableData.value = records.map((row) => normalizeProjectDetailRow(row))
      pageInfo.total = getListTotal(res.data, records)
      pageInfo.current = pageInfo.page
      hasQueried.value = true
    } catch (error) {
      ElMessage.error((error as Error).message)
      pageInfo.total = 0
      tableData.value = []
    } finally {
      loading.value = false
    }
  }

  const queryData = async () => {
    pageInfo.page = 1
    pageInfo.current = 1
    clearSelection()
    await loadProjectList()
  }

  const handleExport = async () => {
    const queryParams = getWqrDetailQueryParams()
    if (!queryParams) return
    loading.value = true
    try {
      await apiExportHandle(queryParams, WQR_DETAIL_EXPORT_FILE_NAME, exportWqrDetailDataList)
    } catch (error) {
      ElMessage.error((error as Error).message)
    } finally {
      loading.value = false
    }
  }

  const handlePageChange = async (currentPage: number) => {
    pageInfo.page = currentPage
    pageInfo.current = currentPage
    if (!hasQueried.value) return
    await loadProjectList()
  }

  const handleLimitChange = async (currentLimit: number) => {
    pageInfo.limit = currentLimit
    pageInfo.page = 1
    pageInfo.current = 1
    if (!hasQueried.value) return
    await loadProjectList()
  }

  const handleReset = async () => {
    resetFormState(initialYear.value, { clearProjectTypeTree: true })
    try {
      await loadProjectTypeTreeData(formData.nd)
    } catch (error) {
      ElMessage.error((error as Error).message)
    }
  }

  const handleClose = () => {
    showModal.value = false
    loading.value = false
    projectTypeRequestId += 1
    projectTypeLoading.value = false
    currentDeptId.value = ''
    currentVersionId.value = ''
    resetFormState(getCurrentYear(), { clearProjectTypeTree: true })
  }

  const handleConfirm = async () => {
    const selectedRows = [
      ...((gridRef.value?.getCheckboxReserveRecords?.() || []) as ProjectDetailRow[]),
      ...((gridRef.value?.getCheckboxRecords?.() || []) as ProjectDetailRow[])
    ].filter((row, index, rows) => rows.findIndex((item) => getProjectDetailRowKey(item) === getProjectDetailRowKey(row)) === index)
    if (selectedRows.length === 0) {
      ElMessage.warning('请至少选择一条项目清单')
      return
    }

    loading.value = true
    try {
      const userRole = currentUserRole?.value
      if (!userRole?.bmId || !userRole?.dwId) {
        throw new Error('当前用户角色信息缺失')
      }

      const validateResult = await validatePro({
        bmId: userRole.bmId,
        dwId: userRole.dwId,
        nd: formData.nd
      })
      if (!validateResult || validateResult['wjhNum'] !== 0) {
        ElMessage.error('省公司在进行目标下达调整时,不允许进行保存!')
        return
      }

      const res = await saveDetailData(selectedRows.map((row) => serializeProjectDetailRow(row)))
      if (!res.success) throw new Error(res.msg || '确认失败')
      emit('confirm')
      ElMessage.success(`成功确认 ${selectedRows.length} 条项目清单`)
      handleClose()
    } catch (error) {
      ElMessage.error((error as Error).message)
    } finally {
      loading.value = false
    }
  }

  const acceptParams = async (params: AcceptParams = {}) => {
    modalColumns.value = params.columns || props.columns || []
    initialYear.value = params.defaultYear || getCurrentYear()
    // 这里显式保存版本归口部门，后续查询和校验都只使用这个值。
    currentDeptId.value = String(params.gkbmId || '').trim()
    linkedDeptIds.value = normalizeLinkedDeptIds(params.gkbmId)
    currentVersionId.value = String(params.versionId || '').trim()
    showModal.value = true
    resetFormState(initialYear.value, { clearProjectTypeTree: true })
    loading.value = true
    try {
      const results = await Promise.allSettled([loadYearOptions(), loadProjectTypeTreeData(initialYear.value)])
      results.forEach((result) => {
        if (result.status === 'rejected') {
          ElMessage.error((result.reason as Error).message || '初始化失败')
        }
      })
      await queryData()
    } catch (error) {
      ElMessage.error((error as Error).message)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => formData.tzlx,
    () => {
      resetQueryState()
    }
  )

  return {
    formRef,
    gridRef,
    showModal,
    loading,
    projectTypeLoading,
    formData,
    projectCodeText,
    yearOptions,
    projectTypeOptions,
    adjustmentTypeOptions,
    statusInfo,
    tableData,
    pageInfo,
    gridOptions,
    acceptParams,
    handleYearChange,
    queryData,
    handleExport,
    handlePageChange,
    handleLimitChange,
    handleReset,
    handleClose,
    handleConfirm
  }
}
