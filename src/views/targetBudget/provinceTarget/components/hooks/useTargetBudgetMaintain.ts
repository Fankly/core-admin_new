import ImportExcel from '@/components/ImportExcel/index.vue'
import TargetControlAdjustmentModal from '@/views/targetBudget/provinceTarget/components/TargetControlAdjustmentModal.vue'
import { getPublicData } from '@/api/common'
import {
  deleteDetailData,
  exportData,
  exportDetailDataList,
  exportSummaryData,
  getDetailDataList,
  getDetailImportTemplate,
  getDynamicColumn,
  getImportTemplate,
  getSummaryColumn,
  getSummaryDataList,
  getVersionDetail,
  importData,
  importDetailData,
  provinceTargetCreateOrEdit,
  saveData,
  submitReview,
  updateDetailData,
  targetValueResetData
} from '@/api/targetBudget/provinceTarget'
import { IObject } from '@/types/interface'
import { ElMessage } from 'element-plus'
import { computed, inject, nextTick, reactive, Ref, ref, watch } from 'vue'
import { VxeGridListeners, VxeGridProps, VxeModalInstance, VXETable, VxeTableInstance } from 'vxe-table'
import {
  MaintainParams,
  MaintainTab,
  MaintainTabOption,
  ProjectDetailAdjustmentType,
  ProjectDetailPage,
  ProjectDetailRow,
  TargetBudgetMaintainProps,
  TargetBudgetMaintainRowVo
} from '../../types/provinceTarget'
import { transformToVxeColumns, validatePro, validateWorkflowMessage } from '../../utils/index'
import { UserRole } from '@/components/UserRoleSelector/interface'
import { submitWorkflow, WFData, WFParam, WFUserInfo } from '@/hooks/useWorkflow'
import { useStore } from 'vuex'
import Decimal from 'decimal.js'
import {
  buildMaintainDataTypeOptions,
  canEditMaintainCell,
  getMaintainDefaultDataTypes,
  getMaintainMergeFields,
  getMaintainRowDataTypeKind,
  getMaintainSpanMethod,
  isSummaryMaintainRow,
  MaintainDataTypeKind
} from './targetBudgetMaintainHelpers'
import { apiExportHandle } from '@/utils/export'

export const useTargetBudgetMaintain = (props: TargetBudgetMaintainProps) => {
  const store = useStore()
  const DECIMAL_PLACES = 6
  const DECIMAL_DIGITS = String(DECIMAL_PLACES)
  const MAINTAIN_DATA_TYPE_PUBLIC_CODE = 'SJTCMBZ_DATA_TYPE'
  const PROJECT_DETAIL_ADJUST_TYPE_PUBLIC_CODE = 'SJTCMBZ_TZLX_COM'
  const ADJUST_REMARK_REQUIRED_MESSAGE = '请输入调整说明!'
  const VALIDATE_SAVE_MESSAGE = '暂无数据变更,无需保存!'
  const SAVE_DATA_SUCCESS = '保存成功!'
  const DETAIL_VALIDATE_SAVE_MESSAGE = '项目明细清单暂无数据变更,无需保存!'
  const DETAIL_SAVE_SUCCESS = '项目明细清单保存成功!'
  const DETAIL_ADJUSTED_BUDGET_EXCEED_MESSAGE = '当年预算（调整后）不能大于总预算（不含税）（万元）!'
  const SUMMARY_EXPORT_FILE_NAME = '项目调整幅度汇总'
  const DETAIL_EXPORT_FILE_NAME = '项目明细清单'
  const DETAIL_IMPORT_TIP = '建议先下载标准模板，按模板格式填写后再上传导入。'
  const EDITABLE_CELL_BACKGROUND = '#338d89'
  const EDITABLE_CELL_FONT = '#fff'
  const COMPARE_DIFF_CELL_FONT = '#f56c6c'
  const currentUserRole = inject<Ref<UserRole>>('currentUserRole')!
  const gridRef = ref<VxeTableInstance>()
  const summaryGridRef = ref<VxeTableInstance>()
  const projectDetailGridRef = ref<VxeTableInstance>()
  const targetBudgetMaintainRef = ref<VxeModalInstance>()
  const importRef = ref<InstanceType<typeof ImportExcel>>()
  const targetControlAdjustmentModalRef = ref<InstanceType<typeof TargetControlAdjustmentModal>>()
  const modalTitle = ref('项目类型目标值调整')
  const isShowModal = ref(false)
  const loading = ref(false)
  const modalWidth = ref('88%')
  const modalHeight = ref('820')
  const activeTab = ref<MaintainTab>('maintain')
  const summaryLoaded = ref(false)
  const projectDetailLoaded = ref(false)
  const defaultSummaryColumns = ref<any[]>([])
  const maintainTabs: MaintainTabOption[] = [
    { label: '省级统筹目标总控值', value: 'maintain' },
    { label: '项目调整幅度汇总', value: 'summary' },
    { label: '项目明细清单', value: 'detail' }
  ]
  const tableData = ref<IObject[]>([])
  const projectAdjustSummaryData = ref<IObject[]>([])
  const maintainDataTypeOptions = ref(buildMaintainDataTypeOptions())
  const maintainSearchForm = reactive({
    dataType: getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
  })
  const originalRemark = ref('')
  // 父组件传过来的参数
  const parameter = ref<MaintainParams>()
  const isChangeData = computed(() => parameter.value?.isChangeData)
  const getMaintainRemarkValue = (params?: Partial<MaintainParams>) => params?.tzsm || ''
  const adjustRemark = computed({
    get: () => getMaintainRemarkValue(parameter.value),
    set: (value: string) => {
      if (parameter.value) parameter.value.tzsm = value
    }
  })
  const hasRemarkChanged = computed(() => getMaintainRemarkValue(parameter.value) !== originalRemark.value)

  const wfParam = ref<WFParam>({
    VERSION_ID: '',
    BMID: '',
    DWID: '',
    BMNAME: ''
  })

  const isShowBtn = computed(() => parameter.value?.operationFlag !== 'VIEW')
  const isTargetValueMaintain = computed(() => parameter.value?.operationFlag === 'EDIT')
  const isMaintainEditEnabled = computed(() => false)
  const isSummaryRow = (row: TargetBudgetMaintainRowVo) => isSummaryMaintainRow(row)

  const disEditableFields = ref<string[]>([])
  const maintainColorFields = ref<string[]>([])
  let maintainRowGroupsCacheSource: TargetBudgetMaintainRowVo[] | undefined
  let maintainRowGroupsCache = new Map<string, Partial<Record<MaintainDataTypeKind, TargetBudgetMaintainRowVo>>>()

  const getDiseditableFields = (columns: any[] = (gridOptions.columns || []) as any[]): string[] => {
    return columns
      .filter((col: any) => !col.slots?.edit)
      .map((col: any) => col.field)
      .filter((field: unknown): field is string => !!field)
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

  const buildProjectDetailAdjustmentTypeOptions = (publicCodes: Array<{ code?: string | null; name?: string | null }> = []) => {
    const optionsMap = new Map<ProjectDetailAdjustmentType, { label: string; value: ProjectDetailAdjustmentType }>()
    publicCodes.forEach((item) => {
      const value = String(item?.code || '').trim() as ProjectDetailAdjustmentType
      const label = String(item?.name || '').trim()
      if (!['1', '2', '3'].includes(value) || !label) return
      optionsMap.set(value, { label, value })
    })
    return defaultProjectDetailAdjustmentTypeOptions.map((item) => optionsMap.get(item.value) || item)
  }

  const cellStyle = ({ row, column }: any) => {
    const style: Record<string, string> = {}
    if (disEditableFields.value.includes(column['field'])) {
      style.fontWeight = 'bold'
    }
    if (isMaintainEditEnabled.value && canEditMaintainCell(row) && getEditableFields().includes(column?.field)) {
      style.backgroundColor = EDITABLE_CELL_BACKGROUND
      style.color = EDITABLE_CELL_FONT
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
      trigger: 'click',
      mode: 'cell',
      enabled: isMaintainEditEnabled.value,
      showStatus: true,
      beforeEditMethod: ({ row }: { row: TargetBudgetMaintainRowVo }) => {
        return isMaintainEditEnabled.value && canEditMaintainCell(row)
      }
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
  gridOptions.spanMethod = (params: any) => {
    return getMaintainSpanMethod({
      ...params,
      mergeFields: getMaintainMergeFields((gridOptions.columns || []) as any[])
    })
  }

  // 可编辑列
  const editableColumns = computed(() => {
    if (!isMaintainEditEnabled.value) return []
    return (gridOptions.columns || []).filter((col: any) => col.slots?.edit)
  })

  const getEditableFields = (): string[] => {
    return editableColumns.value.map((col: any) => col.field).filter((field: unknown): field is string => !!field)
  }

  type ProjectDetailField = keyof ProjectDetailRow
  type ProjectDetailTextEditableField = 'nd' | 'xmbm'
  type ProjectDetailAmountField = 'amount' | 'dnys' | 'dnysTzh'
  type ProjectDetailAmountEditableField = 'dnysTzh'
  type ProjectDetailPreArrangeValue = '0' | '1'

  const defaultProjectDetailAdjustmentTypeOptions: Array<{ label: string; value: ProjectDetailAdjustmentType }> = [
    { label: '新增项目预算', value: '1' },
    { label: '调整项目预算', value: '2' },
    { label: '取消项目预算', value: '3' }
  ]
  const projectDetailPreArrangeOptions: Array<{ label: string; value: ProjectDetailPreArrangeValue }> = [
    { label: '否', value: '0' },
    { label: '是', value: '1' }
  ]
  const projectDetailAdjustmentTypeOptions = ref(defaultProjectDetailAdjustmentTypeOptions)
  const projectDetailTextFields: ProjectDetailTextEditableField[] = []
  const projectDetailAmountFields: ProjectDetailAmountEditableField[] = []
  const projectDetailAllAmountFields: ProjectDetailAmountField[] = ['amount', 'dnys', 'dnysTzh']
  const projectDetailEditableFields = new Set<string>(['dnysTzh', 'sfyap'])
  const projectDetailDefaultPageSize = 500
  const detailEditRender = {
    name: 'input',
    autofocus: '.my-input',
    autoselect: true
  }
  const detailSelectEditRender = {
    name: 'select',
    autofocus: '.targetBudgetMaintain-select .el-input__inner'
  }
  const normalizeProjectDetailAdjustType = (value: unknown): ProjectDetailRow['tzlx'] => {
    const normalizedValue = String(value ?? '').trim()
    if (!normalizedValue) return ''
    const matchedOption = projectDetailAdjustmentTypeOptions.value.find((item) => item.value === normalizedValue || item.label === normalizedValue)
    if (matchedOption) return matchedOption.value
    if (normalizedValue === '新增项目预算') return '1'
    if (normalizedValue === '调整项目预算') return '2'
    if (normalizedValue === '取消项目预算') return '3'
    return ''
  }
  const formatProjectDetailAdjustTypeLabel = (value: unknown) => {
    const normalizedValue = normalizeProjectDetailAdjustType(value)
    const matchedOption = projectDetailAdjustmentTypeOptions.value.find((item) => item.value === normalizedValue)
    return matchedOption?.label || String(value ?? '-') || '-'
  }
  const normalizeProjectDetailPreArrange = (value: unknown): ProjectDetailRow['sfyap'] => {
    const normalizedValue = String(value ?? '').trim()
    if (!normalizedValue) return ''
    if (normalizedValue === '0' || normalizedValue === '否') return '0'
    if (normalizedValue === '1' || normalizedValue === '是') return '1'
    return ''
  }
  const formatProjectDetailPreArrangeLabel = (value: unknown) => {
    const normalizedValue = normalizeProjectDetailPreArrange(value)
    const matchedOption = projectDetailPreArrangeOptions.find((item) => item.value === normalizedValue)
    return matchedOption?.label || String(value ?? '-') || '-'
  }
  const summaryAmountFormatter = ({ cellValue }: { cellValue: string }) => formatProjectDetailAmountDisplay(cellValue)
  const projectDetailEditEnabled = ref(false)
  const projectDetailPage = reactive<ProjectDetailPage>({
    total: 0,
    limit: projectDetailDefaultPageSize,
    page: 1,
    current: 1
  })
  const projectDetailSourceData = ref<ProjectDetailRow[]>([])
  const projectDetailSnapshot = ref<ProjectDetailRow[]>([])

  const parseProjectDetailDecimal = (value: unknown) => {
    if (value === undefined || value === null || String(value).trim() === '') return null
    try {
      return new Decimal(String(value).trim())
    } catch {
      return null
    }
  }

  function formatProjectDetailAmount(value: unknown, emptyValue = '') {
    const decimalValue = parseProjectDetailDecimal(value)
    return decimalValue ? decimalValue.toFixed(DECIMAL_PLACES) : emptyValue
  }

  function formatProjectDetailAmountDisplay(value: unknown) {
    return formatProjectDetailAmount(value, '-')
  }

  const formatProjectDetailAdjustRange = (adjustedBudget: unknown, currentBudget: unknown, emptyValue = '') => {
    const adjustedBudgetValue = parseProjectDetailDecimal(adjustedBudget)
    const currentBudgetValue = parseProjectDetailDecimal(currentBudget)
    if (adjustedBudgetValue === null || currentBudgetValue === null) return emptyValue
    return adjustedBudgetValue.minus(currentBudgetValue).toFixed(DECIMAL_PLACES)
  }

  const resetProjectDetailAdjustedBudgetToZero = (row: ProjectDetailRow) => {
    row.dnysTzh = formatProjectDetailAmount(0, '0.000000')
    row.tzfd = formatProjectDetailAdjustRange(row.dnysTzh, row.dnys)
  }

  const isProjectDetailAdjustedBudgetExceeded = (row: ProjectDetailRow) => {
    const adjustedBudgetValue = parseProjectDetailDecimal(row.dnysTzh)
    const totalBudgetValue = parseProjectDetailDecimal(row.amount)
    if (adjustedBudgetValue === null || totalBudgetValue === null) return false
    return adjustedBudgetValue.greaterThan(totalBudgetValue)
  }

  const showProjectDetailAdjustedBudgetExceededMessage = () => {
    ElMessage({
      type: 'warning',
      duration: 1500,
      message: DETAIL_ADJUSTED_BUDGET_EXCEED_MESSAGE
    })
  }

  const validateProjectDetailAdjustedBudget = (
    row: ProjectDetailRow,
    options: {
      resetToZeroOnFail?: boolean
    } = {}
  ) => {
    if (!isProjectDetailAdjustedBudgetExceeded(row)) return true
    showProjectDetailAdjustedBudgetExceededMessage()
    if (options.resetToZeroOnFail) {
      resetProjectDetailAdjustedBudgetToZero(row)
    }
    return false
  }

  const validateProjectDetailRowsAdjustedBudget = (rows: ProjectDetailRow[]) => {
    const invalidRow = rows.find((row) => isProjectDetailAdjustedBudgetExceeded(row))
    if (!invalidRow) return true
    showProjectDetailAdjustedBudgetExceededMessage()
    return false
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

  const getFirstMatchedValue = (row: IObject, aliases: string[]) => {
    for (const alias of aliases) {
      const value = row?.[alias]
      if (value !== undefined && value !== null) return value
    }
    return ''
  }

  const cloneProjectDetailRows = (rows: ProjectDetailRow[]) => rows.map((row) => ({ ...row }))

  const isProjectDetailAdjustAdd = (row: ProjectDetailRow) => row.tzlx === '1'
  const isProjectDetailAdjustCancel = (row: ProjectDetailRow) => row.tzlx === '3'
  const applyProjectDetailAdjustRules = (
    row: ProjectDetailRow,
    options: {
      resetAdjustedBudget?: boolean
      fillAdjustedBudgetWhenEmpty?: boolean
    } = {}
  ) => {
    const { resetAdjustedBudget = false, fillAdjustedBudgetWhenEmpty = false } = options
    if (isProjectDetailAdjustCancel(row)) {
      row.dnysTzh = formatProjectDetailAmount(0, '0.000000')
    } else {
      const formattedAdjustedBudget = formatProjectDetailAmount(row.dnysTzh)
      const shouldSyncAdjustedBudget = resetAdjustedBudget || (fillAdjustedBudgetWhenEmpty && formattedAdjustedBudget === '')
      if (shouldSyncAdjustedBudget) {
        row.dnysTzh = formatProjectDetailAmount(row.dnys)
      } else {
        row.dnysTzh = formattedAdjustedBudget
      }
    }
    row.tzfd = formatProjectDetailAdjustRange(row.dnysTzh, row.dnys)
  }

  const getProjectDetailFieldValue = (row: IObject, aliases: string[]) => {
    return getFirstMatchedValue(row, aliases)
  }

  const normalizeProjectDetailStringField = (row: IObject, aliases: string[]) => {
    return String(getProjectDetailFieldValue(row, aliases) || '')
  }

  const normalizeProjectDetailRow = (row: IObject): ProjectDetailRow => {
    const nextRow = {
      ...row,
      id: normalizeProjectDetailStringField(row, projectDetailFieldAliases.id),
      nd: normalizeProjectDetailStringField(row, projectDetailFieldAliases.nd),
      xmmc: normalizeProjectDetailStringField(row, projectDetailFieldAliases.xmmc),
      xmbm: normalizeProjectDetailStringField(row, projectDetailFieldAliases.xmbm),
      tzlx: normalizeProjectDetailAdjustType(getProjectDetailFieldValue(row, projectDetailFieldAliases.tzlx)),
      xmlxName: normalizeProjectDetailStringField(row, projectDetailFieldAliases.xmlxName),
      yjdwName: normalizeProjectDetailStringField(row, projectDetailFieldAliases.yjdwName),
      ejdwName: normalizeProjectDetailStringField(row, projectDetailFieldAliases.ejdwName),
      xmxzName: normalizeProjectDetailStringField(row, projectDetailFieldAliases.xmxzName),
      jsksnd: normalizeProjectDetailStringField(row, projectDetailFieldAliases.jsksnd),
      jsjsnd: normalizeProjectDetailStringField(row, projectDetailFieldAliases.jsjsnd),
      amount: normalizeProjectDetailStringField(row, projectDetailFieldAliases.amount),
      dnys: normalizeProjectDetailStringField(row, projectDetailFieldAliases.dnys),
      dnysTzh: normalizeProjectDetailStringField(row, projectDetailFieldAliases.dnysTzh),
      tzfd: normalizeProjectDetailStringField(row, projectDetailFieldAliases.tzfd),
      kypfwh: normalizeProjectDetailStringField(row, projectDetailFieldAliases.kypfwh),
      sfyap: normalizeProjectDetailPreArrange(getProjectDetailFieldValue(row, projectDetailFieldAliases.sfyap)),
      xmyxjName: normalizeProjectDetailStringField(row, projectDetailFieldAliases.xmyxjName),
      remark: normalizeProjectDetailStringField(row, projectDetailFieldAliases.remark)
    } as ProjectDetailRow
    projectDetailAllAmountFields.forEach((field) => {
      nextRow[field] = formatProjectDetailAmount(nextRow[field])
    })
    applyProjectDetailAdjustRules(nextRow, { fillAdjustedBudgetWhenEmpty: true })
    return nextRow
  }

  const serializeProjectDetailRow = (row: ProjectDetailRow): IObject => {
    const normalizedRow = normalizeProjectDetailRow(row)
    return {
      ...normalizedRow,
      // 后端兼容别名
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
      isYap: normalizedRow.sfyap,
      bz: normalizedRow.remark
    }
  }

  const syncProjectDetailPagination = (total = projectDetailSourceData.value.length) => {
    projectDetailPage.total = total
    projectDetailPage.current = projectDetailPage.page
  }

  const resetProjectDetailState = () => {
    projectDetailSourceData.value = []
    projectDetailSnapshot.value = []
    projectDetailEditEnabled.value = isShowBtn.value
    projectDetailLoaded.value = false
    projectDetailPage.page = 1
    projectDetailPage.current = 1
    projectDetailPage.limit = projectDetailDefaultPageSize
    syncProjectDetailPagination()
  }

  const resetSummaryState = () => {
    projectAdjustSummaryData.value = []
    summaryLoaded.value = false
    summaryGridOptions.data = []
    summaryGridOptions.columns = [...defaultSummaryColumns.value]
  }

  const projectDetailComparablePayload = (rows: ProjectDetailRow[]) =>
    JSON.stringify(
      rows.map((row) => ({
        id: row.id,
        nd: row.nd,
        xmmc: row.xmmc,
        xmbm: row.xmbm,
        tzlx: row.tzlx,
        xmlxName: row.xmlxName,
        yjdwName: row.yjdwName,
        xmxzName: row.xmxzName,
        jsksnd: row.jsksnd,
        jsjsnd: row.jsjsnd,
        amount: row.amount,
        dnys: row.dnys,
        dnysTzh: row.dnysTzh,
        kypfwh: row.kypfwh,
        sfyap: row.sfyap,
        remark: row.remark
      }))
    )

  const buildProjectDetailSnapshotKey = (row: ProjectDetailRow, index: number) => {
    return row.id ? `id:${row.id}` : `index:${index}`
  }

  const getProjectDetailChangedRows = () => {
    const snapshotMap = new Map(
      projectDetailSnapshot.value.map((row, index) => [buildProjectDetailSnapshotKey(row, index), projectDetailComparablePayload([row])])
    )
    return projectDetailSourceData.value.filter((row, index) => {
      return projectDetailComparablePayload([row]) !== snapshotMap.get(buildProjectDetailSnapshotKey(row, index))
    })
  }

  const projectDetailHasChanges = computed(() => {
    return projectDetailComparablePayload(projectDetailSourceData.value) !== projectDetailComparablePayload(projectDetailSnapshot.value)
  })

  const projectDetailVisibleData = computed(() => {
    return projectDetailSourceData.value
  })

  const isProjectDetailAdjustedBudgetDisabled = (row: ProjectDetailRow) => {
    return !projectDetailEditEnabled.value || isProjectDetailAdjustCancel(row)
  }

  const isProjectDetailPreArrangeDisabled = (row: ProjectDetailRow) => {
    return !projectDetailEditEnabled.value || !isProjectDetailAdjustAdd(row)
  }

  const canEditProjectDetailCell = (row: ProjectDetailRow, field?: string) => {
    if (!isShowBtn.value || !projectDetailEditEnabled.value || !field) return false
    if (!projectDetailEditableFields.has(field)) return false
    if (field === 'dnysTzh') return !isProjectDetailAdjustedBudgetDisabled(row)
    if (field === 'sfyap') return !isProjectDetailPreArrangeDisabled(row)
    return true
  }

  const projectDetailCellStyle = ({ row, column }: { row: ProjectDetailRow; column: any }) => {
    if (canEditProjectDetailCell(row, column?.field)) {
      return {
        backgroundColor: EDITABLE_CELL_BACKGROUND,
        color: EDITABLE_CELL_FONT
      }
    }
  }

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
    columns: [
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
        formatter: summaryAmountFormatter
      },
      {
        field: 'currentBudget',
        width: 180,
        title: '当年预算合计',
        align: 'right',
        formatter: summaryAmountFormatter
      },
      {
        field: 'adjustedCurrentBudget',
        width: 220,
        title: '当年预算（调整后）合计',
        align: 'right',
        formatter: summaryAmountFormatter
      },
      {
        field: 'adjustAmount',
        width: 180,
        title: '调整差额',
        align: 'right',
        formatter: summaryAmountFormatter
      }
    ]
  })

  const projectDetailSelectedRows = ref<ProjectDetailRow[]>([])

  const handleProjectDetailSelectChange = () => {
    const selectRecords = projectDetailGridRef.value?.getCheckboxRecords?.() || []
    projectDetailSelectedRows.value = selectRecords as ProjectDetailRow[]
  }

  const projectDetailGridOptions = reactive<VxeGridProps<ProjectDetailRow>>({
    border: true,
    keepSource: true,
    columnConfig: {
      resizable: true
    },
    cellStyle: projectDetailCellStyle,
    editConfig: {
      trigger: 'click',
      mode: 'cell',
      enabled: true,
      showStatus: true,
      beforeEditMethod: ({ row, column }: { row: ProjectDetailRow; column: any }) => {
        return canEditProjectDetailCell(row, column?.field)
      }
    },
    checkboxConfig: {
      reserve: true,
      highlight: true,
      range: true,
      trigger: 'row'
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
        type: 'checkbox',
        width: 60
      },
      {
        type: 'seq',
        width: 70,
        title: '序号'
      },
      {
        field: 'nd',
        title: '年度',
        width: 60
      },
      {
        field: 'tzlx',
        title: '调整类型',
        width: 110,
        align: 'center',
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
        width: 115
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
        formatter: summaryAmountFormatter
      },
      {
        field: 'dnys',
        title: '当年预算（不含税）（万元）',
        width: 160,
        headerAlign: 'center',
        align: 'right',
        formatter: summaryAmountFormatter
      },
      {
        field: 'dnysTzh',
        title: '当年预算（调整后）',
        width: 190,
        headerAlign: 'center',
        align: 'right',
        formatter: summaryAmountFormatter,
        editRender: detailEditRender,
        slots: { edit: 'dnysTzh_edit' }
      },
      {
        field: 'tzfd',
        title: '调整幅度',
        width: 160,
        headerAlign: 'center',
        align: 'right',
        formatter: summaryAmountFormatter
      },
      {
        field: 'kypfwh',
        title: '可研批复文号',
        width: 220
      },
      {
        field: 'sfyap',
        title: '是否预安排',
        width: 140,
        formatter: ({ cellValue }: { cellValue: string }) => formatProjectDetailPreArrangeLabel(cellValue),
        editRender: detailSelectEditRender,
        slots: { edit: 'sfyap_edit' }
      },
      {
        field: 'xmyxjName',
        title: '项目优先级',
        width: 140
      }
    ]
  })
  defaultSummaryColumns.value = [...((summaryGridOptions.columns || []) as any[])]

  const normalizeReadonlyColumns = (columns: any[]) => {
    return columns.map((column) => {
      const nextColumn = { ...column }
      if (String(nextColumn.field || '') === 'tzlx') {
        nextColumn.formatter = ({ cellValue }: { cellValue: string }) => formatProjectDetailAdjustTypeLabel(cellValue)
      }
      if (String(nextColumn.field || '') === 'sfyap') {
        nextColumn.formatter = ({ cellValue }: { cellValue: string }) => formatProjectDetailPreArrangeLabel(cellValue)
      }
      delete nextColumn.editRender
      if (nextColumn.slots?.edit && Object.keys(nextColumn.slots).length === 1) {
        delete nextColumn.slots
      }
      return nextColumn
    })
  }

  const loadSummaryData = async (force = false) => {
    if (!parameter.value?.id || (summaryLoaded.value && !force)) return
    const versionId = parameter.value.id
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
    if (!parameter.value?.id || (projectDetailLoaded.value && !force)) return
    const res = await getDetailDataList({
      versionId: parameter.value.id,
      page: projectDetailPage.page,
      limit: projectDetailPage.limit
    })
    if (!res.success) throw new Error(res.msg)

    const records = getListRecords(res.data)
    const normalizedRows = records.map((row) => normalizeProjectDetailRow(row))
    projectDetailSourceData.value = normalizedRows
    projectDetailSnapshot.value = cloneProjectDetailRows(normalizedRows)
    projectDetailEditEnabled.value = isShowBtn.value
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

  const refreshProjectDetailRelatedData = async (options: { reloadDetail?: boolean } = {}) => {
    const { reloadDetail = false } = options
    const refreshTasks: Promise<unknown>[] = [loadMaintainGridData(maintainSearchForm.dataType), loadSummaryData(true)]
    if (reloadDetail) {
      refreshTasks.push(loadProjectDetailData(true))
    }
    await Promise.all(refreshTasks)
  }

  const parseMaintainDecimalValue = (value: unknown) => {
    if (value === undefined || value === null || value === '') return null
    const normalizedValue = String(value).trim()
    if (!normalizedValue || normalizedValue === '-') return null
    try {
      return new Decimal(normalizedValue)
    } catch {
      return null
    }
  }

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
    currentData.forEach((row: TargetBudgetMaintainRowVo) => {
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

  const recalculateMaintainRangeRow = (row: TargetBudgetMaintainRowVo, changeField?: string) => {
    const dataTypeKind = getMaintainRowDataTypeKind(row)
    if (!dataTypeKind) return changeField ? [changeField] : []

    const rowGroup = getMaintainRowGroups().get(getMaintainRowGroupKey(row))
    const beforeRow = rowGroup?.before
    const afterRow = rowGroup?.after
    const rangeRow = rowGroup?.range
    const fieldsToCalculate: string[] = changeField ? [changeField] : getEditableFields()

    if (!beforeRow || !afterRow || !rangeRow) return fieldsToCalculate

    fieldsToCalculate.forEach((field: string) => {
      const beforeValue = parseMaintainDecimalValue(beforeRow[field])
      const afterValue = parseMaintainDecimalValue(afterRow[field])
      rangeRow[field] = beforeValue !== null && afterValue !== null ? afterValue.minus(beforeValue).toNumber() : ''
    })

    return fieldsToCalculate
  }

  const recalculateAllMaintainRangeRows = () => {
    getMaintainRowGroups().forEach((rowGroup) => {
      if (!rowGroup.before || !rowGroup.after || !rowGroup.range) return
      getEditableFields().forEach((field: string) => {
        const beforeValue = parseMaintainDecimalValue(rowGroup.before?.[field])
        const afterValue = parseMaintainDecimalValue(rowGroup.after?.[field])
        rowGroup.range![field] = beforeValue !== null && afterValue !== null ? afterValue.minus(beforeValue).toNumber() : ''
      })
    })
  }

  const recalculateSummary = (changeFields?: string | string[]) => {
    const data = gridOptions.data || []
    if (data.length === 0) return

    const fieldsToCalculate = Array.from(
      new Set((Array.isArray(changeFields) ? changeFields : changeFields ? [changeFields] : getEditableFields()).filter(Boolean))
    )
    if (fieldsToCalculate.length === 0) return

    const summaryRowsByType: Partial<Record<MaintainDataTypeKind, TargetBudgetMaintainRowVo>> = {}
    const detailRowsByType: Record<MaintainDataTypeKind, TargetBudgetMaintainRowVo[]> = {
      before: [],
      after: [],
      range: []
    }

    data.forEach((row: TargetBudgetMaintainRowVo) => {
      const dataTypeKind = getMaintainRowDataTypeKind(row)
      if (!dataTypeKind) return
      if (isSummaryRow(row)) {
        summaryRowsByType[dataTypeKind] = row
        return
      }
      detailRowsByType[dataTypeKind].push(row)
    })
    ;(['before', 'after', 'range'] as MaintainDataTypeKind[]).forEach((dataTypeKind) => {
      const summaryRow = summaryRowsByType[dataTypeKind]
      if (!summaryRow) return

      fieldsToCalculate.forEach((field: string) => {
        let sum = new Decimal('0')
        let hasNumericValue = false
        detailRowsByType[dataTypeKind].forEach((row: TargetBudgetMaintainRowVo) => {
          const fieldValue = parseMaintainDecimalValue(row[field])
          if (fieldValue === null) return
          hasNumericValue = true
          sum = sum.plus(fieldValue)
        })
        summaryRow[field] = hasNumericValue ? sum.toNumber() : ''
      })
    })
  }

  const syncMaintainDerivedData = (row?: TargetBudgetMaintainRowVo, changeField?: string) => {
    if (row) {
      recalculateSummary(recalculateMaintainRangeRow(row, changeField))
      return
    }
    recalculateAllMaintainRangeRows()
    recalculateSummary()
  }

  const editClosedHandle = ({ row, column }: { row: TargetBudgetMaintainRowVo; column: any }) => {
    syncMaintainDerivedData(row, column?.field)
  }

  const gridEvent = reactive<VxeGridListeners<TargetBudgetMaintainRowVo>>({
    editClosed: editClosedHandle
  })

  const modalLoadToken = ref(0)

  const createModalLoadToken = () => {
    modalLoadToken.value += 1
    return modalLoadToken.value
  }

  const isActiveModalLoad = (requestToken?: number) => {
    return requestToken === undefined || requestToken === modalLoadToken.value
  }

  const clearMaintainGridState = () => {
    tableData.value = []
    gridOptions.data = []
    gridOptions.columns = []
    disEditableFields.value = []
    maintainColorFields.value = []
  }

  const resetMaintainDataTypes = () => {
    maintainSearchForm.dataType = getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
  }

  const getSelectedMaintainDataTypes = (dataTypes = maintainSearchForm.dataType) => {
    return dataTypes.length > 0 ? [...dataTypes] : getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
  }

  const getMaintainDataTypeOptions = async (shouldReset = false, requestToken?: number) => {
    try {
      const res = await getPublicData(MAINTAIN_DATA_TYPE_PUBLIC_CODE)
      if (!res.success) throw new Error(res.msg)
      if (!isActiveModalLoad(requestToken)) return
      maintainDataTypeOptions.value = buildMaintainDataTypeOptions(res.data || [])
    } catch (error) {
      if (!isActiveModalLoad(requestToken)) return
      ElMessage({
        type: 'error',
        duration: 1500,
        message: `获取数据项统计失败:${(error as Error).message}`
      })
      maintainDataTypeOptions.value = buildMaintainDataTypeOptions()
    } finally {
      if (shouldReset && isActiveModalLoad(requestToken)) resetMaintainDataTypes()
    }
  }

  const getProjectDetailAdjustmentTypePublicCodes = async (requestToken?: number) => {
    try {
      const res = await getPublicData(PROJECT_DETAIL_ADJUST_TYPE_PUBLIC_CODE)
      if (!res.success) throw new Error(res.msg)
      if (!isActiveModalLoad(requestToken)) return
      projectDetailAdjustmentTypeOptions.value = buildProjectDetailAdjustmentTypeOptions(res.data || [])
    } catch (error) {
      if (!isActiveModalLoad(requestToken)) return
      projectDetailAdjustmentTypeOptions.value = [...defaultProjectDetailAdjustmentTypeOptions]
      ElMessage({
        type: 'error',
        duration: 1500,
        message: `获取调整类型失败:${(error as Error).message}`
      })
    }
  }

  const handleFilterQuery = async () => {
    const requestToken = createModalLoadToken()
    const selectedDataTypes = getSelectedMaintainDataTypes()
    maintainSearchForm.dataType = selectedDataTypes
    loading.value = true
    try {
      await loadMaintainGridData(selectedDataTypes, requestToken)
    } finally {
      if (isActiveModalLoad(requestToken)) loading.value = false
    }
  }

  const handleFilterReset = async () => {
    const requestToken = createModalLoadToken()
    resetMaintainDataTypes()
    loading.value = true
    try {
      await loadMaintainGridData(maintainSearchForm.dataType, requestToken)
    } finally {
      if (isActiveModalLoad(requestToken)) loading.value = false
    }
  }

  // 获取表格数据
  const getDynamicColumnData = async (dataTypes = maintainSearchForm.dataType, requestToken?: number) => {
    try {
      const res = await getDynamicColumn({
        versionId: parameter.value?.id,
        dataType: getSelectedMaintainDataTypes(dataTypes)
      })
      if (!res.success) throw new Error(res.msg)
      if (!isActiveModalLoad(requestToken)) return
      const transformedColumns = transformToVxeColumns(res.data || []) as any[]
      disEditableFields.value = getDiseditableFields(transformedColumns)
      maintainColorFields.value = transformedColumns.filter((column) => hasColorFlag(column)).map((column) => column.field)
      gridOptions.columns = isMaintainEditEnabled.value ? transformedColumns : normalizeReadonlyColumns(transformedColumns)
    } catch (error) {
      if (!isActiveModalLoad(requestToken)) return
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
    }
  }

  // 获取表格数据
  const getTargetBudgetMaintainData = async (dataTypes = maintainSearchForm.dataType, requestToken?: number) => {
    try {
      const id = parameter.value?.id || ''
      const res = await getVersionDetail({
        versionId: id,
        dataType: getSelectedMaintainDataTypes(dataTypes)
      })
      if (!res.success) throw new Error(res.msg)
      if (!isActiveModalLoad(requestToken)) return []
      tableData.value = res.data || []
      gridOptions.data = tableData.value
    } catch (error) {
      if (!isActiveModalLoad(requestToken)) return []
      ElMessage({
        type: 'error',
        duration: 1500,
        message: (error as Error).message
      })
      return []
    }
  }

  const loadMaintainGridData = async (dataTypes = maintainSearchForm.dataType, requestToken?: number) => {
    await Promise.all([getDynamicColumnData(dataTypes, requestToken), getTargetBudgetMaintainData(dataTypes, requestToken)])
    if (!isActiveModalLoad(requestToken)) return
    syncMaintainDerivedData()
  }

  const initializeMaintainModal = async (requestToken: number) => {
    try {
      const currentParameter = parameter.value
      if (!currentParameter) return

      const workflowValidatePromise =
        currentParameter.operationFlag === 'VIEW'
          ? Promise.resolve(Boolean(currentParameter.isChangeData))
          : validateWorkflowMessage(currentParameter.id || '')

      await Promise.all([getMaintainDataTypeOptions(true, requestToken), getProjectDetailAdjustmentTypePublicCodes(requestToken)])
      if (!isActiveModalLoad(requestToken)) return

      const [, workflowValidateResult] = await Promise.all([loadMaintainGridData(undefined, requestToken), workflowValidatePromise])
      if (currentParameter.operationFlag !== 'VIEW' && parameter.value && isActiveModalLoad(requestToken)) {
        parameter.value.isChangeData = workflowValidateResult
      }
    } finally {
      if (isActiveModalLoad(requestToken)) loading.value = false
    }
  }

  const validateAdjustRemarkForSave = () => {
    if (getMaintainRemarkValue(parameter.value).trim()) return true
    ElMessage({
      type: 'warning',
      duration: 1500,
      message: ADJUST_REMARK_REQUIRED_MESSAGE
    })
    return false
  }

  const getCurrentMaintainRemark = () => {
    return getMaintainRemarkValue(parameter.value).trim()
  }

  const syncMaintainRemark = async () => {
    if (!parameter.value || !hasRemarkChanged.value) return false
    const tzsm = getCurrentMaintainRemark()
    if (tzsm.length > 500) {
      throw new Error('调整说明不能超过500字!')
    }

    const res = await provinceTargetCreateOrEdit({
      id: parameter.value.id,
      versionName: parameter.value.versionName,
      bmName: parameter.value.bmName,
      gkbmId: parameter.value.gkbmId,
      nd: parameter.value.nd,
      tzsm
    })
    if (!res.success) throw new Error(res.msg)
    parameter.value.tzsm = tzsm
    originalRemark.value = tzsm
    return true
  }

  const getCurrentVersionId = () => parameter.value?.id || ''

  const refreshSubmitState = async (showMessage = false) => {
    const currentParameter = parameter.value
    if (!currentParameter) return false
    if (currentParameter.operationFlag === 'VIEW') return Boolean(currentParameter.isChangeData)
    const canSubmit = await validateWorkflowMessage(currentParameter.id || '', showMessage)
    if (parameter.value) parameter.value.isChangeData = canSubmit
    return canSubmit
  }

  const handleSummaryExportData = async () => {
    const versionId = getCurrentVersionId()
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
    const versionId = getCurrentVersionId()
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
          bmId: currentUserRole.value.bmId,
          dwId: currentUserRole.value.dwId,
          roleCode: currentUserRole.value.roleCode,
          roleId: currentUserRole.value.roleId,
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

  const handleProjectDetailEdit = async () => {
    projectDetailEditEnabled.value = true
    await nextTick()
    projectDetailGridRef.value?.recalculate?.()
  }

  const resetProjectDetailEditState = async (enabled = isShowBtn.value) => {
    projectDetailSelectedRows.value = []
    projectDetailEditEnabled.value = enabled
    await nextTick()
    projectDetailGridRef.value?.clearActived?.()
    projectDetailGridRef.value?.clearCheckboxRow?.()
    projectDetailGridRef.value?.clearCheckboxReserve?.()
    projectDetailGridRef.value?.recalculate?.()
  }

  const handleProjectDetailCancelEdit = async () => {
    if (!projectDetailEditEnabled.value) return

    if (projectDetailHasChanges.value) {
      const type = await VXETable.modal.confirm('取消编辑后未保存的修改将丢失,是否继续?', '提示', {
        status: 'warning',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
    }

    projectDetailSourceData.value = cloneProjectDetailRows(projectDetailSnapshot.value)
    await resetProjectDetailEditState(false)
  }

  const handleProjectDetailAddConfirm = async () => {
    projectDetailSelectedRows.value = []
    projectDetailPage.page = 1
    projectDetailPage.current = 1
    loading.value = true
    try {
      await refreshProjectDetailRelatedData({ reloadDetail: true })
      await refreshSubmitState()
      await nextTick()
      projectDetailGridRef.value?.clearActived?.()
      projectDetailGridRef.value?.clearCheckboxRow?.()
      projectDetailGridRef.value?.clearCheckboxReserve?.()
      projectDetailGridRef.value?.recalculate?.()
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

  const handleProjectDetailImport = async () => {
    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: parameter.value?.nd || ''
    })
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: '省公司在进行目标下达调整时,不允许进行导入!'
      })
      return
    }

    const versionId = parameter.value?.id || ''
    importRef.value?.acceptParams({
      title: '项目明细清单',
      tempApi: () => getDetailImportTemplate(versionId),
      importTip: DETAIL_IMPORT_TIP,
      importApi: (importParams: any) =>
        importDetailData({
          versionId,
          excelFormData: importParams.excelFormData
        }),
      getTableList: async () => {
        await refreshProjectDetailRelatedData({ reloadDetail: true })
        await refreshSubmitState()
      },
      specialorgid: currentUserRole.value.bmId
    })
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

  const handleProjectDetailAmountInput = (row: ProjectDetailRow, field: ProjectDetailAmountEditableField) => {
    if (field !== 'dnysTzh') return
    if (!validateProjectDetailAdjustedBudget(row, { resetToZeroOnFail: true })) return
    row.tzfd = formatProjectDetailAdjustRange(row.dnysTzh, row.dnys)
  }

  const handleProjectDetailAmountBlur = (row: ProjectDetailRow, field: ProjectDetailAmountEditableField) => {
    row[field] = formatProjectDetailAmount(row[field])
    if (field === 'dnysTzh' && !validateProjectDetailAdjustedBudget(row, { resetToZeroOnFail: true })) return
    applyProjectDetailAdjustRules(row)
  }

  const handleProjectDetailAdjustTypeChange = async (row: ProjectDetailRow, value?: ProjectDetailRow['tzlx']) => {
    if (value !== undefined) {
      row.tzlx = normalizeProjectDetailAdjustType(value)
    }
    applyProjectDetailAdjustRules(row, { resetAdjustedBudget: row.tzlx === '1' || row.tzlx === '2' })
    await nextTick()
    projectDetailGridRef.value?.clearActived?.()
    projectDetailGridRef.value?.recalculate?.()
  }

  const handleProjectDetailSave = async () => {
    if (!projectDetailHasChanges.value) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: DETAIL_VALIDATE_SAVE_MESSAGE
      })
      return
    }

    if (!validateProjectDetailRowsAdjustedBudget(getProjectDetailChangedRows())) return

    const type = await VXETable.modal.confirm('确认是否保存项目明细清单?', '提示', {
      status: 'question',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return

    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: parameter.value?.nd || ''
    })
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: '省公司在进行目标下达调整时,不允许进行保存!'
      })
      return
    }

    const changedRows = getProjectDetailChangedRows().map((row) => serializeProjectDetailRow(row))
    loading.value = true
    try {
      const res = await updateDetailData(changedRows)
      if (!res.success) throw new Error(res.msg)
      await refreshProjectDetailRelatedData({ reloadDetail: true })
      await resetProjectDetailEditState()
      await refreshSubmitState()
      ElMessage({
        type: 'success',
        duration: 1500,
        message: DETAIL_SAVE_SUCCESS
      })
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

  const handleProjectDetailDelete = async () => {
    const selectedRows = projectDetailSelectedRows.value || []
    if (selectedRows.length === 0) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: '请至少选择一条数据进行删除!'
      })
      return
    }

    const type = await VXETable.modal.confirm(`确认是否删除选中的 ${selectedRows.length} 条数据?`, '提示', {
      status: 'warning',
      confirmButtonText: '是',
      cancelButtonText: '否'
    })
    if (type !== 'confirm') return

    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: parameter.value?.nd || ''
    })
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: '省公司在进行目标下达调整时,不允许进行删除!'
      })
      return
    }

    const ids = selectedRows.map((row) => row.id).filter((id) => id && String(id).trim())

    if (!ids) {
      ElMessage({
        type: 'warning',
        duration: 1500,
        message: '选中的数据缺少有效ID,无法删除!'
      })
      return
    }

    loading.value = true
    try {
      const res = await deleteDetailData(ids)
      if (!res.success) throw new Error(res.msg)
      projectDetailSelectedRows.value = []
      // 重置分页到第1页，默认20条
      projectDetailPage.page = 1
      projectDetailPage.current = 1
      projectDetailPage.limit = projectDetailDefaultPageSize
      await refreshProjectDetailRelatedData({ reloadDetail: true })
      await refreshSubmitState()
      await nextTick()
      projectDetailGridRef.value?.clearActived?.()
      projectDetailGridRef.value?.clearCheckboxRow?.()
      projectDetailGridRef.value?.clearCheckboxReserve?.()
      ElMessage({
        type: 'success',
        duration: 1500,
        message: '删除成功!'
      })
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

  const handleTabChange = () => {
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

  // 导出数据
  const handleExportData = async () => {
    loading.value = true
    try {
      await apiExportHandle(
        {
          versionId: getCurrentVersionId(),
          dataType: getMaintainDefaultDataTypes(maintainDataTypeOptions.value)
        },
        '目标值导出',
        (params: { versionId: string; dataType: string }) => exportData(params)
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

  // 导入数据
  const handleImportData = async () => {
    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: parameter.value?.nd || ''
    })
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: '省公司在进行目标下达调整时,不允许进行导入!'
      })
      return
    }
    const params = {
      title: '目标值',
      tempApi: () =>
        getImportTemplate({
          versionId: parameter.value?.id
        }),
      importApi: (importParams: any) => {
        const newImportParams = {
          versionId: parameter.value?.id,
          excelFormData: importParams.excelFormData
        }
        return importData(newImportParams)
      },
      getTableList: async () => {
        await getTargetBudgetMaintainData()
        await refreshSubmitState()
      },
      specialorgid: currentUserRole.value.bmId
    }
    importRef.value?.acceptParams(params)
  }

  // 保存数据
  const handleSaveData = async () => {
    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: parameter.value?.nd || ''
    })
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: '省公司在进行目标下达调整时,不允许进行保存!'
      })
      return
    }
    try {
      // 获取修改数据
      const updateRecords = (gridRef.value?.getUpdateRecords() || []).filter((row) => Number((row as TargetBudgetMaintainRowVo).edit) === 1)
      if (updateRecords.length === 0 && !hasRemarkChanged.value) {
        ElMessage({
          type: 'warning',
          duration: 1500,
          message: VALIDATE_SAVE_MESSAGE
        })
        return
      }
      if (!validateAdjustRemarkForSave()) return
      const type = await VXETable.modal.confirm('确认是否保存?', '提示', {
        status: 'question',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
      loading.value = true
      const tzsm = getCurrentMaintainRemark()
      const remarkChanged = hasRemarkChanged.value
      const versionId = parameter.value?.id || ''
      const res = await saveData({
        versionId,
        saveDatas: updateRecords as IObject[],
        tzsm
      })
      if (!res.success) throw new Error(res.msg)
      if (parameter.value) parameter.value.tzsm = tzsm
      originalRemark.value = tzsm
      ElMessage({
        type: 'success',
        duration: 1500,
        message: SAVE_DATA_SUCCESS
      })
      const requestToken = createModalLoadToken()
      await loadMaintainGridData(undefined, requestToken)
      await refreshSubmitState()
      if (remarkChanged) props.search()
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

  // 提交数据
  const handleSubmitData = async () => {
    const validateResult = await validatePro({
      bmId: currentUserRole.value.bmId,
      dwId: currentUserRole.value.dwId,
      nd: parameter.value?.nd || ''
    })
    if (!validateResult || validateResult['wjhNum'] !== 0) {
      ElMessage({
        type: 'error',
        duration: 1500,
        message: '省公司在进行目标下达调整时,不允许进行提交!'
      })
      return
    }
    try {
      const type = await VXETable.modal.confirm('提交前请确认填写数据已保存,是否确定提交?', '提示', {
        status: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })
      if (type !== 'confirm') return
      loading.value = true
      const remarkChanged = await syncMaintainRemark()
      if (remarkChanged) props.search()
      await submitWorkflowHanlde()
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

  const submitWorkflowHanlde = async () => {
    const wfUserInfo: WFUserInfo = {
      userId: store.getters.getUserMsg.id,
      spOrgId: currentUserRole.value.bmId,
      spRoleId: currentUserRole.value.spRoleId
    }

    wfParam.value.VERSION_ID = parameter.value?.id || ''
    wfParam.value.BMID = parameter.value?.bmId || ''
    wfParam.value.DWID = parameter.value?.dwId || ''
    wfParam.value.BMNAME = parameter.value?.bmName || ''
    wfParam.value.ND = parameter.value?.nd || ''
    wfParam.value.VERSION_NAME = parameter.value?.versionName || ''
    wfParam.value.VERSION_NO = parameter.value?.versionNo || ''

    await submitWorkflow(store.getters.getUserMsg.systemCode, 'SJTC_MBZTZ_SHLC', '', wfUserInfo, wfParam.value, {}, submitWFCallback)
  }

  const submitWFCallback = async (nextPersonAndPath: string, wfData: WFData) => {
    try {
      loading.value = true
      const spform = {
        userId: store.getters.getUserMsg.id,
        spOrgId: currentUserRole.value.bmId,
        spRoleId: currentUserRole.value.spRoleId,
        wfCode: 'SJTC_MBZTZ_SHLC',
        wfData: wfParam.value,
        nextPersonAndPath: nextPersonAndPath
      }
      const res = await submitReview(spform)
      if (!res.success) throw new Error(res.msg)
      ElMessage({
        type: 'success',
        duration: 1500,
        message: '提交成功!'
      })
      handleCloseModal()
      props.search()
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

  // 目标值重置
  const handleTargetValueResetData = async () => {
    try {
      const type = await VXETable.modal.confirm('是否重置数据?', '提示', {
        status: 'warning',
        confirmButtonText: '是',
        cancelButtonText: '否'
      })
      if (type !== 'confirm') return
      loading.value = true
      const versionId = parameter.value?.id || ''
      const res = await targetValueResetData(versionId)
      if (!res.success) throw new Error(res.msg)
      ElMessage({
        type: 'success',
        duration: 1500,
        message: '重置成功!'
      })
      if (parameter.value) parameter.value.isChangeData = true
      const requestToken = createModalLoadToken()
      await loadMaintainGridData(undefined, requestToken)
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

  // 打开目标总控值修改弹窗
  const handleTargetControlAdjustmentOpen = () => {
    if (!parameter.value?.id) {
      ElMessage.warning('无效的版本信息')
      return
    }
    targetControlAdjustmentModalRef.value?.acceptParams(parameter.value.id)
  }

  const handleTargetControlAdjustmentSuccess = async () => {
    const requestToken = createModalLoadToken()
    await loadMaintainGridData(undefined, requestToken)
    await refreshSubmitState()
    props.search()
  }

  // 关闭窗口
  const handleCloseModal = () => {
    createModalLoadToken()
    loading.value = false
    isShowModal.value = false
    activeTab.value = 'maintain'
    clearMaintainGridState()
    resetMaintainDataTypes()
    resetSummaryState()
    resetProjectDetailState()
  }

  // 接收父组件参数
  const acceptParams = (params: MaintainParams) => {
    const requestToken = createModalLoadToken()
    modalTitle.value = params.operationFlag === 'VIEW' ? '项目类型目标值查看' : '项目类型目标值调整'
    if (gridOptions.editConfig) gridOptions.editConfig.enabled = false
    parameter.value = {
      ...parameter.value,
      ...params,
      tzsm: params.tzsm || ''
    }
    originalRemark.value = getMaintainRemarkValue(parameter.value)
    clearMaintainGridState()
    resetMaintainDataTypes()
    activeTab.value = 'maintain'
    resetSummaryState()
    resetProjectDetailState()
    loading.value = true
    isShowModal.value = true
    void nextTick().then(() => initializeMaintainModal(requestToken))
  }

  return {
    modalTitle,
    modalWidth,
    modalHeight,
    isShowModal,
    activeTab,
    maintainTabs,
    acceptParams,
    parameter,
    loading,
    targetBudgetMaintainRef,
    importRef,
    handleCloseModal,
    handleExportData,
    handleImportData,
    handleSubmitData,
    handleTargetValueResetData,
    handleSaveData,
    adjustRemark,
    maintainSearchForm,
    maintainDataTypeOptions,
    handleFilterQuery,
    handleFilterReset,
    gridOptions,
    gridEvent,
    gridRef,
    summaryGridRef,
    summaryGridOptions,
    projectAdjustSummaryData,
    handleSummaryExportData,
    handleTabChange,
    projectDetailGridRef,
    projectDetailGridOptions,
    projectDetailVisibleData,
    projectDetailPage,
    projectDetailEditEnabled,
    projectDetailHasChanges,
    projectDetailTextFields,
    projectDetailAmountFields,
    projectDetailAdjustmentTypeOptions,
    projectDetailPreArrangeOptions,
    handleProjectDetailEdit,
    handleProjectDetailCancelEdit,
    handleProjectDetailAddConfirm,
    handleProjectDetailSave,
    handleProjectDetailDelete,
    handleProjectDetailExportData,
    handleProjectDetailImport,
    handleProjectDetailPageChange,
    handleProjectDetailLimitChange,
    handleProjectDetailAdjustTypeChange,
    handleProjectDetailAmountInput,
    handleProjectDetailAmountBlur,
    handleProjectDetailSelectChange,
    isProjectDetailAdjustedBudgetDisabled,
    isProjectDetailPreArrangeDisabled,
    isShowBtn,
    isTargetValueMaintain,
    tableData,
    editableColumns,
    isChangeData,
    DECIMAL_DIGITS,
    targetControlAdjustmentModalRef,
    handleTargetControlAdjustmentOpen,
    handleTargetControlAdjustmentSuccess
  }
}
