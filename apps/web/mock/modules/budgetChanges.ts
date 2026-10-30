import ExcelJS from 'exceljs'
import Mock from 'mockjs'
import { binaryResponse, fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

interface PublicCode {
  code: string
  name: string
  note?: string
}

interface Unit extends PublicCode {
  children: PublicCode[]
}

interface ProjectType extends PublicCode {
  xmjhlx: string
  xmjhlxName: string
  yjfl: PublicCode
  ejfl: PublicCode
  sjfl: PublicCode
}

interface BudgetChangeRow {
  [key: string]: any
  xmid: string
  xmmc: string
  xmbm: string
  gwxmbm: string
  nd: string
}

const CURRENT_YEAR = String(new Date().getFullYear())
const PREVIOUS_YEAR = String(Number(CURRENT_YEAR) - 1)

const PROJECT_CHANGE_STATUS_NAMES: Record<string, string> = {
  '': '',
  Q00: '需求草稿',
  Q01: '审批驳回',
  A01: '待联合会审',
  Q02: '会审驳回',
  A03: '会审通过',
  A10: '评审意见上传',
  '300': '批复意见上传',
  '310': '发展合规审核中',
  '301': '发展合规审核驳回',
  B99: '变更完成'
}

const BUDGET_CHANGE_STATUS_NAMES: Record<string, string> = {
  '0': '草稿',
  '1': '审核驳回',
  '2': '审核中',
  '3': '审核通过',
  '4': '推送失败',
  '10': 'SAP推送成功'
}

const UNITS: Unit[] = [
  {
    code: 'DW001',
    name: '国网江苏省电力有限公司',
    children: [
      { code: 'DW001-01', name: '发展策划部' },
      { code: 'DW001-02', name: '设备管理部' }
    ]
  },
  {
    code: 'DW002',
    name: '国网南京供电公司',
    children: [
      { code: 'DW002-01', name: '项目管理中心' },
      { code: 'DW002-02', name: '运维检修部' }
    ]
  },
  {
    code: 'DW003',
    name: '国网苏州供电公司',
    children: [
      { code: 'DW003-01', name: '建设管理部' },
      { code: 'DW003-02', name: '数字化工作部' }
    ]
  }
]

const PROJECT_TYPES: ProjectType[] = [
  {
    code: 'PT01',
    name: '电网基建项目',
    xmjhlx: '01',
    xmjhlxName: '基建',
    yjfl: { code: '01', name: '电网基建' },
    ejfl: { code: '0101', name: '输电工程' },
    sjfl: { code: '010101', name: '输电线路工程' }
  },
  {
    code: 'PT02',
    name: '生产技改项目',
    xmjhlx: '02',
    xmjhlxName: '技改',
    yjfl: { code: '02', name: '生产技改' },
    ejfl: { code: '0201', name: '变电设备改造' },
    sjfl: { code: '020101', name: '主变压器改造' }
  },
  {
    code: 'PT03',
    name: '生产大修项目',
    xmjhlx: '03',
    xmjhlxName: '大修',
    yjfl: { code: '03', name: '生产大修' },
    ejfl: { code: '0301', name: '输电线路大修' },
    sjfl: { code: '030101', name: '杆塔及基础大修' }
  },
  {
    code: 'PT04',
    name: '信息化项目',
    xmjhlx: '04',
    xmjhlxName: '信息化',
    yjfl: { code: '04', name: '数字化建设' },
    ejfl: { code: '0401', name: '信息系统建设' },
    sjfl: { code: '040101', name: '业务应用建设' }
  }
]

const PROJECT_NAMES = [
  '500千伏东善桥变电站主变扩建工程',
  '南京地区配电自动化终端改造',
  '苏州园区输电线路综合在线监测',
  '无锡供电公司数字化仓储建设',
  '沿江高铁牵引站配套电网工程',
  '老旧变电站继电保护装置改造',
  '城市核心区电缆通道隐患治理',
  '新能源场站调度数据接入改造'
]

const PUBLIC_CODE_MAP: Record<string, PublicCode[]> = {
  ZKCJ: [
    { code: 'LEVEL_1', name: '展开一级' },
    { code: 'LEVEL_2', name: '展开二级' },
    { code: 'LEVEL_3', name: '展开三级' },
    { code: 'LEVEL_ALL', name: '全部展开' }
  ],
  // 预算执行分析（yszxylb / customYapProjectExecutionByType）复用本模块的 getComCodeByCode 首命中拦截
  XSWS: [
    { code: 'XSWS_0', name: '0位' },
    { code: 'XSWS_1', name: '1位' },
    { code: 'XSWS_2', name: '2位' },
    { code: 'XSWS_3', name: '3位' },
    { code: 'XSWS_4', name: '4位' }
  ],
  BUDUGET_EXECUTION_ANALYSIS: [
    { code: 'YSZXYL', name: '预算执行一览' },
    { code: 'YSZXYL_YAP', name: '自定义预安排项目执行分析' },
    { code: 'YSZXYL_ZX', name: '承诺项目执行分析' }
  ],
  // 预算统计配置页（budgetStatisticsConfig）用公共代码，复用本模块 getComCodeByCode 首命中拦截
  YSTJPZ_TJFS: [
    { code: '1', name: '数据明细' },
    { code: '2', name: '明细汇总' }
  ],
  YSTJPZ_TJLX: [
    { code: '1', name: '项目类型' },
    { code: '2', name: '承诺项' }
  ],
  // 预算统计配置 - 分析报告节点类型 / 普通分析节点（示例值，实际以公共代码配置为准）
  YSZXFXBG_JDTYPE: [
    { code: '1', name: '分析报告节点' },
    { code: '2', name: '普通节点' }
  ],
  YSZXFX_PTJDTYPE: [
    { code: '1', name: '总体分析' },
    { code: '2', name: '分项分析' },
    { code: '3', name: '同比分析' },
    { code: '4', name: '环比分析' }
  ],
  ALL_INDICATOR_CODE: [
    { code: 'MBZ', name: '目标值' },
    { code: 'DFJ', name: '到位资金' },
    { code: 'LXZ', name: '累计完成值' },
    { code: 'WCZ', name: '完成值' },
    { code: 'WCL', name: '完成率' }
  ],
  ZLYS_XMJHLX: PROJECT_TYPES.map((item) => ({ code: item.xmjhlx, name: item.xmjhlxName })),
  ZLYS_YSBG_STATUS: Object.keys(BUDGET_CHANGE_STATUS_NAMES).map((code) => ({ code, name: BUDGET_CHANGE_STATUS_NAMES[code] })),
  XMXZ: [
    { code: '01', name: '新建' },
    { code: '02', name: '扩建' },
    { code: '03', name: '改造' },
    { code: '04', name: '大修' }
  ],
  GWXMFL: PROJECT_TYPES.map((item) => item.yjfl).filter((item, index, list) => list.findIndex((value) => value.code === item.code) === index),
  ZLYS_SENDSAP_TYPE: [
    { code: 'ALL', name: '全部数据' },
    { code: 'BUDGET', name: '预算数据' },
    { code: 'PROJECT', name: '项目数据' }
  ],
  XMYSBG_BGLX: [
    { code: '01', name: '投资规模调整' },
    { code: '02', name: '建设内容调整' },
    { code: '03', name: '实施计划调整' }
  ],
  YSBG_TZSY: [
    { code: '01', name: '投资规模变化', note: '1' },
    { code: '02', name: '实施计划变化', note: '0' },
    { code: '03', name: '建设内容变化', note: '1' }
  ],
  // 业务工作台（businessWorkbench）用公共代码，复用本模块 getComCodeByCode 首命中拦截。
  // 状态为两级结构：一级 code 作为筛选项，二级 code 由列表请求的 status 逗号串携带；
  // 一级状态名需能被 matchStatusByKeyword 关键字匹配（待提交/流转/在库/出库/编制/立项）
  LYGXQKSTATUS_COM: [
    { code: 'LYGXQKSTATUS_01', name: '待提交' },
    { code: 'LYGXQKSTATUS_02', name: '流转中' },
    { code: 'LYGXQKSTATUS_03', name: '在库' },
    { code: 'LYGXQKSTATUS_04', name: '已出库' }
  ],
  LYGXQKSTATUS_01: [{ code: 'LYGXQKSTATUS_0101', name: '草稿' }],
  LYGXQKSTATUS_02: [
    { code: 'LYGXQKSTATUS_0201', name: '部门审核中' },
    { code: 'LYGXQKSTATUS_0202', name: '归口审核中' }
  ],
  LYGXQKSTATUS_03: [{ code: 'LYGXQKSTATUS_0301', name: '已入库' }],
  LYGXQKSTATUS_04: [{ code: 'LYGXQKSTATUS_0401', name: '已出库' }],
  CBKSTATUS_COM: [
    { code: 'CBKSTATUS_01', name: '待出库' },
    { code: 'CBKSTATUS_02', name: '编制中' },
    { code: 'CBKSTATUS_03', name: '立项' }
  ],
  CBKSTATUS_01: [
    { code: 'CBKSTATUS_0101', name: '待出库' },
    { code: 'CBKSTATUS_0102', name: '待出库确认' }
  ],
  CBKSTATUS_02: [
    { code: 'CBKSTATUS_0201', name: '待预算编制' },
    { code: 'CBKSTATUS_0202', name: '预算编制审核中' }
  ],
  CBKSTATUS_03: [
    { code: 'CBKSTATUS_0301', name: '待立项' },
    { code: 'CBKSTATUS_0302', name: '已立项' }
  ],
  // 统筹级别：code 需为 province/city，前端 setLevelFilter 后按该值映射 ysly 请求参数
  PROJECT_LEVEL_COM: [
    { code: 'province', name: '省级统筹' },
    { code: 'city', name: '市级统筹' }
  ],
  REVIEW_LEVEL_COM: [
    { code: 'province', name: '省级联合会审' },
    { code: 'city', name: '市级联合会审' }
  ]
}

const CLASSIFICATION_CHILDREN: Record<string, PublicCode[]> = PROJECT_TYPES.reduce((result, item) => {
  result[item.yjfl.code] = [...(result[item.yjfl.code] || []), item.ejfl]
  result[item.ejfl.code] = [...(result[item.ejfl.code] || []), item.sjfl]
  return result
}, {} as Record<string, PublicCode[]>)

const PROJECT_CHANGE_TAB_COLUMNS = [
  {
    stepId: 'xmbgxx',
    stepName: '项目变更信息',
    stepType: '1',
    stepEnname: 'xmbgxx',
    columns: []
  }
]

const PROJECT_CHANGE_ATTACHMENT_GROUPS = [
  {
    stepId: 'budgetChangeAttach',
    stepName: '变更附件',
    stepType: '2',
    columns: [
      {
        label: '变更说明附件',
        prop: 'budgetChangeAttachments',
        children: [
          { label: '预算变更说明', fjId: 'YSBG_SM', fjTypes: ['pdf', 'doc', 'docx'] },
          { label: '投资调整依据', fjId: 'YSBG_TZYJ', fjTypes: ['pdf', 'xls', 'xlsx'] }
        ]
      }
    ]
  }
]

const round = (value: number) => Number(value.toFixed(2))
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const buildBudgetChangeRow = (sequence: number, kind: 'project' | 'budget', sfgmb = '0'): BudgetChangeRow => {
  const index = sequence - 1
  const unit = UNITS[index % UNITS.length]
  const projectType = PROJECT_TYPES[index % PROJECT_TYPES.length]
  const xmxz = PUBLIC_CODE_MAP.XMXZ[index % PUBLIC_CODE_MAP.XMXZ.length]
  const amount = round(620 + sequence * 38.65)
  const allInvestTax = round(amount * 1.13)
  const dnys = round(amount * (0.28 + (index % 4) * 0.04))
  const yearInvestTax = round(dnys * 1.13)
  const row: BudgetChangeRow = {
    xmid: `${kind === 'project' ? 'XM-TZ' : 'XM-YS'}-${String(sequence).padStart(4, '0')}`,
    xmmc: `${PROJECT_NAMES[index % PROJECT_NAMES.length]}${sequence > PROJECT_NAMES.length ? `（${sequence}）` : ''}`,
    xmbm: `CB${CURRENT_YEAR}${String(sequence).padStart(5, '0')}`,
    gwxmbm: `GW${CURRENT_YEAR}${String(320000 + sequence).padStart(8, '0')}`,
    nd: sequence % 9 === 0 ? PREVIOUS_YEAR : CURRENT_YEAR,
    code: `YSBG-${String(sequence).padStart(4, '0')}`,
    group: false,
    proType: projectType.code,
    xmlx: projectType.code,
    xmjhlx: projectType.xmjhlx,
    xmjhlxName: projectType.xmjhlxName,
    xmxz: xmxz.name,
    xmxzName: xmxz.name,
    xmxzCode: xmxz.code,
    yjdw: unit.name,
    yjdwCode: unit.code,
    ejdw: unit.children[index % unit.children.length].name,
    ejdwCode: unit.children[index % unit.children.length].code,
    yjfl: projectType.yjfl.code,
    yjflName: projectType.yjfl.name,
    yjflCode: projectType.yjfl.code,
    ejfl: projectType.ejfl.code,
    ejflName: projectType.ejfl.name,
    ejflCode: projectType.ejfl.code,
    sjfl: projectType.sjfl.code,
    sjflName: projectType.sjfl.name,
    sjflCode: projectType.sjfl.code,
    xmbName: `${unit.name.replace('国网', '').replace('有限公司', '')}${projectType.xmjhlxName}项目包`,
    ispack: sequence % 4 === 0 ? '是' : '否',
    gkbm: sequence % 2 === 0 ? '发展策划部' : '设备管理部',
    ztzjh: round(allInvestTax * 1.18),
    csndtzjh: round(yearInvestTax * 0.92),
    allInvestTax,
    amount,
    yearInvestTax,
    dnys,
    dntzjh: round(dnys * 1.08),
    dncwzc: round(dnys * (0.3 + (index % 3) * 0.08)),
    dnxmcn: round(dnys * 0.64),
    ljxmcn: round(dnys * 1.45),
    ncys: round(dnys * 0.9),
    sfzt: sequence % 5 === 0 ? '0' : '1',
    sfztMc: sequence % 5 === 0 ? '未释放' : '已释放',
    ysbgSfkyxgztz: sequence % 3 === 0 ? '1' : '0',
    gbdkShStatus: '00',
    auditStatusApplyCenter: '0',
    reason: sequence % 6 === 0 ? '待补充项目里程碑信息' : '校验通过',
    remark: sequence % 7 === 0 ? '成本中心待同步' : 'SAP校验通过',
    sftzfdfwn: sequence % 5 === 0 ? '否' : '是',
    tzfd: round((sequence % 7) * 1.35),
    wbsflag: sequence % 4 === 0 ? '0' : '1',
    wbsId1: `WBS-${String(sequence).padStart(4, '0')}`,
    wbsName1: `${projectType.xmjhlxName}项目主体工程`,
    je1: round(amount * 0.76),
    uuid: `mock-budget-change-${String(sequence).padStart(4, '0')}`,
    attachName: sequence % 3 === 0 ? `预算调整说明-${sequence}.pdf` : '',
    bglx: sfgmb === '1' ? 'SCALE_PACKAGE' : 'ANNUAL_BUDGET',
    bglxName: sfgmb === '1' ? '规模包调整' : '年度预算调整',
    byx: '项目预算',
    ssnr: '根据年度实施计划及最新概算调整项目预算。'
  }

  if (kind === 'project') {
    const statuses = ['', 'Q00', 'Q01', 'A01', 'Q02', 'A03', 'A10', '300', '310', '301', 'B99']
    const status = statuses[index % statuses.length]
    const hasActiveOrder = Boolean(status && status !== 'B99')
    const changeType = PUBLIC_CODE_MAP.XMYSBG_BGLX[index % PUBLIC_CODE_MAP.XMYSBG_BGLX.length]
    const adjustmentReason = PUBLIC_CODE_MAP.YSBG_TZSY[index % PUBLIC_CODE_MAP.YSBG_TZSY.length]
    Object.assign(row, {
      yssxId: `YSSX-TZ-${String(sequence).padStart(4, '0')}`,
      bglx: changeType.code,
      bglxName: changeType.name,
      tzsy: adjustmentReason.code,
      tzsyName: adjustmentReason.name,
      sfcjpsyj: adjustmentReason.note,
      subFlowStatus: status,
      subFlowStatusName: PROJECT_CHANGE_STATUS_NAMES[status],
      bgid: hasActiveOrder ? `BG-TZ-${String(sequence).padStart(4, '0')}` : undefined,
      bgAllInvestTax: status ? round(allInvestTax * 1.04) : null,
      bgAmount: status ? round(amount * 1.04) : null,
      bgYearInvestTax: status ? round(yearInvestTax * 1.03) : null,
      bgDnys: status ? round(dnys * 1.03) : null,
      bgyy: status ? '结合项目实施进度调整建设内容及投资安排' : null,
      bgsj: status ? `${CURRENT_YEAR}-06-${String((index % 20) + 1).padStart(2, '0')} 10:30:00` : null,
      ystzcs: status ? String((index % 3) + 1) : '0',
      ljtzcs: status ? String((index % 5) + 1) : '0'
    })
  } else {
    const statuses = ['0', '1', '2', '3', '4', '10']
    const status = statuses[index % statuses.length]
    Object.assign(row, {
      sfgmb,
      auditStatus: status,
      auditStatusMc: BUDGET_CHANGE_STATUS_NAMES[status],
      bgid: `BG-YS-${String(sequence).padStart(4, '0')}`,
      bgAllInvestTax: round(allInvestTax * 1.025),
      bgAmount: round(amount * 1.025),
      bgYearInvestTax: round(yearInvestTax * 1.02),
      bgDnys: round(dnys * 1.02),
      bgyy: sequence % 2 === 0 ? '年度任务计划变化，调整当年预算' : '采购及实施进度变化，优化资金安排',
      bgsj: `${CURRENT_YEAR}-05-${String((index % 20) + 1).padStart(2, '0')} 09:15:00`,
      ystzcs: String((index % 4) + 1),
      ljtzcs: String((index % 7) + 1)
    })
  }

  return row
}

const PROJECT_ADJUSTMENT_ROWS = Array.from({ length: 36 }, (_, index) => buildBudgetChangeRow(index + 1, 'project'))
const BUDGET_ADJUSTMENT_ROWS = Array.from({ length: 48 }, (_, index) => buildBudgetChangeRow(index + 1, 'budget', index < 30 ? '0' : '1'))

const includesText = (value: unknown, keyword: unknown) =>
  !keyword ||
  String(value || '')
    .toLowerCase()
    .includes(String(keyword).toLowerCase())
const matchesCodeList = (value: unknown, codes: unknown) => {
  const codeList = Array.isArray(codes) ? codes : codes ? [codes] : []
  return !codeList.length || codeList.some((code) => includesText(value, code))
}
const matchesOption = (row: BudgetChangeRow, nameKey: string, codeKey: string, value: unknown) => {
  return !value || String(row[nameKey]) === String(value) || String(row[codeKey]) === String(value)
}

const filterRows = (rows: BudgetChangeRow[], body: Record<string, any>, includeBudgetType: boolean) => {
  return rows.filter((row) => {
    const matchProjectType = !body.xmlxId || /^\d{4}$/.test(String(body.xmlxId)) || row.proType === String(body.xmlxId)
    const matchStatus = !Array.isArray(body.bgStatus) || !body.bgStatus.length || body.bgStatus.includes(row.auditStatus)
    const matchBudgetType = !includeBudgetType || row.sfgmb === String(body.sfgmb == null ? '0' : body.sfgmb)
    return (
      matchBudgetType &&
      matchProjectType &&
      matchStatus &&
      (!body.nd || row.nd === String(body.nd)) &&
      includesText(row.xmmc, body.xmmc) &&
      includesText(row.xmbName, body.xmbmc || body.xmbName) &&
      matchesCodeList(row.xmbm, body.xmbms) &&
      matchesCodeList(row.gwxmbm, body.gwxmbms) &&
      matchesOption(row, 'xmxz', 'xmxzCode', body.xmxz) &&
      matchesOption(row, 'yjdw', 'yjdwCode', body.yjdw) &&
      matchesOption(row, 'ejdw', 'ejdwCode', body.ejdw) &&
      matchesOption(row, 'yjfl', 'yjflCode', body.yjfl) &&
      matchesOption(row, 'ejfl', 'ejflCode', body.ejfl) &&
      matchesOption(row, 'sjfl', 'sjflCode', body.sjfl) &&
      (!body.xmjhlx || row.xmjhlx === String(body.xmjhlx))
    )
  })
}

const getIds = (body: any): string[] => {
  if (Array.isArray(body)) return body.map(String)
  if (Array.isArray(body.ids)) return body.ids.map(String)
  return []
}

const toEditableRow = (row: BudgetChangeRow): BudgetChangeRow => ({
  ...clone(row),
  bgAmount: row.bgAmount == null ? row.amount : row.bgAmount,
  bgDnys: row.bgDnys == null ? row.dnys : row.bgDnys,
  bgid: row.bgid || `BG-DRAFT-${row.xmid}`,
  bgyy: row.bgyy || '',
  attachName: row.attachName || ''
})

const buildProjectChangeInfo = (row: BudgetChangeRow) => ({
  xmid: row.xmid,
  bgid: row.bgid || '',
  bglx: row.bglx,
  bglxName: row.bglxName,
  tzsy: row.tzsy,
  tzsyName: row.tzsyName,
  sfcjpsyj: row.sfcjpsyj,
  sfcjpsyjName: row.sfcjpsyj === '1' ? '是' : '否',
  bgyy: row.bgyy || '',
  byx: row.byx || '项目预算',
  ssnr: row.ssnr || '',
  bgAllInvestTax: row.bgAllInvestTax == null ? row.allInvestTax : row.bgAllInvestTax,
  bgAmount: row.bgAmount == null ? row.amount : row.bgAmount,
  attaches: row.attachName
    ? {
        YSBG_SM: [
          {
            id: 1,
            ysbgId: row.bgid || '',
            fjId: 'YSBG_SM',
            attachName: row.attachName,
            uuid: row.uuid,
            instime: `${CURRENT_YEAR}-07-10 09:00:00`,
            uploadUserId: 10001,
            uploadUserName: '模拟用户'
          }
        ]
      }
    : {}
})

const buildProjectChangeHistory = (row: BudgetChangeRow) => {
  if (!row.subFlowStatus && !row.bgid) return []
  const latest = buildProjectChangeInfo(row)
  const count = Math.max(1, Number(row.ljtzcs) || 0)
  return Array.from({ length: count }, (_, index) => ({
    ...clone(latest),
    bgid: index === 0 && latest.bgid ? latest.bgid : `BG-HIS-${row.xmid}-${count - index}`,
    bgAllInvestTax: round(Number(latest.bgAllInvestTax) * (1 - index * 0.01)),
    bgAmount: round(Number(latest.bgAmount) * (1 - index * 0.01)),
    bgyy: index === 0 ? latest.bgyy : `第 ${count - index} 次变更：根据项目实施进度调整预算安排`,
    attaches: index === 0 ? latest.attaches : {}
  }))
}

const buildHistory = (xmid: string) => {
  const row = BUDGET_ADJUSTMENT_ROWS.find((item) => item.xmid === xmid) || BUDGET_ADJUSTMENT_ROWS[0]
  return Array.from({ length: 3 }, (_, index) => ({
    xmId: row.xmid,
    ysbgId: `${row.bgid}-${index + 1}`,
    gwxmbm: row.gwxmbm,
    bgsj: `${CURRENT_YEAR}-0${Math.max(1, 6 - index)}-${String(12 + index).padStart(2, '0')} 14:20:00`,
    bgeditor: ['张华', '李敏', '王强'][index],
    bgAmount: round(Number(row.amount) * (1 + (index + 1) * 0.01)),
    bgDnys: round(Number(row.dnys) * (1 + (index + 1) * 0.008)),
    ysbgType: index === 0 ? '年度预算调整' : '历史预算调整',
    bgyy: ['年度投资计划更新', '采购进度变化', '实施范围优化'][index],
    attachName: `预算变更说明-${index + 1}.pdf`,
    auditStatus: index === 0 ? '3' : '10',
    sjfl: row.sjfl,
    wbsflag: row.wbsflag,
    wbsId1: row.wbsId1,
    wbsName1: row.wbsName1,
    je1: row.je1,
    uuid: `${row.uuid}-history-${index + 1}`
  }))
}

// ==================== 登录 / 按钮权限链路 ====================
// userDialog：getMenuByUrl → getRoleByBusicode → getButtonList → commit('setPermissions')
// 本页走的是旧通道：模板上 15 处 v-permission 读 store.state.permissions（非 PermissionInjectionKey）。
// 三个接口被全项目共用，必须把判别值（页面路径 / busicode / menuCode）写进正则收窄，
// 否则 mockjs 命中即拦截、无法透传真实后端，会连带打挂其他页面的登录链路。

/** 本页 outsideMenu / menuCode（开发态 mock 专用） */
const BUSICODE = 'ZLYS-XMYSBG'

/** 帮助中心 / getMenuByUrl 返回的菜单 id */
const MENU_ID = 'menu-zlys-xmysbg'

/**
 * 按钮权限：与 index.vue 模板里的 v-permission 一一对应。
 * CREATE_CART / EDIT_CART / VIEW_CART / DELETE_CART 是项目调整页签的变更申请单下拉，
 * 缺其中任意一个，PROJECT_CHANGE_PERMISSION_CODES 的 some 判断会让整个下拉隐藏。
 */
const BUTTONS = [
  'CREATE_CART',
  'EDIT_CART',
  'VIEW_CART',
  'DELETE_CART',
  'SUBMIT',
  'RETURN',
  'PROCESS',
  'CREATE',
  'DELETE_NDYS',
  'DELETE_GMB',
  'RESENDJHXT',
  'RESENDSAP',
  'HISTORY',
  'IMPORT',
  'EXPORT'
]

/** 本页角色（getRoleByBusicode 返回裸数组，字段对齐 userDialog changeId 的取值） */
const buildRole = () => ({
  id: 'sprole-xmysbg-01',
  name: '预算变更专职（市公司）',
  code: 'SCWYSZZ',
  role_id: 'role-xmysbg-01',
  specialorgid: 'bm-xmysbg-01',
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  // org_id 取 UNITS[1]，与列表数据里的单位编码对齐，保证一/二级单位联动能出选项
  org_id: UNITS[1].code,
  org_name: UNITS[1].name,
  namecode: 'mock_xmysbg_user',
  busicode: BUSICODE
})

// 菜单：只拦 url 含本页路径（/service/budget/changes/index）的请求。
// url 可能被编码，故用 [^#]* 跨过中间的 / 或 %2F，不写死分隔符。
Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*budget[^#]*changes/i, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  // id 供 HelpModal 取帮助配置；outsideMenu 供 userDialog 取按钮权限
  return success({ id: MENU_ID, outsideMenu: BUSICODE, url })
})

// 角色：按 busicode 收窄；返回单角色，userDialog 自动确认，不弹选择框
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [buildRole()])

// 按钮权限：按 menuCode 收窄
Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success(clone(BUTTONS)))

// ==================== 引导 / 帮助中心（按判别值收窄） ====================

// useGuide({ moduleKey: 'changes' })：返回 false，进入页面不强制拉起 driver 蒙层
Mock.mock(/sysRemind\/getRemindFlagByUserId\?[^#]*moduleKey=changes(?:&|$)/, 'get', () => success(false))
// sysRemind/close、sysRemind/iknow 已由 centralizedModification 宽泛注册，复用

// 帮助中心（工具栏 help 按钮 → HelpModal）：按本页 menuId 收窄
Mock.mock(new RegExp(`sys/menuConfig/getConfigByMenuId\\?[^#]*menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success({
    helpInfo:
      '项目预算变更帮助：三个页签分别为年度预算调整、规模包调整、项目调整。项目调整需先创建变更申请单再提交审批，命中「无需重新出具评审意见」的项目可直接纳会；待联合会审状态可撤回。年度预算调整 / 规模包调整支持导入导出与补推计划系统、补推 SAP。',
    status: '1'
  })
)
Mock.mock(new RegExp(`sys/menuConfig/listFj\\?[^#]*menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success([{ fjmc: '项目预算变更操作手册.pdf', uuid: 'help-xmysbg-pdf' }])
)
Mock.mock(/sys\/menuConfig\/downloadFj\?[^#]*uuid=help-xmysbg-pdf/, 'get', () =>
  binaryResponse(new Blob(['项目预算变更操作手册（mock）'], { type: 'application/pdf' }), {
    fileName: '项目预算变更操作手册.pdf'
  })
)

// ==================== 页面初始化依赖 ====================

Mock.mock(/process40\/getComCodeByCode\/(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const codes: string[] = Array.isArray(body.codes) ? body.codes : []
  const data = codes.reduce((result, code) => {
    result[code] = clone(PUBLIC_CODE_MAP[code] || [])
    return result
  }, {} as Record<string, PublicCode[]>)
  return success(data)
})

Mock.mock(/protypeTree\/getProtypeYearTreeB(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const parentId = String(body.parentId == null ? '-1' : body.parentId)
  if (parentId === '-1') {
    return success([
      { id: CURRENT_YEAR, name: `${CURRENT_YEAR}年`, nd: CURRENT_YEAR, leaf: false },
      { id: PREVIOUS_YEAR, name: `${PREVIOUS_YEAR}年`, nd: PREVIOUS_YEAR, leaf: false }
    ])
  }
  if ([CURRENT_YEAR, PREVIOUS_YEAR].includes(parentId)) {
    return success(PROJECT_TYPES.map((item) => ({ id: item.code, name: item.name, nd: parentId, leaf: true })))
  }
  return success([])
})

// 该规则先于 jointReview 注册；评审工作台的省级角色也会命中这里。
Mock.mock(/workflow\/cbxqsh\/getFqzz(\?.*)?$/, 'post', (options: MockOptions) =>
  success(getQueryValue(options.url, 'spOrgId') === 'bm-001' ? 'PROVINCE' : 'CITY')
)
Mock.mock(/bizOrgTree\/getYjdw(\?.*)?$/, 'post', () => success(UNITS.map(({ code, name }) => ({ code, name }))))

Mock.mock(/bizOrgTree\/getEjdw(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const parentCode = String(body.parentCode || body.YJDW || '')
  return success(clone(UNITS.find((item) => item.code === parentCode)?.children || []))
})

// 外包适配清单业务小类（OUTSOURCE_RULE_KB_BIZ_CAT）与预算变更分类共用该接口
const OUTSOURCE_BIZ_SUB_CATS: Record<string, PublicCode[]> = {
  YJ: [
    { code: 'YJ01', name: '输电运维' },
    { code: 'YJ02', name: '变电运维' },
    { code: 'YJ03', name: '配电运维' }
  ],
  YX: [
    { code: 'YX01', name: '用电检查' },
    { code: 'YX02', name: '业扩报装' }
  ],
  XX: [
    { code: 'XX01', name: '网络运维' },
    { code: 'XX02', name: '系统开发' }
  ],
  AQ: [
    { code: 'AQ01', name: '安全督查' },
    { code: 'AQ02', name: '应急管理' }
  ]
}

Mock.mock(/commonCode\/getCommonCodeByParentCode\/?(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const parentCode = String(body.parentCode || '')
  // 外包适配清单：按 code + parentCode 级联小类
  if (String(body.code || '') === 'OUTSOURCE_RULE_KB_BIZ_CAT') {
    return success(clone(OUTSOURCE_BIZ_SUB_CATS[parentCode] || []))
  }
  return success(clone(CLASSIFICATION_CHILDREN[parentCode] || []))
})

Mock.mock(/workflow\/declare\/getParamValue\?[^#]*paramKey=(?:XMYSBG_SUBMIT_NUM|YSBG_WXSGSSP)(?:&|$)/, 'get', (options: MockOptions) => {
  const paramKey = getQueryValue(options.url, 'paramKey')
  const values: Record<string, string> = {
    XMYSBG_SUBMIT_NUM: '50',
    YSBG_WXSGSSP: '01,04'
  }
  return success(values[paramKey] || '')
})

// 注意：getParamValueMulti 是共用接口，mockjs 按注册顺序首次命中即拦截（budgetChanges 先于 jointReview）。
// 联合会审 / 评审工作台 AI 审议意见相关参数也写在这里。
// 预算执行分析（customYapProjectExecutionByType）的展示维度默认值参数亦在此注册。
// 总览页默认排序参数 XMZL_DEFAULT_SORT 也在此返回：排序键格式 ratio-01 / value-02。
Mock.mock(/sysParam\/getParamValueMulti\/(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options) as unknown as string[]
  const values: Record<string, string> = {
    YSBZ_SWITCH: '1',
    YSBZ_SWITCH_TYPE: 'ALL',
    YSSF_SWITCH: '1',
    YSSF_SWITCH_TYPE: 'ALL',
    YSBG_SWITCH: '1',
    YSBG_SWITCH_TYPE: 'ALL',
    YSSF_ADDTYPE: '1',
    // 联合会审：'' 或 '0' = 显示 AI审核意见区；'1' = 隐藏意见区并显示 AI智能审核入口
    LHHS_HIDE_AI_OPINION: '',
    // 可见部门：空 = 默认 BM_CWZC；ALL = 不限制；多值英文逗号分隔
    LHHS_AI_OPINION_VISIBLE_ORG: 'BM_CWZC',
    // 评审工作台 / 联合会审重新分析开关：默认 '1' 开启，配置为 '0' 时关闭
    REVIEW_WORKBENCH_AI_RERUN: '1',
    LHHS_AI_RERUN: '1',
    // 自定义预安排项目执行分析：默认展示维度
    YSZXYL_YAP_DEFAULT_BUSI_TYPE: 'YSZXYL_YAP',
    // 总览图表/表格默认排序：ratio-01 = 阶段 01 占比降序；留空时沿用前端默认 ratio-01
    XMZL_DEFAULT_SORT: 'ratio-01',
    // 总览金额展示单位：万元 / 亿元；留空或非法时沿用前端默认万元
    XMZL_AMOUNT_UNIT: '万元'
  }
  const keys = Array.isArray(body) ? body : []
  return success(keys.reduce((result, key) => ({ ...result, [key]: values[key] || '' }), {} as Record<string, string>))
})

Mock.mock(/bqsh\/getBqshFlag(\?.*)?$/, 'get', () => success({ DWLX: 'CITY' }))

// 项目调整弹窗依赖。规则比通用项目信息 mock 更具体，需要优先注册。
Mock.mock(/xmAttributeConfig\/getXmInfo\?[^#]*xmId=XM-TZ-[^&#]*/, 'get', (options: MockOptions) => {
  const xmid = getQueryValue(options.url, 'xmId')
  const row = PROJECT_ADJUSTMENT_ROWS.find((item) => item.xmid === xmid) || PROJECT_ADJUSTMENT_ROWS[0]
  return success({ xmbgxx: clone(row) })
})

Mock.mock(/xmAttributeConfig\/getYssxByXmid\?(?:[^#]*&)?xmid=XM-TZ-[^&#]+(?:&[^#]*)?$/, 'get', (options: MockOptions) => {
  const row = PROJECT_ADJUSTMENT_ROWS.find((item) => item.xmid === getQueryValue(options.url, 'xmid'))
  return row ? success(row.yssxId || '') : fail('项目不存在', 404)
})

Mock.mock(/xmAttributeConfig\/getTabColumns\?[^#]*pageType=1(?:&|$)/, 'get', () => success(clone(PROJECT_CHANGE_TAB_COLUMNS)))

Mock.mock(/xmAttributeConfig\/getDydj(\?.*)?$/, 'post', () =>
  success([
    { code: '01', name: '低压' },
    { code: '02', name: '10千伏' },
    { code: '03', name: '35千伏及以上' }
  ])
)

Mock.mock(/commonCode\/getData\?[^#]*code=XMYSBG_BGLX(?:&|$)/, 'get', () => success(clone(PUBLIC_CODE_MAP.XMYSBG_BGLX)))
Mock.mock(/commonCode\/getData\?[^#]*code=YSBG_TZSY(?:&|$)/, 'get', () => success(clone(PUBLIC_CODE_MAP.YSBG_TZSY)))

// ==================== 主列表与弹窗接口 ====================

Mock.mock(/sjtc\/xmysbg\/getYsbgPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const rows = filterRows(PROJECT_ADJUSTMENT_ROWS, body, false)
  return success(pageResult(clone(rows), body.page, body.limit))
})

Mock.mock(/^(?!.*\/sjtc\/).*\/xmysbg\/getYsbgPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const rows = filterRows(BUDGET_ADJUSTMENT_ROWS, body, true)
  return success(pageResult(clone(rows), body.page, body.limit))
})

Mock.mock(/sjtc\/xmysbg\/getYsbgByXmId(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = getIds(parseBody(options))
  const rows = ids
    .map((id) => PROJECT_ADJUSTMENT_ROWS.find((item) => item.xmid === id))
    .filter(Boolean)
    .map((row) => {
      const data = toEditableRow(row as BudgetChangeRow)
      if (!data.subFlowStatus || data.subFlowStatus === 'B99') delete data.bgid
      return data
    })
  return success(rows)
})

Mock.mock(/sjtc\/xmysbg\/getBgInfo(\?.*)?$/, 'get', (options: MockOptions) => {
  const xmid = getQueryValue(options.url, 'xmid')
  const row = PROJECT_ADJUSTMENT_ROWS.find((item) => item.xmid === xmid)
  return row ? success(clone(buildProjectChangeInfo(row))) : fail('项目不存在', 404)
})

Mock.mock(/sjtc\/xmysbg\/getHisBgInfo\?(?:[^#]*&)?xmid=XM-TZ-[^&#]+(?:&[^#]*)?$/, 'get', (options: MockOptions) => {
  const row = PROJECT_ADJUSTMENT_ROWS.find((item) => item.xmid === getQueryValue(options.url, 'xmid'))
  return row ? success(buildProjectChangeHistory(row)) : fail('项目不存在', 404)
})

Mock.mock(/sjtc\/xmysbg\/getFjGroupByXmlx(\?.*)?$/, 'get', () => success(clone(PROJECT_CHANGE_ATTACHMENT_GROUPS)))

Mock.mock(/sjtc\/xmysbg\/saveYsbg(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const row = PROJECT_ADJUSTMENT_ROWS.find((item) => item.xmid === String(body.xmid || ''))
  if (row) {
    row.bgid = String(body.bgid || row.bgid || `BG-TZ-${row.xmid}`)
    row.bglx = String(body.bglx || '01')
    row.bglxName = PUBLIC_CODE_MAP.XMYSBG_BGLX?.find((item) => item.code === row.bglx)?.name || '投资规模调整'
    row.tzsy = String(body.tzsy || '')
    row.tzsyName = PUBLIC_CODE_MAP.YSBG_TZSY.find((item) => item.code === row.tzsy)?.name || ''
    row.sfcjpsyj = String(body.sfcjpsyj || '')
    row.bgyy = String(body.bgyy || '')
    row.byx = String(body.byx || '')
    row.ssnr = String(body.ssnr || '')
    row.bgAllInvestTax = Number(body.bgAllInvestTax || 0)
    row.bgAmount = Number(body.bgAmout || 0)
    row.subFlowStatus = 'Q00'
    row.subFlowStatusName = PROJECT_CHANGE_STATUS_NAMES.Q00
    row.bgsj = `${CURRENT_YEAR}-07-13 15:30:00`
  }
  return success({ bgid: row?.bgid || '' }, '保存成功')
})

Mock.mock(/sjtc\/xmysbg\/uploadAttach(\?.*)?$/, 'post', () => success(true, '附件上传成功'))

Mock.mock(/sjtc\/xmysbg\/deleteYsbg(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = getIds(parseBody(options))
  PROJECT_ADJUSTMENT_ROWS.forEach((row) => {
    if (!ids.includes(row.xmid)) return
    row.subFlowStatus = ''
    row.subFlowStatusName = ''
    row.bgid = undefined
    row.bgAllInvestTax = null
    row.bgAmount = null
    row.bgYearInvestTax = null
    row.bgDnys = null
    row.bgyy = null
    row.bgsj = null
  })
  return success(true, '删除成功')
})

// 年度预算调整 / 规模包调整：清除老的变更申请单（xmid 支持逗号拼接多个）
Mock.mock(/sjtc\/xmysbg\/cleanOldSqd(\?.*)?$/, 'post', (options: MockOptions) => {
  const xmidParam = getQueryValue(options.url, 'xmid')
  if (!xmidParam) return success(false, '缺少项目id')
  const ids = xmidParam.split(',').filter(Boolean)
  ids.forEach((xmid) => {
    const row = BUDGET_ADJUSTMENT_ROWS.find((item) => item.xmid === xmid)
    if (row) {
      row.auditStatus = ''
      row.auditStatusMc = ''
      row.bgid = undefined
      row.bgAllInvestTax = null
      row.bgAmount = null
      row.bgYearInvestTax = null
      row.bgDnys = null
      row.bgyy = null
      row.bgsj = null
    }
  })
  return success(true, '删除成功')
})

Mock.mock(/^(?!.*\/sjtc\/).*\/xmysbg\/getYsbgByXmId(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = getIds(parseBody(options))
  return success(
    ids
      .map((id) => BUDGET_ADJUSTMENT_ROWS.find((item) => item.xmid === id))
      .filter(Boolean)
      .map((row) => toEditableRow(row as BudgetChangeRow))
  )
})

Mock.mock(/^(?!.*\/sjtc\/).*\/xmysbg\/saveYsbg(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const saveDatas: BudgetChangeRow[] = Array.isArray(body.saveDatas) ? body.saveDatas : []
  saveDatas.forEach((data) => {
    const row = BUDGET_ADJUSTMENT_ROWS.find((item) => item.xmid === data.xmid)
    if (!row) return
    Object.assign(row, clone(data), {
      auditStatus: '0',
      auditStatusMc: BUDGET_CHANGE_STATUS_NAMES['0'],
      bgsj: `${CURRENT_YEAR}-07-13 15:30:00`
    })
  })
  return success(true, '保存成功')
})

Mock.mock(/xmysbg\/getYsbgHistory(\?.*)?$/, 'get', (options: MockOptions) => {
  return success(buildHistory(getQueryValue(options.url, 'xmId')))
})

Mock.mock(/workflow\/ysbgsh\/submitWf(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const rows: BudgetChangeRow[] = Array.isArray(body.bgData) ? body.bgData : []
  rows.forEach((submittedRow) => {
    const projectRow = PROJECT_ADJUSTMENT_ROWS.find((item) => item.xmid === submittedRow.xmid)
    if (projectRow) {
      projectRow.subFlowStatus = 'A01'
      projectRow.subFlowStatusName = PROJECT_CHANGE_STATUS_NAMES.A01
      projectRow.bgid = projectRow.bgid || `BG-TZ-${projectRow.xmid}`
      return
    }
    const budgetRow = BUDGET_ADJUSTMENT_ROWS.find((item) => item.xmid === submittedRow.xmid)
    if (budgetRow) {
      budgetRow.auditStatus = '2'
      budgetRow.auditStatusMc = BUDGET_CHANGE_STATUS_NAMES['2']
    }
  })
  return success(true, '提交成功')
})

Mock.mock(/xmysbg\/resend(\?.*)?$/, 'post', () => success(true, '补推计划系统成功'))
Mock.mock(/xmysbg\/resendSap(\?.*)?$/, 'post', () => success(true, '补推 SAP 成功'))
Mock.mock(/xmysbg\/importYsbg(\?.*)?$/, 'post', () => success(true, '导入成功'))

// ==================== 直接纳会 / 待会审撤回 / 导出 ====================

// 判断所选项目能否直接纳会。
// 依据 sfcjpsyj（来源 YSBG_TZSY.note）：'0' 表示本次调整无需重新出具评审意见，可直接纳会；
// '1' 需要评审意见，页面会退回去走原有提交审批流程。
// 返回结构与 CanBeNrhyData 一致：'1' 为可纳会 id 集合，'2' 为不可纳会 id 集合。
Mock.mock(/sjtc\/xmysbg\/canBeNrhy(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = getIds(parseBody(options))
  const canNrhy: string[] = []
  const cannotNrhy: string[] = []
  ids.forEach((id) => {
    const row = PROJECT_ADJUSTMENT_ROWS.find((item) => item.xmid === id)
    if (row && String(row.sfcjpsyj) === '0') canNrhy.push(id)
    else cannotNrhy.push(id)
  })
  return success({ '1': canNrhy, '2': cannotNrhy })
})

// 直接纳会：跳过审批流，项目直接进入待联合会审(A01)。
Mock.mock(/sjtc\/xmysbg\/nrhy(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = getIds(parseBody(options))
  let handled = 0
  PROJECT_ADJUSTMENT_ROWS.forEach((row) => {
    if (!ids.includes(row.xmid)) return
    row.subFlowStatus = 'A01'
    row.subFlowStatusName = PROJECT_CHANGE_STATUS_NAMES.A01
    row.bgid = row.bgid || `BG-TZ-${row.xmid}`
    handled += 1
  })
  return handled ? success(true, '纳会成功') : fail('未找到可纳会的项目')
})

// 待会审撤回：A01 退回需求草稿(Q00)，保留 bg* 变更数据以便修改后重新提交。
Mock.mock(/sjtc\/xmysbg\/updateSubFlowStatus(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = getIds(parseBody(options))
  let handled = 0
  PROJECT_ADJUSTMENT_ROWS.forEach((row) => {
    if (!ids.includes(row.xmid) || row.subFlowStatus !== 'A01') return
    row.subFlowStatus = 'Q00'
    row.subFlowStatusName = PROJECT_CHANGE_STATUS_NAMES.Q00
    handled += 1
  })
  return handled ? success(true, '撤回成功') : fail('所选项目不在待联合会审状态')
})

// 导出当前查询条件下的列表，复用列表页的 filterRows，保证导出内容与页面一致。
// 数据源区分：项目调整页签发送 sfgmb: 0(number)，年度预算/规模包页签发送 '0' / '1'(string)。
Mock.mock(/xmysbg\/exportYsbg(\?.*)?$/, 'post', async (options: MockOptions) => {
  const body = parseBody(options)
  const isProjectAdjustment = typeof body.sfgmb === 'number'
  const rows = isProjectAdjustment ? filterRows(PROJECT_ADJUSTMENT_ROWS, body, false) : filterRows(BUDGET_ADJUSTMENT_ROWS, body, true)
  const sheetName = isProjectAdjustment ? '项目调整' : '预算调整'

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  worksheet.columns = [
    { header: '项目编码', key: 'xmbm', width: 18 },
    { header: '国网项目编码', key: 'gwxmbm', width: 20 },
    { header: '项目名称', key: 'xmmc', width: 32 },
    { header: '年度', key: 'nd', width: 10 },
    { header: '一级单位', key: 'yjdw', width: 22 },
    { header: '二级单位', key: 'ejdw', width: 22 },
    { header: '项目类型', key: 'xmjhlxName', width: 16 },
    { header: '变更类型', key: 'bglxName', width: 16 },
    { header: '变更原因', key: 'bgyy', width: 36 },
    { header: '总投资计划(万元)', key: 'allInvestTax', width: 18 },
    { header: '变更后总投资(万元)', key: 'bgAllInvestTax', width: 20 },
    { header: '当年预算(万元)', key: 'dnys', width: 16 },
    { header: '变更后当年预算(万元)', key: 'bgDnys', width: 22 },
    { header: '状态', key: 'statusName', width: 14 }
  ]
  worksheet.addRows(
    rows.map((row) => ({
      ...clone(row),
      statusName: (isProjectAdjustment ? row.subFlowStatusName : row.auditStatusMc) || '空状态'
    }))
  )
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  return binaryResponse(await workbook.xlsx.writeBuffer(), {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: `${sheetName}导出.xlsx`
  })
})
