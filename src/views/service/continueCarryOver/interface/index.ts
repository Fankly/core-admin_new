export interface RowVo {
  allInvestTax: string
  xjjzSfglsx: string
  xjjzSfglsxName: string
  amount: string
  circulStatus: string
  circulStatusName: string
  cnx1: string
  dncwzc: string
  dntzjh: string
  dnxmcn: string
  dnys: string
  ejdw: string
  ejdwName: string
  ejfl: string
  gkbm: string
  gwReason: string
  gwStatus: string
  gwStatusName: string
  gwxmbm: string
  instime: string
  isPack: string
  jyys: string
  jzyy: string
  kgsj: string
  ljfsz: string
  ljxmcn: string
  nd: string
  preArrStatus: string
  proType: string
  proTypeName: string
  remark: string
  sbxmyssap: string
  sjfl: string
  xjjzAttachname: string
  xjjzUuid: string
  xmId: string
  xmbName: string
  xmbbm: string
  xmbm: string
  xmmc: string
  xmxz: string
  xmxzName: string
  yearInvestTax: string
  yjdw: string
  yjdwName: string
  yjfl: string
  yjwcsj: string
  yqljcwzc: string
  ysbzId: string
  ysspgn: string
  zbcbFlag: string
  ztzjh: string
}

export interface Project {
  [key: string]: any
}

export interface PublicCode {
  code: string
  name: string
}

export interface Tree {
  name: string
  leaf?: boolean
}

export interface PublicParams {
  bmId: string
  dwId: string
  fqzz: string
  protypeId: string
  nd: string
  spRoleId: string
  userId: string
  specialorgcode: string
  sqdType?: string
}

export interface AcceptParams {
  selectedRowData: RowVo[]
  searchPage: any
  limitNum: number
  publicParams: PublicParams
  sfgmb: string
}
