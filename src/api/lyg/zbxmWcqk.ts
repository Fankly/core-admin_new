import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

interface Params {
  [key: string]: any
}

// 资本性项目完成情况表-分页查询
export const zbxmWcqkPage = (params: Params): Promise<Result> => {
  return budget.post('lyg/zbxmWcqk/page', params)
}

// 资本性项目完成情况表-新增
export const zbxmWcqkAdd = (params: Params): Promise<Result> => {
  return budget.post('lyg/zbxmWcqk/add', params)
}

// 资本性项目完成情况表-编辑
export const zbxmWcqkUpdate = (params: Params): Promise<Result> => {
  return budget.post('lyg/zbxmWcqk/update', params)
}

// 资本性项目完成情况表-删除
export const zbxmWcqkRemove = (params: any): Promise<Result> => {
  return budget.post('lyg/zbxmWcqk/delete', params)
}

// 资本性项目完成情况表-导出
export const zbxmWcqkExportExcel = (params: any): any => {
  return budget.exportFile('lyg/zbxmWcqk/export', params)
}

// 资本性项目完成情况表-导入模板下载
export const zbxmWcqkGetImportTemplate = (params: any): any => {
  return budget.exportFile('lyg/zbxmWcqk/getImportTemplate', params)
}

// 资本性项目完成情况表-导入
export const zbxmWcqkImportExcel = (params: any): any => {
  return budget.post('lyg/zbxmWcqk/import', params.excelFormData)
}
