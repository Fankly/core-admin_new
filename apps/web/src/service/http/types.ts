import type { AxiosRequestConfig, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'

/** 业务侧统一响应包。data 的具体形状由调用方通过泛型补齐。 */
export interface ApiResponse<T = unknown> {
  code: number
  success: boolean
  msg: string
  data: T
  headers?: AxiosResponseHeaders | RawAxiosResponseHeaders
  [key: string]: unknown
}

export interface HttpRequestConfig extends AxiosRequestConfig {
  /** 多服务网关的 service 标识；参与请求去重身份计算 */
  service?: string
}
