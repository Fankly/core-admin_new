// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import OfficePreview from './index.vue'
import { extensionForType, inferType, resolveViewerFilename, validateFileBytes } from './detection'
import { getOfficeFileExtension } from './fileExtension'
import { loadSource, readBlobHeader } from './source'

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04])
const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
const wrappers: { unmount: () => void }[] = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => {
    wrapper.unmount()
  })
  vi.unstubAllGlobals()
})

describe('office preview source and lifecycle', () => {
  it('corrects converted file names and WPS types from file signatures', () => {
    const loaded = { name: 'report.doc', byteLength: 8 }
    expect(inferType(loaded, pdf, 'doc')).toBe('pdf')
    expect(extensionForType('word', loaded, zip)).toBe('docx')
    expect(extensionForType('excel', { ...loaded, name: 'budget.et' }, ole)).toBe('xls')
    expect(resolveViewerFilename('budget.et', 'xlsx')).toBe('budget.xlsx')
    expect(getOfficeFileExtension('report#2.DOCX')).toBe('docx')
    expect(() => {
      validateFileBytes('pdf', zip, 4)
    }).toThrow('PDF')
    expect(() => {
      validateFileBytes('word', zip, 0)
    }).toThrow('为空')
  })

  it('copies only a typed array view and respects cancelled reads', async () => {
    const bytes = new Uint8Array([1, ...pdf, 2])
    const loaded = await loadSource(bytes.subarray(1, 6))
    if (!loaded.buffer) throw new Error('Expected a buffer source')
    expect(new Uint8Array(loaded.buffer)).toEqual(pdf)
    bytes[1] = 0
    expect(new Uint8Array(loaded.buffer)).toEqual(pdf)
    const controller = new AbortController()
    controller.abort()
    await expect(readBlobHeader(new Blob([pdf]), controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('renders PDF without loading office engines and revokes URLs on replacement and unmount', async () => {
    const create = vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second')
    const revoke = vi.fn()
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: create, revokeObjectURL: revoke }))
    const wrapper = mount(OfficePreview, {
      props: { src: pdf.buffer, fileName: 'converted.doc' },
      global: {
        directives: { loading: () => {} },
        stubs: { ElEmpty: defineComponent(() => () => h('div')) }
      }
    })
    wrappers.push(wrapper)
    await flushPromises()
    expect(wrapper.get('iframe').attributes('src')).toBe('blob:first')
    await wrapper.get('iframe').trigger('load')
    expect(wrapper.emitted('rendered')).toEqual([['pdf']])
    await wrapper.setProps({ src: pdf.slice().buffer })
    await flushPromises()
    expect(revoke).toHaveBeenCalledWith('blob:first')
    expect(wrapper.get('iframe').attributes('src')).toBe('blob:second')
    wrapper.unmount()
    wrappers.pop()
    await nextTick()
    expect(revoke).toHaveBeenCalledWith('blob:second')
  })
})
