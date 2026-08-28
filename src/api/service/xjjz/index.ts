import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}
interface Params {
  [key: string]: any
}
export interface ImportOther {
  excelFormData: any
}

// 续建结转-保存编辑
export const updateXjjzInfo = (params: Params): Promise<Result> => {
  return baseService.post(`/xjjz/updateXjjzInfo`, params)
}

// 续建结转-删除附件
export const deleteAttach = (params: Params): Promise<Result> => {
    return baseService.post(`/xjjz/deleteAttach`, params)
}

// 续建结转-上传附件
export const uploadAttach = (params: any) => {
    return baseService.post(`/xjjz/uploadAttach`, params)
}

//续建结转-下载附件
export const download = (uuid: string): Promise<Result> => {
  return baseService.export(`/xjjz/download?uuid=${uuid}`)
}

