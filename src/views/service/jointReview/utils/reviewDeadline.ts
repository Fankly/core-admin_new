/**
 * 线下会审保存截止校验（纯函数，便于单测）
 *
 * 业务口径：保存只校验「线下会审截止日」，不校验开始日；
 * 比较粒度为自然日（浏览器本地时区 00:00 为界），截止日当天仍可保存。
 */

/** 日期字符串前缀：2026-11-03 / 2026/11/03 / 2026-11-3，后接时分秒或 ISO 时区均可 */
const DATE_PREFIX_RE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/

/**
 * 取某个值的「本地自然日 0 点」时间戳。
 * 无法解析时返回 0（作为不可用哨兵，调用方据此判定不可保存）。
 */
export const getDayStartTime = (value: unknown): number => {
  if (!value) return 0

  if (value instanceof Date) {
    return toDayStartTime(value.getFullYear(), value.getMonth() + 1, value.getDate())
  }

  const text = String(value).trim()
  if (!text) return 0

  const matched = DATE_PREFIX_RE.exec(text)
  if (matched) {
    return toDayStartTime(Number(matched[1]), Number(matched[2]), Number(matched[3]))
  }

  // 兜底：交给原生解析（如 ISO 字符串、时间戳文本）
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return 0
  return toDayStartTime(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate())
}

/** 年/月/日 → 本地 0 点时间戳；非法日期返回 0 */
const toDayStartTime = (year: number, month: number, day: number): number => {
  if (!year || !month || !day) return 0
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) return 0
  // 排除 2026-02-30 这类会被自动进位的非法日期
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return 0
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/**
 * 是否未超过截止日：今天 <= 截止日（按自然日，含截止日当天）。
 * 截止日缺失或非法时返回 false —— 不可保存。
 */
export const isBeforeDeadlineDay = (deadline: unknown, now: Date = new Date()): boolean => {
  const endTime = getDayStartTime(deadline)
  if (!endTime) return false
  return getDayStartTime(now) <= endTime
}
