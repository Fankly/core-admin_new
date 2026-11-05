import type { VxeGridProps } from 'vxe-table'
import { annualKeyTaskFields, formatAnnualKeyTaskValue } from './config'

export type AnnualKeyTaskTableColumn = NonNullable<VxeGridProps['columns']>[number]

const fieldMap = new Map(annualKeyTaskFields.map((item) => [item.prop, item]))

const createColumn = (prop: string, title?: string, width?: number): AnnualKeyTaskTableColumn => {
  const item = fieldMap.get(prop)
  return {
    field: prop,
    title: title || item?.label || prop,
    minWidth: width || item?.width || 160,
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
  createColumn('zyflZdrw')
]
