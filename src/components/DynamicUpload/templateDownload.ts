import { downloadAttach, getAttachList } from '@/api/config/templateFileManager'
import { resolveTemplateAttachmentMeta, resolveTemplateQueryContext } from './templateDownloadHelper'

export interface StandardTemplateMeta {
  protypeId: string
  fjType: string
  name: string
}

export interface StandardTemplateQueryContext {
  protypeId: string
  fjType: string
}

export const loadStandardTemplateMeta = async (
  selectData: Record<string, any> | null | undefined,
  fjType: string | number | null | undefined
): Promise<StandardTemplateMeta | null> => {
  const queryContext = resolveTemplateQueryContext(selectData, fjType) as StandardTemplateQueryContext | null
  if (!queryContext) {
    return null
  }

  const res = await getAttachList(queryContext)
  if (!res.success) {
    throw new Error(res.msg || '标准模板查询失败')
  }

  const templateMeta = resolveTemplateAttachmentMeta(res.data) as Pick<StandardTemplateMeta, 'name'> | null
  if (!templateMeta) {
    return null
  }

  return {
    ...queryContext,
    name: templateMeta.name
  }
}

export const downloadStandardTemplate = async (templateMeta: StandardTemplateMeta): Promise<void> => {
  if (!templateMeta?.protypeId || !templateMeta?.fjType) {
    throw new Error('标准模板缺少下载参数')
  }

  const blob = await downloadAttach({
    protypeId: templateMeta.protypeId,
    fjType: templateMeta.fjType
  })

  const link = document.createElement('a')
  const blobUrl = window.URL.createObjectURL(blob)
  link.href = blobUrl

  let filename = '' // 文件名
  if (blob.headers && blob.headers['content-disposition']) {
    filename = blob.headers['content-disposition'].split(';')[1].split('=')[1]
  }
  if (filename) {
    link.download = `${decodeURI(decodeURI(filename))}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  }
}
