import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface Escalation {
  busiType: string // 业务类型 (YAP-预安排 ND-年度 RQ-日常)
  ejdw: string
  kmlx: string // 1-主业 2-农维费
  nd: string // 年度
}

interface MxList {
  detailId: string
  sbje: string
  yskmId: string
  sbDesc: string
}

interface CurrentPageData {
  busiType: string
  kmlx: string
  nd: string
  specialorgid: string
}

interface DynamicColumn {
  kmlx: string
  nd: string
  opType?: string
  specialorgid: string
}

interface List {
  busiType: string
  dwId: string
  kmlx: string
  nd: string
  parentId: string
}

interface SaveData {
  busiType: string
  ejdw: string
  kmlx: string
  nd: string
  mxList: MxList[]
}
interface ImportData {
  excelFormData: any
  ejdw: string
  kmlx: string
  nd: string
}

export const escalation = (params: Escalation): Promise<Result> => {
  return otherOperatingCose.post('/countyNdEscalation/escalation', params, {}, false)
}

export const getCurrentPageData = (parmas: CurrentPageData): Promise<Result> => {
  return otherOperatingCose.post(
    `/countyYapEscalation/getCurrentPageData?kmlx=${parmas.kmlx}&nd=${parmas.nd}&specialorgid=${parmas.specialorgid}&busiType=${parmas.busiType}`,
    {},
    {},
    false
  )
}

export const getDynamicColumn = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post('/countyNdEscalation/getDynamicColumn', params, {}, false)
}

export const getList = (params: List): Promise<Result> => {
  return otherOperatingCose.post('/countyNdEscalation/getList', params, {}, false)
}

export const judgeIsSd = (busiType: string, kmlx: string, nd: string, ejdw: string): Promise<Result> => {
  return otherOperatingCose.get(`/countyNdEscalation/judgeIsSd?busiType=${busiType}&kmlx=${kmlx}&nd=${nd}&ejdw=${ejdw}`, {}, {}, false)
}

export const save = (params: SaveData): Promise<Result> => {
  return otherOperatingCose.post('/countyNdEscalation/save', params, {}, false)
}

export const exportData = (params: List): Promise<Result> => {
  return otherOperatingCose.exportFile('/countyNdEscalation/export', params, {}, false)
}

// 获取导入模板
export const getImportTemplate = (params: List): Promise<Result> => {
  return otherOperatingCose.exportFile('/countyNdEscalation/getImportTemplate', params, {}, false)
}

// 导入
export const importData = (params: ImportData): Promise<Result> => {
  return otherOperatingCose.post(
    `/countyNdEscalation/import?ejdw=${params.ejdw}&nd=${params.nd}&kmlx=${params.kmlx}`,
    params.excelFormData,
    {},
    false
  )
}
