import { getPublicData } from '@/api/common'
import { getShxx } from '@/api/service/Storage/confirmOutbound'
import {
  approveReview,
  checkFromWf,
  exportData,
  exportDetailDataList,
  exportSummaryData,
  getDetailDataList,
  getDynamicColumn,
  getSummaryColumn,
  getSummaryDataList,
  getTzsmByVersionId,
  getVersionDetail,
  withdrawReview
} from '@/api/targetBudget/provinceTarget'
import { loadUserWfInfo } from '@/api/workflow'
import { IObject } from '@/types/interface'
import { apiExportHandle } from '@/utils/export'
import { formatNumValue } from '@/utils/utils'
import {
  MaintainTab,
  MaintainTabOption,
  ProjectDetailPage,
  ProjectDetailRow,
  TargetBudgetMaintainRowVo
} from '@/views/targetBudget/provinceTarget/types/provinceTarget'
import { transformToVxeColumns } from '@/views/targetBudget/provinceTarget/utils'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { VxeGridListeners, VxeGridProps, VxeTableInstance } from 'vxe-table'
import Decimal from 'decimal.js'
import {
  buildMaintainDataTypeOptions,
  getMaintainDefaultDataTypes,
  getMaintainMergeFields,
  getMaintainRowDataTypeKind,
  getMaintainSpanMethod,
  isSummaryMaintainRow,
  MaintainDataTypeKind
} from '@/views/targetBudget/provinceTarget/components/hooks/targetBudgetMaintainHelpers'

const MAINTAIN_DATA_TYPE_PUBLIC_CODE = 'SJTCMBZ_DATA_TYPE'
const SUMMARY_EXPORT_FILE_NAME = '项目调整幅度汇总'
const DETAIL_EXPORT_FILE_NAME = '项目明细清单'
const DETAIL_PAGE_SIZE = 10
const COMPARE_DIFF_CELL_FONT = '#f56c6c'

const createSummaryColumns = () => [
  {
    type: 'seq',
    width: 70,
    title: '序号'
  },
  {
    field: 'adjustType',
    width: 180,
    title: '调整类型'
  },
  {
    field: 'projectCount',
    width: 120,
    title: '项目数量'
  },
  {
    field: 'declareAmount',
    width: 220,
    title: '申报金额合计（万元）（不含税）',
    align: 'right',
    formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
  },
  {
    field: 'currentBudget',
    width: 180,
    title: '当年预算合计',
    align: 'right',
    formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
  },
  {
    field: 'adjustedCurrentBudget',
    width: 220,
    title: '当年预算（调整后）合计',
    align: 'right',
    formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
  },
  {
    field: 'adjustAmount',
    width: 180,
    title: '调整差额',
    align: 'right',
    formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
  }
]

const projectDetailAdjustTypeMap: Record<string, string> = {
  '1': '新增项目预算',
  '2': '调整项目预算',
  '3': '取消项目预算',
  新增项目预算: '新增项目预算',
  调整项目预算: '调整项目预算',
  取消项目预算: '取消项目预算'
}

type ProjectDetailField = keyof ProjectDetailRow

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
  sfyap: ['sfyapName', 'sfyap', 'isYap'],
  remark: ['remark', 'bz']
}

const formatReadonlyAmount = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '-'
  if (value === '-') return value
  return formatNumValue(String(value), 6)
}

const parseReadonlyDecimal = (value: unknown) => {
  if (value === undefined || value === null || String(value).trim() === '') return null
  const numberValue = Number(String(value).trim())
  return Number.isFinite(numberValue) ? numberValue : null
}

const formatReadonlyAdjustRange = (adjustedBudget: unknown, currentBudget: unknown, emptyValue = '') => {
  const adjustedBudgetValue = parseReadonlyDecimal(adjustedBudget)
  const currentBudgetValue = parseReadonlyDecimal(currentBudget)
  if (adjustedBudgetValue === null || currentBudgetValue === null) return emptyValue
  return (adjustedBudgetValue - currentBudgetValue).toFixed(6)
}

const normalizeProjectDetailAdjustType = (value: unknown): ProjectDetailRow['tzlx'] => {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) return ''
  if (normalizedValue === '新增项目预算') return '1'
  if (normalizedValue === '调整项目预算') return '2'
  if (normalizedValue === '取消项目预算') return '3'
  if (normalizedValue === '1' || normalizedValue === '2' || normalizedValue === '3') {
    return normalizedValue as ProjectDetailRow['tzlx']
  }
  return ''
}

const formatProjectDetailAdjustTypeLabel = (value: unknown) => {
  const normalizedValue = String(value ?? '').trim()
  if (!normalizedValue) return '-'
  return projectDetailAdjustTypeMap[normalizedValue] || normalizedValue
}

const getFirstMatchedValue = (row: IObject, aliases: string[]) => {
  for (const alias of aliases) {
    const value = row?.[alias]
    if (value !== undefined && value !== null) return value
  }
  return ''
}

const normalizeProjectDetailRow = (row: IObject): ProjectDetailRow => {
  return {
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
    tzfd: formatReadonlyAdjustRange(
      getFirstMatchedValue(row, projectDetailFieldAliases.dnysTzh),
      getFirstMatchedValue(row, projectDetailFieldAliases.dnys)
    ),
    kypfwh: String(getFirstMatchedValue(row, projectDetailFieldAliases.kypfwh) || ''),
    sfyap: String(getFirstMatchedValue(row, projectDetailFieldAliases.sfyap) || ''),
    remark: String(getFirstMatchedValue(row, projectDetailFieldAliases.remark) || '')
  }
}

const getListRecords = (data: any): IObject[] => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(data?.list)) return data.list
  return []
}

const getListTotal = (data: any, records: IObject[]) => {
  const total = Number(data?.total ?? records.length)
  return Number.isFinite(total) ? total : records.length
}

const normalizeReadonlyColumns = (columns: any[]) => {
  return columns.map((column) => {
    const nextColumn = { ...column }
    if (String(nextColumn.field || '') === 'tzlx') {
      nextColumn.formatter = ({ cellValue }: { cellValue: string }) => formatProjectDetailAdjustTypeLabel(cellValue)
    }
    delete nextColumn.editRender
    if (nextColumn.slots?.edit && Object.keys(nextColumn.slots).length === 1) {
      delete nextColumn.slots
    }
    return nextColumn
  })
}

export const useWorkflowDeal = () => {
  const store = useStore()
  const loading = ref(false)
  const isWorkflowReady = ref(false)
  const activeTab = ref<MaintainTab>('maintain')
  const maintainTabs: MaintainTabOption[] = [
    { label: '省级统筹目标总控值', value: 'maintain' },
    { label: '项目调整幅度汇总', value: 'summary' },
    { label: '项目明细清单', value: 'detail' }
  ]

  const gridRef = ref<VxeTableInstance>()
  const summaryGridRef = ref<VxeTableInstance>()
  const projectDetailGridRef = ref<VxeTableInstance>()
  const tableData = ref<IObject[]>([])
  const projectAdjustSummaryData = ref<IObject[]>([])
  const projectDetailSourceData = ref<ProjectDetailRow[]>([])
  const projectDetailVisibleData = computed(() => projectDetailSourceData.value)
  const adjustRemark = ref('')
  const maintainDataTypeOptions = ref(buildMaintainDataTypeOptions())
  const maintainSearchForm = reactive({
    dataType: getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
  })
  const summaryLoaded = ref(false)
  const projectDetailLoaded = ref(false)
  const disEditableFields = ref<string[]>([])
  const maintainColorFields = ref<string[]>([])
  let maintainRowGroupsCacheSource: TargetBudgetMaintainRowVo[] | undefined
  let maintainRowGroupsCache = new Map<string, Partial<Record<MaintainDataTypeKind, TargetBudgetMaintainRowVo>>>()

  const userInfo = ref({
    id: '',
    spOrgId: '',
    spRoleId: '',
    cropId: ''
  })

  const wfDataString = ref<Record<string, any>>({})
  const workItemIdString = ref('')
  const wfInstIdString = ref('')
  const wfCodeString = ref('')
  const nodeCode = ref('')
  const approveDialogVisible = ref(false)
  const approveForm = reactive({
    spyj: '',
    shxx: ''
  })
  const shxxOptions = ref<IObject[]>([])

  const projectDetailPage = reactive<ProjectDetailPage>({
    total: 0,
    limit: DETAIL_PAGE_SIZE,
    page: 1,
    current: 1
  })

  const getWorkflowVersionId = () => {
    return wfDataString.value.VERSION_ID || wfDataString.value.versionId || ''
  }

  const resetMaintainDataTypes = () => {
    maintainSearchForm.dataType = getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
  }

  const getSelectedMaintainDataTypes = (dataTypes = maintainSearchForm.dataType) => {
    return dataTypes.length > 0 ? [...dataTypes] : getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
  }

  const isSummaryRow = (row: TargetBudgetMaintainRowVo) => isSummaryMaintainRow(row)

  const getMaintainRowGroupKey = (row: TargetBudgetMaintainRowVo) => {
    const rowId = row?.id
    if (!isSummaryRow(row) && rowId !== undefined && rowId !== null && String(rowId).trim()) {
      return `id:${String(rowId).trim()}`
    }
    return `summary:${String(row?.name || '').trim()}::${String(row?.ysly || '').trim()}`
  }

  function getMaintainRowGroups() {
    const currentData = (gridOptions.data || []) as TargetBudgetMaintainRowVo[]
    if (maintainRowGroupsCacheSource === currentData) return maintainRowGroupsCache

    const rowGroups = new Map<string, Partial<Record<MaintainDataTypeKind, TargetBudgetMaintainRowVo>>>()
    currentData.forEach((row) => {
      const dataTypeKind = getMaintainRowDataTypeKind(row)
      if (!dataTypeKind) return
      const groupKey = getMaintainRowGroupKey(row)
      const currentGroup = rowGroups.get(groupKey) || {}
      currentGroup[dataTypeKind] = row
      rowGroups.set(groupKey, currentGroup)
    })
    maintainRowGroupsCacheSource = currentData
    maintainRowGroupsCache = rowGroups
    return maintainRowGroupsCache
  }

  const hasColorFlag = (column: any) => column?.color === true || String(column?.color || '').toLowerCase() === 'true'

  const isColorColumn = (column: any) => maintainColorFields.value.includes(column?.field) || hasColorFlag(column)

  const normalizeMaintainCompareValue = (value: unknown) => String(value ?? '').trim()

  const isSameMaintainCompareValue = (left: unknown, right: unknown) => {
    const leftValue = normalizeMaintainCompareValue(left)
    const rightValue = normalizeMaintainCompareValue(right)
    if (leftValue === rightValue) return true
    if (!leftValue || !rightValue) return false

    try {
      return new Decimal(leftValue).equals(new Decimal(rightValue))
    } catch {
      return false
    }
  }

  const shouldHighlightMaintainCompareCell = (row: TargetBudgetMaintainRowVo, column: any) => {
    if (!isColorColumn(column)) return false

    const dataTypeKind = getMaintainRowDataTypeKind(row)
    if (dataTypeKind !== 'before' && dataTypeKind !== 'after') return false

    const rowGroup = getMaintainRowGroups().get(getMaintainRowGroupKey(row))
    const beforeRow = rowGroup?.before
    const afterRow = rowGroup?.after
    if (!beforeRow || !afterRow) return false

    return !isSameMaintainCompareValue(beforeRow[column.field], afterRow[column.field])
  }

  const cellStyle = ({ row, column }: any) => {
    const style: Record<string, string> = {}
    if (disEditableFields.value.includes(column?.field)) {
      style.fontWeight = 'bold'
    }
    if (shouldHighlightMaintainCompareCell(row, column)) {
      style.color = COMPARE_DIFF_CELL_FONT
      style.fontWeight = 'bold'
    }
    return Object.keys(style).length > 0 ? style : undefined
  }

  const gridOptions = reactive<VxeGridProps<TargetBudgetMaintainRowVo>>({
    border: true,
    keepSource: true,
    columnConfig: {
      resizable: true
    },
    cellStyle,
    editConfig: {
      enabled: false
    },
    spanMethod: (params: any) => {
      return getMaintainSpanMethod({
        ...params,
        mergeFields: getMaintainMergeFields((gridOptions.columns || []) as any[])
      })
    },
    rowClassName: ({ row }: { row: TargetBudgetMaintainRowVo }) => {
      return isSummaryRow(row) ? 'summary-row' : ''
    },
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    showHeaderOverflow: true,
    height: '100%',
    rowConfig: {
      height: 32
    }
  })

  const summaryGridOptions = reactive<VxeGridProps<IObject>>({
    border: true,
    columnConfig: {
      resizable: true
    },
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    showHeaderOverflow: true,
    height: '100%',
    rowConfig: {
      height: 32
    },
    columns: createSummaryColumns()
  })

  const projectDetailGridOptions = reactive<VxeGridProps<ProjectDetailRow>>({
    border: true,
    columnConfig: {
      resizable: true
    },
    headerAlign: 'center',
    align: 'center',
    showOverflow: true,
    showHeaderOverflow: true,
    height: '100%',
    rowConfig: {
      height: 32
    },
    columns: [
      {
        type: 'seq',
        width: 70,
        title: '序号'
      },
      {
        field: 'nd',
        title: '年度',
        width: 120
      },
      {
        field: 'tzlx',
        title: '调整类型',
        width: 160,
        formatter: ({ cellValue }: { cellValue: string }) => formatProjectDetailAdjustTypeLabel(cellValue)
      },
      {
        field: 'xmmc',
        title: '项目名称',
        width: 220
      },
      {
        field: 'xmbm',
        title: '项目编码',
        width: 180
      },
      {
        field: 'xmlxName',
        title: '项目类型',
        width: 180
      },
      {
        field: 'yjdwName',
        title: '一级单位',
        width: 220
      },
      {
        field: 'ejdwName',
        title: '二级单位',
        width: 220
      },
      {
        field: 'amount',
        title: '总预算（不含税）（万元）',
        width: 220,
        headerAlign: 'center',
        align: 'right',
        formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
      },
      {
        field: 'dnys',
        title: '当年预算（不含税）（万元）',
        width: 160,
        headerAlign: 'center',
        align: 'right',
        formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
      },
      {
        field: 'dnysTzh',
        title: '当年预算（调整后）',
        width: 190,
        headerAlign: 'center',
        align: 'right',
        formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
      },
      {
        field: 'tzfd',
        title: '调整幅度',
        width: 160,
        headerAlign: 'center',
        align: 'right',
        formatter: ({ cellValue }: { cellValue: string }) => formatReadonlyAmount(cellValue)
      },
      {
        field: 'kypfwh',
        title: '可研批复文号',
        width: 220
      },
      {
        field: 'sfyap',
        title: '是否预安排',
        width: 140
      }
    ]
  })

  const gridEvent = reactive<VxeGridListeners<TargetBudgetMaintainRowVo>>({})

  const syncProjectDetailPagination = (total = projectDetailSourceData.value.length) => {
    projectDetailPage.total = total
    projectDetailPage.current = projectDetailPage.page
  }

  const resetSummaryState = () => {
    projectAdjustSummaryData.value = []
    summaryLoaded.value = false
    summaryGridOptions.data = []
    summaryGridOptions.columns = createSummaryColumns()
  }

  const resetProjectDetailState = () => {
    projectDetailSourceData.value = []
    projectDetailLoaded.value = false
    projectDetailPage.total = 0
    projectDetailPage.limit = DETAIL_PAGE_SIZE
    projectDetailPage.page = 1
    projectDetailPage.current = 1
  }

  const clearMaintainGridState = () => {
    tableData.value = []
    gridOptions.data = []
    gridOptions.columns = []
    disEditableFields.value = []
    maintainColorFields.value = []
  }

  const getQueryString = (name: string): string => {
    const allParams = window.location.href.split('?').reduce((acc, part) => {
      const params = new URLSearchParams(part.split('#')[0])
      params.forEach((value, key) => acc.set(key, value))
      return acc
    }, new Map())

    if (window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1]
      new URLSearchParams(hashQuery).forEach((value, key) => allParams.set(key, value))
    }
    return allParams.get(name)
  }

  const getMaintainDataTypeOptions = async (shouldReset = false) => {
    try {
      const res = await getPublicData(MAINTAIN_DATA_TYPE_PUBLIC_CODE)
      if (!res.success) throw new Error(res.msg)
      maintainDataTypeOptions.value = buildMaintainDataTypeOptions(res.data || [])
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: `获取数据项统计失败:${(error as Error).message}`
      })
      maintainDataTypeOptions.value = buildMaintainDataTypeOptions()
    } finally {
      if (shouldReset) {
        resetMaintainDataTypes()
      }
    }
  }

  const getDynamicColumnData = async (dataTypes = maintainSearchForm.dataType) => {
    try {
      const versionId = getWorkflowVersionId()
      const res = await getDynamicColumn({
        versionId,
        dataType: getSelectedMaintainDataTypes(dataTypes)
      })
      if (!res.success) throw new Error(res.msg)
      const columns = transformToVxeColumns(res.data || []) as any[]
      disEditableFields.value = columns.filter((col: any) => !col.slots?.edit).map((col: any) => col.field)
      maintainColorFields.value = columns.filter((column) => hasColorFlag(column)).map((column) => column.field)
      gridOptions.columns = columns.map((col: any) => {
        const { editRender, slots, ...rest } = col
        return rest
      })
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    }
  }

  const getTargetBudgetMaintainData = async (dataTypes = maintainSearchForm.dataType) => {
    try {
      const versionId = getWorkflowVersionId()
      if (!versionId) {
        tableData.value = []
        gridOptions.data = []
        ElMessage({
          type: 'warning',
          message: '版本信息缺失!'
        })
        return
      }
      const res = await getVersionDetail({
        versionId,
        dataType: getSelectedMaintainDataTypes(dataTypes)
      })
      if (!res.success) throw new Error(res.msg)
      tableData.value = res.data || []
      gridOptions.data = tableData.value
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    }
  }

  const getWorkflowAdjustRemark = async () => {
    const versionId = getWorkflowVersionId()
    if (!versionId) {
      adjustRemark.value = ''
      return
    }

    const res = await getTzsmByVersionId(versionId)
    if (!res.success) throw new Error(res.msg)
    adjustRemark.value = String(res.data || '')
  }

  const loadMaintainGridData = async (dataTypes = maintainSearchForm.dataType) => {
    await Promise.all([getDynamicColumnData(dataTypes), getTargetBudgetMaintainData(dataTypes)])
  }

  const loadSummaryData = async (force = false) => {
    const versionId = getWorkflowVersionId()
    if (!versionId || (summaryLoaded.value && !force)) return

    const [columnRes, listRes] = await Promise.all([getSummaryColumn(versionId), getSummaryDataList(versionId)])
    if (!columnRes.success) throw new Error(columnRes.msg)
    if (!listRes.success) throw new Error(listRes.msg)

    const summaryColumns = normalizeReadonlyColumns(transformToVxeColumns(columnRes.data || []) as any[])
    if (summaryColumns.length > 0) {
      summaryGridOptions.columns = summaryColumns
    }

    const records = getListRecords(listRes.data)
    projectAdjustSummaryData.value = records
    summaryGridOptions.data = records
    summaryLoaded.value = true
  }

  const loadProjectDetailData = async (force = false) => {
    const versionId = getWorkflowVersionId()
    if (!versionId || (projectDetailLoaded.value && !force)) return

    const res = await getDetailDataList({
      versionId,
      page: projectDetailPage.page,
      limit: projectDetailPage.limit
    })
    if (!res.success) throw new Error(res.msg)

    const records = getListRecords(res.data)
    projectDetailSourceData.value = records.map((row) => normalizeProjectDetailRow(row))
    projectDetailLoaded.value = true
    syncProjectDetailPagination(getListTotal(res.data, records))
  }

  const loadActiveTabData = async (force = false) => {
    if (activeTab.value === 'summary') {
      await loadSummaryData(force)
      return
    }
    if (activeTab.value === 'detail') {
      await loadProjectDetailData(force)
    }
  }

  const handleFilterQuery = async () => {
    loading.value = true
    try {
      const selectedDataTypes = getSelectedMaintainDataTypes()
      maintainSearchForm.dataType = selectedDataTypes
      await loadMaintainGridData(selectedDataTypes)
    } finally {
      loading.value = false
    }
  }

  const handleFilterReset = async () => {
    loading.value = true
    try {
      resetMaintainDataTypes()
      await loadMaintainGridData(maintainSearchForm.dataType)
    } finally {
      loading.value = false
    }
  }

  const handleTabChange = () => {
    if (!isWorkflowReady.value) return
    void nextTick().then(async () => {
      gridRef.value?.recalculate?.()
      summaryGridRef.value?.recalculate?.()
      projectDetailGridRef.value?.recalculate?.()
      loading.value = true
      try {
        await loadActiveTabData()
      } catch (error) {
        ElMessage({
          type: 'error',
          duration: 1500,
          message: (error as Error).message
        })
      } finally {
        loading.value = false
      }
    })
  }

  watch(activeTab, () => {
    handleTabChange()
  })

  const initWorkflowContext = async () => {
    const workItemId = getQueryString('workItemId')
    if (!workItemId) {
      ElMessage({
        type: 'error',
        message: '缺少工作流参数!'
      })
      isWorkflowReady.value = false
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(workItemId)) {
      ElMessage({
        type: 'error',
        message: '工作流参数格式无效!'
      })
      isWorkflowReady.value = false
      return
    }

    loading.value = true
    isWorkflowReady.value = false
    activeTab.value = 'maintain'
    clearMaintainGridState()
    resetSummaryState()
    resetProjectDetailState()

    try {
      const res = await loadUserWfInfo(workItemId)
      if (!res.success) throw new Error(res.msg)
      const data = res.data || {}
      userInfo.value = { ...(data.user || {}) }
      wfDataString.value = { ...(data.wfData || {}) }
      workItemIdString.value = workItemId
      wfInstIdString.value = data.wfInstId || ''
      wfCodeString.value = data.wfCode || ''
      nodeCode.value = data.nodeCode || ''

      await getMaintainDataTypeOptions(true)
      const results = await Promise.allSettled([loadMaintainGridData(), getWorkflowAdjustRemark()])
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`加载失败 ${index}:`, result.reason)
        }
      })
      isWorkflowReady.value = true
    } catch (error) {
      isWorkflowReady.value = false
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    } finally {
      loading.value = false
    }
  }

  const handleExportData = async () => {
    if (!isWorkflowReady.value) {
      ElMessage({
        type: 'warning',
        message: '工作流未就绪,请稍后再试!'
      })
      return
    }
    const versionId = getWorkflowVersionId()
    if (!versionId) {
      ElMessage({
        type: 'warning',
        message: '版本信息缺失,无法导出!'
      })
      return
    }
    loading.value = true
    try {
      await apiExportHandle(
        {
          versionId,
          dataType: getSelectedMaintainDataTypes()
        },
        '目标值导出',
        exportData
      )
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    } finally {
      loading.value = false
    }
  }

  const handleSummaryExportData = async () => {
    if (!isWorkflowReady.value) {
      ElMessage({
        type: 'warning',
        message: '工作流未就绪,请稍后再试!'
      })
      return
    }
    const versionId = getWorkflowVersionId()
    if (!versionId) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: '版本信息缺失,无法导出!'
      })
      return
    }
    loading.value = true
    try {
      await apiExportHandle(versionId, SUMMARY_EXPORT_FILE_NAME, exportSummaryData)
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    } finally {
      loading.value = false
    }
  }

  const handleProjectDetailExportData = async () => {
    if (!isWorkflowReady.value) {
      ElMessage({
        type: 'warning',
        message: '工作流未就绪,请稍后再试!'
      })
      return
    }
    const versionId = getWorkflowVersionId()
    if (!versionId) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: '版本信息缺失,无法导出!'
      })
      return
    }
    loading.value = true
    try {
      await apiExportHandle(
        {
          versionId,
          page: 1,
          limit: Number(projectDetailPage.total) || 99999
        },
        DETAIL_EXPORT_FILE_NAME,
        exportDetailDataList
      )
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    } finally {
      loading.value = false
    }
  }

  const handleProjectDetailPageChange = async (currentPageNum: number) => {
    projectDetailPage.page = currentPageNum
    projectDetailPage.current = currentPageNum
    loading.value = true
    try {
      await loadProjectDetailData(true)
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    } finally {
      loading.value = false
    }
  }

  const handleProjectDetailLimitChange = async (currentLimitNum: number) => {
    projectDetailPage.page = 1
    projectDetailPage.current = 1
    projectDetailPage.limit = currentLimitNum
    loading.value = true
    try {
      await loadProjectDetailData(true)
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    } finally {
      loading.value = false
    }
  }

  const closeDialog = () => {
    try {
      if (window.parent?.Appframe?.closePopWindow) {
        window.parent.Appframe.closePopWindow(window)
      } else {
        window.parent.postMessage('close', '*')
      }
    } catch (error) {
      window.parent.postMessage('close', '*')
    }
  }

  const isApproveNeedShxx = computed(() => nodeCode.value === 'CWBM_ZZ')

  const resetApproveForm = () => {
    approveForm.spyj = ''
    approveForm.shxx = ''
  }

  const loadShxxOptions = async () => {
    try {
      const res = await getShxx({})
      if (res.success) {
        shxxOptions.value = Array.isArray(res.data) ? res.data : []
      }
    } catch (error) {
      console.error('获取上会信息失败:', error)
      shxxOptions.value = []
    }
  }

  const closeApproveDialog = () => {
    if (loading.value) return
    approveDialogVisible.value = false
    resetApproveForm()
  }

  const validateMessage = async (): Promise<boolean> => {
    const versionId = getWorkflowVersionId()
    if (!versionId) {
      ElMessage({
        type: 'warning',
        message: '版本信息缺失!'
      })
      return false
    }

    try {
      const res = await checkFromWf(versionId)
      if (!res.success) throw new Error(res.msg)
      return true
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
      return false
    }
  }

  const handlePass = async () => {
    if (!isWorkflowReady.value) {
      ElMessage({
        type: 'warning',
        message: '工作流未就绪,无法执行审批操作!'
      })
      return
    }
    const validateRes = await validateMessage()
    if (!validateRes) return
    resetApproveForm()
    if (isApproveNeedShxx.value) {
      await loadShxxOptions()
    }
    approveDialogVisible.value = true
  }

  const submitApproveDialog = async () => {
    const spyj = String(approveForm.spyj || '').trim()
    const shxx = String(approveForm.shxx || '').trim()
    if (!spyj) {
      ElMessage.warning('审批意见不能为空')
      return
    }
    if (isApproveNeedShxx.value && !shxx) {
      ElMessage.warning('上会信息不能为空')
      return
    }

    loading.value = true
    try {
      const userId = store.getters?.getUserMsg?.id
      if (!userId) throw new Error('用户信息获取失败,请重新再试!')
      const params = {
        workItemId: workItemIdString.value,
        wfInstId: wfInstIdString.value,
        wfCode: wfCodeString.value,
        spyj,
        userId,
        dwId: wfDataString.value.DW_ID || wfDataString.value.dwId,
        versionId: getWorkflowVersionId(),
        spOrgId: userInfo.value.spOrgId,
        spRoleId: userInfo.value.spRoleId,
        ...(isApproveNeedShxx.value ? { shxx } : {})
      }
      const res = await approveReview(params)
      if (!res.success) throw new Error(res.msg)
      approveDialogVisible.value = false
      resetApproveForm()
      ElMessage({
        type: 'success',
        message: '审核通过'
      })
      try {
        if (window.parent?.Appframe?.closePopWindow) {
          window.parent.Appframe.closePopWindow(window)
        } else {
          window.parent.postMessage('提交成功!', '*')
        }
      } catch (error) {
        window.parent.postMessage('提交成功!', '*')
      }
    } catch (error) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    } finally {
      loading.value = false
    }
  }

  const handleReject = () => {
    if (!isWorkflowReady.value) {
      ElMessage({
        type: 'warning',
        message: '工作流未就绪,无法执行驳回操作!'
      })
      return
    }

    ElMessageBox.prompt('请输入审批意见', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^.+$/,
      inputErrorMessage: '审批意见不能为空',
      customClass: 'workflow-messagebox-center-btn'
    })
      .then(async (val) => {
        loading.value = true
        try {
          const userId = store.getters?.getUserMsg?.id
          if (!userId) throw new Error('用户信息获取失败,请重新再试!')
          const params = {
            workItemId: workItemIdString.value,
            wfInstId: wfInstIdString.value,
            wfCode: wfCodeString.value,
            spyj: val.value,
            userId,
            dwId: wfDataString.value.DW_ID || wfDataString.value.dwId,
            versionId: getWorkflowVersionId(),
            spOrgId: userInfo.value.spOrgId,
            spRoleId: userInfo.value.spRoleId
          }
          const res = await withdrawReview(params)
          if (!res.success) throw new Error(res.msg)
          ElMessage({
            type: 'success',
            message: '已驳回'
          })
          try {
            if (window.parent?.Appframe?.closePopWindow) {
              window.parent.Appframe.closePopWindow(window)
            } else {
              window.parent.postMessage('驳回成功!', '*')
            }
          } catch (error) {
            window.parent.postMessage('驳回成功!', '*')
          }
        } catch (error) {
          ElMessage({
            type: 'error',
            duration: 1500,
            message: (error as Error).message
          })
        } finally {
          loading.value = false
        }
      })
      .catch(() => {})
  }

  return {
    loading,
    isWorkflowReady,
    activeTab,
    maintainTabs,
    gridEvent,
    gridOptions,
    gridRef,
    tableData,
    adjustRemark,
    maintainSearchForm,
    maintainDataTypeOptions,
    summaryGridRef,
    summaryGridOptions,
    projectAdjustSummaryData,
    projectDetailGridRef,
    projectDetailGridOptions,
    projectDetailVisibleData,
    projectDetailPage,
    userInfo,
    wfDataString,
    approveDialogVisible,
    approveForm,
    shxxOptions,
    isApproveNeedShxx,
    workItemIdString,
    wfInstIdString,
    wfCodeString,
    initWorkflowContext,
    getTargetBudgetMaintainData,
    handleFilterQuery,
    handleFilterReset,
    handleExportData,
    handleSummaryExportData,
    handleProjectDetailExportData,
    handleProjectDetailPageChange,
    handleProjectDetailLimitChange,
    handlePass,
    submitApproveDialog,
    handleReject,
    closeApproveDialog,
    closeDialog
  }
}
