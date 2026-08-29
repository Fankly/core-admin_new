// 联合会审项目意见汇总（xmOpinionSummary）—— 会议列表、动态表头、项目意见明细
import Mock from 'mockjs'
import { pageResult, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import { OFFLINE_MEETINGS, buildExpertReviews, getProjectsByMeeting } from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const includesText = (value: unknown, keyword: unknown) => !keyword || String(value ?? '').includes(String(keyword))

const SUMMARY_COLUMNS = [
  { title: '项目编码', field: 'xmbm', minWidth: 150, children: [] },
  { title: '项目名称', field: 'xmmc', minWidth: 220, children: [] },
  { title: '申报单位', field: 'yjdw', minWidth: 180, children: [] },
  {
    title: '单位：万元',
    field: 'amountGroup',
    children: [
      { title: '初始申报金额', field: 'xmgstz_sbys', minWidth: 130, children: [] },
      { title: '审定金额', field: 'xmgstz_sdje', minWidth: 120, children: [] },
      { title: '会审核减', field: 'xmgstz_hshj', minWidth: 120, children: [] }
    ]
  },
  { title: '专家评审意见', field: 'expertReviewOpinion', minWidth: 260, children: [] },
  { title: '线下联合会审意见', field: 'offlineReviewOpinion', minWidth: 260, children: [] }
]

const toAmount = (value: unknown) => Number(value || 0)

const SUMMARY_MEETINGS = OFFLINE_MEETINGS.map((meeting) => {
  const projects = getProjectsByMeeting(meeting.meetingId)
  const declaredAmount = projects.reduce((total, project) => total + toAmount(project.all_invest_tax), 0)
  const approvedAmount = declaredAmount * 0.94
  const reductionAmount = declaredAmount - approvedAmount

  return {
    meetingId: meeting.meetingId,
    meeting_id: meeting.meetingId,
    meeting_code: meeting.meetingCode,
    meeting_name: meeting.meetingName,
    status: meeting.status,
    nd: meeting.nd,
    pspcId: meeting.pspcId,
    pspc_name: meeting.pspcName,
    zgkbmId: meeting.zgkbmId,
    bm_name: meeting.zgkbmName,
    sbje: declaredAmount.toFixed(2),
    nhje: declaredAmount.toFixed(2),
    sdje: approvedAmount.toFixed(2),
    hjje: reductionAmount.toFixed(2),
    hjl: declaredAmount ? ((reductionAmount / declaredAmount) * 100).toFixed(2) : '0.00',
    major_name: meeting.majorName,
    lhhs_one_start_time: meeting.lhhsOneStartTime,
    lhhs_one_end_time: meeting.lhhsOneEndTime,
    lhhs_two_start_time: meeting.startTime,
    lhhs_two_end_time: meeting.endTime
  }
})

const buildSummaryRows = (meetingId: string, showAllReview: boolean) => {
  return getProjectsByMeeting(meetingId).map((project, index) => {
    const reviews = buildExpertReviews(project.xmId)
    const visibleReviews = showAllReview ? reviews : reviews.filter((review) => review.reviewOpinionCode !== '1')
    const declaredAmount = toAmount(project.all_invest_tax)
    const approvedAmount = declaredAmount * (project.fscs > 0 ? 0.9 : 0.96)

    return {
      id: `${meetingId}-summary-${index + 1}`,
      xmbm: project.xmbm,
      xmmc: project.xmmc,
      yjdw: project.yjdw,
      xmgstz_sbys: declaredAmount.toFixed(2),
      xmgstz_sdje: approvedAmount.toFixed(2),
      xmgstz_hshj: (declaredAmount - approvedAmount).toFixed(2),
      expertReviewOpinion: visibleReviews.length
        ? visibleReviews.map((review) => `${review.reviewExpertName}：${review.reviewOpinion}，${review.reviewReason}`).join('\n')
        : '专家意见均为通过',
      offlineReviewOpinion:
        project.fzbReason || project.cwbReason || (project.leaderReviewStatus === '1' ? '线下会审通过，建议按审定金额执行。' : '待线下会审。')
    }
  })
}

Mock.mock(/lhhsXmReviewOpinionStat\/getMeetingPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const filtered = SUMMARY_MEETINGS.filter((meeting) => {
    const matchSearch =
      !body.searchParam || includesText(meeting.meeting_name, body.searchParam) || includesText(meeting.meeting_code, body.searchParam)
    return (
      matchSearch &&
      (!body.status || meeting.status === String(body.status)) &&
      (!body.nd || meeting.nd === String(body.nd)) &&
      (!body.pspcId || meeting.pspcId === String(body.pspcId)) &&
      (!body.zgkbmId || meeting.zgkbmId === String(body.zgkbmId))
    )
  })
  return success(pageResult(clone(filtered), body.page || 1, body.limit || 20))
})

Mock.mock(/lhhsXmReviewOpinionStat\/getDynamicColumn(\?.*)?$/, 'post', () => success(clone(SUMMARY_COLUMNS)))

Mock.mock(/lhhsXmReviewOpinionStat\/getTableData(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const projectCodes = Array.isArray(body.xmbmList) ? body.xmbmList.map(String).filter(Boolean) : []
  const filtered = buildSummaryRows(String(body.meetingId || ''), body.sfzsqbyj === '1').filter((row) => {
    const matchCode = !projectCodes.length || projectCodes.some((code) => includesText(row.xmbm, code))
    return includesText(row.xmmc, body.xmmc) && matchCode
  })
  return success(pageResult(filtered, body.page || 1, body.limit || 100))
})

Mock.mock(/lhhsXmReviewOpinionStat\/importData(\?.*)?$/, 'post', () => success(true, '导入成功'))
