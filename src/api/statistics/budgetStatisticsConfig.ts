import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

type DataDetails = {
  configId?: number
  detailId?: number
  packType: string
  proType: string
}

type SumDetails = {
  configId?: number
  detailId?: number
  tarConfigId: number
}

export interface SaveData {
  busiType: string
  gkbm?: string
  ysly?: string
  cnxm?: string
  cnxmms?: string
  isDisplay: string
  configId?: number
  configName: string
  dataDetails?: DataDetails[]
  isleaf: number
  nd: number
  parentId: number | null
  recState: number
  statType?: number
  statMethod: string
  sumDetails?: SumDetails[]
  dispOrder: number
  proType?: string
  subName?: string
}

// 删除绑定数据明细
export const deleteDataDetail = (detailIds: string): Promise<Result> => {
  return baseService.post(`/budgetStatisticsConfig/deleteDataDetail?detailIds=${detailIds}`)
}

// 删除绑定汇总明细
export const deleteSumDetail = (detailIds: string): Promise<Result> => {
  return baseService.post(`/budgetStatisticsConfig/deleteSumDetail?detailIds=${detailIds}`)
}

// 获取配置信息
export const getConfigInfo = (configId: string): Promise<Result> => {
  return baseService.get(`/budgetStatisticsConfig/getConfigInfo?configId=${configId}`)
}

// 获取绑定数据明细
export const getDataDetail = (configId: string): Promise<Result> => {
  return baseService.get(`/budgetStatisticsConfig/getDataDetail?configId=${configId}`)
}

// 获取绑定汇总明细
export const getSumDetail = (configId: string): Promise<Result> => {
  return baseService.get(`/budgetStatisticsConfig/getSumDetail?configId=${configId}`)
}

// 获取配置列表
export const getConfigList = (busiType: string, nd: string, parentId: string | null): Promise<Result> => {
  return baseService.get(`/budgetStatisticsConfig/getConfigList?busiType=${busiType}&nd=${nd}&parentId=${parentId}`)
}

// 复制配置数据
export const copyStatConfig = (busiType: string, sourceNd: string, targetNd: string): Promise<Result> => {
  return baseService.post(`/budgetStatisticsConfig/copyStatConfig?busiType=${busiType}&sourceNd=${sourceNd}&targetNd=${targetNd}`)
}

// 获取配置树
export const getNodeTree = (busiType: string, nd: string): Promise<Result> => {
  return baseService.get(`/budgetStatisticsConfig/getNodeTree?busiType=${busiType}&nd=${nd}`)
}

// 获取预算执行一览配置树
export const getYszxlyNodeTree = (nd: string, busiType?: string): Promise<Result> => {
  return baseService.get(`/budgetStatisticsConfig/getYszxlyNodeTree?nd=${nd}&busiType=${busiType}`)
}

// 保存
export const saveConfig = (params: SaveData): Promise<Result> => {
  return baseService.post(`/budgetStatisticsConfig/saveConfig`, params)
}

// 删除
export const delConfigInfo = (configId: string): Promise<Result> => {
  return baseService.post(`/budgetStatisticsConfig/deleteConfig?configId=${configId}`)
}

// 删除
export const batchDeleteConfig = (configIds: string): Promise<Result> => {
  return baseService.post(`/budgetStatisticsConfig/batchDeleteConfig?configIds=${configIds}`)
}

// 根据busiType获取配置的指标数据
export const getIndicatorCodeByBusiType = (busiType: string): Promise<Result> => {
  return baseService.get(`/budgetStatisticsConfig/getIndicatorCodeByBusiType?busiType=${busiType}`)
}

// 根据busiType获取配置的指标数据
export const getIndicatorByBusiType = (busiType: string): Promise<Result> => {
  return baseService.get(`/budgetStatisticsConfig/getIndicatorByBusiType?busiType=${busiType}`)
}

interface indicatorItem {
  code: string
  name: string
  id: string
  note: string
  sort: string
  unicode: string
}

interface UpdateIndicatorParams {
  busiType: string
  indicators: indicatorItem[]
}

// 配置各页面显示的指标项
export const updateIndicator = (params: UpdateIndicatorParams): Promise<Result> => {
  return baseService.post(`/budgetStatisticsConfig/updateIndicator`, params)
}
