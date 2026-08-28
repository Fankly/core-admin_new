export interface StageField {
  label: string
  value: string
  prop: string
}

export interface Stage {
  title: string
  fields: StageField[]
}

export interface ProjectHeaderItem {
  label: string
  value: string
  highlight?: boolean
  prop: string
}

// 需要金额格式化（保留2位小数）的 prop
export const amountProps: string[] = [
  'erpjdys', // 总预算
  'erpztys', // 年度预算
  'serviceBidAmt', // 服务招标金额
  'materialWinAmt', // 物资中标金额
  'serviceWinAmt', // 服务中标金额
  'materialContractAmt', // 物资合同金额
  'serviceContractAmt', // 服务合同金额
  'materialUseAmt', // 物资领用金额
  'ljssje', // 累计送审金额
  'ljsdje', // 累计审定金额
  'settlementAmt' // 结算金额
]

// 结算进度(%) 字段：原值 × 100 后保留2位
export const percentProp = 'settlementProgress'

export const projectHeader: ProjectHeaderItem[] = [
  { label: '项目编码', value: '', prop: 'pspid' },
  { label: '项目名称', value: '', prop: 'post1' },
  { label: '项目单位', value: '', prop: 'qkjejdwName' },
  { label: '项目类型', value: '', prop: 'qkjxmlxmc' },
  { label: '项目归口部门', value: '', prop: 'qkjgkbmName' },
  { label: '年度', value: '', prop: 'zyear' },
  { label: '责任人名称', value: '', prop: 'qkjejdwName' },
  { label: '总预算', value: '', prop: 'erpjdys' },
  { label: '年度预算', value: '', prop: 'erpztys' },
  { label: '项目执行进度', value: '', highlight: true, prop: 'projectProgress' }
]

// 时间轴顺序排列，卡片在轴线上下交替显示
export const stages: Stage[] = [
  {
    title: '项目立项',
    fields: [
      { label: '项目出库日期', value: '', prop: 'xmckrq' },
      { label: '立项日期', value: '', prop: 'erdat' },
      { label: '立项是否超期', value: '', prop: 'lxsfcq' }
    ]
  },
  {
    title: '项目报招',
    fields: [
      { label: '首笔计划提报时间', value: '', prop: 'firstPlanSubmitDate' },
      { label: '最近计划提报时间', value: '', prop: 'lastPlanSubmitDate' },
      { label: '服务招标金额', value: '', prop: 'serviceBidAmt' },
      { label: '最近报招时间', value: '', prop: 'lastBidSubmitDate' },
      { label: '计划提报是否超期', value: '', prop: 'jhtbsfcq' }
    ]
  },
  {
    title: '中标结果',
    fields: [
      { label: '首笔中标时间', value: '', prop: 'firstWinBidDate' },
      { label: '物资中标金额', value: '', prop: 'materialWinAmt' },
      { label: '服务中标金额', value: '', prop: 'serviceWinAmt' },
      { label: '最近中标时间', value: '', prop: 'lastWinBidDate' }
    ]
  },
  {
    title: '合同签订',
    fields: [
      { label: '首笔合同签订时间', value: '', prop: 'firstContractDate' },
      { label: '物资合同金额', value: '', prop: 'materialContractAmt' },
      { label: '服务合同金额', value: '', prop: 'serviceContractAmt' },
      { label: '最近合同签订日期', value: '', prop: 'lastContractDate' },
      { label: '合同签订是否超期', value: '', prop: 'htqdsfcq' }
    ]
  },
  {
    title: '项目实施',
    fields: [
      { label: '项目开工时间', value: '', prop: 'actualStartDate' },
      { label: '首笔物资领用时间', value: '', prop: 'firstMaterialUseDate' },
      { label: '物资领用金额', value: '', prop: 'materialUseAmt' },
      { label: '服务是否结算', value: '', prop: 'fwsfjs' }
    ]
  },
  {
    title: '项目审计',
    fields: [
      { label: '首次送审时间', value: '', prop: 'scssrq' },
      { label: '累计送审金额', value: '', prop: 'ljssje' },
      { label: '首次审定时间', value: '', prop: 'scsdrq' },
      { label: '累计审定金额', value: '', prop: 'ljsdje' }
    ]
  },
  {
    title: '项目结算',
    fields: [
      { label: '首次结算日期', value: '', prop: 'firstSettlementDate' },
      { label: '年度结算金额', value: '', prop: 'settlementAmt' },
      { label: '结算进度(%)', value: '', prop: 'settlementProgress' },
      { label: '最后结算日期', value: '', prop: 'lastSettlementDate' }
    ]
  },
  {
    title: '项目关闭',
    fields: [
      { label: '关闭时间', value: '', prop: 'closeDate' },
      { label: '项目关闭状态', value: '', prop: 'closeStatus' },
      { label: '项目关闭是否超期', value: '', prop: 'xmgbsfcq' }
    ]
  }
]

// 工厂函数：返回深拷贝，避免静态常量被多实例污染
export const createProjectHeader = (): ProjectHeaderItem[] => projectHeader.map((item) => ({ ...item }))
export const createStages = (): Stage[] => stages.map((stage) => ({ ...stage, fields: stage.fields.map((f) => ({ ...f })) }))
