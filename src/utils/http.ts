import app from '@/constants/app'
import router from '@/router'
import { IHttpResponse, IObject } from '@/types/interface'
import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import qs from 'qs'
import { getToken } from './cache'
import jsonBigint from './jsonBigint/index'

const JSONbigString = jsonBigint({ storeAsString: true })

const http = axios.create({
  baseURL: app.api,
  timeout: app.requestTimeout,
  transformResponse: [
    function (data) {
      if (typeof data === 'string') {
        try {
          return JSONbigString.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

// 频率限制：同一请求在窗口期内最多允许的次数
const FREQUENCY_WINDOW = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 40
// pending 兜底清理：正常请求在 finally 中移除，这里只处理异常残留
const PENDING_MAX_AGE = 5 * 60 * 1000
const CLEANUP_INTERVAL = 60 * 1000

// 进行中的请求，用于合并完全相同的并发请求
const pendingRequests = new Map<string, { promise: Promise<IHttpResponse>; timestamp: number }>()
// 请求频率记录
const requestFrequency = new Map<string, number[]>()

// 频率校验并记录本次请求，超限返回 false
const allowRequest = (key: string): boolean => {
  const now = Date.now()
  const timestamps = (requestFrequency.get(key) || []).filter((timestamp) => now - timestamp < FREQUENCY_WINDOW)
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    requestFrequency.set(key, timestamps)
    return false
  }
  timestamps.push(now)
  requestFrequency.set(key, timestamps)
  return true
}

// 清理残留的 pending 与过期的频率记录，避免 Map 无限增长
const cleanupExpired = () => {
  const now = Date.now()
  pendingRequests.forEach((value, key) => {
    if (now - value.timestamp > PENDING_MAX_AGE) {
      pendingRequests.delete(key)
    }
  })
  requestFrequency.forEach((timestamps, key) => {
    const valid = timestamps.filter((timestamp) => now - timestamp < FREQUENCY_WINDOW)
    if (valid.length) {
      requestFrequency.set(key, valid)
    } else {
      requestFrequency.delete(key)
    }
  })
}

const cleanupTimer = setInterval(cleanupExpired, CLEANUP_INTERVAL)

// 页面卸载时清理资源
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupTimer)
    pendingRequests.clear()
    requestFrequency.clear()
  })
}

// 参与签名的动态参数，需剔除后再比对请求是否相同
const DYNAMIC_KEYS = ['_t', 'timestamp', 'Request-Start']

const omitDynamicKeys = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object') return obj
  const filtered: IObject = { ...(obj as IObject) }
  DYNAMIC_KEYS.forEach((key) => {
    delete filtered[key]
  })
  return filtered
}

// FormData / Blob / 二进制无法稳定序列化，给一个唯一标记，避免不同请求算出同一个 key
let unserializableSeed = 0
const serializeData = (data: unknown): string => {
  if (data === undefined || data === null) return ''
  if (typeof data === 'string') return data
  if (typeof FormData !== 'undefined' && data instanceof FormData) return `formdata:${++unserializableSeed}`
  if (typeof Blob !== 'undefined' && data instanceof Blob) return `blob:${++unserializableSeed}`
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) return `binary:${++unserializableSeed}`
  try {
    return JSON.stringify(omitDynamicKeys(data)) ?? ''
  } catch {
    return `unserializable:${++unserializableSeed}`
  }
}

const getRequestIdentify = (config: AxiosRequestConfig): string => {
  const method = config.method?.toUpperCase() || 'GET'
  const url = config.url || ''
  const params = qs.stringify(omitDynamicKeys(config.params), { addQueryPrefix: true })
  const data = serializeData(config.data)

  // 使用简单哈希避免过长的 key，附带长度降低碰撞概率
  const content = `${method}:${url}${params}:${data}`
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i)
    hash = hash & hash // 转换为32位整数
  }
  return `req_${Math.abs(hash)}_${content.length}`
}

const getHttpErrorMessage = (status: number, url = ''): string => {
  const httpCodeLabel: IObject<string> = {
    400: '请求参数错误',
    401: '未授权，请登录',
    403: '拒绝访问',
    404: `请求地址出错: ${url}`,
    408: '请求超时',
    500: 'API接口报500错误',
    501: '服务未实现',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时',
    505: 'HTTP版本不受支持'
  }
  return httpCodeLabel[status] || '接口错误'
}

const redirectLogin = () => {
  router.replace('/login')
}

http.interceptors.request.use(
  function (config: InternalAxiosRequestConfig) {
    const headers: IObject = config.headers
    headers['X-Requested-With'] = 'XMLHttpRequest'
    headers['Request-Start'] = Date.now()
    headers['Accept-Language'] = 'zh-CN'
    const token = getToken()
    if (token) {
      headers['token'] = token
    }
    if (config.method?.toUpperCase() === 'GET') {
      config.params = { ...config.params, _t: Date.now() }
    }
    // Content-Type 可能带 charset，用包含判断
    const contentType = String(headers['Content-Type'] ?? headers['content-type'] ?? '')
    if (contentType.includes('application/x-www-form-urlencoded')) {
      config.data = qs.stringify(config.data)
    }

    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 业务层返回的 401（data 可能是 Blob / 字符串，取值需容错）
    if ((response.data as IObject)?.code === 401) {
      redirectLogin()
      throw new Error(getHttpErrorMessage(401))
    }
    return response
  },
  (error) => {
    const response = error?.response
    // 无响应：超时、断网或请求被取消
    if (!response) {
      const isTimeout = error?.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')
      return Promise.reject(new Error(isTimeout ? '请求超时' : '网络连接异常，请稍后再试'))
    }

    console.error('请求错误', response.data)
    const status = response.status || 500
    if (status === 401) {
      redirectLogin()
    }
    if (status === 302) {
      location.href = '/budget-process'
    }

    return Promise.reject(new Error(getHttpErrorMessage(status, error?.config?.url)))
  }
)

export default (config: AxiosRequestConfig): Promise<IHttpResponse> => {
  const key = getRequestIdentify(config)

  // 存在完全相同的进行中请求时，复用同一个 Promise
  const pending = pendingRequests.get(key)
  if (pending) return pending.promise

  if (!allowRequest(key)) {
    console.warn(`请求频率限制：${config.method?.toUpperCase() || 'GET'} ${config.url || ''} 请求过于频繁`)
    return Promise.reject(new Error('请求过于频繁,请稍后再试!'))
  }

  const promise = http(config)
    .then((res) => {
      // 把响应头挂到返回数据上，供业务层读取（字符串等非对象响应跳过）
      const data: IObject = res.data
      if (data && typeof data === 'object') {
        data.headers = res.headers
      }
      return data as IHttpResponse
    })
    .finally(() => {
      pendingRequests.delete(key)
    })

  pendingRequests.set(key, { promise, timestamp: Date.now() })

  return promise
}
