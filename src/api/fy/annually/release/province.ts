import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

export interface CsData {
  kmlx: string
  nd: string
  xsws: string
  specialorgid: string
  roleId?: string
}

export interface DataList {
  busiType: string
  kmlx: string
  nd: string
  xsws: string
  parentId: string
  specialorgid: string
}

export interface KmData {
  kmlx: string
  nd: string
  xsws: string
  kmId: string
  specialorgid: string
}

export interface DwData {
  busiType: string
  dwId: string
  kmlx: string
  nd: string
  parentId: string
  specialorgid: string
}

export interface DynamicColumn {
  nd: string
  opType?: string
  kmlx: string
}

interface List {
  dwValues: Promise<Result>
  yskmId: string
}

export interface SaveData {
  kmlx: string
  lists: List[]
  nd: string | number
  specialorgid: string
}

export interface ExportDataForKm {
  kmId: string
  kmlx: string
  nd: string
  parentId: string
  specialorgid: string
}

// 下达
export const xdData = (params: CsData): Promise<Result> => {
  return otherOperatingCose.post('/shNdXd/xd', params, {}, false)
}

// 保存
export const save = (params: SaveData): Promise<Result> => {
  return otherOperatingCose.post('/shNdXd/save', params, {}, false)
}

// 测算
export const csData = (params: CsData): Promise<Result> => {
  return otherOperatingCose.post('/shNdXd/cs', params, {}, false)
}

// 判断是否已下达
export const judgeIsXd = (specialorgid: string, kmlx: string, nd: string): Promise<Result> => {
  return otherOperatingCose.post(`/shNdXd/getCurrentPageData?specialorgid=${specialorgid}&kmlx=${kmlx}&nd=${nd}`, {}, {}, false)
}

// 获取列表
export const getDataList = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shNdXd/getDataList', params, {}, false)
}

// 单位维度查看
export const getDataByDw = (params: DwData): Promise<Result> => {
  return otherOperatingCose.post('/shNdXd/getDataListByDw', params, {}, false)
}

// 科目维度查看
export const getDataByKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.post('/shNdXd/getDataListByKm', params, {}, false)
}

// 获取动态列表
export const getDynamicColumn = (nd: string, specialorgid: string, kmlx: string): Promise<Result> => {
  return otherOperatingCose.get(`/shNdXd/getDynamicColumn?specialorgid=${specialorgid}&nd=${nd}&kmlx=${kmlx}`, {}, {}, false)
}

// 单位维度获取动态列表
export const getDynamicColumnByDw = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`/shNdXd/getDynamicColumnByDw?nd=${params.nd}&kmlx=${params.kmlx}`, {}, {}, false)
}

// 科目维度获取动态列表
export const getDynamicColumnByKm = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`/shNdXd/getDynamicColumnByKm?nd=${params.nd}&kmlx=${params.kmlx}`, {}, {}, false)
}

// 导出
export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shNdXd/export', params, {}, false)
}

// 单位维度导出
export const exportForDw = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shNdXd/exportForDw', params, {}, false)
}

// 科目维度导出
export const exportForKm = (params: ExportDataForKm): Promise<Result> => {
  return otherOperatingCose.exportFile('/shNdXd/exportForKm', params, {}, false)
}
