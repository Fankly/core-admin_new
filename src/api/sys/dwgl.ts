import ServiceApi from '@/api/base/ServiceApi'

const budget = ServiceApi.budget

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

// 获取单位组织
export const getNodeTree = (params: any): Promise<Result> => {
  return budget.get(`common/specialorg/getNodeTree?parentId=${params}`, {}, {}, true)
}

// 获取单位列表
export const getDwList = (params: Params): Promise<Result> => {
  return budget.post(`common/specialorg/getDwList`, params, {}, true)
}

// 更新导出属性
export const updateDwsx = (params: Params): Promise<Result> => {
  return budget.post(`common/specialorg/updateDwsx`, params, {}, true)
}

// 更新单位属性
export const exportFy = (params: Params): Promise<Result> => {
  return budget.exportFile(`common/specialorg/export`, params, {}, true)
}
