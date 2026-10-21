import { AxiosHeaders } from 'axios'
import type { AxiosRequestConfig, RawAxiosHeaders } from 'axios'
import qs from 'qs'
import type { HttpRequestConfig } from './types'

/** 参与签名/防缓存的动态字段，计算请求身份时必须剔除。 */
const DYNAMIC_KEYS = ['_t', 'timestamp', 'Request-Start']
const DYNAMIC_HEADERS = new Set(['request-start', 'random', 'timestamp', 'sign'])

let unserializableSeed = 0

const omitDynamicKeys = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !DYNAMIC_KEYS.includes(key)))
}

const serializeData = (data: unknown): string => {
  if (data === undefined || data === null) return ''
  if (typeof data === 'string') return data
  if (typeof FormData !== 'undefined' && data instanceof FormData) return `formdata:${String(++unserializableSeed)}`
  if (typeof Blob !== 'undefined' && data instanceof Blob) return `blob:${String(++unserializableSeed)}`
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) return `binary:${String(++unserializableSeed)}`
  try {
    return JSON.stringify(omitDynamicKeys(data))
  } catch {
    return `unserializable:${String(++unserializableSeed)}`
  }
}

/**
 * 生成可比较的请求身份。
 * 比较完整标识而不是哈希，避免碰撞导致两个业务请求被错误合并。
 */
export const getRequestKey = (config: HttpRequestConfig, defaults: AxiosRequestConfig): string => {
  const method = config.method?.toUpperCase() ?? 'GET'
  const headers = AxiosHeaders.concat(
    defaults.headers?.common as RawAxiosHeaders,
    defaults.headers?.[method.toLowerCase()] as RawAxiosHeaders,
    config.headers as RawAxiosHeaders
  )
  const stableHeaders = Object.entries(headers.toJSON())
    .map(([name, value]) => [name.toLowerCase(), value] as const)
    .filter(([name]) => !DYNAMIC_HEADERS.has(name))
    .sort(([left], [right]) => left.localeCompare(right))

  return JSON.stringify({
    method,
    url: config.url ?? '',
    baseURL: config.baseURL ?? defaults.baseURL,
    service: config.service,
    params: qs.stringify(omitDynamicKeys(config.params), { addQueryPrefix: true }),
    data: serializeData(config.data),
    responseType: config.responseType ?? defaults.responseType,
    headers: stableHeaders,
    auth: config.auth ?? defaults.auth,
    withCredentials: config.withCredentials ?? defaults.withCredentials,
    timeout: config.timeout ?? defaults.timeout
  })
}

/**
 * 只有幂等请求才允许合并。POST/PUT/PATCH/DELETE 的两次相同调用
 * 可能是用户两次独立提交，复用 Promise 会吞掉第二次业务动作。
 */
export const isMergeableMethod = (method?: string): boolean => {
  return ['GET', 'HEAD', 'OPTIONS'].includes((method ?? 'GET').toUpperCase())
}
