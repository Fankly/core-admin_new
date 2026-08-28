export interface SearchParams {
  [key: string]: any
}

export interface ApiResponse<T = any> {
  success: boolean
  data: {
    records: T[]
    total: number
  }
  msg: string
}

export interface UserInfo {
  bmName: string
  dwName: string
  bmId: string
  roleId: string
  roleCode: string
  dwId: string
  specialOrgCode: string
  spRoleId: string
}

export interface SearchColumn {
  code: string
  name: string
  type: string
  placeholder?: string
  options?: any[]
  disabled?: boolean
  clearable?: boolean
  filterable?: boolean
  multiple?: boolean
  defaultValue?: any
  dependOnColumn?: string
  dyff?: string
  ggdm?: string
  link?: boolean
  nodeKey?: string
  treeProps?: {
    children: string
    label: string
    value: string
  }
  [key: string]: any
}

export interface TableColumn {
  field: string
  title: string
  width?: number | string
  type?: string
  align?: string
  fixed?: string
  columnKey?: string
  columnValue?: string
  [key: string]: any
}

export interface TabConfig {
  code: string
  name: string
  searchCode?: string
  params?: SearchParams
  showViewBtn?: boolean
  showExportBtn?: boolean
  showProcessBtn?: boolean
  isMultiLevelHeader?: boolean
}

export interface ServiceGeneralReportProps {
  searchCode: string
  searchApi: (params: SearchParams) => Promise<ApiResponse<any>>
  exportApi?: (params: SearchParams) => Promise<any>
  userInfo: UserInfo
  tabs?: TabConfig[]
  keepSearchOnTabChange?: boolean
  freezeLeftCount?: number
}
