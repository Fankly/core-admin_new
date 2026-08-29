// 联合会审专家清单页（expertReview/projectManifest, psy.ts）+ 佐证材料 / 更多意见 / 项目比对
//
// 本文件里以下接口被【三个清单页共用】，只在此注册一次（entry/common/review 之后仍生效）：
//   leaderReview/pageExpertReviewInfo、leaderReview/pageXmHistoryReviewRecord、
//   leaderReview/getReviewStage。offline 的 review.ts 不再重复注册它们。
import Mock from 'mockjs'
import { fail, getQueryValue, pageResult, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import { buildExpertReviews, buildHistoryRecords, findProject, getProjectsByMeeting } from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const includesText = (value: unknown, keyword: unknown) => !keyword || String(value ?? '').includes(String(keyword))

const JOINT_REVIEW_ATTACHMENTS = {
  feasibilityReportFiles: [{ name: '可行性研究报告（佐证）.pdf', uuid: 'zz-attach-001', status: 'success' }],
  estimateFiles: [{ name: '概算书（佐证）.xlsx', uuid: 'zz-attach-002', status: 'success' }]
}

const JOINT_REVIEW_PROJECT_COLUMNS = [
  {
    stepId: 'baseInfo',
    stepName: '基本信息',
    columns: [
      { label: '项目编码', prop: 'xmbm', type: 'input', disabled: true },
      { label: '项目名称', prop: 'xmmc', type: 'input', disabled: true },
      { label: '预算事项名称', prop: 'yssxmc', type: 'input', disabled: true },
      { label: '计划实施年度', prop: 'jhssnd', type: 'input', disabled: true },
      { label: '申报单位', prop: 'yjdw', type: 'input', disabled: true }
    ]
  },
  {
    stepId: 'budgetInfo',
    stepName: '申报信息',
    columns: [
      { label: '申报金额（含税，万元）', prop: 'all_invest_tax', type: 'input', disabled: true },
      { label: '申报金额（不含税，万元）', prop: 'amount', type: 'input', disabled: true },
      { label: '项目实施内容', prop: 'ssnr', type: 'textarea', rows: 4, span: 24, disabled: true },
      { label: '项目必要性', prop: 'byx', type: 'textarea', rows: 4, span: 24, disabled: true }
    ]
  },
  {
    stepId: 'attachmentInfo',
    stepName: '附件信息',
    columns: [
      {
        label: '评审佐证材料',
        prop: 'zzcl',
        type: 'uploadGroup',
        children: [
          { label: '可行性研究报告', prop: 'feasibilityReportFiles' },
          { label: '概算书', prop: 'estimateFiles' }
        ]
      }
    ]
  }
]

// ==================== 左侧项目列表（专家页 expertReview/pageXmInfo） ====================
// params: reviewStatus('0'待预审/'1'已预审)、meetingId、page、limit、searchParam、高级查询字段
Mock.mock(/expertReview\/pageXmInfo(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const all = getProjectsByMeeting(body.meetingId)
  const filtered = all.filter((p) => {
    const matchStatus = body.reviewStatus === undefined || body.reviewStatus === '' || p.reviewStatus === String(body.reviewStatus)
    const matchSearch = !body.searchParam || includesText(p.xmbm, body.searchParam) || includesText(p.xmmc, body.searchParam)
    const matchXmmc = includesText(p.xmmc, body.xmmc)
    const matchYssx = includesText(p.yssxmc, body.yssxmc)
    return matchStatus && matchSearch && matchXmmc && matchYssx
  })
  return success(pageResult(clone(filtered), body.page || 1, body.limit || 100))
})

// ==================== 专家评审意见列表（共用：leaderReview/pageExpertReviewInfo） ====================
Mock.mock(/leaderReview\/pageExpertReviewInfo(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(buildExpertReviews(body.xmId), body.page || 1, body.limit || 100))
})

// ==================== 历史评审记录（共用：leaderReview/pageXmHistoryReviewRecord） ====================
Mock.mock(/leaderReview\/pageXmHistoryReviewRecord(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(buildHistoryRecords(body.originXmId), 1, 100))
})

// ==================== 会审阶段（共用：leaderReview/getReviewStage?meetingId=xx） ====================
// code: '1' 线上预审 / '2' 线下会审；name + maxThcs 用于退回提示文案
Mock.mock(/leaderReview\/getReviewStage(\?.*)?$/, 'post', () => success({ code: '1', name: '当前处于线上预审阶段', maxThcs: 2 }))

// ==================== 专家规则人工复核（AiManualReviewModal） ====================
// getExpertRuleReviewRecord / saveExpertRuleReviewRecord：内存回写，key=expertId|meetingId|reviewXmid|ruleId
type ExpertRuleReviewRecord = {
  expertId: string
  meetingId: string
  reviewXmid: string
  ruleId: string
  reviewId: string
  reviewOpinion: string
  reason: string
}

const expertRuleReviewRecordStore = new Map<string, ExpertRuleReviewRecord>()

const buildExpertRuleReviewKey = (body: Record<string, any>) =>
  [body.expertId, body.meetingId, body.reviewXmid, body.ruleId].map((v) => String(v ?? '').trim()).join('|')

Mock.mock(/leaderReview\/getExpertRuleReviewRecord(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const key = buildExpertRuleReviewKey(body)
  const saved = expertRuleReviewRecordStore.get(key)
  if (saved) {
    return success({
      reviewId: saved.reviewId,
      reviewOpinion: saved.reviewOpinion,
      reason: saved.reason
    })
  }
  // 无记录时返回空结构，前端用于首次填写
  return success({
    reviewId: '',
    reviewOpinion: '',
    reason: ''
  })
})

Mock.mock(/leaderReview\/saveExpertRuleReviewRecord(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const expertId = String(body.expertId ?? '').trim()
  const meetingId = String(body.meetingId ?? '').trim()
  const reviewXmid = String(body.reviewXmid ?? '').trim()
  const ruleId = String(body.ruleId ?? '').trim()
  if (!expertId || !meetingId || !reviewXmid || !ruleId) {
    return fail('缺少复核必要参数')
  }
  const reviewOpinion = String(body.reviewOpinion ?? '').trim()
  const reason = String(body.reason ?? '').trim()
  if (!reviewOpinion) {
    return fail('请选择评审意见')
  }
  // 0 = 不采纳，意见说明必填（与前端校验一致）
  if (reviewOpinion === '0' && !reason) {
    return fail('不采纳时请填写意见说明')
  }

  const key = buildExpertRuleReviewKey(body)
  const prev = expertRuleReviewRecordStore.get(key)
  const reviewId = String(body.reviewId ?? '').trim() || prev?.reviewId || `rule-review-${Date.now()}`
  expertRuleReviewRecordStore.set(key, {
    expertId,
    meetingId,
    reviewXmid,
    ruleId,
    reviewId,
    reviewOpinion,
    reason
  })
  return success({ reviewId, reviewOpinion, reason }, '人工复核提交成功')
})

// ==================== 提交专家评审意见（省级统筹） ====================
Mock.mock(/expertReview\/saveExpertReviewRecordForSjtc(\?.*)?$/, 'post', () => success(true, '评审意见提交成功'))

// ==================== 提交专家评审意见（市级联合会审，reviewDeatil） ====================
Mock.mock(/expertReview\/saveExpertReviewRecordForCityLhhs(\?.*)?$/, 'post', () => success(true, '评审意见提交成功'))

// ==================== 导入专家评审意见（市级联合会审） ====================
Mock.mock(/expertReview\/importExpertReviewRecordForCityLhhs(\?.*)?$/, 'post', () => success(true, '导入成功'))

// ==================== 按评审意见取意见说明（getReasonByOpinion） ==================== 返回字符串数组
Mock.mock(/expertReview\/getReasonByOpinion(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  if (body.opinion === '1') return success(['经审查，项目建设内容明确、投资测算合理，同意通过。'])
  return success(['建议补充投资测算依据及与上级规划的衔接说明。', '请核实申报单价与参考价的偏差原因。'])
})

// ==================== 与本会议上个提交记录比对（getLastXmInfoForCmp） ==================== 无变更返回 null
Mock.mock(/expertReview\/getLastXmInfoForCmp(\?.*)?$/, 'post', () => success(null))

// ==================== 佐证材料（zzfile.vue） ====================

// 项目佐证附件（expertReview/getXmInfoByYsbgfj?xmId=xx）—— 按 tab 步骤 stepId 聚合附件
Mock.mock(/expertReview\/getXmInfoByYsbgfj(\?.*)?$/, 'get', () =>
  success({
    attachmentInfo: clone(JOINT_REVIEW_ATTACHMENTS)
  })
)

// AI 审核详情弹窗使用的项目基本信息（省级 meeting- / 市级 city-meeting- 前缀）。
Mock.mock(/xmAttributeConfig\/getXmInfo\?[^#]*xmId=(?:meeting-|city-meeting-)/, 'get', (options: MockOptions) => {
  const xmId = getQueryValue(options.url, 'xmId')
  const project = findProject(xmId)
  return success({
    baseInfo: {
      xmbm: project?.xmbm || '',
      xmmc: project?.xmmc || '',
      yssxmc: project?.yssxmc || '',
      jhssnd: project?.jhssnd || '',
      yjdw: project?.yjdw || ''
    },
    budgetInfo: {
      all_invest_tax: project?.all_invest_tax || '',
      amount: project?.amount || '',
      ssnr: project?.ssnr || '',
      byx: project?.byx || ''
    },
    attachmentInfo: clone(JOINT_REVIEW_ATTACHMENTS)
  })
})

// 属性配置列（getTabColumns）—— 收窄到本模块 mock 项目 xmid（meeting- / city-meeting- 前缀）
Mock.mock(/xmAttributeConfig\/getTabColumns\?[^#]*xmid=(?:meeting-|city-meeting-)/, 'get', () =>
  success(clone(JOINT_REVIEW_PROJECT_COLUMNS))
)

// AI 智能审核：按项目名称查审核详情 id（findViewId）—— 返回 0 表示未命中
Mock.mock(/ai\/third\/zj\/findViewId(\?.*)?$/, 'post', () => success('0'))

// ==================== 更多意见（otherOpinion.vue，省级统筹） ====================

// 意见 tab（listExpertReviewTabForSjtc?meetingId=xx&originXmId=xx）
Mock.mock(/leaderReview\/listExpertReviewTabForSjtc(\?.*)?$/, 'post', () =>
  success([
    { label: '线上预审', stage: '1' },
    { label: '线下会审', stage: '2' }
  ])
)

// 按 tab 查意见（listExpertReviewInfoByTabForSjtc）—— 直接返回意见数组（非分页）
Mock.mock(/leaderReview\/listExpertReviewInfoByTabForSjtc(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const xmId = getQueryValue(options.url, 'xmId') || body.originXmId || 'mock'
  return success(buildExpertReviews(xmId))
})

export { findProject }
