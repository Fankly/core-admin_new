import ServiceApi from '@/api/base/ServiceApi'

const targetBudget = ServiceApi.targetBudget

interface Params {
  [key: string]: any
}

// 市级统筹目标值版本-分页
export const getPage = (params: Params) => {
  return targetBudget.post('/sytcMbzVer/getPage', params, {}, true)
}

// 市级统筹目标值版本-新增
export const add = (params: Params) => {
  return targetBudget.post('/sytcMbzVer/add', params, {}, true)
}

// 市级统筹目标值版本-编辑
export const edit = (params: Params) => {
  return targetBudget.post('/sytcMbzVer/edit', params, {}, true)
}

//市级统筹目标值版本-删除
export const remove = (versionId: String) => {
  return targetBudget.post(`/sytcMbzVer/remove/${versionId}`, {}, {}, true)
}

//市级统筹目标值版本-获取单位Id
export const getRealDwId = (dwId: Number) => {
  return targetBudget.get(`/sytcMbzVer/getRealDwId?dwId=${dwId}`, {}, {}, true)
}

//市级统筹目标值版本-获取动态表头
export const getDynamicColumn = (params: Params) => {
  return targetBudget.post(`/sytcMbzVerDtl/getDynamicColumn`, params, {}, true)
}

//市级统筹目标值版本-获取表格数据
export const getTableData = (params: Params) => {
  return targetBudget.post(`/sytcMbzVerDtl/getTableData`, params, {}, true)
}

//市级统筹目标值版本-获取导入模板
export const getImportTemplate = (params: Params) => {
  return targetBudget.exportFile(`/sytcMbzVerDtl/getImportTemplate?versionId=${params.versionId}&dwId=${params.dwId}`, {}, {}, true)
}

//市级统筹目标值版本-导入
export const importData = (params: Params): any => {
  return targetBudget.post(`/sytcMbzVerDtl/importData`, params.excelFormData)
}

//市级统筹目标值版本-导出
export const exportData = (params: Params) => {
  return targetBudget.exportFile(`/sytcMbzVerDtl/exportData`, params, {}, true)
}

//市级统筹目标值版本-保存数据
export const saveData = (params: Params) => {
  return targetBudget.post(`/sytcMbzVerDtl/saveData`, params, {}, true)
}

//市级统筹目标值版本-获取上限值
export const getZkys = (params: Params) => {
  return targetBudget.post(`/sytcMbzVerDtl/getZkys?nd=${params.nd}&dwId=${params.dwId}`, {}, {}, false)
}

//市级统筹目标值版本-同步
export const syncCurrentMbz = (versionId: String) => {
  return targetBudget.post(`/sytcMbzVerDtl/syncCurrentMbz?versionId=${versionId}`, {}, {}, true)
}

//市级统筹目标值版本-同步
export const submitWf = (params: Params) => {
  return targetBudget.post(`workflow/sytcMbzPhtz/submitWf`, params, {}, true)
}

//市级统筹目标值版本-获取动态表头(版本比对)
export const getDynamicColumnForVerCmp = (params: Params) => {
  return targetBudget.post(`/sytcMbzVerDtl/getDynamicColumnForVerCmp`, params, {}, false)
}

//市级统筹目标值版本-获取表格数据(版本比对)
export const getTableDataForVerCmp = (params: Params) => {
  return targetBudget.post(`/sytcMbzVerDtl/getTableDataForVerCmp`, params, {}, false)
}

//市级统筹目标值版本-校验目标值是否变化  getProtypeNameListWithCurrentMbzChange
export const getProtypeNameListWithCurrentMbzChange = (versionId: String) => {
  return targetBudget.post(`/sytcMbzVerDtl/getProtypeNameListWithCurrentMbzChange?versionId=${versionId}`, {}, {}, false)
}