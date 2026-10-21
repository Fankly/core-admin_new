import type { Method } from 'axios'
import { Base64 } from 'js-base64'
import type { IObject } from '@/types/interface'
import request from '@/service/http/client'
import type { ApiResponse } from '@/service/http/types'

interface Signature {
  random: number
  timeStamp: number
  sign: string
}

interface OtherParams {
  service: string
}

/** 业务接口默认返回包。具体 data 形状由各 api 文件用泛型声明。 */
export type ServiceResult<T = unknown> = ApiResponse<T>

const REQUEST_TIMEOUT = 3600000

function generateSignature(): Signature {
  const timeStamp = Date.now()
  const random = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function' ? crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000 : Math.random()
  return { random, timeStamp, sign: Base64.encode(`${random}-${timeStamp}`) }
}

function createHeaders(extraHeaders?: IObject, body?: unknown): IObject {
  const signature = generateSignature()
  // FormData 的 Content-Type 与 boundary 必须由浏览器生成，设置 JSON 头会丢文件。
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json;charset=UTF-8' }),
    ...signature,
    ...extraHeaders
  }
}

/** 常用 CRUD。只负责拼装签名/超时/内容类型，业务语义留在 api 层。 */
export default {
  delete<T = unknown>(path: string, params?: IObject, otherParams?: OtherParams): Promise<ServiceResult<T>> {
    return request<T>({ url: path, timeout: REQUEST_TIMEOUT, headers: createHeaders(undefined, params), data: params, method: 'DELETE', ...otherParams })
  },

  get<T = unknown>(path: string, params?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<ServiceResult<T>> {
    return request<T>({ url: path, params, timeout: REQUEST_TIMEOUT, headers: createHeaders(headers), method: 'GET', ...otherParams })
  },

  put<T = unknown>(path: string, params?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<ServiceResult<T>> {
    return request<T>({ url: path, data: params, timeout: REQUEST_TIMEOUT, headers: createHeaders(headers, params), method: 'PUT', ...otherParams })
  },

  post<T = unknown>(path: string, body?: IObject | FormData, headers?: IObject, otherParams?: OtherParams): Promise<ServiceResult<T>> {
    return request<T>({ url: path, timeout: REQUEST_TIMEOUT, headers: createHeaders(headers, body), data: body, method: 'POST', ...otherParams })
  },

  export<T = unknown>(path: string, body?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<ServiceResult<T>> {
    return request<T>({ url: path, method: 'post', responseType: 'blob', timeout: REQUEST_TIMEOUT, headers: createHeaders(headers, body), data: body, ...otherParams })
  },

  exportGet<T = unknown>(path: string, params?: IObject, headers?: IObject, otherParams?: OtherParams): Promise<ServiceResult<T>> {
    return request<T>({ url: path, method: 'get', responseType: 'blob', timeout: REQUEST_TIMEOUT, headers: createHeaders(headers), params, ...otherParams })
  },

  /** 下载文件：签名、Blob 获取与浏览器保存动作保持一致。 */
  async download(path: string, params?: IObject, filename?: string, method: Method = 'get', otherParams?: OtherParams): Promise<void> {
    const isPost = method.toLowerCase() === 'post'
    const data = (await request({
      url: path,
      method,
      responseType: 'blob',
      timeout: REQUEST_TIMEOUT,
      headers: createHeaders(undefined, isPost ? params : undefined),
      ...(isPost ? { data: params } : { params }),
      ...otherParams
    })) as unknown as Blob

    const anchor = document.createElement('a')
    anchor.download = filename || Date.now().toString()
    const blobUrl = URL.createObjectURL(data)
    anchor.href = blobUrl
    anchor.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: false }))
    URL.revokeObjectURL(blobUrl)
  },

  /** 获取 Blob 并转成 Data URL，供预览组件使用。 */
  async blob(requestUrl: string, otherParams?: OtherParams): Promise<{ name: string; url: string }> {
    const data = (await request({
      url: requestUrl,
      responseType: 'blob',
      timeout: REQUEST_TIMEOUT,
      headers: createHeaders(),
      ...otherParams
    })) as unknown as Blob & { headers?: Record<string, string> }
    const fileName = data.headers?.filename ?? ''

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('读取文件失败'))
          return
        }
        resolve({ name: fileName, url: reader.result })
      }
      reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'))
      reader.onabort = () => reject(new DOMException('文件读取已取消', 'AbortError'))
      reader.readAsDataURL(data)
    })
  }
}
