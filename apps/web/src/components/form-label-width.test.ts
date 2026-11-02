// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { ElForm, ElFormItem } from 'element-plus'

describe('auto-width form labels', () => {
  it('unmounts an unmeasurable hidden form without registering an invalid width', async () => {
    const warning = vi.spyOn(console, 'warn')
    const wrapper = mount(ElForm, {
      props: { labelWidth: 'auto' },
      attrs: { style: 'display: none' },
      slots: { default: () => h(ElFormItem, { label: '项目名称' }) }
    })
    await nextTick()
    await nextTick()
    expect(wrapper.html()).not.toContain('NaN')
    wrapper.unmount()
    await nextTick()
    expect(warning).not.toHaveBeenCalled()
  })
})
