export interface RowVo {
  group: boolean
  allInvestTax: number
  amount: number
  attachName: null | string
  auditStatus: string
  auditStatusMc: string
  bgAllInvestTax: number | null
  bgAmount: number | null
  bgDnys: number | null
  bgYearInvestTax: number | null
  bgid?: string
  bglx?: string
  bglxName?: string
  bgsj: string | null
  bgyy: string | null
  byx?: string
  code: string
  dncwzc: number
  dntzjh: number
  dnxmcn: number
  dnys: number
  ejdw: string
  ejfl: string
  gbdkShStatus: null | string
  auditStatusApplyCenter?: null | string
  gkbm: null | string
  gwxmbm: string
  gwxmfl: null | string
  ispack: string
  ljtzcs: null | string
  ljxmcn: number
  ncys: number
  proType: string
  reason: null | string
  remark: null | string
  sfzt: null | string
  sfztMc: null | string
  sjfl: string
  ssnr?: string
  subFlowStatus?: string
  subFlowStatusName?: string
  uuid?: string
  xmbName: string
  xmbm: string
  xmid: string
  xmjhlx: string
  xmjhlxName: string
  tzsy?: string
  sfcjpsyj?: string
  xmmc: string
  xmxz: string
  yearInvestTax: number
  ysbgSfkyxgztz?: string | number
  yjdw: string
  yjfl: string
  ystzcs: string
  ztzjh: number
}

export interface BudgetChangeCreateRowVo {
  allInvestTax: number
  amount: number
  attachName: string
  bgAmount: number | null | string
  bgDnys: number | null | string
  bgid: string
  bgyy: string
  dncwzc: number
  dnljfsz: number
  dntzjh: number
  dnys: number
  gwxmbm: string
  je1: number
  ljfsz: number
  nd: string
  sfzt: string
  sfztMc: string
  sjfl: string
  uuid: string
  wbsId1: string
  wbsName1: string
  wbsflag: string
  xmbm: string
  xmid: string
  xmmc: string
  tzsy?: string
  sfcjpsyj?: string
  proType: string
  yearInvestTax: number
  ysbgSfkyxgztz?: string | number
  ztzjh: number
  ejfl: string
  gbdkShStatus: string
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

export interface ProjectGroup {
  xmid: string
  xmmc: string
  expanded?: boolean
  projects?: Project[]
  selected?: boolean
}

export interface SpanInfo {
  rowIndex: number
  rowspan: number
  colspan: number
}

export interface PublicParams {
  bmId: string
  dwId: string
  nd: string
  xmlxId: string
  userId: string
  fqzz: string
  specialorgcode: string
  spRoleId: string
}

export interface AcceptParams {
  selectedRowData: RowVo[]
  searchPage: any
  limitNum: number
  publicParams: PublicParams
  sfgmb: string
}
