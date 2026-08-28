import baseService from '@/service/baseService'

interface DataList {
  cj: string
  nd: string
  parentId: string
  specialorgid: string
  isZgs: any
}

interface DataCompare extends DataList {
  versionIds: string
}

interface ImportData {
  excelFormData: any
  specialorgid: string
  nd: string
  isZgs: any
}

interface exportData {
  nd: string
  specialorgid: string
  isZgs: any
}

interface LogData {
  dwName: string
  limit: number
  name: string
  nd: string
  page: number
  specialorgid: string
  xgrName: string
  xgsjEnd: string
  xgsjStart: string
}

interface SaveData {
  nd: string
  specialorgid: string
  saveData: any[]
  isZgs: any
}

export const exportData = (params: exportData): any => {
  return baseService.export(`/mbz/export?nd=${params.nd}&specialorgid=${params.specialorgid}&isZgs=${params.isZgs}`)
}

export const getData = (params: DataList): any => {
  return baseService.get(
    `/mbz/getData?cj=${params.cj}&nd=${params.nd}&parentId=${params.parentId}&specialorgid=${params.specialorgid}&isZgs=${params.isZgs}`
  )
}

export const getCompareColumn = (specialorgid: string, versionIds: string, isZgs: any): any => {
  return baseService.post(`/mbz/version/detail/getCompareColumn?dwId=${specialorgid}&versionIds=${versionIds}&isZgs=${isZgs}`)
}

export const getCompareData = (params: DataCompare): any => {
  return baseService.post(
    `/mbz/version/detail/getCompareData?cj=${params.cj}&nd=${params.nd}&parentId=${params.parentId}&dwId=${params.specialorgid}&versionIds=${params.versionIds}&isZgs=${params.isZgs}`
  )
}

export const getDynamicColumn = (specialorgid: string, isZgs: string | number, edit = ''): any => {
  return baseService.get(`/mbz/getDynamicColumn?specialorgid=${specialorgid}&isZgs=${isZgs}&edit=${edit}`)
}

export const getImportTemplate = (params: exportData): any => {
  return baseService.export(`/mbz/getImportTemplate?specialorgid=${params.specialorgid}&nd=${params.nd}&isZgs=${params.isZgs}`)
}

// 导入
export const importData = (params: ImportData): any => {
  return baseService.post(`/mbz/import?specialorgid=${params.specialorgid}&nd=${params.nd}&isZgs=${params.isZgs}`, params.excelFormData)
}

export const getLog = (params: LogData): any => {
  return baseService.post('/mbz/getLog', params)
}

export const save = (params: SaveData): any => {
  return baseService.post(`/mbz/save?nd=${params.nd}&specialorgid=${params.specialorgid}&isZgs=${params.isZgs}`, params.saveData)
}

export const getDataCheck = (params: any): any => {
  return baseService.get(
    `/mbz/getDataV2?checkPropackYs=${params.checkPropackYs}&cj=${params.cj}&nd=${params.nd}&parentId=${params.parentId}&specialorgid=${params.specialorgid}&isZgs=${params.isZgs}`
  )
}

export const getDynamicColumnCheck = (specialorgid: string, isZgs: any, checkPropackYs: any): any => {
  return baseService.get(`/mbz/getDynamicColumnV2?checkPropackYs=${checkPropackYs}&specialorgid=${specialorgid}&isZgs=${isZgs}`)
}

export const exportDataCheck = (params: any): any => {
  return baseService.export(
    `/mbz/exportV2?checkPropackYs=${params.checkPropackYs}&nd=${params.nd}&specialorgid=${params.specialorgid}&isZgs=${params.isZgs}`
  )
}

export const getDataForCt = (params: any): any => {
  return baseService.get(
    `/mbz/getDataForCt?dwId=${params.dwId}&nd=${params.nd}&parentId=${params.parentId}&specialorgid=${params.specialorgid}&isZgs=${params.isZgs}`
  )
}

export const getDynamicColumnForCt = (params: any): any => {
  return baseService.get(`/mbz/getDynamicColumnForCt?dwId=${params.dwId}&specialorgid=${params.specialorgid}&isZgs=${params.isZgs}`)
}
