// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Base64 } from 'js-base64'
import LoginPage from './LoginPage.vue'
import { loginForDevelopment } from './development-login'

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), replace: vi.fn() }))
vi.mock('@/service/baseService', () => ({ default: { post: api.post, get: api.get } }))
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ replace: api.replace })
}))

let wrapper: ReturnType<typeof mount> | undefined

describe('login environment boundary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_APP_LOGIN_USER', 'local-test-user')
    vi.stubEnv('VITE_APP_LOGIN_PASSWORD', 'local-test-password')
    vi.stubEnv('VITE_APP_LOGIN_CAPTCHA', 'local-test-captcha')
    api.post.mockResolvedValue({ code: 0, data: { token: 'local-test-token' } })
    api.get.mockResolvedValue({ code: 0, data: true })
    api.replace.mockResolvedValue(undefined)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    sessionStorage.clear()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('shows the external entry hint in production and makes no login or permission requests', async () => {
    vi.stubEnv('DEV', false)
    wrapper = mount(LoginPage)
    await flushPromises()
    expect(wrapper.text()).toContain('请从企业统一入口访问')
    expect(wrapper.find('[aria-label="登录进度"]').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(api.post).not.toHaveBeenCalled()
    expect(api.get).not.toHaveBeenCalled()
    expect(api.replace).not.toHaveBeenCalled()
  })

  it('rejects direct use of the development helper in production', () => {
    vi.stubEnv('DEV', false)
    expect(() => loginForDevelopment()).toThrow('生产环境不提供联调登录')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('preserves the development login protocol and permission flow', async () => {
    wrapper = mount(LoginPage)
    await vi.waitFor(() => {
      expect(api.replace).toHaveBeenCalledWith('/home')
    })
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/login', {
      a: Base64.encode('local-test-user'),
      b: Base64.encode('local-test-password'),
      captcha: Base64.encode('local-test-captcha'),
      u: expect.any(String)
    })
    expect(api.get).toHaveBeenCalledExactlyOnceWith('/sysMenu/hasPermission')
  })
})
