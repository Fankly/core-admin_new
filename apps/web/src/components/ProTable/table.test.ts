// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { defineComponent, h } from 'vue'
import ProTable from './index.vue'
import type { ProTableInstance } from './interface'

const sorting = vi.hoisted(() => ({ onEnd: undefined as ((event: { newIndex: number; oldIndex: number }) => void) | undefined }))
vi.mock('sortablejs', () => ({
  default: {
    create: (_element: HTMLElement, options: { onEnd: typeof sorting.onEnd }) => {
      sorting.onEnd = options.onEnd
      return { destroy: vi.fn() }
    }
  }
}))
const wrappers: { unmount: () => void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => {
    wrapper.unmount()
  })
  sorting.onEnd = undefined
})
const options = () => ({
  plugins: [createPinia(), ElementPlus],
  stubs: {
    VxeModal: defineComponent({
      setup(_, { slots }) {
        return () => h('div', slots.default?.())
      }
    })
  }
})

describe('ProTable integration', () => {
  it('renders nested headers, forwards cell slots, keeps static pagination current and sorts the source page', async () => {
    const data = Array.from({ length: 25 }, (_, index) => ({ id: index + 1, name: `row-${String(index + 1)}` }))
    const requestApi = vi.fn()
    const wrapper = mount(ProTable, {
      props: {
        data,
        requestApi,
        requestAuto: true,
        toolButton: false,
        columns: [
          { type: 'sort', width: 30 },
          { label: 'Group', _children: [{ prop: 'name', label: 'Name' }] }
        ]
      },
      slots: { name: (scope: { row: { name: string } }) => h('span', `slot-${scope.row.name}`) },
      global: options()
    })
    wrappers.push(wrapper)
    const instance = wrapper.vm as unknown as ProTableInstance
    await flushPromises()
    expect(wrapper.text()).toContain('Group')
    expect(wrapper.text()).toContain('slot-row-1')
    expect(instance.pageable.total).toBe(25)
    expect(requestApi).not.toHaveBeenCalled()
    await instance.handleCurrentChange(2)
    await flushPromises()
    expect(instance.tableData[0].id).toBe(21)
    sorting.onEnd?.({ oldIndex: 0, newIndex: 1 })
    await flushPromises()
    expect(data[20].id).toBe(22)
    expect(data[21].id).toBe(21)
    expect(instance.tableData[0].id).toBe(22)
    await wrapper.setProps({ data: data.slice(0, 2) })
    expect(instance.pageable.current).toBe(1)
    expect(instance.pageable.total).toBe(2)
  })

  it('reacts to replacement columns and supplies typed search controls', async () => {
    const wrapper = mount(ProTable, { props: { columns: [], data: [], toolButton: false }, global: options() })
    wrappers.push(wrapper)
    const instance = wrapper.vm as unknown as ProTableInstance
    await wrapper.setProps({ columns: [{ prop: 'name', label: 'Keyword', search: { el: 'input', defaultValue: 'initial' } }] })
    await flushPromises()
    expect(wrapper.get('input').element.value).toBe('initial')
    await wrapper.get('input').setValue('edited')
    expect(instance.searchParam.name).toBe('edited')
    await instance.reset()
    await flushPromises()
    expect(wrapper.get('input').element.value).toBe('initial')
  })
})
