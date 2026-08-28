/**
 * AI 智能审核首页（smartReviewHome）mock
 * 对应接口：src/api/ai/smartReviewHome/index.ts → ai-audit-workbench/*
 */
import Mock from 'mockjs'
import { getQueryValue, success } from '../helpers'
import type { MockOptions } from '../helpers'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** 总览统计：字段与 OverviewStat 严格对齐 */
const OVERVIEW_STAT = {
  ljshxmsl_total: 1286,
  ljshxmsl_add: 18,
  ljxmsbje_total: 3568000000,
  ljxmsbje_add: 42600000,
  ljfxfxxmsl_total: 312,
  ljfxfxxmsl_add: 7,
  ljqzljcs_total: 89,
  ljqzljcs_add: 3,
  ljfxfxxsl_total: 1568,
  ljfxfxxsl_add: 24
}

/** 规则库统计：code / name / count */
const RULE_STAT = [
  { code: 'PRICE_COMPARE', name: '比价', count: '86' },
  { code: 'PROJECT_INFO', name: '信息', count: '64' },
  { code: 'COMPLIANCE', name: '合规', count: '52' },
  { code: 'DOCUMENT', name: '资料', count: '41' },
  { code: 'INVESTMENT', name: '投资', count: '37' },
  { code: 'SCALE_MATCH', name: '规模', count: '28' }
]

/** 文档解析统计：xmjys / kybg / gss / total */
const DOC_DEAL_STAT = {
  xmjys: '426',
  kybg: '512',
  gss: '389',
  total: '1327'
}

/**
 * 风险级别分布
 * code 与前端 RISK_LEVEL_COLORS 对齐：1=问题 / 2=隐患 / 3=异常
 */
const RISK_DIST_BY_LEVEL = [
  { code: '1', name: '问题', count: '186' },
  { code: '2', name: '隐患', count: '268' },
  { code: '3', name: '异常', count: '142' }
]

/**
 * 风险类型分布
 * code 与前端 RISK_TYPE_COLORS 对齐：1=必要性 / 2=经济性 / 3=合规性
 */
const RISK_DIST_BY_CLASSIFY = [
  { code: '1', name: '必要性风险', count: '214' },
  { code: '2', name: '经济性风险', count: '198' },
  { code: '3', name: '合规性风险', count: '184' }
]

/** 风险项排名；proTypeName 用于项目类型风险项排名 */
const RISK_RANK_STAT = [
  { name: '协议库存、国网商城单价对比偏差超阈值', count: '86', proTypeName: '成本性项目' },
  { name: '建设规模与投资金额匹配性不足', count: '72', proTypeName: '技改项目' },
  { name: '项目申报附件完整性缺失', count: '65', proTypeName: '基建项目' },
  { name: '历史成交价波动异常', count: '58', proTypeName: '成本性项目' },
  { name: '前置审批资料不完整', count: '51', proTypeName: '大修项目' },
  { name: '采购数量合理性存疑', count: '47', proTypeName: '营销项目' },
  { name: '单位换算一致性校验失败', count: '42', proTypeName: '技改项目' },
  { name: '投资估算金额偏离同类项目区间', count: '38', proTypeName: '基建项目' },
  { name: '项目名称规范性不达标', count: '33', proTypeName: '大修项目' },
  { name: '资金来源与年度计划不一致', count: '29', proTypeName: '营销项目' },
  { name: '供应商集中度偏高', count: '24', proTypeName: '成本性项目' },
  { name: '附件版本号不一致', count: '21', proTypeName: '技改项目' }
]

const AUDIT_STATUS_POOL = ['已完成', '审核中', '已完成', '已完成', '待复核']
const AUDIT_RESULT_POOL = ['通过', '不通过', '待复核', '通过', '不通过']

const PROJECT_NAMES = [
  '2026年城区配电自动化终端改造项目',
  '220kV海蔷4917线防坠落装置修理',
  '500kV变电站二次设备技改工程',
  '配网自动化主站系统升级改造',
  '输电线路绝缘子批次更换大修',
  '智能电能表集中更换项目',
  '10kV线路开关柜智能化改造',
  '变电站消防系统更新改造',
  '通信光缆线路加固修理项目',
  '营销业务应用系统功能扩展',
  '储能电站并网配套技改工程',
  '低压台区智能终端补点建设',
  '电缆隧道综合监测系统建设',
  '输电运检无人机巡检能力提升',
  '物资仓储智能化升级项目',
  '调度自动化主站容灾改造',
  '配电室环境监测系统建设',
  '新能源并网消纳能力提升工程',
  '变电运维工器具标准化配置',
  '电网数字化台账治理专项',
  '用户侧负荷管理系统扩容',
  '线路防外破智能预警系统建设',
  '变电站视频安防升级改造',
  '电力通信网 SDH 设备更换'
]

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * 最近审核业务
 * pro_id / task_id / pro_type 对齐 smartTaskAudit mock，便于 DetailModal 查看联调
 * 首条复用 mock-project-001 / mock-task-001（有完整项目信息与规则详情 fixture）
 */
const RECENT_AUDIT_LIST = PROJECT_NAMES.map((xmmc, index) => {
  const sequence = index + 1
  const year = String(2026 - (index % 3))
  const day = pad(20 - (index % 15))
  const hour = pad(9 + (index % 9))
  const minute = pad((index * 11) % 60)
  const isDetailSample = index === 0
  // 前几条挂到已有规则详情 mock，其余生成独立 id
  const detailIdMap = [
    'mock-detail-price-001',
    'mock-detail-price-002',
    'mock-detail-info-001',
    'mock-detail-info-002',
    'mock-detail-compliance-001',
    'mock-detail-document-001',
    'mock-detail-investment-001'
  ]

  return {
    xmbm: isDetailSample ? 'MOCK-2026-0001' : `XM${year}P${21000 + sequence}`,
    xmmc,
    jhssnd: year,
    status: AUDIT_STATUS_POOL[index % AUDIT_STATUS_POOL.length],
    finish_time: `${year}-07-${day} ${hour}:${minute}:00`,
    review_opinion: AUDIT_RESULT_POOL[index % AUDIT_RESULT_POOL.length],
    detail_id: detailIdMap[index] || `mock-home-detail-${String(sequence).padStart(3, '0')}`,
    pro_id: isDetailSample ? 'mock-project-001' : `mock-project-${String(sequence).padStart(3, '0')}`,
    task_id: isDetailSample ? 'mock-task-001' : `mock-task-${String(sequence).padStart(3, '0')}`,
    pro_type: isDetailSample ? '4871843' : String(4871840 + (sequence % 5))
  }
})

// ==================== 接口注册 ====================

// 总览统计
Mock.mock(/ai-audit-workbench\/getOverviewStat(\?.*)?$/, 'post', () => success(clone(OVERVIEW_STAT)))

// 规则库统计
Mock.mock(/ai-audit-workbench\/getRuleStat(\?.*)?$/, 'post', () => success(clone(RULE_STAT)))

// 文档解析统计
Mock.mock(/ai-audit-workbench\/getDocDealStat(\?.*)?$/, 'post', () => success(clone(DOC_DEAL_STAT)))

// 风险分布（规则级别）
Mock.mock(/ai-audit-workbench\/getRiskDistStatByRuleLevel(\?.*)?$/, 'post', () => success(clone(RISK_DIST_BY_LEVEL)))

// 风险分布（规则分类）
Mock.mock(/ai-audit-workbench\/getRiskDistStatByRuleClassify(\?.*)?$/, 'post', () => success(clone(RISK_DIST_BY_CLASSIFY)))

// 风险项排名（limit 默认 10，从 query 读取）
Mock.mock(/ai-audit-workbench\/getRiskRankStat(\?.*)?$/, 'post', (options: MockOptions) => {
  const limitRaw = getQueryValue(options.url, 'limit')
  const limit = Math.max(1, Number(limitRaw) || 10)
  return success(clone(RISK_RANK_STAT.slice(0, limit)))
})

// 最近审核业务（limit 默认 20，从 query 读取）
Mock.mock(/ai-audit-workbench\/listRecentAudit(\?.*)?$/, 'post', (options: MockOptions) => {
  const limitRaw = getQueryValue(options.url, 'limit')
  const limit = Math.max(1, Number(limitRaw) || 20)
  return success(clone(RECENT_AUDIT_LIST.slice(0, limit)))
})
