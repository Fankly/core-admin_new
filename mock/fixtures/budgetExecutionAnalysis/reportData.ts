import Decimal from 'decimal.js'
import { BUDGET_EXPORT_CASES, BudgetMockValues } from './exportValues'

// 对照 project-process/renren-admin 的 IndicatorEnum、DwUtil、
// BudgetStatisticsExtService、XmmbzYapExtService 和 BudgetStatisticsConfigMapper。
// 固定使用扩展版（两个 YSZXYL_START_* 参数为 2），不依赖前端的公式实现。
export const BUDGET_INDICATOR_NAMES: Record<string, string> = {
  MBZ: '目标值',
  PHMBZ: '平衡目标值',
  MBZ_NEW: '年度目标值',
  DFJ: '待分解',
  NDDFJ: '年度待分解',
  LXZ: '立项值',
  WCZ: '完成值',
  WCL: '完成率（%）',
  PHTZFD: '平衡调整幅度',
  YFJ: '已分解',
  XMSL: '立项数量（个）',
  GBSL: '关闭数量（个）',
  LXL: '立项率（%）',
  GBL: '关闭率（%）',
  YKGXMSL: '已开工项目数量（个）',
  YZTBXMSL: '已招投标项目数量（个）',
  HTQDXMSL: '合同签订项目数量（个）',
  XMZBL: '项目招标率（%）',
  XMHTQDL: '项目合同签订率（%）',
  XMKGL: '项目开工率（%）',
  JYL: '结余率（%）'
}
export const DEFAULT_BUDGET_INDICATORS = Object.keys(BUDGET_INDICATOR_NAMES)
export const BUDGET_OPTIONAL_COLUMNS = { gkbm: '归口部门', ysly: '预算来源', cnxm: '承诺项', cnxmms: '综合计划分类' }

export interface BudgetMockConfig {
  configId: number
  parentId: string
  configName: string
  isleaf: string
  recState: string
  isDisplay: string
  statMethod: string
  dispOrder: number
  subName: string
  sfjc: string
  gkbm: string
  ysly: string
  cnxm: string
  cnxmms: string
}
export interface BudgetMockSnapshot {
  configs: BudgetMockConfig[]
  targets: Record<string, string[]>
}
export interface BudgetMockParams {
  busiType?: string
  parentId?: string | number
  indicators?: string
  dwList?: Array<{ code: string; nodeType: string }>
  xmlbIds?: string
  kxpzLists?: string[]
  ysnd?: string
  startDate?: string
  searchType?: string
}

export const budgetField = (unit: string, code: string, period?: string) => `ORGID_${unit};${period ? `${period};` : ''}INDICATORID_${code}`
export const budgetMockYear = (params: BudgetMockParams) => String(params.ysnd || params.startDate?.split('-')[0] || new Date().getFullYear())
export const pickBudgetIndicators = (value?: string) =>
  value ? [...new Set(value.split(',').filter((code) => code in BUDGET_INDICATOR_NAMES))] : [...DEFAULT_BUDGET_INDICATORS]

const PROVINCE_UNITS = [
  ['GSSX_SGS', '江苏省电力公司'],
  ['GSSX_MGS', '江苏省电力公司（母公司）'],
  ['GSSX_JGBB', '机关本部'],
  ['GSSX_GDGS', '供电公司'],
  ['GSSX_ZSDW', '直属单位（分公司）'],
  ['GSSX_ZGS', '直属单位（子公司）']
]
const UNIT_NAMES: Record<string, string> = {
  DW00101: '南京供电公司',
  DW00102: '苏州供电公司',
  DW0010101: '项目管理中心',
  DW0010102: '运维检修部',
  DW0010201: '建设管理部',
  DW0010202: '数字化工作部',
  ...Object.fromEntries(PROVINCE_UNITS)
}
export const resolveBudgetMockUnits = (params: BudgetMockParams) => {
  const selected = params.dwList || []
  const departments = selected.filter((unit) => unit.nodeType === 'BM')
  const companies = selected.filter((unit) => ['CITY', 'COUNTY', 'ZSDW'].includes(unit.nodeType))
  const unitType = departments.length ? 'BM' : companies.length ? 'DW' : 'SGS'
  const units = unitType === 'BM' ? departments : unitType === 'DW' ? companies : PROVINCE_UNITS.map(([code]) => ({ code, nodeType: code }))
  const mixedLevels = companies.some((unit) => unit.nodeType === 'COUNTY') && companies.some((unit) => unit.nodeType !== 'COUNTY')
  const hasTotal = units.length > 1 && (unitType === 'BM' || (unitType === 'DW' && !mixedLevels))
  return { unitType, units, hasTotal }
}

const dependencies: Record<string, string[]> = {
  WCL: ['MBZ', 'WCZ'],
  LXL: ['MBZ', 'LXZ'],
  PHTZFD: ['PHMBZ', 'DFJ', 'NDDFJ', 'MBZ_NEW'],
  YFJ: ['MBZ_NEW', 'DFJ'],
  GBL: ['GBSL', 'XMSL'],
  XMZBL: ['XMSL', 'YZTBXMSL'],
  XMHTQDL: ['XMSL', 'HTQDXMSL'],
  XMKGL: ['XMSL', 'YKGXMSL']
}
const expandIndicators = (codes: string[]) => [...new Set([...codes, ...codes.flatMap((code) => dependencies[code] || [])])]
const number = (value: unknown) => new Decimal(value == null || value === '' ? 0 : String(value))
const sum = (rows: BudgetMockValues[], code: string) => rows.reduce((total, row) => total.add(number(row[code])), new Decimal(0)).toString()
// 扩展版后端保留母公司预算源，对完成值、立项值和数量等汇总机关本部、供电公司、分公司。
const applyProvinceAggregates = (values: Map<string, BudgetMockValues>, codes: string[], reportType: 'budget' | 'yap') => {
  const mother = values.get('GSSX_MGS')!
  const province = values.get('GSSX_SGS')!
  const subsidiary = values.get('GSSX_ZGS')!
  const components = ['GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW'].map((unit) => values.get(unit)!)
  const additive = ['LXZ', 'WCZ', 'XMSL', 'GBSL', 'YKGXMSL', 'YZTBXMSL', 'HTQDXMSL', 'ZFWHTJE', 'ZWZHTJE', 'ZFWZBJE', 'ZWZZBJE']
  if (reportType === 'budget') additive.push('YGBXMSFYS')
  for (const code of codes) {
    if (['MBZ', 'PHMBZ', 'DFJ', 'MBZ_NEW', 'NDDFJ'].includes(code)) province[code] = sum([mother, subsidiary], code)
    else if (additive.includes(code)) {
      mother[code] = sum(components, code)
      province[code] = sum([...components, subsidiary], code)
    }
  }
}
const ratio = (values: BudgetMockValues, numerator: string, denominator: string, multiplier = 100) => {
  const divisor = number(values[denominator])
  return divisor.isZero() ? 0 : number(values[numerator]).mul(multiplier).div(divisor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}
const calculate = (values: BudgetMockValues, reportType: 'budget' | 'yap', unitType: string, codes: string[], total = false) => {
  const result = { ...values }
  const canCompute = total || unitType !== 'BM'
  const target = total || (reportType === 'yap' && unitType === 'DW') ? 'PHMBZ' : 'MBZ'
  if (codes.includes('WCL') && (canCompute || reportType === 'budget')) result.WCL = ratio(values, 'WCZ', target, total ? 1 : 100)
  if (codes.includes('LXL') && (canCompute || reportType === 'budget')) result.LXL = ratio(values, 'LXZ', target, total ? 1 : 100)
  if (canCompute) {
    if (codes.includes('PHTZFD'))
      result.PHTZFD = total
        ? number(values.MBZ_NEW).sub(number(values.PHMBZ)).toString()
        : reportType === 'budget' && unitType === 'SGS'
        ? number(values.PHMBZ).sub(number(values.MBZ_NEW)).add(number(values.NDDFJ)).toString()
        : number(values.MBZ_NEW).sub(number(values.PHMBZ)).sub(number(values.DFJ)).toString()
    if (codes.includes('YFJ')) result.YFJ = number(values.MBZ_NEW).sub(number(values.DFJ)).toString()
    for (const [code, numerator] of Object.entries({ GBL: 'GBSL', XMZBL: 'YZTBXMSL', XMHTQDL: 'HTQDXMSL', XMKGL: 'YKGXMSL' })) {
      if (codes.includes(code)) result[code] = ratio(values, numerator, 'XMSL', total && code === 'GBL' ? 1 : 100)
    }
  }
  return result
}

const caseFor = (config: BudgetMockConfig) => BUDGET_EXPORT_CASES.find((item) => item.name === config.configName)
const leafValues = (config: BudgetMockConfig, unit: string, periodFactor: number): BudgetMockValues => {
  const fixture = caseFor(config)
  const values: BudgetMockValues = {
    MBZ: '1234.567891',
    PHMBZ: '1500.123456',
    MBZ_NEW: '1800.654321',
    DFJ: '50.123456',
    NDDFJ: '30.123456',
    WCZ: '321.123456',
    LXZ: '800.234567',
    XMSL: 10,
    GBSL: 2,
    YKGXMSL: 6,
    YZTBXMSL: 8,
    HTQDXMSL: 5,
    JYL: '12.345678',
    ...fixture?.values
  }
  const unitFactor =
    unit === 'DW00101' ? 1 : unit === 'DW00102' ? 2 : (Array.from(unit).reduce((value, char) => value + char.charCodeAt(0), 0) % 4) + 1
  return Object.fromEntries(
    Object.entries(values).map(([code, value]) => [
      code,
      fixture && 'empty' in fixture
        ? fixture.empty
        : value == null || value === ''
        ? value
        : number(value)
            .mul(unitFactor)
            .mul(['WCZ', 'LXZ'].includes(code) ? periodFactor : 1)
            .toString()
    ])
  )
}

// START WITH 配置节点，统计启用的叶子；显示状态与 xmlbIds 只控制返回哪些行。
export const buildBudgetMockRows = (params: BudgetMockParams, reportType: 'budget' | 'yap', snapshot: BudgetMockSnapshot, periodFactor = 1) => {
  const { configs, targets } = snapshot
  const byId = new Map(configs.map((config) => [String(config.configId), config]))
  const children = (id: string) => configs.filter((config) => config.parentId === id)
  const leaves = (id: string, statMethod: string, visited = new Set<string>()): BudgetMockConfig[] => {
    const config = byId.get(id)
    if (!config || visited.has(id)) return []
    if (config.isleaf === '1') return config.recState === '1' && config.statMethod === statMethod ? [config] : []
    return children(id).flatMap((child) => leaves(String(child.configId), statMethod, new Set(visited).add(id)))
  }
  const codes = expandIndicators(pickBudgetIndicators(params.indicators))
  const { units, unitType, hasTotal } = resolveBudgetMockUnits(params)
  const year = budgetMockYear(params)
  const parentId = ['-1', '0', ''].includes(String(params.parentId ?? '')) ? year : String(params.parentId)
  const visibleIds = new Set<string>()
  for (const id of (params.xmlbIds || '').split(',').filter(Boolean)) {
    let current = byId.get(id)
    while (current && !visibleIds.has(String(current.configId))) {
      visibleIds.add(String(current.configId))
      current = byId.get(current.parentId)
    }
  }
  return children(parentId)
    .filter((config) => config.recState === '1' && config.isDisplay !== '0' && (!params.xmlbIds || visibleIds.has(String(config.configId))))
    .sort((a, b) => a.dispOrder - b.dispOrder)
    .map((config) => {
      const id = String(config.configId)
      const bindings = [
        ...leaves(id, '1'),
        ...leaves(id, '2').flatMap((summary) => [...new Set(targets[String(summary.configId)] || [])].flatMap((target) => leaves(target, '1')))
      ]
      const row: Record<string, any> = {
        id: config.configId,
        parentId: config.parentId,
        name: config.configName,
        leaf: config.isleaf,
        sfjc: config.sfjc,
        subName: config.subName,
        gkbm: config.gkbm,
        ysly: config.ysly,
        cnxm: config.cnxm,
        cnxmms: config.cnxmms
      }
      const aggregates = new Map(
        units.map(({ code }) => {
          const inputs = bindings.map((binding) => leafValues(binding, code, periodFactor))
          const aggregate =
            config.isleaf === '1' && config.statMethod === '1'
              ? Object.fromEntries(Object.entries(inputs[0] || {}).filter(([indicator]) => codes.includes(indicator)))
              : Object.fromEntries(codes.map((indicator) => [indicator, sum(inputs, indicator)]))
          return [code, aggregate]
        })
      )
      if (unitType === 'SGS') applyProvinceAggregates(aggregates, codes, reportType)
      const unitValues = units.map(({ code }) => {
        const values = calculate(aggregates.get(code)!, reportType, unitType, codes)
        const fixture = caseFor(config)
        // 边界用例模拟原始响应中的空指标，正常节点仍按后端口径计算。
        for (const indicator of codes) {
          if (fixture && 'empty' in fixture) values[indicator] = fixture.empty
          else if (
            fixture &&
            Object.prototype.hasOwnProperty.call(fixture.values, indicator) &&
            (fixture.values[indicator] == null || fixture.values[indicator] === '')
          )
            values[indicator] = fixture.values[indicator]
          // 故意模拟母公司/省公司汇总漏算或旧值，校验前端按完整分组重算。
          if (fixture && 'aggregateOverride' in fixture && ['GSSX_MGS', 'GSSX_SGS'].includes(code) && ['WCZ', 'LXZ'].includes(indicator)) {
            values[indicator] = fixture.aggregateOverride
          }
          row[budgetField(code, indicator)] = values[indicator] ?? (Object.prototype.hasOwnProperty.call(values, indicator) ? null : undefined)
        }
        return values
      })
      if (hasTotal) {
        const totalValues = calculate(Object.fromEntries(codes.map((code) => [code, sum(unitValues, code)])), reportType, unitType, codes, true)
        codes.forEach((code) => {
          row[budgetField('total', code)] = totalValues[code]
        })
      }
      return row
    })
}

const column = (field: string, title: string, visible = true, width = 140) => ({
  field,
  title,
  visible,
  width,
  edit: false,
  needFormat: false,
  children: []
})
export const buildBudgetMockColumns = (params: BudgetMockParams, comparison = false) => {
  const indicators = pickBudgetIndicators(comparison ? 'MBZ,WCZ,WCL' : params.indicators)
  const { units, hasTotal } = resolveBudgetMockUnits(params)
  const columns: any[] = [
    column('id', 'id', false),
    column('parentId', 'parentId', false),
    column('leaf', 'leaf', false),
    column('subName', '序号', true, 80),
    column('name', '项目类别', true, 320)
  ]
  for (const field of params.kxpzLists || []) {
    if (field in BUDGET_OPTIONAL_COLUMNS) columns.push(column(field, BUDGET_OPTIONAL_COLUMNS[field as keyof typeof BUDGET_OPTIONAL_COLUMNS]))
  }
  for (const { code } of [...(hasTotal ? [{ code: 'total' }] : []), ...units]) {
    const children = comparison
      ? [
          ...['CURRENT', 'LAST'].map((period) => ({
            field: `${code}_${period}`,
            title: period === 'CURRENT' ? '本月合计' : params.searchType === '2' ? '上月合计' : '上年同期',
            visible: true,
            children: indicators.map((indicator) => column(budgetField(code, indicator, period), BUDGET_INDICATOR_NAMES[indicator]))
          })),
          column(budgetField(code, 'TBHBJE'), params.searchType === '2' ? '环比金额' : '同比金额'),
          column(budgetField(code, 'TBHBL'), params.searchType === '2' ? '环比比率' : '同比比率')
        ]
      : indicators.map((indicator) => column(budgetField(code, indicator), BUDGET_INDICATOR_NAMES[indicator]))
    columns.push({ field: code, title: code === 'total' ? '合计' : UNIT_NAMES[code] || code, visible: true, children })
  }
  return columns
}

export const buildBudgetComparisonMockRows = (params: BudgetMockParams, reportType: 'budget' | 'yap', snapshot: BudgetMockSnapshot) => {
  // BudgetStaticsTbHbService 覆盖主表指标选择，固定查询目标值、完成值、完成率。
  const comparisonParams = { ...params, indicators: 'MBZ,WCZ,WCL' }
  const current = buildBudgetMockRows(comparisonParams, reportType, snapshot)
  const previous = buildBudgetMockRows(comparisonParams, reportType, snapshot, params.searchType === '2' ? 0.91 : 0.82)
  return current.map((row, index) => {
    const result = { ...row }
    Object.keys(row)
      .filter((field) => field.startsWith('ORGID_'))
      .forEach((field) => {
        result[field.replace(';', ';CURRENT;')] = row[field]
        result[field.replace(';', ';LAST;')] = previous[index][field]
        const code = field.split(';INDICATORID_')[1]
        if (['WCZ', 'WCL'].includes(code)) {
          const missing = [row[field], previous[index][field]].some((value) => value == null || value === '')
          result[field.replace(/;INDICATORID_.+$/, `;INDICATORID_${code === 'WCZ' ? 'TBHBJE' : 'TBHBL'}`)] = missing
            ? null
            : number(row[field]).sub(number(previous[index][field])).toString()
        }
      })
    return result
  })
}
