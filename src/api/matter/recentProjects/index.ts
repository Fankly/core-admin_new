import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  headers?: any
}

interface Params {
  [key: string]: any
}

// 项目类型
export const getProtypeTreeYearCb = (params: Params): Promise<Result> => {
  return baseService.post(`/protypeTree/getProtypeTreeYearCb`, params)
}

// 获取列表数据
export const getRecords = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxLinkXm/getRecords`, params)
}

// 刷新待维护数据
export const refreshData = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxLinkXm/refreshData?dwId=${params.dwId}&nd=${params.nd}`)
}

// 获取动态表头
export const getDynamicColumn = (): Promise<Result> => {
  return baseService.post(`/yssxLinkXm/getDynamicColumn`)
}

// 保存数据
export const saveData = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxLinkXm/save`, params)
}

// 删除数据
export const deleteData = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxLinkXm/delete`, params)
}

// 提交数据
export const submitData = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxLinkXm/submit`, params)
}

// 驳回数据
export const backData = (params: Params): Promise<Result> => {
  return baseService.post(`/yssxLinkXm/back`, params)
}

// 导出
export const exportData = (params: Params): Promise<Result> => {
  return baseService.export(`/yssxLinkXm/export`, params)
}

export const getImportTemplate = (params: Params): Promise<Result> => {
  return baseService.export(`/yssxLinkXm/getImportTemplate`, params)
}

export const importData = (params: Params): Promise<Result> => {
  params.excelFormData.append('bmId', params.bmId)
  params.excelFormData.append('dwId', params.dwId)
  return baseService.post(`/yssxLinkXm/import`, params.excelFormData)
}
