// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import app from '@/constants/app'
import RouteHost from '@/layouts/RouteHost.vue'
import { useTabsStore } from '@/store'
import ViewOutlet from './ViewOutlet.vue'

const cleanups: Array<() => void> = []
const originalKeepAlive = app.enabledKeepAlive

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => {
    cleanup()
  })
  app.enabledKeepAlive = originalKeepAlive
})

async function openView(path: string, children: RouteRecordRaw[]) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const tabs = useTabsStore(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/service', component: RouteHost, children }]
  })
  router.afterEach((to) => {
    tabs.openTab({ path: to.fullPath, title: to.path, meta: to.meta, keepAlive: true })
  })
  await router.push(path)
  const wrapper = mount(ViewOutlet, { global: { plugins: [pinia, router], stubs: { RouteLoading: true } } })
  cleanups.push(() => {
    wrapper.unmount()
  })
  await flushPromises()
  return { wrapper, router }
}

describe('route view props', () => {
  it.each([true, false])('does not pass iframe attributes to fragment pages (keepAlive=%s)', async (keepAlive) => {
    app.enabledKeepAlive = keepAlive
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Overview = defineComponent({
      setup() {
        const count = ref(0)
        return () => [h('h1', '业务总览'), h('button', { onClick: () => count.value++ }, String(count.value))]
      }
    })
    const { wrapper, router } = await openView('/service/overview/index', [
      { path: 'overview/index', component: Overview },
      { path: 'other', component: { render: () => h('div', '其他页面') } }
    ])
    expect(wrapper.findComponent(Overview).vm.$attrs).toEqual({})
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').text()).toBe('1')
    await router.push('/service/other')
    await flushPromises()
    await router.push('/service/overview/index')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('业务总览')
    expect(wrapper.findComponent(Overview).vm.$attrs).toEqual({})
    expect(warning).not.toHaveBeenCalled()
  })

  it.each([
    { keepAlive: true, frameSrc: 'https://example.com/embedded' },
    { keepAlive: true, frameSrc: undefined },
    { keepAlive: false, frameSrc: 'https://example.com/embedded' }
  ])('keeps frameInfo available to iframe pages (%j)', async ({ keepAlive, frameSrc }) => {
    app.enabledKeepAlive = keepAlive
    const Iframe = defineComponent({
      props: { frameInfo: Object },
      setup: () => () => h('iframe')
    })
    const path = '/service/frame?id=1'
    const { wrapper } = await openView(path, [{ path: 'frame', component: Iframe, meta: { isIframe: true, frameSrc } }])
    expect(wrapper.findComponent(Iframe).props('frameInfo')).toMatchObject({ fullPath: path })
    if (keepAlive && frameSrc) expect(wrapper.findComponent(Iframe).props('frameInfo')).toMatchObject({ frameSrc })
  })
})
