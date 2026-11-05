export type FormatValue = (value: string, digits?: number) => unknown

interface ColumnFormatOptions {
  emptyNumericAsZero?: boolean
}

export interface BudgetExecutionAnalysisColumn {
  field?: string
  title?: string
  children?: BudgetExecutionAnalysisColumn[]
  headerAlign?: string
  align?: string
  fixed?: string
  visible?: boolean
  treeNode?: boolean
  formatter?: ({ cellValue, row }: { cellValue: unknown; row?: Record<string, unknown> }) => unknown
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
// 默认只冻结第一列；需要冻结更多列时由调用方显式传入。
const DEFAULT_FIXED_COLUMN_COUNT = 1
const UNFORMATTED_COLUMN_FIELDS = ['subName', 'gkbm', 'ysly', 'cnxm', 'cnxmms']

export const isUnformattedColumnField = (field?: string) => !!field && UNFORMATTED_COLUMN_FIELDS.includes(field)

const resolveDigits = (xsws: string) => {
  const digits = Number(xsws.split('_')[1])
  return Number.isFinite(digits) ? digits : 2
}

// 页面只格式化接口值，不根据同一行的其他指标重新计算。
const createColumnFormatter = (xsws: string, formatValue: FormatValue, options: ColumnFormatOptions) => {
  return ({ cellValue }: { cellValue: unknown }) => {
    if (isEmptyCellValue(cellValue)) return options.emptyNumericAsZero ? formatValue('0', resolveDigits(xsws)) : '-'
    const value = String(cellValue)

    // 金额、比率及百分比文本统一使用页面选择的小数位数。
    if (/^-?\d+(?:\.\d+)?%$/.test(value)) return `${formatValue(value.slice(0, -1), resolveDigits(xsws))}%`
    return formatValue(value, resolveDigits(xsws))
  }
}

const hasVisibleLeaf = (column: BudgetExecutionAnalysisColumn): boolean =>
  column.visible !== false && (!Array.isArray(column.children) || column.children.length === 0 || column.children.some(hasVisibleLeaf))

const clearFixedState = (column: BudgetExecutionAnalysisColumn) => {
  delete column.fixed
  if (Array.isArray(column.children)) column.children.forEach(clearFixedState)
}

const freezeColumn = (column: BudgetExecutionAnalysisColumn) => {
  column.fixed = 'left'
  if (Array.isArray(column.children)) column.children.forEach(freezeColumn)
}

// VXE 要求分组列整体冻结，不允许单独固定分组内的子列（否则报 groupFixed 且表头错位），
// 因此按顶层列冻结：分组列会连同全部子列一起固定。后端下发的 fixed 先清空再按规则重设。
export const applyFixedColumns = <T extends BudgetExecutionAnalysisColumn>(columns: T[] = [], fixedColumnCount = DEFAULT_FIXED_COLUMN_COUNT): T[] => {
  columns.forEach(clearFixedState)
  if (fixedColumnCount <= 0) return columns
  let frozenCount = 0
  for (const column of columns) {
    if (frozenCount >= fixedColumnCount) break
    if (!hasVisibleLeaf(column)) continue
    freezeColumn(column)
    frozenCount += 1
  }
  return columns
}

const decorateColumn = <T extends BudgetExecutionAnalysisColumn>(
  column: T,
  xsws: string,
  formatValue: FormatValue,
  options: ColumnFormatOptions = {}
): T => {
  const decoratedChildren = Array.isArray(column.children)
    ? column.children.map((child) => decorateColumn(child, xsws, formatValue, options))
    : column.children

  const decoratedColumn: BudgetExecutionAnalysisColumn = {
    ...column,
    children: decoratedChildren,
    headerAlign: 'center'
  }

  if (column.field === 'name') {
    decoratedColumn.align = 'left'
    decoratedColumn.treeNode = true
    decoratedColumn.formatter = ({ cellValue }) => (isEmptyCellValue(cellValue) ? '-' : cellValue)
    return decoratedColumn as T
  }

  if (isUnformattedColumnField(column.field)) {
    decoratedColumn.align = column.field === 'subName' ? 'left' : 'center'
    decoratedColumn.formatter = ({ cellValue }) => cellValue
    return decoratedColumn as T
  }

  if (column.field) {
    decoratedColumn.align = 'right'
    decoratedColumn.formatter = createColumnFormatter(xsws, formatValue, options)
  }

  return decoratedColumn as T
}

export const decorateDynamicColumns = <T extends BudgetExecutionAnalysisColumn>(
  columns: T[],
  xsws: string,
  formatValue: FormatValue,
  fixedColumnCount = DEFAULT_FIXED_COLUMN_COUNT,
  options: ColumnFormatOptions = {}
): T[] => {
  return applyFixedColumns(
    columns.map((column) => decorateColumn(column, xsws, formatValue, options)),
    fixedColumnCount
  )
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

// VXE 导出列可能不保留自定义属性，从其实际 formatter 读取当前选择的小数位。
export const getBudgetExecutionColumnDigits = (column: BudgetExecutionAnalysisColumn): number | undefined => {
  if (!column.formatter) return undefined
  const zero = String(column.formatter({ cellValue: 0 }))
    .replace(/,/g, '')
    .replace(/%$/, '')
  return /^\d+(?:\.\d+)?$/.test(zero) ? zero.split('.')[1]?.length || 0 : undefined
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

// 根查询按当前数据适配数字列和序号列；展开时可单独测量序号列。
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
    const isSequence = column.field === 'subName'
    let contentWidth = 0
    let hasNumericValue = false
    rows.forEach((row) => {
      const rawValue = row[column.field!]
      const cellValue = column.formatter ? column.formatter({ cellValue: rawValue, row }) : rawValue
      const numeric = isNumericColumnValue(column, cellValue)
      if (numeric) hasNumericValue = true
      // 序号可能是中文、带前导零或分级编码，始终按显示文本测量。
      else if ((!fitTextColumns && !isSequence) || isEmptyCellValue(cellValue)) return
      const displayText = String(cellValue).trim()
      if (!displayText) return
      const bold = row.sfjc === 1 || row.sfjc === '1'
      contentWidth = Math.max(contentWidth, measure(displayText, bold))
    })
    const headerWidth = measure(String(column.title || ''), true, true)
    if (isSequence) {
      const fitted: BudgetExecutionAnalysisColumn = { ...column, width: Math.max(60, contentWidth, headerWidth) }
      // 后端的最小宽度不能覆盖前端的测量结果。
      delete fitted.minWidth
      fittedColumns.add(fitted)
      return fitted
    }
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

// 懒加载和一键展开只补宽序号，保留已加载行需要的宽度，避免各批次之间来回收缩。
export const widenSequenceColumn = <T extends BudgetExecutionAnalysisColumn>(
  columns: T[] = [],
  rows: Record<string, unknown>[] = [],
  tableElement?: HTMLElement
): T[] => {
  const sequenceColumns = getExportLeafColumns(columns).filter((column) => column.field === 'subName')
  if (!sequenceColumns.length || !rows.length) return columns
  const fitted = fitNumericColumnWidths(sequenceColumns, rows, tableElement)
  const widths = new Map(
    sequenceColumns.flatMap((column, index) => {
      const width = Number(fitted[index].width)
      return width > (Number(column.width) || 0) ? [[column, width] as const] : []
    })
  )
  if (!widths.size) return columns
  const update = (column: BudgetExecutionAnalysisColumn): BudgetExecutionAnalysisColumn => {
    if (column.children?.length) return { ...column, children: column.children.map(update) }
    return widths.has(column) ? { ...column, width: widths.get(column) } : column
  }
  return columns.map(update) as T[]
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
