import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface DataList {
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
  specialorgid: string
  kmlx: string
  nd: string
  xsws: string
  parentId?: string
  dwIds?: string
}

interface KmData {
  nd: string
  xsws: string
  specialorgid: string
  yskmId: string
  kmlx: string
}

interface DynamicColumnByBm {
  specialorgid: string
  dwIds: string
  kmlx: string
}

interface KmlxMxList {
  detailId: number
  dwId: string
  je: number
  yskmId: number
}

interface KmlxData {
  dwId: string
  id: string
  kmlx: string
  mxList: KmlxMxList[]
  nd: number
}

interface BmMxList {
  detailId: number
  dwId: string
  je: number
  yskmId: number
}

interface BmSaveData {
  dwId: string
  id: number
  kmlx: string
  mxList: BmMxList[]
  nd: number
}

interface XdData {
  id: string
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
  return otherOperatingCose.get(`/rc/deptYsAdjust/getRcActiveInfo?dwId=${dwId}&kmlx=${kmlx}&nd=${nd}&xsws=${xsws}`, {}, {}, false)
}

// 获取列表数据
export const getDataList = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/deptYsAdjust/getDataList?dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&parentId=${params.parentId}
  `,
    {},
    {},
    false
  )
}

// 获取列表数据
export const getDataListByBm = (params: DwData): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/deptYsAdjust/getDataListByBm?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&parentId=${params.parentId}&dwId=${params.specialorgid}`,
    {},
    {},
    false
  )
}

// 获取列表数据
export const getDataListByKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.post(
    `/rc/deptYsAdjust/getDataListByKm?nd=${params.nd}&dwId=${params.specialorgid}&xsws=${params.xsws}&kmId=${params.yskmId}&kmlx=${params.kmlx}`,
    {},
    {},
    false
  )
}

// 获取动态列表
export const getDynamicColumn = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(`/rc/deptYsAdjust/getDynamicColumn?kmlx=${params.kmlx}`, {}, {}, false)
}

// 按部门维度编辑获取动态表头
export const getDynamicColumnByBm = (params: DynamicColumnByBm): Promise<Result> => {
  if (params.dwIds)
    return otherOperatingCose.post(
      `/rc/deptYsAdjust/getDynamicColumnByBm?dwId=${params.specialorgid}&cbzx=${params.dwIds}&kmlx=${params.kmlx}`,
      {},
      {},
      false
    )
  return otherOperatingCose.post(`/rc/deptYsAdjust/getDynamicColumnByBm?dwId=${params.specialorgid}&kmlx=${params.kmlx}`, {}, {}, false)
}

// 按单科目维度编辑获取动态表头
export const getDynamicColumnByKm = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(`/rc/deptYsAdjust/getDynamicColumnByKm?kmlx=${params.kmlx}`, {}, {}, false)
}

// 保存国网目标值
export const saveGwmbz = (params: SaveData[]): Promise<Result> => {
  return otherOperatingCose.post(`/rc/deptYsAdjust/saveGwmbz`, params, {}, false)
}

// 单位维度保存
export const saveByBm = (params: BmSaveData): Promise<Result> => {
  return otherOperatingCose.post(`/rc/deptYsAdjust/saveByBm`, params, {}, false)
}

// 科目维度保存
export const saveByKm = (params: KmlxData): Promise<Result> => {
  return otherOperatingCose.post(`/rc/deptYsAdjust/saveByKm`, params, {}, false)
}

// 下达
export const xd = (params: XdData): Promise<Result> => {
  return otherOperatingCose.post(`/rc/deptYsAdjust/xd?id=${params.id}&description=${params.sm}`)
}

// 获取单位成本中心列表
export const getDwCbzxList = (dwId: string, kmlx: string): Promise<Result> => {
  return otherOperatingCose.get(`/rc/deptYsAdjust/getDwCbzxList?dwId=${dwId}&kmlx=${kmlx}`, {}, {}, false)
}

// 导出
export const exportData = (params: ExportData): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/rc/deptYsAdjust/export?dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

// 单位导出
export const exportDataForBm = (params: DwData): Promise<Result> => {
  if (params.dwIds)
    return otherOperatingCose.exportFile(
      `/rc/deptYsAdjust/exportForBm?dwIds=${params.dwIds}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&specialorgid=${params.specialorgid}`,
      {},
      {},
      false
    )
  return otherOperatingCose.exportFile(
    `/rc/deptYsAdjust/exportForBm?kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&specialorgid=${params.specialorgid}`,
    {},
    {},
    false
  )
}

// 科目导出
export const exportDataForKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/rc/deptYsAdjust/exportForKm?kmId=${params.yskmId}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&dwId=${params.specialorgid}`,
    {},
    {},
    false
  )
}
