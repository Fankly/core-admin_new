const HTTP_STATUS_MESSAGE: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请登录',
  403: '拒绝访问',
  404: '请求地址不存在',
  408: '请求超时',
  500: '服务端处理失败',
  501: '服务未实现',
  502: '网关错误',
  503: '服务不可用',
  504: '网关超时',
  505: 'HTTP 版本不受支持'
}

export interface ApiErrorOptions {
  status?: number
  code?: number
  url?: string
  cause?: unknown
}

/** 传输层/业务层错误统一形态，调用方只需判断 message / status。 */
export class ApiError extends Error {
  readonly status?: number
  readonly code?: number
  readonly url?: string

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.url = options.url
  }
}

export const getHttpStatusMessage = (status: number, url = ''): string => {
  if (status === 404 && url) return `请求地址出错: ${url}`
  return HTTP_STATUS_MESSAGE[status] ?? '接口错误'
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** 把 axios 错误（或任意抛出物）归一成 ApiError，避免调用方拿到裸字符串。 */
export const normalizeError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error

  if (isRecord(error) && 'response' in error) {
    const response = error.response
    const config = isRecord(error.config) ? error.config : {}
    const status = isRecord(response) && typeof response.status === 'number' ? response.status : 500
    const url = typeof config.url === 'string' ? config.url : ''
    return new ApiError(getHttpStatusMessage(status, url), { status, url, cause: error })
  }

  if (isRecord(error) && typeof error.message === 'string') {
    const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message)
    return new ApiError(isTimeout ? '请求超时' : error.message, { cause: error })
  }

  return new ApiError('网络连接异常，请稍后再试', { cause: error })
}
