import baseService from '@/service/baseService'

interface Params {
  [key: string]: any
}

// 成本性项目三率报表-获取省三率数据-按部门
export const getProSlDataByDept = (params: Params): any => {
  return baseService.post(`slbb/getProSlDataByDept`, params)
}

// 成本性项目三率报表-获取动态表头-按部门
export const getDynamicColumnByDept = (params: Params): any => {
  return baseService.post(`slbb/getDynamicColumnByDept`, params)
}

// 成本性项目三率报表-获取统计数据-按部门
export const getStatDataByDept = (params: Params): any => {
  return baseService.post(`slbb/getStatDataByDept`, params)
}

// 成本性项目三率报表-导出统计数据-按部门
export const exportStatData = (params: Params): any => {
  return baseService.export(`slbb/exportStatData`, params)
}

// 成本性项目三率报表-获取动态表头-按类型
export const getDynamicColumnByDeptWithXmlx = (params: Params): any => {
  return baseService.post(`slbb/getDynamicColumnByDeptWithXmlx`, params)
}

// 成本性项目三率报表-获取统计数据-按类型
export const getStatDataNewWithXmlx = (params: Params): any => {
  return baseService.post(`slbb/getStatDataNewWithXmlx`, params)
}

// 成本性项目三率报表-导出统计数据-按类型
export const exportStatDataWithXmlx = (params: Params): any => {
  return baseService.export(`slbb/exportStatDataWithXmlx`, params)
}

// 成本性项目三率报表-推送待办
export const sendNotify = (params: any[]): any => {
  return baseService.post(`slbb/sendDb`, params)
}

// 成本性项目三率报表-列表
export const slbbList = (params: Params): any => {
  return baseService.post(`slbb/notify/receiver/list`, params)
}

// 成本性项目三率报表-保存
export const slbbSave = (params: Params): any => {
  return baseService.post(`slbb/notify/receiver/save`, params)
}

// 成本性项目三率报表-删除
export const slbbRemove = (id: string): any => {
  return baseService.delete(`slbb/notify/receiver/remove/${id}`)
}

// 成本性项目三率报表-删除
export const listGroupByDept = (params: Params): any => {
  return baseService.post(`slbb/notify/receiver/listGroupByDept`, params)
}
