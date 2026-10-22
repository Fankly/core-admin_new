import { getOfficeFileExtension } from './fileExtension'
import type { LoadedSource } from './source'
import type { OfficeFileType, OfficeRendererType } from './types'
import { isOleSpreadsheetExt, isOleWordExt, isSpreadsheetNativeExt, isWordNativeExt, isZipSpreadsheetExt, isZipWordExt } from './types'

const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08]
]
const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]

const startsWith = (bytes: Uint8Array, signature: number[]) => signature.every((value, index) => bytes[index] === value)
const isZip = (bytes: Uint8Array) => ZIP_SIGNATURES.some((signature) => startsWith(bytes, signature))
const isOle = (bytes: Uint8Array) => startsWith(bytes, OLE_SIGNATURE)
const isPdf = (bytes: Uint8Array) => startsWith(bytes, PDF_SIGNATURE)

const normalizeType = (value?: string): OfficeRendererType | null => {
  const type = value?.toLowerCase().replace(/^\./, '')
  if (type === 'pdf') return 'pdf'
  if (type === 'word' || type === 'docx' || type === 'doc') return 'word'
  // et：WPS 表格，按 Excel 渲染（OLE 走 xls 转换，ZIP 走 xlsx）
  if (type === 'excel' || type === 'xlsx' || type === 'xls' || type === 'et') return 'excel'
  return null
}

/**
 * 交给 file-viewer 的扩展名。
 * 扩展名与文件头冲突时以文件头为准：后端转换后常沿用原扩展名（.doc 里其实是 OpenXML），
 * 按名字选渲染器会用二进制 doc 解析器去读 ZIP 包而失败。
 * 另外 @file-viewer/renderer-spreadsheet 只认 xlsx/xls/csv/ods 等，不认 WPS 的 et。
 */
export const extensionForType = (type: OfficeRendererType, loaded: LoadedSource, headerBytes: Uint8Array | null, fileName?: string) => {
  const fromName = getOfficeFileExtension(fileName || loaded.name) || ''

  if (type === 'pdf') return 'pdf'

  if (type === 'word') {
    if (headerBytes && isZip(headerBytes)) return isZipWordExt(fromName) ? fromName : 'docx'
    if (headerBytes && isOle(headerBytes)) return isOleWordExt(fromName) ? fromName : 'doc'
    if (isWordNativeExt(fromName)) return fromName
    return 'docx'
  }

  {
    // et / 未知 / 与文件头不符的扩展名：按魔数映射到 spreadsheet 能识别的类型
    if (headerBytes && isZip(headerBytes)) return isZipSpreadsheetExt(fromName) ? fromName : 'xlsx'
    if (headerBytes && isOle(headerBytes)) return isOleSpreadsheetExt(fromName) ? fromName : 'xls'
    if (isSpreadsheetNativeExt(fromName)) return fromName
    // 无文件头时：et 历史形态多为 OLE，默认按 xls 尝试
    if (fromName === 'et') return 'xls'
    return 'xlsx'
  }
}

/** 让 viewer 拿到与实际渲染类型一致的扩展名（.et、或后端转换后仍沿用的旧扩展名都在这里纠正） */
export const resolveViewerFilename = (displayName: string, renderExt: string) => {
  const ext = getOfficeFileExtension(displayName)
  if (ext === renderExt) return displayName
  const base = ext ? displayName.slice(0, -(ext.length + 1)) : displayName
  return `${base || 'preview'}.${renderExt}`
}

export const inferType = (loaded: LoadedSource, bytes: Uint8Array | null, fileType?: OfficeFileType, fileName?: string): OfficeRendererType => {
  // 文件头优先：后端把 doc/docx 转成 PDF 后文件名与 fileType 往往仍是 .doc，
  // 只有内容能说明真实类型，否则会被送进 word 渲染器并在校验时报「不支持的类型」。
  if (bytes && isPdf(bytes)) return 'pdf'

  const explicitType = normalizeType(fileType)
  if (explicitType) return explicitType

  const nameType = normalizeType(getOfficeFileExtension(fileName || loaded.name))
  if (nameType) return nameType

  const mime = loaded.mime?.split(';')[0].trim().toLowerCase()
  if (mime === 'application/pdf') return 'pdf'
  if (mime?.includes('wordprocessingml') || mime === 'application/msword') return 'word'
  if (mime?.includes('spreadsheetml') || mime === 'application/vnd.ms-excel' || mime === 'application/vnd.ms-excel.et') {
    return 'excel'
  }

  if (bytes) {
    if (isOle(bytes)) return 'excel'
    // docx 和 xlsx 都是 ZIP 容器，仅凭文件头区分，必须由名称或 fileType 补充语义。
    if (isZip(bytes)) throw new Error('仅支持 PDF、DOC、DOCX、XLSX、XLS 和 ET,其他类型文件请下载后在本地查看！')
  }
  throw new Error('仅支持 PDF、DOC、DOCX、XLSX、XLS 和 ET,其他类型文件请下载后在本地查看！')
}

export const validateFileBytes = (type: OfficeRendererType, bytes: Uint8Array, byteLength: number) => {
  if (!byteLength) throw new Error('文件内容为空')

  // 走到这里说明 fileType/文件名声明了 pdf，但内容不是 PDF（常见于后端转换失败或返回了错误页）
  if (type === 'pdf' && !isPdf(bytes)) {
    throw new Error('文件内容不是有效的 PDF，请重试或下载后在本地查看')
  }
  if (type === 'word' && !isZip(bytes) && !isOle(bytes)) {
    throw new Error('仅支持 PDF、DOC、DOCX、XLSX、XLS 和 ET,其他类型文件请下载后在本地查看！')
  }
  if (type === 'excel' && !isZip(bytes) && !isOle(bytes)) {
    throw new Error('仅支持 PDF、DOC、DOCX、XLSX、XLS 和 ET,其他类型文件请下载后在本地查看！')
  }
}
