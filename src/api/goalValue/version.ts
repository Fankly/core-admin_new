import baseService from '@/service/baseService'

export interface BaseParams {
  nd: number
}

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

export interface Params extends BaseParams {
  limit: number
  page: number
  specialorgid: string
  status: string
  versionName: string
}

export interface FormParams {
  versionName: string
  remake: string
  sfyap: string
}

interface ActionParams {
  specialorgid: string
  versionId: string
  sendSpRoleId: string
  nd: string
}

interface SetYearTargetValueParams {
  sfnd: string
  nd: string
  specialorgid: string
  versionId: string
}

interface NotifyParams {
  versionId: string
  userIdList: string[]
}

// 分页
export const getVersionPage = (params: Params): Promise<Result> => {
  return baseService.post('mbz/version/page', params)
}

// 新增
export const addVersion = (params: FormParams & BaseParams): Promise<Result> => {
  return baseService.post('mbz/version/add', params)
}

// 编辑
export const editVersion = (params: FormParams & BaseParams): Promise<Result> => {
  return baseService.put('mbz/version/edit', params)
}

// 删除
export const delVersion = (versionId: string): Promise<Result> => {
  return baseService.delete(`mbz/version/remove/${versionId}`)
}

// 通知
export const notifyVersion = (notifyParams: NotifyParams): Promise<Result> => {
  return baseService.post(`mbz/version/notify`, { ...notifyParams })
}

// 激活
export const activeVersion = (params: ActionParams): Promise<Result> => {
  return baseService.post(
    `mbz/version/activate?specialorgid=${params.specialorgid}&versionId=${params.versionId}&nd=${params.nd}&sendSpRoleId=${params.sendSpRoleId}`
  )
}

// 设置年度目标值
export const setYearTargetValue = (params: SetYearTargetValueParams): Promise<Result> => {
  return baseService.post(
    `/mbz/version/setSfnd/?specialorgid=${params.specialorgid}&versionId=${params.versionId}&nd=${params.nd}&sfnd=${params.sfnd}`
  )
}
