// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElCheckboxGroup, ElRadioGroup } from 'element-plus'
import type { Component } from 'vue'
import DynamicForm from '@/components/DynamicForm/index.vue'
import DynamicFormXm from '@/components/DynamicFormXm/index.vue'
import DynamicFormNew from '@/components/DynamicFormNew/index.vue'
import TreeSelect from '@/components/ElTreeSelect/index.vue'
import CopyTextBox from '@/components/select/copyTextBox.vue'
import MultipleText from '@/components/ReMultipleText/src/index.vue'

vi.mock('@/service/baseService', () => ({ default: { post: vi.fn(), get: vi.fn() } }))
vi.mock('@/components/DynamicUpload/index.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/DynamicForm/components/DynamicUploadGroup.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/DynamicFormXm/components/DynamicUploadGroup.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/service/xq/components/relatedContract.vue', () => ({ default: { template: '<div />' } }))

const wrappers: { unmount: () => void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => {
    wrapper.unmount()
  })
  document.body.innerHTML = ''
})

describe('Element Plus migration', () => {
  it.each([
    ['DynamicForm', DynamicForm],
    ['DynamicFormXm', DynamicFormXm],
    ['DynamicFormNew', DynamicFormNew]
  ] as [string, Component][])('%s preserves numeric and string choice values', async (_name, component) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(component, {
      props: {
        globalParams: { choice: 0, choices: [1] },
        isChange: true,
        showActions: false,
        fields: [
          {
            prop: 'choice',
            label: '单选',
            type: 'radio',
            options: [
              { code: 0, name: '数字零' },
              { code: '2', name: '字符串二' }
            ]
          },
          {
            prop: 'choices',
            label: '多选',
            type: 'checkbox',
            options: [
              { code: 1, name: '数字一' },
              { code: '2', name: '字符串二' }
            ]
          }
        ]
      },
      global: { plugins: [ElementPlus] }
    })
    wrappers.push(wrapper)
    await flushPromises()
    expect(wrapper.getComponent(ElRadioGroup).props('modelValue')).toBe(0)
    expect(wrapper.getComponent(ElCheckboxGroup).props('modelValue')).toEqual([1])
    await wrapper.findAll('input[type="radio"]')[1].setValue()
    await wrapper.findAll('input[type="checkbox"]')[1].setValue(true)
    expect(wrapper.getComponent(ElRadioGroup).props('modelValue')).toBe('2')
    expect(wrapper.getComponent(ElCheckboxGroup).props('modelValue')).toEqual([1, '2'])
    expect(warn.mock.calls.flat().join(' ')).not.toContain('label act as value')
  })

  it('keeps Options API state and dialog actions when rendering SVG icons', async () => {
    const wrapper = mount(CopyTextBox, { global: { plugins: [ElementPlus] } })
    wrappers.push(wrapper)
    expect(wrapper.find('.el-input-group__append svg').exists()).toBe(true)
    await wrapper.get('.el-input-group__append button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.el-dialog').exists()).toBe(true)
    await wrapper.get('textarea').setValue('12\n34')
    const confirm = wrapper.findAll('.el-dialog button').find((button) => button.text() === '确定')
    expect(confirm).toBeDefined()
    await confirm?.trigger('click')
    expect(wrapper.get('input').element.value).toBe('12,34')
  })

  it('renders the batch-input default icon as an SVG component', () => {
    const wrapper = mount(MultipleText, { global: { plugins: [ElementPlus] } })
    wrappers.push(wrapper)
    expect(wrapper.find('.el-input-group__append svg').exists()).toBe(true)
  })

  it('teleports the tree dropdown and closes it after selecting a leaf', async () => {
    const wrapper = mount(TreeSelect, {
      attachTo: document.body,
      props: { data: [{ value: 'a', label: '甲' }], teleported: true, filterable: true },
      global: { plugins: [ElementPlus] }
    })
    wrappers.push(wrapper)
    await wrapper.get('.el-select__wrapper').trigger('click')
    await flushPromises()
    const dropdown = document.body.querySelector('.el-tree-select__popper')
    expect(dropdown).not.toBeNull()
    const selectElement = wrapper.get('.el-select').element as HTMLElement
    expect(selectElement.contains(dropdown)).toBe(false)
    dropdown?.querySelector<HTMLElement>('.el-tree-node__content')?.click()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a'])
    expect(wrapper.get('[role="combobox"]').attributes('aria-expanded')).toBe('false')
  })

  it('uses the configured number of visible collapsed tags', async () => {
    const wrapper = mount(TreeSelect, {
      props: {
        modelValue: ['a', 'b', 'c'],
        multiple: true,
        showCheckbox: true,
        collapseTags: true,
        collapseTagsLimit: 2,
        data: [
          { value: 'a', label: '甲' },
          { value: 'b', label: '乙' },
          { value: 'c', label: '丙' }
        ]
      },
      global: { plugins: [ElementPlus] }
    })
    wrappers.push(wrapper)
    await flushPromises()
    const tags = wrapper.findAll('.el-select__selection .el-tag').map((tag) => tag.text())
    expect(tags).toEqual(['甲', '乙', '+ 1'])
  })
})
