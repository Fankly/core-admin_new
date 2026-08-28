export interface StandardTemplateQueryContext {
  protypeId: string
  fjType: string
}

export interface ResolvedTemplateAttachmentMeta {
  name: string
}

interface TemplateAttachmentRecord {
  name?: string
  attachName?: string
  fileName?: string
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

export function resolveTemplateQueryContext(
  selectData: Record<string, any> | null | undefined,
  fjType: string | number | null | undefined
): StandardTemplateQueryContext | null {
  const protypeId = toStringValue(selectData?.xmlx)
  const normalizedFjType = toStringValue(fjType)

  if (!protypeId || !normalizedFjType) {
    return null
  }

  return {
    protypeId,
    fjType: normalizedFjType
  }
}

export function normalizeTemplateAttachmentList(data: any): TemplateAttachmentRecord[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.records)) return data.records
  return []
}

export function resolveTemplateAttachmentMeta(data: any): ResolvedTemplateAttachmentMeta | null {
  const list = normalizeTemplateAttachmentList(data)
  const record = list.find((item) => item)

  if (!record) {
    return null
  }

  return {
    name: record.name || record.attachName || record.fileName || '标准模板'
  }
}
