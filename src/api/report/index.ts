import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

export interface SearchForm {
  currentUserDwId: string | null
  endDate: string
  startDate: string
  selectedDwId: number | null
  indicatorList: string[]
  xmlxIdList: string[]
}

export interface DwSearchForm {
  dwId: number | null
  endDate: string
  startDate: string
  proType: string
  indicators: string
}

export interface ProgressDataByType {
  dwId: number | null
  endDate: string
  startDate: string
  xmlxId: number | null
}

export interface IndicatorsData {
  dwId: string
  endDate: string
  indicators: string
  itemId: string
  proType: string
  startDate: string
}

// 项目类型
export const getProTypeTree = (): Promise<Result> => {
  return baseService.get(`/slbb/getProTypeTree`)
}

// 按照项目类型列表
export const getStatData = (params: SearchForm): Promise<Result> => {
  return baseService.post(`/slbb/getStatDataByType`, params)
}

// 按照项目类型列表
export const getProgressDataByType = (params: ProgressDataByType): Promise<Result> => {
  return baseService.post(`/slbb/getProgressDataByType`, params)
}

export const getDynamicColumnByTypeNew = (params: SearchForm): Promise<Result> => {
  return baseService.post(`/slbb/getDynamicColumnByTypeNew`, params)
}

export const getProgressDataByTypeNew = (params: ProgressDataByType): Promise<Result> => {
  return baseService.post(`/slbb/getProgressDataByTypeNew`, params)
}

export const getStatDataByTypeNew = (params: ProgressDataByType): Promise<Result> => {
  return baseService.post(`/slbb/getStatDataByTypeNew`, params)
}

// 按照项目类型列表-表头
export const getDynamicColumn = (params: SearchForm): Promise<Result> => {
  return baseService.post(`/slbb/getDynamicColumnByType`, params)
}

// 按照单位列表-表头
export const getThreeRateReportDynamicColumn = (params: DwSearchForm): Promise<Result> => {
  return baseService.post(`/threeRateReportDw/getThreeRateReportDynamicColumn?`, params)
}

// 获取进度指标-表头
export const getIndicatorDynamicColumn = (params: IndicatorsData): Promise<Result> => {
  return baseService.post(`/threeRateReportDw/getIndicatorDynamicColumn?`, params)
}

// 获取进度指标-列表数据
export const getIndicatorsDataListByDw = (params: IndicatorsData): Promise<Result> => {
  return baseService.post(`/threeRateReportDw/getIndicatorsDataListByDw?`, params)
}

// 按照单位表格数据
export const getDataListByDw = (params: DwSearchForm): Promise<Result> => {
  return baseService.post(`/threeRateReportDw/getDataListByDw`, params)
}

interface xmTypeHistoryPage {
  page: number
  limit: number
  proType: string
  nd: number
}

export interface ImportData {
  excelFormData: any
}

// 历史项目项目类型表格数据
export const getXmTypeHistoryPage = (params: xmTypeHistoryPage): Promise<Result> => {
  return baseService.post(`/xmTypeHistoryData/getListPageData`, params)
}

//历史项目项目类型表  获取导入模板  /xmTypeHistoryData/getImportTemplate
export const getImportTemplate = (): any => {
  return baseService.export(`/xmTypeHistoryData/getImportTemplate`)
}

//历史项目项目类型表  导入数据  /xmTypeHistoryData/importData
export const importData = (params: ImportData): any => {
  return baseService.post(`/xmTypeHistoryData/importData`, params.excelFormData)
}

//历史项目项目类型表  导出数据  /xmTypeHistoryData/exportData
export const exportData = (params: xmTypeHistoryPage): Promise<Result> => {
  return baseService.export(`/xmTypeHistoryData/exportData`, params)
}

interface ProPlanInfoPage {
  page: number
  limit: number
  gwxmbm: string
  nd: number
  dwId: string
}

// 按照单位表格数据
export const getProPlanInfoPage = (params: ProPlanInfoPage): Promise<Result> => {
  return baseService.post(`/xmJhxx/page`, params)
}

// 按照单位表格数据导出
export const exportPageData = (params: ProPlanInfoPage): Promise<Result> => {
  return baseService.export(`/xmJhxx/export`, params)
}

export interface GkbmData {
  busiType: string
  currentUserDwId: string
  endDate: string
  indicatorList: string[]
  startDate: string
}

// 归口部门
export const getGkbmStatData = (params: any): Promise<Result> => {
  return baseService.post(`/gkbmYszxfx/getStatData`, params)
}

// 归口部门表头
export const getGkbmDynamicColumn = (params: GkbmData): Promise<Result> => {
  return baseService.post(`/gkbmYszxfx/getDynamicColumn`, params)
}

// 归口部门导出
export const exportStatData = (params: GkbmData): Promise<Result> => {
  return baseService.export(`/gkbmYszxfx/exportStatData`, params)
}

interface CityDeptVo {
  indicatorCodeList: string[]
  budgetPeriodStart: string
  budgetPeriodEnd: string
  proTypeIdList: string[]
  dwId: string
  bmId: string
  bmxz: string
}

interface CityDeptNewVo extends CityDeptVo {
  parentId: string
  busiType: string
}

// 获取动态表头(市管部门维度)
export const getDynamicColumnBySgbm = (params: CityDeptVo): Promise<Result> => {
  return baseService.post(`/slbb/getDynamicColumnBySgbm`, params)
}

// 获取统计数据(市管部门维度)
export const getStatDataBySgbm = (params: CityDeptVo): Promise<Result> => {
  return baseService.post(`/slbb/getStatDataBySgbm`, params)
}

// 获取动态表头(市管部门维度)NEW
export const getDynamicColumnBySgbmNew = (params: CityDeptNewVo): Promise<Result> => {
  return baseService.post(`/slbb/getDynamicColumnBySgbmNew`, params)
}

// 获取统计数据(市管部门维度)NEW
export const getStatDataBySgbmNew = (params: CityDeptNewVo): Promise<Result> => {
  return baseService.post(`/slbb/getStatDataBySgbmNew`, params)
}
