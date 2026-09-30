import type { IObject } from '@/types/interface'

export interface TablePageable {
  current: number
  size: number
  total: number
}

export interface TableStateProps {
  tableData: any[]
  pageable: TablePageable
  searchParam: IObject
  searchInitParam: IObject
  totalParam: IObject
  icon?: IObject
}
