// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useContextStore, useMenuStore, useSessionStore } from '@/store'
import { getMenuMessage } from '@/api/process'
import { getRoleByBusicode } from '@/api/permission'
import { useUser } from './useUser'

vi.mock('@/api/process', () => ({ getMenuMessage: vi.fn() }))
vi.mock('@/api/permission', () => ({ getRoleByBusicode: vi.fn(), getButtonList: vi.fn() }))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  useSessionStore().setUser({ id: 'user-1' })
  useMenuStore().setMenuMessage({ url: '/service/jointReview/main' })
  vi.mocked(getMenuMessage).mockResolvedValue({ code: 0, success: true, msg: '', data: { outsideMenu: 'review' } })
  vi.mocked(getRoleByBusicode).mockResolvedValue([{ role_id: 'role-1', specialorgid: 'dept-1' }] as never)
})

describe('business role context', () => {
  it.each([
    ['getXqGlobalInfo', 'xqGlobalInfo'], ['getCbGlobalInfo', 'cbGlobalInfo'],
    ['getJRGlobalInfo', 'JRGlobalInfo'], ['getZlGlobalInfo', 'ZlGlobalInfo'],
    ['getLSGlobalInfo', 'LSGlobalInfo'], ['getSZWLlobalInfo', 'SZWLlobalInfo']
  ] as const)('validates %s without changing its context key casing', async (getter, key) => {
    useContextStore().setGlobalInfo(key, { roleId: 'role-1', deptId: 'dept-1' })
    expect(await useUser(getter)).toBe(true)
    expect(getRoleByBusicode).toHaveBeenCalledWith('user-1', 'review')
  })
})
