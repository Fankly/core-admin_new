import { getOfficeFileExtension } from '@/components/OfficePreview'

export interface ReviewMaterialFile {
  uuid?: string
  name?: string
  [key: string]: unknown
}

export const REVIEW_MATERIAL_PREVIEW_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xlsx', 'xls', 'et'])
export const REVIEW_MATERIAL_PREVIEW_TIP = '暂不支持预览该文件，仅支持 PDF、DOC、DOCX、XLSX、XLS、ET'

const MAX_PREVIEW_BYTES = 30 * 1024 * 1024

export const decodeReviewMaterialFileName = (value: unknown) => {
  let result = String(value ?? '').trim()
  if (!result) return '未命名附件'

  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(result)
      if (decoded === result) break
      result = decoded
    } catch {
      break
    }
  }

  return result
}

export const getReviewMaterialFileKey = (file: ReviewMaterialFile) => String(file.uuid || file.name || '')

export const getReviewMaterialFileName = (file: ReviewMaterialFile) => decodeReviewMaterialFileName(file.name)

export const isReviewMaterialPreviewable = (file: ReviewMaterialFile) => {
  const extension = getOfficeFileExtension(getReviewMaterialFileName(file))
  return Boolean(file.uuid && extension && REVIEW_MATERIAL_PREVIEW_EXTENSIONS.has(extension))
}

/** 下载接口直接返回文件流；若业务错误以 JSON/text Blob 返回，则提取正式错误信息。 */
export const resolveReviewMaterialPreviewBlob = async (response: unknown): Promise<Blob> => {
  let source = response
  if (source && typeof source === 'object' && !(source instanceof Blob) && !(source instanceof ArrayBuffer) && !(source instanceof Uint8Array)) {
    const result = source as { data?: unknown; success?: boolean; msg?: string; message?: string }
    if (result.data instanceof Blob || result.data instanceof ArrayBuffer || result.data instanceof Uint8Array) {
      source = result.data
    } else if (result.success === false || result.msg || result.message) {
      throw new Error(result.msg || result.message || '文件获取失败')
    } else {
      throw new Error('文件获取失败')
    }
  }

  const blob = source instanceof Blob ? source : new Blob([source as BlobPart])
  const contentType = String(blob.type || '').toLowerCase()
  if (contentType.includes('application/json') || contentType.includes('text/')) {
    const text = await blob.text()
    try {
      const result = JSON.parse(text)
      throw new Error(result?.msg || result?.message || '文件获取失败')
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(text.trim() || '文件获取失败')
      throw error
    }
  }

  if (!blob.size) throw new Error('文件内容为空')
  if (blob.size > MAX_PREVIEW_BYTES) {
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1)
    throw new Error(`文件过大（${sizeMb} MB），超过 30 MB 预览上限，请下载后本地查看`)
  }

  return blob
}
