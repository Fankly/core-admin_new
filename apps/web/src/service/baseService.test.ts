// @vitest-environment jsdom
import type { IncomingHttpHeaders, Server, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { CacheToken } from '@/constants/cacheKey'

interface ReceivedRequest {
  url: string
  headers: IncomingHttpHeaders
  body: Buffer
  response: ServerResponse
}

let server: Server
let baseUrl: string
let baseService: typeof import('./baseService').default
let http: typeof import('@/utils/http').default
const requests: ReceivedRequest[] = []
const waiters: ((request: ReceivedRequest) => void)[] = []

beforeAll(async () => {
  server = createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', request.headers['access-control-request-headers'] || '*')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.setHeader('Access-Control-Expose-Headers', 'filename')
    if (request.method === 'OPTIONS') {
      response.writeHead(204).end()
      return
    }
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const received = { url: request.url!, headers: request.headers, body: Buffer.concat(chunks), response }
      const waiter = waiters.shift()
      if (waiter) waiter(received)
      else requests.push(received)
    })
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('HTTP server did not bind a TCP port')
  baseUrl = `http://127.0.0.1:${address.port}`
  Object.assign(window, { SITE_CONFIG: { apiURL: baseUrl } })
  setActivePinia(createPinia())
  baseService = (await import('./baseService')).default
  http = (await import('@/utils/http')).default
})

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

afterAll(async () => {
  window.dispatchEvent(new Event('beforeunload'))
  server?.closeAllConnections()
  if (server?.listening)
    await new Promise<void>((resolve) =>
      server.close(() => {
        resolve()
      })
    )
})

const nextRequest = (): Promise<ReceivedRequest> => {
  const request = requests.shift()
  return request ? Promise.resolve(request) : new Promise((resolve) => waiters.push(resolve))
}

const respond = (request: ReceivedRequest, content = '{"success":true,"data":"ok"}', type = 'application/json') => {
  request.response.setHeader('Content-Type', type)
  request.response.end(content)
}

const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(String(reader.result))
    }
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.readAsText(blob)
  })

const expectSignature = (headers: IncomingHttpHeaders) => {
  expect(headers.random).toBeTruthy()
  expect(headers.timestamp).toBeTruthy()
  expect(Buffer.from(String(headers.sign), 'base64').toString()).toBe(`${headers.random}-${headers.timestamp}`)
}

describe('baseService with real browser request and file APIs', () => {
  it('sends multipart fields and original file bytes', async () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 255])
    const form = new FormData()
    form.append('title', 'upload report')
    form.append('file', new File([bytes], 'report.bin', { type: 'application/octet-stream' }))
    const pending = baseService.post('/upload', form)
    const request = await nextRequest()
    expect(request.headers['content-type']).toMatch(/^multipart\/form-data; boundary=/)
    expect(request.body.includes(Buffer.from(bytes))).toBe(true)
    expect(request.body.toString()).toContain('filename="report.bin"')
    expect(request.body.toString()).toContain('upload report')
    expectSignature(request.headers)
    respond(request)
    expect((await pending).success).toBe(true)
  })

  it('converts the unwrapped Blob to a data URL with its response filename', async () => {
    const content = '文件内容\nfile bytes'
    const pending = baseService.blob('/file')
    const request = await nextRequest()
    expectSignature(request.headers)
    request.response.setHeader('filename', 'report.txt')
    respond(request, content, 'text/plain')
    const result = await pending
    expect(result.name).toBe('report.txt')
    expect(result.url).toBe(`data:text/plain;base64,${Buffer.from(content).toString('base64')}`)
  })

  it('signs downloads and passes the received Blob to the browser save action', async () => {
    // jsdom 未实现文件保存，只替换此浏览器边界；HTTP、Blob 及 FileReader 使用真实实现。
    const NativeURL = URL
    const blobs: Blob[] = []
    const revoked: string[] = []
    class DownloadURL extends NativeURL {
      static createObjectURL(blob: Blob) {
        blobs.push(blob)
        return 'blob:download-test'
      }
      static revokeObjectURL(url: string) {
        revoked.push(url)
      }
    }
    vi.stubGlobal('URL', DownloadURL)
    const save = vi.spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').mockImplementation(() => true)
    const pending = baseService.download('/download', { id: 'file-1' }, 'download.txt')
    const request = await nextRequest()
    expectSignature(request.headers)
    expect(new NativeURL(request.url, baseUrl).searchParams.get('id')).toBe('file-1')
    respond(request, 'downloaded bytes', 'text/plain')
    await pending
    expect(blobs).toHaveLength(1)
    expect(await readBlob(blobs[0])).toBe('downloaded bytes')
    expect(save).toHaveBeenCalledOnce()
    expect((save.mock.instances[0] as HTMLAnchorElement).download).toBe('download.txt')
    expect(revoked).toEqual(['blob:download-test'])
  })
})

describe('HTTP in-flight request identity', () => {
  it('merges matching requests despite fresh signatures and header casing', async () => {
    const first = http({ url: '/same', headers: { 'X-Role': 'viewer', random: '1', timeStamp: '1', sign: 'first' } })
    const second = http({ url: '/same', headers: { 'x-role': 'viewer', random: '2', timeStamp: '2', sign: 'second' } })
    expect(first).toBe(second)
    respond(await nextRequest())
    expect(await first).toBe(await second)
  })

  it('keeps JSON and Blob responses separate for the same URL', async () => {
    const json = http({ url: '/response-types', responseType: 'json' })
    const blob = http({ url: '/response-types', responseType: 'blob' })
    expect(json).not.toBe(blob)
    respond(await nextRequest())
    respond(await nextRequest())
    expect((await json).data).toBe('ok')
    const file = (await blob) as unknown as Blob
    expect(file).toBeInstanceOf(Blob)
    expect(await readBlob(file)).toBe('{"success":true,"data":"ok"}')
  })

  it('keeps requests with different authorization headers separate', async () => {
    const first = http({ url: '/headers', headers: { Authorization: 'role-a' } })
    const second = http({ url: '/headers', headers: { Authorization: 'role-b' } })
    expect(first).not.toBe(second)
    const firstRequest = await nextRequest()
    const secondRequest = await nextRequest()
    expect([firstRequest.headers.authorization, secondRequest.headers.authorization].sort()).toEqual(['role-a', 'role-b'])
    respond(firstRequest)
    respond(secondRequest)
    await Promise.all([first, second])
  })

  it('captures each token before the asynchronous request interceptor runs', async () => {
    sessionStorage.setItem(`v1@${CacheToken}`, JSON.stringify({ token: 'session-a' }))
    const first = http({ url: '/tokens' })
    sessionStorage.setItem(`v1@${CacheToken}`, JSON.stringify({ token: 'session-b' }))
    const second = http({ url: '/tokens' })
    expect(first).not.toBe(second)
    const firstRequest = await nextRequest()
    const secondRequest = await nextRequest()
    expect([firstRequest.headers.token, secondRequest.headers.token].sort()).toEqual(['session-a', 'session-b'])
    respond(firstRequest)
    respond(secondRequest)
    await Promise.all([first, second])
  })

  it('never merges write requests with identical payloads', async () => {
    const first = http({ url: '/write', method: 'post', data: { id: 1 } })
    const second = http({ url: '/write', method: 'post', data: { id: 1 } })
    expect(first).not.toBe(second)
    respond(await nextRequest())
    respond(await nextRequest())
    await Promise.all([first, second])
  })

  it('keeps different service configurations separate', async () => {
    const first = http({ url: '/services', service: 'budget' })
    const second = http({ url: '/services', service: 'project' })
    expect(first).not.toBe(second)
    respond(await nextRequest())
    respond(await nextRequest())
    await Promise.all([first, second])
  })

  it('resolves the same relative path against each baseURL independently', async () => {
    const first = http({ url: 'item', baseURL: `${baseUrl}/first/` })
    const second = http({ url: 'item', baseURL: `${baseUrl}/second/` })
    expect(first).not.toBe(second)
    const firstRequest = await nextRequest()
    const secondRequest = await nextRequest()
    expect([firstRequest.url.split('?')[0], secondRequest.url.split('?')[0]].sort()).toEqual(['/first/item', '/second/item'])
    respond(firstRequest)
    respond(secondRequest)
    await Promise.all([first, second])
  })

  it('allows one independent signal to cancel without canceling the other request', async () => {
    const firstController = new AbortController()
    const secondController = new AbortController()
    const first = http({ url: '/cancel', signal: firstController.signal })
    const rejected = expect(first).rejects.toThrow()
    const second = http({ url: '/cancel', signal: secondController.signal })
    expect(first).not.toBe(second)
    const firstRequest = await nextRequest()
    const secondRequest = await nextRequest()
    firstController.abort()
    respond(firstRequest)
    respond(secondRequest)
    await rejected
    expect((await second).success).toBe(true)
  })
})
