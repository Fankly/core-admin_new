/**
 * 预算执行分析四个页面的 mock：
 *   - /statistics/budgetExecutionAnalysis/yszxylb（预算执行一览）
 *   - /statistics/budgetExecutionAnalysis/customYapProjectExecutionByType（自定义预安排项目执行分析-按类型）
 *   - /statistics/yszxylb（预算执行统计报表）
 *   - /report/proYapMbz（项目预安排目标值）
 *
 * 覆盖页面及其弹窗组件用到的全部接口：
 *   页面初始化：sys/menu/getMenuByUrl、getRoleByBusicode、sysMenu/getButtonList（四页面共用预算 / 预安排两组 busicode）
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
import {
  budgetMockYear,
  buildBudgetMockColumns,
  buildBudgetMockRows,
  buildBudgetComparisonMockRows
} from '../fixtures/budgetExecutionAnalysis/reportData'
import { getBudgetMockIndicatorOptions, getBudgetStatisticsMockSnapshot } from './budgetStatisticsConfig'

const BUSICODE_YAP = 'MOCK-YSZX-YAP'
const BUSICODE_LB = 'MOCK-YSZX-LB'
const MENU_ID_YAP = 'MENU-MOCK-YSZX-YAP'
const MENU_ID_LB = 'MENU-MOCK-YSZX-LB'

// ==================== 基础字典 ====================

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

// 对应接口与配置页共用节点、状态及跨节点绑定；这里只组装后端形状的响应。
const getReportData = (body: Record<string, any>, reportType: 'budget' | 'yap', comparison = false) => {
  const params = { ...body, busiType: body.busiType || (reportType === 'yap' ? 'YSZXYL_YAP' : 'YSZXYL') }
  const snapshot = getBudgetStatisticsMockSnapshot(params.busiType, budgetMockYear(params))
  return comparison ? buildBudgetComparisonMockRows(params, reportType, snapshot) : buildBudgetMockRows(params, reportType, snapshot)
}

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
  { code: 'DW001', id: 'DW001', name: '国网江苏省电力有限公司', nodeType: 'PROVINCE', leaf: false, leafString: null, parentId: '-1' },
  { code: 'DW00101', id: 'DW00101', name: '国网南京供电公司', nodeType: 'CITY', leaf: false, leafString: null, parentId: 'DW001' },
  { code: 'DW00102', id: 'DW00102', name: '国网苏州供电公司', nodeType: 'CITY', leaf: false, leafString: null, parentId: 'DW001' },
  { code: 'DW0010101', id: 'DW0010101', name: '项目管理中心', nodeType: 'BM', leaf: true, leafString: '1', parentId: 'DW00101' },
  { code: 'DW0010102', id: 'DW0010102', name: '运维检修部', nodeType: 'BM', leaf: true, leafString: '1', parentId: 'DW00101' },
  { code: 'DW0010201', id: 'DW0010201', name: '建设管理部', nodeType: 'BM', leaf: true, leafString: '1', parentId: 'DW00102' },
  { code: 'DW0010202', id: 'DW0010202', name: '数字化工作部', nodeType: 'BM', leaf: true, leafString: '1', parentId: 'DW00102' }
]

// ==================== 页面初始化（userDialog 链路） ====================

// 覆盖两处一览页，以及 customYapProjectExecutionByType / proYapMbz 两处预安排页。
const PAGE_MENU_RE = /sys\/menu\/getMenuByUrl\?[^#]*(customyapprojectexecutionbytype|yszxylb|proyapmbz)/i

Mock.mock(PAGE_MENU_RE, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  const isYap = /customyapprojectexecutionbytype|proyapmbz/i.test(url)
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
  return success(getBudgetMockIndicatorOptions(busiType))
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

// ==================== 主表格及同比环比弹窗 ====================

Mock.mock(/budgetStatistics\/getDynamicColumnByDw(\?.*)?$/, 'post', (options: MockOptions) => success(buildBudgetMockColumns(parseBody(options))))
Mock.mock(/budgetStatistics\/getDataListByDw(\?.*)?$/, 'post', (options: MockOptions) => success(getReportData(parseBody(options), 'budget')))
Mock.mock(/xmYapMbz\/getData(\?.*)?$/, 'post', (options: MockOptions) => success(getReportData(parseBody(options), 'yap')))
Mock.mock(/budgetStatics\/tbhb\/getDynamicColumn(\?.*)?$/, 'post', (options: MockOptions) =>
  success(buildBudgetMockColumns(parseBody(options), true))
)
Mock.mock(/budgetStatics\/tbhb\/yap\/getDataList(\?.*)?$/, 'post', (options: MockOptions) => success(getReportData(parseBody(options), 'yap', true)))
Mock.mock(/budgetStatics\/tbhb\/getDataList(\?.*)?$/, 'post', (options: MockOptions) => success(getReportData(parseBody(options), 'budget', true)))

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
