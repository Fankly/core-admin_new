import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface DataList {
  dwId: string
  nd: string
}

export interface SaveLists {
  dwLists: DwList[]
  itemId: string
  pid: string
}

export interface SaveData {
  dwId: string
  nd: string
  saveLists: SaveLists[]
}

export interface DwList {
  dwId: string
  ysje: number | string
}

export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile(`/comFzbz/export?dwId=${params.dwId}&nd=${params.nd}`, {}, {}, false)
}

export const getDataList = (params: DataList): Promise<Result> => {
  return otherOperatingCose.get(`/comFzbz/getData?dwId=${params.dwId}&nd=${params.nd}`, {}, {}, false)
}

export const getDynamicColumnData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.get(`/comFzbz/getDynamicColumn?dwId=${params.dwId}`, {}, {}, false)
}

export const getFormInfo = (params: DataList): Promise<Result> => {
  return otherOperatingCose.get(`/comFzbz/getFormInfo?dwId=${params.dwId}`, {}, {}, false)
}

export const saveData = (params: SaveData): Promise<Result> => {
  return otherOperatingCose.post(`/comFzbz/save`, params, {}, false)
}
