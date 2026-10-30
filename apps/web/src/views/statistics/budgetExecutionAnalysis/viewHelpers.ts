import { BudgetExecutionFormulaContext, getIndicatorCellFormula, getIndicatorCodeByField } from './indicatorFormula'

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

export const parseExportNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const text = value.replace(/,/g, '').trim()
  if (!text || text === '-') return null
  if (!/^-?(?:\d+|\d*\.\d+)$/.test(text)) return null
  const numberValue = Number(text)
  return Number.isFinite(numberValue) ? numberValue : null
}

// 数字形式的名称、编码等文本字段不参与列宽适配；百分比文本仍属于数字内容。
export const isNumericColumnValue = (column: BudgetExecutionAnalysisColumn, value: unknown) => {
  if (isExportTextField(column.field)) return false
  const numberValue = typeof value === 'string' ? value.trim().replace(/%$/, '') : value
  return parseExportNumber(numberValue) !== null
}

// 分母为 0 时页面输出“-”，与导出公式 IFERROR(...,"-") 的口径保持一致。
// 只在当前行确实返回了分母字段时处理；分母列未查询时保留接口值，避免把合法的 0 误判为缺失。
export const applyZeroDenominatorPlaceholders = <T extends Record<string, any>>(rows: T[] = [], context?: BudgetExecutionFormulaContext): T[] => {
  if (!context) return rows
  const visit = (row: Record<string, any>) => {
    Object.keys(row).forEach((field) => {
      const code = getIndicatorCodeByField(field)
      if (!code) return
      const formula = getIndicatorCellFormula(field, context)
      if (!formula || formula.kind !== 'ratio') return
      const denominatorField = `${field.slice(0, -code.length)}${formula.refs[1]}`
      if (!Object.prototype.hasOwnProperty.call(row, denominatorField)) return
      if (parseExportNumber(row[denominatorField]) !== 0) return
      row[field] = '-'
    })
    if (Array.isArray(row.children)) row.children.forEach((child) => visit(child))
  }
  rows.forEach((row) => {
    if (row && typeof row === 'object') visit(row)
  })
  return rows
}

// 后端下发的列宽仅供参考，此处整体剔除 width/minWidth，改由前端按表头与数据测量。
// 保留其余属性；分组列的宽度由子列决定，一并清除避免残留旧值。
export const stripColumnWidths = <T extends BudgetExecutionAnalysisColumn>(columns: T[] = []): T[] => {
  return columns.map((column) => {
    // 后端接口把 width 声明为必填，这里用宽松类型删除，避免 TS 的 delete 可选属性限制。
    const stripped: Record<string, unknown> = { ...column }
    delete stripped.width
    delete stripped.minWidth
    if (Array.isArray(column.children) && column.children.length !== 0) {
      stripped.children = stripColumnWidths(column.children)
    }
    return stripped as T
  })
}

export interface FitColumnWidthsOptions {
  // 为 true 时文本列也按当前数据测量（配合 stripColumnWidths 使用），避免无宽度列被 VXE 压缩到 40px。
  fitTextColumns?: boolean
}

// 文本列按最长内容测量，超出该宽度由 showOverflow 省略号截断。
const MAX_TEXT_COLUMN_WIDTH = 320
// 树形列需要为展开图标和一级缩进留出固定空间。
const TREE_COLUMN_EXTRA_WIDTH = 40

// 仅在根查询返回后调用。返回新的列配置供 VXE 加载，展开和懒加载不重新测量。
export const fitNumericColumnWidths = <T extends BudgetExecutionAnalysisColumn>(
  columns: T[] = [],
  rows: Record<string, unknown>[] = [],
  tableElement?: HTMLElement,
  { fitTextColumns = false }: FitColumnWidthsOptions = {}
): T[] => {
  // VXE 的字体设在内部 table 上，grid 容器继承的字体可能与数字单元格不同。
  const fontElement = tableElement?.querySelector('.vxe-table--render-default') || tableElement
  const style = fontElement ? getComputedStyle(fontElement) : undefined
  const probe = typeof document === 'undefined' ? null : document.createElement('span')
  if (probe) {
    Object.assign(probe.style, {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'nowrap',
      left: '-100000px',
      fontFamily: style?.fontFamily || 'Arial, sans-serif',
      // Canvas 不支持 tabular-nums，使用离屏文本保留 VXE 的等宽数字特性。
      fontVariantNumeric: style?.fontVariantNumeric || 'tabular-nums'
    })
    document.body.appendChild(probe)
  }
  const measurements = new Map<string, number>()
  // 参与分组表头补宽的可调列：默认只有数字列，fitTextColumns 时全部已测量列。
  const fittedColumns = new Set<BudgetExecutionAnalysisColumn>()
  const visibleLeaves = (list: BudgetExecutionAnalysisColumn[]): BudgetExecutionAnalysisColumn[] =>
    list.flatMap((column) => (column.visible === false ? [] : column.children?.length ? visibleLeaves(column.children) : [column]))
  const measure = (text: string, bold: boolean, header = false) => {
    const fontSize = header ? '14px' : style?.fontSize || '14px'
    const key = `${fontSize}:${bold}:${text}`
    if (!measurements.has(key)) {
      let width = Array.from(text).reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? 14 : bold ? 9 : 8), 0)
      if (probe) {
        probe.style.fontSize = fontSize
        probe.style.fontWeight = bold ? '700' : '400'
        probe.textContent = text
        width = probe.getBoundingClientRect().width
      }
      measurements.set(key, Math.ceil(width + 24))
    }
    return measurements.get(key)!
  }
  const fitColumn = (column: BudgetExecutionAnalysisColumn): BudgetExecutionAnalysisColumn => {
    if (column.visible === false) return column
    if (column.children?.length) {
      const children = column.children.map(fitColumn)
      const leaves = visibleLeaves(children)
      const adjustable = leaves.filter((child) => fittedColumns.has(child))
      const totalWidth = leaves.reduce((sum, child) => sum + (Number(child.width) || 96), 0)
      const extraWidth = measure(String(column.title || ''), true, true) - totalWidth
      if (extraWidth > 0 && adjustable.length) {
        adjustable.forEach((child) => {
          child.width = Number(child.width) + Math.ceil(extraWidth / adjustable.length)
        })
      }
      return { ...column, children }
    }
    if (!column.field) return column
    let contentWidth = 0
    let hasNumericValue = false
    rows.forEach((row) => {
      const cellValue = row[column.field!]
      const numeric = isNumericColumnValue(column, cellValue)
      if (numeric) hasNumericValue = true
      // 文本列仅在 fitTextColumns 时测量；数字列维持原有口径。
      else if (!fitTextColumns || isEmptyCellValue(cellValue)) return
      const displayText = String(column.formatter ? column.formatter({ cellValue }) : cellValue).trim()
      if (!displayText) return
      const bold = row.sfjc === 1 || row.sfjc === '1'
      contentWidth = Math.max(contentWidth, measure(displayText, bold))
    })
    const headerWidth = measure(String(column.title || ''), true, true)
    // 树形列额外预留展开图标与一级缩进，避免名称被图标挤掉。
    const contentWithNode = contentWidth + (column.treeNode ? TREE_COLUMN_EXTRA_WIDTH : 0)
    // 与单元格左右内边距及边框留白匹配；没有内容时数字列保持原样，
    // 文本列（已剔除后端列宽）按表头兜底，避免落回 VXE 的 40px 自适应宽度。
    if (!contentWidth) {
      return fitTextColumns ? { ...column, width: Math.max(96, headerWidth) } : column
    }
    const fittedWidth = Math.max(96, contentWithNode, headerWidth)
    const fitted = {
      ...column,
      width: fitTextColumns && !hasNumericValue ? Math.min(fittedWidth, MAX_TEXT_COLUMN_WIDTH) : fittedWidth
    }
    fittedColumns.add(fitted)
    return fitted
  }
  try {
    return columns.map(fitColumn) as T[]
  } finally {
    probe?.remove()
  }
}

const getExportNumberFormat = (value: unknown) => {
  const text = String(value ?? '')
    .replace(/,/g, '')
    .trim()
  const decimalPart = text.includes('.') ? text.split('.')[1] : ''
  return decimalPart ? `0.${'0'.repeat(decimalPart.length)}` : '0'
}

export const applyExportNumberCell = (
  cell: any,
  rowData: Record<string, unknown>,
  column?: BudgetExecutionAnalysisColumn,
  preserveSourceValue = false
) => {
  const field = column?.field
  if (isExportTextField(field)) return

  const exportValue = cell.value
  const sourceValue = field && Object.prototype.hasOwnProperty.call(rowData, field) ? rowData[field] : exportValue
  const sourceNumberValue = parseExportNumber(sourceValue)
  const displayNumberValue = parseExportNumber(exportValue)
  const numberValue = preserveSourceValue ? sourceNumberValue ?? displayNumberValue : displayNumberValue ?? sourceNumberValue
  if (numberValue === null) return

  cell.value = numberValue
  cell.numFmt = getExportNumberFormat(preserveSourceValue || sourceNumberValue === null ? exportValue : sourceValue)
}
