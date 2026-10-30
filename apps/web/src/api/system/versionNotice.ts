import baseService from '@/service/baseService'
import type { ApiResponse } from '@/service/http/types'

export interface VersionNotice {
  id: string
  versionTitle: string
  noticeTime: string
  versionContent: string
  versionNo: string
  releaseDate: string
}

export interface VersionNoticePage {
  records: VersionNotice[]
  total: number
}

export interface VersionNoticeQuery {
  page: number
  limit: number
  statusList?: number[]
}

/** 版本发布通知-分页查询 */
export const versionNoticePage = (params: VersionNoticeQuery): Promise<ApiResponse<VersionNoticePage | null>> => {
  return baseService.post<VersionNoticePage>('/versionNotice/page', params)
}

/** 版本发布通知-标记当前用户的单条通知为已读 */
export const versionNoticeRead = (noticeId: string): Promise<ApiResponse> => {
  return baseService.post(`/versionNotice/read?noticeId=${encodeURIComponent(noticeId)}`)
}
