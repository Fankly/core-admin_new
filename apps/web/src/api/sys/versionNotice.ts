import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface Params {
  [key: string]: any
}

// 版本发布通知-分页查询
export const versionNoticePage = (params: Params): Promise<Result> => {
  return budget.post('/versionNotice/page', params)
}

// 版本发布通知-新增/编辑通知
export const versionNoticeSave = (params: Params): Promise<Result> => {
  return budget.post('/versionNotice/save', params)
}

// 版本发布通知-删除通知
export const versionNoticeRemove = (params: any): Promise<Result> => {
  return budget.post('/versionNotice/delete', params)
}

// 版本发布通知-发布通知
export const versionNoticePublish = (params: string): Promise<Result> => {
  return budget.post(`/versionNotice/publish/${params}`)
}

// 版本发布通知-撤回通知
export const versionNoticeRevoke = (params: string): Promise<Result> => {
  return budget.post(`/versionNotice/revoke/${params}`)
}

// 版本发布通知-查询当前登录用户的未读版本通知
export const versionNoticeCheckUnread = (): Promise<Result> => {
  return budget.get(`/versionNotice/checkUnread`)
}

// 版本发布通知-查询当前登录用户的未读版本通知
export const versionNoticeRead = (noticeId: string): Promise<Result> => {
  return budget.post(`/versionNotice/read?noticeId=${noticeId}`)
}
