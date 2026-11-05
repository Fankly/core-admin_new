import Decimal from 'decimal.js'
import type { Cell, Worksheet } from 'exceljs'
import type { BudgetExecutionFormulaContext } from './indicatorFormula'
import { BudgetExecutionAnalysisColumn } from './viewHelpers'
import { isStaticExportRow } from './exportRowRules'

const getTotalIndicator = (field: string) => field.match(/^(?:ORGID_total;(?:CURRENT;|LAST;)?INDICATORID_|total_)(.+)$/)?.[1]

// 横向合计及隐藏引用列共用同一依赖定义，确保列筛选不会截断计算链。
export const getUnitTotalDefinition = (field: string, fields: string[], context: BudgetExecutionFormulaContext) => {
  if (context.unitType === 'SGS') return undefined
  const code = getTotalIndicator(field)
  if (!code) return undefined
  if (context.extended && ['PHTZFD', 'YFJ'].includes(code)) {
    const prefix = field.slice(0, -code.length)
    return { refs: [`${prefix}MBZ_NEW`, `${prefix}${code === 'PHTZFD' ? 'PHMBZ' : 'DFJ'}`], subtract: true }
  }
  if (['WCL', 'TBHBJE', 'TBHBL', ...(context.extended ? ['LXL', 'GBL', 'XMZBL', 'XMHTQDL', 'XMKGL'] : [])].includes(code)) return undefined
  const period = field.match(/;(CURRENT|LAST);/)?.[1]
  const suffix = field.startsWith('ORGID_') ? `;${period ? `${period};` : ''}INDICATORID_${code}` : `_${code}`
  const refs = [...new Set(fields)].filter(
    (candidate) =>
      candidate !== field &&
      candidate.endsWith(suffix) &&
      candidate.match(/;(CURRENT|LAST);/)?.[1] === period &&
      (field.startsWith('ORGID_') ? /^ORGID_[^;]+;(?:CURRENT;|LAST;)?INDICATORID_/.test(candidate) : !candidate.includes(';'))
  )
  return refs.length ? { refs, subtract: false } : undefined
}
const getCellNumber = (cell: Cell) => {
  const value = cell.formula ? cell.result : cell.value
  if (typeof value === 'number') return value
  return value == null || value === '' || value === '-' ? 0 : undefined
}

// 对应四个报表 Service 的“动态添加合计”，包含导出时补齐的隐藏引用列。
export const applyUnitTotalFormulas = (
  worksheet: Worksheet,
  datas: any[],
  columns: BudgetExecutionAnalysisColumn[],
  sourceColumns: BudgetExecutionAnalysisColumn[],
  headerRowCount: number,
  context: BudgetExecutionFormulaContext,
  verticalFormulaAddresses?: ReadonlySet<string>
) => {
  if (context.unitType === 'SGS') return false
  const fieldIndexes = new Map<string, number>()
  columns.forEach((column, index) => {
    const field = String(column.field || '')
    fieldIndexes.set(field, fieldIndexes.has(field) ? -1 : index)
  })
  const sourceFields = [...new Set([...sourceColumns, ...columns].map((column) => String(column.field || '')))]
  let hasFormulas = false
  // 差额引用合计，必须在金额合计之后计算，兼容表头列重排。
  const orderedColumns = columns.map((column, columnIndex) => ({ column, columnIndex }))
  orderedColumns.sort(
    (a, b) =>
      Number(!!getUnitTotalDefinition(String(a.column.field), sourceFields, context)?.subtract) -
      Number(!!getUnitTotalDefinition(String(b.column.field), sourceFields, context)?.subtract)
  )
  datas.forEach((item, rowIndex) => {
    const sourceRow = item._row || item
    if (isStaticExportRow(sourceRow)) return
    const rowNumber = headerRowCount + rowIndex + 1
    const fields = [...new Set([...sourceFields, ...Object.keys(sourceRow)])]
    orderedColumns.forEach(({ column, columnIndex }) => {
      const field = String(column.field || '')
      const definition = getUnitTotalDefinition(field, fields, context)
      if (!definition) return
      const cell = worksheet.getCell(rowNumber, columnIndex + 1)
      if (verticalFormulaAddresses?.has(cell.address)) return
      const { refs, subtract } = definition
      const indexes = refs.map((ref) => fieldIndexes.get(ref) ?? -1)
      if (indexes.some((index) => index < 0 || index === columnIndex)) return
      const cells = indexes.map((index) => worksheet.getCell(rowNumber, index + 1))
      if (refs.some((ref, index) => !Object.prototype.hasOwnProperty.call(sourceRow, ref) && !cells[index].formula)) return
      // 空值导出为“-”；减法不能把文本占位当成数字，否则 Excel 重算会报错。
      if (subtract && cells.some((input) => typeof (input.formula ? input.result : input.value) !== 'number')) return
      const values = cells.map(getCellNumber)
      if (values.some((value) => value === undefined)) return
      const result = subtract
        ? new Decimal(values[0]!).minus(values[1]!).toNumber()
        : values.reduce<Decimal>((sum, value) => sum.add(value!), new Decimal(0)).toNumber()
      const addresses = cells.map((input) => input.address)
      const groups: string[] = []
      for (let index = 0; index < addresses.length; index += 255) groups.push(`SUM(${addresses.slice(index, index + 255).join(',')})`)
      const formula = subtract ? addresses.join('-') : groups.join('+')
      if (formula.length > 8192) return
      cell.value = { formula, result }
      cell.protection = { ...cell.protection, locked: true }
      hasFormulas = true
    })
  })
  return hasFormulas
}
