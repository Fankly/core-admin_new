import type { EnumProps, FieldNamesProps } from './interface'
import type { TagProps } from 'element-plus'

export const getCellValue = (row: object, prop: string): unknown =>
  prop
    .split('.')
    .reduce<unknown>((value, key) => (value !== null && typeof value === 'object' ? (Reflect.get(value, key) as unknown) : undefined), row)
export const formatCellValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.length ? (value as unknown[]).map(formatCellValue).join(' / ') : '-'
  if (value == null) return '-'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '-'
    }
  }
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint' || typeof value === 'symbol') return String(value)
  return '-'
}
export const findEnumItem = (options: EnumProps[], value: unknown, fields?: FieldNamesProps): EnumProps | undefined => {
  for (const option of options) {
    if (option[fields?.value ?? 'value'] === value) return option
    const children = option[fields?.children ?? 'children']
    if (Array.isArray(children)) {
      const match = findEnumItem(children as EnumProps[], value, fields)
      if (match) return match
    }
  }
  return undefined
}
export const getTagType = (option?: EnumProps): TagProps['type'] => {
  const value = option?.tagType
  return value && ['primary', 'success', 'info', 'warning', 'danger'].includes(value) ? value : 'primary'
}
