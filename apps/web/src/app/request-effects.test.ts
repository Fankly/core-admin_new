// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { BaseMethod } from '@/api/base/BaseMethod'
import { useShellStore } from '@/store/modules/shell'
import { installRequestEffects } from './request-effects'

let dispose: (() => void) | undefined
afterEach(() => dispose?.())

describe('application request effects', () => {
  it('keeps loading visible until all concurrent requests settle, including failures', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    dispose = installRequestEffects(createRouter({ history: createMemoryHistory(), routes: [] }), pinia)
    const shell = useShellStore(pinia)
    const api = new BaseMethod()
    vi.spyOn(api, 'handleError').mockImplementation(() => {})
    let finish!: () => void
    let fail!: (error: Error) => void
    const first = api.requestWithLoading(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
      'GET',
      '/first',
      true
    )
    const second = api.requestWithLoading(
      () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject
        }),
      'GET',
      '/second',
      true
    )
    expect(shell.isLoading).toBe(true)
    finish()
    await first
    expect(shell.isLoading).toBe(true)
    const rejected = expect(second).rejects.toThrow('failed')
    fail(new Error('failed'))
    await rejected
    expect(shell.isLoading).toBe(false)
  })

  it('allows API use without Pinia or request effects and keeps opt-out calls quiet', async () => {
    setActivePinia(undefined)
    const api = new BaseMethod()
    await expect(api.requestWithLoading(() => Promise.resolve('ok'), 'GET', '/headless', true)).resolves.toBe('ok')
    const pinia = createPinia()
    dispose = installRequestEffects(createRouter({ history: createMemoryHistory(), routes: [] }), pinia)
    await api.requestWithLoading(() => Promise.resolve(), 'GET', '/silent', false)
    expect(useShellStore(pinia).isLoading).toBe(false)
  })
})
