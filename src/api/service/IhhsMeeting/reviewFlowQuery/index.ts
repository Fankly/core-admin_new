import baseService from '@/service/baseService'
import type { Result } from '@/api/types'

export interface ReviewFlowQueryParams {
  [key: string]: any
}

// Backend URLs are placeholders until the review-flow query API contract is finalized.
const ApiPath = {
  schema: 'lhhs/lzqk/getDynamicColumn',
  page: 'lhhs/lzqk/getPage',
  export: 'lhhs/lzqk/exportMeetingData',
  ctData: 'lhhs/lzqk/getCtData'
}

export const getReviewFlowQuerySchema = (params: ReviewFlowQueryParams = {}): Promise<Result> => {
  return baseService.get(ApiPath.schema, params)
}

export const pageReviewFlowQuery = (params: ReviewFlowQueryParams): Promise<Result> => {
  return baseService.post(ApiPath.page, params)
}

export const exportReviewFlowQuery = (params: ReviewFlowQueryParams): Promise<Result> => {
  return baseService.export(ApiPath.export, params)
}

interface CtDataParams extends ReviewFlowQueryParams {
  meeting_id: string
  dwId: string
  bmId: string
  roleCode: string
  roleId: string
  searchType: string // 点击穿透的列字段field值
}

export const getCtData = (params: CtDataParams): Promise<Result> => {
  return baseService.post(ApiPath.ctData, params)
}
