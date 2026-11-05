import Decimal from 'decimal.js'
import { BudgetExecutionFormulaContext, getIndicatorCellFormula, getIndicatorCodeByField } from './indicatorFormula'
import { getProvinceSumFields } from './provinceSummary'
import { parseExportNumber } from './viewHelpers'
import { isStaticExportRow } from './exportRowRules'

const isEmptyCellValue = (value: unknown) => value === undefined || value === null || value === ''

const calculationNumber = (value: unknown) => (isEmptyCellValue(value) ? 0 : parseExportNumber(value))

// 仅用于导出：有引用值时重新计算除法，空输入按 0；未查询引用字段时保留接口值。
export const calculateBudgetExecutionExportValue = (
  field: string,
  row: Record<string, unknown>,
  context: BudgetExecutionFormulaContext,
  digits: number
): unknown => {
  const raw = row[field]
  if (isStaticExportRow(row)) return raw
  const sumFields = getProvinceSumFields(field, context)
  if (sumFields.length && sumFields.every((ref) => Object.prototype.hasOwnProperty.call(row, ref))) {
    const values = sumFields.map((ref) => calculationNumber(calculateBudgetExecutionExportValue(ref, row, context, digits)))
    if (values.every((value) => value !== null)) return values.reduce<Decimal>((sum, value) => sum.add(value!), new Decimal(0)).toNumber()
  }
  const code = getIndicatorCodeByField(field)
  const formula = getIndicatorCellFormula(field, context)
  if (!code || !formula) return raw
  if (formula.kind === 'ratio') {
    const prefix = field.slice(0, -code.length)
    const numeratorField = `${prefix}${formula.refs[0]}`
    const denominatorField = `${prefix}${formula.refs[1]}`
    if (!Object.prototype.hasOwnProperty.call(row, denominatorField)) return raw
    const denominator = calculationNumber(calculateBudgetExecutionExportValue(denominatorField, row, context, digits))
    if (denominator === 0) return '-'
    if (denominator === null || !Object.prototype.hasOwnProperty.call(row, numeratorField)) return raw
    const numerator = calculationNumber(calculateBudgetExecutionExportValue(numeratorField, row, context, digits))
    if (numerator === null) return '-'
    const value = new Decimal(numerator).mul(formula.multiplier).div(denominator)
    if (typeof raw === 'string' && raw.endsWith('%')) {
      return `${value
        .mul(formula.multiplier === 1 ? 100 : 1)
        .toDecimalPlaces(digits, Decimal.ROUND_HALF_UP)
        .toString()}%`
    }
    return value.toDecimalPlaces(digits, Decimal.ROUND_HALF_UP).toNumber()
  }
  // 普通空结果显示 0；已有同比/环比结果则跟随两期重新计算后的比率。
  if (isEmptyCellValue(raw) || raw === '-') return raw
  const prefix = field.slice(0, -`;INDICATORID_${code}`.length)
  const refs = [`${prefix};CURRENT;INDICATORID_${formula.refs[0]}`, `${prefix};LAST;INDICATORID_${formula.refs[1]}`]
  if (refs.some((ref) => !Object.prototype.hasOwnProperty.call(row, ref))) return raw
  const values = refs.map((ref) => {
    const value = calculateBudgetExecutionExportValue(ref, row, context, digits)
    return typeof value === 'string' && value.endsWith('%') ? Number(value.slice(0, -1)) / 100 : calculationNumber(value)
  })
  if (values.some((value) => value === null)) return '-'
  return new Decimal(values[0]!).minus(values[1]!).toDecimalPlaces(digits, Decimal.ROUND_HALF_UP).toNumber()
}
