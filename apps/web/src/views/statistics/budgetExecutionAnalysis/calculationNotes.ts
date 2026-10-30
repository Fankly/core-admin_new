import Decimal from 'decimal.js'
import type { Cell } from 'exceljs'

interface CalculationNoteOptions {
  title: string
  numeratorTitle: string
  denominatorTitle: string
  numerator: Cell
  denominator: Cell
  multiplier: number
  scale: number
  percentDivisor: number
}

const isMissing = (value: unknown) => value === null || value === undefined || value === '' || value === '-'

const formatNumber = (value: number, decimals?: number) => {
  const number = new Decimal(value)
  const [integer, fraction] = (decimals === undefined ? number.toFixed() : number.toFixed(decimals, Decimal.ROUND_HALF_UP)).split('.')
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${fraction ? `.${fraction}` : ''}`
}

const formatResult = (cell: Cell) => {
  const value: unknown = cell.result
  if (typeof value === 'number') {
    const isPercent = cell.numFmt.endsWith('%')
    const decimals = cell.numFmt.match(/\.(0+)/)?.[1].length || 0
    return `${formatNumber(new Decimal(value).mul(isPercent ? 100 : 1).toNumber(), decimals)}${isPercent ? '%' : ''}`
  }
  if (value && typeof value === 'object' && 'error' in value) return String((value as { error: unknown }).error)
  return String(value ?? '-')
}

export const addCalculationNote = (cell: Cell, options: CalculationNoteOptions) => {
  const { title, numeratorTitle, denominatorTitle, numerator, denominator, multiplier, scale, percentDivisor } = options
  const numeratorValue = numerator.formula ? numerator.result : numerator.value
  const denominatorValue = denominator.formula ? denominator.result : denominator.value
  const result = formatResult(cell)
  const factor = multiplier === 1 ? '' : ` × ${multiplier}`
  let businessFormula = `${title} = ${numeratorTitle} ÷ ${denominatorTitle}${factor}`
  if (percentDivisor === 100) businessFormula += '，按计算精度舍入后 ÷ 100，以百分比显示'
  let process: string
  if (isMissing(numeratorValue) || isMissing(denominatorValue)) {
    const missing = [numerator, denominator].filter((input) => isMissing(input.formula ? input.result : input.value)).map((input) => input.address)
    process = `${missing.join('、')} 缺少数值，按当前公式返回 ${result}。`
  } else if (denominatorValue === 0) {
    process = `${denominatorTitle}（${denominator.address}）为 0，按当前公式返回 ${result}。`
  } else if (typeof numeratorValue !== 'number' || typeof denominatorValue !== 'number') {
    process = `引用值不是有效数字：${numerator.address}=${numerator.text}，${denominator.address}=${denominator.text}，计算返回 ${result}。`
  } else {
    const rounded = new Decimal(numeratorValue).mul(multiplier).div(denominatorValue).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toNumber()
    process = `${formatNumber(numeratorValue)} ÷ ${formatNumber(denominatorValue)}${factor} ≈ ${formatNumber(
      rounded
    )}\n四舍五入保留 ${scale} 位小数。`
    if (percentDivisor === 100) process += `\n${formatNumber(rounded)} ÷ 100，以百分比显示为 ${result}。`
    else if (cell.numFmt.endsWith('%')) process += `\n以百分比显示为 ${result}。`
  }
  cell.note = [
    `计算说明\n单元格：${cell.address} · ${title}`,
    `业务公式\n${businessFormula}`,
    `计算过程\n${process}`,
    `计算结果\n${result}`,
    `原始公式\n=${cell.formula}`,
    '说明记录导出时的计算；修改数据后公式会重算，批注不会自动更新。'
  ].join('\n\n')
}
