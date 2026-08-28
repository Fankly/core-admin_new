// 联合会审流转情况查询（reviewFlowQuery）
// 覆盖：动态查询列、动态表头、分页、穿透、导出；查询列配置读写（searchCode=LHHS-LZQK）。
import Mock from 'mockjs'
import { pageResult, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import { FLOW_SEARCH_COLUMNS, FLOW_TABLE_COLUMNS, buildFlowCtRows, buildFlowQueryRows } from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const includesText = (value: unknown, keyword: unknown) => !keyword || String(value ?? '').includes(String(keyword))

// 动态查询列（仅拦 searchCode=LHHS-LZQK，避免污染其他页面的查询配置）
Mock.mock(/xmSearchConfig\/getDynamicSearchColumn\?[^#]*searchCode=LHHS-LZQK/, 'get', () => success(clone(FLOW_SEARCH_COLUMNS)))

// 用户查询列配置读写（高级设置弹窗）
Mock.mock(/xmSearchConfig\/getSearchColumn\?[^#]*searchCode=LHHS-LZQK/, 'get', () => success(clone(FLOW_SEARCH_COLUMNS)))
Mock.mock(/xmSearchConfig\/updateSearchColumn(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  // 仅在本模块 searchCode 时放行成功；其他 searchCode 也返回成功（结构通用，不破坏其他页面）
  if (body.searchCode && body.searchCode !== 'LHHS-LZQK') {
    return success(true, '保存成功')
  }
  return success(true, '查询条件保存成功')
})

// 动态表头
Mock.mock(/lhhs\/lzqk\/getDynamicColumn(\?.*)?$/, 'get', () => success(clone(FLOW_TABLE_COLUMNS)))

// 分页列表
Mock.mock(/lhhs\/lzqk\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const filtered = buildFlowQueryRows().filter((row) => {
    return (
      includesText(row.meeting_name, body.meetingName) &&
      includesText(row.meeting_code, body.meetingCode) &&
      (!body.status || row.status === String(body.status)) &&
      (!body.nd || row.nd === String(body.nd))
    )
  })
  return success(pageResult(clone(filtered), body.page || 1, body.limit || 20))
})

// 穿透明细
Mock.mock(/lhhs\/lzqk\/getCtData(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const meetingId = String(body.meeting_id || body.meetingId || 'meeting-001')
  const rows = buildFlowCtRows(meetingId)
  return success(pageResult(clone(rows), body.page || 1, body.limit || 100))
})

// 导出
Mock.mock(/lhhs\/lzqk\/exportMeetingData(\?.*)?$/, 'post', () => 'mock-export-content')
