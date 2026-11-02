// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import BaseSelect from './AutoImport/BaseSelect/index.vue'
import BaseTag from './AutoImport/BaseTag/index.vue'
import TreeSelect from './TreeSelect/index.vue'
import CopyTextBox from './select/copyTextBox.vue'
import BaseScrollbar from './AutoImport/BaseScrollbar/index.vue'
import OverviewSelect from '@/views/service/overview/components/OverviewSelect.vue'

const wrappers: { unmount: () => void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
const SelectStub = defineComponent({
  props: ['modelValue'],
  emits: ['update:modelValue', 'change'],
  setup(props, { slots, expose }) {
    expose({ blur: vi.fn() })
    return () => h('div', { 'data-value': props.modelValue }, slots.default?.())
  }
})
const slotStub = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.())
})

describe('Vue composition migration', () => {
  it('keeps accessible select IDs unique across component instances', () => {
    const props = { modelValue: 'one', label: '单位', options: [{ label: '一', value: 'one' }] }
    const wrapper = mount(defineComponent({ setup: () => () => h('div', [h(OverviewSelect, props), h(OverviewSelect, props)]) }))
    wrappers.push(wrapper)
    const [first, second] = wrapper.findAllComponents(OverviewSelect)
    const firstId = first.get('.filter-label').attributes('id')
    const secondId = second.get('.filter-label').attributes('id')
    expect(firstId).not.toBe(secondId)
    expect(first.get('[role="combobox"]').attributes('aria-labelledby').split(' ')).toContain(firstId)
    expect(second.get('[role="combobox"]').attributes('aria-labelledby').split(' ')).toContain(secondId)
  })

  it('keeps controlled selection, compatibility events, and attribute fallthrough', async () => {
    const wrapper = mount(BaseSelect, {
      props: { modelValue: 'first' },
      attrs: { 'aria-label': '单位', options: [{ label: '一', value: 'first' }] },
      global: { stubs: { ElSelect: SelectStub, ElOption: slotStub } }
    })
    wrappers.push(wrapper)
    const select = wrapper.findComponent(SelectStub)
    expect(select.props('modelValue')).toBe('first')
    expect(select.attributes('aria-label')).toBe('单位')
    select.vm.$emit('update:modelValue', 'second')
    select.vm.$emit('change', 'second')
    expect(wrapper.emitted('update:modelValue')).toEqual([['second']])
    expect(wrapper.emitted('input')).toEqual([['second']])
    expect(wrapper.emitted('change')).toEqual([['second']])
    await wrapper.setProps({ modelValue: 'second' })
    expect(select.props('modelValue')).toBe('second')
  })

  it('recomputes presentation when props change', async () => {
    const wrapper = mount(BaseTag, { props: { type: 'success' }, global: { stubs: { ElTag: slotStub } } })
    wrappers.push(wrapper)
    expect(wrapper.find('circle').attributes('fill')).toBe('#67c23a')
    await wrapper.setProps({ type: 'danger' })
    expect(wrapper.find('circle').attributes('fill')).toBe('#E84E4E')
  })

  it('preserves initial tree selection, prop watchers, public methods, and clear events', async () => {
    const setCurrentKey = vi.fn()
    const setCheckedKeys = vi.fn()
    const tree = defineComponent({
      setup(_, { expose }) {
        expose({ setCurrentKey, setCheckedKeys, getCheckedNodes: () => [], getCheckedKeys: () => [] })
        return () => h('div')
      }
    })
    const wrapper = mount(TreeSelect, {
      props: {
        modelValue: 'one',
        data: [
          { id: 'one', label: '一' },
          { id: 'two', label: '二' }
        ],
        nodeKey: 'id'
      },
      global: { stubs: { ElSelect: SelectStub, ElOption: slotStub, ElTree: tree } }
    })
    wrappers.push(wrapper)
    await nextTick()
    expect(wrapper.vm.selectedLabel).toBe('一')
    await wrapper.setProps({ modelValue: 'two' })
    await nextTick()
    expect(wrapper.vm.selectedLabel).toBe('二')
    expect(setCurrentKey).toHaveBeenLastCalledWith('two')
    wrapper.vm.clearSelected()
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(setCurrentKey).toHaveBeenLastCalledWith(null)
  })

  it('keeps parent ref methods and their reactive results', async () => {
    const wrapper = mount(CopyTextBox, { global: { stubs: { ElInput: true, ElDialog: true, ElButton: true, ElIcon: slotStub } } })
    wrappers.push(wrapper)
    wrapper.vm.setValue('12\n34')
    await nextTick()
    expect(wrapper.vm.newArr).toEqual(['0000000012', '0000000034'])
    expect(wrapper.vm.text).toBe('12,34')
    wrapper.vm.clear()
    expect(wrapper.vm.ids).toBe('')
    expect(wrapper.vm.newArr).toEqual([])
  })

  it('disconnects observers and cancels deferred scrollbar updates on unmount', async () => {
    vi.useFakeTimers()
    const resizeDisconnect = vi.fn()
    const mutationDisconnect = vi.fn()
    let notifyMutation: (() => void) | undefined
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect = resizeDisconnect
      }
    )
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: (records: { type: string }[]) => void) {
          notifyMutation = () => callback([{ type: 'childList' }])
        }
        observe() {}
        disconnect = mutationDisconnect
      }
    )
    const update = vi.fn()
    const scrollbar = defineComponent({
      setup(_, { slots, expose }) {
        expose({ update })
        return () => h('div', slots.default?.())
      }
    })
    const wrapper = mount(BaseScrollbar, { global: { stubs: { ElScrollbar: scrollbar } } })
    await nextTick()
    notifyMutation?.()
    notifyMutation?.()
    await nextTick()
    wrapper.unmount()
    const calls = update.mock.calls.length
    await vi.advanceTimersByTimeAsync(200)
    expect(resizeDisconnect).toHaveBeenCalledOnce()
    expect(mutationDisconnect).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledTimes(calls)
  })
})
