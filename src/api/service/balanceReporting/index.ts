// 预算结余上报API
import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  header?: any
}

interface Params {
  [key: string]: any
}

export interface ImportData {
  excelFormData: any
  protypeId: any
}
export interface ImportOther {
  excelFormData: any
}

//预计结余上报(省公司)-版本列表查询
export const pageForProvince = (params: Params): Promise<Result> => {
  return baseService.post(`xmlbysjyVersion/pageForProvince`, params)
}
//预计结余上报(省公司)-新增
export const add = (params: Params): Promise<Result> => {
  return baseService.post(`xmlbysjyVersion/add`, params)
}
//预计结余上报(省公司)-编辑
export const edit = (params: Params): Promise<Result> => {
  return baseService.put(`xmlbysjyVersion/edit`, params)
}
//预计结余上报(省公司)-版本下发
export const issue = (params: any): Promise<Result> => {
  return baseService.post(`xmlbysjyVersion/issue`, params)
}
//预计结余上报(省公司)-归档
export const filed = (versionId: any): Promise<Result> => {
  return baseService.post(`xmlbysjyVersion/filed?versionId=${versionId}`)
}
//预计结余上报(省公司)-取消归档
export const cancelFiled = (versionId: String): Promise<Result> => {
  return baseService.post(`xmlbysjyVersion/cancelFiled?versionId=${versionId}`)
}
//预计结余上报(省公司)-版本删除
export const remove = (versionId: String): Promise<Result> => {
  return baseService.delete(`xmlbysjyVersion/remove/${versionId}`)
}
//预计结余上报(省公司)-获取动态表头
export const getDynamicColumnForProvince = (params: any): Promise<Result> => {
  return baseService.get(`xmlbysjyDetail/getDynamicColumnForProvince?specialorgid=${params.specialorgid}&versionId=${params.versionId}`)
}
//预计结余上报(省公司)-获取列表
export const getDataForProvince = (params: Params): any => {
  return baseService.get(
    `/xmlbysjyDetail/getDataForProvince?versionId=${params.versionId}&parentId=${params.parentId}&specialorgid=${params.specialorgid}`
  )
}
//预计结余上报(省公司)-导出
export const exportForProvince = (formData: Params): Promise<Result> => {
  return baseService.exportGet(`/xmlbysjyDetail/exportForProvince?specialorgid=${formData.specialorgid}&versionId=${formData.versionId}`)
}
//预计结余上报(省公司)-查询下发单位
export const pageDw = (params: any): Promise<Result> => {
  return baseService.post(`/xmlbysjyVersion/pageDw`, params)
}

//预计结余上报(省公司)-获取业务组织树
export const getDwTree = (dwId: any): Promise<Result> => {
  return baseService.post(`/xmlbysjyVersion/getDwTree?dwId=${dwId}`)
}
//预计结余上报(省公司)-保存下发单位
export const saveDw = (params: any): Promise<Result> => {
  return baseService.post(`/xmlbysjyVersion/saveDw`, params)
}
//预计结余上报(省公司)-删除下发单位
export const removeDw = (params: any): Promise<Result> => {
  return baseService.post(`/xmlbysjyVersion/removeDw`, params)
}
//预计结余上报(省公司)-下发单位排序
export const updateDispOrder = (params: any): Promise<Result> => {
  return baseService.post(`/xmlbysjyVersion/updateDispOrder`, params)
}

// 预计结余上报(市公司)-版本列表查询
export const pageForYjdw = (params: Params): Promise<Result> => {
  return baseService.post(`xmlbysjyVersion/pageForYjdw`, params)
}
// 预计结余上报(市公司)-获取动态表头
export const getDynamicColumnForYjdw = (params: any): Promise<Result> => {
  return baseService.get(`xmlbysjyDetail/getDynamicColumnForYjdw?specialorgid=${params.specialorgid}&versionId=${params.versionId}`)
}
// 预计结余上报(市公司)-获取列表
export const getDataForYjdw = (params: Params): any => {
  return baseService.get(
    `/xmlbysjyDetail/getDataForYjdw?versionId=${params.versionId}&parentId=${params.parentId}&specialorgid=${params.specialorgid}`
  )
}
// 预计结余上报(市公司)-保存
export const save = (params: any): Promise<Result> => {
  return baseService.post(`/xmlbysjyDetail/save?specialorgid=${params.specialorgid}&versionId=${params.versionId}&nd=${params.nd}`, params.saveDatas)
}
// 预计结余上报(市公司)-模板下载
export const getImportTemplate = (params: any): any => {
  return baseService.export(`/xmlbysjyDetail/getImportTemplate?specialorgid=${params.specialorgid}&versionId=${params.versionId}`)
}
// 预计结余上报(市公司)-上传附件
export const xmlbysjyDetailImport = (params: any): any => {
  return baseService.post(`/xmlbysjyDetail/import?specialorgid=${params.specialorgid}&versionId=${params.versionId}`, params.excelFormData)
}
//预计结余上报(市公司)-导出
export const exportForYjdw = (formData: Params): Promise<Result> => {
  return baseService.exportGet(`/xmlbysjyDetail/exportForYjdw?specialorgid=${formData.specialorgid}&versionId=${formData.versionId}`)
}
