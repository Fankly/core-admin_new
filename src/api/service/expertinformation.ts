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
// 专家信息-列表查询
export const getListPageData = (params: Params): Promise<Result> => {
  return baseService.post(`xmExpert/getListPageData`, params)
}
// 专家信息-模板下载
export const getImportTemplate = (): any => {
  return baseService.export(`/xmExpert/getImportTemplate`)
}
// 专家信息-上传附件
export const importData = (params: ImportOther): any => {
  return baseService.post(`/xmExpert/importData`, params.excelFormData)
}

// 专家信息-导出
export const exportData = (formData: Params): Promise<Result> => {
  return baseService.export(`/xmExpert/exportData`, formData)
}
// 专家信息-一级单位
export const getYjdwData = (): any => {
  return baseService.get(`/xmExpert/getYjdwData`)
}
// 专家信息-二级单位
export const getEjdwData = (id: any): Promise<Result> => {
  return baseService.get(`/xmExpert/getEjdwData?parentId=${id}`)
}
// 专家信息-所属部门
export const getBm = (id: any): Promise<Result> => {
  return baseService.get(`/xmExpert/getBm?parentId=${id}`)
}
// 专家信息-新增/编辑
export const save = (params: any) => {
  return baseService.post(`/xmExpert/save`, params)
}
// 专家信息-删除
export const xmExpertDelete = (params: any) => {
  return baseService.post(`/xmExpert/delete`, params)
}

// 页签-项目类型树
export const getAllProtypeTree = (): any => {
  return baseService.get(`/protypeTree/getAllProtypeTree`)
}
// 页签-项目类型树查询
export const getSearchAllProType = (name: any): Promise<Result> => {
  return baseService.get(`/xmAttribute/getSearchAllProType?name=${name}`)
}

// 页签-页签管理列表查询
export const getTabList = (id: any): Promise<Result> => {
  return baseService.get(`/xmAttribute/getTabList?id=${id}`)
}

// 页签-页签管理新增/编辑
export const saveOrUpdateTab = (params: Params): any => {
  return baseService.post(`/xmAttribute/saveOrUpdateTab`, params)
}
// 页签-页签管理删除
export const deleteTab = (params: Params): any => {
  return baseService.post(`/xmAttribute/deleteTab`, params)
}
// 页签-页签管理复制
export const copyTXmAttributeStep = (sourceProTypeId: any, targetProTypeId: any): Promise<Result> => {
  return baseService.post(`/xmAttribute/copyTXmAttributeStep?sourceProTypeId=${sourceProTypeId}&targetProTypeId=${targetProTypeId}`)
}

// 页签-属性明细删除
export const xmAttributeDelete = (params: Params): Promise<Result> => {
  return baseService.post(`/xmAttribute/delete`, params)
}

// 页签-属性明细列表查询
export const getList = (id: any): Promise<Result> => {
  return baseService.get(`/xmAttribute/getList?id=${id}`)
}

// 页签-属性明细模板下载
export const xmAttributegetImportTemplate = (): any => {
  return baseService.export(`/xmAttribute/getImportTemplate`)
}

// 页签-属性明细上传附件
export const xmAttributeimportData = (params: ImportData): any => {
  return baseService.post(`/xmAttribute/importData?protypeId=${params.protypeId}`, params.excelFormData)
}

// 页签-属性明细导出
export const xmAttributeexportData = (formData: any): Promise<Result> => {
  return baseService.export(`/xmAttribute/exportData?protypeId=${formData}`)
}
// 页签-属性明细保存
export const saveOrUpdate = (params: Params): any => {
  return baseService.post(`/xmAttribute/saveOrUpdate`, params)
}

// 报表查询-列表查询
export const xmSearchConfigGetList = (searchCode: any, searchType: any): Promise<Result> => {
  return baseService.get(`/xmSearchConfig/getList?searchCode=${searchCode}&searchType=${searchType}`)
}

// 报表查询-新增修改
export const searchSaveOrUpdate = (params: Params): any => {
  return baseService.post(`/xmSearchConfig/searchSaveOrUpdate`, params)
}
// 报表查询-删除
export const deleteSearch = (params: Params): any => {
  return baseService.post(`/xmSearchConfig/deleteSearch`, params)
}
// 报表查询-搜索
export const getSearchCodeData = (name: any): Promise<Result> => {
  return baseService.get(`/xmSearchConfig/getSearchCodeData?code=TYBBCXPZ_COM&name=${name}`)
}

// 需求驾驶舱-需求总览
export const getVal = (): Promise<Result> => {
  return baseService.get(`/xmGscTotal/getVal`)
}
// 联合会审驾驶舱-需求总览
export const getOverviewData = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/getOverviewData`, params)
}
// 联合会审驾驶舱-获取统计数据-按单位
export const lhhsStatGetStatDataByDw = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/getStatDataByDw`, params)
}

// 联合会审驾驶舱-分页查询事项信息
export const lhhsStatPageYssxInfo = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/pageYssxInfo`, params)
}
// 联合会审驾驶舱-导出事项信息
export const lhhsStatExportYssxInfo = (params: Params): Promise<Result> => {
  return baseService.export(`/lhhsStat/exportYssxInfo`, params)
}
// 联合会审驾驶舱-分页查询项目信息-按事项
export const lhhsStatPageXmInfoByYssx = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/pageXmInfoByYssx`, params)
}
// 联合会审驾驶舱-导出项目信息-按事项
export const lhhsStatExportXmInfoByYssx = (params: Params): Promise<Result> => {
  return baseService.export(`/lhhsStat/exportXmInfoByYssx`, params)
}
// 联合会审驾驶舱-分页查询会议信息
export const lhhsStatPageMeetingInfo = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/pageMeetingInfo`, params)
}
// 联合会审驾驶舱-导出会议信息
export const lhhsStatExportMeetingInfo = (params: Params): Promise<Result> => {
  return baseService.export(`/lhhsStat/exportMeetingInfo`, params)
}
// 联合会审驾驶舱-获取总览数据(会议穿透)
export const getOverviewDataByMeeting = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/getOverviewDataByMeeting`, params)
}

// 联合会审驾驶舱-获取统计数据-按单位(会议穿透)
export const getStatDataByMeetingDw = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/getStatDataByMeetingDw`, params)
}

// 联合会审驾驶舱-分页查询事项信息(会议穿透)
export const pageYssxInfoByMeeting = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/pageYssxInfoByMeeting`, params)
}

// 联合会审驾驶舱-导出事项信息(会议穿透)
export const exportYssxInfoByMeeting = (params: Params): Promise<Result> => {
  return baseService.export(`/lhhsStat/exportYssxInfoByMeeting`, params)
}

// 联合会审驾驶舱-分页查询项目信息-按事项(会议穿透)
export const pageXmInfoByMeetingYssx = (params: Params): Promise<Result> => {
  return baseService.post(`/lhhsStat/pageXmInfoByMeetingYssx`, params)
}

// 联合会审驾驶舱-导出项目信息-按事项(会议穿透)
export const exportXmInfoByMeetingYssx = (params: Params): Promise<Result> => {
  return baseService.export(`/lhhsStat/exportXmInfoByMeetingYssx`, params)
}

// 承诺项维护-新增或保存数据
export const yszxfxcnxSaveOrUpdate = (params: Params): Promise<Result> => {
  return baseService.post(`/yszxfxcnx/saveOrUpdate`, params)
}

// 承诺项维护-获取分页列表
export const yszxfxcnxGetPage = (params: Params): Promise<Result> => {
  return baseService.get(`/yszxfxcnx/getPage`, params)
}

// 承诺项维护-删除
export const yszxfxcnxDelete = (params: Params): Promise<Result> => {
  return baseService.post(`/yszxfxcnx/delete`, params)
}
