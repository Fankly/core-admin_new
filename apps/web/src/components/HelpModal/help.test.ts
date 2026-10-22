// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import type { EffectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { useHelp } from './useHelp'
import { formatHelpText } from './content'

const api = vi.hoisted(() => ({ menu: vi.fn(), help: vi.fn(), files: vi.fn(), download: vi.fn() }))
vi.mock('@/store', () => ({ useMenuStore: () => ({ menuMsg: { url: '/current' } }) }))
vi.mock('@/api/process', () => ({ getMenuMessage: api.menu }))
vi.mock('@/api/metrics', () => ({ getConfigByMenuId: api.help, listFj: api.files, downloadFj: api.download }))
const scopes: EffectScope[] = []
afterEach(() => {
  scopes.splice(0).forEach((scope) => {
    scope.stop()
  })
  vi.resetAllMocks()
  vi.unstubAllGlobals()
})
const setup = () => {
  const scope = effectScope()
  scopes.push(scope)
  const help = scope.run(() => useHelp({ showHelpInfo: false }))
  if (!help) throw new Error('Scope not initialized')
  return help
}

describe('help content', () => {
  it('loads attachments independently when help is disabled and ignores older responses', async () => {
    api.menu.mockResolvedValue({ success: true, data: { id: 'menu' } })
    api.help.mockResolvedValue({ success: true, data: { status: '0' } })
    let resolve!: (value: unknown) => void
    api.files.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    api.files.mockResolvedValue({ success: true, data: [{ uuid: 'new', fjmc: 'current.pdf' }] })
    const help = setup()
    const old = help.showModalHandle()
    await flushPromises()
    await help.showModalHandle()
    resolve({ success: true, data: [{ uuid: 'old', fjmc: 'old.pdf' }] })
    await old
    expect(help.attachments.value).toEqual([{ uuid: 'new', fjmc: 'current.pdf' }])
    expect(help.activeTab.value).toBe('attachments')
    expect(help.helpText.value).toBe('')
  })

  it('keeps a batch busy until its last download and prevents duplicate batches', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:file')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }))
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const resolvers: ((blob: Blob) => void)[] = []
    api.download.mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          resolvers.push(resolve)
        })
    )
    const help = setup()
    help.attachments.value = [
      { uuid: '1', fjmc: 'a.pdf' },
      { uuid: '2', fjmc: 'b%.pdf' }
    ]
    const pending = help.downloadAllFiles()
    await help.downloadAllFiles()
    expect(api.download).toHaveBeenCalledTimes(1)
    resolvers[0](new Blob(['first']))
    await flushPromises()
    expect(help.loading.value).toBe(true)
    expect(api.download).toHaveBeenCalledTimes(2)
    resolvers[1](new Blob(['second']))
    await pending
    expect(help.loading.value).toBe(false)
    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it('retains formatting while removing executable markup and event attributes', () => {
    const content = formatHelpText('**标题**\n<p onclick="alert(1)">正文</p><script>alert(1)</script><a href="javascript:alert(1)">链接</a>')
    expect(content).toContain('<strong>标题</strong><br>')
    expect(content).toContain('<p>正文</p>')
    expect(content).not.toContain('onclick')
    expect(content).not.toContain('script')
  })
})
