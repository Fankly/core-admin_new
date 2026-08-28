export interface DropDownData {
  label: string
  permission: string
  click?: () => void
  children?: DropDownData[]
  type?: 'dropdown' | 'button'
}

export interface RowVO {
  id: string
  activeTime: string
  lhhsOneEndTime: string
  lhhsOneStartTime: string
  lhhsSkTime: string
  lhhsTwoEndTime: string
  lhhsTwoStartTime: string
  pspcCode: string
  pspcName: string
  status: string
  statusName: string
}

export interface TableProps {
  search: () => void
}
