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

/** 固定字符数截断，避免同一标签随容器宽度出现不同的省略位置。 */
export const truncateText = (value: string, maxLength: number) => {
  const characters = Array.from(value || '')
  if (characters.length <= maxLength) return value || ''
  return `${characters.slice(0, maxLength).join('')}…`
}

/**
 * 金额展示：
 * - 已含 亿/万 等单位的字符串直接返回
 * - 数值按量级自动换算
 */
export const formatAmount = (value: any) => {
  if (isEmptyValue(value)) return '0'
  if (typeof value === 'string') {
    const text = value.trim()
    if (/[亿万]/.test(text) || text.includes('%')) return text
  }
  const num = toNumber(value, NaN)
  if (!Number.isFinite(num)) return String(value)
  const abs = Math.abs(num)
  if (abs >= 1e8) {
    const val = num / 1e8
    return `${Number.isInteger(val) ? val : Number(val.toFixed(1))}亿`
  }
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

/** 审核状态 → 图标样式 class */
export const resolveStatusClass = (status: string) => {
  const text = (status || '').trim()
  if (!text) return 'is-unknown'
  if (/失败|异常|错误/.test(text)) return 'is-failed'
  if (/完成|通过|已审|成功/.test(text)) return 'is-done'
  if (/等待|待处理|待审核|待审|排队/.test(text)) return 'is-waiting'
  if (/处理中|审核中|进行|运行/.test(text)) return 'is-processing'
  return 'is-unknown'
}

/** 审核结论 → 图标样式 class */
export const resolveResultClass = (result: string) => {
  const text = (result || '').trim()
  if (!text || text === '—' || text === '-') return ''
  if (/通过|合格|正常/.test(text)) return 'is-pass'
  if (/人工|复核|待核/.test(text)) return 'is-manual'
  if (/驳回|拒绝|不通过|失败/.test(text)) return 'is-reject'
  return 'is-pass'
}
