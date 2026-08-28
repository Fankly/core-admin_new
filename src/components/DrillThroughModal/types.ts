import type { VxeGridPropTypes } from 'vxe-table'
import type { Result } from '@/api/types'

export type ColumnConfig = VxeGridPropTypes.Columns[number]

export interface DrillThroughModalProps {
  title: string
  width?: string | number
  height?: string | number
  searchApi: (params: Record<string, any>) => Promise<Result>
  exportApi?: (params: Record<string, any>) => Promise<Result>
  columns: VxeGridPropTypes.Columns
  defaultParams?: Record<string, any>
}
