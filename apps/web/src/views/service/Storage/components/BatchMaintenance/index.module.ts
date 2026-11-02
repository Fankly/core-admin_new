export const FILE_UPLOAD_API = '/xmAttributeConfig/uploadAttach'
export const NEW_FILE_HIGHLIGHT_DURATION = 2000
export interface SearchAttachItem {
  name?: string
  size?: number
  uuid?: string
}
export interface SearchResponseData {
  pfwh?: string
  attachLists?: SearchAttachItem[]
}
export interface FileRecord {
  name: string
  size: number
  uuid: string
  file?: File
  isNew: boolean
}
export interface RejectedFiles {
  type: string[]
  size: string[]
}
export const normalizeFileType = (fileType: string) => {
  const normalizedType = fileType.trim().toLowerCase()
  if (!normalizedType) return ''
  return normalizedType.startsWith('.') ? normalizedType : `.${normalizedType}`
}
export const formatErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
