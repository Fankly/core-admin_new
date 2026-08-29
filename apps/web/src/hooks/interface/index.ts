export interface TablePageable {
  current: number
  size: number
  total: number
}

export interface TableStateProps {
  tableData: any[]
  pageable: TablePageable
  searchParam: {
    [key: string]: any
  }
  searchInitParam: {
    [key: string]: any
  }
  totalParam: {
    [key: string]: any
  }
  icon?: {
    [key: string]: any
  }
}
