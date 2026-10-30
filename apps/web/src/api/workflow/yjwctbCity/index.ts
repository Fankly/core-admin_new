import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.lygBudget

interface Params {
  [key: string]: any
}

// 预计完成数填报审批流程-提交
export const submitWfActivity = (params: Params): Promise<Result> => {
  return budget.post('yjwc-tb-wf/submit', params)
}

// 预计完成数填报审批流程-通过
export const finishWfActivity = (params: Params): Promise<Result> => {
  return budget.post('yjwc-tb-wf/finish', params)
}

// 预计完成数填报审批流程-驳回
export const rejectActivity = (params: Params): Promise<Result> => {
  return budget.post('yjwc-tb-wf/reject', params)
}

// 预计完成数填报审批流程-列
export const getDynamicColumn = (params: Params): Promise<Result> => {
  return budget.post(`yjwc-tb-wf/getDynamicColumn`, params)
}

// 预计完成数填报审批流程-数据
export const getTableData = (params: Params): Promise<Result> => {
  return budget.post(`yjwc-tb-wf/getTableData`, params)
}

// 预计完成数填报审批流程-保存预计完成数
export const saveYjwcz = (params: Params): Promise<Result> => {
  return budget.post(`yjwc-tb-wf/saveYjwcz`, params)
}

// 预计完成数填报审批流程-导出预计完成数填报模板
export const exportTemplate = (params: Params): Promise<Result> => {
  return budget.exportFile(`yjwc-tb-wf/exportTemplate`, params)
}

// 预计完成数填报审批流程-批量导入预计完成数
export const importYjwcs = (params: any): Promise<Result> => {
  return budget.post(`yjwc-tb-wf/importYjwcs`, params.excelFormData)
}
