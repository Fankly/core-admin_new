import { describe, expect, it } from 'vitest'
import { resolveViewComponent, toSysViewComponentPath } from './view-registry'

describe('view registry', () => {
  it('maps menu paths to view files and normalises underscores', () => {
    expect(toSysViewComponentPath('/order/list')).toBe('/src/views/order/list.vue')
    expect(toSysViewComponentPath('/order/a_b_c')).toBe('/src/views/order/a-b-c.vue')
  })

  it('resolves the skeleton views and rejects unknown paths', () => {
    expect(resolveViewComponent('/home')).toBeTypeOf('function')
    expect(resolveViewComponent('/iframe')).toBeTypeOf('function')
    expect(resolveViewComponent('/not-exists')).toBeUndefined()
  })
})
