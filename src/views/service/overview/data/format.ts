import Decimal from 'decimal.js'
import type { AmountUnit, StatMode } from '../types'

export const DEFAULT_AMOUNT_UNIT: AmountUnit = '万元'

export const AMOUNT_UNIT_OPTIONS: AmountUnit[] = ['万元', '亿元']

/** 接口金额固定以万元返回；亿元展示时按 1 亿元 = 10000 万元换算。 */
const AMOUNT_UNIT_DIVISORS: Record<AmountUnit, number> = { 万元: 1, 亿元: 10000 }

export const getOverviewUnit = (statMode: StatMode, amountUnit: AmountUnit = DEFAULT_AMOUNT_UNIT) => (statMode === 'amount' ? amountUnit : '个')

/** 万元原值 → 当前展示单位数值；无法解析的文本返回 null，由调用方按原文兜底。 */
export const convertOverviewAmount = (value: unknown, amountUnit: AmountUnit = DEFAULT_AMOUNT_UNIT): Decimal | null => {
  if (value === undefined || value === null) return null
  try {
    const number = new Decimal(String(value).trim())
    if (!number.isFinite()) return null
    // 单位换算仅移动小数点；精度随原值增长，避免 Decimal 默认 20 位有效数字截断长金额。
    const AmountDecimal = Decimal.clone({ precision: Math.max(20, number.precision()), rounding: Decimal.ROUND_HALF_UP })
    return new AmountDecimal(number).div(AMOUNT_UNIT_DIVISORS[amountUnit])
  } catch {
    return null
  }
}

export const formatOverviewValue = (value: unknown, statMode: StatMode, amountUnit: AmountUnit = DEFAULT_AMOUNT_UNIT): string => {
  if (value === undefined || value === null) return '--'
  const text = String(value).trim()
  if (!text || text === '-' || text === '--') return '--'
  if (statMode !== 'amount') return text

  const number = convertOverviewAmount(text, amountUnit)
  return number === null ? text : number.toFixed(2)
}

/**
 * 估算单行文本宽度（单位 em），按 Arial / Noto Sans SC 的字宽分类累加。
 * 汇总区的数值与标题用它和容器宽度换算字号：放得下时用期望字号，放不下时等比缩小，始终完整显示而不省略。
 */
export const estimateTextEm = (text: string) =>
  Math.max(
    0.5,
    Array.from(text).reduce((sum, char) => {
      if (/[0-9]/.test(char)) return sum + 0.556
      if (/[.,:;'!|\s]/.test(char)) return sum + 0.278
      if (char === '-') return sum + 0.333
      if (char === '%') return sum + 0.889
      // 其余拉丁字符取偏宽的估值；中日韩及全角字符为整字宽。
      return sum + (char.charCodeAt(0) < 0x2e80 ? 0.67 : 1)
    }, 0)
  )

// 占比统一保留 2 位小数：去掉接口可能携带的百分号后按数字舍入，再补回百分号；无法解析为数字的文本按原值兜底。
export const formatOverviewRatio = (value: unknown): string => {
  if (value === undefined || value === null) return '--'
  const text = String(value).trim()
  if (!text || text === '-' || text === '--') return '--'
  const numeric = Number(text.replace(/%$/, '').trim())
  if (!Number.isFinite(numeric)) return text.endsWith('%') ? text : `${text}%`
  return `${numeric.toFixed(2)}%`
}
