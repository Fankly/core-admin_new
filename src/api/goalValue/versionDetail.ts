import baseService from '@/service/baseService'

interface Result {
  code: number
  data: any
  msg: string
  success: boolean
}

export interface BaseParams {
  nd: string
  isZgs: any
  specialorgid: string
  versionId: string
}

interface Params extends BaseParams {
  cj: string
  parentId: string
}

interface ImportParams extends BaseParams {
  excelFormData: any
}

export interface DwValues {
  dwId: string
  dwName: string
  ysje: string
}

interface SaveValue {
  dwId: string
  dwName: string
  ysje: number
}

interface SearchUser {
  yjdw: string
  ejdw: string
}

interface UserSave {
  ejdw: string
  id: number
  userId: number
  username: string
  yjdw: string
}
export interface SaveParam {
  code: string
  id: string
  dfjz: string
  dwValues: SaveValue[]
}

export interface SaveData extends BaseParams {
  saveDatas: SaveParam[]
}

// 导出
export const exportData = (params: BaseParams): Promise<Result> => {
  return baseService.export(
    `mbz/version/detail/export?specialorgid=${params.specialorgid}&versionId=${params.versionId}&nd=${params.nd}&isZgs=${params.isZgs}`
  )
}

// 列表
export const getData = (params: Params): Promise<Result> => {
  return baseService.get(
    `mbz/version/detail/getData?specialorgid=${params.specialorgid}&versionId=${params.versionId}&nd=${params.nd}&cj=${params.cj}&parentId=${params.parentId}&isZgs=${params.isZgs}`
  )
}

// 导入
export const importData = (params: ImportParams): Promise<Result> => {
  return baseService.post(
    `mbz/version/detail/import?specialorgid=${params.specialorgid}&versionId=${params.versionId}&nd=${params.nd}&isZgs=${params.isZgs}`,
    params.excelFormData
  )
}

export const saveData = (params: SaveData): Promise<Result> => {
  return baseService.post(
    `/mbz/version/detail/save?specialorgid=${params.specialorgid}&versionId=${params.versionId}&nd=${params.nd}&isZgs=${params.isZgs}`,
    params.saveDatas
  )
}

export const searchUser = (params: SearchUser): Promise<Result> => {
  return baseService.post(`/mbz/notify/receiver/list`, params)
}

export const delUser = (id: string): Promise<Result> => {
  return baseService.delete(`/mbz/notify/receiver/remove/${id}`)
}

export const saveUser = (params: UserSave[]): Promise<Result> => {
  return baseService.post(`/mbz/notify/receiver/save`, params)
}
