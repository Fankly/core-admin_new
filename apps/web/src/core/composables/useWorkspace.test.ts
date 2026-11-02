// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, KeepAlive, nextTick, reactive, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia } from 'pinia'
import { useCachedPage, useCachedSinglePage } from './useWorkspace'

describe('workspace composition lifecycles', () => {
  it('refreshes a cached page only when activated again', async () => {
    const onResume = vi.fn()
    const show = ref(true)
    const Page = defineComponent({
      name: '/test/cache',
      setup() {
        useCachedPage(onResume)
        return () => h('div', 'cached page')
      }
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Page }] })
    await router.push('/')
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(KeepAlive, null, { default: () => (show.value ? h(Page) : null) })
      }),
      { global: { plugins: [createPinia(), router] } }
    )
    expect(onResume).not.toHaveBeenCalled()
    show.value = false
    await nextTick()
    show.value = true
    await nextTick()
    expect(onResume).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('tracks reactive navigation keys without binding methods to an instance', async () => {
    const props = reactive({ _key: 'first', _origin: 'origin' })
    let api: ReturnType<typeof useCachedSinglePage> | undefined
    const Page = defineComponent({
      setup() {
        api = useCachedSinglePage(props)
        return () => h('div')
      }
    })
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Page }] })
    await router.push('/')
    const wrapper = mount(Page, { global: { plugins: [createPinia(), router] } })
    const reload = vi.fn()
    api?.singlePageReload(reload)
    api?.singlePageReload(reload)
    expect(reload).toHaveBeenCalledOnce()
    props._key = 'second'
    api?.singlePageReload(reload)
    expect(reload).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})
