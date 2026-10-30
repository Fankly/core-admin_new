/**
 * 预算执行分析四个页面的 mock：
 *   - /statistics/budgetExecutionAnalysis/yszxylb（预算执行一览）
 *   - /statistics/budgetExecutionAnalysis/customYapProjectExecutionByType（自定义预安排项目执行分析-按类型）
 *   - /statistics/yszxylb（预算执行统计报表）
 *   - /report/proYapMbz（项目预安排目标值）
 *
 * 覆盖页面及其弹窗组件用到的全部接口：
 *   页面初始化：sys/menu/getMenuByUrl、getRoleByBusicode、sysMenu/getButtonList（两页面各自的 busicode）
 *   下拉数据：budgetStatisticsConfig/getIndicatorByBusiType、getNodeTree、process40/getProTypeTreeNode、bizOrgTree/getBizOrgXzTree（单位选择树）
 *   表格：budgetStatistics/getDynamicColumnByDw、budgetStatistics/getDataListByDw（一览）、xmYapMbz/getData（预安排）
 *   同比环比弹窗：budgetStatics/tbhb/getDynamicColumn、budgetStatics/tbhb/getDataList、budgetStatics/tbhb/yap/getDataList
 *   帮助弹窗：sys/menuConfig/getConfigByMenuId、listFj、downloadFj（按 mock 菜单 id 收窄，不影响真实页面帮助配置）
 *   公共代码与参数：process40/getComCodeByCode、sysParam/getParamValueMulti 首命中拦截在 budgetChanges.ts（本模块仅追加所需 code / 参数键）
 */
import Mock from 'mockjs'
import { clone } from 'lodash'
import { binaryResponse, getQueryValue, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'
import { comparisonField, createBudgetComparisonMockRows, createBudgetExportMockRows } from '../fixtures/budgetExecutionAnalysis/exportValues'

const BUSICODE_YAP = 'MOCK-YSZX-YAP'
const BUSICODE_LB = 'MOCK-YSZX-LB'
const MENU_ID_YAP = 'MENU-MOCK-YSZX-YAP'
const MENU_ID_LB = 'MENU-MOCK-YSZX-LB'
const CURRENT_YEAR = String(new Date().getFullYear())

// ==================== 基础字典 ====================

const INDICATOR_NAMES: Record<string, string> = {
  MBZ: '目标值',
  PHMBZ: '平衡目标值',
  DFJ: '到位资金',
  LXZ: '立项值',
  WCZ: '完成值',
  WCL: '完成率'
}

const DEFAULT_INDICATORS = ['MBZ', 'PHMBZ', 'DFJ', 'LXZ', 'WCZ', 'WCL']

// 不同展示维度配置的指标项不同；未维护的维度返回空数组（页面会提示"未配置指标项"）
const INDICATORS_BY_BUSI_TYPE: Record<string, string[]> = {
  YSZXYL: ['MBZ', 'WCZ', 'WCL'],
  YSZXYL_ZX: ['MBZ', 'WCZ', 'WCL'],
  YSZXYL_YAP: DEFAULT_INDICATORS
}

// 项目类别树（getNodeTree → XmlbSelect 展示）
const XMLB_TREE = [
  {
    id: 'XMLB-JJ',
    name: '电网基建',
    children: [
      { id: 'XMLB-JJ-01', name: '35千伏及以上基建' },
      { id: 'XMLB-JJ-02', name: '10千伏及以下基建' }
    ]
  },
  {
    id: 'XMLB-JG',
    name: '生产技改',
    children: [{ id: 'XMLB-JG-01', name: '生产设备技改' }]
  },
  { id: 'XMLB-YX', name: '营销专项', children: [] }
]

// 项目类型树（getProTypeTreeNode，页面按预算年度拉取）
const PRO_TYPE_TREE = [
  {
    id: 'PT-JJ',
    name: '电网基建',
    leaf: false,
    children: [
      { id: 'PT-JJ-01', name: '35千伏及以上' },
      { id: 'PT-JJ-02', name: '10千伏及以下' }
    ]
  },
  { id: 'PT-JG', name: '生产技改', leaf: true },
  { id: 'PT-YX', name: '营销专项', leaf: true }
]

// ==================== 动态列 ====================

// 数值列（指标）四位小数字符串，展示位数由页面 XSWS 控制格式化
const toFixed4 = (value: number) => String(Math.round(value * 10000) / 10000)

const hashSeed = (id: string) => Array.from(id).reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 9973, 7)

const pickIndicators = (indicatorsParam: unknown, fallback: string[] = DEFAULT_INDICATORS) => {
  const requested = String(indicatorsParam ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return requested.length ? requested : fallback
}

const buildDynamicColumns = (indicators: string[]) => {
  const columns: Record<string, any>[] = [
    { field: 'name', title: '项目名称', width: 280 },
    { field: 'subName', title: '承诺子项', width: 200 },
    { field: 'gkbm', title: '归口部门', width: 110 },
    { field: 'ysly', title: '预算来源', width: 110 },
    { field: 'cnxm', title: '承诺项目', width: 140 },
    { field: 'cnxmms', title: '承诺项目描述', width: 200 }
  ]
  if (indicators.includes('MBZ')) {
    columns.push({
      title: '目标值',
      children: [
        { field: 'MBZ', title: '金额（万元）', width: 130 },
        { field: 'MBZ_JYL', title: '计划量', width: 110 }
      ]
    })
  }
  if (indicators.includes('DFJ')) {
    columns.push({
      title: '到位资金',
      children: [
        { field: 'DFJ', title: '金额（万元）', width: 130 },
        { field: 'DFJ_JYL', title: '计划量', width: 110 }
      ]
    })
  }
  if (indicators.includes('PHMBZ')) columns.push({ field: 'PHMBZ', title: '平衡目标值（万元）', width: 140 })
  if (indicators.includes('LXZ')) columns.push({ field: 'LXZ', title: '立项值（万元）', width: 140 })
  if (indicators.includes('WCZ')) columns.push({ field: 'WCZ', title: '完成值（万元）', width: 130 })
  if (indicators.includes('WCL')) columns.push({ field: 'WCL', title: '完成率（%）', width: 110 })
  return columns
}

// 使用接口的单位、期间、指标字段，完成率可以引用同一期间的目标值和完成值。
const buildTbhbColumns = (indicators: string[], searchType: string) => {
  const columns: Record<string, any>[] = [{ field: 'name', title: '名称', width: 260 }]
  ;(['CURRENT', 'LAST'] as const).forEach((period) => {
    columns.push({
      title: period === 'CURRENT' ? '本期' : searchType === '2' ? '上期' : '上年同期',
      children: indicators.map((code) => ({ field: comparisonField(period, code), title: INDICATOR_NAMES[code] || code, width: 120 }))
    })
  })
  columns.push({
    title: searchType === '2' ? '环比增幅' : '同比增幅',
    children: [
      { field: 'ORGID_DW001;INDICATORID_TBHBJE', title: '金额', width: 140 },
      { field: 'ORGID_DW001;INDICATORID_TBHBL', title: '比率', width: 140 }
    ]
  })
  return columns
}

// ==================== 表格行数据 ====================

interface MockTreeNode {
  id: string
  parentId: string
  name: string
  leaf: '0' | '1'
  values?: Record<string, string>
  detailFields?: DetailStyle
}

interface DetailStyle {
  subName: string
  gkbm: string
  ysly: string
  cnxm: string
  cnxmms: string
}

const DETAIL_STYLES: DetailStyle[] = [
  { subName: '主变压器增容子项', gkbm: '建设部', ysly: '企业自有资金', cnxm: '承诺项目-主变增容', cnxmms: '主变增容2台，新增容量120兆伏安' },
  { subName: '线路新建子项', gkbm: '建设部', ysly: '资本金预算', cnxm: '承诺项目-线路新建', cnxmms: '新建220千伏线路18公里' },
  { subName: '开关站改造子项', gkbm: '建设部', ysly: '政府专项债券', cnxm: '承诺项目-开关站改造', cnxmms: '35千伏开关站综合自动化改造' },
  { subName: '配网自动化子项', gkbm: '设备部', ysly: '企业自有资金', cnxm: '承诺项目-配网自动化', cnxmms: '配电自动化终端全覆盖改造' },
  { subName: '设备更换子项', gkbm: '设备部', ysly: '资本金预算', cnxm: '承诺项目-设备更换', cnxmms: '二次保护装置更换校验' },
  { subName: '计量采集子项', gkbm: '营销部', ysly: '企业自有资金', cnxm: '承诺项目-计量采集', cnxmms: '采集终端轮换及计量箱改造' }
]

// 覆盖"无数据"分支：空串单元格页面格式化后展示 '-'
const EMPTY_VALUES: Record<string, string> = {
  MBZ: '',
  MBZ_JYL: '',
  DFJ: '',
  DFJ_JYL: '',
  LXZ: '',
  WCZ: '',
  WCL: ''
}

// 明细叶子行的确定性取值：完成率 60%~90%，其余为四位小数金额
const makeDetailValues = (seed: number) => {
  const mbz = ((seed % 7) + 2) * 268.3742
  const wcz = (mbz * ((seed % 4) + 6)) / 10
  return {
    MBZ: toFixed4(mbz),
    PHMBZ: toFixed4(mbz),
    MBZ_JYL: String((seed % 5) + 2),
    DFJ: toFixed4(mbz * 0.9),
    DFJ_JYL: String((seed % 4) + 2),
    LXZ: toFixed4(wcz * 1.2),
    WCZ: toFixed4(wcz),
    WCL: toFixed4((wcz / mbz) * 100)
  }
}

const sumNumberField = (rows: Record<string, any>[], field: string) =>
  rows.reduce((sum, row) => {
    const value = row[field]
    const num = value === '' || value === undefined || value === null ? NaN : Number(value)
    return Number.isFinite(num) ? sum + num : sum
  }, 0)

// 汇总节点取子行合计；完成率按 Σ完成值/Σ目标值 重算
const buildGroupValues = (rows: Record<string, any>[]) => {
  const mbz = sumNumberField(rows, 'MBZ')
  const wcz = sumNumberField(rows, 'WCZ')
  return {
    MBZ: toFixed4(mbz),
    PHMBZ: toFixed4(mbz),
    MBZ_JYL: String(sumNumberField(rows, 'MBZ_JYL')),
    DFJ: toFixed4(sumNumberField(rows, 'DFJ')),
    DFJ_JYL: String(sumNumberField(rows, 'DFJ_JYL')),
    LXZ: toFixed4(sumNumberField(rows, 'LXZ')),
    WCZ: toFixed4(wcz),
    WCL: mbz > 0 ? toFixed4((wcz / mbz) * 100) : ''
  }
}

const makeGroupRow = (id: string, parentId: string, name: string): MockTreeNode => ({ id, parentId, name, leaf: '0' })

const makeDetailRow = (id: string, parentId: string, name: string, styleIndex: number, empty = false): MockTreeNode => ({
  id,
  parentId,
  name,
  leaf: '1',
  values: empty ? EMPTY_VALUES : undefined,
  detailFields: DETAIL_STYLES[styleIndex % DETAIL_STYLES.length]
})

// 依 parentId 建索引并自上而下组装，聚合节点数值取子行合计；返回 parentId → 行数组
const buildRowSet = (nodes: MockTreeNode[], rootIds: string[]) => {
  const childrenMap: Record<string, MockTreeNode[]> = nodes.reduce((map, node) => {
    if (!map[node.parentId]) map[node.parentId] = []
    map[node.parentId].push(node)
    return map
  }, {} as Record<string, MockTreeNode[]>)

  const rowSet: Record<string, Record<string, any>[]> = {}

  const buildLevel = (parentId: string): Record<string, any>[] =>
    (childrenMap[parentId] || []).map((node) => {
      const children = childrenMap[node.id] ? buildLevel(node.id) : []
      const values = node.values || (children.length ? buildGroupValues(children) : makeDetailValues(hashSeed(node.id)))
      const row: Record<string, any> = {
        id: node.id,
        parentId: node.parentId,
        name: node.name,
        leaf: node.leaf,
        ...values,
        ...(node.detailFields || {})
      }
      rowSet[parentId] = rowSet[parentId] || []
      rowSet[parentId].push(row)
      return row
    })

  rootIds.forEach((parentId) => buildLevel(parentId))
  return rowSet
}

// 预安排（xmYapMbz/getData）：根节点 parentId 固定 '-1'，按项目类别 → 项目包 → 承诺项目组织
const YAP_ROW_SET = buildRowSet(
  [
    makeGroupRow('YAP-CAT-JJ', '-1', '电网基建预安排'),
    makeGroupRow('YAP-JJ-PKG-01', 'YAP-CAT-JJ', '迎峰度夏主网加强项目包'),
    makeDetailRow('YAP-JJ-PKG-01-L1', 'YAP-JJ-PKG-01', '麒麟湾开关站增容工程', 0),
    makeDetailRow('YAP-JJ-PKG-01-L2', 'YAP-JJ-PKG-01', '220千伏吴中输变电工程', 1),
    makeDetailRow('YAP-JJ-PKG-01-L3', 'YAP-JJ-PKG-01', '110千伏昆山变间隔扩建工程', 2),
    makeGroupRow('YAP-JJ-PKG-02', 'YAP-CAT-JJ', '跨区电网互济项目包'),
    makeDetailRow('YAP-JJ-PKG-02-L1', 'YAP-JJ-PKG-02', '姑苏电网联络线加强工程', 3),
    makeDetailRow('YAP-JJ-PKG-02-L2', 'YAP-JJ-PKG-02', '余山至太仓线路工程', 1),
    makeGroupRow('YAP-CAT-JG', '-1', '生产技改预安排'),
    makeGroupRow('YAP-JG-PKG-01', 'YAP-CAT-JG', '主设备技术改造项目包'),
    makeDetailRow('YAP-JG-PKG-01-L1', 'YAP-JG-PKG-01', '变电所二次保护更换技改', 4),
    makeDetailRow('YAP-JG-PKG-01-L2', 'YAP-JG-PKG-01', '开关柜无油化改造技改', 2),
    makeDetailRow('YAP-JG-PKG-01-L3', 'YAP-JG-PKG-01', '主变风冷系统改造技改', 0),
    makeGroupRow('YAP-CAT-YX', '-1', '营销专项预安排'),
    makeGroupRow('YAP-YX-PKG-01', 'YAP-CAT-YX', '用电采集计量项目包'),
    makeDetailRow('YAP-YX-PKG-01-L1', 'YAP-YX-PKG-01', '采集终端轮换工程', 5),
    makeDetailRow('YAP-YX-PKG-01-L2', 'YAP-YX-PKG-01', '计量箱防窃电改造（未开工）', 5, true)
  ],
  ['-1']
)

// 预算执行一览（budgetStatistics/getDataListByDw）：根节点 parentId 为当前年度（任意四位年份均回应当前数据集）
const LB_ROW_SET = buildRowSet(
  [
    makeGroupRow('LB-XMLB-01', 'YEAR', '电网基建'),
    makeGroupRow('LB-JJ-01', 'LB-XMLB-01', '输变电基建项目包'),
    makeDetailRow('LB-JJ-01-L1', 'LB-JJ-01', '110千伏昆山变增容工程', 0),
    makeDetailRow('LB-JJ-01-L2', 'LB-JJ-01', '220千伏吴中输变电工程', 1),
    makeDetailRow('LB-JJ-01-L3', 'LB-JJ-01', '35千伏城南开关站新建工程', 2),
    makeGroupRow('LB-JJ-02', 'LB-XMLB-01', '配网建设与改造项目包'),
    makeDetailRow('LB-JJ-02-L1', 'LB-JJ-02', '10千伏配网自动化改造工程', 3),
    makeDetailRow('LB-JJ-02-L2', 'LB-JJ-02', '低压台区综合治理工程', 4),
    makeGroupRow('LB-XMLB-02', 'YEAR', '生产技改'),
    makeGroupRow('LB-JG-01', 'LB-XMLB-02', '生产设备技改项目包'),
    makeDetailRow('LB-JG-01-L1', 'LB-JG-01', '变电所二次保护更换技改', 4),
    makeDetailRow('LB-JG-01-L2', 'LB-JG-01', '主变风冷系统改造技改', 0),
    makeDetailRow('LB-JG-01-L3', 'LB-JG-01', '站用变直流系统改造技改', 2),
    makeGroupRow('LB-XMLB-03', 'YEAR', '营销专项'),
    makeGroupRow('LB-YX-01', 'LB-XMLB-03', '营销专项项目包'),
    makeDetailRow('LB-YX-01-L1', 'LB-YX-01', '采集终端轮换工程', 5),
    makeDetailRow('LB-YX-01-L2', 'LB-YX-01', '计量箱防窃电改造（未开工）', 5, true)
  ],
  ['YEAR']
)

// 同比环比：浅层树即可演示弹窗树表（根节点兼容一览的年度与预安排的 '-1'）
const TBHB_ROW_SET = buildRowSet(
  [
    makeGroupRow('TBHB-01', 'ROOT', '电网基建'),
    makeDetailRow('TBHB-01-L1', 'TBHB-01', '110千伏昆山变增容工程', 0),
    makeDetailRow('TBHB-01-L2', 'TBHB-01', '220千伏吴中输变电工程', 1),
    makeGroupRow('TBHB-02', 'ROOT', '生产技改'),
    makeDetailRow('TBHB-02-L1', 'TBHB-02', '变电所二次保护更换技改', 4),
    makeDetailRow('TBHB-02-L2', 'TBHB-02', '开关柜无油化改造技改', 2),
    makeGroupRow('TBHB-03', 'ROOT', '营销专项'),
    makeDetailRow('TBHB-03-L1', 'TBHB-03', '采集终端轮换工程', 5)
  ],
  ['ROOT']
)

// 在基础行上追加同比/环比字段：本期 / 上年同期(TQ) / 同比增长率(TB_WCL) / 上期(SQ) / 环比增长率(HB_WCL)
const decorateTbhbRows = (rows: Record<string, any>[]) =>
  rows.map((row) => ({
    ...row,
    ...DEFAULT_INDICATORS.reduce((acc, code) => {
      const current = Number(row[code])
      if (!Number.isFinite(current)) return acc
      const prevYear = current * 0.82
      const prev = current * 0.91
      acc[`${code}_BQ`] = toFixed4(current)
      acc[`${code}_TQ`] = toFixed4(prevYear)
      acc[`${code}_TB_WCL`] = toFixed4(((current - prevYear) / prevYear) * 100)
      acc[`${code}_SQ`] = toFixed4(prev)
      acc[`${code}_HB_WCL`] = toFixed4(((current - prev) / prev) * 100)
      return acc
    }, {} as Record<string, string>)
  }))

const TBHB_DECORATED_ROW_SET: Record<string, Record<string, any>[]> = Object.keys(TBHB_ROW_SET).reduce((result, key) => {
  result[key] = decorateTbhbRows(TBHB_ROW_SET[key] || [])
  return result
}, {} as Record<string, Record<string, any>[]>)

// ==================== 单位选择树（DwSelect） ====================

interface DwNode {
  code: string
  id: string
  leaf: boolean
  leafString: string | null
  name: string
  nodeType: string
  parentId: string
}

const DW_NODES: DwNode[] = [
  { code: 'DW001', id: 'DW001', name: '国网江苏省电力有限公司', nodeType: '1', leaf: false, leafString: null, parentId: '-1' },
  { code: 'DW00101', id: 'DW00101', name: '国网南京供电公司', nodeType: '2', leaf: false, leafString: null, parentId: 'DW001' },
  { code: 'DW00102', id: 'DW00102', name: '国网苏州供电公司', nodeType: '2', leaf: false, leafString: null, parentId: 'DW001' },
  { code: 'DW0010101', id: 'DW0010101', name: '项目管理中心', nodeType: '3', leaf: true, leafString: '1', parentId: 'DW00101' },
  { code: 'DW0010102', id: 'DW0010102', name: '运维检修部', nodeType: '3', leaf: true, leafString: '1', parentId: 'DW00101' },
  { code: 'DW0010201', id: 'DW0010201', name: '建设管理部', nodeType: '3', leaf: true, leafString: '1', parentId: 'DW00102' },
  { code: 'DW0010202', id: 'DW0010202', name: '数字化工作部', nodeType: '3', leaf: true, leafString: '1', parentId: 'DW00102' }
]

// ==================== 页面初始化（userDialog 链路） ====================

// 一览页在 budgetExecutionAnalysis/yszxylb 路由下，预安排页按组件名收窄，均不误伤既有模块的同 URL mock
const PAGE_MENU_RE = /sys\/menu\/getMenuByUrl\?[^#]*(customyapprojectexecutionbytype|executionanalysis(?:\/|%2F)yszxylb)/i

Mock.mock(PAGE_MENU_RE, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  const isYap = url.toLowerCase().includes('customyapprojectexecutionbytype')
  return success({ id: isYap ? MENU_ID_YAP : MENU_ID_LB, outsideMenu: isYap ? BUSICODE_YAP : BUSICODE_LB, url })
})

Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=(?:${BUSICODE_YAP}|${BUSICODE_LB})(?:&|$)`), 'get', (options: MockOptions) => {
  const busicode = getQueryValue(options.url, 'busicode')
  // 返回裸数组：单角色时 userDialog 自动进入页面
  return [
    {
      id: `sprole-${busicode}`,
      name: busicode === BUSICODE_YAP ? '自定义预安排项目执行分析（Mock）' : '预算执行一览（Mock）',
      code: `${busicode}-QUERY`,
      role_id: `role-${busicode}`,
      specialorgid: `BM-${busicode}`,
      org_id: 'DW001',
      org_name: '国网江苏省电力有限公司'
    }
  ]
})

Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?[^#]*menuCode=(?:${BUSICODE_YAP}|${BUSICODE_LB})(?:&|$)`), 'get', () =>
  success(['EXPAND', 'EXPORT', 'TB', 'HB'])
)

// ==================== 下拉数据 ====================

Mock.mock(/budgetStatisticsConfig\/getIndicatorByBusiType\?/, 'get', (options: MockOptions) => {
  const busiType = getQueryValue(options.url, 'busiType')
  const codes = INDICATORS_BY_BUSI_TYPE[busiType]
  if (!codes) return success([])
  return success(codes.map((code) => ({ code, name: INDICATOR_NAMES[code] || code })))
})

// 其余 busiType 维度的兜底项目类别树；YSZXYL 家族（配置页左树 / 一览 / 报表下拉）
// 已由 budgetStatisticsConfig 模块的动态配置树接管（该模块注册在本模块之前，优先命中）
Mock.mock(/budgetStatisticsConfig\/getNodeTree\?/, 'get', () => success(clone(XMLB_TREE)))

Mock.mock(/process40\/getProTypeTreeNode(\?.*)?$/, 'post', () => success(clone(PRO_TYPE_TREE)))

// DwSelect 懒加载单位树（根节点 -1 展开省公司 → 地市 → 部门）
Mock.mock(/bizOrgTree\/getBizOrgXzTree\?/, 'get', (options: MockOptions) => {
  const parentId = getQueryValue(options.url, 'parentId') || '-1'
  return success(clone(DW_NODES.filter((node) => node.parentId === parentId)))
})

// ==================== 主表格 ====================

Mock.mock(/budgetStatistics\/getDynamicColumnByDw(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(buildDynamicColumns(pickIndicators(body.indicators, INDICATORS_BY_BUSI_TYPE[body.busiType])))
})

Mock.mock(/budgetStatistics\/getDataListByDw(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const parentId = String(body.parentId ?? '')
  // 根节点按任意四位年度取数（页面切年度后仍可展示），其余按行 id 取子节点
  const key = /^\d{4}$/.test(parentId) ? 'YEAR' : parentId
  return success(clone(LB_ROW_SET[key] || []))
})

Mock.mock(/xmYapMbz\/getData(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const parentId = String(body.parentId ?? '-1')
  return success(clone(YAP_ROW_SET[parentId] || []))
})

// ==================== 同比环比弹窗 ====================

Mock.mock(/budgetStatics\/tbhb\/getDynamicColumn(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(buildTbhbColumns(pickIndicators(body.indicators), String(body.searchType || '1')))
})

Mock.mock(/budgetStatics\/tbhb\/yap\/getDataList(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const parentId = String(body.parentId ?? '-1')
  const key = parentId === '-1' || /^\d{4}$/.test(parentId) ? 'ROOT' : parentId
  return success(clone(TBHB_DECORATED_ROW_SET[key] || []))
})

Mock.mock(/budgetStatics\/tbhb\/getDataList(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const parentId = String(body.parentId ?? '')
  const key = parentId === '-1' || /^\d{4}$/.test(parentId) ? 'ROOT' : parentId
  return success(clone(TBHB_DECORATED_ROW_SET[key] || []))
})

// ==================== 帮助弹窗 ====================

const HELP_INFO = [
  '**预算执行分析（Mock 演示环境）**',
  '',
  '1. 展示维度决定指标项与表格动态列；切换维度后重新查询。',
  '2. 指标项多选控制数值列的展示范围，数据均可在小数位数下拉中切换精度。',
  '3. 单击树表箭头逐层加载，或使用「一键展开」按层级铺开；导出按钮生成带表头分组的 Excel。',
  '4. 同比 / 环比按钮在弹窗中对比本期与上期（上年同期）数据。',
  '5. 本页数据为 mock 演示数据，仅开发环境生效。'
].join('\n')

Mock.mock(new RegExp(`sys/menuConfig/getConfigByMenuId\\?[^#]*menuId=(?:${MENU_ID_YAP}|${MENU_ID_LB})(?:&|$)`), 'get', () =>
  success({ status: '1', helpInfo: HELP_INFO })
)

Mock.mock(new RegExp(`sys/menuConfig/listFj\\?[^#]*menuId=(?:${MENU_ID_YAP}|${MENU_ID_LB})(?:&|$)`), 'get', () =>
  success([{ fjmc: '预算执行分析操作手册（Mock）.pdf', uuid: 'help-yszx-analysis-pdf' }])
)

Mock.mock(/sys\/menuConfig\/downloadFj\?[^#]*uuid=help-yszx-analysis-pdf/, 'get', () =>
  binaryResponse(new Blob(['预算执行分析操作手册（Mock 占位内容）'], { type: 'application/pdf' }), {
    fileName: '预算执行分析操作手册（Mock）.pdf'
  })
)
