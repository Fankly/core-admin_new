// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { computed } from 'vue'
import { useContextStore, useMenuStore, useSessionStore, useShellStore, useTabsStore } from './index'
import business, { mapGetters, mapMutations } from './business'

vi.mock('@/service/baseService', () => ({ default: { get: vi.fn() } }))

beforeEach(() => setActivePinia(createPinia()))

describe('migrated business state', () => {
  it('shares reactive users, menus and permissions with the application shell', () => {
    const session = useSessionStore()
    const userName = computed(() => business.getters.getUserMsg.name)
    expect(userName.value).toBe('')
    session.setUser({ id: 'user-1', name: '业务用户' })
    expect(userName.value).toBe('业务用户')
    expect(business.getters.getUserInfo).toBe(session.user)
    business.commit('setPermissions', ['query'])
    expect(session.permissions).toEqual(['query'])
    business.commit('setMenuMsg', { id: 'menu-1', url: '/service/overview/index' })
    expect(useMenuStore().menuMsg.id).toBe('menu-1')
    expect(mapGetters(['getCurrentMenuId']).getCurrentMenuId()).toBe('menu-1')
  })

  it('keeps cross-page context and project stages in Pinia and clears them on reset', () => {
    business.commit('setXqGlobalInfo', { projectId: 'project-1' })
    business.commit('setSZWLlobalInfo', { materialId: 'material-1' })
    business.commit('htqdData', { contractId: 'contract-1' })
    business.commit('setPenetrateParams', { year: '2026' })
    expect(useContextStore().getXqGlobalInfo).toEqual({ projectId: 'project-1' })
    expect(business.getters.getSZWLlobalInfo).toEqual({ materialId: 'material-1' })
    expect(business.state.htqdData).toEqual({ contractId: 'contract-1' })
    expect(business.getters.getPenetrateParams).toEqual({ year: '2026' })
    useContextStore().reset()
    expect(business.getters.getXqGlobalInfo).toEqual({})
    expect(business.state.htqdData).toEqual({})
  })

  it('preserves fixed tabs when legacy pages close a menu or update loading', () => {
    const tabs = useTabsStore()
    tabs.openTab({ path: '/finance/dashboard', title: '财务看板', meta: { id: 'finance' } })
    mapMutations(['removeTag']).removeTag('finance')
    expect(tabs.tabs.map((tab) => tab.path)).toEqual(['/home'])
    business.commit('closeCurrentTab')
    expect(tabs.tabs).toHaveLength(1)
    business.commit('showLoading')
    expect(useShellStore().isLoading).toBe(true)
    business.commit('hideLoading')
    expect(useShellStore().isLoading).toBe(false)
  })
})
