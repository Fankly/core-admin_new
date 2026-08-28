import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface BaseCity {
  nd: string
  xsws: string
  busiType?: string // 业务类型 (YAP-预安排 ND-年度 RQ-日常)
  kmlx: string // 1-主业 2-农维费
  specialorgid: string
}

interface CityYapEscalation extends BaseCity {
  lists: List[]
}

interface DataList extends BaseCity {
  parentId: string
}

export interface List {
  detailId: string
  sbje: string
  yskmId: string
  sbsm: string
}

interface ImportData {
  excelFormData?: Promise<Result>
  kmlx: string
  nd: string
  xsws: string
  specialorgid: string
}

// 获取数据列
export const getData = (parmas: DataList): Promise<Result> => {
  return otherOperatingCose.post('/sYapSb/getData', parmas, {}, false)
}

export const getDataByWf = (parmas: DataList): Promise<Result> => {
  return otherOperatingCose.post('/sYapSb/getDataByWf', parmas, {}, false)
}

// 获取动态表头
export const getDynamicColumn = (nd: string, kmlx: string, xsws: string): Promise<Result> => {
  return otherOperatingCose.get(`/sYapSb/getDynamicColumn?nd=${nd}&kmlx=${kmlx}&xsws=${xsws}`, {}, {}, false)
}
export const getDynamicColumnByWf = (nd: string): Promise<Result> => {
  return otherOperatingCose.get(`/sYapSb/getDynamicColumnByWf?nd=${nd}`, {}, {}, false)
}

// 保存
export const citySave = (parmas: CityYapEscalation): Promise<Result> => {
  return otherOperatingCose.post('/sYapSb/save', parmas, {}, false)
}

// 上报
export const citySb = (parmas: BaseCity): Promise<Result> => {
  return otherOperatingCose.post(
    `/sYapSb/sb?nd=${parmas.nd}&kmlx=${parmas.kmlx}&specialorgid=${parmas.specialorgid}&busiType=${parmas.busiType}`,
    {},
    {},
    false
  )
}

export const getCurrentPageData = (parmas: BaseCity): Promise<Result> => {
  return otherOperatingCose.post(
    `/sYapSb/getCurrentPageData?kmlx=${parmas.kmlx}&nd=${parmas.nd}&specialorgid=${parmas.specialorgid}&xsws=${parmas.xsws}`,
    {},
    {},
    false
  )
}

// 导入
export const importData = (parmas: ImportData): Promise<Result> => {
  return otherOperatingCose.post(
    `/sYapSb/import?specialorgid=${parmas.specialorgid}&kmlx=${parmas.kmlx}&nd=${parmas.nd}&xsws=${parmas.xsws}`,
    parmas.excelFormData,
    {},
    false
  )
}

// 导入模板
export const importTemplate = (parmas: ImportData): Promise<Result> => {
  return otherOperatingCose.exportFile(`/sYapSb/getImportTemplate?kmlx=${parmas.kmlx}&nd=${parmas.nd}&xsws=${parmas.xsws}`, {}, {}, false)
}

// 导出
export const exportData = (parmas: DataList): Promise<Result> => {
  return otherOperatingCose.exportFile('/sYapSb/export', parmas, {}, false)
}
