// 联合会审驾驶舱统计（main.vue / hyTable / hymxEcharts）
// 覆盖 lhhsStat/*、appMenu（appNo=LHHSK）、省公司权限判定 getCropLimitInfo。
import Mock from 'mockjs'
import { pageResult, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import { registerAppMenu } from '../../shared/appMenu'
import {
  APP_MENU_OPERATION,
  APP_MENU_SEARCH,
  OFFLINE_MEETINGS,
  buildDwStatSeries,
  buildMeetingOverviewStat,
  buildOverviewStat,
  buildYssxProjectRows,
  buildYssxRows
} from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const includesText = (value: unknown, keyword: unknown) => !keyword || String(value ?? '').includes(String(keyword))

// ==================== 概览 / 按单位统计 ====================

Mock.mock(/lhhsStat\/getOverviewData(\?.*)?$/, 'post', () => success(clone(buildOverviewStat())))

Mock.mock(/lhhsStat\/getStatDataByDw(\?.*)?$/, 'post', () => success(clone(buildDwStatSeries())))

Mock.mock(/lhhsStat\/getOverviewDataByMeeting(\?.*)?$/, 'post', () => success(clone(buildMeetingOverviewStat())))

Mock.mock(/lhhsStat\/getStatDataByMeetingDw(\?.*)?$/, 'post', () => success(clone(buildDwStatSeries())))

// ==================== 事项 / 项目穿透分页 ====================

Mock.mock(/lhhsStat\/pageYssxInfo(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const list = buildYssxRows().filter((row) => includesText(row.yssxName, body.yssxName || body.searchParam))
  return success(pageResult(clone(list), body.page || 1, body.limit || 20))
})

Mock.mock(/lhhsStat\/pageXmInfoByYssx(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const list = buildYssxProjectRows().filter(
    (row) => includesText(row.xmmc, body.xmmc || body.searchParam) || includesText(row.xmbm, body.xmbm || body.searchParam)
  )
  return success(pageResult(clone(list), body.page || 1, body.limit || 20))
})

Mock.mock(/lhhsStat\/pageYssxInfoByMeeting(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(clone(buildYssxRows()), body.page || 1, body.limit || 20))
})

Mock.mock(/lhhsStat\/pageXmInfoByMeetingYssx(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(clone(buildYssxProjectRows()), body.page || 1, body.limit || 20))
})

// 会议列表（驾驶舱点"组织会审"弹窗）
Mock.mock(/lhhsStat\/pageMeetingInfo(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const filtered = OFFLINE_MEETINGS.filter((m) => {
    return (
      includesText(m.meetingName, body.meetingName || body.searchParam) &&
      includesText(m.meetingCode, body.meetingCode) &&
      (!body.status || m.status === String(body.status)) &&
      (!body.jhssnd || m.nd === String(body.jhssnd) || m.startTime.startsWith(String(body.jhssnd)))
    )
  })
  return success(pageResult(clone(filtered), body.page || 1, body.limit || 20))
})

// 导出类：返回假内容
const mockExportBlob = () => 'mock-export-content'
Mock.mock(/lhhsStat\/exportYssxInfo(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/lhhsStat\/exportXmInfoByYssx(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/lhhsStat\/exportYssxInfoByMeeting(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/lhhsStat\/exportXmInfoByMeetingYssx(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/lhhsStat\/exportMeetingInfo(\?.*)?$/, 'post', () => mockExportBlob())

// ==================== 驾驶舱菜单（appNo=LHHSK） ====================
// sys/appMenu/list 是 POST、判别值 appNo 在 body 里无法写进正则，
// 统一走 shared/appMenu 分发器登记，避免与其他模块（如 XQK）互相覆盖。

registerAppMenu('LHHSK', (label) => clone(label === '2' ? APP_MENU_SEARCH : APP_MENU_OPERATION))

// ==================== 省公司权限判定（getCropLimitInfo） ====================
// 驾驶舱 main.vue 仅允许 cropFlag=PROVINCE 且 specialorgcode 含 BM_CW 的角色访问。
// 该接口被两库一平台总览共用，无本模块专属判别参数；返回 PROVINCE 对其他调用方也是合法结构。
Mock.mock(/overviewOfTwoRepoAndOnePlatform\/getCropLimitInfo(\?.*)?$/, 'post', () =>
  success({ cropFlag: 'PROVINCE', cropName: '省公司', isUpLimit: true })
)

