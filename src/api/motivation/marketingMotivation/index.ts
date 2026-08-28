import baseService from '@/service/baseService'

interface Params {
  [key: string]: any
}

export interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

const url = '/dy/yyt/'

// 查询
export const getPage = (params: any): Promise<Result> => {
  return baseService.post(`${url}page`, params)
}

// 保存
export const saveData = (params: Params): Promise<Result> => {
  return baseService.post(`${url}save`, params)
}

// 删除
export const deleteData = (ids: string[]): Promise<Result> => {
  return baseService.post(`${url}remove`, ids)
}

// 提交
export const submitData = (ids: string[]): Promise<Result> => {
  return baseService.post(`${url}submit`, ids)
}

// 详情
export const getInfoData = (ids: string[]): Promise<Result> => {
  return baseService.get(`${url}getInfo`, ids)
}

// 模板
export const getImportTemplate = (): Promise<Result> => {
  return baseService.export(`${url}getImportTemplate`)
}

// 导入
export const importExcel = (params: Params): Promise<Result> => {
  return baseService.post(`${url}importExcel`, params.excelFormData)
}

// 导出
export const exportExcel = (params: any): Promise<Result> => {
  return baseService.export(`${url}exportExcel`, params)
}

//营销部数据填报 -供电所房屋信息-查询
export const gdsfwPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/gdsfw/page`, params)
}
//营销部数据填报 -供电所房屋信息-新增/编辑
export const gdsfwSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/gdsfw/save`, params)
}
//营销部数据填报 -供电所房屋信息-删除
export const gdsfwRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/gdsfw/remove`, params)
}

//营销部数据填报 -供电所房屋信息-提交
export const gdsfwSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/gdsfw/submit`, params)
}

//营销部数据填报 -供电所房屋信息-获取详情
export const gdsfwGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/gdsfw/getInfo`, params)
}

// 营销部数据填报 -供电所房屋信息-模板下载
export const gdsfwGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/gdsfw/getImportTemplate`, params)
}

// 营销部数据填报 -供电所房屋信息-上传附件
export const gdsfwImportExcel = (params: any): any => {
  return baseService.post(`dy/gdsfw/importExcel`, params.excelFormData)
}

// 营销部数据填报 -供电所房屋信息-导出
export const gdsfwExportExcel = (params: any): any => {
  return baseService.export(`dy/gdsfw/exportExcel`, params)
}

//营销部数据填报 -电能计量信息填写-查询
export const dnjPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/dnj/page`, params)
}
//营销部数据填报 -电能计量信息填写-新增/编辑
export const dnjSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/dnj/save`, params)
}
//营销部数据填报 -电能计量信息填写-删除
export const dnjRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/dnj/remove`, params)
}

//营销部数据填报 -电能计量信息填写-提交
export const dnjSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/dnj/submit`, params)
}

//营销部数据填报 -电能计量信息填写-获取详情
export const dnjGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/dnj/getInfo`, params)
}

// 营销部数据填报 -电能计量信息填写-模板下载
export const dnjGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/dnj/getImportTemplate`, params)
}

// 营销部数据填报 -电能计量信息填写-上传附件
export const dnjImportExcel = (params: any): any => {
  return baseService.post(`dy/dnj/importExcel`, params.excelFormData)
}

// 营销部数据填报 -电能计量信息填写-导出
export const dnjExportExcel = (params: any): any => {
  return baseService.export(`dy/dnj/exportExcel`, params)
}
//营销部数据填报 -智能用电与市场能效信息-查询
export const znydPage = (params: Params): Promise<Result> => {
  return baseService.post(`dy/znyd/page`, params)
}
//营销部数据填报 -智能用电与市场能效信息-新增/编辑
export const znydSave = (params: Params): Promise<Result> => {
  return baseService.post(`dy/znyd/save`, params)
}
//营销部数据填报 -智能用电与市场能效信息-删除
export const znydRemove = (params: any): Promise<Result> => {
  return baseService.post(`dy/znyd/remove`, params)
}

//营销部数据填报 -智能用电与市场能效信息-提交
export const znydSubmit = (params: any): Promise<Result> => {
  return baseService.post(`dy/znyd/submit`, params)
}

//营销部数据填报 -智能用电与市场能效信息-获取详情
export const znydGetInfo = (params: any): Promise<Result> => {
  return baseService.get(`dy/znyd/getInfo`, params)
}

// 营销部数据填报 -智能用电与市场能效信息-模板下载
export const znydGetImportTemplate = (params: any): any => {
  return baseService.export(`dy/znyd/getImportTemplate`, params)
}

// 营销部数据填报 -智能用电与市场能效信息-上传附件
export const znydImportExcel = (params: any): any => {
  return baseService.post(`dy/znyd/importExcel`, params.excelFormData)
}

// 营销部数据填报 -智能用电与市场能效信息-导出
export const znydExportExcel = (params: any): any => {
  return baseService.export(`dy/znyd/exportExcel`, params)
}
