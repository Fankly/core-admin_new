/**
 * 面包屑折叠：按实测宽度挑出放得下的最完整形态。
 *
 * 保留顺序是「当前页 → 直接父级 → 模块 → 中间层」：先把「主页」收成图标，
 * 再把中间层折进「…」，最后连模块和父级一起折叠。当前页始终保留，
 * 极端情况下由 CSS 截断当前页标题。
 */

export interface BreadcrumbWidths {
  homeLabel: number
  homeIcon: number
  /** 分隔符含左右留白 */
  separator: number
  more: number
  ancestors: number[]
  current: number
}

export interface BreadcrumbFit {
  homeLabel: boolean
  /** 从模块起连续展示的祖先数 */
  head: number
  /** 紧挨当前页连续展示的祖先数 */
  tail: number
}

/** 中间被折叠的祖先数；为 0 时不渲染「…」 */
export const hiddenCount = (fit: BreadcrumbFit, total: number): number => Math.max(0, total - fit.head - fit.tail)

export const breadcrumbCandidates = (total: number): BreadcrumbFit[] => {
  const candidates: BreadcrumbFit[] = [
    { homeLabel: true, head: total, tail: 0 },
    { homeLabel: false, head: total, tail: 0 }
  ]
  for (let tail = total - 2; tail >= 1; tail -= 1) candidates.push({ homeLabel: false, head: 1, tail })
  if (total >= 2) candidates.push({ homeLabel: false, head: 0, tail: 1 })
  if (total >= 1) candidates.push({ homeLabel: false, head: 0, tail: 0 })
  return candidates
}

export const breadcrumbWidth = (fit: BreadcrumbFit, widths: BreadcrumbWidths): number => {
  const { ancestors } = widths
  const shown = [...ancestors.slice(0, fit.head), ...ancestors.slice(ancestors.length - fit.tail)]
  const folded = hiddenCount(fit, ancestors.length) > 0
  const segments = shown.length + (folded ? 1 : 0) + 1
  return (
    (fit.homeLabel ? widths.homeLabel : widths.homeIcon) +
    segments * widths.separator +
    shown.reduce((total, width) => total + width, 0) +
    (folded ? widths.more : 0) +
    widths.current
  )
}

/** available 为 0（尚未测量）时按完整形态渲染，避免首帧闪成折叠态。 */
export const fitBreadcrumb = (available: number, widths: BreadcrumbWidths): BreadcrumbFit => {
  const candidates = breadcrumbCandidates(widths.ancestors.length)
  if (available <= 0) return candidates[0]
  return candidates.find((fit) => breadcrumbWidth(fit, widths) <= available) ?? candidates[candidates.length - 1]
}
