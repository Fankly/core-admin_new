/**
 * 智能审核启用范围 / 知识库适用范围 / 规则适用范围 mock
 *
 * 注意：commonCode/getData、getButtonList、getMenuByUrl 等共用接口必须按判别值收窄，
 * 避免 mockjs 命中后无法透传真实后端。
 */
import Mock from 'mockjs'
import { fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// ==================== 登录 / 按钮权限链路 ====================
// userDialog：getMenuByUrl → getRoleByBusicode → getButtonList → setPermissions
// 判别值写进正则，避免宽泛拦截污染其他页面

/** 本页 outsideMenu / menuCode（开发态 mock 专用） */
const RANGE_BUSICODE = 'AI-AUDIT-INUSE-RANGE'
const RANGE_BUTTONS = ['EDIT', 'DELETE']
const RULE_MANAGE_BUSICODE = 'AI-AUDIT-RULE-MANAGE'
const RULE_MANAGE_BUTTONS = ['ADD', 'EDIT', 'DELETE', 'RELATE', 'RELATEYJDW', 'PROMPTEDIT']

const buildRangeRole = () => ({
  id: `sprole-${RANGE_BUSICODE}`,
  name: '财务预算专职',
  code: 'SCWYSZZ',
  role_id: 'role-ai-audit-range',
  specialorgid: 'bm-001',
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  org_id: 'DW001',
  org_name: '国网江苏省电力有限公司',
  namecode: 'mock_range_admin',
  busicode: RANGE_BUSICODE
})

// 菜单：只拦 url 含 aiAuditInuseRange 的请求
Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*aiAuditInuseRange/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ outsideMenu: RANGE_BUSICODE, url })
})

// 角色：按 busicode 收窄
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${RANGE_BUSICODE}(?:&|$)`), 'get', () => [buildRangeRole()])

// 按钮权限：批量编辑 / 删除
Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${RANGE_BUSICODE}(?:&|$)`), 'get', () => success(clone(RANGE_BUTTONS)))

// 规则管理页权限链路
Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*aiAuditRuleManage/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ outsideMenu: RULE_MANAGE_BUSICODE, url })
})

Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${RULE_MANAGE_BUSICODE}(?:&|$)`), 'get', () => [
  {
    ...buildRangeRole(),
    id: `sprole-${RULE_MANAGE_BUSICODE}`,
    busicode: RULE_MANAGE_BUSICODE
  }
])

Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${RULE_MANAGE_BUSICODE}(?:&|$)`), 'get', () => success(clone(RULE_MANAGE_BUTTONS)))

// ==================== 静态字典 / 树 ====================

const RANGE_TABS = [
  { code: '1', name: '启用范围', sort: 1 },
  { code: '2', name: '外包负面清单', sort: 2 },
  { code: '3', name: '适用审核规则', sort: 3 }
]

const INUSE_TYPE_LIST = [
  { code: '1', name: '全部启用', sort: 1 },
  { code: '2', name: '按一级单位启用', sort: 2 },
  { code: '0', name: '停用', sort: 3 }
]

const YJDW_LIST = [
  { code: 'DW001', name: '国网江苏省电力有限公司' },
  { code: 'DW002', name: '国网南京供电公司' },
  { code: 'DW003', name: '国网苏州供电公司' },
  { code: 'DW004', name: '国网无锡供电公司' },
  { code: 'DW005', name: '国网徐州供电公司' }
]

const PROTYPE_TREE = [
  {
    id: 'PT01',
    name: '基建项目',
    children: [
      { id: 'PT0101', name: '输变电工程' },
      { id: 'PT0102', name: '配电工程' }
    ]
  },
  {
    id: 'PT02',
    name: '技改项目',
    children: [
      { id: 'PT0201', name: '一次设备技改' },
      { id: 'PT0202', name: '二次设备技改' }
    ]
  },
  {
    id: 'PT03',
    name: '大修项目',
    children: [
      { id: 'PT0301', name: '线路大修' },
      { id: 'PT0302', name: '变电大修' }
    ]
  },
  {
    id: 'PT04',
    name: '零星购置',
    children: [{ id: 'PT0401', name: '仪器仪表购置' }]
  }
]

const PROTYPE_NAME_MAP: Record<string, string> = {
  PT01: '基建项目',
  PT0101: '输变电工程',
  PT0102: '配电工程',
  PT02: '技改项目',
  PT0201: '一次设备技改',
  PT0202: '二次设备技改',
  PT03: '大修项目',
  PT0301: '线路大修',
  PT0302: '变电大修',
  PT04: '零星购置',
  PT0401: '仪器仪表购置'
}

const flattenTree = (nodes: any[], keyword = ''): any[] => {
  const result: any[] = []
  const walk = (list: any[]) => {
    list.forEach((node) => {
      if (!keyword || String(node.name).includes(keyword)) {
        result.push({ id: node.id, name: node.name })
      }
      if (node.children?.length) walk(node.children)
    })
  }
  walk(nodes)
  return result
}

// ==================== 内存数据（支持增删改） ====================

type InuseRow = {
  rangeId: string
  proType: string
  proTypeName: string
  inuseType: string
  inuseTypeName: string
  yjdwList: string[]
  yjdwNameList: string
}

type KnowledgeRow = {
  proType: string
  proTypeName: string
  kbIdList: string
  kbBizSubCatList: string
  kbBizSubCatNameList: string
}

type RuleRangeRow = {
  proType: string
  proTypeName: string
  ruleIdList: string
  ruleNameList: string
}

type SchemaMenuRow = {
  fjType: string
  fjTypeName: string
  schemaId: string
  schemaJson: string
  schemaName: string
}

type SchemaRangeRow = {
  proType: string
  proTypeName: string
  schemaIdList: string
  schemaNameList: string
}

type RuleManageRow = {
  ruleId: string
  ruleCode: string
  ruleName: string
  ruleDesc: string
  ruleMajor: string
  ruleMajorName: string
  ruleClassify: string
  ruleClassifyName: string
  ruleLevel: string
  ruleLevelName: string
  execStage: string
  execStageName: string
  ruleStatus: string
  sort: number
  prompt: string
}

type RuleDetailRow = {
  detailId: string
  ruleId: string
  detailCode: string
  detailName: string
  yssxbm: string
  sort: number
  detailDesc: string
  prompt: string
}

const yjdwNameOf = (codes: string[]) =>
  codes
    .map((code) => YJDW_LIST.find((item) => item.code === code)?.name || code)
    .filter(Boolean)
    .join('、')

const inuseTypeNameOf = (code: string) => INUSE_TYPE_LIST.find((item) => item.code === code)?.name || code

let inuseRows: InuseRow[] = [
  {
    rangeId: 'range-001',
    proType: 'PT0101',
    proTypeName: '输变电工程',
    inuseType: '1',
    inuseTypeName: '全部启用',
    yjdwList: [],
    yjdwNameList: ''
  },
  {
    rangeId: 'range-002',
    proType: 'PT0201',
    proTypeName: '一次设备技改',
    inuseType: '2',
    inuseTypeName: '按一级单位启用',
    yjdwList: ['DW002', 'DW003'],
    yjdwNameList: '国网南京供电公司、国网苏州供电公司'
  },
  {
    rangeId: 'range-003',
    proType: 'PT0301',
    proTypeName: '线路大修',
    inuseType: '0',
    inuseTypeName: '停用',
    yjdwList: [],
    yjdwNameList: ''
  },
  {
    rangeId: 'range-004',
    proType: 'PT01',
    proTypeName: '基建项目',
    inuseType: '1',
    inuseTypeName: '全部启用',
    yjdwList: [],
    yjdwNameList: ''
  },
  {
    rangeId: 'range-005',
    proType: 'PT02',
    proTypeName: '技改项目',
    inuseType: '2',
    inuseTypeName: '按一级单位启用',
    yjdwList: ['DW001'],
    yjdwNameList: '国网江苏省电力有限公司'
  }
]

let knowledgeRows: KnowledgeRow[] = [
  {
    proType: 'PT0101',
    proTypeName: '输变电工程',
    kbIdList: 'OAL101,OAL102',
    kbBizSubCatList: 'SUB_A,SUB_B',
    kbBizSubCatNameList: '输电运维,变电运维'
  },
  {
    proType: 'PT0201',
    proTypeName: '一次设备技改',
    kbIdList: 'OAL104',
    kbBizSubCatList: 'SUB_C',
    kbBizSubCatNameList: '用电检查'
  },
  {
    proType: 'PT0301',
    proTypeName: '线路大修',
    kbIdList: 'OAL106,OAL107,OAL108',
    kbBizSubCatList: 'SUB_D,SUB_E,SUB_F',
    kbBizSubCatNameList: '网络运维,系统开发,安全督查'
  },
  {
    proType: 'PT01',
    proTypeName: '基建项目',
    kbIdList: 'OAL101',
    kbBizSubCatList: 'SUB_A',
    kbBizSubCatNameList: '输电运维'
  }
]

let ruleManageRows: RuleManageRow[] = [
  {
    ruleId: 'rule-001',
    ruleCode: '10001',
    ruleName: '投资估算偏差审核',
    ruleDesc: '校验申报投资与参考值偏差是否超限',
    ruleMajor: '1',
    ruleMajorName: '经济性',
    ruleClassify: 'ECONOMY',
    ruleClassifyName: '经济性',
    ruleLevel: '1',
    ruleLevelName: '问题',
    execStage: '1',
    execStageName: '可研阶段',
    ruleStatus: '1',
    sort: 1,
    prompt: '请对项目投资估算进行审核，识别申报金额与历史同类项目参考值的偏差，并说明判断依据。'
  },
  {
    ruleId: 'rule-002',
    ruleCode: '10002',
    ruleName: '价格对比审核',
    ruleDesc: '物料单价与商城均价对比',
    ruleMajor: '1',
    ruleMajorName: '经济性',
    ruleClassify: 'ECONOMY',
    ruleClassifyName: '经济性',
    ruleLevel: '2',
    ruleLevelName: '隐患',
    execStage: '1',
    execStageName: '可研阶段',
    ruleStatus: '1',
    sort: 2,
    prompt: '请将物料申报单价与商城近期均价进行比较，输出偏差比例、异常物料及建议价格。'
  },
  {
    ruleId: 'rule-003',
    ruleCode: '10003',
    ruleName: '资料完整性审核',
    ruleDesc: '检查必备附件是否齐全',
    ruleMajor: '2',
    ruleMajorName: '合规性',
    ruleClassify: 'COMPLIANCE',
    ruleClassifyName: '合规性',
    ruleLevel: '1',
    ruleLevelName: '问题',
    execStage: '1',
    execStageName: '可研阶段',
    ruleStatus: '1',
    sort: 3,
    prompt: '请核对项目申报资料清单，逐项判断必备附件是否齐全、有效，并列出缺失项。'
  },
  {
    ruleId: 'rule-004',
    ruleCode: '10004',
    ruleName: '项目信息一致性审核',
    ruleDesc: '项目名称、单位、类型等字段一致性校验',
    ruleMajor: '2',
    ruleMajorName: '合规性',
    ruleClassify: 'NECESSITY',
    ruleClassifyName: '必要性',
    ruleLevel: '3',
    ruleLevelName: '异常',
    execStage: '2',
    execStageName: '评审阶段',
    ruleStatus: '1',
    sort: 4,
    prompt: '请交叉核验项目名称、申报单位、项目类型及建设内容，指出不一致字段和数据来源。'
  },
  {
    ruleId: 'rule-005',
    ruleCode: '10005',
    ruleName: '财务合规性审核',
    ruleDesc: '是否符合大修/技改费用列支规定',
    ruleMajor: '2',
    ruleMajorName: '合规性',
    ruleClassify: 'COMPLIANCE',
    ruleClassifyName: '合规性',
    ruleLevel: '1',
    ruleLevelName: '问题',
    execStage: '1',
    execStageName: '可研阶段',
    ruleStatus: '1',
    sort: 5,
    prompt: '请依据大修和技改费用列支规定审核项目支出，说明不合规事项及对应条款。'
  },
  {
    ruleId: 'rule-006',
    ruleCode: '10006',
    ruleName: '协议库存单价对比',
    ruleDesc: '与同源目录协议库存单价对比',
    ruleMajor: '1',
    ruleMajorName: '经济性',
    ruleClassify: 'ECONOMY',
    ruleClassifyName: '经济性',
    ruleLevel: '2',
    ruleLevelName: '隐患',
    execStage: '1',
    execStageName: '可研阶段',
    ruleStatus: '1',
    sort: 6,
    prompt: '请将申报物料与同源目录协议库存单价进行对比，标记超出合理区间的物料。'
  }
]

let ruleDetails: RuleDetailRow[] = [
  {
    detailId: 'detail-001',
    ruleId: 'rule-001',
    detailCode: 'INVEST-AMOUNT',
    detailName: '总投资偏差校验',
    yssxbm: 'YSZX-01',
    sort: 1,
    detailDesc: '核验申报总投资与同类项目参考区间的偏差。',
    prompt: '读取申报总投资和同类项目参考值，计算偏差率；偏差超过 15% 时给出风险说明。'
  },
  {
    detailId: 'detail-002',
    ruleId: 'rule-001',
    detailCode: 'INVEST-STRUCTURE',
    detailName: '投资结构合理性校验',
    yssxbm: 'YSZX-02',
    sort: 2,
    detailDesc: '检查建筑、安装、设备等费用占比是否合理。',
    prompt: '分析各费用科目占总投资比例，对明显偏离历史区间的科目逐项说明。'
  },
  {
    detailId: 'detail-003',
    ruleId: 'rule-002',
    detailCode: 'PRICE-MALL',
    detailName: '商城均价对比',
    yssxbm: 'YSJG-01',
    sort: 1,
    detailDesc: '将物料申报单价与商城近三个月均价对比。',
    prompt: '按物料编码匹配商城价格，计算申报价相对均价的偏差并列出超过 10% 的记录。'
  },
  {
    detailId: 'detail-004',
    ruleId: 'rule-003',
    detailCode: 'DOC-REQUIRED',
    detailName: '必备附件检查',
    yssxbm: 'YSZL-01',
    sort: 1,
    detailDesc: '检查可研报告、估算书和批复材料是否齐全。',
    prompt: '根据项目类型对应的必备材料清单检查附件，输出缺失、过期或无法解析的文件。'
  }
]

const linkedProTypes: Record<string, string[]> = {
  'rule-001': ['PT0101', 'PT0201'],
  'rule-002': ['PT0102', 'PT0401'],
  'rule-003': ['PT0101', 'PT0301'],
  'rule-004': ['PT0202'],
  'rule-005': ['PT0201', 'PT0301'],
  'rule-006': ['PT0102', 'PT0401']
}

const linkedYjdw: Record<string, string[]> = {
  'rule-001': ['DW001', 'DW003'],
  'rule-002': ['DW002', 'DW003'],
  'rule-003': ['DW001'],
  'rule-004': ['DW004'],
  'rule-005': ['DW001', 'DW005'],
  'rule-006': ['DW003']
}

const ruleNameOf = (ids: string[]) =>
  ids
    .map((id) => ruleManageRows.find((item) => item.ruleId === id)?.ruleName || id)
    .filter(Boolean)
    .join('、')

let ruleRangeRows: RuleRangeRow[] = [
  {
    proType: 'PT0101',
    proTypeName: '输变电工程',
    ruleIdList: 'rule-001,rule-002,rule-003',
    ruleNameList: '投资估算偏差审核、价格对比审核、资料完整性审核'
  },
  {
    proType: 'PT0201',
    proTypeName: '一次设备技改',
    ruleIdList: 'rule-002,rule-005',
    ruleNameList: '价格对比审核、财务合规性审核'
  },
  {
    proType: 'PT0301',
    proTypeName: '线路大修',
    ruleIdList: 'rule-003,rule-004,rule-006',
    ruleNameList: '资料完整性审核、项目信息一致性审核、协议库存单价对比'
  },
  {
    proType: 'PT01',
    proTypeName: '基建项目',
    ruleIdList: 'rule-001,rule-003',
    ruleNameList: '投资估算偏差审核、资料完整性审核'
  }
]

const SCHEMA_MENU_ROWS: SchemaMenuRow[] = [
  {
    schemaId: 'schema-001',
    schemaName: '项目基本信息Schema',
    fjType: '1',
    fjTypeName: '可研报告',
    schemaJson: '{"项目名称":"string","建设地点":"string"}'
  },
  {
    schemaId: 'schema-002',
    schemaName: '投资估算Schema',
    fjType: '2',
    fjTypeName: '投资估算书',
    schemaJson: '{"总投资":"number","建筑工程费":"number"}'
  },
  {
    schemaId: 'schema-003',
    schemaName: '设备清单Schema',
    fjType: '3',
    fjTypeName: '设备材料清册',
    schemaJson: '{"设备名称":"string","数量":"number"}'
  }
]

let schemaRangeRows: SchemaRangeRow[] = [
  {
    proType: 'PT0101',
    proTypeName: '输变电工程',
    schemaIdList: 'schema-001,schema-002',
    schemaNameList: '项目基本信息Schema、投资估算Schema'
  },
  {
    proType: 'PT0201',
    proTypeName: '一次设备技改',
    schemaIdList: 'schema-001,schema-003',
    schemaNameList: '项目基本信息Schema、设备清单Schema'
  }
]

const matchProType = (rowProType: string, filter: string) => {
  if (!filter) return true
  // 选中父节点时，匹配自身及以父 id 为前缀的子类型
  return rowProType === filter || rowProType.startsWith(filter)
}

const toStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (value == null || value === '') return []
  return String(value)
    .split(/[,，;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

// ==================== 公共代码（按 code 收窄） ====================

const COMMON_CODE_MAP: Record<string, Array<Record<string, string | number>>> = {
  AI_AUDIT_RANGE_TAB_COM: RANGE_TABS,
  AI_AUDIT_INUSE_TYPE_COM: INUSE_TYPE_LIST,
  AI_AUDIT_RULE_CLASSIFY_COM: [
    { code: 'NECESSITY', name: '必要性', sort: 1 },
    { code: 'ECONOMY', name: '经济性', sort: 2 },
    { code: 'COMPLIANCE', name: '合规性', sort: 3 }
  ],
  AI_AUDIT_RULE_LEVEL_COM: [
    { code: '1', name: '问题', sort: 1 },
    { code: '2', name: '隐患', sort: 2 },
    { code: '3', name: '异常', sort: 3 }
  ],
  ZLYS_SFQY: [
    { code: '1', name: '启用', sort: 1 },
    { code: '0', name: '停用', sort: 2 }
  ],
  AI_AUDIT_RULE_EXEC_STAGE_COM: [
    { code: '1', name: '可研阶段', sort: 1 },
    { code: '2', name: '评审阶段', sort: 2 }
  ],
  AI_AUDIT_RULE_MAJOR_COM: [
    { code: '1', name: '经济性', sort: 1 },
    { code: '2', name: '合规性', sort: 2 }
  ]
}

Object.entries(COMMON_CODE_MAP).forEach(([code, data]) => {
  Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${code}(?:&|$)`), 'get', () => success(clone(data)))
})

// 一级单位（启用范围弹窗）
Mock.mock(/commonCode\/getYjdw(\?.*)?$/, 'get', () => success(clone(YJDW_LIST)))

// 项目类型树
Mock.mock(/protypeTree\/getAllProtypeTree(\?.*)?$/, 'get', () => success(clone(PROTYPE_TREE)))

// 项目类型搜索
Mock.mock(/xmAttribute\/getSearchAllProType(\?.*)?$/, 'get', (options: MockOptions) => {
  const name = getQueryValue(options.url, 'name')
  return success(flattenTree(PROTYPE_TREE, name))
})

// ==================== 启用范围 ====================

Mock.mock(/ai-audit-inuse-range\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proType = String(body.proType || body.protype || '')
  const filtered = inuseRows.filter((row) => matchProType(row.proType, proType))
  return success(pageResult(clone(filtered), body.page || body.current || 1, body.limit || body.size || 20))
})

Mock.mock(/ai-audit-inuse-range\/edit(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proTypeList = toStringList(body.proTypeList)
  if (!proTypeList.length) return fail('缺少项目类型')
  const inuseType = String(body.inuseType || '1')
  const yjdwList = inuseType === '2' ? toStringList(body.yjdwList) : []
  const inuseTypeName = inuseTypeNameOf(inuseType)
  const yjdwNameList = yjdwNameOf(yjdwList)

  proTypeList.forEach((proType) => {
    const exist = inuseRows.find((row) => row.proType === proType)
    if (exist) {
      exist.inuseType = inuseType
      exist.inuseTypeName = inuseTypeName
      exist.yjdwList = yjdwList
      exist.yjdwNameList = yjdwNameList
      exist.proTypeName = PROTYPE_NAME_MAP[proType] || exist.proTypeName
    } else {
      inuseRows.unshift({
        rangeId: `range-${Date.now()}-${proType}`,
        proType,
        proTypeName: PROTYPE_NAME_MAP[proType] || proType,
        inuseType,
        inuseTypeName,
        yjdwList,
        yjdwNameList
      })
    }
  })
  return success(true, '保存成功')
})

Mock.mock(/ai-audit-inuse-range\/remove(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  // 兼容数组 body 与 { proTypeList } 两种传参
  const proTypeList = Array.isArray(body)
    ? body.map(String)
    : Array.isArray(body.value)
    ? body.value.map(String)
    : toStringList(body.proTypeList || body)
  if (!proTypeList.length) return fail('缺少项目类型')
  inuseRows = inuseRows.filter((row) => !proTypeList.includes(row.proType))
  return success(true, '删除成功')
})

// ==================== 知识库适用范围 ====================

Mock.mock(/ai-audit-kb-range\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const protype = String(body.protype || body.proType || '')
  const filtered = knowledgeRows.filter((row) => matchProType(row.proType, protype))
  return success(pageResult(clone(filtered), body.page || body.current || 1, body.limit || body.size || 20))
})

Mock.mock(/ai-audit-kb-range\/edit(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proTypeList = toStringList(body.proTypeList)
  const kbIdList = toStringList(body.kbIdList)
  if (!proTypeList.length) return fail('缺少项目类型')
  if (!kbIdList.length) return fail('缺少知识库ID')

  const kbIdText = kbIdList.join(',')
  // 名称与外包负面清单 mock 种子数据对齐，便于编辑回显校验
  const KB_NAME_MAP: Record<string, string> = {
    OAL101: '输电运维',
    OAL102: '变电运维',
    OAL103: '配电运维',
    OAL104: '用电检查',
    OAL105: '业扩报装',
    OAL106: '网络运维',
    OAL107: '系统开发',
    OAL108: '安全督查',
    OAL109: '应急管理'
  }
  const nameList = kbIdList.map((id) => KB_NAME_MAP[id] || id)

  proTypeList.forEach((proType) => {
    const exist = knowledgeRows.find((row) => row.proType === proType)
    if (exist) {
      exist.kbIdList = kbIdText
      exist.kbBizSubCatList = kbIdList.map((id) => `SUB_${id}`).join(',')
      exist.kbBizSubCatNameList = nameList.join(',')
      exist.proTypeName = PROTYPE_NAME_MAP[proType] || exist.proTypeName
    } else {
      knowledgeRows.unshift({
        proType,
        proTypeName: PROTYPE_NAME_MAP[proType] || proType,
        kbIdList: kbIdText,
        kbBizSubCatList: kbIdList.map((id) => `SUB_${id}`).join(','),
        kbBizSubCatNameList: nameList.join(',')
      })
    }
  })
  return success(true, '保存成功')
})

Mock.mock(/ai-audit-kb-range\/remove(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proTypeList = Array.isArray(body)
    ? body.map(String)
    : Array.isArray(body.value)
    ? body.value.map(String)
    : toStringList(body.proTypeList || body)
  if (!proTypeList.length) return fail('缺少项目类型')
  knowledgeRows = knowledgeRows.filter((row) => !proTypeList.includes(row.proType))
  return success(true, '删除成功')
})

// ==================== 规则适用范围 ====================

Mock.mock(/ai-audit-rules-range\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const protype = String(body.protype || body.proType || '')
  const filtered = ruleRangeRows.filter((row) => matchProType(row.proType, protype))
  return success(pageResult(clone(filtered), body.page || body.current || 1, body.limit || body.size || 20))
})

Mock.mock(/ai-audit-rules-range\/edit(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proTypeList = toStringList(body.proTypeList)
  const ruleIdList = toStringList(body.ruleIdList)
  if (!proTypeList.length) return fail('缺少项目类型')
  if (!ruleIdList.length) return fail('缺少规则ID')

  const ruleIdText = ruleIdList.join(',')
  const ruleNameList = ruleNameOf(ruleIdList)

  proTypeList.forEach((proType) => {
    const exist = ruleRangeRows.find((row) => row.proType === proType)
    if (exist) {
      exist.ruleIdList = ruleIdText
      exist.ruleNameList = ruleNameList
      exist.proTypeName = PROTYPE_NAME_MAP[proType] || exist.proTypeName
    } else {
      ruleRangeRows.unshift({
        proType,
        proTypeName: PROTYPE_NAME_MAP[proType] || proType,
        ruleIdList: ruleIdText,
        ruleNameList
      })
    }
  })
  return success(true, '保存成功')
})

Mock.mock(/ai-audit-rules-range\/remove(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proTypeList = Array.isArray(body)
    ? body.map(String)
    : Array.isArray(body.value)
    ? body.value.map(String)
    : toStringList(body.proTypeList || body)
  if (!proTypeList.length) return fail('缺少项目类型')
  ruleRangeRows = ruleRangeRows.filter((row) => !proTypeList.includes(row.proType))
  return success(true, '删除成功')
})

// ==================== 提取 Schema 适用范围 ====================

Mock.mock(/xm-protype-extract-schema\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proType = String(body.proType || '')
  const filtered = schemaRangeRows.filter((row) => matchProType(row.proType, proType))
  return success(pageResult(clone(filtered), body.page || body.current || 1, body.limit || body.size || 20))
})

Mock.mock(/xm-protype-extract-schema\/edit(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proTypeList = toStringList(body.proTypeList)
  const schemaIdList = toStringList(body.schemaIdList)
  if (!proTypeList.length) return fail('缺少项目类型')
  if (!schemaIdList.length) return fail('缺少Schema ID')
  const schemaNameList = schemaIdList.map((id) => SCHEMA_MENU_ROWS.find((item) => item.schemaId === id)?.schemaName || id).join('、')
  proTypeList.forEach((proType) => {
    const exist = schemaRangeRows.find((row) => row.proType === proType)
    if (exist) {
      exist.schemaIdList = schemaIdList.join(',')
      exist.schemaNameList = schemaNameList
      exist.proTypeName = PROTYPE_NAME_MAP[proType] || exist.proTypeName
    } else {
      schemaRangeRows.unshift({
        proType,
        proTypeName: PROTYPE_NAME_MAP[proType] || proType,
        schemaIdList: schemaIdList.join(','),
        schemaNameList
      })
    }
  })
  return success(true, '保存成功')
})

Mock.mock(/xm-protype-extract-schema\/remove(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proTypeList = Array.isArray(body) ? body.map(String) : toStringList(body.proTypeList || body)
  if (!proTypeList.length) return fail('缺少项目类型')
  schemaRangeRows = schemaRangeRows.filter((row) => !proTypeList.includes(row.proType))
  return success(true, '删除成功')
})

// 提取 Schema 选择弹窗列表
Mock.mock(/ai\/xm-attach-extract-schema\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const schemaName = String(body.schemaName || '').trim()
  const fjType = String(body.fjType || '')
  const filtered = SCHEMA_MENU_ROWS.filter((row) => (!schemaName || row.schemaName.includes(schemaName)) && (!fjType || row.fjType === fjType))
  return success(pageResult(clone(filtered), body.page || body.current || 1, body.limit || body.size || 20))
})

// ==================== 规则管理列表（规则编辑弹窗多选） ====================

Mock.mock(/ai-audit-rule-manage\/getRulePage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const keywordCode = String(body.ruleCode || '').trim()
  const keywordName = String(body.ruleName || '').trim()
  const keywordDesc = String(body.ruleDesc || '').trim()
  const filtered = ruleManageRows.filter((row) => {
    return (
      (!keywordCode || row.ruleCode.includes(keywordCode)) &&
      (!keywordName || row.ruleName.includes(keywordName)) &&
      (!keywordDesc || row.ruleDesc.includes(keywordDesc)) &&
      (!body.ruleClassify || row.ruleClassify === String(body.ruleClassify)) &&
      (!body.ruleLevel || row.ruleLevel === String(body.ruleLevel)) &&
      (!body.ruleStatus || row.ruleStatus === String(body.ruleStatus))
    )
  })
  return success(pageResult(clone(filtered), body.page || body.current || 1, body.limit || body.size || 20))
})

const codeNameOf = (codeType: keyof typeof COMMON_CODE_MAP, code: unknown) => {
  const value = String(code ?? '')
  return String(COMMON_CODE_MAP[codeType].find((item) => String(item.code) === value)?.name || value)
}

const normalizeRule = (body: Record<string, any>, ruleId: string): RuleManageRow => ({
  ruleId,
  ruleCode: String(body.ruleCode || '').trim(),
  ruleName: String(body.ruleName || '').trim(),
  ruleDesc: String(body.ruleDesc || '').trim(),
  ruleMajor: String(body.ruleMajor || ''),
  ruleMajorName: codeNameOf('AI_AUDIT_RULE_MAJOR_COM', body.ruleMajor),
  ruleClassify: String(body.ruleClassify || ''),
  ruleClassifyName: codeNameOf('AI_AUDIT_RULE_CLASSIFY_COM', body.ruleClassify),
  ruleLevel: String(body.ruleLevel || ''),
  ruleLevelName: codeNameOf('AI_AUDIT_RULE_LEVEL_COM', body.ruleLevel),
  execStage: String(body.execStage || ''),
  execStageName: codeNameOf('AI_AUDIT_RULE_EXEC_STAGE_COM', body.execStage),
  ruleStatus: String(body.ruleStatus ?? '1'),
  sort: Number(body.sort) || 0,
  prompt: String(body.prompt || '')
})

Mock.mock(/ai-audit-rule-manage\/saveRule(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  if (!body.ruleCode || !body.ruleName) return fail('规则编码和规则名称不能为空')

  const duplicate = ruleManageRows.find((row) => row.ruleCode === String(body.ruleCode).trim() && row.ruleId !== body.ruleId)
  if (duplicate) return fail(`规则编码 ${body.ruleCode} 已存在`)

  const existIndex = ruleManageRows.findIndex((row) => row.ruleId === body.ruleId)
  if (existIndex >= 0) {
    const current = ruleManageRows[existIndex]
    ruleManageRows.splice(existIndex, 1, normalizeRule({ ...current, ...body }, current.ruleId))
  } else {
    const nextId = `rule-${String(Date.now())}`
    ruleManageRows.unshift(normalizeRule(body, nextId))
  }
  return success(true, '保存成功')
})

Mock.mock(/ai-audit-rule-manage\/editPrompt(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const rule = ruleManageRows.find((item) => item.ruleId === body.ruleId)
  if (!rule) return fail(`未找到规则：${body.ruleId || '未提供 ruleId'}`, 404)
  if (!String(body.prompt || '').trim()) return fail('提示词不能为空')
  rule.prompt = String(body.prompt).trim()
  return success(true, '提示词保存成功')
})

Mock.mock(/ai-audit-rule-manage\/removeRule(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ruleIds = Array.isArray(body) ? body.map(String) : toStringList(body.ruleIdList || body.ruleIds || body.value)
  if (!ruleIds.length) return fail('缺少规则ID')

  ruleManageRows = ruleManageRows.filter((row) => !ruleIds.includes(row.ruleId))
  ruleDetails = ruleDetails.filter((row) => !ruleIds.includes(row.ruleId))
  ruleIds.forEach((ruleId) => {
    delete linkedProTypes[ruleId]
    delete linkedYjdw[ruleId]
  })
  return success(true, '删除成功')
})

Mock.mock(/ai-audit-rule-manage\/listLinkedProType\?[^#]*ruleId=[^&#]+/, 'post', (options: MockOptions) => {
  const ruleId = getQueryValue(options.url, 'ruleId')
  return success(clone(linkedProTypes[ruleId] || []))
})

Mock.mock(/ai-audit-rule-manage\/linkProType(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ruleId = String(body.ruleId || '')
  if (!ruleManageRows.some((row) => row.ruleId === ruleId)) return fail(`未找到规则：${ruleId || '未提供 ruleId'}`, 404)
  linkedProTypes[ruleId] = toStringList(body.proTypeList)
  return success(true, '项目类型关联成功')
})

Mock.mock(/ai-audit-rule-manage\/listLinkedYjdw\?[^#]*ruleId=[^&#]+/, 'post', (options: MockOptions) => {
  const ruleId = getQueryValue(options.url, 'ruleId')
  return success(clone(linkedYjdw[ruleId] || []))
})

Mock.mock(/ai-audit-rule-manage\/linkYjdw(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ruleId = String(body.ruleId || '')
  if (!ruleManageRows.some((row) => row.ruleId === ruleId)) return fail(`未找到规则：${ruleId || '未提供 ruleId'}`, 404)
  linkedYjdw[ruleId] = toStringList(body.yjdwList)
  return success(true, '一级单位关联成功')
})

Mock.mock(/ai-audit-rules-detail\/listByRuleId\?[^#]*ruleId=[^&#]+/, 'post', (options: MockOptions) => {
  const ruleId = getQueryValue(options.url, 'ruleId')
  const rows = ruleDetails.filter((row) => row.ruleId === ruleId).sort((a, b) => a.sort - b.sort)
  return success(clone(rows))
})

Mock.mock(/ai-audit-rules-detail\/saveOrUpdate(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ruleId = String(body.ruleId || '')
  if (!ruleManageRows.some((row) => row.ruleId === ruleId)) return fail(`未找到规则：${ruleId || '未提供 ruleId'}`, 404)
  if (!body.detailCode || !body.detailName || !body.yssxbm || !body.prompt) return fail('子任务必填信息不完整')

  const duplicate = ruleDetails.find(
    (row) => row.ruleId === ruleId && row.detailCode === String(body.detailCode).trim() && row.detailId !== body.detailId
  )
  if (duplicate) return fail(`子任务编码 ${body.detailCode} 已存在`)

  const detail: RuleDetailRow = {
    detailId: String(body.detailId || `detail-${Date.now()}`),
    ruleId,
    detailCode: String(body.detailCode).trim(),
    detailName: String(body.detailName).trim(),
    yssxbm: String(body.yssxbm).trim(),
    sort: Number(body.sort) || 0,
    detailDesc: String(body.detailDesc || '').trim(),
    prompt: String(body.prompt).trim()
  }
  const existIndex = ruleDetails.findIndex((row) => row.detailId === detail.detailId)
  if (existIndex >= 0) ruleDetails.splice(existIndex, 1, detail)
  else ruleDetails.push(detail)
  return success(clone(detail), '保存成功')
})

Mock.mock(/ai-audit-rules-detail\/remove(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const detailIds = Array.isArray(body) ? body.map(String) : toStringList(body.detailIdList || body.value)
  if (!detailIds.length) return fail('缺少明细ID')
  ruleDetails = ruleDetails.filter((row) => !detailIds.includes(row.detailId))
  return success(true, '删除成功')
})
