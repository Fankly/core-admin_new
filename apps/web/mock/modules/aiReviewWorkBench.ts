/**
 * AI 评审工作台（reviewWorkBench）mock
 * 对应接口：src/api/ai/reviewWorkBench/index.ts → expert-review-workbench/*
 * 页面：src/views/ai/reviewWorkBench/index.vue
 *
 * 注意：
 * - userDialog 入口链路必须按路径/busicode 收窄注册（与 outsourceAdaptList 同模式）
 * - expert-review-workbench/* 为专属 URL，可安全拦截
 * - getListPageDataByAccount 已在 jointReview/entry 注册（dev 下返回 mock 专家张明远）
 * - getAppListPageData / getAppMenuData 为多页面共用接口，mockjs 无法按调用方收窄；
 *   此处仅补充 LHHS_* 应用与菜单，保证评审工作台卡片名称/入口可渲染；
 *   其他调用方拿到的是「含 LHHS 的应用子集」，不会因 undefined 崩溃
 * - 省级会议 meetingId 对齐 jointReview EXPERT_MEETINGS，进入 expertReview 有项目数据
 * - 市级会议 meetingId 对齐 CITY_WORKBENCH_MEETINGS，进入 reviewDeatil 有项目数据
 */
import Mock from 'mockjs'
import { getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'
import {
  CITY_WORKBENCH_MEETINGS,
  EXPERT_BUSICODE,
  EXPERT_MEETINGS,
  OFFLINE_BUSICODE
} from './jointReview/data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const includesText = (value: unknown, keyword: unknown) =>
  !keyword || String(value ?? '').includes(String(keyword))

// ==================== 登录 / 按钮权限链路 ====================
// userDialog：getMenuByUrl → getRoleByBusicode → getButtonList → setPermissions
// 判别值写进正则，避免宽泛拦截污染其他页面

/** 本页 outsideMenu / menuCode（开发态 mock 专用） */
const REVIEW_WORKBENCH_BUSICODE = 'AI-REVIEW-WORKBENCH'
const REVIEW_WORKBENCH_BUTTONS = ['VIEW', 'ENTER_REVIEW', 'EXPORT']

const buildReviewWorkbenchRole = () => ({
  id: `sprole-${REVIEW_WORKBENCH_BUSICODE}`,
  name: '财务预算专职',
  code: 'SCWYSZZ',
  role_id: 'role-ai-review-workbench',
  specialorgid: 'bm-001',
  specialorgname: '财务预算专职',
  // 与 AI 审议意见默认可见部门 BM_CWZC 一致
  specialorgcode: 'BM_CWZC',
  org_id: 'DW001',
  org_name: '国网江苏省电力有限公司',
  namecode: 'mock_expert',
  busicode: REVIEW_WORKBENCH_BUSICODE
})

// 菜单：只拦 url 含 reviewWorkBench 的请求（跳入工作台时 userDialog 依赖 outsideMenu）
Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*reviewWorkBench/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ outsideMenu: REVIEW_WORKBENCH_BUSICODE, url })
})

// 角色：按 busicode 收窄；返回单角色，userDialog 自动确定并继续拉会议数据
Mock.mock(
  new RegExp(`getRoleByBusicode\\?[^#]*busicode=${REVIEW_WORKBENCH_BUSICODE}(?:&|$)`),
  'get',
  () => [buildReviewWorkbenchRole()]
)

// 按钮权限
Mock.mock(
  new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${REVIEW_WORKBENCH_BUSICODE}(?:&|$)`),
  'get',
  () => success(clone(REVIEW_WORKBENCH_BUTTONS))
)

/** 与 hooks/index menuList.code 对齐的应用列表 */
const REVIEW_WORKBENCH_APPS = [
  { id: 'app-lhhs-cjhy', appNo: 'LHHS_CJHY', appName: '创建会议', sort: 1 },
  { id: 'app-lhhs-pshy', appNo: 'LHHS_PSHY', appName: '评审会议', sort: 2 },
  { id: 'app-lhhs-bggl', appNo: 'LHHS_BGGL', appName: '报告管理', sort: 3 }
]

/** 菜单项：字段对齐 handleRequired（name / url / outsideMenu） */
const buildMenuItem = (id: string, name: string, url: string, outsideMenu: string, sort: number) => ({
  id,
  name,
  url,
  outsideMenu,
  sort,
  type: 1,
  isShow: 1,
  isFrame: 0,
  openStyle: 0
})

/**
 * getAppMenuData 结构：data[appNo]['1'|'2'] = 菜单数组
 * '1' 业务操作 / '2' 业务查询（评审工作台合并进 tab）
 */
const REVIEW_WORKBENCH_APP_MENU: Record<string, Record<string, any[]>> = {
  LHHS_CJHY: {
    '1': [buildMenuItem('rwb-cjhy-op-1', '会议创建', '/service/jointReview/meetingManage/index', OFFLINE_BUSICODE, 1)],
    '2': []
  },
  LHHS_PSHY: {
    '1': [
      buildMenuItem('rwb-pshy-op-1', '专家线上预审', '/service/jointReview/expertReview/index', EXPERT_BUSICODE, 1),
      buildMenuItem('rwb-pshy-op-2', '线下会审', '/service/jointReview/offlineReview/index', OFFLINE_BUSICODE, 2)
    ],
    '2': [buildMenuItem('rwb-pshy-q-1', '项目意见汇总', '/service/jointReview/xmOpinionSummary/index', OFFLINE_BUSICODE, 1)]
  },
  LHHS_BGGL: {
    '1': [buildMenuItem('rwb-bggl-op-1', '会议报告', '/ai/meetingReport/index', OFFLINE_BUSICODE, 1)],
    '2': []
  }
}

/** 会议状态：与 hooks/index menuList 及页面标签一致 */
const STATUS_NAME_MAP: Record<string, string> = {
  '00': '即将开始',
  '01': '评审中',
  '02': '已结束'
}

export type ReviewWorkbenchMeeting = {
  meetingId: string
  meetingCode: string
  meetingName: string
  /** 1=省级 2=市级 */
  type: '1' | '2'
  /** 00=即将开始 01=评审中 02=已结束 */
  status: '00' | '01' | '02'
  statusName: string
  startTime: string
  endTime: string
  expertCount: number
  totalCount: number
  reviewedCount: number
  thCount: number
  pendingReviewCount: number
}

/**
 * 评审工作台会议列表
 * - 省级 type=1：meetingId 对齐 EXPERT_MEETINGS，进入 expertReview 有项目
 * - 市级 type=2：meetingId 对齐 CITY_WORKBENCH_MEETINGS，进入 reviewDeatil 有项目
 */
export const REVIEW_WORKBENCH_MEETINGS: ReviewWorkbenchMeeting[] = [
  // —— 省级联合会审（对齐 jointReview EXPERT_MEETINGS） ——
  {
    meetingId: EXPERT_MEETINGS[0].meetingId,
    meetingCode: EXPERT_MEETINGS[0].meetingCode,
    meetingName: '2026年第一批技改大修项目省级联合会审',
    type: '1',
    status: '01',
    statusName: STATUS_NAME_MAP['01'],
    startTime: EXPERT_MEETINGS[0].startTime,
    endTime: EXPERT_MEETINGS[0].endTime,
    expertCount: 8,
    totalCount: EXPERT_MEETINGS[0].totalCount,
    reviewedCount: EXPERT_MEETINGS[0].reviewedCount,
    thCount: EXPERT_MEETINGS[0].thCount,
    pendingReviewCount: EXPERT_MEETINGS[0].pendingReviewCount
  },
  {
    meetingId: EXPERT_MEETINGS[1].meetingId,
    meetingCode: EXPERT_MEETINGS[1].meetingCode,
    meetingName: '2026年第二批基建项目省级联合会审',
    type: '1',
    status: '00',
    statusName: STATUS_NAME_MAP['00'],
    startTime: EXPERT_MEETINGS[1].startTime,
    endTime: EXPERT_MEETINGS[1].endTime,
    expertCount: 6,
    totalCount: EXPERT_MEETINGS[1].totalCount,
    reviewedCount: EXPERT_MEETINGS[1].reviewedCount,
    thCount: EXPERT_MEETINGS[1].thCount,
    pendingReviewCount: EXPERT_MEETINGS[1].pendingReviewCount
  },
  {
    meetingId: EXPERT_MEETINGS[2].meetingId,
    meetingCode: EXPERT_MEETINGS[2].meetingCode,
    meetingName: '2025年第四季度收尾项目省级联合会审',
    type: '1',
    status: '02',
    statusName: STATUS_NAME_MAP['02'],
    startTime: EXPERT_MEETINGS[2].startTime,
    endTime: EXPERT_MEETINGS[2].endTime,
    expertCount: 10,
    totalCount: EXPERT_MEETINGS[2].totalCount,
    reviewedCount: EXPERT_MEETINGS[2].reviewedCount,
    thCount: EXPERT_MEETINGS[2].thCount,
    pendingReviewCount: EXPERT_MEETINGS[2].pendingReviewCount
  },
  // —— 市级联合会审（对齐 CITY_WORKBENCH_MEETINGS，项目数据在 jointReview/data 生成） ——
  {
    meetingId: CITY_WORKBENCH_MEETINGS[0].meetingId,
    meetingCode: CITY_WORKBENCH_MEETINGS[0].meetingCode,
    meetingName: CITY_WORKBENCH_MEETINGS[0].meetingName,
    type: '2',
    status: CITY_WORKBENCH_MEETINGS[0].status,
    statusName: STATUS_NAME_MAP[CITY_WORKBENCH_MEETINGS[0].status],
    startTime: CITY_WORKBENCH_MEETINGS[0].startTime,
    endTime: CITY_WORKBENCH_MEETINGS[0].endTime,
    expertCount: CITY_WORKBENCH_MEETINGS[0].expertCount,
    totalCount: CITY_WORKBENCH_MEETINGS[0].totalCount,
    reviewedCount: CITY_WORKBENCH_MEETINGS[0].reviewedCount,
    thCount: CITY_WORKBENCH_MEETINGS[0].thCount,
    pendingReviewCount: CITY_WORKBENCH_MEETINGS[0].pendingReviewCount
  },
  {
    meetingId: CITY_WORKBENCH_MEETINGS[1].meetingId,
    meetingCode: CITY_WORKBENCH_MEETINGS[1].meetingCode,
    meetingName: CITY_WORKBENCH_MEETINGS[1].meetingName,
    type: '2',
    status: CITY_WORKBENCH_MEETINGS[1].status,
    statusName: STATUS_NAME_MAP[CITY_WORKBENCH_MEETINGS[1].status],
    startTime: CITY_WORKBENCH_MEETINGS[1].startTime,
    endTime: CITY_WORKBENCH_MEETINGS[1].endTime,
    expertCount: CITY_WORKBENCH_MEETINGS[1].expertCount,
    totalCount: CITY_WORKBENCH_MEETINGS[1].totalCount,
    reviewedCount: CITY_WORKBENCH_MEETINGS[1].reviewedCount,
    thCount: CITY_WORKBENCH_MEETINGS[1].thCount,
    pendingReviewCount: CITY_WORKBENCH_MEETINGS[1].pendingReviewCount
  },
  {
    meetingId: CITY_WORKBENCH_MEETINGS[2].meetingId,
    meetingCode: CITY_WORKBENCH_MEETINGS[2].meetingCode,
    meetingName: CITY_WORKBENCH_MEETINGS[2].meetingName,
    type: '2',
    status: CITY_WORKBENCH_MEETINGS[2].status,
    statusName: STATUS_NAME_MAP[CITY_WORKBENCH_MEETINGS[2].status],
    startTime: CITY_WORKBENCH_MEETINGS[2].startTime,
    endTime: CITY_WORKBENCH_MEETINGS[2].endTime,
    expertCount: CITY_WORKBENCH_MEETINGS[2].expertCount,
    totalCount: CITY_WORKBENCH_MEETINGS[2].totalCount,
    reviewedCount: CITY_WORKBENCH_MEETINGS[2].reviewedCount,
    thCount: CITY_WORKBENCH_MEETINGS[2].thCount,
    pendingReviewCount: CITY_WORKBENCH_MEETINGS[2].pendingReviewCount
  },
  {
    meetingId: CITY_WORKBENCH_MEETINGS[3].meetingId,
    meetingCode: CITY_WORKBENCH_MEETINGS[3].meetingCode,
    meetingName: CITY_WORKBENCH_MEETINGS[3].meetingName,
    type: '2',
    status: CITY_WORKBENCH_MEETINGS[3].status,
    statusName: STATUS_NAME_MAP[CITY_WORKBENCH_MEETINGS[3].status],
    startTime: CITY_WORKBENCH_MEETINGS[3].startTime,
    endTime: CITY_WORKBENCH_MEETINGS[3].endTime,
    expertCount: CITY_WORKBENCH_MEETINGS[3].expertCount,
    totalCount: CITY_WORKBENCH_MEETINGS[3].totalCount,
    reviewedCount: CITY_WORKBENCH_MEETINGS[3].reviewedCount,
    thCount: CITY_WORKBENCH_MEETINGS[3].thCount,
    pendingReviewCount: CITY_WORKBENCH_MEETINGS[3].pendingReviewCount
  }
]

/** 按 search / type / status 过滤会议 */
const filterMeetings = (body: Record<string, any>): ReviewWorkbenchMeeting[] => {
  const search = body.search
  const type = body.type == null ? '' : String(body.type)
  const status = body.status == null ? '' : String(body.status)

  return REVIEW_WORKBENCH_MEETINGS.filter((m) => {
    const matchSearch =
      includesText(m.meetingName, search) || includesText(m.meetingCode, search)
    const matchType = !type || m.type === type
    const matchStatus = !status || m.status === status
    return matchSearch && matchType && matchStatus
  })
}

/**
 * 评审统计：字段与 hooks/index statItems.code 对齐
 * cyhy=参与会议数 yjshy=已结束 pszhy=评审中 jjkshy=即将开始
 */
const buildReviewStat = () => {
  const cyhy = REVIEW_WORKBENCH_MEETINGS.length
  const yjshy = REVIEW_WORKBENCH_MEETINGS.filter((m) => m.status === '02').length
  const pszhy = REVIEW_WORKBENCH_MEETINGS.filter((m) => m.status === '01').length
  const jjkshy = REVIEW_WORKBENCH_MEETINGS.filter((m) => m.status === '00').length
  return { cyhy, yjshy, pszhy, jjkshy }
}

/** 按类型统计数量（含全部 ''） */
const buildCountByType = (search?: string) => {
  const list = REVIEW_WORKBENCH_MEETINGS.filter(
    (m) => includesText(m.meetingName, search) || includesText(m.meetingCode, search)
  )
  return [
    { code: '', count: list.length },
    { code: '2', count: list.filter((m) => m.type === '2').length },
    { code: '1', count: list.filter((m) => m.type === '1').length }
  ]
}

/** 按状态统计数量（可叠加 type / search 过滤，含全部 ''） */
const buildCountByStatus = (search?: string, type?: string) => {
  const typeFilter = type == null ? '' : String(type)
  const list = REVIEW_WORKBENCH_MEETINGS.filter((m) => {
    const matchSearch =
      includesText(m.meetingName, search) || includesText(m.meetingCode, search)
    const matchType = !typeFilter || m.type === typeFilter
    return matchSearch && matchType
  })
  return [
    { code: '', count: list.length },
    { code: '00', count: list.filter((m) => m.status === '00').length },
    { code: '01', count: list.filter((m) => m.status === '01').length },
    { code: '02', count: list.filter((m) => m.status === '02').length }
  ]
}

// ==================== 接口注册 ====================

// 应用列表（sys/app/getListPageData）—— 共用接口，无判别参数可收窄。
// 返回 LHHS_* 三应用，保证 reviewWorkBench 卡片能取到 appName。
Mock.mock(/sys\/app\/getListPageData(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(clone(REVIEW_WORKBENCH_APPS), body.page || 1, body.limit || 100))
})

// 应用菜单（sys/appMenu/getAppMenuData）—— 共用接口；仅补 LHHS_* 节点，其他 appNo 访问为 undefined（调用方需自带兜底）
Mock.mock(/sys\/appMenu\/getAppMenuData(\?.*)?$/, 'get', () => success(clone(REVIEW_WORKBENCH_APP_MENU)))

// 获取会议数量（按会议类型统计）
Mock.mock(/expert-review-workbench\/getMeetingCountByType(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(clone(buildCountByType(body.search)))
})

// 获取会议数量（按会议状态统计）
Mock.mock(/expert-review-workbench\/getMeetingCountByStatus(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(clone(buildCountByStatus(body.search, body.type)))
})

// 分页查询会议
Mock.mock(/expert-review-workbench\/getMeetingPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const list = filterMeetings(body)
  return success(pageResult(clone(list), body.page || 1, body.limit || 100))
})

// 获取评审统计
Mock.mock(/expert-review-workbench\/getReviewStat(\?.*)?$/, 'post', () => success(clone(buildReviewStat())))
