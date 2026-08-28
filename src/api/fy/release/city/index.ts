import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'
import { ExportDataForKm, ImportData } from '@/api/fy/release'
import { DataList } from '@/api/fy/release/provinceReview'

export interface BasicData {
  nd: string
  specialorgid?: string
}

export interface TableData extends BasicData {
  kmlx: string
}

export interface DwView extends TableData {
  parentId: string
  dwId?: string
}

export interface KmView extends TableData {
  parentId: string
  kmId: string
}

export interface DwStatus extends KmView {
  busiType: string
  dwId: string
  sbDesc: string
  sbje: string
}

export interface MxList {
  detailId: number
  sdje: number
  yskmId: number
}

export interface SaveByDw {
  busiType: string
  dwId: string
  kmlx: string
  nd: string
  mxList: MxList[]
}

export interface ApprovedAndIsssued {
  busiType: string
  kmlx: string
  nd: string
  ejdw: string
}

interface JudgeSaved {
  dwId: string
  kmlx: string
  nd: string
}

// 获取数据
export const getCityDataList = (params: DwView): Promise<Result> => {
  return otherOperatingCose.post('/cityYapToExamine/getDataList', params, {}, false)
}

// 获取动态表头
export const getCityDynamicColumn = (params: BasicData): Promise<Result> => {
  return otherOperatingCose.post('/cityYapToExamine/getDynamicColumn', params, {}, false)
}

//单位维度查看
export const getDataByDw = (params: DwView): Promise<Result> => {
  return otherOperatingCose.post('/cityYapToExamine/getDataByDw', params, {}, false)
}

//科目维度查看
export const getDataByKm = (params: KmView): Promise<Result> => {
  return otherOperatingCose.post('/cityYapToExamine/getDataByKm', params, {}, false)
}

//单位维度获取动态列表
export const getCityDynamicColumnByDw = (params: DwView): Promise<Result> => {
  return otherOperatingCose.get(`/cityYapToExamine/getDynamicColumnByDw?nd=${params.nd}&kmlx=${params.kmlx}`, {}, {}, false)
}

//科目维度获取动态列表
export const getCityDynamicColumnByKm = (params: KmView): Promise<Result> => {
  return otherOperatingCose.get(`/cityYapToExamine/getDynamicColumnByKm?nd=${params.nd}&kmlx=${params.kmlx}`, {}, {}, false)
}

//获取预安排单位审核-单位状态
export const getDwStatus = (params: DwStatus): Promise<Result> => {
  return otherOperatingCose.post('/cityYapToExamine/getDwStatus', params, {}, false)
}

//保存
export const saveByDw = (params: SaveByDw): Promise<Result> => {
  return otherOperatingCose.post('/cityYapToExamine/saveByDw', params, {}, false)
}

//审定下达
export const approvedAndIsssued = (params: ApprovedAndIsssued): Promise<Result> => {
  return otherOperatingCose.get(
    `/cityYapToExamine/approvedAndIsssued?busiType=${params.busiType}&ejdw=${params.ejdw}&kmlx=${params.kmlx}&nd=${params.nd}`,
    {},
    {},
    false
  )
}

//审定
export const authorize = (params: ApprovedAndIsssued): Promise<Result> => {
  return otherOperatingCose.get(
    `/cityYapToExamine/authorize?busiType=${params.busiType}&ejdw=${params.ejdw}&kmlx=${params.kmlx}&nd=${params.nd}`,
    {},
    {},
    false
  )
}

export const getCurrentPageData = (busiType: string, kmlx: string, nd: string, specialorgid: string, xsws: string): Promise<Result> => {
  return otherOperatingCose.post(
    `/cityYapToExamine/getCurrentPageData?busiType=${busiType}&kmlx=${kmlx}&nd=${nd}&specialorgid=${specialorgid}&xsws=${xsws}`,
    {},
    {},
    false
  )
}

// 导出
export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/cityYapToExamine/export', params, {}, false)
}

// 单位维度导出
export const exportForDw = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/cityYapToExamine/exportForDw', params, {}, false)
}

// 科目维度导出
export const exportForKm = (params: ExportDataForKm): Promise<Result> => {
  return otherOperatingCose.exportFile('/cityYapToExamine/exportForKm', params, {}, false)
}

// 按单位编制-获取导入模板
export const getDwImportTemplate = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/cityYapToExamine/getImportTemplateForDw', params, {}, false)
}

// 导入
export const importData = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.post(
    `/cityYapToExamine/importDataForDw?dwId=${params.dwId}&nd=${params.nd}&kmlx=${params.kmlx}`,
    params.excelFormData,
    {},
    false
  )
}

// 判断是否点结果保存
export const judgeSaved = (params: JudgeSaved): Promise<Result> => {
  return otherOperatingCose.post(`/cityYapToExamine/judgeSaved?dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}`, {}, {}, false)
}
