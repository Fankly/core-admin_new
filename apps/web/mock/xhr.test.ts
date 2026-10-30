// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest'
import axios from 'axios'
import Mock from 'mockjs'
import './xhr'

describe('MockJS HTTP responses', () => {
  beforeAll(() => {
    Mock.setup({ timeout: 0 })
  })

  it.each(['sync', 'async'])('returns HTTP 500 and rejects Axios when a %s handler fails', async (mode) => {
    const url = `/mock-quality/${mode}-error`
    Mock.mock(url, 'get', () => {
      if (mode === 'async') return Promise.reject(new Error('handler failed'))
      throw new Error('handler failed')
    })
    await expect(axios.get(url)).rejects.toMatchObject({
      response: {
        status: 500,
        statusText: 'Internal Server Error',
        data: { code: 500, success: false, msg: 'handler failed', data: null }
      }
    })
  })

  it.each(['sync', 'async'])('keeps successful %s JSON responses at HTTP 200', async (mode) => {
    const url = `/mock-quality/${mode}-success`
    const body = { code: 0, success: true, data: 'ok' }
    Mock.mock(url, 'get', () => (mode === 'async' ? Promise.resolve(body) : body))
    await expect(axios.get(url)).resolves.toMatchObject({ status: 200, statusText: 'OK', data: body })
  })

  it('preserves an explicit binary response status and content type', async () => {
    const url = '/mock-quality/binary'
    Mock.mock(url, 'get', () => ({
      __mockBinary: true,
      body: new Uint8Array([1, 2, 3]),
      status: 206,
      statusText: 'Partial Content',
      headers: { 'Content-Type': 'application/octet-stream' }
    }))
    const result = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' })
    expect(result.status).toBe(206)
    expect(result.headers['content-type']).toBe('application/octet-stream')
    expect(new Uint8Array(result.data)).toEqual(new Uint8Array([1, 2, 3]))
  })
})
