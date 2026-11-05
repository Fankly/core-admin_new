import type { AssetKind } from '@/api/xmInfo/equipmentAssets'

export type AssetFieldType = 'text' | 'number' | 'date' | 'textarea' | 'boolean'

export interface AssetField {
  prop: string
  label: string
  group: string
  type?: AssetFieldType
  required?: boolean
  visible?: boolean
  width?: number
}

export interface AssetKindConfig {
  kind: AssetKind
  label: string
  projectLabel: string
  projectField: 'prjcode' | 'prjid'
  fields: AssetField[]
}
