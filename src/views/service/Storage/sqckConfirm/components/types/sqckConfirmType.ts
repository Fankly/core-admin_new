import { RowVo } from '@/views/service/Storage/interface'
export interface SelectData {
  code: string
  id: null | string
  name: string
  note: null | string
  unicode: null | string
}

export interface Params {
  checkedData: RowVo[]
  searchData: null | (() => void)
}

export interface ProtypeData {
  addtime: number
  byskz: string
  cbjdlc: string
  cblb: string
  code: string
  dispOrder: string
  dyxzCode: string
  ejfl: string
  expenseCategory: null | string
  gbdksfywdj: string
  gwTypeCode: null | string
  gwTypeId: null | string
  hasprovince: string
  hiberarchy: string
  id: string
  isys: string
  jhlx: string
  lbyskz: null | string
  leaf: string
  mbzkkz: string
  mbztolerance: string
  mbzys: string
  mobileYs: string
  name: string
  normYs: string
  note: null | string
  parentId: string
  processingMode: null | string
  provincialManagementOffice: null | string
  qgcCode: null | string
  sfglzc: string
  sfgmblr: string
  sfjyzdtx: string
  sflr: string
  sfxmlr: string
  sfxylhhs: string
  sfxyxqsh: string
  sfywdj: string
  sfyxjdys: string
  sjfl: string
  status: string
  stoptime: null | string
  sxyskz: string
  tabType: string
  updateTime: number
  xmbtolerance: string
  xtly: string
  yjfl: string
  ysbzCode: string
  ysbzId: null | string
  ysly: string
  yssfkz: null | string
  ysspgn: string
  zbcbFlag: string
  zcsjfl: null | string
  zdtx: null | string
}

export interface WbsData {
  children: WbsData[]
  code: string
  dispOrder: null | string
  hasChildren: boolean
  id: string
  leaf: boolean
  leafString: string
  middleId: string
  name: string
  nd: null | string
  parentId: string
  protypeId: string
}
