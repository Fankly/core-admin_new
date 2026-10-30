/**
 * 业务工作台（/ai/businessWorkbench/index）全部接口 mock。
 *
 * 本模块注册的页面专属接口：
 * - POST business-workbench/requirementLibraryProjectPage 需求资源库项目分页
 * - POST business-workbench/meetingInfoPage 联合会审会议分页
 * - POST business-workbench/reserveLibraryProjectPage 项目储备库项目分页
 * - POST business-workbench/projectStatistics 项目统计（step 0/1/2 = 需求库/联合会审/储备库）
 * - GET  sys/menu/getMenuByUrl（按 url 含 businessWorkbench 收窄，避免影响其他页面）
 * - GET  getRoleByBusicode（按 busicode 收窄，返回单角色让 UserRoleSelector 自动进入页面）
 * - GET  sysMenu/getButtonList（按本页与各模块按钮的 menuCode 收窄）
 *
 * 共用接口走既有模块的首命中拦截（mockjs 取首个匹配，本模块不再重复注册）：
 * - comPz/getNdTreeNode 年度 → aiDocument.ts（2024-2026）
 * - process40/getComCodeByCode 公共代码 → budgetChanges.ts，本页所需 code 已追加进其 PUBLIC_CODE_MAP
 * - sys/appMenu/getAppMenuData 模块卡片按钮 → aiReviewWorkBench.ts，合并本模块导出的 BUSINESS_WORKBENCH_APP_MENU
 */
import Mock from 'mockjs'
import { getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// 页面菜单编码（UserRoleSelector 链路：getMenuByUrl → getRoleByBusicode → getButtonList）
const PAGE_BUSICODE = 'BWB_GZT'
// 三个模块卡片按钮的菜单编码
const MENU_BUSICODES = ['BWB_XQZYK', 'BWB_LHHS', 'BWB_XMCBK']
// 与 aiDocument 的 getNdTreeNode 返回年度保持一致
const YEARS = ['2024', '2025', '2026']

// ==================== 页面初始化（菜单编码 / 角色 / 按钮权限） ====================

const role = {
  id: 'sprole-bwb-01',
  name: '业务工作台专职',
  code: 'SCWYBWB',
  role_id: 'role-bwb-01',
  specialorgid: 'bm-bwb-01',
  specialorgname: '发展策划部',
  specialorgcode: 'BM_FZCH',
  org_id: 'dw-nj-01',
  org_name: '国网南京供电公司',
  namecode: 'mock_bwb_user',
  busicode: PAGE_BUSICODE
}

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*businessWorkbench/, 'get', (options: MockOptions) =>
  success({ outsideMenu: PAGE_BUSICODE, url: getQueryValue(options.url, 'url') })
)
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${PAGE_BUSICODE}(?:&|$)`), 'get', () => [clone(role)])
Mock.mock(
  new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=(?:${[PAGE_BUSICODE, ...MENU_BUSICODES].join('|')})(?:&|$)`),
  'get',
  () => success(['ADD', 'EDIT', 'EXPORT'])
)

// ==================== 模块卡片按钮（getAppMenuData 由 aiReviewWorkBench.ts 合并返回） ====================

// 注意：不要带 url 字段——normalizeModuleMenus 会把 url 识别成 routeName 导致按命名路由跳转失败
const buildWorkbenchMenu = (id: string, name: string, routePath: string, outsideMenu: string, sort: number) => ({
  id,
  name,
  outsideMenu,
  routePath,
  sort,
  type: 1,
  isShow: 1,
  isFrame: 0,
  openStyle: 0
})

export const BUSINESS_WORKBENCH_APP_MENU: Record<string, Record<string, any[]>> = {
  CITY_XQZYK: {
    '1': [buildWorkbenchMenu('bwb-xqzyk-op-1', '集中修改', '/service/xq/CentralizedModification', 'BWB_XQZYK', 1)],
    '2': [buildWorkbenchMenu('bwb-xqzyk-q-1', '需求明细查询', '/service/xq/RequireDetailSearch', 'BWB_XQZYK', 1)]
  },
  CITY_LHHS: {
    '1': [
      buildWorkbenchMenu('bwb-lhhs-op-1', '会议管理', '/service/jointReview/meetingManage/index', 'BWB_LHHS', 1),
      buildWorkbenchMenu('bwb-lhhs-op-2', '专家线上预审', '/service/jointReview/expertReview/index', 'BWB_LHHS', 2)
    ],
    '2': [buildWorkbenchMenu('bwb-lhhs-q-1', '线下会审', '/service/jointReview/offlineReview/index', 'BWB_LHHS', 1)]
  },
  CITY_XMCBK: {
    '1': [buildWorkbenchMenu('bwb-cbk-op-1', '储备项目管理', '/service/cbk/projectReserve/index', 'BWB_XMCBK', 1)],
    '2': []
  }
}

// ==================== 列表数据 ====================

const YJDW_NAME = '国网江苏省电力有限公司'
const EJDW_NAMES = ['国网南京供电公司', '国网苏州供电公司', '国网无锡供电公司', '国网常州供电公司', '国网南通供电公司', '国网徐州供电公司']
const CTBM_NAMES = ['配电网发展处', '输变电处', '调度控制处', '营销部', '科技创新部', '数字化部']
const CREATE_DEPT_NAMES = ['发展策划部', '设备管理部', '建设部', '营销部', '数字化部', '物资部']

const REGIONS = ['南京', '苏州', '无锡', '常州', '南通', '徐州']
const REQUIREMENT_TOPICS = [
  '中低压配电网改造',
  '农村电网巩固提升',
  '110千伏输变电',
  '配电自动化升级',
  '老旧小区供电设施改造',
  '通信网光缆改造',
  '充电设施配套电网',
  '调度自动化系统升级'
]
const RESERVE_TOPICS = [
  '500千伏输变电',
  '220千伏输变电',
  '新能源配套电网',
  '储能电站接入',
  '主网架优化',
  '数字化基础设施',
  '防灾减灾能力提升',
  '新型电力系统示范',
  '城市电缆通道',
  '智慧变电站'
]
const MEETING_TOPICS = ['配网检修计划', '基建项目可研', '技改大修计划', '信息化项目', '营销项目可研', '数字化项目']

// 二级状态 code：与 budgetChanges.PUBLIC_CODE_MAP 中追加的两级状态公共代码一致，
// statusNameMap 会把二级 code 解析回一级状态名（待提交/流转中/在库/已出库 等）
const REQUIREMENT_STATUS_CODES = [
  'LYGXQKSTATUS_0101',
  'LYGXQKSTATUS_0201',
  'LYGXQKSTATUS_0202',
  'LYGXQKSTATUS_0301',
  'LYGXQKSTATUS_0401'
]
const RESERVE_STATUS_CODES = [
  'CBKSTATUS_0101',
  'CBKSTATUS_0102',
  'CBKSTATUS_0201',
  'CBKSTATUS_0202',
  'CBKSTATUS_0301',
  'CBKSTATUS_0302'
]

const pad = (value: number) => String(value).padStart(2, '0')
const buildDate = (nd: string, index: number) => `${nd}-${pad((index % 12) + 1)}-${pad((index % 27) + 1)}`
const buildAmount = (index: number) => ((index * 137) % 880) + 120

// seed 为年内的行序号：保证同一年度内级别/单位/部门/金额分布均匀，避免与年度筛选相互耦合
const buildCommonFields = (nd: string, seed: number) => ({
  nd,
  ysly: seed % 3 === 0 ? '1' : '2', // 1=省级 2=市级，与请求参数 ysly 对齐
  yjdwName: YJDW_NAME,
  ejdwName: EJDW_NAMES[seed % EJDW_NAMES.length],
  ctbmName: CTBM_NAMES[seed % CTBM_NAMES.length],
  cjbmmc: CREATE_DEPT_NAMES[(seed + 3) % CREATE_DEPT_NAMES.length],
  amount: buildAmount(seed)
})

// 需求资源库项目：字段名对齐 normalizeMeetings 的取值键（xmmc/gwxmbm/zt/ysly/kssj/jssj）
const REQUIREMENT_ROWS = REGIONS.flatMap((region) => REQUIREMENT_TOPICS.map((topic) => `${region}${topic}工程`))
  .slice(0, 45)
  .map((xmmc, index) => {
    const nd = YEARS[index % YEARS.length]
    const seed = Math.floor(index / YEARS.length)
    return {
      ...buildCommonFields(nd, seed),
      id: `XQ${nd}${String(index + 1).padStart(4, '0')}`,
      xmmc,
      gwxmbm: `GW${nd}${String(index + 1).padStart(4, '0')}`,
      zt: REQUIREMENT_STATUS_CODES[seed % REQUIREMENT_STATUS_CODES.length],
      kssj: buildDate(nd, seed),
      jssj: buildDate(nd, seed + 5)
    }
  })

// 项目储备库项目
const RESERVE_ROWS = REGIONS.flatMap((region) => RESERVE_TOPICS.map((topic) => `${region}${topic}工程`))
  .slice(0, 30)
  .map((xmmc, index) => {
    const nd = YEARS[index % YEARS.length]
    const seed = Math.floor(index / YEARS.length)
    return {
      ...buildCommonFields(nd, seed + 7),
      id: `CB${nd}${String(index + 1).padStart(4, '0')}`,
      xmmc,
      gwxmbm: `CB${nd}${String(index + 1).padStart(4, '0')}`,
      zt: RESERVE_STATUS_CODES[seed % RESERVE_STATUS_CODES.length],
      kssj: buildDate(nd, seed + 2),
      jssj: buildDate(nd, seed + 8)
    }
  })

// 联合会审会议：zt 00=未发布(pending) 01=评审中(reviewing) 02=已结束(completed)
const MEETING_ROWS = REGIONS.flatMap((region) => MEETING_TOPICS.map((topic) => `${region}${topic}`))
  .slice(0, 18)
  .map((topic, index) => {
    const nd = YEARS[index % YEARS.length]
    const seed = Math.floor(index / YEARS.length)
    const zt = ['00', '01', '02'][(seed + 1) % 3]
    const projectCount = (seed % 10) + 6
    const passedCount = zt === '02' ? projectCount : zt === '01' ? Math.floor(projectCount / 2) : 0
    const returnedCount = zt === '01' ? 1 : 0
    return {
      ...buildCommonFields(nd, seed + 4),
      hyId: `HY${nd}${String(index + 1).padStart(3, '0')}`,
      hymc: `${nd}年${topic}联合会审`,
      hybh: `HS${nd}${String(index + 1).padStart(3, '0')}`,
      zt,
      kssj: buildDate(nd, seed + 1),
      jssj: buildDate(nd, seed + 4),
      expertCount: (seed % 5) + 5,
      projectCount,
      passedCount,
      returnedCount
    }
  })

// ==================== 分页查询（筛选与分页按请求参数在后端完成） ====================

const projectPageHandler = (rows: Record<string, any>[]) => (options: MockOptions) => {
  const body = parseBody(options)
  const statusCodes = String(body.status || '')
    .split(',')
    .filter(Boolean)
  const keyword = String(body.xmmc || '').trim()
  const filtered = rows.filter(
    (row) =>
      (!body.nd || row.nd === String(body.nd)) &&
      (!body.ysly || row.ysly === String(body.ysly)) &&
      (!keyword || row.xmmc.includes(keyword)) &&
      (!statusCodes.length || statusCodes.includes(row.zt))
  )
  return success(pageResult(filtered, body.page, body.limit))
}

Mock.mock(/business-workbench\/requirementLibraryProjectPage(?:\?.*)?$/, 'post', projectPageHandler(REQUIREMENT_ROWS))
Mock.mock(/business-workbench\/reserveLibraryProjectPage(?:\?.*)?$/, 'post', projectPageHandler(RESERVE_ROWS))

Mock.mock(/business-workbench\/meetingInfoPage(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const status = String(body.status || '')
  const keyword = String(body.meetingName || '').trim()
  const filtered = MEETING_ROWS.filter(
    (row) =>
      (!body.nd || row.nd === String(body.nd)) &&
      (!body.ysly || row.ysly === String(body.ysly)) &&
      (!keyword || row.hymc.includes(keyword)) &&
      (!status || row.zt === status)
  )
  return success(pageResult(filtered, body.page, body.limit))
})

// ==================== 项目统计（step 0 需求库 / 1 联合会审 / 2 储备库） ====================

// 数值口径与列表数据对齐：每个年度需求库 15 条、储备库 10 条、会议 6 场
const STATISTICS_BASE = {
  totalCount: 15, // 需求资源库-我的项目总数
  requirementEntryRate: 80, // 需求资源库-需求入库率
  notInRequirementEntryRate: 3, // 需求资源库-未纳入需求库总数
  requirementCount: 12, // 需求资源库-需求库项目数
  jointReviewCount: 4, // 需求资源库-联合会审项目数
  reserveCount: 6, // 需求资源库-储备项目数
  budgetingCount: 2, // 需求资源库-计划预算编制中项目数
  approvedCount: 3, // 需求资源库-已立项项目数
  closedCount: 3, // 需求资源库-已关闭项目数
  jointReviewPassRate: 75, // 联合会审-会审通过率
  totalCount2: 6, // 联合会审-我的项目总数
  reviewingCount: 2, // 联合会审-审核中项目数
  reviewPassedCount: 2, // 联合会审-审核通过项目数
  reviewRejectedCount: 0, // 联合会审-审核退回项目数
  reviewOpinionPendingCount: 1, // 联合会审-评审意见待上传项目数
  pendingFeasibilityUploadCount: 1, // 联合会审-可研批复待上传项目数
  complianceReviewingCount: 2, // 联合会审-发展合规审核中项目数
  approvalRate: 50, // 项目储备库-立项率
  totalCount3: 10, // 项目储备库-我的项目总数
  pendingOutboundCount: 2, // 项目储备库-待出库总数
  pendingOutboundConfirmCount: 1, // 项目储备库-待出库确认项目数
  pendingBudgetingCount: 2, // 项目储备库-待预算编制项目数
  budgetingReviewingCount: 1, // 项目储备库-预算编制审核中项目数
  pendingApprovalCount: 2, // 项目储备库-待立项项目数
  approvedCount3: 2 // 项目储备库-已立项项目数
}

const STATISTICS_BY_STEP = [
  STATISTICS_BASE,
  { ...STATISTICS_BASE, totalCount: 6, totalCount2: 6 },
  { ...STATISTICS_BASE, totalCount: 10, totalCount3: 10 }
]

Mock.mock(/business-workbench\/projectStatistics(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const step = Number(body.step) || 0
  return success(clone(STATISTICS_BY_STEP[step] || STATISTICS_BY_STEP[0]))
})
