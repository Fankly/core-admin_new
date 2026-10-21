/**
 * 兼容入口。
 * 请求实现已迁到 `@/service/http`，这里保留默认导出，避免既有业务文件一次性改 import。
 */
export { default } from '@/service/http/client'
export type { ApiResponse, HttpRequestConfig } from '@/service/http/types'
