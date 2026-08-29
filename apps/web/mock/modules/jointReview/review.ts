// 联合会审线下会审 / 线下会审退回清单页（offlineReview & offlineReviewReturn, psy.ts）
//
// 共用接口（pageExpertReviewInfo / pageXmHistoryReviewRecord / getReviewStage）已在 expert.ts 注册，
// 本文件只注册线下会审独有的接口。
import Mock from 'mockjs'
import { pageResult, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import { OFFLINE_MEETINGS, getProjectsByMeeting } from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const includesText = (value: unknown, keyword: unknown) => !keyword || String(value ?? '').includes(String(keyword))

// ==================== 线下会审入口会议列表（pageSjtcMeetingInfo） ====================
// offlineReview / offlineReviewReturn 入口页共用；支持 meetingName / meetingCode / status 过滤
Mock.mock(/leaderReview\/pageSjtcMeetingInfo(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const filtered = OFFLINE_MEETINGS.filter((m) => {
    const meetingStartDate = m.startTime.slice(0, 10)
    const matchDateBegin = !body.startTimeBegin || meetingStartDate >= String(body.startTimeBegin)
    const matchDateEnd = !body.startTimeEnd || meetingStartDate <= String(body.startTimeEnd)
    return (
      includesText(m.meetingName, body.meetingName) &&
      includesText(m.meetingCode, body.meetingCode) &&
      (!body.status || m.status === String(body.status)) &&
      (!body.nd || m.nd === String(body.nd)) &&
      (!body.pspcId || m.pspcId === String(body.pspcId)) &&
      (!body.zgkbmId || m.zgkbmId === String(body.zgkbmId)) &&
      matchDateBegin &&
      matchDateEnd
    )
  })
  return success(pageResult(clone(filtered), body.page || 1, body.limit || 20))
})

// ==================== 会审项目列表（leaderReview/pageXmInfo） ====================
// params: leaderReviewStatus('0'待会审/'1'已会审)、meetingId、page、limit、searchParam
Mock.mock(/leaderReview\/pageXmInfo(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const all = getProjectsByMeeting(body.meetingId)
  const filtered = all.filter((p) => {
    const matchStatus =
      body.leaderReviewStatus === undefined || body.leaderReviewStatus === '' || p.leaderReviewStatus === String(body.leaderReviewStatus)
    const matchSearch = !body.searchParam || includesText(p.xmbm, body.searchParam) || includesText(p.xmmc, body.searchParam)
    return matchStatus && matchSearch
  })
  return success(pageResult(clone(filtered), body.page || 1, body.limit || 100))
})

// ==================== 退回校验（canLeaderReviewThForSjtc） ====================
// 两个页面对返回结构的读法不同：
//   offlineReview 读 res.success；offlineReviewReturn 读 res.data.success / res.data.msg。
// 同时满足：外层 success=true 且 data.success=true、data.msg=''（无拦截、无告警）。
Mock.mock(/leaderReview\/canLeaderReviewThForSjtc(\?.*)?$/, 'post', () => success({ success: true, msg: '' }))

// ==================== 退回（leaderReviewThForSjtc） ====================
Mock.mock(/leaderReview\/leaderReviewThForSjtc(\?.*)?$/, 'post', () => success(true, '退回成功'))

// ==================== 自动终评（automatedFinalAssessment） ====================
Mock.mock(/leaderReview\/automatedFinalAssessment(\?.*)?$/, 'post', () => success(true, '已自动终评'))

// ==================== 保存线下会审（发展/财务）意见（lhhsXmReviewOpinionStat/saveXxyj） ====================
Mock.mock(/lhhsXmReviewOpinionStat\/saveXxyj(\?.*)?$/, 'post', () => success(true, '保存成功'))

// ==================== 退回信息记录（thxxb/saveOrUpdateTXmThxxb） ====================
// 该接口被多个业务模块共用，但入参/出参通用（list -> 成功），mock 一个成功响应不破坏其他调用方。
Mock.mock(/thxxb\/saveOrUpdateTXmThxxb(\?.*)?$/, 'post', () => success(true))
