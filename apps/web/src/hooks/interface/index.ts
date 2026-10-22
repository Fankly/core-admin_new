import type { SearchParams } from '@/components/ProTable/interface'

export interface TablePageable {
  current: number
  size: number
  total: number
}

export interface TableStateProps<T = unknown> {
  tableData: T[]
  pageable: TablePageable
  searchParam: SearchParams
  searchInitParam: SearchParams
  totalParam: SearchParams
  icon?: SearchParams
}
