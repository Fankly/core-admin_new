// 联合会审入口页（专家预审驾驶舱 zym.ts）—— 专家信息、评审概览、会议列表、待办消息
import Mock from 'mockjs'
import { parseBody, pageResult, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import { EXPERT_MEETINGS, MOCK_EXPERT, MOCK_OVERVIEW } from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// 根据账号登录名获取专家列表（getListPageDataByAccount）—— 返回单条专家，避免"多专家"告警。
// 注意：此接口（xmExpert/getListPageDataByAccount）也被 ai/reviewWorkBench 共用，且无可区分本模块的
// 查询参数（account 是当前登录用户，两处相同），无法收窄。dev 下 reviewWorkBench 也会拿到这条 mock 专家，
// 但返回结构合法（单条 records），不会报错，仅显示为 mock 专家名，属可接受的 dev 副作用。
Mock.mock(/xmExpert\/getListPageDataByAccount(\?.*)?$/, 'post', () => success(pageResult([clone(MOCK_EXPERT)], 1, 10)))

// 评审概览（getPsgl?account=xx）—— account 只有登录后才有，dev 下拦截无副作用
Mock.mock(/psgzt\/getPsgl(\?.*)?$/, 'post', () => success(clone(MOCK_OVERVIEW)))

// 评审会议分页（getMeetingPage）—— 入口页一次性拉全量（limit=10000），直接返回全部
Mock.mock(/psgzt\/getMeetingPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(clone(EXPERT_MEETINGS), body.page || 1, body.limit || 10000))
})

// 待办消息（queryWorkItemsByEmployee）故意不 mock：
// 该接口是 POST、且被 todoTasks.vue 共用，mockjs 只能按 URL 匹配、无法按 workFlowCode 收窄，
// 返回 undefined 也不会透传（会把 todoTasks 的响应变成 undefined）。入口页 workflowMsg 已 try/catch，
// 不 mock 时催办徽标为空，不影响页面主流程。
