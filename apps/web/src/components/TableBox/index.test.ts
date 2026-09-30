// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import VxeUITable, { VxeColumn } from 'vxe-table'
import TableBox from './index.vue'

const disposers: Array<() => void> = []
const rows = [
  { id: 'first', name: '第一行' },
  { id: 'second', name: '第二行' }
]

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose())
})

function mountTable(type: 'checkbox' | 'radio', value: (typeof rows)[number] | typeof rows) {
  const wrapper = mount(TableBox, {
    props: { value, hasExtend: false },
    attrs: { data: rows, rowConfig: { keyField: 'id' } },
    global: { plugins: [VxeUITable] },
    slots: { default: () => [h(VxeColumn, { type }), h(VxeColumn, { field: 'name', title: '名称' })] }
  })
  disposers.push(() => wrapper.unmount())
  return wrapper
}

describe('TableBox', () => {
  it('使用真实 VXE 表格回显多选并保留选择事件和清空入口', async () => {
    const wrapper = mountTable('checkbox', [rows[0]])
    const table = wrapper.vm.getTableImpl()
    expect(table).toBeDefined()
    await vi.waitFor(() => expect(table?.getCheckboxRecords()).toEqual([rows[0]]))

    await table?.setCheckboxRow(rows[1], true)
    wrapper.vm.onCheckBoxChange()
    expect(wrapper.emitted('input')?.at(-1)).toEqual([rows])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([rows, true])
    expect(wrapper.emitted('checkbox-select-change')?.at(-1)).toEqual([rows])

    await wrapper.vm.clearCheckboxRow()
    expect(table?.getCheckboxRecords()).toEqual([])
  })

  it('回显单选并跟随 value 更新，透传单选事件', async () => {
    const wrapper = mountTable('radio', rows[0])
    const table = wrapper.vm.getTableImpl()
    await vi.waitFor(() => expect(table?.getRadioRecord()).toEqual(rows[0]))

    await wrapper.setProps({ value: rows[1] })
    await flushPromises()
    expect(table?.getRadioRecord()).toEqual(rows[1])
    wrapper.vm.onRadioSelectChange()
    expect(wrapper.emitted('input')?.at(-1)).toEqual([rows[1]])
    expect(wrapper.emitted('change')?.at(-1)).toEqual([rows[1], false])
    expect(wrapper.emitted('radio-select-change')?.at(-1)).toEqual([rows[1]])
  })

  it('保留刷新、行点击事件和行高切换方法', async () => {
    const wrapper = mountTable('checkbox', [])
    await flushPromises()
    wrapper.vm.refresh()
    wrapper.vm.currentChangeEvent({ row: rows[1] })
    wrapper.vm.onRowHeightToogle()
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    expect(wrapper.emitted('currentChangeEvent')).toEqual([[rows[1]]])
    expect(wrapper.vm.rowHeightClass).toBe('row-height-mini')
    wrapper.vm.onRowHeightToogle()
    expect(wrapper.vm.rowHeightClass).toBe('row-height-default')
  })
})
