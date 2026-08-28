// 联合会审 —— 公共代码字典、组织信息、全局登录链路
//
// 重要：mockjs 1.1.0 没有"逐请求透传"能力。一旦某个 URL 命中已注册的正则，
// 该请求就被拦截（xhr.js: open() 里置 this.match = true），handler 返回 undefined
// 也不会回退到真实后端，只会得到一个 undefined 响应体。
// 因此对 commonCode/getData、getRoleByBusicode、getButtonList、getMenuByUrl 这类
// 被【所有模块】共用的接口，绝不能用宽泛正则拦截，必须把判别值（code / busicode /
// menuCode / 页面路径）写进正则本身，让 mockjs 只匹配到联合会审自己的 URL，
// 其余请求正则不命中 => 自动走真实后端。（与 aiSmartTaskAudit.ts 的按 code 拦截同理）
import Mock from 'mockjs'
import { getQueryValue, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import {
  BUTTON_PERMISSIONS,
  COMMON_CODE_MAP,
  EJDW_MAP,
  EXPERT_BUSICODE,
  GKBM_LIST,
  JOINT_REVIEW_BUSICODES,
  OFFLINE_BUSICODE,
  OFFLINE_RETURN_BUSICODE,
  REVIEW_BATCHES,
  ROLE_MOCK_BUSICODES,
  YJDW_LIST,
  buildRole
} from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// ==================== 公共代码字典（按 code 逐个注册，只拦本模块用到的 code） ====================
Object.entries(COMMON_CODE_MAP).forEach(([code, data]) => {
  Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${code}(?:&|$)`), 'get', () => success(clone(data)))
})

// ==================== 全局登录链路（判别值写进正则，收窄到本模块） ====================

// 菜单信息：只拦 url 参数里含 jointReview 页面路径的请求（url 经过编码，但 'jointReview' 字面保留）。
// outsideMenu 需按具体页面回不同 busicode（注意 offlineReviewReturn 要在 offlineReview 之前判断）。
Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*jointReview/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  let outsideMenu = ''
  if (url.includes('expertReview')) outsideMenu = EXPERT_BUSICODE
  else if (url.includes('offlineReviewReturn')) outsideMenu = OFFLINE_RETURN_BUSICODE
  else if (url.includes('offlineReview')) outsideMenu = OFFLINE_BUSICODE
  return success({ outsideMenu, url })
})

// 按 busicode 取角色（返回裸数组）—— 每个 busicode 单独注册，非名单内 busicode 正则不命中即透传。
// 含 MBZKZPLXG（目标库审批等），角色名为「财务预算专职」。
ROLE_MOCK_BUSICODES.forEach((code) => {
  Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${code}(?:&|$)`), 'get', () => [buildRole(code)])
})

// 按钮权限 —— 每个 menuCode 单独注册。
JOINT_REVIEW_BUSICODES.forEach((code) => {
  Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${code}(?:&|$)`), 'get', () => success(BUTTON_PERMISSIONS[code] || []))
})

// ==================== 组织信息 ====================
// 说明：getYjdwData / getSubProtypeTree 无本模块专属判别参数，dev 下会对所有调用方生效；
// 返回的是通用参考数据（单位、项目类型树），不会像 undefined 那样破坏其他模块渲染。
// 其余带判别参数（bmId / parentId / spOrgId）的接口都收窄到本模块的 mock 主键。

// 一级单位
Mock.mock(/xmExpert\/getYjdwData(\?.*)?$/, 'get', () => success(clone(YJDW_LIST)))

// 一级单位（会议管理弹窗 getYjdwFromCm，与 getYjdwData 同源）
Mock.mock(/commonCode\/getYjdwFromCm(\?.*)?$/, 'get', () => success(clone(YJDW_LIST)))

// 二级单位（只拦 parentId 为本模块 mock 单位码的请求）
Object.keys(EJDW_MAP).forEach((parentId) => {
  Mock.mock(new RegExp(`xmExpert/getEjdwData\\?[^#]*parentId=${parentId}(?:&|$)`), 'get', () => success(clone(EJDW_MAP[parentId])))
})

// 注意：getCommonCodeByParentCode 是 POST，判别值在 body.parentCode，无法写进正则收窄。
// mockjs 命中即拦截、不能透传，因此这里不 mock，避免污染其他模块的二级单位联动。
// 会议管理弹窗在真实后端不可用时二级单位为空，不影响主流程。

// 部门信息（收窄到 bmId=bm-001；code 与 buildRole.specialorgcode / AI 审议可见部门一致）
Mock.mock(/bizOrgTree\/getBmInfoByBmId\?[^#]*bmId=bm-001(?:&|$)/, 'get', () => success({ name: '财务预算专职', code: 'BM_CWZC' }))

// 单位+部门信息（线下会审角色判定用，收窄到 bmId=bm-001）
Mock.mock(/common\/specialorg\/getDwAndBmInfo\?[^#]*bmId=bm-001(?:&|$)/, 'get', () =>
  success({ orgFlag: 'PROVINCE', bmxz: 'BM_CWZC', roleCode: 'SCWYSZZ' })
)

// 项目类型子树（高级查询用）
Mock.mock(/protypeTree\/getSubProtypeTree(\?.*)?$/, 'get', () =>
  success([
    {
      id: 'PT02',
      middleId: 'PT02',
      name: '技改项目',
      children: [
        { id: 'PT0201', middleId: 'PT0201', name: '配网技改' },
        { id: 'PT0202', middleId: 'PT0202', name: '变电技改' }
      ]
    },
    { id: 'PT01', middleId: 'PT01', name: '基建项目', children: [] }
  ])
)

// 省专业归口部门（年度/批次/归口部门联动查询使用）
Mock.mock(/commonCode\/getGkbmInProvince(\?.*)?$/, 'post', () => success(clone(GKBM_LIST)))

// 完整评审批次列表，按年度筛选；dwId / bmId 仅用于权限上下文，不改变本地样例数据。
Mock.mock(/lhhs\/pspc\/getList(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const list = body.nd ? REVIEW_BATCHES.filter((item) => item.nd === String(body.nd)) : REVIEW_BATCHES
  return success(clone(list))
})

// 发起组织标志（getFqzz）—— 收窄到 spOrgId=bm-001
Mock.mock(/workflow\/cbxqsh\/getFqzz\?[^#]*spOrgId=bm-001(?:&|$)/, 'post', () => success('PROVINCE'))
