import Mock from 'mockjs'

type MockBinaryResult = {
  __mockBinary: true
  body: Blob | ArrayBuffer | Uint8Array
  headers?: Record<string, string>
  status?: number
  statusText?: string
}

const isMockBinaryResult = (value: unknown): value is MockBinaryResult =>
  !!value && typeof value === 'object' && (value as MockBinaryResult).__mockBinary === true

const isBinaryBody = (value: unknown): value is Blob | ArrayBuffer | Uint8Array => {
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return true
  if (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array) return true
  return false
}

const toBlob = (body: Blob | ArrayBuffer | Uint8Array, contentType?: string): Blob => {
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    if (contentType && !body.type) return new Blob([body], { type: contentType })
    return body
  }
  const type = contentType || 'application/octet-stream'
  if (typeof Uint8Array !== 'undefined' && body instanceof Uint8Array) {
    return new Blob([body], { type })
  }
  return new Blob([body as ArrayBuffer], { type })
}

const normalizeHeaders = (headers?: Record<string, string>) => {
  const result: Record<string, string> = {}
  if (!headers) return result
  Object.keys(headers).forEach((key) => {
    result[key.toLowerCase()] = headers[key]
  })
  return result
}

/**
 * MockJS 1.1.0 补丁：
 * 1) 未命中 mock 时，把 responseType 透传给原生 XHR（否则 blob/arraybuffer 读成文本，Excel zip 损坏）。
 * 2) 命中 mock 时支持返回 Blob/ArrayBuffer，以及 Promise（便于 fetch 本地样例文件）。
 *    官方实现一律 JSON.stringify，无法模拟 previewAttach 等二进制流接口。
 */
const mockXhrPrototype = Mock.XHR && Mock.XHR.prototype
if (mockXhrPrototype) {
  Object.defineProperty(mockXhrPrototype, 'responseType', {
    configurable: true,
    enumerable: true,
    get() {
      return this.custom?.xhr?.responseType || this.custom?.responseType || ''
    },
    set(value) {
      this.custom.responseType = value
      if (!this.match && this.custom.xhr) this.custom.xhr.responseType = value
    }
  })

  mockXhrPrototype.send = function send(data: any) {
    const that = this
    this.custom.options.body = data

    // 未命中 mock：走原生 XHR
    if (!this.match) {
      this.custom.xhr.send(data)
      return
    }

    this.setRequestHeader('X-Requested-With', 'MockXMLHttpRequest')
    this.dispatchEvent(new Event('loadstart'))

    const fireDone = () => {
      that.readyState = 4 // DONE
      that.dispatchEvent(new Event('readystatechange'))
      that.dispatchEvent(new Event('load'))
      that.dispatchEvent(new Event('loadend'))
    }

    const applyJsonBody = (payload: unknown) => {
      const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 4)
      const responseType = that.custom.responseType || ''
      that.custom.responseHeaders = {
        ...normalizeHeaders(that.custom.responseHeaders),
        'content-type': that.custom.responseHeaders?.['content-type'] || 'application/json; charset=utf-8'
      }
      that.status = 200
      that.statusText = 'OK'
      if (responseType === 'blob') {
        that.response = new Blob([text], { type: 'application/json' })
        that.responseText = text
      } else if (responseType === 'arraybuffer') {
        that.response = new TextEncoder().encode(text).buffer
        that.responseText = text
      } else {
        that.response = that.responseText = text
      }
    }

    const applyBinaryBody = (body: Blob | ArrayBuffer | Uint8Array, headers?: Record<string, string>, status = 200, statusText = 'OK') => {
      const merged = {
        ...normalizeHeaders(that.custom.responseHeaders),
        ...normalizeHeaders(headers)
      }
      if (!merged['content-type']) merged['content-type'] = 'application/octet-stream'
      that.custom.responseHeaders = merged
      that.status = status
      that.statusText = statusText

      const responseType = that.custom.responseType || ''
      const contentType = merged['content-type']
      if (responseType === 'arraybuffer') {
        if (body instanceof ArrayBuffer) {
          that.response = body
        } else if (body instanceof Uint8Array) {
          that.response = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
        } else {
          // Blob → 同步路径无法读 ArrayBuffer，退回 Blob（axios blob 模式更常见）
          that.response = body
        }
        that.responseText = ''
      } else {
        // blob / 默认：统一 Blob，贴合 exportFile(responseType: 'blob')
        that.response = toBlob(body, contentType)
        that.responseText = ''
      }
    }

    const resolveTemplate = () => {
      const item = that.custom.template
      try {
        const raw =
          typeof item.template === 'function' ? item.template(that.custom.options) : Mock.mock(item.template)

        const settle = (result: unknown) => {
          that.readyState = 2 // HEADERS_RECEIVED
          that.dispatchEvent(new Event('readystatechange'))
          that.readyState = 3 // LOADING
          that.dispatchEvent(new Event('readystatechange'))

          if (isMockBinaryResult(result)) {
            applyBinaryBody(result.body, result.headers, result.status || 200, result.statusText || 'OK')
          } else if (isBinaryBody(result)) {
            applyBinaryBody(result)
          } else {
            applyJsonBody(result)
          }
          fireDone()
        }

        if (raw && typeof (raw as Promise<unknown>).then === 'function') {
          ;(raw as Promise<unknown>).then(settle).catch((error: unknown) => {
            that.readyState = 2
            that.dispatchEvent(new Event('readystatechange'))
            that.readyState = 3
            that.dispatchEvent(new Event('readystatechange'))
            that.status = 500
            that.statusText = 'Internal Server Error'
            applyJsonBody({
              code: 500,
              success: false,
              msg: error instanceof Error ? error.message : 'mock binary load failed',
              data: null
            })
            fireDone()
          })
          return
        }

        settle(raw)
      } catch (error: unknown) {
        that.readyState = 2
        that.dispatchEvent(new Event('readystatechange'))
        that.readyState = 3
        that.dispatchEvent(new Event('readystatechange'))
        that.status = 500
        that.statusText = 'Internal Server Error'
        applyJsonBody({
          code: 500,
          success: false,
          msg: error instanceof Error ? error.message : 'mock handler error',
          data: null
        })
        fireDone()
      }
    }

    if (this.custom.async) setTimeout(resolveTemplate, this.custom.timeout)
    else resolveTemplate()
  }
}

// 全局响应延迟，模拟真实网络（可按需调整）
Mock.setup({ timeout: '200-600' })

// 各业务模块 mock，新增模块后在此 import 注册
import './modules/aiDocument'
import './modules/aiChat'
import './modules/budgetChanges'
import './modules/aiSmartTaskAudit'
import './modules/materialPriceLibrary'
import './modules/aiSmartReviewHome'
import './modules/aiAuditInuseRange'
import './modules/outsourceAdaptList'
import './modules/ownRealEstate'
import './modules/assetDetails'
import './modules/annualKeyTask'
import './modules/jointReview'
import './modules/aiReviewWorkBench'
import './modules/provinceTarget'
import './modules/matterBasic'
// 集中修改需复用 budgetChanges(单位/分类联动)、aiSmartTaskAudit(修改弹窗动态表单 fixture),
// 故放在这两个模块之后注册
import './modules/centralizedModification'
