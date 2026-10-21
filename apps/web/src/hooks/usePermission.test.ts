// @vitest-environment jsdom
import { createServer } from 'node:http'
import type { Server, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, reactive } from 'vue'
import { PermissionInjectionKey } from '@/components/UserRoleSelector/interface'
import type { PermissionContext } from '@/components/UserRoleSelector/interface'

let server: Server
let usePermission: typeof import('./usePermission').usePermission
const waitingMenus = new Map<string, ServerResponse>()
const wrappers: ReturnType<typeof mount>[] = []

const respond = (response: ServerResponse, data: unknown) => {
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify({ code: 200, success: true, data }))
}

beforeAll(async () => {
  server = createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', '*')
    if (request.method === 'OPTIONS') {
      response.end()
      return
    }
    const url = new URL(request.url!, 'http://localhost')
    if (url.pathname === '/sys/menu/getMenuByUrl') {
      const path = url.searchParams.get('url')!
      if (path.startsWith('/slow')) waitingMenus.set(path, response)
      else respond(response, { outsideMenu: path })
    } else if (url.pathname === '/sysMenu/getButtonList') {
      respond(response, [url.searchParams.get('spRoleId')])
    } else {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = (server.address() as AddressInfo).port
  // 使用真实应用 HTTP 客户端，指向本地服务以验证请求参数和响应排序。
  Object.assign(window, { SITE_CONFIG: { apiURL: `http://127.0.0.1:${port}` } })
  ;({ usePermission } = await import('./usePermission'))
})

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => {
    wrapper.unmount()
  })
  waitingMenus.forEach((response) => {
    if (!response.writableEnded) respond(response, { outsideMenu: 'released' })
  })
  waitingMenus.clear()
})

afterAll(async () => {
  window.dispatchEvent(new Event('beforeunload'))
  await new Promise<void>((resolve, reject) =>
    server.close((error) => {
      error ? reject(error) : resolve()
    })
  )
})

const setupPermission = (context?: PermissionContext) => {
  let permission!: ReturnType<typeof usePermission>
  const wrapper = mount(
    defineComponent({
      setup() {
        permission = usePermission()
        return () => h('div')
      }
    }),
    { global: { provide: context ? { [PermissionInjectionKey as symbol]: context } : {} } }
  )
  wrappers.push(wrapper)
  return { permission, wrapper }
}

describe('usePermission', () => {
  it('lets the latest role replace an in-flight request', async () => {
    const { permission } = setupPermission()
    const oldRequest = permission.fetchPermissions('/slow-role', { spRoleId: 'OLD' })
    await expect.poll(() => waitingMenus.has('/slow-role')).toBe(true)
    expect(await permission.fetchPermissions('/current', { spRoleId: 'EDIT' })).toBe(true)
    respond(waitingMenus.get('/slow-role')!, { outsideMenu: '/old' })
    expect(await oldRequest).toBe(false)
    expect(permission.permissions.value).toEqual(['EDIT'])
    expect(permission.isLoading.value).toBe(false)
  })

  it('clears old permissions when the menu path or role is absent', async () => {
    const { permission } = setupPermission()
    await permission.fetchPermissions('/valid', { spRoleId: 'EDIT' })
    expect(permission.hasPermission('EDIT')).toBe(true)
    expect(await permission.fetchPermissions()).toBe(false)
    expect(permission.permissions.value).toEqual([])
    await permission.fetchPermissions('/valid', { spRoleId: 'EDIT' })
    expect(await permission.fetchPermissions('/valid')).toBe(false)
    expect(permission.permissions.value).toEqual([])
  })

  it('does not restore permissions after clear or unmount', async () => {
    const { permission, wrapper } = setupPermission()
    const pending = permission.fetchPermissions('/slow-clear', { spRoleId: 'EDIT' })
    await expect.poll(() => waitingMenus.has('/slow-clear')).toBe(true)
    permission.clearPermissions()
    respond(waitingMenus.get('/slow-clear')!, { outsideMenu: '/old' })
    expect(await pending).toBe(false)
    expect(permission.permissions.value).toEqual([])
    wrapper.unmount()
    expect(await permission.fetchPermissions('/valid', { spRoleId: 'EDIT' })).toBe(false)
  })

  it('uses reactive permissions provided by the parent', () => {
    const context = reactive<PermissionContext>({ permissions: ['EDIT'], isLoading: false })
    const { permission } = setupPermission(context)
    expect(permission.hasPermission('EDIT')).toBe(true)
    context.permissions = ['DELETE']
    context.isLoading = true
    expect(permission.hasPermission('EDIT')).toBe(false)
    expect(permission.hasAllPermissions(['DELETE'])).toBe(true)
    expect(permission.isLoading.value).toBe(true)
  })
})
