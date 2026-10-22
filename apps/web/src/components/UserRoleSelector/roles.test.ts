// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { CurrentUserRoleInjectionKey } from './interface'
import type { UserRole } from './interface'
import { useRoleSelector } from './useRoleSelector'

const api = vi.hoisted(() => ({ roles: vi.fn(), buttons: vi.fn(), setPermissions: vi.fn(), back: vi.fn(), emit: vi.fn() }))
vi.mock('@/api/process', () => ({ getMenuMessage: vi.fn() }))
vi.mock('@/api/permission', () => ({ getRoleByBusicode: api.roles, getButtonList: api.buttons }))
vi.mock('@/store', () => ({
  useMenuStore: () => ({ menuMsg: { url: '/page' }, routeToMeta: { '/page': { outsideMenu: 'menu' } } }),
  useSessionStore: () => ({ user: { id: 'user' }, setPermissions: api.setPermissions }),
  useShellStore: () => ({ setMainPageRole: vi.fn() }),
  useTabsStore: () => ({ tabs: [{ path: '/page' }], closeTab: vi.fn() })
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/page', meta: {} }), useRouter: () => ({ back: api.back, replace: vi.fn() }) }))
const wrappers: { unmount: () => void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => {
    wrapper.unmount()
  })
  vi.resetAllMocks()
})
const role: UserRole = { bmId: 'dept', bmName: '', dwId: '', dwName: '', roleId: 'role', roleCode: '', specialOrgCode: '', spRoleId: 'selected' }
const setup = () => {
  let state: ReturnType<typeof useRoleSelector> | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        state = useRoleSelector(api.emit)
        return () => h('div')
      }
    }),
    {
      global: { provide: { [CurrentUserRoleInjectionKey as symbol]: ref({ ...role }) } }
    }
  )
  wrappers.push(wrapper)
  if (!state) throw new Error('Role state not initialized')
  return state
}

describe('role permission lifecycle', () => {
  it('prevents repeated confirmation and ignores a response after cancellation', async () => {
    let resolve!: (value: unknown) => void
    api.buttons.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const state = setup()
    state.selectedRoleId.value = 'selected'
    const request = state.confirmRole()
    await state.confirmRole()
    expect(api.buttons).toHaveBeenCalledTimes(1)
    state.cancel()
    resolve({ success: true, data: ['EDIT'] })
    await request
    expect(state.canRender.value).toBe(false)
    expect(api.emit).not.toHaveBeenCalled()
    expect(state.permissions.value).toEqual([])
    expect(api.back).toHaveBeenCalledTimes(1)
  })

  it('allows a valid role with no buttons to render and returns cached permissions', async () => {
    api.buttons.mockResolvedValue({ success: true, data: [] })
    const state = setup()
    state.selectedRoleId.value = 'selected'
    await state.confirmRole()
    expect(state.canRender.value).toBe(true)
    expect(state.getButtonPermissions()).toEqual([])
    expect(api.emit).toHaveBeenCalledWith('loadCompany')
    expect(api.buttons).toHaveBeenCalledTimes(1)
  })
})
