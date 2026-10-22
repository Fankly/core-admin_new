// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Spinner from './spinner.vue'

const wrappers: { unmount: () => void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => {
    wrapper.unmount()
  })
  vi.useRealTimers()
})
describe('loading spinner', () => {
  it('cancels short loads and removes animation even without a transition event', async () => {
    vi.useFakeTimers()
    const wrapper = mount(Spinner, { props: { spinning: true, minLoadingTime: 50 } })
    wrappers.push(wrapper)
    await wrapper.setProps({ spinning: false })
    await vi.advanceTimersByTimeAsync(60)
    expect(wrapper.find('.spinner-wrapper').exists()).toBe(false)
    await wrapper.setProps({ spinning: true })
    await vi.advanceTimersByTimeAsync(50)
    await nextTick()
    expect(wrapper.find('.spinner-wrapper').exists()).toBe(true)
    await wrapper.setProps({ spinning: false })
    await vi.advanceTimersByTimeAsync(500)
    await nextTick()
    expect(wrapper.find('.spinner-wrapper').exists()).toBe(false)
  })
})
