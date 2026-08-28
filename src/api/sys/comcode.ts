import ServiceApi from '@/api/base/ServiceApi'

const zgsExpense = ServiceApi.budget

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
export interface ImportOther {
  excelFormData: any
}

// 公共代码管理-分页查询
export const pageCode = (params: Params): Promise<Result> => {
  return zgsExpense.post(`comcode/page`, params, {}, true)
}

// 公共代码管理-公共代码树
export const treeCode = (params: Params): Promise<Result> => {
  return zgsExpense.post(`comcode/tree`, params, {}, true)
}

// 公共代码管理-保存
export const saveCode = (params: Params): Promise<Result> => {
  return zgsExpense.post(`comcode/save`, params, {}, true)
}

// 公共代码管理-修改
export const updateCode = (params: Params): Promise<Result> => {
  return zgsExpense.post(`comcode/update`, params, {}, true)
}

// 公共代码管理-删除
export const deleteCode = (params: Params): Promise<Result> => {
  return zgsExpense.post(`comcode/delete`, params, {}, true)
}
