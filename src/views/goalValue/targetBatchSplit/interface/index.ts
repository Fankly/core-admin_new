export interface DropdownData {
  label: string
  value: string
  icon?: string
  permission?: string
  children?: DropdownData[]
}

type ndList = {
  yearCode: string
  yearName: string
}

export interface FormParams {
  nd: string
  ndList: ndList[]
}

export interface FromSearch {
  dwId: string
  versionName: string
  status: string
}

export interface BaseParams {
  nd: number
}

export interface Params extends BaseParams {
  limit: number
  page: number
  dwId: string
  roleId: string
  zt: string
  versionName: string
}
