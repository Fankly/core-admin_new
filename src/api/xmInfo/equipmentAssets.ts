import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export type AssetKind = 'pmsEquip' | 'gjsb' | 'glsb'
export type AssetId = string | number
export type AssetRecord = Record<string, any>

const budget = ServiceApi.budget
const BASE_PATH = '/xmSbzcCrud'

const queryKeys: Record<AssetKind, 'prjcode' | 'prjid'> = {
  pmsEquip: 'prjcode',
  gjsb: 'prjid',
  glsb: 'prjid'
}

export const listEquipmentAssets = (kind: AssetKind, projectKey: string): Promise<Result> => {
  return budget.get(`${BASE_PATH}/${kind}/list`, { [queryKeys[kind]]: projectKey }, undefined, false)
}

export const getEquipmentAsset = (kind: AssetKind, id: AssetId): Promise<Result> => {
  return budget.get(`${BASE_PATH}/${kind}/${encodeURIComponent(String(id))}`, undefined, undefined, false)
}

export const addEquipmentAsset = (kind: AssetKind, data: AssetRecord): Promise<Result> => {
  return budget.post(`${BASE_PATH}/${kind}/add`, data, undefined, false)
}

export const editEquipmentAsset = (kind: AssetKind, data: AssetRecord): Promise<Result> => {
  return budget.put(`${BASE_PATH}/${kind}/edit`, data, undefined, false)
}

export const removeEquipmentAssets = (kind: AssetKind, ids: AssetId[]): Promise<Result> => {
  return budget.delete(`${BASE_PATH}/${kind}/remove`, ids as any, false)
}
