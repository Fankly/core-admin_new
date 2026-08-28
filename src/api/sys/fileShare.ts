import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export interface Params {
  [key: string]: any
}

// 文件目录管理-获取目录
export const getChildDirectory = (id: string): Promise<Result> => {
  return budget.get(`attach/directory/getChildDirectory?id=${id}`, {}, {}, false)
}

// 文件目录管理-新增或修改目录
export const addDirectory = (params: Params): Promise<Result> => {
  return budget.post('attach/directory/addDirectory', params, {}, false)
}

// 文件目录管理-删除目录
export const deleteDirectory = (params: Params): Promise<Result> => {
  return budget.post('attach/directory/deleteDirectory', params, {}, false)
}

// 文件目录管理-获取目录下的文件
export const getAttachByDirectory = (params: Params): Promise<Result> => {
  return budget.get('attach/directory/getAttachByDirectory', params, {}, false)
}

// 文件目录管理-编辑文件备注
export const editAttach = (params: Params): Promise<Result> => {
  return budget.post('attach/directory/editAttach', params, {}, false)
}

// 文件目录管理-上传文件至指定目录
export const uploadAttachToDirectory = (params: Params): Promise<Result> => {
  return budget.post(`attach/directory/uploadAttachToDirectory?attachNames=${params.attachNames}&id=${params.id}`, params.excelFormData, {}, false)
}

// 文件目录管理-下载附件
export const downloadAttach = (params: Params): Promise<Result> => {
  return budget.exportFile(`attach/directory/downloadAttach?uuid=${params.uuid}`, params, {}, false)
}

// 文件目录管理-删除文件
export const deleteAttachFromDirectory = (params: Params): Promise<Result> => {
  return budget.post('attach/directory/deleteAttachFromDirectory', params, {}, false)
}
