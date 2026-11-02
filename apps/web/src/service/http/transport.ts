import axios, { AxiosHeaders } from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig, RawAxiosHeaders } from 'axios'
import qs from 'qs'
import jsonBigint from '@/utils/jsonBigint'
import { ApiError, getHttpStatusMessage, normalizeError } from './error'
import { getRequestKey, isMergeableMethod } from './request-key'
import type { ApiResponse, HttpRequestConfig } from './types'

export interface HttpClientOptions {
  baseURL: string
  timeout: number
  getToken?: () => string
  onUnauthorized?: () => void
}

/** 独立传输实例：请求缓存、拦截器与认证回调不依赖 Vue、Pinia 或路由。 */
export function createHttpClient(options: HttpClientOptions) {
  const JSONbigString = jsonBigint({ storeAsString: true })
  const client = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout,
    transformResponse: [
      (data: unknown) => {
        if (typeof data !== 'string') return data
        try {
          return JSONbigString.parse(data)
        } catch {
          return data
        }
      }
    ]
  })

  const pending = new Map<string, Promise<ApiResponse>>()

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const headers = config.headers as unknown as Record<string, unknown>
    headers['X-Requested-With'] = 'XMLHttpRequest'
    headers['Request-Start'] = Date.now()
    headers['Accept-Language'] = 'zh-CN'

    if (config.method?.toUpperCase() === 'GET') {
      config.params = { ...(config.params as Record<string, unknown> | undefined), _t: Date.now() }
    }
    const rawContentType = headers['Content-Type'] ?? headers['content-type']
    const contentType = typeof rawContentType === 'string' ? rawContentType : ''
    if (contentType.includes('application/x-www-form-urlencoded')) {
      config.data = qs.stringify(config.data)
    }
    return config
  })

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
      return Promise.reject(normalizeError(error))
    }
  )

  /** 把响应头挂成不可枚举属性，业务读取方便，同时不会污染 JSON / 导出数据。 */
  function attachHeaders(data: unknown, headers: unknown) {
    if (!data || typeof data !== 'object') return
    try {
      Object.defineProperty(data, 'headers', { value: headers, enumerable: false, configurable: true })
    } catch {
      // 冻结对象（部分 polyfill/二进制）无法扩展，忽略即可
    }
  }

  async function dispatch<T>(config: HttpRequestConfig): Promise<ApiResponse<T>> {
    const response = await client.request<unknown, AxiosResponse<unknown>>(config)
    const data = response.data

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const payload = data as Record<string, unknown>
      if (payload.code === 401) {
        throw new ApiError(getHttpStatusMessage(401), { status: 401, code: 401, url: config.url })
      }
      attachHeaders(data, response.headers)
    }
    return data as ApiResponse<T>
  }

  /**
   * 统一请求入口。
   *
   * 1. 调用时即固定 token，避免异步拦截器执行期间登录态切换。
   * 2. 只有 GET/HEAD/OPTIONS 参与合并；写请求永远独立发送。
   * 3. 所有失败都归一为 ApiError，业务层不再需要兼容裸字符串。
   */
  function request<T = unknown>(config: HttpRequestConfig): Promise<ApiResponse<T>> {
    const headers = new AxiosHeaders(config.headers as RawAxiosHeaders)
    const token = options.getToken?.() ?? ''
    if (token) headers.set('token', token)

    const requestConfig: HttpRequestConfig = { ...config, headers }
    const canMerge = !config.signal && !config.cancelToken && isMergeableMethod(config.method)
    const key = canMerge ? getRequestKey(requestConfig, client.defaults as HttpRequestConfig) : ''
    const existing = canMerge ? pending.get(key) : undefined
    if (existing) return existing as Promise<ApiResponse<T>>

    const promise = dispatch<T>(requestConfig)
      .catch((error: unknown) => {
        const normalized = normalizeError(error)
        // HTTP 401 与响应体 code: 401 统一在保留请求会话身份的位置处理。
        if (normalized.status === 401 && token === (options.getToken?.() ?? '')) options.onUnauthorized?.()
        throw normalized
      })
      .finally(() => {
        if (canMerge) pending.delete(key)
      })

    if (canMerge) pending.set(key, promise)
    return promise
  }

  return { client, request }
}
