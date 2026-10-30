export interface SearchForm {
  status: string
  versionName: string
  gkbmName: string
}

export interface ValidateMessage {
  bmId: string
  dwId: string
  nd: string
}

export interface VersionPage extends SearchForm {
  bmId: string
  dwId: string
  limit: number | string
  nd: string
  page: number | string
  roleCode: string
  roleId: string
}

export interface VersionPageVO {
  activeTime: string // 激活时间
  createTime: string //创建时间
  gkbmId: string //归口部门Id
  gkbmName: string //归口部门名称
  id: number
  mbz: number //目标值
  remark: string //备注
  tzsm?: string //调整说明
  status: string //状态code
  statusName: string //状态名称
  versionName: string //版本名称
  versionNo: string // 版本编码
}
