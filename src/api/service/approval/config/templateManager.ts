import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'
import { IObject } from '@/types/interface'

export const budget = ServiceApi.budget

export type TemplatePspcType = string

export interface TemplateManagerFile {
  id?: string | number
  uuid: string
  attachName: string
  pspcType: TemplatePspcType
  createTime?: string
  [key: string]: any
}

interface TemplateManagerFileListParams {
  pspcType: TemplatePspcType
}

interface UploadTemplateManagerFilesParams {
  pspcType: TemplatePspcType
  formData: FormData
  fileNames: string[]
}

interface DeleteTemplateManagerFilesParams {
  pspcType: TemplatePspcType
  ids?: Array<string | number>
  uuids?: string[]
}

export const deleteAttach = (params: IObject): Promise<Result> => {
  return budget.post(`/pspcAttach/deleteAttach`, params, {}, false)
}

export const getAttachListByPspcType = (pspcType: string): Promise<Result> => {
  return budget.post(`/pspcAttach/getAttachListByPspcType?pspcType=${pspcType}`, {}, {}, false)
}

export const getTemplateManagerFileList = (params: TemplateManagerFileListParams): Promise<Result> => {
  return getAttachListByPspcType(params.pspcType)
}

export const uploadTemplateManagerFiles = (params: UploadTemplateManagerFilesParams): Promise<Result> => {
  const payload = new FormData()

  params.formData.forEach((value, key) => {
    payload.append(key, value)
  })

  params.fileNames.forEach((fileName) => {
    payload.append('fileName', fileName)
  })

  return budget.post(`/pspcAttach/uploadAttach?pspcType=${params.pspcType}&fileNames=${params.fileNames}`, payload as unknown as IObject, {}, false)
}

export const deleteTemplateManagerFiles = (params: DeleteTemplateManagerFilesParams): Promise<Result> => {
  const payload: IObject = {
    pspcType: params.pspcType
  }

  if (params.ids?.length) {
    payload.ids = params.ids
  }

  if (params.uuids?.length) {
    payload.uuids = params.uuids
    payload.uuid = params.uuids.join(',')
  }

  return deleteAttach(payload)
}

export const downloadAttach = (params: { uuid: string }): Promise<Result> => {
  return budget.post(`/sjtc/lhhs/meeting/downloadAttach?uuid=${params.uuid}`)
}
