import Decimal from 'decimal.js'
import type { StatisticValue } from '@/api/overview'

/** 空值及无效值不参与汇总，保留有效的零值。 */
export const parseStatisticDecimal = (value: unknown): Decimal | null => {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  if (!text || text === '-') return null
  try {
    const number = new Decimal(text)
    return number.isFinite() ? number : null
  } catch {
    return null
  }
}

/** 动态精度覆盖整数、小数及累加进位，避免长金额求和丢失尾数。 */
export const sumStatisticValues = (values: unknown[]): StatisticValue | null => {
  const numbers = values.map(parseStatisticDecimal).filter((value): value is Decimal => value !== null)
  if (!numbers.length) return null
  const integerDigits = Math.max(0, ...numbers.map((value) => value.e + 1))
  const decimalPlaces = Math.max(...numbers.map((value) => value.decimalPlaces()))
  const SumDecimal = Decimal.clone({ precision: Math.max(20, integerDigits + decimalPlaces + String(numbers.length).length) })
  return numbers.reduce((total, value) => total.plus(value), new SumDecimal(0)).toFixed()
}

/** 占比由汇总值重新计算；分母为零或缺失时留空，不累加已舍入的百分比。 */
export const calculateStatisticRatio = (value: unknown, total: unknown): number | null => {
  const numerator = parseStatisticDecimal(value)
  const denominator = parseStatisticDecimal(total)
  if (!numerator || !denominator || denominator.isZero()) return null
  return numerator.div(denominator).times(100).toNumber()
}
