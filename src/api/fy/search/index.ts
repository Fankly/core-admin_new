import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

export interface DwLists {
  code: string
  nodeType: string
}

export interface SearchData {
  parentId: string
  dwId: string
  dwLists: DwLists[]
  endTime: string
  startTime: string
  yskmLists: string[]
  yslx: string[]
  yszlx: string[]
  xsws: string
}

export interface CtParams {
  current: string
  dwId: string
  endTime: string
  fieldId: string | null
  id: string
  size: number
  startTime: string
}

interface Params {
  dwId: string
  dwName: string
}

// 导出
export const exportData = (params: SearchData): Promise<Result> => {
  return otherOperatingCose.exportFile(`bzcbcx/export`, params, {}, false)
}

// 获取数据
export const getData = (params: SearchData): Promise<Result> => {
  return otherOperatingCose.post(`bzcbcx/getData`, params, {}, false)
}

// 获取数据
export const getDynamicColumn = (params: SearchData): Promise<Result> => {
  return otherOperatingCose.post(`bzcbcx/getDynamicColumn`, params, {}, false)
}

// 获取初始化数据
export const getFormData = (dwId: string): Promise<Result> => {
  return otherOperatingCose.get(`bzcbcx/getFormData?dwId=${dwId}`, {}, {}, false)
}

// 获取穿透
export const getctData = (params: CtParams): Promise<Result> => {
  return otherOperatingCose.post(`bzcbcx/ct`, params, {}, false)
}

// 导出穿透
export const exportCtData = (params: CtParams): Promise<Result> => {
  return otherOperatingCose.exportFile(`bzcbcx/ctExport`, params, {}, false)
}

// 查询
export const getDwStatus = (params: Params): Promise<Result> => {
  return otherOperatingCose.get(`fyjsc/getDwStatus?dwId=${params.dwId}&dwName=${params.dwName}`, {}, {}, false)
}

// fy查询
export const getXmInfo = (xmbm: any): Promise<Result> => {
  return otherOperatingCose.get(`fyjsc/getXmInfo?xmbm=${xmbm}`, {}, {}, false)
}
