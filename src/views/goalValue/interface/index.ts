export interface User {
  code: string
  id: string
  info: string
  name: string
  org_id: string
  org_name: string
  role_id: string
  rolename: string
  spRoleCode: string
  specialorgid: string
  specialorgname: string
  systemId: string
  systemName: string
}

export interface RowVo {
  createDate: string
  creator: string
  creatorName: string
  nd: string
  remake: string
  sfyap: string
  sfnd?: string
  status: string
  versionId: string
  versionName: string
  versionNo: string
}

export interface Columns {
  columnKey: string
  columnValue: string
  dataType: string
  dwDetailId: null | string
  eidt: boolean
  fixed: boolean
  hidden: boolean
  needSum: boolean
}
