import baseService from '@/service/baseService'

export interface InterfaceParams {
  dwId: number
  ejdw: string
  gkbmIds: string
  nd: string
  parentDwId: string
  proTypeIds: string
  yjdw: string
  yslys: string
  [key: string]: string | number
}

export interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

interface Params {
  [key: string]: any
}

// 按单位统计目标值
export const mbzStatisticsByDw = (params: InterfaceParams): Promise<Result> => {
  return baseService.post('/mbzStatistics/mbzStatisticsByDw', params)
}
// 按项目类型统计目标值
export const mbzStatisticsByProtype = (params: InterfaceParams): Promise<Result> => {
  return baseService.post('/mbzStatistics/mbzStatisticsByProtype', params)
}
// 按项目类型统计目标值
export const mbzStatisticsByProtypeDw = (params: InterfaceParams): Promise<Result> => {
  return baseService.post('/mbzStatistics/mbzStatisticsByProtypeDw', params)
}
// 导出按项目类型-单位统计目标值
export const exportMbzStatisticsByProtypeDw = (params: InterfaceParams): Promise<Result> => {
  return baseService.export('/mbzStatistics/exportMbzStatisticsByProtypeDw', params)
}

// 目标值创建
export const createVersion = (params: Params): Promise<Result> => {
  return baseService.post('/mbzFj/createVersion', params)
}
// 目标值删除
export const deleteVersion = (ids: string[]): Promise<Result> => {
  return baseService.post('/mbzFj/deleteVersion', {
    ids
  })
}
// 获取分页列表
export const getVersionPage = (params: Params): Promise<Result> => {
  return baseService.post('/mbzFj/getVersionPage', params)
}
// 校验
export const checkDw = (dwId: string): Promise<Result> => {
  return baseService.get(`/mbzFj/checkDw?dwId=${dwId}`)
}
// 根据一级单位和年度获取版本号
export const getVersionCode = (dwId: string, nd: string): Promise<Result> => {
  return baseService.get(`/mbzFj/getVersionCode?dwId=${dwId}&nd=${nd}`)
}

// 明细导出
export const exportFjmx = (id: string): Promise<Result> => {
  return baseService.export(`/mbzFj/exportFjmx?id=${id}`)
}
// 获取版本分解明细动态表头
export const getDynamicColumn = (dwId: string): Promise<Result> => {
  return baseService.get(`/mbzFj/getDynamicColumn?dwId=${dwId}`)
}
// 获取明细导入模板
export const getImportTemplate = (id: string): Promise<Result> => {
  return baseService.export(`/mbzFj/getImportTemplate?id=${id}`)
}
// 导入
export const importFjmx = (parmas: any): Promise<Result> => {
  return baseService.post(`/mbzFj/importFjmx?versionId=${parmas.versionId}`, parmas.excelFormData)
}

interface Data {
  dwValues: string
  protypeId: string
}

interface Parmas {
  saveDatas: Data[]
  versionId: string
}

// 导入
export const saveFjmx = (parmas: Parmas): Promise<Result> => {
  return baseService.post(`/mbzFj/saveFjmx`, parmas)
}
// 获取版本下分解明细
export const getFjDetail = (parmas: any): Promise<Result> => {
  return baseService.post(`/mbzFj/getFjDetail`, parmas)
}

export const enableVersion = (id: string): Promise<Result> => {
  return baseService.post(`/mbzFj/enableVersion?id=${id}`)
}

export const setYearTargetValue = (params: Params): Promise<Result> => {
  return baseService.post(`/mbzFj/setSfnd?versionId=${params.versionId}&sfnd=${params.sfnd}`)
}

export const getJhLog = (params: any): Promise<Result> => {
  return baseService.post(`/mbzFj/getJhLog`, params)
}

export const getFyLog = (params: any): Promise<Result> => {
  return baseService.post(`/mbzFj/getFyLog`, params)
}
