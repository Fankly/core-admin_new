export type FormatValue = (value: string, digits?: number) => unknown

export interface BudgetExecutionAnalysisColumn {
  field?: string
  title?: string
  children?: BudgetExecutionAnalysisColumn[]
  headerAlign?: string
  align?: string
  fixed?: string
  visible?: boolean
  treeNode?: boolean
  formatter?: ({ cellValue }: { cellValue: unknown }) => unknown
  [key: string]: unknown
}

const EXPORT_TEXT_FIELDS = new Set(['name', 'subName', 'gkbm', 'ysly', 'cnxm', 'cnxmms', 'id', 'parentId'])

export const createLatestRequestTracker = () => {
  let currentToken = 0

  return {
    issue() {
      currentToken += 1
      return currentToken
    },
    isLatest(token: number) {
      return token === currentToken
    }
  }
}

const isEmptyCellValue = (value: unknown) => value === undefined || value === null || value === ''
const FIXED_LEAF_COLUMN_COUNT = 2
const UNFORMATTED_COLUMN_FIELDS = ['subName', 'gkbm', 'ysly', 'cnxm', 'cnxmms']

const resolveDigits = (xsws: string) => {
  const digits = Number(xsws.split('_')[1])
  return Number.isFinite(digits) ? digits : 2
}

const createColumnFormatter = (field: string, xsws: string, formatValue: FormatValue) => {
  return ({ cellValue }: { cellValue: unknown }) => {
    if (isEmptyCellValue(cellValue)) return '-'
    const value = String(cellValue)

    if (field.includes('JYL')) {
      return formatValue(value)
    }

    if (field.includes('WCL')) {
      return formatValue(value, 2)
    }

    return formatValue(value, resolveDigits(xsws))
  }
}

const isVisibleLeafColumn = (column: BudgetExecutionAnalysisColumn) =>
  (!Array.isArray(column.children) || column.children.length === 0) && column.visible !== false

const applyFixedByLeafIndex = (column: BudgetExecutionAnalysisColumn, state: { leafColumnIndex: number }) => {
  delete column.fixed
  if (!isVisibleLeafColumn(column)) return

  state.leafColumnIndex += 1
  if (state.leafColumnIndex <= FIXED_LEAF_COLUMN_COUNT) {
    column.fixed = 'left'
  }
}

const decorateColumn = <T extends BudgetExecutionAnalysisColumn>(
  column: T,
  xsws: string,
  formatValue: FormatValue,
  state: { leafColumnIndex: number }
): T => {
  const decoratedChildren = Array.isArray(column.children)
    ? column.children.map((child) => decorateColumn(child, xsws, formatValue, state))
    : column.children

  const decoratedColumn: BudgetExecutionAnalysisColumn = {
    ...column,
    children: decoratedChildren,
    headerAlign: 'center'
  }

  if (column.field === 'name') {
    decoratedColumn.align = 'left'
    decoratedColumn.treeNode = true
    applyFixedByLeafIndex(decoratedColumn, state)
    return decoratedColumn as T
  }

  if (column.field && UNFORMATTED_COLUMN_FIELDS.includes(column.field)) {
    decoratedColumn.align = column.field === 'subName' ? 'left' : 'center'
    applyFixedByLeafIndex(decoratedColumn, state)
    return decoratedColumn as T
  }

  if (column.field) {
    decoratedColumn.align = 'right'
    decoratedColumn.formatter = createColumnFormatter(column.field, xsws, formatValue)
  }

  applyFixedByLeafIndex(decoratedColumn, state)
  return decoratedColumn as T
}

export const decorateDynamicColumns = <T extends BudgetExecutionAnalysisColumn>(columns: T[], xsws: string, formatValue: FormatValue): T[] => {
  const state = { leafColumnIndex: 0 }
  return columns.map((column) => decorateColumn(column, xsws, formatValue, state))
}

export const getExportLeafColumns = (columns: BudgetExecutionAnalysisColumn[] = []): BudgetExecutionAnalysisColumn[] => {
  return columns.reduce((acc: BudgetExecutionAnalysisColumn[], column) => {
    if (!column) return acc
    if (Array.isArray(column.children) && column.children.length !== 0) {
      acc.push(...getExportLeafColumns(column.children))
    } else {
      acc.push(column)
    }
    return acc
  }, [])
}

const isExportTextField = (field: unknown) => {
  const fieldName = String(field || '')
  if (!fieldName) return true
  if (EXPORT_TEXT_FIELDS.has(fieldName)) return true
  return /(code|id|name|type)$/i.test(fieldName)
}

const parseExportNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const text = value.replace(/,/g, '').trim()
  if (!text || text === '-') return null
  if (!/^-?(?:\d+|\d*\.\d+)$/.test(text)) return null
  const numberValue = Number(text)
  return Number.isFinite(numberValue) ? numberValue : null
}

const getExportNumberFormat = (value: unknown) => {
  const text = String(value ?? '')
    .replace(/,/g, '')
    .trim()
  const decimalPart = text.includes('.') ? text.split('.')[1] : ''
  return decimalPart ? `0.${'0'.repeat(decimalPart.length)}` : '0'
}

export const applyExportNumberCell = (cell: any, rowData: Record<string, unknown>, column?: BudgetExecutionAnalysisColumn) => {
  const field = column?.field
  if (isExportTextField(field)) return

  const exportValue = cell.value
  const sourceValue = field && Object.prototype.hasOwnProperty.call(rowData, field) ? rowData[field] : exportValue
  const sourceNumberValue = parseExportNumber(sourceValue)
  const numberValue = parseExportNumber(exportValue) ?? sourceNumberValue
  if (numberValue === null) return

  cell.value = numberValue
  cell.numFmt = getExportNumberFormat(sourceNumberValue === null ? exportValue : sourceValue)
}
