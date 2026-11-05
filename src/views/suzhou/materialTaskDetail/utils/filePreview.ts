import type { MaterialTaskDetailRow } from '@/views/suzhou/common/types/material'

export interface MaterialFileItem {
  fileId: string
  fileName: string
}

/** 后端多个佐证材料以 \n 分隔 */
export const splitFileNames = (value?: string | string[] | null) => {
  if (value == null || value === '') return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** fileIdList 以逗号分隔，与 fileNameList 顺序一一对应 */
export const splitFileIds = (value?: string | string[] | null) => {
  if (value == null || value === '') return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const getFileItems = (row: MaterialTaskDetailRow): MaterialFileItem[] => {
  const names = splitFileNames(row.fileNameList)
  const ids = splitFileIds(row.fileIdList)
  return names.map((fileName, index) => ({
    fileName,
    fileId: ids[index] || ''
  }))
}
