import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface Params {
  [key: string]: any
}

// 预计完成数填报任务分发-分页查询
export const finishXmPage = (params: Params): Promise<Result> => {
  return budget.post('/yjwc-rw/page', params)
}

// 预计完成数填报任务分发-按年度统计项目数量、应填报项目数、项目负责专职人数（RequestParam nd）
export const finishXmStatByYear = (params: Params): Promise<Result> => {
  return budget.post(`/yjwc-rw/getStat?nd=${params.nd}`, params)
}

// 预计完成数填报任务分发-新增/编辑
export const finishXmSave = (params: Params): Promise<Result> => {
  return budget.post('/yjwc-rw/save', params)
}

// 预计完成数填报任务分发-任务发布（RequestParam rwId）
export const finishXmPublish = (params: Params): Promise<Result> => {
  return budget.post(`/yjwc-rw/publish?rwId=${params.rwId}`, params)
}

// 预计完成数填报任务分发-删除（ids 数组作为请求体）
export const finishXmDelete = (ids: string[]): Promise<Result> => {
  return budget.post('/yjwc-rw/delete', ids)
}

// 预计完成数填报项目明细-分页查询（年度、任务名称）
export const finishXmDetailPage = (params: Params): Promise<Result> => {
  return budget.post('/yjwc-rw/getXmPage', params)
}

// 预计完成数填报项目明细-导出
export const finishXmDetailExport = (params: any): any => {
  return budget.exportFile('/yjwc-rw/exportXm', params)
}

// 预计完成数填报统计-按年度查询任务下拉列表
export const listRwByNd = (params: Params): Promise<Result> => {
  return budget.post(`/yjwc-rw/listRwByNd?nd=${params.nd}`, params)
}

// 预计完成数填报统计（树状）
export const finishXmTjData = (params: Params): Promise<Result> => {
  return budget.post('/yjwc-rw/getTjData', params)
}

// 预计完成数填报统计-导出
export const finishXmTjExport = (params: any): any => {
  return budget.exportFile('/yjwc-rw/exportTj', params)
}

// 预计完成数填报明细（已填报数量弹窗）-分页查询
export const finishXmYtbPage = (params: Params): Promise<Result> => {
  return budget.post('/yjwc-rw/getMxPage', params)
}

// 预计完成数填报明细（已填报数量弹窗）-导出
export const finishXmYtbExport = (params: any): any => {
  return budget.exportFile('/yjwc-rw/exportMx', params)
}
