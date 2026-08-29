// 联合会审会议管理（lhhsMeeting/*）+ 评审分工 / 开启关闭评审 / 组长信息
// 覆盖：会议 CRUD、发布、待/已纳入项目与专家、评审分工、组长终评相关接口。
import Mock from 'mockjs'
import { pageResult, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import { MEETING_EXPERTS, PENDING_MEETING_EXPERTS, buildMeetingManageList, buildMeetingProjectRows } from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const includesText = (value: unknown, keyword: unknown) => !keyword || String(value ?? '').includes(String(keyword))

// 会议管理列表会在本地被写操作改动（发布 / 删除 / 新建），用可变副本保持会话内自洽。
const meetingStore = buildMeetingManageList()

const filterMeetings = (body: Record<string, any>) =>
  meetingStore.filter((m) => {
    return (
      includesText(m.meetingName, body.meetingName) &&
      includesText(m.meetingCode, body.meetingCode) &&
      (!body.status || m.status === String(body.status)) &&
      (!body.major || String(m.major || '').includes(String(body.major))) &&
      includesText(m.organizer, body.organizer) &&
      includesText(m.meetingAddr, body.meetingAddr)
    )
  })

// ==================== 会议 CRUD / 发布 ====================

Mock.mock(/lhhsMeeting\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(clone(filterMeetings(body)), body.page || body.current || 1, body.limit || body.size || 20))
})

Mock.mock(/lhhsMeeting\/getMeetingCode(\?.*)?$/, 'get', () => success(`LHHS-MOCK-${Date.now().toString().slice(-6)}`))

Mock.mock(/lhhsMeeting\/addOrUpdateMeeting(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  if (body.meetingId) {
    const idx = meetingStore.findIndex((m) => m.meetingId === body.meetingId)
    if (idx >= 0) {
      meetingStore[idx] = { ...meetingStore[idx], ...body }
    }
  } else {
    const meetingId = `meeting-new-${meetingStore.length + 1}`
    meetingStore.unshift({
      meetingId,
      meetingCode: body.meetingCode || `LHHS-NEW-${meetingStore.length + 1}`,
      meetingName: body.meetingName || '新建联合会审会议',
      status: '00',
      statusName: '即将开始',
      bmName: '财务部',
      psms: body.psms || '',
      pspcName: '',
      meetingAddr: body.meetingAddr || '',
      organizer: body.organizer || '',
      phone: body.phone || '',
      yslyName: body.yslyName || '省级统筹',
      nd: String(new Date().getFullYear()),
      pspcId: body.pspcId || '',
      zgkbmId: body.zgkbmId || 'gkbm-001',
      zgkbmName: '财务部',
      startTime: body.startTime || '',
      endTime: body.endTime || '',
      major: body.major || 'CW',
      majorName: body.majorName || '财务',
      xmNum: '0',
      sumJe: 0,
      zjNum: '0',
      lhhsOneStartTime: body.lhhsOneStartTime || '',
      lhhsOneEndTime: body.lhhsOneEndTime || ''
    } as any)
  }
  return success(true, '保存成功')
})

Mock.mock(/lhhsMeeting\/publish(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids: string[] = body.ids || []
  ids.forEach((id) => {
    const hit = meetingStore.find((m) => m.meetingId === id)
    if (hit) {
      hit.status = '01'
      hit.statusName = '评审中'
    }
  })
  return success(true, '发布成功')
})

Mock.mock(/lhhsMeeting\/canclePublish(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids: string[] = body.ids || []
  ids.forEach((id) => {
    const hit = meetingStore.find((m) => m.meetingId === id)
    if (hit) {
      hit.status = '00'
      hit.statusName = '即将开始'
    }
  })
  return success(true, '取消发布成功')
})

Mock.mock(/lhhsMeeting\/delete(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids: string[] = body.ids || []
  ids.forEach((id) => {
    const idx = meetingStore.findIndex((m) => m.meetingId === id)
    if (idx >= 0) meetingStore.splice(idx, 1)
  })
  return success(true, '删除成功')
})

// ==================== 待 / 已纳入 项目与专家 ====================

const filterProjects = (list: ReturnType<typeof buildMeetingProjectRows>, body: Record<string, any>) =>
  list.filter((p) => {
    return (
      includesText(p.xmmc, body.xmmc) &&
      includesText(p.xmbm, body.xmbm) &&
      (!body.yjdw || p.yjdw === body.yjdw || p.yjdwName === body.yjdw) &&
      (!body.ejdw || p.ejdw === body.ejdw) &&
      (!body.xmlx || includesText(p.proType, body.xmlx))
    )
  })

const filterExperts = (list: typeof MEETING_EXPERTS, body: Record<string, any>) =>
  list.filter((e) => {
    return (
      includesText(e.expertName, body.expertName) &&
      includesText(e.account, body.account) &&
      (!body.yjdw || e.yjdw === body.yjdw || e.yjdwName === body.yjdw)
    )
  })

Mock.mock(/lhhsMeeting\/getYnrhsxmPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const meetingId = String(body.meetingId || meetingStore[0]?.meetingId || 'meeting-001')
  // 已纳入：取前一半项目
  const all = buildMeetingProjectRows(meetingId)
  const linked = all.slice(0, Math.ceil(all.length / 2))
  return success(pageResult(clone(filterProjects(linked, body)), body.page || body.current || 1, body.limit || body.size || 20))
})

Mock.mock(/lhhsMeeting\/getDnrhsxmPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const meetingId = String(body.meetingId || meetingStore[0]?.meetingId || 'meeting-001')
  const all = buildMeetingProjectRows(meetingId)
  const pending = all.slice(Math.ceil(all.length / 2))
  return success(pageResult(clone(filterProjects(pending, body)), body.page || body.current || 1, body.limit || body.size || 20))
})

Mock.mock(/lhhsMeeting\/getYnrhszjPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(clone(filterExperts(MEETING_EXPERTS, body)), body.page || body.current || 1, body.limit || body.size || 20))
})

Mock.mock(/lhhsMeeting\/getDnrhszjPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(
    pageResult(clone(filterExperts(PENDING_MEETING_EXPERTS, body)), body.page || body.current || 1, body.limit || body.size || 20)
  )
})

// 写入类：保存/删除项目与专家（成功即可，不持久化到本地 store，避免跨会话状态膨胀）
const ok = (msg = '操作成功') => success(true, msg)

Mock.mock(/lhhsMeeting\/saveXm(\?.*)?$/, 'post', () => ok('纳入项目成功'))
Mock.mock(/lhhsMeeting\/saveXmWhenPsz(\?.*)?$/, 'post', () => ok('纳入项目成功'))
Mock.mock(/lhhsMeeting\/saveZj(\?.*)?$/, 'post', () => ok('纳入专家成功'))
Mock.mock(/lhhsMeeting\/deleteYnrxm(\?.*)?$/, 'post', () => ok('删除项目成功'))
Mock.mock(/lhhsMeeting\/deleteYnrzj(\?.*)?$/, 'post', () => ok('删除专家成功'))
Mock.mock(/lhhsMeeting\/deleteYnrxmWhenPsz(\?.*)?$/, 'post', () => ok('删除项目成功'))
Mock.mock(/lhhsMeeting\/deleteYnrzjWhenPsz(\?.*)?$/, 'post', () => ok('删除专家成功'))
Mock.mock(/lhhsMeeting\/setLeader(\?.*)?$/, 'post', () => ok('设置组长成功'))
Mock.mock(/lhhsMeeting\/resetLeader(\?.*)?$/, 'post', () => ok('重置组长成功'))
Mock.mock(/lhhsMeeting\/importExpertReviewOpinion(\?.*)?$/, 'post', () => ok('意见导入成功'))
Mock.mock(/lhhsMeeting\/updateIsMemberReviewWhenAllExpertReviewed(\?.*)?$/, 'post', () => ok('更新成功'))

// 导出 / 模板下载：返回可被前端下载逻辑接受的假 blob 文本
const mockExportBlob = () => 'mock-export-content'

Mock.mock(/lhhsMeeting\/exportYnrzj(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/lhhsMeeting\/exportYnrxm(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/lhhsMeeting\/getExpertReviewOpinionImportTemplate(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/lhhsMeeting\/getExpertReviewOpinionImportTemplate(\?.*)?$/, 'get', () => mockExportBlob())

// 附件下载（专家入口页会议附件）
Mock.mock(/sjtc\/lhhs\/meeting\/downloadAttach(\?.*)?$/, 'post', () => success({ url: '', fileName: '会议通知.pdf' }, '下载成功'))

// ==================== 评审分工 / 开启关闭评审 / 组长信息 ====================

Mock.mock(/lhhsProjectAllocate\/psfg(\?.*)?$/, 'post', () => ok('评审分工设置成功'))
Mock.mock(/leaderReview\/startReview(\?.*)?$/, 'post', () => ok('开启评审成功'))
Mock.mock(/leaderReview\/closeReview(\?.*)?$/, 'post', () => ok('关闭评审成功'))

// 根据会议 ID 取组长（management.vue 进入项目清单前）
Mock.mock(/xmExpert\/getLeaderByMeetingId(\?.*)?$/, 'get', () => success(clone(MEETING_EXPERTS[0])))

// 组长终评——是否可评 / 是否可退回（data.success 结构）
Mock.mock(/leaderReview\/canLeaderReview(\?.*)?$/, 'post', () => success({ success: true, msg: '' }))
Mock.mock(/leaderReview\/canLeaderReviewTh(\?.*)?$/, 'post', () => success({ success: true, msg: '' }))
Mock.mock(/leaderReview\/saveLeaderReviewRecord(\?.*)?$/, 'post', () => ok('保存组长评审意见成功'))
Mock.mock(/leaderReview\/saveLeaderReviewRecordNew(\?.*)?$/, 'post', () => ok('批量保存成功'))
Mock.mock(/leaderReview\/leaderReviewTh(\?.*)?$/, 'post', () => ok('退回成功'))
Mock.mock(/leaderReview\/getExpertReviewReason(\?.*)?$/, 'post', () =>
  success([
    { major: '财务', reasonList: ['预算编制合规，资金安排合理。'] },
    { major: '技术', reasonList: ['技术方案可行，建设规模匹配。'] },
    { major: '发展', reasonList: ['建议补充与上级规划的衔接说明。'] }
  ])
)

// 模板 / 导入 / 导出（组长 / 专家清单）—— 二进制导出接口返回假内容即可
Mock.mock(/leaderReview\/getLeaderReviewRecordImportTemplate(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/leaderReview\/importLeaderReviewRecord(\?.*)?$/, 'post', () => ok('导入成功'))
Mock.mock(/leaderReview\/exportXmInfo(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/expertReview\/exportXmInfo(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/expertReview\/exportXmAttach(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/expertReview\/getExpertReviewRecordImportTemplate(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/expertReview\/importExpertReviewRecordForSjtc(\?.*)?$/, 'post', () => ok('导入成功'))

// 意见汇总导出 / 模板
Mock.mock(/lhhsXmReviewOpinionStat\/exportData(\?.*)?$/, 'post', () => mockExportBlob())
Mock.mock(/lhhsXmReviewOpinionStat\/getImportTemplate(\?.*)?$/, 'post', () => mockExportBlob())

// 佐证附件下载（uuid 命中本模块 attach- / zz-attach- 前缀时）
Mock.mock(/xmAttributeConfig\/downloadAttach\?[^#]*uuid=(?:attach-|zz-attach-)/, 'get', () => mockExportBlob())
Mock.mock(/xmAttributeConfig\/downloadAttach\?[^#]*uuid=(?:attach-|zz-attach-)/, 'post', () => mockExportBlob())
