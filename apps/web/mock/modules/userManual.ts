/**
 * 用户手册 mock。
 *
 * 首页「用户手册」卡片与顶栏「用户手册」入口共用 HelpModal（menuUrl=/mainPage），
 * 链路：sys/menu/getMenuByUrl → sys/menuConfig/getConfigByMenuId / listFj → downloadFj
 *
 * 已注册接口：
 * - GET sys/menu/getMenuByUrl?url=/mainPage          首页菜单信息（返回菜单 id 供后续接口取配置）
 * - GET sys/menuConfig/getConfigByMenuId?menuId=...  帮助配置（status 需为 '1'，手册列表才可见）
 * - GET sys/menuConfig/listFj?menuId=...             用户手册附件列表
 * - GET sys/menuConfig/downloadFj?uuid=manual-...    手册下载（返回 mock 占位内容）
 */
import Mock from 'mockjs'
import { getQueryValue, success, binaryResponse } from '../helpers'
import type { MockOptions } from '../helpers'

/** 帮助中心 / getMenuByUrl 返回的菜单 id */
const MENU_ID = 'menu-user-manual-main'

/** 用户手册附件列表：首页展示最近 5 条，HelpModal「附件下载」页签全量展示 */
const MANUALS = [
  { fjmc: '项目过程管控平台用户操作手册(V1.00.053).pdf', uuid: 'manual-platform' },
  { fjmc: '需求资源库管理操作手册.pdf', uuid: 'manual-xqzyk' },
  { fjmc: '联合会审管理操作手册.docx', uuid: 'manual-lhhs' },
  { fjmc: '项目储备库管理操作手册.pdf', uuid: 'manual-xmcblk' },
  { fjmc: '预算编制与调整操作手册.docx', uuid: 'manual-ysbztz' },
  { fjmc: '预算执行分析操作手册.pdf', uuid: 'manual-yszx' },
  { fjmc: '主数据管理操作手册.pdf', uuid: 'manual-zdsj' }
]

// 菜单：只拦 url=/mainPage（首页）的请求；url 可能被编码为 %2F，不写死分隔符
Mock.mock(/sys\/menu\/getMenuByUrl\?(?:[^#]*&)?url=(?:\/|%2[fF])mainPage(?:&|$)/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ id: MENU_ID, url })
})

// 帮助配置：status 必须为 '1'，否则 HelpModal 与首页手册卡片都不展示附件
Mock.mock(new RegExp(`sys/menuConfig/getConfigByMenuId\\?(?:[^#]*&)?menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success({
    helpInfo:
      '用户手册：汇总平台各业务模块的操作手册，支持单个下载或批量下载。手册随版本更新，使用中如有疑问请联系客服。',
    status: '1'
  })
)

Mock.mock(new RegExp(`sys/menuConfig/listFj\\?(?:[^#]*&)?menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success(MANUALS.map((item) => ({ ...item })))
)

// 下载：按 uuid 前缀统一拦截；fileName 由 GlassDashboard encodeURIComponent 编码，
// HelpModal 传原始值，故解码失败时退回原始串
const contentTypeOf = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (ext === 'doc' || ext === 'docx') return 'application/msword'
  if (ext === 'xls' || ext === 'xlsx') return 'application/vnd.ms-excel'
  return 'application/pdf'
}

Mock.mock(/sys\/menuConfig\/downloadFj\?[^#]*uuid=manual-/, 'get', (options: MockOptions) => {
  const raw = getQueryValue(options.url, 'fileName')
  let fileName = raw || '用户手册'
  try {
    fileName = decodeURIComponent(raw) || fileName
  } catch {
    // fileName 未编码或含裸 %，按原值下载
  }
  return binaryResponse(new Blob([`${fileName}（mock 占位内容）`], { type: contentTypeOf(fileName) }), {
    fileName
  })
})
