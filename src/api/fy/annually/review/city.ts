import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

export interface BasicData {
  nd: string
  xsws: string
  specialorgid?: string
}

export interface TableData extends BasicData {
  kmlx: string
}

export interface DwView extends TableData {
  parentId: string
  dwId?: string
  busiType: string
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

export interface ExportDataForKm {
  kmId: string
  kmlx: string
  nd: string
  parentId: string
  specialorgid: string
}

interface ImportData {
  excelFormData?: any
  kmlx: string
  nd: string
  ejdw: string
}

// 获取数据
export const getCityDataList = (params: DwView): Promise<Result> => {
  return otherOperatingCose.post('/cityNdToExamine/getDataList', params, {}, false)
}

// 获取动态表头
export const getCityDynamicColumn = (params: BasicData): Promise<Result> => {
  return otherOperatingCose.post('/cityNdToExamine/getDynamicColumn', params, {}, false)
}

//单位维度查看
export const getDataByDw = (params: DwView): Promise<Result> => {
  return otherOperatingCose.post('/cityNdToExamine/getDataByDw', params, {}, false)
}

//科目维度查看
export const getDataByKm = (params: KmView): Promise<Result> => {
  return otherOperatingCose.post('/cityNdToExamine/getDataByKm', params, {}, false)
}

//单位维度获取动态列表
export const getCityDynamicColumnByDw = (params: DwView): Promise<Result> => {
  return otherOperatingCose.get(`/cityNdToExamine/getDynamicColumnByDw?nd=${params.nd}&kmlx=${params.kmlx}`, {}, {}, false)
}

//科目维度获取动态列表
export const getCityDynamicColumnByKm = (params: KmView): Promise<Result> => {
  return otherOperatingCose.get(`/cityNdToExamine/getDynamicColumnByKm?nd=${params.nd}&kmlx=${params.kmlx}`, {}, {}, false)
}

//获取预安排单位审核-单位状态
export const getDwStatus = (params: DwStatus): Promise<Result> => {
  return otherOperatingCose.post('/cityNdToExamine/getDwStatus', params, {}, false)
}

//保存
export const saveByDw = (params: SaveByDw): Promise<Result> => {
  return otherOperatingCose.post('/cityNdToExamine/saveByDw', params, {}, false)
}

//审定下达
export const approvedAndIsssued = (params: ApprovedAndIsssued): Promise<Result> => {
  return otherOperatingCose.get(
    `/cityNdToExamine/approvedAndIsssued?busiType=${params.busiType}&ejdw=${params.ejdw}&kmlx=${params.kmlx}&nd=${params.nd}`,
    {},
    {},
    false
  )
}

//审定
export const authorize = (params: ApprovedAndIsssued): Promise<Result> => {
  return otherOperatingCose.get(
    `/cityNdToExamine/authorize?busiType=${params.busiType}&ejdw=${params.ejdw}&kmlx=${params.kmlx}&nd=${params.nd}`,
    {},
    {},
    false
  )
}

export const getCurrentPageData = (busiType: string, kmlx: string, nd: string, specialorgid: string): Promise<Result> => {
  return otherOperatingCose.post(
    `/cityNdToExamine/getCurrentPageData?busiType=${busiType}&kmlx=${kmlx}&nd=${nd}&specialorgid=${specialorgid}`,
    {},
    {},
    false
  )
}

// 导出
export const exportData = (params: DwView): Promise<Result> => {
  return otherOperatingCose.exportFile('/cityNdToExamine/export', params, {}, false)
}

// 单位维度导出
export const exportForDw = (params: DwView): Promise<Result> => {
  return otherOperatingCose.exportFile('/cityNdToExamine/exportForDw', params, {}, false)
}

// 科目维度导出
export const exportForKm = (params: ExportDataForKm): Promise<Result> => {
  return otherOperatingCose.exportFile('/cityNdToExamine/exportForKm', params, {}, false)
}
// 导入
export const importData = (parmas: ImportData): Promise<Result> => {
  return otherOperatingCose.post(`/cityNdToExamine/import?ejdw=${parmas.ejdw}&kmlx=${parmas.kmlx}&nd=${parmas.nd}`, parmas.excelFormData, {}, false)
}

// 导入模板
export const importTemplate = (parmas: ImportData): Promise<Result> => {
  return otherOperatingCose.exportFile(`/cityNdToExamine/getImportTemplate`, parmas, {}, false)
}
