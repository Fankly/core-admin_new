import type { GlkbRecord } from '@/api/overview'
import type { StatMode, WideTableRow } from '../types'

/**
 * 宽表接口（getGlkbByDw / getGlkbByZybm）按「预算类型 + 单位 + 项目类型」平铺返回记录，
 * 这里直接按接口顺序转成一行一条记录的平铺行；页面展示顺序为
 * 预算类型、项目类型、单位/专业、金额或数量，不再透视成
 * 「行 = 单位，列 = 项目类型 × 预算类型」的交叉表。
 */

/** 统计口径只决定取 amount 还是 num，两种口径复用同一次响应，不重新请求。 */
export const getWideValueField = (statMode: StatMode) => (statMode === 'amount' ? 'amount' : 'num')

export const createWideRows = (records: GlkbRecord[], statMode: StatMode): WideTableRow[] => {
  const valueField = getWideValueField(statMode)
  return records.map((record, index) => ({
    // 同一页内「单位 + 项目类型 + 预算类型」由后端保证唯一，下标兜底避免重复键。
    key: `${String(record.dw ?? '')}-${String(record.xmlx ?? '')}-${String(record.yslx ?? '')}-${index}`,
    name: record.dwName || String(record.dw ?? '') || '--',
    category: record.xmlxName || String(record.xmlx ?? '') || '--',
    budget: record.yslxName || String(record.yslx ?? '') || '--',
    // 保留接口原值（字符串尾零、长金额精度不丢），空值交给展示层显示 --。
    value: record[valueField] ?? null
  }))
}
