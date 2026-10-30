import { describe, expect, it } from 'vitest'
import { breadcrumbCandidates, breadcrumbWidth, fitBreadcrumb, hiddenCount, type BreadcrumbWidths } from './breadcrumb-fit'

const widths = (ancestors: number[], current = 160): BreadcrumbWidths => ({
  homeLabel: 60,
  homeIcon: 32,
  separator: 20,
  more: 32,
  ancestors,
  current
})

describe('breadcrumb fit', () => {
  it('keeps the full trail with the home label when everything fits', () => {
    expect(fitBreadcrumb(2000, widths([80, 80, 80]))).toEqual({ homeLabel: true, head: 3, tail: 0 })
  })

  it('renders the full trail before the first measurement', () => {
    expect(fitBreadcrumb(0, widths([80, 80, 80]))).toEqual({ homeLabel: true, head: 3, tail: 0 })
  })

  it('drops the home label before folding any ancestor', () => {
    const sizes = widths([80, 80, 80])
    const full = breadcrumbWidth({ homeLabel: true, head: 3, tail: 0 }, sizes)
    expect(fitBreadcrumb(full - 1, sizes)).toEqual({ homeLabel: false, head: 3, tail: 0 })
  })

  it('folds the middle first, keeping the module and the direct parent', () => {
    const sizes = widths([80, 80, 80, 80])
    const iconOnly = breadcrumbWidth({ homeLabel: false, head: 4, tail: 0 }, sizes)
    const fit = fitBreadcrumb(iconOnly - 1, sizes)
    expect(fit).toEqual({ homeLabel: false, head: 1, tail: 2 })
    expect(hiddenCount(fit, 4)).toBe(1)
  })

  it('falls back to the most compact form and never drops the current page', () => {
    const fit = fitBreadcrumb(10, widths([80, 80, 80], 600))
    expect(fit).toEqual({ homeLabel: false, head: 0, tail: 0 })
    expect(hiddenCount(fit, 3)).toBe(3)
  })

  it('only folds when it hides at least one ancestor', () => {
    for (let total = 0; total <= 5; total += 1) {
      breadcrumbCandidates(total)
        .slice(1)
        .forEach((fit) => {
          if (fit.head + fit.tail < total) expect(hiddenCount(fit, total)).toBeGreaterThan(0)
          expect(fit.head + fit.tail).toBeLessThanOrEqual(total)
        })
    }
  })

  it('counts the fold button and every separator', () => {
    // 图标 32 + (祖先 1 + 「…」 + 父级 1 + 当前页) 4 段分隔 80 + 祖先 160 + 「…」 32 + 当前 160
    expect(breadcrumbWidth({ homeLabel: false, head: 1, tail: 1 }, widths([80, 80, 80]))).toBe(32 + 80 + 160 + 32 + 160)
  })
})
