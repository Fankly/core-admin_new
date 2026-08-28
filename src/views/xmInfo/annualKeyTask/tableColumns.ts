import type { VxeGridProps } from 'vxe-table'
import { annualKeyTaskFields, formatAnnualKeyTaskValue } from './config'

export type AnnualKeyTaskTableColumn = NonNullable<VxeGridProps['columns']>[number]

const fieldMap = new Map(annualKeyTaskFields.map((item) => [item.prop, item]))

// 只给 minWidth/maxWidth 不给 width，列才会参与 RangeVxeTable 的自动列宽分配并撑满表格
const createColumn = (prop: string, title?: string, minWidth?: number): AnnualKeyTaskTableColumn => {
  const item = fieldMap.get(prop)
  return {
    field: prop,
    title: title || item?.label || prop,
    minWidth: minWidth || item?.width || 160,
    maxWidth: item?.maxWidth,
    visible: item?.visible !== false,
    formatter: ({ cellValue }: any) => formatAnnualKeyTaskValue(prop, cellValue)
  }
}

export const createAnnualKeyTaskTableColumns = (): VxeGridProps['columns'] => [
  { type: 'checkbox', width: 48, fixed: 'left' },
  createColumn('nd'),
  createColumn('zdrwbm'),
  createColumn('zyfl'),
  createColumn('glbm'),
  createColumn('zyflZdrw'),
  { field: 'operation', title: '操作', width: 132, fixed: 'right', slots: { default: 'operation' } }
]
