import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

// 获取一二级单位
export const getDwTree = (): Promise<Result> => {
  return budget.get('dwProtypeWfConfig/getDwTree', {}, {}, false)
}

// 根据单位ID和项目类别ID获取工作流
export const getWfCode = (dwId: string, id: string) => {
  return budget.get('dwProtypeWfConfig/getWfCode', {
    dwId,
    id,
  }, {}, false)
}

interface UpdateWfCodeParams {
  dwId: string // 单位ID
  id: string // 项目类别ID
  wfCode: string // 工作流编码
  sfqy:string // 是否启用
}

// 更新工作流配置
export const updateWfCode = (params: UpdateWfCodeParams) => {
  return budget.post('dwProtypeWfConfig/updateWfCode', params, {}, false)
}
