import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export const budget = ServiceApi.budget

export interface SchemaParams {
  bmId: string
  dwId: string
  fjType: string // 附件类型
  limit: string
  page: string
  roleCode: string
  roleId: string
  schemaName: string
  userId: string
}

export interface SchemaRow {
  fjType: string
  fjTypeName: string // 附件类型
  schemaId: string
  schemaJson: string
  schemaName: string
  schemaDesc: string // 备注
}

// 获取项目附件提取 Schema 菜单
export interface SchemaPageResult {
  records: SchemaRow[]
  total: string
  current: string
  pages: string
  size: string
  searchCount: string
}

export const getXmAttachExtractSchemaMenu = (params: SchemaParams): Promise<Result & { data: SchemaPageResult }> => {
  return budget.post('xm-attach-extract-schema/getPage', params, {}, false)
}

// 删除
export const removeSchema = (schemaIdList: string[]) => {
  return budget.post('xm-attach-extract-schema/remove', schemaIdList, {}, false)
}

export interface SaveSchemaParams {
  fjType: string
  schemaId: string
  schemaJson: string
  schemaName: string
  schemaDesc: string
}

// 保存
export const saveSchema = (params: SaveSchemaParams) => {
  return budget.post('xm-attach-extract-schema/save', params, {}, false)
}
