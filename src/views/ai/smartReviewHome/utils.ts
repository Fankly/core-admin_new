const isEmptyValue = (value: any) => {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return false
  const trimmed = value.trim().toLowerCase()
  return trimmed === '' || trimmed === 'null' || trimmed === 'undefined'
}

export const toNumber = (value: any, defaultValue = 0) => {
  if (isEmptyValue(value)) return defaultValue
  if (typeof value === 'number') return Number.isFinite(value) ? value : defaultValue
  const raw = String(value).replace(/,/g, '').trim()
  const matched = raw.match(/-?\d+(\.\d+)?/)
  if (!matched) return defaultValue
  const num = Number(matched[0])
  return Number.isFinite(num) ? num : defaultValue
}

/** 千分位数字 */
export const formatCount = (value: any) => {
  const num = toNumber(value, 0)
  return num.toLocaleString('zh-CN')
}

/**
 * 金额展示：
 * - 已含 万 等单位的字符串直接返回
 * - 数值按量级自动换算（≥1万用万，不再使用亿）
 */
export const formatAmount = (value: any) => {
  if (isEmptyValue(value)) return '0'
  if (typeof value === 'string') {
    const text = value.trim()
    if (/万/.test(text) || text.includes('%')) return text
  }
  const num = toNumber(value, NaN)
  if (!Number.isFinite(num)) return String(value)
  const abs = Math.abs(num)
  if (abs >= 1e4) {
    const val = num / 1e4
    return `${Number.isInteger(val) ? val : Number(val.toFixed(1))}万`
  }
  return formatCount(num)
}

/** 占比：支持 0.44 / 44 / "44%"，或按 total/current 计算 */
export const formatPercent = (value: any, total?: number, current?: number) => {
  if (!isEmptyValue(value)) {
    if (typeof value === 'string' && value.includes('%')) return value.trim()
    const num = toNumber(value, NaN)
    if (Number.isFinite(num)) {
      if (num > 0 && num <= 1) return `${Math.round(num * 100)}%`
      return `${Math.round(num)}%`
    }
  }
  if (typeof total === 'number' && total > 0 && typeof current === 'number') {
    return `${Math.round((current / total) * 100)}%`
  }
  return '0%'
}

export const isApiSuccess = (res: any) => {
  if (!res) return false
  if (res.success === true) return true
  if (res.code === 0 || res.code === '0') return true
  return false
}
