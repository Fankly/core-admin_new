import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface Params {
  [key: string]: any
}

// 知识库管理-分页查询
export const knowledgeBasePage = (params: Params): Promise<Result> => {
  return budget.post('/knowledge-base/page', params)
}

// 知识库管理-编辑
export const knowledgeBaseSave = (params: Params): Promise<Result> => {
  return budget.post('/knowledge-base/save', params)
}

// 知识库管理-删除
export const knowledgeBaseRemove = (params: any): Promise<Result> => {
  return budget.post('/knowledge-base/remove', params)
}

// 知识库管理-下载附件
export const knowledgeBaseDownload = (params: any): any => {
  return budget.exportFile('/knowledge-base/download', params)
}

// 知识库管理-置顶
export const knowledgeBaseTop = (params: any): any => {
  return budget.post('/knowledge-base/top', params)
}

// 知识库管理-取消置顶
export const knowledgeBaseCancelTop = (params: any): any => {
  return budget.post('/knowledge-base/cancelTop', params)
}

// 知识库管理-上传文件
export const knowledgeBaseUpload = (params: any): Promise<Result> => {
  return budget.post('/knowledge-base/upload', params.excelFormData, {}, false)
}
