import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'
import { FormStatus, ImportData } from '@/api/fy/types'

export interface SaveData {
  dwDetailId: string
  mxList: MxList[]
}

export interface DataList extends FormStatus {
  parentId: string
}

export interface KmData {
  busiType: string
  dwId: string
  kmId: string
  kmlx: string
  nd: string
  xsws: string
}

export interface MxList {
  detailId: string
  dwId: string
  je: string
  yskmId: string
}

export const getFormStatus = (params: FormStatus): Promise<Result> => {
  return otherOperatingCose.get(
    `deptFj/getFormStatus?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}`,
    {},
    {},
    false
  )
}

export const getData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(
    `deptFj/getDataList?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&parentId=${params.parentId}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

export const getDynamicColumn = (busiType: string, dwId: string, kmlx: string): Promise<Result> => {
  return otherOperatingCose.post(`deptFj/getDynamicColumn?busiType=${busiType}&dwId=${dwId}&kmlx=${kmlx}`, {}, {}, false)
}

export const save = (params: SaveData): Promise<Result> => {
  return otherOperatingCose.post(`deptFj/save`, params, {}, false)
}

export const xd = (dwDetailId: string): Promise<Result> => {
  return otherOperatingCose.post(`deptFj/xd?dwDetailId=${dwDetailId}`, {}, {}, false)
}

// 导出
export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/deptFj/export?nd=${params.nd}&kmlx=${params.kmlx}&dwId=${params.dwId}&busiType=${params.busiType}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

export const getImportTemplate = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/deptFj/getImportTemplate?busiType=${params.busiType}&nd=${params.nd}&dwId=${params.dwId}&kmlx=${params.kmlx}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

// 导入
export const importData = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.post(
    `/deptFj/importData?busiType=${params.busiType}&dwId=${params.dwId}&nd=${params.nd}&kmlx=${params.kmlx}&xsws=${params.xsws}`,
    params.excelFormData,
    {},
    false
  )
}

export const getDataByKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.post(
    `/deptFj/getDataListByKm?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&kmId=${params.kmId}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}
export const getDynamicColumnByKm = (params: KmData): Promise<Result> => {
  return otherOperatingCose.post(`/deptFj/getDynamicColumnByKm?busiType=${params.busiType}&kmlx=${params.kmlx}`, {}, {}, false)
}
