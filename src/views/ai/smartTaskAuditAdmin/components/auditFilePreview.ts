import type { TXmAttach } from '@/api/ai/smartTaskAudit'
import { getOfficeFileExtension } from '@/components/OfficePreview'

// doc：后端已转换为可预览格式（如 docx），前端按扩展名放行后由 OfficePreview 渲染
export const SUPPORTED_AUDIT_PREVIEW_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xlsx', 'xls', 'et'])

export const UNSUPPORTED_AUDIT_PREVIEW_TIP = '暂不支持预览该文件，仅支持 PDF、DOC、DOCX、XLSX、XLS、ET'

/** 浏览器内预览体积上限（与 OfficePreview 一致） */
export const MAX_AUDIT_PREVIEW_BYTES = 30 * 1024 * 1024

export const decodeAuditPreviewFileName = (value: unknown) => {
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

export const getAuditPreviewFileKey = (file: TXmAttach) => String(file.uuid || file.id || '')

export const getAuditPreviewFileName = (file: TXmAttach) => decodeAuditPreviewFileName(file.name)

export const getAuditPreviewFileExtension = (file: TXmAttach) => getOfficeFileExtension(getAuditPreviewFileName(file))

export const isSupportedAuditPreviewFile = (file: TXmAttach) => {
  const extension = getAuditPreviewFileExtension(file)
  return Boolean(extension && SUPPORTED_AUDIT_PREVIEW_EXTENSIONS.has(extension))
}

/** 按公共代码配置的附件类型顺序选择默认预览文件，未命中时回退到首个可预览附件。 */
export const selectAuditPreviewFileByTypePriority = (files: TXmAttach[], typeCodes: unknown[]) => {
  const previewableFiles = files.filter(
    (file) => file && String(file.id || '').trim() && getAuditPreviewFileKey(file) && isSupportedAuditPreviewFile(file)
  )
  const priorities = typeCodes.map((code) => String(code ?? '').trim()).filter(Boolean)

  for (const typeCode of priorities) {
    const matchedFile = previewableFiles.find((file) => String(file.fjId || '').trim() === typeCode)
    if (matchedFile) return matchedFile
  }

  return previewableFiles[0]
}

/** previewAttach 直接返回文件流；若业务错误以 JSON/text blob 返回则解析 msg */
export const resolvePreviewAttachBlob = async (res: unknown): Promise<Blob> => {
  const blob = res instanceof Blob ? res : new Blob([res as BlobPart])
  const contentType = String(blob.type || '').toLowerCase()
  if (contentType.includes('application/json') || contentType.includes('text/')) {
    const text = await blob.text()
    try {
      const json = JSON.parse(text)
      throw new Error(json?.msg || json?.message || '文件获取失败')
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(text.trim() || '文件获取失败')
      }
      throw e
    }
  }
  if (!blob.size) {
    throw new Error('文件内容为空')
  }
  if (blob.size > MAX_AUDIT_PREVIEW_BYTES) {
    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1)
    throw new Error(`文件过大（${sizeMb} MB），超过 30 MB 预览上限，请下载后本地查看`)
  }
  return blob
}

/**
 * 从 RuleReviewDetailModal 抛出的附件与列表中，解析出真正要打开的文件与可切换列表
 * - 正文 .attachView 内联附件可能仅带 data-attach-id：扩展名未知时按 id 直开
 */
export const resolveAuditPreviewTarget = (selectedFile: TXmAttach, filesFromList: TXmAttach[]) => {
  const previewableFiles = filesFromList.filter((file) => file && getAuditPreviewFileKey(file) && isSupportedAuditPreviewFile(file))
  const targetKey = getAuditPreviewFileKey(selectedFile)
  const hasAttachId = Boolean(String(selectedFile.id || '').trim())
  const targetFile =
    previewableFiles.find((file) => getAuditPreviewFileKey(file) === targetKey) ||
    (isSupportedAuditPreviewFile(selectedFile) ? selectedFile : undefined) ||
    (hasAttachId && targetKey ? selectedFile : undefined)

  if (!targetFile) return null

  return {
    targetFile,
    files: previewableFiles.length ? previewableFiles : [targetFile]
  }
}
