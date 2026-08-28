import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

export interface Basic {
  kmlx: string
  nd: string
  xsws: string
}

export interface AttachList extends Basic {
  dwId: string
}

export interface DataList extends Basic {
  specialorgid: string
  parentId: string
  busiType: string
}

export interface KmDataList extends Basic {
  specialorgid: string
  kmId: string
}

export interface DwDataList extends Basic {
  dwId: string
  specialorgid: string
  parentId: string
}

export interface DwStatus extends Basic {
  specialorgid: string
}

export interface DynamicColumn {
  specialorgid: string
  nd: string
}

export interface List {
  detailId: number
  sdje: number
  yskmId: number
}

export interface ProvinceSave {
  dwId: string
  kmlx: string
  lists: List[]
  nd: string
}

export interface ProvinceSd {
  dwId: string
  kmlx: string
  nd: string
}
export interface ProvinceXd {
  specialorgid: string
  kmlx: string
  nd: string
}

interface JudgeSaved {
  busiType: string
  dwId: string
  kmlx: string
  nd: string
  xsws: string
}

export interface ExportDataForKm {
  kmId: string
  kmlx: string
  nd: string
  parentId: string
  specialorgid: string
}

export interface ImportData {
  excelFormData: Promise<Result>
  dwId: string
  kmlx: string
  nd: string
  specialorgid: string
}

// 获取附件列表
export const getAttachList = (params: AttachList): Promise<Result> => {
  return otherOperatingCose.post(`/shYapSd/getAttachList?dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}`, params, {}, false)
}

// 获取列表
export const getDataList = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shYapSd/getDataList', params, {}, false)
}

// 获取预安排科目审核获取列表
export const getDataListByKm = (params: KmDataList): Promise<Result> => {
  return otherOperatingCose.post('/shYapSd/getDataListByKm', params, {}, false)
}

//  获取预安排单位审核获取列表
export const getDataListDwDetail = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shYapSd/getDataListDwDetail', params, {}, false)
}

// 预安排单位审核-单位状态
export const getDwStatus = (params: DwStatus): Promise<Result> => {
  return otherOperatingCose.get(`/shYapSd/getDwStatus?kmlx=${params.kmlx}&nd=${params.nd}&specialorgid=${params.specialorgid}`, {}, {}, false)
}

// 获取列表动态表头
export const getDynamicColumn = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post('/shYapSd/getDynamicColumn', params, {}, false)
}

// 科目维度查看动态列表
export const getDynamicColumnByKm = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`/shYapSd/getDynamicColumnByKm`, params, {}, false)
}

// 科目维度查看动态列表
export const getDynamicColumnDwDetail = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`/shYapSd/getDynamicColumnDwDetail`, params, {}, false)
}
// 保存
export const provinceSave = (params: ProvinceSave): Promise<Result> => {
  return otherOperatingCose.post(`/shYapSd/save`, params, {}, false)
}

// 判断是否点结果保存
export const judgeSaved = (params: JudgeSaved): Promise<Result> => {
  return otherOperatingCose.post('/shYapSd/judgeSaved', params, {}, false)
}

// 审定
export const provinceSd = (params: ProvinceSd): Promise<Result> => {
  return otherOperatingCose.post(`/shYapSd/sd?dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}`, {}, {}, false)
}

// 审定下达
export const provinceXd = (params: ProvinceSd): Promise<Result> => {
  return otherOperatingCose.post(`/shYapSd/xd?specialorgid=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}`, {}, {}, false)
}

//获取当前页面的dwDetailId
export const getCurrentPageData = (specialorgid: string, nd: string, kmlx: string): Promise<Result> => {
  return otherOperatingCose.post(`/shYapSd/getCurrentPageData?specialorgid=${specialorgid}&nd=${nd}&kmlx=${kmlx}`, {}, {}, false)
}

// 导出
export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shYapSd/export', params, {}, false)
}

// 单位维度导出
export const exportForDw = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shYapSd/exportForDw', params, {}, false)
}

// 科目维度导出
export const exportForKm = (params: ExportDataForKm): Promise<Result> => {
  return otherOperatingCose.exportFile('/shYapSd/exportForKm', params, {}, false)
}

// 按单位编制-获取导入模板
export const getDwImportTemplate = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shYapSd/getDwImportTemplate', params, {}, false)
}

// 导入
export const importData = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.post(`/shYapSd/importDataByDw?dwId=${params.dwId}&nd=${params.nd}&kmlx=${params.kmlx}`, params.excelFormData, {}, false)
}
