import { UserRole } from '@/components/UserRoleSelector/interface'

export interface RowVO {
  activeTime: string // 激活时间
  createTime: string //创建时间
  gkbmId: string //归口部门Id
  id: number
  mbz: number //目标值
  remark: string //备注
  tzsm?: string //调整说明
  status: number //状态code
  statusName: string //状态名称
  versionName: string //版本名称
  versionNo?: string
}

export interface DropDownData {
  label: string
  permission: string
  click?: () => void
  children?: DropDownData[]
  type?: 'dropdown' | 'button'
}

export interface VersionForm {
  versionName: string
  gkbmId: string
  id?: string
  nd: string
  bmName: string
  remark: string
  tzsm?: string
  versionNo?: string
}

export interface VersionRow {
  versionName: string
  id: string
  nd: string
  bmName: string
  remark: string
  tzsm?: string
  versionNo?: string
}

export interface PublicCode {
  code: string
  name: string
}

export interface VersionAcceptParams extends UserRole, VersionForm {
  operationFlag: string
}

export interface MaintainParams extends UserRole, VersionForm {
  operationFlag: string
  isChangeData: boolean
}

export interface VersionCompareParams extends UserRole {
  nd: string
  selectedData: VersionRow[]
}

export interface OperationProps {
  ndList: PublicCode[]
  search: () => void
}

export interface SearchProps {
  statusList: PublicCode[]
  search: () => void
}
export interface TableProps {
  search: () => void
}

export interface TargetBudgetVersionProps {
  search: () => void
}
export interface TargetBudgetMaintainProps {
  search: () => void
}

export type MaintainTab = 'maintain' | 'summary' | 'detail'

export interface MaintainTabOption {
  label: string
  value: MaintainTab
}

export interface Page {
  total: number | string
  limit: number | string
  page: number | string
  current: number | string
}

export enum Status {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  Expired = 'expired'
}

export interface TargetBudgetMaintainRowVo {
  [key: string]: any
}

export type ProjectDetailAdjustmentType = '1' | '2' | '3'

export interface ProjectDetailRow {
  id: string
  nd: string // 年度
  xmmc: string // 项目名称
  xmbm: string // 项目编码
  tzlx: ProjectDetailAdjustmentType | '' // 调整类型
  xmlxName: string // 项目类型
  yjdwName: string // 一级单位
  ejdwName: string // 二级单位
  xmxzName: string // 项目性质
  jsksnd: string // 建设开始年限
  jsjsnd: string // 建设结束年限
  amount: string // 总预算（不含税）（万元）
  dnys: string // 当年预算（不含税）（万元）
  dnysTzh: string // 当年预算（调整后）
  tzfd: string // 调整幅度
  kypfwh: string // 可研批复文件号
  sfyap: string // 是否预安排
  xmyxjName: string // 项目优先级
  remark: string // 备注
  [key: string]: any
}

export interface ProjectAdjustSummaryRow {
  adjustType: ProjectDetailAdjustmentType
  projectCount: number
  declareAmount: string
  currentBudget: string
  adjustedCurrentBudget: string
  adjustAmount: string
}

export interface ProjectDetailPage extends Page {
  total: number
  limit: number
  page: number
  current: number
}

export interface TargetBudgetMaintainColumn {
  align: string | null
  columnKey: string
  columnValue: string
  color?: boolean | string
  dataType: string
  detail: boolean
  dwDetailId: string | null
  eidt: boolean
  fixed: boolean
  hidden: boolean
  needSum: boolean
  sumRow: boolean
  visible: boolean
}

// Target control adjustment data row
export interface TargetControlAdjustmentRow {
  xmdl: string // 项目大类
  xmdlName: string // 项目大类名称
  protypeId: string // 项目类型Id
  protypeName: string // 项目类型名称
  tzqYsje: string // 调整前目标总控值
  tzqDfj: string // 调整前待分解
  tzqDwSum: string // 调整前各单位目标值合计
  bcsqDfj: string // 本次申请待分解
  bcsqYsje: string // 本次申请目标总控值
  bcsqDwSum: string // 本次申请各单位目标值合计
  bcxgDfj: string // 本次修改待分解 (computed)
  bcxgYsje: string // 本次修改目标总控值 (user input)
  bcxgDwSum: string // 本次修改各单位目标值合计
}

export interface TargetControlAdjustmentModalProps {
  search: () => void | Promise<void>
}
