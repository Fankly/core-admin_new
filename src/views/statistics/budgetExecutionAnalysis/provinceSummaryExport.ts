import Decimal from 'decimal.js'
import type { Worksheet } from 'exceljs'
import type { BudgetExecutionFormulaContext } from './indicatorFormula'
import { BudgetExecutionAnalysisColumn } from './viewHelpers'
import { getProvinceSumFields } from './provinceSummary'
import { isStaticExportRow } from './exportRowRules'

export const applyProvinceSummaryFormulas = (
  worksheet: Worksheet,
  datas: any[],
  columns: BudgetExecutionAnalysisColumn[],
  headerRowCount: number,
  context: BudgetExecutionFormulaContext,
  verticalFormulaAddresses?: ReadonlySet<string>
) => {
  if (context.unitType !== 'SGS') return false
  const fieldIndexes = new Map<string, number>()
  columns.forEach((column, index) => {
    const field = String(column.field || '')
    fieldIndexes.set(field, fieldIndexes.has(field) ? -1 : index)
  })
  let hasFormulas = false
  // 省公司预算列引用母公司；先更新母公司，避免缓存仍使用后端旧目标值。
  const orderedColumns = columns.map((column, columnIndex) => ({ column, columnIndex }))
  orderedColumns.sort((a, b) => Number(String(b.column.field).includes('GSSX_MGS')) - Number(String(a.column.field).includes('GSSX_MGS')))
  orderedColumns.forEach(({ column, columnIndex }) => {
    const field = String(column.field || '')
    if (fieldIndexes.get(field) !== columnIndex) return
    const refs = getProvinceSumFields(field, context)
    if (!refs.length) return
    const indexes = refs.map((ref) => fieldIndexes.get(ref) ?? -1)
    // 缺少任一分组列时保留后端结果，不能把剩余可见列当作完整统计范围。
    if (indexes.some((index) => index < 0)) return
    datas.forEach((item, rowIndex) => {
      const sourceRow = item._row || item
      if (isStaticExportRow(sourceRow)) return
      const rowNumber = headerRowCount + rowIndex + 1
      const cell = worksheet.getCell(rowNumber, columnIndex + 1)
      if (verticalFormulaAddresses?.has(cell.address)) return
      const cells = indexes.map((index) => worksheet.getCell(rowNumber, index + 1))
      if (refs.some((ref, index) => !Object.prototype.hasOwnProperty.call(sourceRow, ref) && !cells[index].formula)) return
      const values = cells.map((cell) => {
        const value = cell.formula ? cell.result : cell.value
        return value == null || value === '' || value === '-' ? 0 : typeof value === 'number' ? value : undefined
      })
      if (values.some((value) => value === undefined)) return
      const result = values.reduce<Decimal>((sum, value) => sum.add(value!), new Decimal(0)).toNumber()
      cell.value = { formula: `SUM(${cells.map((input) => input.address).join(',')})`, result }
      cell.protection = { ...cell.protection, locked: true }
      hasFormulas = true
    })
  })
  return hasFormulas
}
