import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

interface Params {
  [key: string]: any
}

// 查询
export const searchData = (params: Params): Promise<Result> => {
  return baseService.post('/process44/getData', params)
}

// 查询
export const searchDataNew = (params: Params): Promise<Result> => {
  return baseService.post('/process44/getDataNew', params)
}

// 导出数据
export const exportData = (params?: Params): Promise<Result> => {
  return baseService.export('/process44/export', params)
}

// 导出数据
export const exportDataNew = (params?: Params): Promise<Result> => {
  return baseService.export('/process44/exportNew', params)
}

// 获取项目类型
export const getProTypeTreeNode = (params?: Params): Promise<Result> => {
  return baseService.post('/process40/getProTypeTreeNode', params)
}
// 获取关联率区间调整
export const getRateConfig = (): Promise<Result> => {
  return baseService.get('/process44/getPzInfo')
}
// 更新关联率区间调整
export const updateRateConfig = (params?: Params): Promise<Result> => {
  return baseService.post('/process44/updatePz', params)
}

// process47查询接口
export const searchProcess47 = (params?: Params): Promise<Result> => {
  return baseService.post('/process45/getData', params)
}

// process47查询接口
export const searchProcess47New = (params?: Params): Promise<Result> => {
  return baseService.post('/process45/getDataNew', params)
}

// process47导出接口
export const exportProcess47 = (params?: Params): Promise<Result> => {
  return baseService.export('/process45/export', params)
}

// process47导出接口
export const exportProcess47New = (params?: Params): Promise<Result> => {
  return baseService.export('/process45/exportNew', params)
}

// 单位接口
export const getUnitTreeNode = (specialorgid?: string): Promise<Result> => {
  return baseService.get(`/commonCode/getYjdwBySprciialorgid?specialorgid=${specialorgid}`)
}

// 穿透查询接口
export const searchDetail = (params?: Params): Promise<Result> => {
  return baseService.post('/process45/getCtDataNew', params)
}

// 穿透导出接口
export const exportDetail = (params?: Params): Promise<Result> => {
  return baseService.export('/process45/exportCtDataNew', params)
}

// 获取menu信息
export const getMenuMessage = (params: string): Promise<Result> => {
  return baseService.get(`/sys/menu/getMenuByUrl?url=${params}`)
}

// 获取项目包名称
export const getXmbmc = (params: Params): Promise<Result> => {
  return baseService.get(`commonCode/getXmbByProtypeId?nd=${params.year}&protypeId=${params.xmlx}&middleId=${params.middleId}`)
}

// 获取单位
export const getUnit = (params: Params): Promise<Result> => {
  return baseService.post('process40/getTreeNode/', params)
}

// 列求和
export const getSumValue = (params: Params): Promise<Result> => {
  return baseService.post('process40/getSumValue', params)
}
