export interface Result {
  code: number
  data: any
  msg: string
  success: boolean
  headers?: any
}

export interface Params {
  [key: string]: any
}

export interface UserInfo {
  deptId: string
  deptName: string
  dwId: string
  dwName: string
  roleId: string
  roleCode: string
  spRoleId: string
  specialorgcode: string
}

export interface RowVo {
  nd: string
  id: string
  ztName: string
  xmbm: string
  xmmc: string
  amount: string
  xmlx: string
  zdtx: string
  yssx: string
  sjflName: string
  gkbm_name: string
  yjdwName: string
  ejdwName: string
  cbzxName: string
  createTime: string
  cjr: string
  lyxt_name: string
  ysly?: string
  sfsygxjlys?: string
  confirm_flag: '0' | '1'
}
