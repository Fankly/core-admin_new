import ExcelJS from 'exceljs'
import Mock from 'mockjs'
import { binaryResponse, fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

/**
 * 物料价格库页（/ai/materialPriceLibrary/index）mock：覆盖该页 5 个 tab 的全部接口。
 *
 * | tab                  | 接口来源                          |
 * | -------------------- | --------------------------------- |
 * | historyPriceSummary  | material-price-history/getPageNew / getPageDetail / exportDataNew |
 * | historyPrice         | material-price-history/getPage / exportData / syncData            |
 * | xmMaterialRefPrice   | xm-material-ref-price/*（api/ai/xmMaterialRefPrice）              |
 * | materialPriceLibrary | material-price-library/*                                          |
 * | priceQuery           | gss/getGssMatWithPage / gss/exportGssMat（api/ai/priceQuery）      |
 *
 * 五个 tab 共用下面的 MATERIALS 主数据，因此「国网下发参考价 / 历史领用价 / 申报价」
 * 三个口径可以相互对照，正好是审核结论里价格偏差的依据。
 *
 * 权限入口只在父页 index.vue 注册一次：父页解析到角色后通过 sharedUserInfo 下传，
 * 各 tab 的 userDialog 由 v-if="!hasSharedPermission" 跳过，不会二次弹窗。
 *
 * 也供审核工作台正文中的价格跳转联调（openPopPage 新标签页，pop=true）：
 * .gwPriceView → tab=materialPriceLibrary（国网参考采购价格）
 * .materialNewestPriceView → tab=historyPrice（历史项目领用物料单价）
 */

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// 单价类型字典：historyPrice 搜索项 enum 走 getPublicData('AI_MAT_PRICE_HIS_TYPE_COM')
const UNIT_PRICE_TYPES = [
  { id: '1', code: '1', name: '移动加权平均价', sort: 1 },
  { id: '2', code: '2', name: '计划价', sort: 2 },
  { id: '3', code: '3', name: '协议库存价', sort: 3 },
  { id: '4', code: '4', name: '集中采购价', sort: 4 }
]

// ==================== 登录 / 按钮权限链路 ====================
// userDialog：getMenuByUrl → getRoleByBusicode → getButtonList → setPermissions
// 三者按判别值收窄，避免 mockjs 命中后其他页面的同名接口无法透传真实后端。
// 只在父页注册：各 tab 拿到 sharedUserInfo 后不再自行走这条链路。

/** 本页 outsideMenu / menuCode（开发态 mock 专用） */
const BUSICODE = 'AI-MATERIAL-PRICE-LIBRARY'

/** 帮助中心 / getMenuByUrl 返回的菜单 id */
const MENU_ID = 'menu-ai-material-price-library'

/** 按钮权限：xmMaterialRefPrice tab 的 v-permission，priceQuery tab 只用 EXPORT */
const BUTTONS = ['ADD', 'EDIT', 'DELETE', 'IMPORT', 'EXPORT']

/** 单位编码沿用 budgetChanges 的 UNITS，保证一/二级单位联动能出选项 */
const DW_ID = 'DW002'
const SP_ORG_ID = 'bm-mpl-01'

/** 本页角色（getRoleByBusicode 返回裸数组，字段对齐 userDialog changeId 的取值） */
const buildRole = () => ({
  id: 'sprole-mpl-01',
  name: '物料价格库管理员',
  code: 'SCWYSZZ',
  role_id: 'role-mpl-01',
  specialorgid: SP_ORG_ID,
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  org_id: DW_ID,
  org_name: '国网南京供电公司',
  namecode: 'mock_mpl_user',
  busicode: BUSICODE
})

// 菜单：只拦 url 含 materialPriceLibrary 的请求（返回 id 供 HelpModal 取帮助配置）
Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*materialPriceLibrary/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ id: MENU_ID, outsideMenu: BUSICODE, url })
})

// 角色：按 busicode 收窄；返回单角色，userDialog 自动确认，不弹选择框
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [buildRole()])

// 按钮权限：按 menuCode 收窄
Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success(clone(BUTTONS)))

// 帮助中心（RangeVxeTable 的 help 工具按钮 → HelpModal）：按本页 menuId 收窄
Mock.mock(new RegExp(`sys/menuConfig/getConfigByMenuId\\?[^#]*menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success({
    helpInfo:
      '物料价格库帮助：五个页签分别提供历史领用汇总（最新/最低/最高单价，点单价可穿透明细）、历史领用明细、国网公司价格库参考价（含税/除税）、国网下发参考采购价、历史项目申报价格，可按物料编码/描述检索并导出。',
    status: '1'
  })
)
Mock.mock(new RegExp(`sys/menuConfig/listFj\\?[^#]*menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success([{ fjmc: '物料价格库操作手册.pdf', uuid: 'help-mpl-pdf' }])
)
Mock.mock(/sys\/menuConfig\/downloadFj\?[^#]*uuid=help-mpl-pdf/, 'get', () =>
  binaryResponse(new Blob(['物料价格库操作手册（mock）'], { type: 'application/pdf' }), {
    fileName: '物料价格库操作手册.pdf'
  })
)

// ==================== 物料主数据 ====================

// 物料主数据：五个 tab 共用，便于与审核结论中的价格偏差结论相互对照
const MATERIALS = [
  {
    code: '500123401',
    desc: '柱上真空断路器 ZW32-12/630-20 户外',
    unit: '台',
    price: 12680,
    float: 0.1172,
    major: '一次设备',
    middle: '开关设备',
    minor: '柱上开关'
  },
  {
    code: '500123402',
    desc: '跌落式熔断器 RW12-12/200A',
    unit: '只',
    price: 268.5,
    float: 0.0342,
    major: '一次设备',
    middle: '开关设备',
    minor: '熔断器'
  },
  {
    code: '500123403',
    desc: '交联聚乙烯绝缘电缆 YJV22-8.7/15kV-3×240',
    unit: 'm',
    price: 486.2,
    float: -0.0215,
    major: '线缆材料',
    middle: '电力电缆',
    minor: '中压电缆'
  },
  {
    code: '500123404',
    desc: '油浸式配电变压器 S13-M-400/10',
    unit: '台',
    price: 58600,
    float: 0.0568,
    major: '一次设备',
    middle: '变压器',
    minor: '配电变压器'
  },
  {
    code: '500123405',
    desc: '环网柜 HXGN-12 四进四出',
    unit: '台',
    price: 74200,
    float: 0.082,
    major: '一次设备',
    middle: '成套设备',
    minor: '环网柜'
  },
  {
    code: '500123406',
    desc: '钢芯铝绞线 JL/G1A-240/30',
    unit: 'km',
    price: 42800,
    float: 0.0136,
    major: '线缆材料',
    middle: '架空导线',
    minor: '钢芯铝绞线'
  },
  {
    code: '500123407',
    desc: '复合绝缘子 FXBW4-10/70',
    unit: '只',
    price: 96.8,
    float: -0.0408,
    major: '金具绝缘子',
    middle: '绝缘子',
    minor: '复合绝缘子'
  },
  {
    code: '500123408',
    desc: '低压综合配电箱 JP-400/0.4kV',
    unit: '台',
    price: 8650,
    float: 0.0294,
    major: '一次设备',
    middle: '成套设备',
    minor: '低压配电箱'
  },
  {
    code: '500123409',
    desc: '预制混凝土电杆 φ190×12m 非预应力',
    unit: '根',
    price: 1420,
    float: 0.0075,
    major: '土建材料',
    middle: '杆塔',
    minor: '混凝土电杆'
  },
  {
    code: '500123410',
    desc: '防坠落装置 导轨式 不锈钢 12m',
    unit: '套',
    price: 3260,
    float: 0.1035,
    major: '金具绝缘子',
    middle: '安全器具',
    minor: '防坠落装置'
  },
  {
    code: '500123411',
    desc: '智能电能表 单相费控 5(60)A',
    unit: '只',
    price: 168.4,
    float: -0.0126,
    major: '二次设备',
    middle: '计量装置',
    minor: '智能电能表'
  },
  {
    code: '500123412',
    desc: '故障指示器 架空型 带通信模块',
    unit: '组',
    price: 2180,
    float: 0.0463,
    major: '二次设备',
    middle: '配电自动化',
    minor: '故障指示器'
  },
  {
    code: '500123413',
    desc: '接地电阻柜 10kV 中性点小电阻',
    unit: '面',
    price: 33500,
    float: 0.0208,
    major: '一次设备',
    middle: '成套设备',
    minor: '接地电阻柜'
  }
]

const PROJECTS = [
  {
    pspid: 'JS2026-LYG-0001',
    post1: '连云港输电运检中心220kV海蔷4917线等线路防坠落装置修理',
    xmbm: 'XM2026LYG0001',
    yjdw: 'DW002',
    ejdw: 'DW002-01',
    proType: 'PT03'
  },
  {
    pspid: 'JS2026-LYG-0002',
    post1: '连云港赣榆区10kV城头线配电线路绝缘化改造',
    xmbm: 'XM2026LYG0002',
    yjdw: 'DW002',
    ejdw: 'DW002-02',
    proType: 'PT02'
  },
  {
    pspid: 'JS2026-LYG-0003',
    post1: '连云港东海县110kV牛山变电站主变增容工程',
    xmbm: 'XM2026LYG0003',
    yjdw: 'DW003',
    ejdw: 'DW003-01',
    proType: 'PT01'
  }
]

const includesText = (value: unknown, keyword: unknown) => {
  const text = String(keyword ?? '').trim()
  if (!text) return true
  return String(value ?? '').includes(text)
}

const matchesList = (value: unknown, list: unknown) => {
  if (!Array.isArray(list) || !list.length) return true
  return list.some((item) => includesText(value, item))
}

const pad = (value: number, length = 3) => String(value).padStart(length, '0')

interface MockMaterialPriceRow extends Record<string, string | number> {
  id: string
  materialCode: string
  materialDescription: string
  measurementUnit: string
  purchasePrice: number
  priceFloatPercent: number
  updateDate: string
  updateTime: string
}

/** 国网参考采购价格：主数据一条一行，再按季度下发追加历史批次，凑出可翻页的数据量 */
const PRICE_LIBRARY_ROWS: MockMaterialPriceRow[] = MATERIALS.flatMap((material, index) => {
  const batches = [
    { date: '2026-07-01', time: '2026-07-01 08:30:00', ratio: 1 },
    { date: '2026-04-01', time: '2026-04-01 08:30:00', ratio: 0.968 }
  ]
  return batches.map((batch, batchIndex) => ({
    id: `mock-mpl-${pad(index * 2 + batchIndex + 1)}`,
    materialCode: material.code,
    materialDescription: material.desc,
    measurementUnit: material.unit,
    purchasePrice: Number((material.price * batch.ratio).toFixed(2)),
    priceFloatPercent: Number((material.float * batch.ratio).toFixed(4)),
    updateDate: batch.date,
    updateTime: batch.time
  }))
})

interface MockMaterialPriceHistoryRow extends Record<string, string | number> {
  id: string
  matnr: string
  maktx: string
  unitPriceType: string
  unitPriceTypeCode: string
  unitPrice: number
  menge: number
  unit: string
  pspid: string
  post1: string
  mblnr: string
  mjahr: string
  createTime: string
}

/**
 * 历史项目领用物料单价：每个项目领用主数据的一个子集，单价围绕参考价上下浮动。
 * 每个物料给 4 张凭证（2026 两张 / 2025 两张），这样 historyPriceSummary 的
 * 最新/最低/最高三个聚合口径才会落在不同凭证上，穿透明细也有多行可看。
 */
const PRICE_HISTORY_ROWS: MockMaterialPriceHistoryRow[] = PROJECTS.flatMap((project, projectIndex) =>
  MATERIALS.filter((_, index) => index % PROJECTS.length === projectIndex).flatMap((material, index) =>
    [0, 1, 2, 3].map((round) => {
      const seq = projectIndex * 100 + index * 10 + round + 1
      const type = UNIT_PRICE_TYPES[(projectIndex + index + round) % UNIT_PRICE_TYPES.length]
      // 浮动幅度按 round 拉开，保证同一物料的 4 张凭证单价互不相同
      const ratio = 1 + ((seq % 5) - 2) / 100 + (round - 1.5) / 50
      const year = round < 2 ? '2026' : '2025'
      const month = pad(((seq + round) % 12) + 1, 2)
      const day = pad(((seq * 7) % 26) + 2, 2)
      return {
        id: `mock-mph-${pad(seq, 4)}`,
        matnr: material.code,
        maktx: material.desc,
        unitPriceType: type.name,
        unitPriceTypeCode: type.code,
        unitPrice: Number((material.price * ratio).toFixed(2)),
        menge: Number((((seq % 9) + 1) * (material.price > 10000 ? 1 : 12)).toFixed(0)),
        unit: material.unit,
        pspid: project.pspid,
        post1: project.post1,
        mblnr: `49${pad(seq, 8)}`,
        mjahr: year,
        createTime: `${year}-${month}-${day}`
      }
    })
  )
)

const filterPriceLibraryRows = (params: Record<string, any>) =>
  PRICE_LIBRARY_ROWS.filter(
    (row) =>
      (Array.isArray(params.materialCodeList) && params.materialCodeList.length
        ? matchesList(row.materialCode, params.materialCodeList)
        : includesText(row.materialCode, params.materialCode)) && includesText(row.materialDescription, params.materialDescription)
  )

const filterPriceHistoryRows = (params: Record<string, any>) =>
  PRICE_HISTORY_ROWS.filter(
    (row) =>
      (Array.isArray(params.matnrList) && params.matnrList.length
        ? matchesList(row.matnr, params.matnrList)
        : includesText(row.matnr, params.matnr)) &&
      (Array.isArray(params.pspidList) && params.pspidList.length
        ? matchesList(row.pspid, params.pspidList)
        : includesText(row.pspid, params.pspid)) &&
      (Array.isArray(params.mblnrList) && params.mblnrList.length
        ? matchesList(row.mblnr, params.mblnrList)
        : includesText(row.mblnr, params.mblnr)) &&
      includesText(row.maktx, params.maktx) &&
      includesText(row.post1, params.post1) &&
      includesText(row.mjahr, params.mjahr) &&
      (!params.unitPriceType || [row.unitPriceTypeCode, row.unitPriceType].includes(String(params.unitPriceType)))
  )

// ==================== 历史项目领用物料汇总（getPageNew / getPageDetail / exportDataNew） ====================
// 按物料聚合 PRICE_HISTORY_ROWS：最新取 createTime 最大的凭证，最低/最高取 unitPrice 极值。
// 穿透明细（getPageDetail）按 unitPriceType 排序，使聚合值恰好落在第一行。

/** 单价类型：0 最新 / 1 最低 / 2 最高，与 PriceDetailDialog 的 unitPriceTypeMap 一致 */
const SUMMARY_TYPE_NAMES: Record<string, string> = { '0': '最新', '1': '最低', '2': '最高' }

const byCreateTimeDesc = (a: MockMaterialPriceHistoryRow, b: MockMaterialPriceHistoryRow) =>
  String(b.createTime).localeCompare(String(a.createTime)) || String(b.mblnr).localeCompare(String(a.mblnr))

const aggregateSummaryRows = (rows: MockMaterialPriceHistoryRow[]) => {
  const grouped = new Map<string, MockMaterialPriceHistoryRow[]>()
  rows.forEach((row) => {
    const list = grouped.get(row.matnr)
    if (list) list.push(row)
    else grouped.set(row.matnr, [row])
  })
  return [...grouped.entries()].map(([matnr, list], index) => {
    const prices = list.map((row) => Number(row.unitPrice))
    const newest = [...list].sort(byCreateTimeDesc)[0]
    return {
      id: `mock-mps-${pad(index + 1)}`,
      matnr,
      maktx: list[0].maktx,
      unit: list[0].unit,
      newestUnitPrice: Number(newest.unitPrice),
      minUnitPrice: Math.min(...prices),
      maxUnitPrice: Math.max(...prices)
    }
  })
}

/** 汇总页查询条件与明细页同源（matnr / maktx / pspid / post1），复用 filterPriceHistoryRows */
const filterSummaryRows = (params: Record<string, any>) => aggregateSummaryRows(filterPriceHistoryRows(params))

/** 穿透明细：取该物料全部凭证，按聚合口径排序后返回 */
const filterSummaryDetailRows = (params: Record<string, any>) => {
  const type = String(params.unitPriceType ?? '0')
  const rows = PRICE_HISTORY_ROWS.filter((row) => includesText(row.matnr, params.matnr)).map(({ unitPriceTypeCode, ...row }) => ({
    ...row,
    unitPriceType: SUMMARY_TYPE_NAMES[type] || '-'
  }))
  if (type === '1') return rows.sort((a, b) => Number(a.unitPrice) - Number(b.unitPrice))
  if (type === '2') return rows.sort((a, b) => Number(b.unitPrice) - Number(a.unitPrice))
  return rows.sort(byCreateTimeDesc as any)
}

// ==================== 国网公司价格库参考价（xm-material-ref-price） ====================
// 该 tab 支持增删改导入，故数据是可变的模块内状态（与 outsourceAdaptList 同模式）。

interface MockXmRefPriceRow extends Record<string, string> {
  id: string
  materialMajor: string
  materialMiddle: string
  materialMinor: string
  materialCode: string
  materialDesc: string
  unit: string
  priceExTax: string
  priceInTax: string
  createTime: string
}

let refPriceSeed = 0
const createRefPriceId = () => `mock-xmrp-${pad(++refPriceSeed)}`

/** 参考价按含税 = 国网下发采购价 * 1.02 构造，除税按 13% 税率反算，便于与另两个口径对照 */
const buildRefPriceRows = (): MockXmRefPriceRow[] =>
  MATERIALS.map((material, index) => {
    const priceInTax = Number((material.price * 1.02).toFixed(2))
    return {
      id: createRefPriceId(),
      materialMajor: material.major,
      materialMiddle: material.middle,
      materialMinor: material.minor,
      materialCode: material.code,
      materialDesc: material.desc,
      unit: material.unit,
      priceExTax: (priceInTax / 1.13).toFixed(2),
      priceInTax: priceInTax.toFixed(2),
      createTime: `2026-0${(index % 9) + 1}-${pad(((index * 3) % 27) + 1, 2)} 09:${pad((index * 7) % 60, 2)}:00`
    }
  })

let refPriceRows: MockXmRefPriceRow[] = buildRefPriceRows()

/** 大/中/小类与物料编码按后端 DTO 注释精确匹配，仅物料描述模糊匹配 */
const equalsText = (value: unknown, keyword: unknown) => {
  const text = String(keyword ?? '').trim()
  if (!text) return true
  return String(value ?? '') === text
}

const filterRefPriceRows = (params: Record<string, any>) =>
  refPriceRows.filter(
    (row) =>
      equalsText(row.materialMajor, params.materialMajor) &&
      equalsText(row.materialMiddle, params.materialMiddle) &&
      equalsText(row.materialMinor, params.materialMinor) &&
      equalsText(row.materialCode, params.materialCode) &&
      includesText(row.materialDesc, params.materialDesc)
  )

// ==================== 历史项目申报价格（gss/getGssMatWithPage） ====================

/** 数据来源字典：priceQuery 搜索项 getPublicData('GSS_MAT_SJLY_COM') */
const GSS_SJLY_LIST = [
  { code: 'GSS', name: '估算书' },
  { code: 'CSS', name: '初步设计概算' },
  { code: 'YSS', name: '施工图预算' },
  { code: 'JSS', name: '竣工结算' }
]

/** 单位编码 → 名称，与 budgetChanges 的 UNITS 对齐（bizOrgTree/getYjdw、getEjdw 由其提供） */
const UNIT_NAMES: Record<string, string> = {
  DW002: '国网南京供电公司',
  'DW002-01': '项目管理中心',
  'DW002-02': '运维检修部',
  DW003: '国网苏州供电公司',
  'DW003-01': '建设管理部'
}

/** 项目类型编码 → 名称，与 aiDocument mock 的 getSubProtypeTree（PT01~PT04）对齐 */
const PRO_TYPE_NAMES: Record<string, string> = {
  PT01: '基建项目',
  PT02: '技改项目',
  PT03: '大修项目',
  PT04: '零星购置'
}

interface MockGssMatRow extends Record<string, string | number> {
  id: string
  xmbm: string
  xmmc: string
  jhssnd: string
  proType: string
  proTypeName: string
  yjdwCode: string
  yjdw: string
  ejdwCode: string
  ejdw: string
  wlbm: string
  wlmc: string
  model: string
  unit: string
  count: number
  unitPriceTaxIn: number
  unitPriceTaxEx: number
  sjlyCode: string
  sjly: string
}

/**
 * 申报价格：每个项目按不同数据来源申报一批物料，单价在国网参考价上下浮动，
 * 使同一物料的「下发参考价 / 历史领用价 / 申报价」三个口径可以横向比对。
 * 表格直接渲染 yjdw / ejdw / sjly / proTypeName，因此行上同时存编码（过滤用）与名称（展示用）。
 */
const GSS_MAT_ROWS: MockGssMatRow[] = PROJECTS.flatMap((project, projectIndex) =>
  MATERIALS.flatMap((material, index) =>
    GSS_SJLY_LIST.filter((_, sjlyIndex) => (index + projectIndex) % GSS_SJLY_LIST.length === sjlyIndex).map((sjly) => {
      const seq = projectIndex * 100 + index + 1
      const ratio = 1 + ((seq % 11) - 5) / 100
      const priceInTax = Number((material.price * 1.02 * ratio).toFixed(2))
      return {
        id: `mock-gss-${pad(seq, 4)}`,
        xmbm: project.xmbm,
        xmmc: project.post1,
        jhssnd: projectIndex === 2 ? '2025' : '2026',
        proType: project.proType,
        proTypeName: PRO_TYPE_NAMES[project.proType] || project.proType,
        yjdwCode: project.yjdw,
        yjdw: UNIT_NAMES[project.yjdw] || project.yjdw,
        ejdwCode: project.ejdw,
        ejdw: UNIT_NAMES[project.ejdw] || project.ejdw,
        wlbm: material.code,
        wlmc: material.desc,
        model: material.desc.split(' ').slice(1).join(' ') || '-',
        unit: material.unit,
        count: ((seq % 8) + 1) * (material.price > 10000 ? 1 : 15),
        unitPriceTaxIn: priceInTax,
        unitPriceTaxEx: Number((priceInTax / 1.13).toFixed(2)),
        sjlyCode: sjly.code,
        sjly: sjly.name
      }
    })
  )
)

const filterGssMatRows = (params: Record<string, any>) =>
  GSS_MAT_ROWS.filter(
    (row) =>
      (Array.isArray(params.xmbmList) && params.xmbmList.length ? matchesList(row.xmbm, params.xmbmList) : includesText(row.xmbm, params.xmbm)) &&
      (Array.isArray(params.wlbmList) && params.wlbmList.length ? matchesList(row.wlbm, params.wlbmList) : includesText(row.wlbm, params.wlbm)) &&
      includesText(row.xmmc, params.xmmc) &&
      includesText(row.wlmc, params.wlmc) &&
      (!params.jhssnd || String(params.jhssnd) === row.jhssnd) &&
      (!params.yjdw || String(params.yjdw) === row.yjdwCode) &&
      (!Array.isArray(params.ejdwList) || !params.ejdwList.length || params.ejdwList.map(String).includes(row.ejdwCode)) &&
      (!Array.isArray(params.proTypeList) || !params.proTypeList.length || params.proTypeList.map(String).includes(row.proType)) &&
      (!params.sjly || String(params.sjly) === row.sjlyCode)
  )

const buildSheet = async (sheetName: string, columns: Array<{ header: string; key: string; width: number }>, rows: Record<string, any>[]) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  worksheet.columns = columns
  worksheet.addRows(rows)
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  return workbook.xlsx.writeBuffer()
}

Mock.mock(/commonCode\/getData\?[^#]*code=AI_MAT_PRICE_HIS_TYPE_COM(?:&|$)/, 'get', () => success(UNIT_PRICE_TYPES.map((item) => ({ ...item }))))

// 国网参考采购价格-分页查询
Mock.mock(/material-price-library\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  return success(pageResult(filterPriceLibraryRows(params), params.page, params.limit))
})

// 国网参考采购价格-导入（前端以 res.data 作为成功提示文案）
Mock.mock(/material-price-library\/importData(\?.*)?$/, 'post', () =>
  success(`导入成功，共解析 ${PRICE_LIBRARY_ROWS.length} 条物料价格数据`, '导入成功')
)

// 国网参考采购价格-导出
Mock.mock(/material-price-library\/exportData(\?.*)?$/, 'post', async (options: MockOptions) => {
  const rows = filterPriceLibraryRows(parseBody(options)).map((row) => ({
    ...row,
    priceFloatPercent: `${(Number(row.priceFloatPercent) * 100).toFixed(2)}%`
  }))
  const buffer = await buildSheet(
    '国网参考采购价格',
    [
      { header: '物料编码', key: 'materialCode', width: 18 },
      { header: '物料描述', key: 'materialDescription', width: 46 },
      { header: '计量单位', key: 'measurementUnit', width: 12 },
      { header: '采购价格(元)', key: 'purchasePrice', width: 16 },
      { header: '价格浮动百分比', key: 'priceFloatPercent', width: 16 },
      { header: '下发日期', key: 'updateDate', width: 14 },
      { header: '下发时间', key: 'updateTime', width: 22 }
    ],
    rows
  )
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '物料价格库.xlsx'
  })
})

// 历史项目领用物料单价-分页查询
Mock.mock(/material-price-history\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const rows = filterPriceHistoryRows(params).map(({ unitPriceTypeCode, ...row }) => row)
  return success(pageResult(rows, params.page, params.limit))
})

// 历史项目领用物料单价-导出
Mock.mock(/material-price-history\/exportData(\?.*)?$/, 'post', async (options: MockOptions) => {
  const rows = filterPriceHistoryRows(parseBody(options))
  const buffer = await buildSheet(
    '历史项目领用物料单价',
    [
      { header: '物料编码', key: 'matnr', width: 18 },
      { header: '物料描述', key: 'maktx', width: 46 },
      { header: '单价类型', key: 'unitPriceType', width: 18 },
      { header: '单价(元)', key: 'unitPrice', width: 14 },
      { header: '计量单位', key: 'unit', width: 12 },
      { header: '项目定义', key: 'pspid', width: 20 },
      { header: '项目描述', key: 'post1', width: 48 },
      { header: '物料凭证编号', key: 'mblnr', width: 18 },
      { header: '年度', key: 'mjahr', width: 10 },
      { header: '创建日期', key: 'createTime', width: 14 }
    ],
    rows
  )
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '历史项目领用物料单价.xlsx'
  })
})

// 历史项目领用物料单价-同步数据（前端以 res.data 作为成功提示文案）
Mock.mock(/material-price-history\/syncData(\?.*)?$/, 'post', () =>
  success(`同步完成，本次更新 ${PRICE_HISTORY_ROWS.length} 条领用单价记录`, '同步成功')
)

// ==================== 历史项目领用物料汇总（默认 tab） ====================

// 汇总-分页查询（按物料聚合最新/最低/最高）
Mock.mock(/material-price-history\/getPageNew(\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  return success(pageResult(filterSummaryRows(params), params.page, params.limit))
})

// 汇总-穿透明细（点单价弹 PriceDetailDialog，不分页参数时按默认 20 条）
Mock.mock(/material-price-history\/getPageDetail(\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  return success(pageResult(filterSummaryDetailRows(params), params.page, params.limit))
})

// 汇总-导出
Mock.mock(/material-price-history\/exportDataNew(\?.*)?$/, 'post', async (options: MockOptions) => {
  const buffer = await buildSheet(
    '历史项目领用物料汇总',
    [
      { header: '物料编码', key: 'matnr', width: 18 },
      { header: '物料描述', key: 'maktx', width: 46 },
      { header: '计量单位', key: 'unit', width: 12 },
      { header: '当前最新领料单价(元)', key: 'newestUnitPrice', width: 22 },
      { header: '年度最低领料单价(元)', key: 'minUnitPrice', width: 22 },
      { header: '年度最高领料单价(元)', key: 'maxUnitPrice', width: 22 }
    ],
    filterSummaryRows(parseBody(options))
  )
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '历史项目领用物料汇总.xlsx'
  })
})

// ==================== 国网公司价格库参考价 ====================

// 参考价-分页查询
Mock.mock(/xm-material-ref-price\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  return success(pageResult(clone(filterRefPriceRows(params)), params.page, params.limit))
})

// 参考价-新增/修改（物料编码唯一，重复时按真实后端返回失败）
Mock.mock(/xm-material-ref-price\/saveOrUpdate(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const materialCode = String(body.materialCode || '').trim()
  if (!materialCode) return fail('请输入物料编码')

  const duplicated = refPriceRows.some((row) => row.materialCode === materialCode && row.id !== String(body.id || ''))
  if (duplicated) return fail(`物料编码 ${materialCode} 已存在`)

  const next: MockXmRefPriceRow = {
    id: body.id ? String(body.id) : createRefPriceId(),
    materialMajor: String(body.materialMajor || ''),
    materialMiddle: String(body.materialMiddle || ''),
    materialMinor: String(body.materialMinor || ''),
    materialCode,
    materialDesc: String(body.materialDesc || ''),
    unit: String(body.unit || ''),
    priceExTax: String(body.priceExTax ?? ''),
    priceInTax: String(body.priceInTax ?? ''),
    createTime: ''
  }

  if (body.id) {
    const index = refPriceRows.findIndex((row) => row.id === String(body.id))
    if (index < 0) return fail('记录不存在')
    next.createTime = refPriceRows[index].createTime
    refPriceRows[index] = next
  } else {
    next.createTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
    refPriceRows.unshift(next)
  }
  return success(true, '保存成功')
})

// 参考价-批量删除（入参是裸 id 数组）
Mock.mock(/xm-material-ref-price\/delete(\?.*)?$/, 'post', (options: MockOptions) => {
  let ids: string[] = []
  try {
    const parsed = options.body ? JSON.parse(options.body) : []
    ids = Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    ids = []
  }
  if (!ids.length) return fail('请选择要删除的数据')
  const before = refPriceRows.length
  refPriceRows = refPriceRows.filter((row) => !ids.includes(row.id))
  if (refPriceRows.length === before) return fail('未找到可删除数据')
  return success(true, '删除成功')
})

// 参考价-导入（ImportExcel 只校验 success，失败时以 msg 提示）
Mock.mock(/xm-material-ref-price\/importData(\?.*)?$/, 'post', () => {
  refPriceRows = buildRefPriceRows()
  return success(true, `导入成功，共解析 ${refPriceRows.length} 条参考价数据`)
})

// 参考价-导出
Mock.mock(/xm-material-ref-price\/exportData(\?.*)?$/, 'post', async (options: MockOptions) => {
  const buffer = await buildSheet(
    '国网公司价格库参考价',
    [
      { header: '物料大类', key: 'materialMajor', width: 16 },
      { header: '物料中类', key: 'materialMiddle', width: 16 },
      { header: '物料小类', key: 'materialMinor', width: 16 },
      { header: '物料编码', key: 'materialCode', width: 18 },
      { header: '物料描述', key: 'materialDesc', width: 46 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '除税价格（元）', key: 'priceExTax', width: 16 },
      { header: '含税价格（元）', key: 'priceInTax', width: 16 },
      { header: '创建时间', key: 'createTime', width: 22 }
    ],
    filterRefPriceRows(parseBody(options))
  )
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '国网公司价格库参考价.xlsx'
  })
})

// ==================== 历史项目申报价格 ====================

// 数据来源字典（priceQuery 搜索项）
Mock.mock(/commonCode\/getData\?[^#]*code=GSS_MAT_SJLY_COM(?:&|$)/, 'get', () => success(clone(GSS_SJLY_LIST)))

// 计划实施年度字典（NDCX 已由 centralizedModification 注册，此处不重复，避免互相覆盖）

// 申报价格-分页查询
Mock.mock(/gss\/getGssMatWithPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  return success(pageResult(clone(filterGssMatRows(params)), params.page, params.limit))
})

// 申报价格-导出
Mock.mock(/gss\/exportGssMat(\?.*)?$/, 'post', async (options: MockOptions) => {
  const buffer = await buildSheet(
    '历史项目申报价格',
    [
      { header: '项目编码', key: 'xmbm', width: 18 },
      { header: '项目名称', key: 'xmmc', width: 48 },
      { header: '计划实施年度', key: 'jhssnd', width: 14 },
      { header: '项目类型', key: 'proTypeName', width: 14 },
      { header: '一级单位', key: 'yjdw', width: 22 },
      { header: '二级单位', key: 'ejdw', width: 18 },
      { header: '物料编码', key: 'wlbm', width: 18 },
      { header: '物料名称', key: 'wlmc', width: 46 },
      { header: '规格及型号', key: 'model', width: 28 },
      { header: '单位', key: 'unit', width: 10 },
      { header: '设计用量', key: 'count', width: 12 },
      { header: '单价-含税', key: 'unitPriceTaxIn', width: 14 },
      { header: '单价-不含税', key: 'unitPriceTaxEx', width: 14 },
      { header: '数据来源', key: 'sjly', width: 16 }
    ],
    filterGssMatRows(parseBody(options))
  )
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '历史项目申报价格.xlsx'
  })
})

console.log('[Mock] materialPriceLibrary module loaded')
