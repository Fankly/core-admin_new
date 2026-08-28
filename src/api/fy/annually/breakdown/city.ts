import { otherOperatingCose } from '@/api/fy'

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
export const getDataList = (params: DataList): any => {
  return otherOperatingCose.post(
    `cityDwFj/getDataList?busiType=${params.busiType}&xsws=${params.xsws}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&parentId=${params.parentId}`,
    {},
    {},
    false
  )
}

// 按单位获取列表数据
export const getDataListByDw = (params: DataList): any => {
  return otherOperatingCose.post(
    `cityDwFj/getDataListByDw?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&xsws=${params.xsws}&nd=${params.nd}&parentId=${params.parentId}`,
    {},
    {},
    false
  )
}

export const getDynamicColumnByNdWf = (params: DataList): any => {
  return otherOperatingCose.post(`cityDwFj/getDynamicColumnByNdWf?dwId=${params.dwId}`, {}, {}, false)
}

export const getDataListByNdWf = (params: DataList): any => {
  return otherOperatingCose.post(
    `cityDwFj/getDataListByNdWf?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&parentId=${params.parentId}`,
    {},
    {},
    false
  )
}

// 按科目获取列表数据
export const getDataListByKm = (params: KmDataList): any => {
  return otherOperatingCose.post(
    `cityDwFj/getDataListByKm?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&kmId=${params.kmId}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

// 获取主页面动态列
export const getDynamicColumn = (params: DynamicColumn): any => {
  return otherOperatingCose.post(`cityDwFj/getDynamicColumn?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}`, {}, {}, false)
}

// 获取科目获取动态列
export const getDynamicColumnByKm = (params: DynamicColumn): any => {
  return otherOperatingCose.post(`cityDwFj/getDynamicColumnByKm?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}`, {}, {}, false)
}

// 获取单位获取动态列
export const getDynamicColumnByDw = (params: DynamicColumn): any => {
  return otherOperatingCose.post(`cityDwFj/getDynamicColumnByDw?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}`, {}, {}, false)
}

// 获取分解表单状态信息
export const getFormStatus = (params: FormStatus): any => {
  return otherOperatingCose.get(
    `cityDwFj/getFormStatus?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

// 保存
export const save = (params: SaveData): any => {
  return otherOperatingCose.post(`cityDwFj/save`, params, {}, false)
}

// 下达
export const xd = (dwDetailId: string): any => {
  return otherOperatingCose.post(`cityDwFj/xd?dwDetailId=${dwDetailId}`, {}, {}, false)
}

// 导出
export const exportData = (params: DataList): any => {
  return otherOperatingCose.exportFile(
    `/cityDwFj/export?nd=${params.nd}&kmlx=${params.kmlx}&dwId=${params.dwId}&busiType=${params.busiType}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

export const getImportTemplate = (params: DataList): any => {
  return otherOperatingCose.exportFile(
    `/cityDwFj/getImportTemplate?busiType=${params.busiType}&nd=${params.nd}&dwId=${params.dwId}&kmlx=${params.kmlx}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

// 导入
export const importData = (params: ImportData): any => {
  return otherOperatingCose.post(
    `/cityDwFj/importData?busiType=${params.busiType}&dwId=${params.dwId}&nd=${params.nd}&kmlx=${params.kmlx}`,
    params.excelFormData,
    {},
    false
  )
}

// 单位维度导出
export const exportForDw = (params: DataList): any => {
  return otherOperatingCose.exportFile(
    `/cityDwFj/exportForDw?busiType=${params.busiType}&dwId=${params.dwId}&kmlx=${params.kmlx}&nd=${params.nd}&parentId=${params.parentId}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}

// 科目维度导出
export const exportForKm = (params: ExportDataForKm): any => {
  return otherOperatingCose.exportFile(
    `/cityDwFj/exportForKm?busiType=${params.busiType}&dwId=${params.specialorgid}&kmlx=${params.kmlx}&nd=${params.nd}&kmId=${params.kmId}&xsws=${params.xsws}`,
    {},
    {},
    false
  )
}
