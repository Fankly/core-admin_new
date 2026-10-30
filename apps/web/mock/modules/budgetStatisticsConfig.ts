/**
 * 预算统计配置页（/statistics/budgetExecutionAnalysis/budgetStatisticsConfig）的 mock：
 *
 * 覆盖页面及其全部弹窗组件用到的接口：
 *   页面初始化：sys/menu/getMenuByUrl、getRoleByBusicode、sysMenu/getButtonList（本页专属 busicode，按正则收窄不影响真实菜单）；
 *             帮助弹窗 sys/menuConfig/getConfigByMenuId、listFj、downloadFj（按 mock 菜单 id 收窄）
 *   配置树/列表：budgetStatisticsConfig/getConfigList、getConfigInfo、saveConfig、deleteConfig、
 *             batchDeleteConfig、copyStatConfig（内存数据，新增/编辑/删除/跨年度复制后列表实时生效）
 *   配置弹窗：getDataDetail（绑定数据明细）、getSumDetail（绑定汇总明细）、deleteDataDetail、deleteSumDetail
 *   左侧配置树：budgetStatisticsConfig/getNodeTree（YSZXYL / YSZXYL_YAP / YSZXYL_ZX 维度）与
 *             getYszxlyNodeTree（汇总目标选择树）均由配置数据动态组装，新增/编辑/删除/复制后刷新即生效；
 *             一览 / 报表页的「项目类别」下拉与左树同源，随配置联动
 *   归口部门树：budgetStatisticsConfig/getNodeTree?busiType=GKBM_YSZXFX —— 更窄的正则，
 *             需注册在 budgetExecutionAnalysis 的宽泛 getNodeTree 之前才可命中（mockjs 按注册顺序取首个匹配）；
 *             其余 busiType 的 getNodeTree 流量仍落入原模块的项目类别树兜底
 *   指标项关联弹窗：getIndicatorCodeByBusiType、updateIndicator（可选指标项来自 budgetChanges 扩充的 ALL_INDICATOR_CODE）
 *   公共代码：process40/getComCodeByCode 首命中拦截在 budgetChanges.ts（本模块追加所需 code）；
 *             commonCode/getData 单代码（YSTJPZ_TJFS、XMBTYPE_COM）在本模块注册
 *   项目类型树：protypeTree/getAllProtypeTreeNew 由 centralizedModification 模块提供，此处不重复注册
 */
import Mock from 'mockjs'
import { clone, cloneDeep } from 'lodash'
import { binaryResponse, fail, getQueryValue, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const BUSICODE = 'MOCK-YSZX-PZ'
const MENU_ID = 'MENU-MOCK-YSZX-PZ'
const CURRENT_YEAR = String(new Date().getFullYear())

// ==================== 页面初始化（userDialog / HelpModal 链路） ====================

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*budgetstatisticsconfig/i, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ id: MENU_ID, outsideMenu: BUSICODE, url })
})

Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [
  {
    id: `sprole-${BUSICODE}`,
    name: '预算统计配置（Mock）',
    code: `${BUSICODE}-QUERY`,
    role_id: `role-${BUSICODE}`,
    specialorgid: `BM-${BUSICODE}`,
    org_id: 'DW001',
    org_name: '国网江苏省电力有限公司'
  }
])

// v-permission 使用：新增/修改/删除/复制/指标项关联
Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () =>
  success(['ADD', 'EDIT', 'DELETE', 'COPY', 'ZBXGL'])
)

const HELP_INFO = [
  '**预算统计配置（Mock 演示环境）**',
  '',
  '1. 左侧为配置节点树，按展示维度 + 年度维护；单击节点后右侧展示该节点直挂的配置项。',
  '2. 末级节点按统计方式绑定数据：数据明细（项目类型 + 包类型 / 承诺项）或明细汇总（选择其他配置节点）。',
  '3. 复制按钮把当前维度、当前年度的配置整体复制到目标年度。',
  '4. 指标项关联按钮维护各维度展示的指标（目标值 / 到位资金 / 累计完成值 / 完成值 / 完成率）。',
  '5. 本页数据为 mock 演示数据，仅开发环境生效。'
].join('\n')

Mock.mock(new RegExp(`sys/menuConfig/getConfigByMenuId\\?[^#]*menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success({ status: '1', helpInfo: HELP_INFO })
)

Mock.mock(new RegExp(`sys/menuConfig/listFj\\?[^#]*menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success([{ fjmc: '预算统计配置操作手册（Mock）.pdf', uuid: 'help-budpz-pdf' }])
)

Mock.mock(/sys\/menuConfig\/downloadFj\?[^#]*uuid=help-budpz-pdf/, 'get', () =>
  binaryResponse(new Blob(['预算统计配置操作手册（Mock 占位内容）'], { type: 'application/pdf' }), {
    fileName: '预算统计配置操作手册（Mock）.pdf'
  })
)

// ==================== 配置数据（内存态，增删改查实时生效） ====================

interface MockDataDetail {
  detailId?: number
  packType: string
  packTypeName: string
  proType: string
  proTypeName: string
}

interface MockSumDetail {
  detailId?: number
  tarConfigId: string
  tarConfigName: string
}

interface ConfigRow {
  configId: number
  busiType: string
  nd: string
  parentId: string
  configName: string
  dispOrder: number
  subName: string
  gkbm: string
  ysly: string
  cnxm: string
  cnxmms: string
  statMethod: string
  statType: string
  proType: string
  sfjc: string
  bgjdType: string
  bgjdValue: string
  isleaf: '0' | '1'
  recState: '0' | '1'
  isDisplay: '0' | '1'
}

interface SeedRow {
  key: string
  parentKey: string
  configName: string
  dispOrder: number
  subName?: string
  gkbm?: string
  ysly?: string
  cnxm?: string
  cnxmms?: string
  statMethod?: '' | '1' | '2'
  statType?: '' | '1' | '2'
  proType?: string
  sfjc?: '0' | '1'
  // 分析报告节点类型（YSZXFXBG_JDTYPE）、普通分析节点（YSZXFX_PTJDTYPE）
  bgjdType?: string
  bgjdValue?: string
  isleaf: '0' | '1'
  recState?: '0' | '1'
  isDisplay?: '0' | '1'
  dataDetails?: Omit<MockDataDetail, 'detailId'>[]
  sumDetails?: { tarKey: string }[]
}

// 项目类型编码与 centralizedModification 模块的 PROTYPE_TREE 保持一致（叶子节点）
const DATA_DETAILS: Omit<MockDataDetail, 'detailId'>[] = [
  { packType: 'XMB', packTypeName: '项目包', proType: 'PT0101', proTypeName: '输变电工程' },
  { packType: '', packTypeName: '', proType: 'PT0102', proTypeName: '配电工程' },
  { packType: 'FXMB', packTypeName: '非项目包', proType: 'PT0201', proTypeName: '一次设备技改' }
]

const detail = (index: number): Omit<MockDataDetail, 'detailId'> => [DATA_DETAILS[0], DATA_DETAILS[1], DATA_DETAILS[2]][index]

// 配置行模板：parentKey 为 ROOT 表示挂在树根「XX年度」下，其余指向父分组的 seed key
//（模板生成时统一换算为真实 configId，左侧配置树按 parentId 组装）
const SEED_ROWS: SeedRow[] = [
  // 一级分组（年度根节点直挂）
  { key: 'CFG-JJ', parentKey: 'ROOT', configName: '电网基建', isleaf: '0', dispOrder: 1, subName: '1', bgjdType: '1', bgjdValue: '1' },
  { key: 'CFG-JG', parentKey: 'ROOT', configName: '生产技改', isleaf: '0', dispOrder: 2, subName: '2' },
  { key: 'CFG-YX', parentKey: 'ROOT', configName: '营销专项', isleaf: '0', dispOrder: 3, subName: '3', recState: '0' },
  // 电网基建 → 项目包分组
  { key: 'CFG-JJ-SBD', parentKey: 'CFG-JJ', configName: '输变电基建项目包', isleaf: '0', dispOrder: 1, subName: '1-1' },
  { key: 'CFG-JJ-PW', parentKey: 'CFG-JJ', configName: '配网建设与改造项目包', isleaf: '0', dispOrder: 2, subName: '1-2', recState: '0' },
  // 输变电基建项目包下的明细
  {
    key: 'CFG-JJ-SBD-A',
    parentKey: 'CFG-JJ-SBD',
    configName: '110千伏昆山变增容工程',
    isleaf: '1',
    statMethod: '1',
    statType: '1',
    proType: 'PT0101',
    dispOrder: 1,
    subName: '1-1-1',
    gkbm: '建设部',
    ysly: '资本金预算',
    cnxm: '承诺项目-主变增容',
    cnxmms: '主变增容2台，新增容量120兆伏安',
    bgjdType: '1',
    bgjdValue: '2',
    dataDetails: [detail(0)]
  },
  {
    key: 'CFG-JJ-SBD-B',
    parentKey: 'CFG-JJ-SBD',
    configName: '220千伏吴中输变电工程',
    isleaf: '1',
    statMethod: '1',
    statType: '1',
    proType: 'PT0101',
    dispOrder: 2,
    subName: '1-1-2',
    gkbm: '建设部',
    ysly: '企业自有资金',
    cnxm: '承诺项目-线路新建',
    cnxmms: '新建220千伏线路18公里',
    bgjdType: '2',
    dataDetails: [detail(0), detail(1)]
  },
  {
    key: 'CFG-JJ-SBD-C',
    parentKey: 'CFG-JJ-SBD',
    configName: '35千伏城南开关站新建工程',
    isleaf: '1',
    statMethod: '2',
    dispOrder: 3,
    subName: '1-1-3',
    gkbm: '建设部',
    ysly: '政府专项债券',
    cnxm: '承诺项目-开关站改造',
    cnxmms: '35千伏开关站综合自动化改造',
    recState: '0',
    sumDetails: [{ tarKey: 'CFG-JJ-SBD-A' }, { tarKey: 'CFG-JJ-SBD-B' }]
  },
  // 配网建设与改造项目包下的明细
  {
    key: 'CFG-JJ-PW-A',
    parentKey: 'CFG-JJ-PW',
    configName: '10千伏配网自动化改造工程',
    isleaf: '1',
    statMethod: '1',
    statType: '2',
    proType: '配电自动化终端轮换与主站联调',
    dispOrder: 1,
    subName: '1-2-1',
    gkbm: '设备部',
    ysly: '企业自有资金',
    cnxm: '承诺项目-配网自动化',
    cnxmms: '配电自动化终端全覆盖改造'
  },
  {
    key: 'CFG-JJ-PW-B',
    parentKey: 'CFG-JJ-PW',
    configName: '低压台区综合治理工程',
    isleaf: '1',
    statMethod: '1',
    statType: '1',
    proType: 'PT0102',
    dispOrder: 2,
    subName: '1-2-2',
    gkbm: '设备部',
    ysly: '资本金预算',
    cnxm: '承诺项目-台区治理',
    cnxmms: '低压台区线损治理及计量改造',
    recState: '0',
    isDisplay: '0',
    dataDetails: [detail(1)]
  },
  // 生产技改 → 项目包分组 → 明细
  { key: 'CFG-JG-PKG', parentKey: 'CFG-JG', configName: '主设备技术改造项目包', isleaf: '0', dispOrder: 1, subName: '2-1' },
  {
    key: 'CFG-JG-PKG-A',
    parentKey: 'CFG-JG-PKG',
    configName: '变电所二次保护更换技改',
    isleaf: '1',
    statMethod: '2',
    dispOrder: 1,
    subName: '2-1-1',
    gkbm: '设备部',
    ysly: '企业自有资金',
    cnxm: '承诺项目-二次保护',
    cnxmms: '二次保护装置更换校验',
    sumDetails: [{ tarKey: 'CFG-JJ-SBD-B' }]
  },
  {
    key: 'CFG-JG-PKG-B',
    parentKey: 'CFG-JG-PKG',
    configName: '开关柜无油化改造技改',
    isleaf: '1',
    statMethod: '1',
    statType: '1',
    proType: 'PT0201',
    dispOrder: 2,
    subName: '2-1-2',
    gkbm: '设备部',
    ysly: '企业自有资金',
    cnxm: '承诺项目-开关柜改造',
    cnxmms: '35千伏开关柜无油化改造',
    dataDetails: [detail(2)]
  },
  // 营销专项下的明细
  {
    key: 'CFG-YX-A',
    parentKey: 'CFG-YX',
    configName: '采集终端轮换工程',
    isleaf: '1',
    statMethod: '1',
    statType: '1',
    proType: 'PT0102',
    dispOrder: 1,
    subName: '3-1',
    gkbm: '营销部',
    ysly: '企业自有资金',
    cnxm: '承诺项目-计量采集',
    cnxmms: '采集终端轮换及计量箱改造'
  },
  {
    key: 'CFG-YX-B',
    parentKey: 'CFG-YX',
    configName: '计量箱防窃电改造',
    isleaf: '1',
    statMethod: '2',
    dispOrder: 2,
    subName: '3-2',
    gkbm: '营销部',
    ysly: '政府专项债券',
    cnxm: '承诺项目-防窃电',
    cnxmms: '计量箱防窃电封闭改造',
    recState: '0',
    sumDetails: [{ tarKey: 'CFG-YX-A' }]
  }
]

interface ConfigDetails {
  dataDetails: MockDataDetail[]
  sumDetails: MockSumDetail[]
}

const CONFIG_STORE = new Map<string, ConfigRow[]>() // key: `${busiType}|${nd}`
const DETAIL_STORE = new Map<string, ConfigDetails>() // key: `${busiType}|${nd}|${configId}`

let configIdSeq = 5000
let detailIdSeq = 1000

const storeKey = (busiType: string, nd: string) => `${busiType}|${nd}`

// 按模板初始化某维度 + 年度的配置数据（configId 每次播种重新分配，明细中的 tarConfigId 一并重映射）
const ensureYearData = (busiType: string, nd: string): ConfigRow[] => {
  const key = storeKey(busiType, nd)
  const existed = CONFIG_STORE.get(key)
  if (existed) return existed

  const rows: ConfigRow[] = []
  const idMap: Record<string, number> = {}
  const nameMap: Record<string, string> = {}
  SEED_ROWS.forEach((seed) => {
    const configId = ++configIdSeq
    idMap[seed.key] = configId
    nameMap[seed.key] = seed.configName
    rows.push({
      configId,
      busiType,
      nd: String(nd),
      // 根级挂树根「XX年度」（TreeTable 根节点 id 即年度），子级挂父分组的真实 configId
      parentId: seed.parentKey === 'ROOT' ? String(nd) : String(idMap[seed.parentKey]),
      configName: seed.configName,
      dispOrder: seed.dispOrder,
      subName: seed.subName || '',
      gkbm: seed.gkbm || '',
      ysly: seed.ysly || '',
      cnxm: seed.cnxm || '',
      cnxmms: seed.cnxmms || '',
      statMethod: seed.statMethod || '',
      statType: seed.statType || '',
      proType: seed.proType || '',
      sfjc: seed.sfjc || '0',
      bgjdType: seed.bgjdType || '',
      // 非分析报告节点类型（1）不保留普通分析节点
      bgjdValue: seed.bgjdType === '1' ? seed.bgjdValue || '' : '',
      isleaf: seed.isleaf,
      recState: seed.recState || '1',
      isDisplay: seed.isDisplay || '1'
    })
  })
  CONFIG_STORE.set(key, rows)

  SEED_ROWS.forEach((seed) => {
    if (!seed.dataDetails && !seed.sumDetails) return
    DETAIL_STORE.set(`${key}|${idMap[seed.key]}`, {
      dataDetails: (seed.dataDetails || []).map((item) => ({ ...item, detailId: ++detailIdSeq })),
      sumDetails: (seed.sumDetails || []).map((item) => ({
        detailId: ++detailIdSeq,
        tarConfigId: String(idMap[item.tarKey]),
        tarConfigName: nameMap[item.tarKey] || ''
      }))
    })
  })
  return rows
}

const findRow = (configId: number): ConfigRow | undefined => {
  for (const rows of CONFIG_STORE.values()) {
    const row = rows.find((item) => item.configId === configId)
    if (row) return row
  }
  return undefined
}

const loadDetails = (configId: number): ConfigDetails => {
  for (const [key, value] of DETAIL_STORE) {
    if (key.endsWith(`|${configId}`)) return value
  }
  return { dataDetails: [], sumDetails: [] }
}

const removeRows = (configIds: string[]) => {
  const idSet = new Set(configIds.map(Number))
  CONFIG_STORE.forEach((rows, key) => {
    CONFIG_STORE.set(key, rows.filter((row) => !idSet.has(row.configId)))
  })
  DETAIL_STORE.forEach((_, key) => {
    const configId = Number(key.split('|').pop())
    if (idSet.has(configId)) DETAIL_STORE.delete(key)
  })
}

// 保存时统一字段类型：回显逻辑依赖 isleaf/recState/isDisplay 为字符串
const sanitizeDetailStore = (busiType: string, nd: string, configId: number, body: Record<string, any>) => {
  const dataDetails = (Array.isArray(body.dataDetails) ? body.dataDetails : []).map((item: any) => ({
    detailId: item.detailId ? Number(item.detailId) : ++detailIdSeq,
    packType: String(item.packType ?? ''),
    packTypeName: String(item.packTypeName ?? ''),
    proType: String(item.proType ?? ''),
    proTypeName: String(item.proTypeName ?? '')
  }))
  const rows = CONFIG_STORE.get(storeKey(busiType, nd)) || []
  const findRowName = (id: string) => rows.find((item) => String(item.configId) === id)?.configName || ''
  // 新增明细走弹窗带 name（el-tree / 表格行）；编辑明细只有 tarConfigId，按同维度配置反查名称
  const sumDetails = (Array.isArray(body.sumDetails) ? body.sumDetails : []).map((item: any) => {
    const tarConfigId = String(item.tarConfigId ?? '')
    return {
      detailId: item.detailId ? Number(item.detailId) : ++detailIdSeq,
      tarConfigId,
      tarConfigName: String(item.name || item.tarConfigName || findRowName(tarConfigId))
    }
  })
  DETAIL_STORE.set(`${storeKey(busiType, nd)}|${configId}`, { dataDetails, sumDetails })
}

// ==================== 配置树 / 配置列表 ====================

Mock.mock(/budgetStatisticsConfig\/getConfigList\?/, 'get', (options: MockOptions) => {
  const busiType = getQueryValue(options.url, 'busiType')
  const nd = getQueryValue(options.url, 'nd')
  const parentId = getQueryValue(options.url, 'parentId')
  if (!busiType || !nd) return success([])
  const rows = ensureYearData(busiType, nd).filter((row) => row.parentId === String(parentId))
  return success(clone(rows))
})

Mock.mock(/budgetStatisticsConfig\/getConfigInfo\?/, 'get', (options: MockOptions) => {
  const configId = Number(getQueryValue(options.url, 'configId'))
  const row = findRow(configId)
  return row ? success(clone(row)) : fail('配置不存在或已被删除')
})

Mock.mock(/budgetStatisticsConfig\/saveConfig(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const busiType = String(body.busiType || '')
  const nd = String(body.nd ?? '')
  if (!busiType || !nd) return fail('缺少维度或年度参数')
  const rows = ensureYearData(busiType, nd)
  const common = {
    configName: String(body.configName || ''),
    dispOrder: Number(body.dispOrder || 0),
    subName: String(body.subName ?? ''),
    gkbm: String(body.gkbm ?? ''),
    ysly: String(body.ysly ?? ''),
    cnxm: String(body.cnxm ?? ''),
    cnxmms: String(body.cnxmms ?? ''),
    statMethod: String(body.statMethod ?? ''),
    statType: body.statType != null && body.statType !== '' ? String(body.statType) : '',
    proType: String(body.proType ?? ''),
    sfjc: String(body.sfjc ?? '0'),
    bgjdType: String(body.bgjdType ?? ''),
    bgjdValue: String(body.bgjdType) === '1' ? String(body.bgjdValue ?? '') : '',
    isleaf: String(body.isleaf ?? '0') as '0' | '1',
    recState: String(body.recState ?? '1') as '0' | '1',
    isDisplay: String(body.isDisplay ?? '1') as '0' | '1'
  }

  let configId = Number(body.configId || 0)
  if (configId) {
    const row = rows.find((item) => item.configId === configId)
    if (!row) return fail('配置不存在或已被删除')
    Object.assign(row, common)
  } else {
    configId = ++configIdSeq
    rows.push({
      configId,
      busiType,
      nd,
      parentId: String(body.parentId ?? nd),
      ...common
    })
  }
  sanitizeDetailStore(busiType, nd, configId, body)
  return success(true, '保存成功！')
})

Mock.mock(/budgetStatisticsConfig\/deleteConfig(\?.*)?$/, 'post', (options: MockOptions) => {
  removeRows([getQueryValue(options.url, 'configId')])
  return success(true, '删除成功！')
})

Mock.mock(/budgetStatisticsConfig\/batchDeleteConfig(\?.*)?$/, 'post', (options: MockOptions) => {
  const configIds = getQueryValue(options.url, 'configIds')
  removeRows(configIds.split(',').filter(Boolean))
  return success(true, '删除成功！')
})

// 跨年度复制：目标年度按源年度数据全量重建（重新分配 configId 并重映射明细）
Mock.mock(/budgetStatisticsConfig\/copyStatConfig(\?.*)?$/, 'post', (options: MockOptions) => {
  const busiType = getQueryValue(options.url, 'busiType')
  const sourceNd = getQueryValue(options.url, 'sourceNd')
  const targetNd = getQueryValue(options.url, 'targetNd')
  if (!busiType || !sourceNd || !targetNd) return fail('参数不完整')
  if (sourceNd === targetNd) return fail('目标年度不能与当前年度相同')
  if (!/^\d{4}$/.test(targetNd)) return fail('目标年度格式不正确')

  ensureYearData(busiType, sourceNd)
  const sourceKey = storeKey(busiType, sourceNd)
  const targetKey = storeKey(busiType, targetNd)

  const idMap: Record<string, number> = {}
  const nameMap: Record<string, string> = {}
  const sourceRows = CONFIG_STORE.get(sourceKey) || []
  const targetRows = sourceRows.map((row) => {
    const configId = ++configIdSeq
    idMap[String(row.configId)] = configId
    nameMap[String(row.configId)] = row.configName
    return { ...row, configId, nd: targetNd }
  })
  // 父级重映射：子行的 parentId 指向源行 configId，需换算成新 id；根级属于年度，重置为目标年度
  targetRows.forEach((row) => {
    const mapped = idMap[row.parentId]
    row.parentId = mapped != null ? String(mapped) : String(targetNd)
  })
  CONFIG_STORE.set(targetKey, targetRows)

  Array.from(DETAIL_STORE.keys())
    .filter((key) => key.startsWith(`${targetKey}|`))
    .forEach((key) => DETAIL_STORE.delete(key))
  Array.from(DETAIL_STORE.entries())
    .filter(([key]) => key.startsWith(`${sourceKey}|`))
    .forEach(([key, value]) => {
      const sourceConfigId = String(key.split('|').pop())
      DETAIL_STORE.set(`${targetKey}|${idMap[sourceConfigId]}`, {
        dataDetails: value.dataDetails.map((item) => ({ ...item, detailId: ++detailIdSeq })),
        sumDetails: value.sumDetails.map((item) => ({
          detailId: ++detailIdSeq,
          tarConfigId: idMap[item.tarConfigId] ? String(idMap[item.tarConfigId]) : item.tarConfigId,
          tarConfigName: nameMap[item.tarConfigId] || item.tarConfigName
        }))
      })
    })
  return success(true, `已复制 ${targetRows.length} 条配置到 ${targetNd} 年度！`)
})

// ==================== 配置弹窗（数据明细 / 明细汇总） ====================

Mock.mock(/budgetStatisticsConfig\/getDataDetail\?/, 'get', (options: MockOptions) => {
  const configId = Number(getQueryValue(options.url, 'configId'))
  return success(cloneDeep(loadDetails(configId).dataDetails))
})

Mock.mock(/budgetStatisticsConfig\/getSumDetail\?/, 'get', (options: MockOptions) => {
  const configId = Number(getQueryValue(options.url, 'configId'))
  return success(cloneDeep(loadDetails(configId).sumDetails))
})

Mock.mock(/budgetStatisticsConfig\/deleteDataDetail(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = new Set(
    getQueryValue(options.url, 'detailIds')
      .split(',')
      .filter(Boolean)
      .map(Number)
  )
  DETAIL_STORE.forEach((value) => {
    value.dataDetails = value.dataDetails.filter((item) => !ids.has(item.detailId || NaN))
  })
  return success(true, '删除成功！')
})

Mock.mock(/budgetStatisticsConfig\/deleteSumDetail(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = new Set(
    getQueryValue(options.url, 'detailIds')
      .split(',')
      .filter(Boolean)
      .map(Number)
  )
  DETAIL_STORE.forEach((value) => {
    value.sumDetails = value.sumDetails.filter((item) => !ids.has(item.detailId || NaN))
  })
  return success(true, '删除成功！')
})

// ==================== 左树配置节点 / 汇总目标选择树 ====================

// 归口部门树：TreeDialog 统计方式为明细汇总且区分归口来源时调用（GKBM_YSZXFX 维度）
const GKBM_TREE = [
  { id: 'GKBM-JS', name: '建设部', children: [] },
  { id: 'GKBM-SB', name: '设备部', children: [] },
  { id: 'GKBM-YX', name: '营销部', children: [] },
  { id: 'GKBM-JH', name: '发展策划部', children: [] }
]

// 配置树由配置数据动态组装（新增/编辑/删除/复制后刷新即可见）：
// 根级节点 parentId 为年度，子级为父分组的真实 configId；叶子节点不含空 children
const buildConfigTree = (busiType: string, nd: string): Record<string, any>[] => {
  const rows = ensureYearData(busiType, nd)
  const nodeMap = new Map<number, Record<string, any>>()
  rows.forEach((row) => {
    nodeMap.set(row.configId, {
      id: row.configId,
      parentId: row.parentId,
      name: row.configName,
      isleaf: row.isleaf,
      dispOrder: row.dispOrder,
      recState: row.recState
    })
  })
  const sorted = Array.from(nodeMap.values()).sort((a, b) => a.dispOrder - b.dispOrder)
  const roots: Record<string, any>[] = []
  sorted.forEach((node) => {
    if (node.parentId === String(nd)) {
      roots.push(node)
      return
    }
    const parent = nodeMap.get(Number(node.parentId))
    if (parent) {
      parent.children = parent.children || []
      parent.children.push(node)
    }
  })
  return roots
}

// 本模块需注册在 budgetExecutionAnalysis 的宽泛 getNodeTree 之前（mockjs 取首个命中）：
// YSZXYL 家族维度返回本页的动态配置树，其余 busiType 流量仍落入原模块的项目类别树兜底。
// 该接口同时被一览 / 预安排报表页用作「项目类别」下拉数据（它们的数据查询不依赖此树，仅作条件传参）。
Mock.mock(
  /budgetStatisticsConfig\/getNodeTree\?[^#]*busiType=(?:YSZXYL|YSZXYL_YAP|YSZXYL_ZX)(?:&|$)/,
  'get',
  (options: MockOptions) => {
    const nd = getQueryValue(options.url, 'nd')
    const busiType = getQueryValue(options.url, 'busiType')
    return success(buildConfigTree(busiType || 'YSZXYL', nd || CURRENT_YEAR))
  }
)

Mock.mock(/budgetStatisticsConfig\/getNodeTree\?[^#]*busiType=GKBM_YSZXFX(?:&|$)/, 'get', () => success(clone(GKBM_TREE)))

// 汇总目标选择树（TreeDialog）：同一棵配置树，叶子节点可被勾选为汇总目标
Mock.mock(/budgetStatisticsConfig\/getYszxlyNodeTree\?/, 'get', (options: MockOptions) => {
  const nd = getQueryValue(options.url, 'nd')
  const busiType = getQueryValue(options.url, 'busiType')
  return success(buildConfigTree(busiType || 'YSZXYL', nd || CURRENT_YEAR))
})

// ==================== 指标项关联（IndicatorRelationDialog） ====================

const INDICATOR_NAME_MAP: Record<string, string> = {
  MBZ: '目标值',
  DFJ: '到位资金',
  LXZ: '累计完成值',
  WCZ: '完成值',
  WCL: '完成率'
}

// 各维度默认关联的指标项（与 budgetExecutionAnalysis 的指标配置保持一致；其余维度未配置返回空）
const INDICATOR_SELECTION: Record<string, string[]> = clone({
  YSZXYL: ['MBZ', 'WCZ', 'WCL'],
  YSZXYL_YAP: ['MBZ', 'DFJ', 'LXZ', 'WCZ', 'WCL'],
  YSZXYL_ZX: []
})

Mock.mock(/budgetStatisticsConfig\/getIndicatorCodeByBusiType\?/, 'get', (options: MockOptions) => {
  const busiType = getQueryValue(options.url, 'busiType')
  const codes = INDICATOR_SELECTION[busiType] || []
  return success(codes.map((code) => ({ code, name: INDICATOR_NAME_MAP[code] || code })))
})

Mock.mock(/budgetStatisticsConfig\/updateIndicator(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const busiType = String(body.busiType || '')
  if (!busiType) return fail('缺少维度参数')
  INDICATOR_SELECTION[busiType] = (Array.isArray(body.indicators) ? body.indicators : [])
    .map((item: any) => String(item?.code || ''))
    .filter(Boolean)
  return success(true, '保存成功！')
})

// ==================== 单公共代码（MainTable / TypeDialog 的 commonCode/getData） ====================

const GET_DATA_CODES: Record<string, Array<{ code: string; name: string }>> = {
  // 统计方式（MainTable 统计方式列、FormDialog 统计方式下拉）
  YSTJPZ_TJFS: [
    { code: '1', name: '数据明细' },
    { code: '2', name: '明细汇总' }
  ],
  // 包类型（TypeDialog 绑定数据明细弹窗）
  XMBTYPE_COM: [
    { code: 'XMB', name: '项目包' },
    { code: 'FXMB', name: '非项目包' }
  ]
}

Object.entries(GET_DATA_CODES).forEach(([code, data]) => {
  Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${code}(?:&|$)`), 'get', () => success(clone(data)))
})
