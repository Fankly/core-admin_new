import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

const budget = ServiceApi.budget
const BASE_PATH = '/ndzdrw'

export interface AnnualKeyTaskParams {
  bmId: string
  dwId: string
  roleCode: string
  roleId: string
  userId: string
  nd?: string
  page: number | string
  limit: number | string
  zdrwbms: string[] // 重点任务编码
  zyfl: string // 专业分类
  zyflZdrw: string // 专业分类重点任务
}

export interface AnnualKeyTaskRowVO {
  glbm: string // 管理部门
  id: string | number
  insUser: string
  instime: string
  nd: string
  updTime: string
  updUser: string
  zdrwbm: string // 重点任务编码
  zyfl: string // 专业分类
  zyflZdrw: string // 专业分类重点任务
}

export interface AnnualKeyTaskRecord extends Partial<AnnualKeyTaskRowVO> {
  [key: string]: any
  bmId?: string
  dwId?: string
  roleCode?: string
  roleId?: string
  userId?: string
  nd?: string
  zdrwbm?: string
  zyfl?: string
  zyflZdrw?: string
  glbm?: string
}

export interface AnnualKeyTaskPageData {
  records: AnnualKeyTaskRowVO[]
  total: number
  current?: number
  size?: number
}

export const pageAnnualKeyTask = (params: AnnualKeyTaskParams): Promise<Result & { data: AnnualKeyTaskPageData | AnnualKeyTaskRowVO[] }> => {
  return budget.post(`${BASE_PATH}/getPage`, params, undefined, false)
}

export const saveAnnualKeyTask = (data: AnnualKeyTaskRecord): Promise<Result & { data: AnnualKeyTaskRowVO }> => {
  return budget.post(`${BASE_PATH}/save`, data, undefined, false)
}

export interface RemoveAnnualKeyTaskParams {
  bmId: string
  dwId: string
  roleCode: string
  roleId: string
  userId: string
  ids: string[]
}

export const removeAnnualKeyTasks = (params: RemoveAnnualKeyTaskParams): Promise<Result> => {
  return budget.post(`${BASE_PATH}/delete`, params, undefined, false)
}

export const importAnnualKeyTasks = (data: FormData): Promise<Result> => {
  return budget.post(`${BASE_PATH}/importData`, data, undefined, false)
}

export const exportAnnualKeyTasks = (params: AnnualKeyTaskParams): Promise<Result> => {
  return budget.exportFile(`${BASE_PATH}/export`, params, undefined, false)
}
