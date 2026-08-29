// mockjs 拦截到的请求上下文，body 为字符串（POST/PUT）或 null（GET/DELETE）
export interface MockOptions {
  url: string
  type: string
  body: any
}

// 后端统一响应结构：code === 0 / success: true 表示成功
export const success = <T = any>(data: T, msg = '操作成功') => ({
  code: 0,
  success: true,
  msg,
  data
})

export const fail = (msg = '操作失败', code = 500) => ({
  code,
  success: false,
  msg,
  data: null
})

// 解析 POST/PUT 请求体
export const parseBody = (options: MockOptions): Record<string, any> => {
  if (!options.body) return {}
  try {
    const parsed = JSON.parse(options.body)
    return parsed && typeof parsed === 'object' ? parsed : { value: parsed }
  } catch {
    return {}
  }
}

// 从 URL 上取 query 参数值（兼容 GET 自动追加的 _t 缓存戳）
export const getQueryValue = (url: string, key: string): string => {
  const match = url.match(new RegExp(`[?&]${key}=([^&#]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

// 生成分页结构，与后端 records/total 约定保持一致
export const pageResult = <T>(list: T[], current: number | string, size: number | string) => {
  const pageNum = Math.max(1, Number(current) || 1)
  const pageSize = Math.max(1, Number(size) || 20)
  const start = (pageNum - 1) * pageSize
  return {
    records: list.slice(start, start + pageSize),
    total: list.length,
    current: pageNum,
    size: pageSize,
    pages: Math.ceil(list.length / pageSize)
  }
}

/**
 * 返回二进制流（配合 mock/index.ts 对 MockXHR 的二进制补丁）。
 * 用于 previewAttach / 下载等 exportFile(responseType: 'blob') 接口。
 */
export const binaryResponse = (
  body: Blob | ArrayBuffer | Uint8Array,
  options?: { contentType?: string; fileName?: string; status?: number }
) => {
  const contentType = options?.contentType || (body instanceof Blob && body.type) || 'application/octet-stream'
  const headers: Record<string, string> = {
    'content-type': contentType
  }
  if (options?.fileName) {
    headers['content-disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(options.fileName)}`
  }
  return {
    __mockBinary: true as const,
    body,
    headers,
    status: options?.status || 200,
    statusText: 'OK'
  }
}
