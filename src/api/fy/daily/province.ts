import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface Records {
  dwId: string
  kmlx: string
  nd: string
  xsws: string
  parentId: string
}

interface SaveData {
  gwmbz: number
  id: number
}

interface DwData {
  kmlx: string
  nd: string
  xsws: string
  parentId?: string
  specialorgid: string
  dwIds?: string
}

interface KmData {
  nd: string
  xsws: string
  specialorgid: string
  yskmId: string
  kmlx: string
}

interface DynamicColumnByDw {
  specialorgid: string
  dwIds: string
  kmlx: string
}

interface KmlxMxList {
  dwValue: any
  yskmId: string
}

interface KmlxData {
  kmlx: string
  specialorgid: string
  nd: string
  mxLists: KmlxMxList[]
}

interface DwMxList {
  dwValue: any
  yskmId: string
}

interface DwSaveData {
  kmlx: string
  specialorgid: string
  nd: string
  mxLists: DwMxList[]
}

interface XdData {
  kmlx: string
  nd: string
  xsws: string
  sm: string
  specialorgid: string
}

interface ExportData {
  dwId: string
  kmlx: string
  nd: string
  xsws: string
  parentId: string
  busiType: string
}

// 获取省单位日常预算调整信息
export const getRcActiveInfo = (dwId: string, kmlx: string, nd: string, xsws: string): Promise<Result> => {
  return otherOperatingCose.get(`/rc/provYsAdjust/getRcActiveInfo?dwId=${dwId}&kmlx=${kmlx}&nd=${nd}&xsws=${xsws}`, {}, {}, false)
}

// 获取列表数据
export const getRecords = (params: Records): Promise<Result> => {
  return otherOperatingCose.post(`/rc/provYsAdjust/getRecords`, params, {}, false)
}

// 获取列表数据
export const getDataByDw = (params: DwData): Promise<Result> => {
  if (params.dwIds)
    return otherOperatingCose.post(
      `/rc/provYsAdjust/getDataByDw?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&parentId=${params.parentId}&specialorgid=${params.specialorgid}&dwIds=${params.dwIds}`,
      {},
      {},
      false
    )
  return otherOperatingCose.post(
    `/rc/provYsAdjust/getDataByDw?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&parentId=${params.parentId}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}

// 获取列表数据
export const getDataByKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/provYsAdjust/getDataByKm?nd=${params.nd}&xsws=${params.xsws}&specialorgid=${params.specialorgid}&yskmId=${params.yskmId}&kmlx=${params.kmlx}`,
    {},
    {},
    false
  )
}

// 获取动态列表
export const getDynamicColumn = (params: Records): Promise<Result> => {
  return otherOperatingCose.post(`/rc/provYsAdjust/getDynamicColumn?kmlx=${params.kmlx}`, {}, {}, false)
}

// 按单位维度编辑获取动态表头
export const getDynamicColumnByDw = (params: DynamicColumnByDw): Promise<Result> => {
  if (params.dwIds)
    return otherOperatingCose.post(
      `/rc/provYsAdjust/getDynamicColumnByDw?dwIds=${params.dwIds}&specialorgid=${params.specialorgid}&kmlx=${params.kmlx}`,
      {},
      {},
      false
    )
  return otherOperatingCose.post(`/rc/provYsAdjust/getDynamicColumnByDw?specialorgid=${params.specialorgid}&kmlx=${params.kmlx}`, {}, {}, false)
}

// 按单科目维度编辑获取动态表头
export const getDynamicColumnByKm = (params: Records): Promise<Result> => {
  return otherOperatingCose.post(`/rc/provYsAdjust/getDynamicColumnByKm?kmlx=${params.kmlx}`, {}, {}, false)
}

// 保存国网目标值
export const saveGwmbz = (params: SaveData[]): Promise<Result> => {
  return otherOperatingCose.post(`/rc/provYsAdjust/saveGwmbz`, params, {}, false)
}

// 单位维度保存
export const saveByDw = (params: DwSaveData): Promise<Result> => {
  return otherOperatingCose.post(`/rc/provYsAdjust/saveByDw`, params, {}, false)
}

// 科目维度保存
export const saveByKm = (params: KmlxData): Promise<Result> => {
  return otherOperatingCose.post(`/rc/provYsAdjust/saveByKm`, params, {}, false)
}

export const xd = (params: XdData): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/provYsAdjust/xd?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&sm=${params.sm}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}

// 导出
export const exportData = (params: ExportData): Promise<Result> => {
  return otherOperatingCose.exportFile('/rc/provYsAdjust/export', params, {}, false)
}

// 单位导出
export const exportDataForDw = (params: DwData): Promise<Result> => {
  if (params.dwIds)
    return otherOperatingCose.exportFile(
      `/rc/provYsAdjust/exportForDw?dwIds=${params.dwIds}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&specialorgid=${params.specialorgid}`,
      {},
      {},
      false
    )
  return otherOperatingCose.exportFile(
    `/rc/provYsAdjust/exportForDw?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}

// 科目导出
export const exportDataForKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/rc/provYsAdjust/exportForKm?yskmId=${params.yskmId}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}
