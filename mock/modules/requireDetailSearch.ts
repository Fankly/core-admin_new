/**
 * 需求明细查询（/service/xq/RequireDetailSearch）mock
 *
 * 覆盖该页全链路：登录角色 → 菜单/按钮权限 → 发起组织标志 → 动态查询列/表头
 * → 需求明细列表/分页 → 单个字典（项目阶段 / 附件类型） → 参数配置（最大下载数）
 * → 导出 / 附件批量下载 → 补推计划系统 → 引导 / 帮助中心。
 *
 * 复用关系（与 centralizedModification 同属 service/xq 域，编码刻意对齐，避免重复注册）：
 *  - 动态查询列/表头结构直接复用 centralizedModification/data 的 SEARCH_COLUMNS / TABLE_COLUMNS
 *    （字段与 XQ_ROWS 对齐），本页只把它们绑到 searchCode=XQLR-VIEW 上
 *  - 需求明细列表 xmAttributeConfig/getXqlrPage 是无 query 判别值的 POST，
 *    已由 centralizedModification 宽泛注册（返回 XQ_ROWS），本页直接复用；
 *    「查看」用的 sfxqlr 字段已在 XQ_ROWS 上补齐
 *  - 单位/分类级联（bizOrgTree/getYjdw、getEjdw、commonCode/getCommonCodeByParentCode）
 *    与批量公共代码（commonCode/getCommonCode）分别由 budgetChanges / centralizedModification 提供
 *  - 发起组织标志 workflow/cbxqsh/getFqzz 由 budgetChanges 宽泛返回 'CITY'
 *  - 导出 xmAttributeConfig/exportXm 由 centralizedModification 宽泛返回样例文件
 *  - 「查看」弹出的 CentralizedModification(flag=VIEW) 弹窗，其 getXmInfo/getTabColumns
 *    由 aiSmartTaskAudit 按 xmId=mock-project- 前缀提供（XQ_ROWS 行 id 命中该前缀）
 *  - sys/appMenu/list?appNo=XQK 已由 centralizedModification 登记（本页只校验 success，
 *    返回数据不渲染），不重复登记以免覆盖
 *
 * 因此本模块只注册「本页独有 / 需按判别值收窄」的接口。
 */
import Mock from 'mockjs'
import { binaryResponse, getQueryValue, success } from '../helpers'
import type { MockOptions } from '../helpers'
import {
  SEARCH_COLUMNS,
  TABLE_COLUMNS,
  XQ_DW_ID,
  XQ_SP_ORG_ID,
  buildSettingRows
} from './centralizedModification/data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** 本页 outsideMenu / menuCode（开发态 mock 专用，与集中修改区分开） */
const BUSICODE = 'XQK-XQLRVIEW'

/** 列表查询配置编码（searchCode），与页面 searchCode ref 默认值一致 */
const SEARCH_CODE = 'XQLR-VIEW'

/** 帮助中心 / getMenuByUrl 返回的菜单 id */
const MENU_ID = 'menu-xqk-xqlrview'

/** 按钮权限：与模板中的 v-permission 一一对应 */
const BUTTONS = ['BTJHXT', 'VIEW', 'EXPORT', 'BATCH_DOWNLOAD_ATTACH', 'PROCESS']

/** 本页角色（getRoleByBusicode 返回裸数组，字段对齐 userDialog changeId / userInfOther 取值） */
const buildRole = () => ({
  id: 'sprole-xqlrview-01',
  name: '需求明细查询员（市公司）',
  code: 'SCWYSZZ',
  role_id: 'role-xqlrview-01',
  specialorgid: XQ_SP_ORG_ID,
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  org_id: XQ_DW_ID,
  org_name: '国网南京供电公司',
  namecode: 'mock_xqlrview_user',
  busicode: BUSICODE
})

// ==================== 登录 / 角色链路 ====================
// userDialog / useUser: getMenuByUrl → getRoleByBusicode → getButtonList → setPermissions
// 三者都按判别值收窄，不与集中修改（CentralizedModification / XQK-XQJZXG）互相覆盖

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*RequireDetailSearch/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  // 返回 id 供 HelpModal 取帮助配置；outsideMenu 供 userDialog/useUser 取按钮权限
  return success({ id: MENU_ID, outsideMenu: BUSICODE, url })
})

Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [buildRole()])

Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success(clone(BUTTONS)))

// ==================== 引导 / 帮助中心（按判别值收窄） ====================

// 引导：返回 false，进入页面不强制拉起 driver 蒙层
Mock.mock(new RegExp(`sysRemind/getRemindFlagByUserId\\?[^#]*moduleKey=RequireDetailSearch(?:&|$)`), 'get', () =>
  success(false)
)
// sysRemind/close、sysRemind/iknow 已由 centralizedModification 宽泛注册，复用

// 帮助中心：按本页 menuId 收窄
Mock.mock(new RegExp(`sys/menuConfig/getConfigByMenuId\\?[^#]*menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success({
    helpInfo: '需求明细查询帮助：可按项目名称 / 编码 / 年度等条件检索需求明细，支持查看、导出、附件批量下载与补推计划系统。',
    status: '1'
  })
)
Mock.mock(new RegExp(`sys/menuConfig/listFj\\?[^#]*menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success([{ fjmc: '需求明细查询操作手册.pdf', uuid: 'help-xqlrview-pdf' }])
)
Mock.mock(/sys\/menuConfig\/downloadFj\?[^#]*uuid=help-xqlrview-pdf/, 'get', () =>
  binaryResponse(new Blob(['需求明细查询操作手册（mock）'], { type: 'application/pdf' }), {
    fileName: '需求明细查询操作手册.pdf'
  })
)

// ==================== 动态查询列 / 表头 / 高级设置（按 searchCode=XQLR-VIEW 收窄） ====================
// 复用集中修改的列结构：查询列的 dyff/ggdm 已对齐 budgetChanges/centralizedModification
// 已注册的级联与批量公共代码接口，无需重复注册即可联动、出选项。

Mock.mock(new RegExp(`xmSearchConfig/getDynamicSearchColumn\\?[^#]*searchCode=${SEARCH_CODE}(?:&|$)`), 'get', () =>
  success(clone(SEARCH_COLUMNS))
)

Mock.mock(new RegExp(`xmSearchConfig/getDynamicTableByUser\\?[^#]*searchCode=${SEARCH_CODE}(?:&|$)`), 'get', () =>
  success(clone(TABLE_COLUMNS))
)

// 高级设置抽屉（DynamicReports → getSearchColumn）：searchType=1 查询条件 / 2 列表列
// updateSearchColumn 由 jointReview/flowQuery 宽泛注册（任意 searchCode 返回成功），此处不重复
Mock.mock(new RegExp(`xmSearchConfig/getSearchColumn\\?[^#]*searchCode=${SEARCH_CODE}(?:&|$)`), 'get', (options: MockOptions) => {
  const searchType = getQueryValue(options.url, 'searchType')
  return success(clone(buildSettingRows(searchType)))
})

// ==================== 单个公共字典（getPublicData → GET /commonCode/getData?code=xx） ====================

// 项目阶段（补推计划系统弹窗的下拉，getPublicData('ZLYS_XMJD')）
Mock.mock(/commonCode\/getData\?[^#]*code=ZLYS_XMJD(?:&|$)/, 'get', () =>
  success([
    { code: 'JD01', name: '需求阶段' },
    { code: 'JD02', name: '可研阶段' },
    { code: 'JD03', name: '初设阶段' },
    { code: 'JD04', name: '施工图阶段' }
  ])
)

// 附件类型（附件批量下载弹窗的下拉，getPublicData('XQLR_VIEW_DOWNLOAD_FJTYPE')）
Mock.mock(/commonCode\/getData\?[^#]*code=XQLR_VIEW_DOWNLOAD_FJTYPE(?:&|$)/, 'get', () =>
  success([
    { code: 'FJ01', name: '可研报告' },
    { code: 'FJ02', name: '评审意见' },
    { code: 'FJ03', name: '批复文件' },
    { code: 'FJ04', name: '其他附件' }
  ])
)

// ==================== 参数配置（getParamConfig → GET /workflow/declare/getParamValue?paramKey=xx） ====================

// 附件批量下载单次最大项目数（getMaxDownloadNum → maxDownloadNum）
Mock.mock(/workflow\/declare\/getParamValue\?[^#]*paramKey=XQLR_VIEW_BXPORT_MAX_NUM(?:&|$)/, 'get', () =>
  success('100')
)

// ==================== 附件批量下载（exportXmAttach） ====================
// exportXm（列表导出）已由 centralizedModification 宽泛注册，此处只补附件批量下载。
// 返回二进制流 + content-disposition，页面按 res.headers 取文件名（见 http.ts blob 处理）。

Mock.mock(/xmAttributeConfig\/exportXmAttach(\?.*)?$/, 'post', () =>
  binaryResponse(new Blob(['需求明细项目附件打包（mock）'], { type: 'application/zip' }), {
    fileName: '项目附件.zip'
  })
)

// ==================== 补推计划系统（reSendToJhxt） ====================

Mock.mock(/workflow\/cbxqsh\/reSendToJhxt(\?.*)?$/, 'post', () => success(true, '推送成功'))
