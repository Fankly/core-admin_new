import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

interface CountyYapEscalation {
  nd: string // 年度
  xsws: string
  parentId?: string // 父ID
  dwId?: string //单位ID
  busiType: string // 业务类型 (YAP-预安排 ND-年度 RQ-日常)
  kmlx: string // 1-主业 2-农维费
  ejdw?: string
  mxList?: MxList[]
}

export interface MxList {
  detailId: string
  je?: string
  sbje?: string
  yskmId: string
  sbDesc: string
}

interface Basic {
  kmlx: string
  nd: string
  xsws: string
  specialorgid: string
  busiType: string
}

interface DynamicColumn {
  kmlx: string
  nd: string
  specialorgid: string
}

interface ImportData {
  excelFormData?: any
  kmlx: string
  nd: string
  xsws: string
  ejdw: string
}

// 县预安排上报列表查询
export const getCountyYapEscalationList = (parmas: CountyYapEscalation): Promise<Result> => {
  return otherOperatingCose.post('/countyYapEscalation/getList', parmas, {}, false)
}

// 动态表头
export const getDynamicColumn = (params: DynamicColumn): Promise<Result> => {
  return otherOperatingCose.post('/countyYapEscalation/getDynamicColumn', params, {}, false)
}

// 上报
export const escalation = (parmas: CountyYapEscalation): Promise<Result> => {
  return otherOperatingCose.post('/countyYapEscalation/escalation', parmas, {}, false)
}

// 保存
export const countySave = (parmas: CountyYapEscalation): Promise<Result> => {
  return otherOperatingCose.post('/countyYapEscalation/save', parmas, {}, false)
}

// 判断是否已审定（返回true时按钮置灰）
export const judgeIsSd = (busiType: string, kmlx: string, nd: string, ejdw: string): Promise<Result> => {
  return otherOperatingCose.get(`/countyYapEscalation/judgeIsSd?busiType=${busiType}&kmlx=${kmlx}&nd=${nd}&ejdw=${ejdw}`, {}, {}, false)
}

export const getCurrentPageData = (parmas: Basic): Promise<Result> => {
  return otherOperatingCose.post(
    `/countyYapEscalation/getCurrentPageData?kmlx=${parmas.kmlx}&nd=${parmas.nd}&specialorgid=${parmas.specialorgid}&busiType=${parmas.busiType}&xsws=${parmas.xsws}`,
    {},
    {},
    false
  )
}

// 导入
export const importData = (parmas: ImportData): Promise<Result> => {
  return otherOperatingCose.post(
    `/countyYapEscalation/import?ejdw=${parmas.ejdw}&kmlx=${parmas.kmlx}&nd=${parmas.nd}&xsws=${parmas.xsws}`,
    parmas.excelFormData,
    {},
    false
  )
}

// 导入模板
export const importTemplate = (parmas: ImportData): Promise<Result> => {
  return otherOperatingCose.exportFile(
    `/countyYapEscalation/getImportTemplate?kmlx=${parmas.kmlx}&nd=${parmas.nd}&xsws=${parmas.xsws}`,
    {},
    {},
    false
  )
}

// 导出
export const exportData = (parmas: CountyYapEscalation): Promise<Result> => {
  return otherOperatingCose.exportFile('/countyYapEscalation/export', parmas, {}, false)
}
