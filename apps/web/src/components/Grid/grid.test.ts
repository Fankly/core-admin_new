// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Fragment, h, nextTick } from 'vue'
import Grid from './index.vue'
import GridItem from './components/GridItem.vue'

const wrappers: ReturnType<typeof mount>[] = []
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))

describe('Grid', () => {
  it('reserves the suffix column and can hide the item at index zero', async () => {
    const wrapper = mount(Grid, {
      props: { collapsed: true, cols: 1 },
      slots: {
        default: () => [h(Fragment, [h(GridItem, { index: 0 }, () => 'field')]), h(GridItem, { suffix: true }, () => 'actions')]
      }
    })
    wrappers.push(wrapper)
    await nextTick()
    const items = wrapper.findAllComponents(GridItem)
    expect(items[0].attributes('style')).toContain('display: none')
    expect(items[1].attributes('style')).not.toContain('display: none')
    await wrapper.setProps({ collapsed: false })
    expect(items[0].attributes('style')).not.toContain('display: none')
  })

  it('updates injected spacing and column count when parent props change', async () => {
    const wrapper = mount(Grid, {
      props: { cols: 4, gap: [20, 0] },
      slots: { default: () => h(GridItem, { offset: 1 }, () => 'field') }
    })
    wrappers.push(wrapper)
    expect(wrapper.findComponent(GridItem).attributes('style')).toContain('20px')
    await wrapper.setProps({ cols: 2, gap: [32, 8] })
    expect(wrapper.findComponent(GridItem).attributes('style')).toContain('32px')
    expect(wrapper.attributes('style')).toContain('repeat(2, minmax(0, 1fr))')
  })
})
