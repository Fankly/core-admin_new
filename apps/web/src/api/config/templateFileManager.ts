import baseService from '@/service/baseService'
import { Result } from '../types'

export interface QueryTemplateFileEchoParams {
  id: string
}

export interface UploadTemplateFilesParams {
  protypeIds: string
  fjType: string
  formData: FormData
  fileNames: string[]
}

export interface AttachListParams {
  fjType?: string
  protypeId: string
}

export interface DeleteAttachParams {
  ids: string[]
}

// 上传附件
export const uploadAttach = (params: UploadTemplateFilesParams): Promise<Result> => {
  return baseService.post(
    `/protype/fjType/upload?fileNames=${params.fileNames}&fjType=${params.fjType}&protypeIds=${params.protypeIds}`,
    params.formData
  )
}

// 查询附件
export const getAttachList = (params: AttachListParams): Promise<Result> => {
  return baseService.post(`/protype/fjType/getAttachList?fjType=${params.fjType}&protypeId=${params.protypeId}`)
}

//删除附件
export const deleteAttach = (params: DeleteAttachParams): Promise<Result> => {
  return baseService.post(`/protype/fjType/deleteAttach`, params)
}

// 下载附件
export const downloadAttach = (params: AttachListParams): Promise<Result> => {
  return baseService.export(`/protype/fjType/downloadAllAttach?fjType=${params.fjType}&protypeId=${params.protypeId}`)
}
