import { otherOperatingCose } from '@/api/fy'
import { Result } from '@/api/types'

export interface CopyData {
  sourceNd: string
  targetNd: string
}

interface Params {
  pid: string
  nd: string
  templateCode: string
}

interface SaveData {
  cnxs: {
    cnx: string
    cnxId: string
  }[]
  isEdit: string
  name: string
  nd: string
  pid: string
  sort: string
  sfmrzk: string
  templateCode: string
}

interface UpdateZxz {
  dwId: string
  finalYsje: number
  id: number
  pzId: number
  ysje: number
}

interface UpdateFsz {
  cbzx: string
  dwId: string
  gwslFsz: number
  id: number
  pzId: number
}

interface CnxData {
  cnx: string
  cnxId: string
}

interface SaveOrUpdateData {
  sfmrzk: string
  isEdit: string
  nd: string
  name: string
  cnxs: CnxData[]
  pid: string
  id?: string
  sort: string
  templateCode: string
  isWtyw: string
}

// 复制
export const copyData = (params: CopyData): Promise<Result> => {
  return otherOperatingCose.post(`/bzcbcxpz/copy?sourceNd=${params.sourceNd}&targetNd=${params.targetNd}`, {}, {}, false)
}

// 删除
export const deleteData = (ids: string[]): Promise<Result> => {
  return otherOperatingCose.post(
    `/bzcbcxpz/delete`,
    {
      ids: ids
    },
    {},
    false
  )
}

//获取数据
export const getDataList = (params: Params): Promise<Result> => {
  return otherOperatingCose.post(`/bzcbcxpz/getData?nd=${params.nd}&pid=${params.pid}&templateCode=${params.templateCode}`, {}, {}, false)
}

//获取当前月份并校验单位性质
export const getFormData = (dwId: string): Promise<Result> => {
  return otherOperatingCose.post(`/bzcbcxpz/getFormData?dwId=${dwId}`, {}, {}, false)
}

//获取执行者信息
export const getZxz = (dwId: string, pzId: string): Promise<Result> => {
  return otherOperatingCose.get(`/bzcbcxpz/getZxz?dwId=${dwId}&pzId=${pzId}`, {}, {}, false)
}

// 新增
export const saveData = (params: SaveOrUpdateData): Promise<Result> => {
  return otherOperatingCose.post(`/bzcbcxpz/save`, params, {}, false)
}

// 修改
export const updateData = (params: SaveOrUpdateData): Promise<Result> => {
  return otherOperatingCose.post(`/bzcbcxpz/update`, params, {}, false)
}

//执行值维护
export const updateZxz = (params: UpdateZxz[]): Promise<Result> => {
  return otherOperatingCose.post(`/bzcbcxpz/updateZxz`, params, {}, false)
}

export const getCnxLevelTree = (id: string): Promise<Result> => {
  return otherOperatingCose.get(`/bzcbcxpz/getCnxLevelTree?id=${id}`, {}, {}, false)
}

//发行值维护
export const updateGwslfsz = (params: UpdateFsz[]): Promise<Result> => {
  return otherOperatingCose.post(`/bzcbcxpz/updateGwslfsz`, params, {}, false)
}

export const getFsz = (pzId: string, dwId: string): Promise<Result> => {
  return otherOperatingCose.get(`/bzcbcxpz/getFsz?pzId=${pzId}&dwId=${dwId}`, {}, {}, false)
}
