import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface DataList {
  busiType: string
  dwId: string
  kmlx: string
  nd: string
  xsws: string
  parentId: string
}

interface DynamicColumn {
  busiType: string
  dwId: string
  kmlx: string
}

interface FormStatus {
  busiType: string
  dwId: string
  kmlx: string
  nd: string
  xsws: string
}

interface MxList {
  detailId: string
  dwId: string
  je: string
  yskmId: string
}

interface SaveData {
  dwDetailId: string
  mxList: MxList[]
}

interface KmDataList {
  busiType: string
  dwId: string
  kmlx: string
  nd: string
  xsws: string
  kmId: string
}

interface ImportData extends FormStatus {
  excelFormData: any
  specialorgid: string
  busiType: string
  dwId: string
  kmlx: string
  nd: string
}

interface ExportDataForKm {
  kmId: string
  kmlx: string
  nd: string
  xsws: string
  parentId: string
  specialorgid: string
  busiType: string
}

// 获取主页面列表数据
export const getDataList = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(
    `deptFj/getDataList?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}&parentId=${params.parentId}`
  )
}

// 按单位获取列表数据
export const getDataListByBm = (params: DataList): Promise<Result> => {
  return otherOperatingCose.post(
    `deptFj/getDataListByBm?busiType=${params.busiType}&dwId=${params.dwId}&xsws=${params.xsws}&kmlx=${params.kmlx}&nd=${params.nd}&parentId=${params.parentId}`
  )
}

// 按科目获取列表数据
export const getDataListByKm = (params: KmDataList): Promise<Result> => {
  return otherOperatingCose.post(
    `deptFj/getDataListByKm?busiType=${params.busiType}&dwId=${params.dwId}&xsws=${params.xsws}&kmlx=${params.kmlx}&nd=${params.nd}&kmId=${params.kmId}`
  )
}

// 获取主页面动态列
export const getDynamicColumn = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`deptFj/getDynamicColumn?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}`)
}

// 获取科目获取动态列
export const getDynamicColumnByKm = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`deptFj/getDynamicColumnByKm?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}`)
}

// 获取单位获取动态列
export const getDynamicColumnByBm = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post(`deptFj/getDynamicColumnByBm?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}`)
}

// 获取分解表单状态信息
export const getFormStatus = (params: FormStatus): Promise<Result> => {
  return otherOperatingCose.get(
    `deptFj/getFormStatus?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}`
  )
}

// 保存
export const save = (params: SaveData): Promise<Result> => {
  return otherOperatingCose.post(`deptFj/save`, params)
}

// 下达
export const xd = (dwDetailId: string): Promise<Result> => {
  return otherOperatingCose.post(`deptFj/xd?dwDetailId=${dwDetailId}`)
}

// 导出
export const exportData = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/deptFj/export?nd=${params.nd}&kmlx=${params.kmlx}&dwId=${params.dwId}&busiType=${params.busiType}&xsws=${params.xsws}`
  )
}

export const getImportTemplate = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/deptFj/getImportTemplate?busiType=${params.busiType}&nd=${params.nd}&xsws=${params.xsws}&dwId=${params.dwId}&kmlx=${params.kmlx}`
  )
}

// 导入
export const importData = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.post(
    `/deptFj/importData?busiType=${params.busiType}&dwId=${params.dwId}&nd=${params.nd}&kmlx=${params.kmlx}`,
    params.excelFormData
  )
}

// 单位维度导出
export const exportNdDataByBm = (params: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/deptFj/exportNdDataByBm?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&parentId=${params.parentId}&xsws=${params.xsws}`
  )
}

// 科目维度导出
export const exportNdDataByKm = (params: ExportDataForKm): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/deptFj/exportNdDataByKm?busiType=${params.busiType}&dwId=${params.specialorgid}&kmlx=${params.kmlx}&nd=${params.nd}&kmId=${params.kmId}&xsws=${params.xsws}`
  )
}
