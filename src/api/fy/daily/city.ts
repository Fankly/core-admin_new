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
  dwValue: Promise<Result>
  yskmId: string
}

interface KmlxData {
  kmlx: string
  specialorgid: string
  nd: string
  mxLists: KmlxMxList[]
}

interface DwMxList {
  dwValue: Promise<Result>
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
  return otherOperatingCose.get(`/rc/cityYsAdjust/getRcActiveInfo?dwId=${dwId}&kmlx=${kmlx}&nd=${nd}&xsws=${xsws}`, {}, {}, false)
}

// 获取列表数据
export const getRecords = (params: Records): Promise<Result> => {
  return otherOperatingCose.post(`/rc/cityYsAdjust/getRecords`, params, {}, false)
}

// 获取列表数据
export const getDataByDw = (params: DwData): Promise<Result> => {
  if (params.dwIds)
    return otherOperatingCose.post(
      `/rc/cityYsAdjust/getDataByDw?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&parentId=${params.parentId}&specialorgid=${params.specialorgid}&dwIds=${params.dwIds}`,
      {},
      {},
      false
    )
  return otherOperatingCose.post(
    `/rc/cityYsAdjust/getDataByDw?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&parentId=${params.parentId}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}

// 获取列表数据
export const getDataByKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/cityYsAdjust/getDataByKm?nd=${params.nd}&specialorgid=${params.specialorgid}&xsws=${params.xsws}&yskmId=${params.yskmId}&kmlx=${params.kmlx}`,
    {},
    {},
    false
  )
}

// 获取动态列表
export const getDynamicColumn = (params: Records): Promise<Result> => {
  return otherOperatingCose.post(`/rc/cityYsAdjust/getDynamicColumn?kmlx=${params.kmlx}`, {}, {}, false)
}

// 按单位维度编辑获取动态表头
export const getDynamicColumnByDw = (params: DynamicColumnByDw): Promise<Result> => {
  if (params.dwIds)
    return otherOperatingCose.post(
      `/rc/cityYsAdjust/getDynamicColumnByDw?dwIds=${params.dwIds}&specialorgid=${params.specialorgid}&kmlx=${params.kmlx}`,
      {},
      {},
      false
    )
  return otherOperatingCose.post(`/rc/cityYsAdjust/getDynamicColumnByDw?specialorgid=${params.specialorgid}&kmlx=${params.kmlx}`, {}, {}, false)
}

// 按单科目维度编辑获取动态表头
export const getDynamicColumnByKm = (params: Records): Promise<Result> => {
  return otherOperatingCose.post(`/rc/cityYsAdjust/getDynamicColumnByKm?kmlx=${params.kmlx}`, {}, {}, false)
}

// 保存国网目标值
export const saveGwmbz = (params: SaveData[]): Promise<Result> => {
  return otherOperatingCose.post(`/rc/cityYsAdjust/saveGwmbz`, params, {}, false)
}

// 单位维度保存
export const saveByDw = (params: DwSaveData): Promise<Result> => {
  return otherOperatingCose.post(`/rc/cityYsAdjust/saveByDw`, params, {}, false)
}

// 科目维度保存
export const saveByKm = (params: KmlxData): Promise<Result> => {
  return otherOperatingCose.post(`/rc/cityYsAdjust/saveByKm`, params, {}, false)
}

// 科目维度保存
export const xd = (params: XdData): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/cityYsAdjust/xd?kmlx=${params.kmlx}&nd=${params.nd}&sm=${params.sm}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}

// 导出
export const exportData = (params: ExportData): Promise<Result> => {
  return otherOperatingCose.exportFile('/rc/cityYsAdjust/export', params, {}, false)
}

// 单位导出
export const exportDataForDw = (params: DwData): Promise<Result> => {
  if (params.dwIds)
    return otherOperatingCose.exportFile(
      `/rc/cityYsAdjust/exportForDw?dwIds=${params.dwIds}&kmlx=${params.kmlx}&xsws=${params.xsws}&nd=${params.nd}&specialorgid=${params.specialorgid}`,
      {},
      {},
      false
    )
  return otherOperatingCose.exportFile(
    `/rc/cityYsAdjust/exportForDw?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}

// 科目导出
export const exportDataForKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/rc/cityYsAdjust/exportForKm?yskmId=${params.yskmId}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}
