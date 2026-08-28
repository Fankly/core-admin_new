import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

export interface DataList {
  kmlx?: string // 1主业2农委费
  nd: string
  parentId?: string // 初始值为-1
  specialorgid?: string
  dwId?: string
  busiType?: string
  mxList?: MxList[]
  kmId?: string
  xsws: string
}

export interface MxList {
  detailId: string
  je: string
  yskmId: string
}

export interface ExportDataForKm {
  kmId: string
  kmlx: string
  nd: string
  parentId: string
  specialorgid: string
}

export interface ImportData {
  excelFormData: any
  dwId: string
  kmlx: string
  nd: string
  specialorgid: string
}

// 获取列表
export const getDataList = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shyapxd/getDataList', params, {}, false)
}

// 获取动态列表
export const getDynamicColumn = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shyapxd/getDynamicColumn', params, {}, false)
}

// 单位维度获取动态列表
export const getDynamicColumnByDw = (params: DataList): Promise<Result> => {
  return otherOperatingCose.get('/shyapxd/getDynamicColumnByDw', params, {}, false)
}

// 科目维度获取动态列表
export const getDynamicColumnByKm = (params: DataList): Promise<Result> => {
  return otherOperatingCose.get('/shyapxd/getDynamicColumnByKm', params, {}, false)
}

// 单位维度查看
export const getDataByDw = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shyapxd/getDataByDw', params, {}, false)
}

// 科目维度查看
export const getDataByKm = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post('/shyapxd/getDataByKm', params, {}, false)
}

// 单位选择数据
export const getDwJc = (specialorgid: string, busiType: string, kmlx: string): Promise<Result> => {
  return otherOperatingCose.get(`/shyapxd/getDwJc?specialorgid=${specialorgid}&busiType=${busiType}&kmlx=${kmlx}`, {}, {}, false)
}
// 按单位维度保存
export const saveByDw = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(`/shyapxd/saveByDw`, params, {}, false)
}

// 判断是否已下达
export const judgeIsXd = (busiType: string, kmlx: string, nd: string): Promise<Result> => {
  return otherOperatingCose.get(`/shyapxd/judgeIsXd?busiType=${busiType}&kmlx=${kmlx}&nd=${nd}`, {}, {}, false)
}

// 判断是否已下达
export const judgeIsXdNew = (busiType: string, kmlx: string, nd: string): Promise<Result> => {
  return otherOperatingCose.get(`/shyapxd/judgeIsXdNew?busiType=${busiType}&kmlx=${kmlx}&nd=${nd}`, {}, {}, false)
}

//获取当前页面的dwDetailId
export const getCurrentPageData = (specialorgid: string, nd: string, kmlx: string): Promise<Result> => {
  return otherOperatingCose.post(`/shyapxd/getCurrentPageData?specialorgid=${specialorgid}&nd=${nd}&kmlx=${kmlx}`, {}, {}, false)
}

// 下达
export const releaseData = (busiType: string, kmlx: string, nd: string, specialorgid: string, roleId: string): Promise<Result> => {
  return otherOperatingCose.get(`/shyapxd/xd?busiType=${busiType}&kmlx=${kmlx}&nd=${nd}&specialorgid=${specialorgid}&roleId=${roleId}`, {}, {}, false)
}

// 下达
export const saveAndXd = (busiType: string, kmlx: string, nd: string, specialorgid: string, roleId: string): Promise<Result> => {
  return otherOperatingCose.get(
    `/shyapxd/saveAndXd?busiType=${busiType}&kmlx=${kmlx}&nd=${nd}&specialorgid=${specialorgid}&roleId=${roleId}`,
    {},
    {},
    false
  )
}

// 导出
export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shyapxd/export', params, {}, false)
}

// 单位维度导出
export const exportForDw = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shyapxd/exportForDw', params, {}, false)
}

// 科目维度导出
export const exportForKm = (params: ExportDataForKm): Promise<Result> => {
  return otherOperatingCose.exportFile('/shyapxd/exportForKm', params, {}, false)
}

// 按单位编制-获取导入模板
export const getDwImportTemplate = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/shyapxd/getDwImportTemplate', params, {}, false)
}

// 导入
export const importData = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.post(`/shyapxd/importDataByDw?dwId=${params.dwId}&nd=${params.nd}&kmlx=${params.kmlx}`, params.excelFormData, {}, false)
}
