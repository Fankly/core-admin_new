import type { OfficePreviewSource } from './types'

export interface LoadedSource {
  /** Word/Excel 优先保留 Blob，避免整文件再读成 ArrayBuffer 造成双份内存 */
  buffer?: ArrayBuffer
  blob?: Blob
  name?: string
  mime?: string
  byteLength: number
}

export const HEADER_READ_LENGTH = 8
const MAX_PREVIEW_BYTES = 30 * 1024 * 1024
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${String(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const assertPreviewSize = (byteLength: number) => {
  if (byteLength > MAX_PREVIEW_BYTES) {
    throw new Error(`文件过大（${formatFileSize(byteLength)}），超过 ${formatFileSize(MAX_PREVIEW_BYTES)} 预览上限，请下载后本地查看`)
  }
}

/** 从 Uint8Array 拷贝出独立 ArrayBuffer（兼容 SharedArrayBuffer / ArrayBufferLike） */
const copyUint8ArrayToArrayBuffer = (source: Uint8Array): ArrayBuffer => {
  const out = new ArrayBuffer(source.byteLength)
  new Uint8Array(out).set(source)
  return out
}

const readBlob = (blob: Blob, signal?: AbortSignal) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('文件读取已取消', 'AbortError'))
      return
    }
    const reader = new FileReader()
    const abort = () => {
      reader.abort()
    }
    signal?.addEventListener('abort', abort, { once: true })
    reader.onloadend = () => signal?.removeEventListener('abort', abort)
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result)
      else reject(new Error('文件读取失败'))
    }
    reader.onerror = () => {
      reject(reader.error || new Error('文件读取失败'))
    }
    reader.onabort = () => {
      reject(new DOMException('文件读取已取消', 'AbortError'))
    }
    reader.readAsArrayBuffer(blob)
  })

export const readBlobHeader = async (blob: Blob, signal?: AbortSignal, length = HEADER_READ_LENGTH) => {
  const slice = blob.slice(0, Math.min(length, blob.size))
  const buffer = await readBlob(slice, signal)
  return new Uint8Array(buffer)
}

const parseResponseFileName = (disposition: string | null) => {
  if (!disposition) return undefined
  const utf8Name = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const normalName = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const value = utf8Name || normalName
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const getUrlFileName = (url: string) => {
  try {
    const path = new URL(url, window.location.href).pathname
    return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1)) || undefined
  } catch {
    return url.split(/[?#]/)[0].split('/').pop() || undefined
  }
}

/**
 * 加载数据源。
 * - URL：预下载（鉴权、体积校验、类型探测）
 * - Blob/File：尽量只读文件头，正文交给渲染器消费 Blob
 * - ArrayBuffer / Uint8Array：拷贝后使用
 */
export const loadSource = async (
  source: Exclude<OfficePreviewSource, null | undefined>,
  requestOptions?: RequestInit,
  signal?: AbortSignal
): Promise<LoadedSource> => {
  if (typeof source === 'string') {
    const url = source.trim()
    if (!url) throw new Error('文件地址不能为空')

    const response = await fetch(url, {
      ...requestOptions,
      signal
    })
    if (!response.ok) throw new Error(`文件下载失败（HTTP ${String(response.status)}）`)

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > 0) assertPreviewSize(contentLength)

    const blob = await response.blob()
    assertPreviewSize(blob.size)
    return {
      blob,
      name: parseResponseFileName(response.headers.get('content-disposition')) || getUrlFileName(url),
      mime: response.headers.get('content-type') || blob.type || undefined,
      byteLength: blob.size
    }
  }

  if (source instanceof ArrayBuffer) {
    assertPreviewSize(source.byteLength)
    return { buffer: source.slice(0), byteLength: source.byteLength }
  }

  if (source instanceof Uint8Array) {
    assertPreviewSize(source.byteLength)
    return {
      buffer: copyUint8ArrayToArrayBuffer(source),
      byteLength: source.byteLength
    }
  }

  if (source instanceof Blob) {
    assertPreviewSize(source.size)
    const fileName = typeof File !== 'undefined' && source instanceof File ? source.name : undefined
    return {
      blob: source,
      name: fileName,
      mime: source.type || undefined,
      byteLength: source.size
    }
  }

  throw new Error('不支持的文件数据源')
}
