//联会会审会议按预算事项统计报表
import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface MatterMaintainMeetingInfoParams {
  meetingId: string
  dwId: string
  bmId: string
  roleId: string
  roleCode: string
}

export const getMatterMeetingReviewInfoList = (params: MatterMaintainMeetingInfoParams): Promise<Result> => {
  return budget.get('/lhhs/report/getDataByYssx', params, {}, false)
}
