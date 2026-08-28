import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { VxeGridProps, VxeTableInstance } from 'vxe-table'
import { TargetControlAdjustmentRow, TargetControlAdjustmentModalProps } from '../../types/provinceTarget'
import { getZkzAndDfjData, modifyZkzAndDfjData } from '@/api/targetBudget/provinceTarget'
import { formatValue } from '@/utils/utils'
import Decimal from 'decimal.js'

export const useTargetControlAdjustmentModal = (props: TargetControlAdjustmentModalProps) => {
  const DECIMAL_PLACES = 6
  const DECIMAL_DIGITS = String(DECIMAL_PLACES)
  const EDITABLE_CELL_BACKGROUND = '#338d89'
  const EDITABLE_CELL_FONT = '#fff'

  const isShowModal = ref(false)
  const loading = ref(false)
  const modalTitle = ref('目标总控值调整')
  const modalWidth = ref('88%')
  const modalHeight = ref('820')
  const gridRef = ref<VxeTableInstance>()
  const tableData = ref<TargetControlAdjustmentRow[]>([])
  const versionId = ref('')
  const hasValidationError = ref(false)

  const isSubtotalRow = (row: TargetControlAdjustmentRow) => row.xmdl === ''
  const isTotalRow = (row: TargetControlAdjustmentRow) => row.xmdl === '-1'
  const isDetailRow = (row: TargetControlAdjustmentRow) => !isSubtotalRow(row) && !isTotalRow(row)

  const toDecimal = (value?: string | number | null) => {
    try {
      return new Decimal(value || 0)
    } catch {
      return new Decimal(0)
    }
  }

  const isSameAmount = (left?: string | number | null, right?: string | number | null) => {
    return toDecimal(left).toDecimalPlaces(DECIMAL_PLACES).equals(toDecimal(right).toDecimalPlaces(DECIMAL_PLACES))
  }

  const sumAmount = (rows: TargetControlAdjustmentRow[], field: 'bcxgYsje' | 'bcxgDfj' | 'bcxgDwSum') => {
    return rows.reduce((total, row) => total.plus(toDecimal(row[field])), new Decimal(0)).toFixed(DECIMAL_PLACES)
  }

  const recalculateDetailRow = (row: TargetControlAdjustmentRow) => {
    const adjustedUnitTotal = toDecimal(row.tzqDwSum).plus(toDecimal(row.bcsqDwSum))
    row.bcxgDwSum = adjustedUnitTotal.toFixed(DECIMAL_PLACES)
    row.bcxgDfj = toDecimal(row.bcxgYsje).minus(adjustedUnitTotal).toFixed(DECIMAL_PLACES)
  }

  const updateSummaryRow = (summaryRow: TargetControlAdjustmentRow, detailRows: TargetControlAdjustmentRow[]) => {
    summaryRow.bcxgYsje = sumAmount(detailRows, 'bcxgYsje')
    summaryRow.bcxgDfj = sumAmount(detailRows, 'bcxgDfj')
    summaryRow.bcxgDwSum = sumAmount(detailRows, 'bcxgDwSum')
  }

  const syncDerivedData = () => {
    const allDetailRows: TargetControlAdjustmentRow[] = []
    let currentGroupRows: TargetControlAdjustmentRow[] = []

    tableData.value.forEach((row) => {
      if (isDetailRow(row)) {
        recalculateDetailRow(row)
        currentGroupRows.push(row)
        allDetailRows.push(row)
        return
      }

      if (isSubtotalRow(row)) {
        updateSummaryRow(row, currentGroupRows)
        currentGroupRows = []
      }
    })

    tableData.value.filter(isTotalRow).forEach((row) => updateSummaryRow(row, allDetailRows))
  }

  const handleTargetControlAmountInput = (row: TargetControlAdjustmentRow) => {
    if (!isDetailRow(row)) return
    syncDerivedData()
    refreshValidationState()
  }

  const getSummaryRowName = (row: TargetControlAdjustmentRow) => {
    if (isTotalRow(row)) return '合计'

    const rowIndex = tableData.value.indexOf(row)
    for (let index = rowIndex - 1; index >= 0; index -= 1) {
      const previousRow = tableData.value[index]
      if (!isDetailRow(previousRow)) break
      if (previousRow.xmdlName) return `${previousRow.xmdlName}小计`
    }

    return '小计'
  }

  const getNegativeDetailRows = () => {
    return tableData.value.filter((row) => isDetailRow(row) && toDecimal(row.bcxgDfj).lessThan(0))
  }

  const getInvalidSummaryRowNames = () => {
    return Array.from(
      new Set(
        tableData.value
          .filter((row) => isSubtotalRow(row) || isTotalRow(row))
          .filter((row) => !isSameAmount(row.tzqYsje, row.bcxgYsje))
          .map(getSummaryRowName)
      )
    )
  }

  const refreshValidationState = () => {
    const detailRows = tableData.value.filter(isDetailRow)
    hasValidationError.value = detailRows.length === 0 || getNegativeDetailRows().length > 0 || getInvalidSummaryRowNames().length > 0
  }

  const handleTargetControlAmountBlur = async (row: TargetControlAdjustmentRow) => {
    if (!isDetailRow(row)) return

    syncDerivedData()
    if (toDecimal(row.bcxgDfj).lessThan(0)) {
      const rowName = row.protypeName || row.xmdlName || '当前项目类型'
      ElMessage.warning(`数据校验未通过：项目类型“${rowName}”的调整后待分解金额不得小于0。系统已恢复该行修改前的目标总控值，请重新填写。`)
      await gridRef.value?.revertData(row, 'bcxgYsje')
      syncDerivedData()
      refreshValidationState()
      return
    }

    const invalidSummaryRowNames = getInvalidSummaryRowNames()
    if (invalidSummaryRowNames.length > 0) {
      const invalidSummaryRowText = invalidSummaryRowNames.join('、')
      ElMessage.warning(
        `平衡校验未通过：${invalidSummaryRowText}的调整前目标总控值与调整后目标总控值必须保持一致。请调整相关项目类型的目标总控值，完成平衡后再保存。`
      )
    }
    refreshValidationState()
  }

  const handleSave = async () => {
    const updateRecords = (gridRef.value?.getUpdateRecords() || []).filter(isDetailRow)
    if (updateRecords.length === 0) {
      ElMessage.warning('未检测到数据变更，无需保存。')
      return
    }

    try {
      loading.value = true

      const params = {
        datas: updateRecords.map((row) => ({
          protypeId: row.protypeId,
          ysje: toDecimal(row.bcxgYsje).toFixed(DECIMAL_PLACES)
        })),
        versionId: versionId.value
      }

      const res = await modifyZkzAndDfjData(params)

      if (res.success) {
        ElMessage.success('目标总控值调整数据保存成功。')
        handleCloseModal()
        await props.search()
      } else {
        throw new Error(res.msg || '目标总控值调整数据保存失败。')
      }
    } catch (error) {
      ElMessage.error((error as Error).message || '目标总控值调整数据保存失败。')
    } finally {
      loading.value = false
    }
  }

  const handleCloseModal = () => {
    isShowModal.value = false
    tableData.value = []
    versionId.value = ''
    hasValidationError.value = false
  }

  const cellClassName = ({ row, column }: any) => {
    if (column.field === 'bcxgYsje' && isDetailRow(row)) {
      return 'editable-cell'
    }

    if (isSubtotalRow(row) || isTotalRow(row)) {
      return 'summary-row'
    }

    return ''
  }

  const rowClassName = ({ row }: any) => {
    if (isSubtotalRow(row) || isTotalRow(row)) {
      return 'summary-row'
    }
    return ''
  }

  const cellStyle = ({ row, column }: any) => {
    if (column.field === 'bcxgYsje' && isDetailRow(row)) {
      return {
        backgroundColor: EDITABLE_CELL_BACKGROUND,
        color: EDITABLE_CELL_FONT,
        cursor: 'pointer'
      }
    }
    return null
  }

  const formatXmdlName = (row: TargetControlAdjustmentRow) => {
    if (isSubtotalRow(row)) return '小计'
    if (isTotalRow(row)) return '合计'
    return row.xmdlName
  }

  const gridOptions = reactive<VxeGridProps<TargetControlAdjustmentRow>>({
    border: true,
    height: '100%',
    keepSource: true,
    columnConfig: {
      resizable: true
    },
    headerAlign: 'center',
    align: 'right',
    showOverflow: true,
    showHeaderOverflow: true,
    editConfig: {
      trigger: 'click',
      mode: 'cell',
      showStatus: true,
      beforeEditMethod: ({ row }) => isDetailRow(row)
    },
    rowConfig: {
      height: 32
    },
    cellClassName,
    rowClassName,
    cellStyle,
    columns: [
      {
        field: 'xmdlName',
        title: '项目大类',
        width: 180,
        fixed: 'left',
        align: 'left',
        formatter: ({ row }) => formatXmdlName(row)
      },
      {
        field: 'protypeName',
        title: '项目类型',
        width: 180,
        fixed: 'left',
        align: 'left'
      },
      {
        title: '调整前',
        children: [
          {
            field: 'tzqYsje',
            title: '目标总控值',
            width: 150,
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          },
          {
            field: 'tzqDfj',
            title: '待分解',
            width: 150,
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          },
          {
            field: 'tzqDwSum',
            title: '各单位目标值合计',
            width: 180,
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          }
        ]
      },
      {
        title: '本次申请',
        children: [
          {
            field: 'bcsqYsje',
            title: '目标总控值',
            width: 150,
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          },
          {
            field: 'bcsqDfj',
            title: '待分解',
            width: 150,
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          },
          {
            field: 'bcsqDwSum',
            title: '各单位目标值合计',
            width: 180,
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          }
        ]
      },
      {
        title: '调整后',
        children: [
          {
            field: 'bcxgYsje',
            title: '目标总控值',
            width: 150,
            editRender: {
              name: 'input'
            },
            slots: { edit: 'bcxgYsje_edit' },
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          },
          {
            field: 'bcxgDfj',
            title: '待分解',
            width: 150,
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          },
          {
            field: 'bcxgDwSum',
            title: '各单位目标值合计',
            width: 180,
            formatter: ({ cellValue }) => formatValue(cellValue, DECIMAL_PLACES)
          }
        ]
      }
    ]
  })

  const acceptParams = async (id: string) => {
    versionId.value = id
    isShowModal.value = true
    loading.value = true

    try {
      const res = await getZkzAndDfjData(id)

      if (res.success && Array.isArray(res.data)) {
        tableData.value = res.data.map((item) => ({
          xmdl: String(item.xmdl ?? ''),
          xmdlName: String(item.xmdlName ?? ''),
          protypeId: String(item.protypeId ?? ''),
          protypeName: String(item.protypeName ?? ''),
          tzqYsje: String(item.tzqYsje ?? '0'),
          tzqDfj: String(item.tzqDfj ?? '0'),
          tzqDwSum: String(item.tzqDwSum ?? '0'),
          bcsqDfj: String(item.bcsqDfj ?? '0'),
          bcsqYsje: String(item.bcsqYsje ?? '0'),
          bcsqDwSum: String(item.bcsqDwSum ?? '0'),
          bcxgDfj: String(item.bcxgDfj ?? '0'),
          bcxgYsje: String(item.bcxgYsje ?? item.tzqYsje ?? '0'),
          bcxgDwSum: String(item.bcxgDwSum ?? '0')
        }))
        syncDerivedData()
        refreshValidationState()
      } else {
        throw new Error(res.msg || '目标总控值调整数据加载失败。')
      }
    } catch (error) {
      ElMessage.error((error as Error).message || '目标总控值调整数据加载失败。')
      isShowModal.value = false
    } finally {
      loading.value = false
    }
  }

  return {
    isShowModal,
    loading,
    hasValidationError,
    modalTitle,
    modalWidth,
    modalHeight,
    gridRef,
    tableData,
    gridOptions,
    handleSave,
    handleTargetControlAmountInput,
    handleTargetControlAmountBlur,
    handleCloseModal,
    acceptParams,
    DECIMAL_DIGITS
  }
}
