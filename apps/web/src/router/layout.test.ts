// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { isWorkflowStandalone, resolveLayoutMode } from './layout'

const createRoute = (path: string, meta: Record<string, unknown> = {}, query: Record<string, string> = {}) =>
  ({ path, meta, query }) as unknown as Pick<RouteLocationNormalized, 'path' | 'query' | 'meta'>

describe('layout resolution', () => {
  it('keeps workflow form pages standalone', () => {
    expect(isWorkflowStandalone('/workflow/start/123')).toBe(true)
    expect(isWorkflowStandalone('/workflow/todoTasks')).toBe(false)
    expect(isWorkflowStandalone('/budget/workflowList')).toBe(false)
    expect(resolveLayoutMode(createRoute('/workflow/start/123'))).toBe('standalone')
  })

  it('uses fullscreen for login, pop windows and explicit meta', () => {
    expect(resolveLayoutMode(createRoute('/login'))).toBe('fullscreen')
    expect(resolveLayoutMode(createRoute('/order', {}, { pop: 'true' }))).toBe('fullscreen')
    expect(resolveLayoutMode(createRoute('/order', { layout: 'fullscreen' }))).toBe('fullscreen')
  })

  it('falls back to the page shell', () => {
    expect(resolveLayoutMode(createRoute('/order'))).toBe('page')
    expect(resolveLayoutMode(createRoute('/home'))).toBe('page')
  })
})
