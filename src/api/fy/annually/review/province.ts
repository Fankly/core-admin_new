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
  busiType: string
  specialorgid: string
  parentId: string
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

export interface ExportDataForKm {
  kmId: string
  kmlx: string
  nd: string
  parentId: string
  specialorgid: string
}

interface SaveDfjData {
  dwId: string
  kmlx: string
  nd: string
  valueMap: {
    [key: string]: number
  }
}

interface ImportData {
  excelFormData?: Promise<Result>
  kmlx: string
  nd: string
  ejdw: string
}

// 获取附件列表
export const getAttachList = (params: AttachList): Promise<Result> => {
  return otherOperatingCose.post(`/shNdSd/getAttachList?dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}`, params, {}, false)
}

// 获取列表
export const getDataList = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shNdSd/getDataList', params, {}, false)
}

// 获取预安排科目审核获取列表
export const getDataListByKm = (params: KmDataList): Promise<Result> => {
  return otherOperatingCose.post('/shNdSd/getDataListByKm', params, {}, false)
}

//  获取预安排单位审核获取列表
export const getDataListDwDetail = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shNdSd/getDataListDwDetail', params, {}, false)
}

// 预安排单位审核-单位状态
export const getDwStatus = (params: DwStatus): Promise<Result> => {
  return otherOperatingCose.get(`/shNdSd/getDwStatus?kmlx=${params.kmlx}&nd=${params.nd}&specialorgid=${params.specialorgid}`, {}, {}, false)
}

// 获取列表动态表头
export const getDynamicColumn = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post('/shNdSd/getDynamicColumn', params, {}, false)
}

// 科目维度查看动态列表
export const getDynamicColumnByKm = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`/shNdSd/getDynamicColumnByKm`, params, {}, false)
}

// 科目维度查看动态列表
export const getDynamicColumnDwDetail = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`/shNdSd/getDynamicColumnDwDetail`, params, {}, false)
}
// 保存
export const provinceSave = (params: ProvinceSave): Promise<Result> => {
  return otherOperatingCose.post(`/shNdSd/save`, params, {}, false)
}

// 审定
export const provinceSd = (params: ProvinceSd): Promise<Result> => {
  return otherOperatingCose.post(`/shNdSd/sd?dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}`, {}, {}, false)
}

// 审定下达
export const provinceXd = (params: ProvinceSd): Promise<Result> => {
  return otherOperatingCose.post(`/shNdSd/xd?specialorgid=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}`, {}, {}, false)
}

//获取当前页面的dwDetailId
export const getCurrentPageData = (specialorgid: string, nd: string, kmlx: string): Promise<Result> => {
  return otherOperatingCose.post(`/shNdSd/getCurrentPageData?specialorgid=${specialorgid}&nd=${nd}&kmlx=${kmlx}`, {}, {}, false)
}

// 导出
export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shNdSd/export', params, {}, false)
}

// 导出
export const getDwImportTemplate = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.exportFile('/shNdSd/getDwImportTemplate', params, {}, false)
}

// 导入
export const importDataByDw = (parmas: ImportData): Promise<Result> => {
  return otherOperatingCose.post(`/shNdSd/importDataByDw?dwId=${parmas.ejdw}&kmlx=${parmas.kmlx}&nd=${parmas.nd}`, parmas.excelFormData, {}, false)
}

// 单位维度导出
export const exportForDw = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shNdSd/exportForDw', params, {}, false)
}

// 科目维度导出
export const exportForKm = (params: ExportDataForKm): Promise<Result> => {
  return otherOperatingCose.exportFile('/shNdSd/exportForKm', params, {}, false)
}

// 手动保存待分解值
export const saveDfj = (params: SaveDfjData): Promise<Result> => {
  return otherOperatingCose.post('/shNdSd/saveDfj', params, {}, false)
}
