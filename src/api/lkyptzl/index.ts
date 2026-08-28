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
export interface ImportOther {
  excelFormData: any
}

// 两库一平台总览-获取核心指标
export const getCoreIndicator = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/getCoreIndicator`, params)
}

// 两库一平台总览-获取权限信息
export const getCropLimitInfo = (params: Params): Promise<Result> => {
  return baseService.post(
    `overviewOfTwoRepoAndOnePlatform/getCropLimitInfo?dwId=${params.dwId}&isUpLimit=${params.isUpLimit}`
  )
}

// 两库一平台总览-获取总览卡片数据
export const xmIndicatorDataPage = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/getOverviewOfCardData`, params)
}

// 两库一平台总览-页面菜单
export const getAppMenuData = (): Promise<Result> => {
  return baseService.get(`sys/appMenu/getAppMenuData`)
}

// 两库一平台总览-按单位(statType:'1.数量；2.金额)
export const getStatDataByDw = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/getStatDataByDw`, params)
}

// 两库一平台总览-按归口部门(statType:'1.数量；2.金额)
export const getStatDataByGkbm = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/getStatDataByGkbm`, params)
}
// 两库一平台总览-按省归口部门(statType:'1.数量；2.金额)
export const getStatDataByZgkbm = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/getStatDataByZgkbm`, params)
}
// 两库一平台总览-按重点投向(statType:'1.数量；2.金额)
export const getStatDataByZdtx = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/getStatDataByZdtx`, params)
}

// 两库一平台总览-分页查询项目信息-县公司/直属单位
export const pageXmInfo = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/pageXmInfo`, params)
}
// 两库一平台总览-导出项目信息-县公司/直属单位
export const exportXmInfo = (params: Params): Promise<Result> => {
  return baseService.export(`overviewOfTwoRepoAndOnePlatform/exportXmInfo`, params)
}

// 两库一平台总览-分页查询事项信息
export const pageYssxInfo = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/pageYssxInfo`, params)
}
// 两库一平台总览-导出事项信息
export const exportYssxInfo = (params: Params): Promise<Result> => {
  return baseService.export(`overviewOfTwoRepoAndOnePlatform/exportYssxInfo`, params)
}

// 两库一平台总览-分页查询项目信息-按事项
export const pageXmInfoByYssx = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/pageXmInfoByYssx`, params)
}
// 两库一平台总览-导出项目信息-按事项
export const exportXmInfoByYssx = (params: Params): Promise<Result> => {
  return baseService.export(`overviewOfTwoRepoAndOnePlatform/exportXmInfoByYssx`, params)
}

// 两库一平台总览-分页查询事项信息(卡片穿透)
export const pageYssxInfoForCard = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/pageYssxInfoForCard`, params)
}
// 两库一平台总览-导出事项信息(卡片穿透)
export const exportYssxInfoForCard = (params: Params): Promise<Result> => {
  return baseService.export(`overviewOfTwoRepoAndOnePlatform/exportYssxInfoForCard`, params)
}

// 两库一平台总览-分页查询项目信息-按事项(卡片穿透)
export const pageXmInfoByYssxForCard = (params: Params): Promise<Result> => {
  return baseService.post(`overviewOfTwoRepoAndOnePlatform/pageXmInfoByYssxForCard`, params)
}
// 两库一平台总览-导出项目信息-按事项(卡片穿透)
export const exportXmInfoByYssxForCard = (params: Params): Promise<Result> => {
  return baseService.export(`overviewOfTwoRepoAndOnePlatform/exportXmInfoByYssxForCard`, params)
}
