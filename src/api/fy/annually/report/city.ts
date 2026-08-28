import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface Basic {
  busiType: string
  kmlx: string
  nd: string
  specialorgid: string
}

interface DataList extends Basic {
  parentId: string
}

export interface List {
  csjsCity: string
  detailId: number
  sbje: number
  sbsm: string
  yskmId: number
}

interface SaveData {
  busiType: string
  kmlx: string
  nd: string
  specialorgid: string
  lists: List[]
}

export interface ImportData {
  excelFormData: Promise<Result>
  dwId: string
  kmlx: string
  nd: string
  specialorgid: string
}

export const getCurrentPageData = (kmlx: string, nd: string, specialorgid: string): Promise<Result> => {
  return otherOperatingCose.post(`/sNdSb/getCurrentPageData?kmlx=${kmlx}&nd=${nd}&specialorgid=${specialorgid}`, {}, {}, false)
}

export const getDataList = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(`/sNdSb/getDataList`, params, {}, false)
}

export const getDataByWf = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(`/sNdSb/getDataByWf`, params, {}, false)
}

export const getDynamicColumn = (params: Basic): Promise<Result> => {
  return otherOperatingCose.get(`/sNdSb/getDynamicColumn?nd=${params.nd}&kmlx=${params.kmlx}`, {}, {}, false)
}

export const getDynamicColumnByWf = (params: Basic): Promise<Result> => {
  return otherOperatingCose.get(`/sNdSb/getDynamicColumnByWf?nd=${params.nd}`, {}, {}, false)
}

export const citySave = (params: SaveData): Promise<Result> => {
  return otherOperatingCose.post(`/sNdSb/save`, params, {}, false)
}

export const citySb = (kmlx: string, nd: string, specialorgid: string): Promise<Result> => {
  return otherOperatingCose.post(`/sNdSb/sb?kmlx=${kmlx}&nd=${nd}&specialorgid=${specialorgid}`, {}, {}, false)
}

export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/sNdSb/export', params, {}, false)
}

// 获取导入模板
export const getImportTemplate = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/sNdSb/getImportTemplate', params, {}, false)
}

// 导入
export const importData = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.post(
    `/sNdSb/import?specialorgid=${params.specialorgid}&nd=${params.nd}&kmlx=${params.kmlx}`,
    params.excelFormData,
    {},
    false
  )
}
