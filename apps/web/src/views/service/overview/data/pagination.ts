/**
 * 分页相关的纯函数与常量：阶段平铺明细表、预算事项弹窗与项目明细弹窗共用。
 *
 * 三个分页区域（宽表、预算事项、项目明细）原本各自维护一份每页条数常量、页码条算法与
 * 分页包体归一化逻辑，改一处容易漏改另外两处；这里收敛成同一份实现，页面只负责渲染。
 */

/** 每页条数选项：直接作为接口的 limit，翻页重新请求。 */
export const PAGE_SIZES = [20, 50, 100, 500]
export const DEFAULT_PAGE_SIZE = 20

/** 页码条的一项：数字页码，或首尾省略号。 */
export type PageItem = number | '...'

/**
 * 页码条：7 页以内全部展示；更多时固定首尾，中间只保留当前页前后各一页，其余用省略号。
 * 调用方传入的页码会先夹到 [1, pageCount]，避免请求失败后页码越界画出空条。
 */
export const buildPageItems = (page: number, pageCount: number): PageItem[] => {
  const count = Math.max(1, Math.trunc(pageCount) || 1)
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), count)
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)
  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  const items: PageItem[] = [1]
  if (start > 2) items.push('...')
  for (let index = start; index <= end; index += 1) items.push(index)
  if (end < count - 1) items.push('...')
  items.push(count)
  return items
}

/** 分页查询结果：total 为 null 表示接口没有给出总条数（直接返回数组的包体）。 */
export interface PagedResult<T> {
  rows: T[]
  total: number | null
}

/**
 * 兼容「直接返回数组」与「分页对象」两种包体：
 * 数组形态没有总数，由调用方按「本页是否满页」判断下一页；
 * 对象形态兼容 records / list / rows 与 total / totalCount / count 等常见命名。
 */
export const normalizePagedResult = <T>(data: unknown): PagedResult<T> => {
  if (Array.isArray(data)) return { rows: data as T[], total: null }
  const pageData = (data ?? {}) as {
    records?: T[]
    list?: T[]
    rows?: T[]
    total?: unknown
    totalCount?: unknown
    count?: unknown
  }
  const total = Number(pageData.total ?? pageData.totalCount ?? pageData.count)
  return {
    rows: pageData.records ?? pageData.list ?? pageData.rows ?? [],
    total: Number.isFinite(total) ? total : null
  }
}
