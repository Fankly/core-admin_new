import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface statusOv {
  search: string
}

interface typeOv extends statusOv {
  type: string
}

interface pageVo extends typeOv {
  status: string
  limit: number
  page: number
}

interface getDynamicColumnVo {
  meetingId: string
}

//专家评审工作台-获取会议数量(按会议状态统计)
export const getMeetingCountByStatus = (params: typeOv): Promise<Result> => {
  return budget.post('expert-review-workbench/getMeetingCountByStatus', { ...params }, {}, false)
}

// 专家评审工作台-获取会议数量(按会议类型统计)
export const getMeetingCountByType = (params: statusOv): Promise<Result> => {
  return budget.post('expert-review-workbench/getMeetingCountByType', { ...params }, {}, false)
}

// 专家评审工作台-分页查询会议
export const getMeetingPage = (params: pageVo): Promise<Result> => {
  return budget.post('expert-review-workbench/getMeetingPage', { ...params }, {}, false)
}

// 专家评审工作台-获取评审统计
export const getReviewStat = (): Promise<Result> => {
  return budget.post('expert-review-workbench/getReviewStat', {}, {}, false)
}

// 市级联合会审评审报告-获取动态列
export const getDynamicColumn = (params: getDynamicColumnVo): Promise<Result> => {
  return budget.post(`/workflow/cityLhhsReviewReport/getDynamicColumn?meetingId=${params.meetingId}`, {}, {}, false)
}

// 市级联合会审评审报告-获取表格数据
export const getTableData = (params: any): Promise<Result> => {
  return budget.post('/workflow/cityLhhsReviewReport/getTableData', { ...params }, {}, false)
}

// 市级联合会审评审报告-导出数据
export const exportData = (params: getDynamicColumnVo): Promise<Result> => {
  return budget.exportFile('/workflow/cityLhhsReviewReport/exportData', { ...params }, {}, false)
}

// 市级联合会审评审报告-评审报告生成(市级联合会审)
export const generateReviewReportForCityLhhs = (params: any): Promise<Result> => {
  return budget.post('reviewReport/generateReviewReportForCityLhhs', { ...params }, {}, false)
}

// 市级联合会审评审报告-分页查询会议信息(市级联合会审)
export const pageMeetingInfoForCityLhhs = (params: any): Promise<Result> => {
  return budget.post('reviewReport/pageMeetingInfoForCityLhhs', { ...params }, {}, false)
}

// 市级联合会审评审报告-组长评审退回(市级联合会审)
export const leaderReviewThForCityLhhs = (params: any): Promise<Result> => {
  return budget.post('leaderReview/leaderReviewThForCityLhhs', { ...params }, {}, false)
}

// 市级联合会审评审报告-提交
export const submitWf = (params: any): Promise<Result> => {
  return budget.post('/workflow/cityLhhsReviewReport/submitWf', { ...params }, {}, false)
}

// 市级联合会审评审报告-审核
export const finishWf = (params: any): Promise<Result> => {
  return budget.post('/workflow/cityLhhsReviewReport/finishWf', { ...params }, {}, false)
}

// 市级联合会审评审报告-驳回
export const reject = (params: any): Promise<Result> => {
  return budget.post('/workflow/cityLhhsReviewReport/reject', { ...params }, {}, false)
}

// 市级联合会审评审报告-根据meetingId查询附件
export const downloadReviewReportByMeetingId = (params: any): Promise<Result> => {
  return budget.exportFile(`reviewReport/downloadReviewReportByMeetingId?meetingId=${params.meetingId}`, { ...params }, {}, false)
}
