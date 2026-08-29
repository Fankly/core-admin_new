/**
 * AI 智能审核首页二(smartReviewHomeTwo)mock
 * 对应接口:src/views/ai/smartReviewHomeTwo 依赖的 ai-audit-workbench/*
 * 与 aiSmartReviewHome mock 同前缀但数据/命名独立,互不影响
 */
import Mock from 'mockjs'
import { getQueryValue, success } from '../helpers'
import type { MockOptions } from '../helpers'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** 总览统计:字段与 OverviewStat 严格对齐 */
const OVERVIEW_STAT = {
  ljshxmsl_total: 2145,
  ljshxmsl_add: 26,
  ljxmsbje_total: 5236000000,
  ljxmsbje_add: 61800000,
  ljfxfxxmsl_total: 487,
  ljfxfxxmsl_add: 9,
  ljqzljcs_total: 136,
  ljqzljcs_add: 5,
  ljfxfxxsl_total: 2396,
  ljfxfxxsl_add: 31
}

/** 规则库统计:code / name / count */
const RULE_STAT = [
  { code: 'NECESSITY', name: '立项必要性审核', count: '92' },
  { code: 'ECONOMY', name: '投资经济性审核', count: '78' },
  { code: 'COMPLIANCE_V2', name: '合规性校验', count: '66' },
  { code: 'BUDGET_MATCH', name: '概预算匹配审核', count: '54' },
  { code: 'ATTACHMENT_V2', name: '附件规范性审核', count: '43' },
  { code: 'DUP_PROJECT', name: '重复立项排查', count: '35' },
  { code: 'QUOTE_DEVIATION', name: '报价偏离度分析', count: '29' }
]

/** 文档解析统计:xmjys / kybg / gss / total */
const DOC_DEAL_STAT = {
  xmjys: '568',
  kybg: '641',
  gss: '473',
  total: '1682'
}

/**
 * 风险级别分布
 * code 与前端 RISK_LEVEL_COLORS 对齐:1=问题 / 2=隐患 / 3=异常
 */
const RISK_DIST_BY_LEVEL = [
  { code: '1', name: '问题', count: '243' },
  { code: '2', name: '隐患', count: '356' },
  { code: '3', name: '异常', count: '187' }
]

/**
 * 风险类型分布
 * code 与前端 RISK_TYPE_COLORS 对齐:1=必要性 / 2=经济性 / 3=合规性
 */
const RISK_DIST_BY_CLASSIFY = [
  { code: '1', name: '必要性风险', count: '286' },
  { code: '2', name: '经济性风险', count: '254' },
  { code: '3', name: '合规性风险', count: '246' }
]

/** 风险项排名;proTypeName 用于项目类型风险项排名聚合 */
const RISK_RANK_STAT = [
  { name: '可研估算与初设概算偏差超阈值', count: '94', proTypeName: '基建项目' },
  { name: '设备材料清册与典型设计不符', count: '81', proTypeName: '技改项目' },
  { name: '立项依据文件过期或缺失', count: '73', proTypeName: '大修项目' },
  { name: '拆除物资处置方案不完整', count: '62', proTypeName: '技改项目' },
  { name: '项目投资超年度综合计划', count: '55', proTypeName: '基建项目' },
  { name: '工程量清单与图纸量差异常', count: '49', proTypeName: '基建项目' },
  { name: '同区域同类项目重复申报', count: '44', proTypeName: '成本性项目' },
  { name: '甲供物资需求计划偏差偏大', count: '39', proTypeName: '大修项目' },
  { name: '取费标准适用版本错误', count: '35', proTypeName: '技改项目' },
  { name: '停电计划与施工组织冲突', count: '31', proTypeName: '营销项目' },
  { name: '可研批复文号引用不一致', count: '27', proTypeName: '基建项目' },
  { name: '风险管控措施未闭环', count: '23', proTypeName: '成本性项目' }
]

const AUDIT_STATUS_POOL = ['已完成', '已完成', '审核中', '已完成', '待复核']

const PROJECT_NAMES = [
  '2026年智能变电站二次系统改造工程',
  '110kV玉湖线杆塔加固大修项目',
  '城区配电网网格化提升专项工程',
  '220kV枢纽站主变风冷系统更换',
  '充电设施配套电网建设二期项目',
  '10kV环网柜全绝缘化改造',
  '变电站直流电源系统更新换代',
  '输电通道可视化监控补点工程',
  '台区融合终端规模化安装项目',
  '调度数据网边界安全防护改造',
  '35kV电缆线路绝缘化大修',
  '分布式光伏并网接入配套工程',
  '变电站辅控系统智能化升级',
  '配网故障指示器集中更换项目',
  '通信电源高频开关更新改造',
  '输电线路覆冰监测系统建设',
  '计量采集主站性能扩容工程',
  '开关站环境智能调控改造',
  '电网基建全过程数字化管控平台建设',
  '变电站接地网大修整治项目'
]

const pad = (value: number) => String(value).padStart(2, '0')

/**
 * 最近审核业务
 * 字段与 RecentAuditItem 对齐:xm_id / task_id / pro_type
 * 首条复用 mock-project-001 / mock-task-001(有完整项目信息与规则详情 fixture,便于 DetailModal 联调)
 */
const RECENT_AUDIT_LIST = PROJECT_NAMES.map((xmmc, index) => {
  const sequence = index + 1
  const year = String(2026 - (index % 2))
  const month = pad(6 + (index % 2))
  const day = pad(25 - (index % 20))
  const hour = pad(8 + (index % 10))
  const minute = pad((index * 13) % 60)
  const isDetailSample = index === 0

  return {
    xmbm: isDetailSample ? 'MOCK-2026-0001' : `XM${year}T${32000 + sequence}`,
    xmmc,
    jhssnd: year,
    status: AUDIT_STATUS_POOL[index % AUDIT_STATUS_POOL.length],
    audit_time: `${year}-${month}-${day} ${hour}:${minute}:00`,
    xm_id: isDetailSample ? 'mock-project-001' : `mock-two-project-${String(sequence).padStart(3, '0')}`,
    task_id: isDetailSample ? 'mock-task-001' : `mock-two-task-${String(sequence).padStart(3, '0')}`,
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

// 风险分布(规则级别)
Mock.mock(/ai-audit-workbench\/getRiskDistStatByRuleLevel(\?.*)?$/, 'post', () => success(clone(RISK_DIST_BY_LEVEL)))

// 风险分布(规则分类)
Mock.mock(/ai-audit-workbench\/getRiskDistStatByRuleClassify(\?.*)?$/, 'post', () => success(clone(RISK_DIST_BY_CLASSIFY)))

// 风险项排名(limit 默认 10,从 query 读取)
Mock.mock(/ai-audit-workbench\/getRiskRankStat(\?.*)?$/, 'post', (options: MockOptions) => {
  const limitRaw = getQueryValue(options.url, 'limit')
  const limit = Math.max(1, Number(limitRaw) || 10)
  return success(clone(RISK_RANK_STAT.slice(0, limit)))
})

// 最近审核业务(limit 默认 20,从 query 读取)
Mock.mock(/ai-audit-workbench\/listRecentAudit(\?.*)?$/, 'post', (options: MockOptions) => {
  const limitRaw = getQueryValue(options.url, 'limit')
  const limit = Math.max(1, Number(limitRaw) || 20)
  return success(clone(RECENT_AUDIT_LIST.slice(0, limit)))
})
