import Mock from 'mockjs'
import { binaryResponse, fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'
import getTabColumnsResponse from '../fixtures/aiSmartTaskAudit/getTabColumns.json'
import getXmInfoResponse from '../fixtures/aiSmartTaskAudit/getXmInfo.json'
import similarProjectsAnalysis from '../fixtures/aiSmartTaskAudit/similarProjectsTop10.json'
import similarProjectsAnalysis30005 from '../fixtures/aiSmartTaskAudit/similarProjects30005.json'
import { MARKDOWN_TABLE_SAMPLE } from '../fixtures/aiSmartTaskAudit/markdownTableSamples'
import { PROJECT_ORIGINAL_TEXT, RULE_DETAIL_FIXTURES } from '../fixtures/aiSmartTaskAudit/ruleReviewPoints'

/**
 * 本地预览样例：源文件来自 C:\Users\13934\Downloads\file，
 * 已拷贝到 public/mock-files/office-preview/，开发态通过 Vite 静态访问。
 * 用于 RuleReviewDetailModal → previewAttach → OfficePreview 联调。
 * 使用站点根路径，避免 hash 路由下相对路径解析错误。
 */
const MOCK_OFFICE_FILE_BASE = '/mock-files/office-preview'

type MockOfficeSampleExt = 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'et'

const MOCK_OFFICE_SAMPLES: Record<MockOfficeSampleExt, { publicPath: string; fileName: string; contentType: string; size: number }> = {
  pdf: {
    publicPath: `${MOCK_OFFICE_FILE_BASE}/sample.pdf`,
    fileName: '国网江苏连云港输电运检中心220kV海蔷4917线等线路防坠落装置修理.pdf',
    contentType: 'application/pdf',
    size: 767881
  },
  docx: {
    publicPath: `${MOCK_OFFICE_FILE_BASE}/sample.docx`,
    fileName: '测试修理可研报告.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 930325
  },
  doc: {
    publicPath: `${MOCK_OFFICE_FILE_BASE}/sample.doc`,
    fileName: '测试修理可研报告.doc',
    contentType: 'application/msword',
    size: 1075797
  },
  xlsx: {
    publicPath: `${MOCK_OFFICE_FILE_BASE}/sample.xlsx`,
    fileName: '估算书.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 133852
  },
  // 无独立 xls 样例时复用 xlsx（扩展名仍用 xlsx，避免错误魔数）
  xls: {
    publicPath: `${MOCK_OFFICE_FILE_BASE}/sample.xlsx`,
    fileName: '估算书.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 133852
  },
  et: {
    publicPath: `${MOCK_OFFICE_FILE_BASE}/sample.et`,
    fileName: '估算书.et',
    contentType: 'application/vnd.ms-excel.et',
    size: 244736
  }
}

const officeSampleCache = new Map<string, Blob>()

const resolveSampleByFileName = (name: string) => {
  const ext = String(name || '')
    .split('.')
    .pop()
    ?.toLowerCase() as MockOfficeSampleExt | undefined
  if (ext && MOCK_OFFICE_SAMPLES[ext]) return MOCK_OFFICE_SAMPLES[ext]
  return MOCK_OFFICE_SAMPLES.pdf
}

const loadOfficeSampleBlob = async (sample: typeof MOCK_OFFICE_SAMPLES[MockOfficeSampleExt]): Promise<Blob> => {
  const cacheKey = sample.publicPath
  const cached = officeSampleCache.get(cacheKey)
  if (cached) return cached

  const response = await fetch(sample.publicPath)
  if (!response.ok) {
    throw new Error(`模拟预览文件加载失败：${sample.fileName}（HTTP ${response.status}）`)
  }
  const blob = await response.blob()
  const typed = blob.type && blob.type !== 'application/octet-stream' && blob.type !== '' ? blob : new Blob([blob], { type: sample.contentType })
  officeSampleCache.set(cacheKey, typed)
  return typed
}

interface MockRuleReview {
  detailId: string
  reviewConclude: string
  reviewOpinion: string
  reviewOpinionName: string
  reviewMessage: string
  reviewProcess: string
  /** 与线上一致：规则命中的引用原文（markdown） */
  originalText: string
  /** 与线上一致：字符串形式的 ReviewTable[] JSON */
  reviewTable: string
  ruleClassify: string
  ruleCode: string
  ruleDesc: string
  ruleId: string
  ruleLevel: string
  ruleName: string
  status: string
  taskId: string
  startTime: number
  finishTime: number
  message: string | null
  points: Array<{
    id: string
    proId: string
    detailId: string
    pointId: string
    pointName: string
    ruleDescription: string
    originalEvidence: string
    reviewConclusion: string
    conclusionDescription: string
  }>
}

const MOCK_TASK_ID = 'mock-task-001'
const MOCK_PROJECT_ID = 'mock-project-001'
const MOCK_PROJECT_TYPE = '4871843'
/** 规则审核起止时间：线上以毫秒时间戳下发 */
const RULE_START_TIME = new Date('2026-07-12T09:36:02+08:00').getTime()
const RULE_FINISH_TIME = new Date('2026-07-12T09:36:48+08:00').getTime()

interface MockTaskRow {
  createTime: string
  startTime: string
  endTime: string
  isHis: string
  isHisName: string
  priority: string
  priorityName: string
  proId: string
  status: string
  statusName: string
  docPreStatus: string
  docPreStatusName: string
  taskId: string
  taskName: string
  yjdw: string
  yjdwCode: string
  ejdw: string
  ejdwCode: string
  xmbm: string
  proType: string
  proTypeName: string
  jhssnd: string
  ruleName: string
}

const TASK_PRIORITY_MAP: Record<string, string> = { '1': '高', '2': '中', '3': '低' }
const TASK_STATUS_MAP: Record<string, string> = { '0': '待审核', '1': '等待中', '2': '处理中', '3': '已完成', '4': '处理失败' }
const DOC_PRE_STATUS_MAP: Record<string, string> = { '0': '待处理', '1': '处理中', '2': '已完成', '3': '处理失败' }
const IS_HISTORY_MAP: Record<string, string> = { '0': '否', '1': '是' }

const TASK_PROJECT_TYPES = [
  { code: 'PT01', name: '基建项目' },
  { code: 'PT02', name: '技改项目' },
  { code: 'PT03', name: '大修项目' },
  { code: 'PT04', name: '零星购置' }
]

const TASK_UNITS = [
  { code: 'DW001', name: '国网江苏省电力有限公司', shortName: '江苏省公司', ejdwCode: 'DW001-01', ejdwName: '设备管理部' },
  { code: 'DW002', name: '国网南京供电公司', shortName: '南京公司', ejdwCode: 'DW002-01', ejdwName: '运维检修部' },
  { code: 'DW003', name: '国网苏州供电公司', shortName: '苏州公司', ejdwCode: 'DW003-01', ejdwName: '项目管理中心' },
  { code: 'DW004', name: '国网无锡供电公司', shortName: '无锡公司', ejdwCode: 'DW004-01', ejdwName: '建设管理部' }
]

const TASK_RULE_NAMES = ['价格对比审核', '项目信息审核', '合规性审核', '建设规模合理性审核']
const TASK_YEARS = ['2026', '2025', '2024']
const pad = (value: number) => String(value).padStart(2, '0')

const TASK_ROWS: MockTaskRow[] = Array.from({ length: 37 }, (_, index) => {
  const sequence = index + 1
  const unit = TASK_UNITS[index % TASK_UNITS.length]
  const projectType = TASK_PROJECT_TYPES[(index + 1) % TASK_PROJECT_TYPES.length]
  const year = TASK_YEARS[index % TASK_YEARS.length]
  const priority = String((index % 3) + 1)
  // Keep the first row as the detailed sample and cover all workbench status tabs.
  const isDetailSample = index === 0
  const status = isDetailSample ? '3' : String(((index - 1) % 4) + 1)
  const docPreStatus = String((index + 2) % 4)
  const isHis = String(index % 4 === 3 ? 1 : 0)

  const day = pad(12 - (index % 12))
  const hour = 8 + (index % 10)
  const minute = pad((index * 7) % 60)

  return {
    createTime: `2026-07-${day} ${pad(hour)}:${minute}:00`,
    startTime: `2026-07-${day} ${pad(hour)}:${minute}:30`,
    endTime: `2026-07-${day} ${pad(hour + 1)}:${minute}:30`,
    isHis,
    isHisName: IS_HISTORY_MAP[isHis],
    priority,
    priorityName: TASK_PRIORITY_MAP[priority],
    proId: isDetailSample ? MOCK_PROJECT_ID : `mock-project-${String(sequence).padStart(3, '0')}`,
    status,
    statusName: TASK_STATUS_MAP[status],
    docPreStatus,
    docPreStatusName: DOC_PRE_STATUS_MAP[docPreStatus],
    taskId: isDetailSample ? MOCK_TASK_ID : `mock-task-${String(sequence).padStart(3, '0')}`,
    taskName: isDetailSample
      ? '2026 年城区配电自动化终端改造项目智能审核'
      : `${year}年${unit.shortName}${projectType.name}智能审核任务（${sequence}）`,
    yjdw: unit.name,
    yjdwCode: unit.code,
    ejdw: unit.ejdwName,
    ejdwCode: unit.ejdwCode,
    xmbm: isDetailSample ? 'MOCK-2026-0001' : `XM${year}P${20000 + sequence}`,
    proType: isDetailSample ? MOCK_PROJECT_TYPE : projectType.code,
    proTypeName: isDetailSample ? '成本性项目' : projectType.name,
    jhssnd: year,
    ruleName:
      status === '0'
        ? '待开始'
        : status === '1'
        ? TASK_RULE_NAMES[index % TASK_RULE_NAMES.length]
        : status === '2'
        ? '全部规则已执行'
        : status === '3'
        ? '任务已撤销'
        : '审核已驳回'
  }
})

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const includesText = (value: unknown, keyword: unknown) => !keyword || String(value || '').includes(String(keyword))

const matchesList = (value: string, list: unknown) => {
  return !Array.isArray(list) || !list.length || list.map(String).includes(value)
}

const COMMON_CODE_MAP: Record<string, Array<Record<string, string | number>>> = {
  AI_AUDIT_TASK_STATUS_COM: [
    { id: '1', code: '1', name: '等待中', sort: 1 },
    { id: '2', code: '2', name: '处理中', sort: 2 },
    { id: '3', code: '3', name: '已完成', sort: 3 },
    { id: '4', code: '4', name: '处理失败', sort: 4 }
  ],
  AI_AUDIT_REVIEW_OPINION_COM: [
    { id: '1', code: '1', name: '通过', sort: 1 },
    { id: '0', code: '0', name: '不通过', sort: 2 },
    { id: '2', code: '2', name: '待复核', sort: 3 }
  ],
  AI_AUDIT_RULE_CLASSIFY_COM: [
    { id: 'NECESSITY', code: 'NECESSITY', name: '必要性', sort: 1 },
    { id: 'ECONOMY', code: 'ECONOMY', name: '经济性', sort: 2 },
    { id: 'COMPLIANCE', code: 'COMPLIANCE', name: '合规性', sort: 3 }
  ],
  AI_AUDIT_RESULT_COM: [
    { id: '0', code: '0', name: '不通过', type: 'danger' },
    { id: '1', code: '1', name: '通过', type: 'success' },
    { id: '2', code: '2', name: '待复核', type: 'warning' }
  ]
}

const REVIEW_TABLE_COLUMNS = [
  { key: 'source', label: '数据来源', align: 'left', width: '150', fixed: '', hide: false },
  { key: 'currentValue', label: '申报值', align: 'right', width: '120', fixed: '', hide: false },
  { key: 'referenceValue', label: '参考值', align: 'right', width: '120', fixed: '', hide: false },
  { key: 'difference', label: '差异', align: 'right', width: '100', fixed: '', hide: false },
  { key: 'result', label: '判断结果', align: 'center', width: '110', fixed: '', hide: false }
]

/**
 * 价格查看节点：后端下发在「原文出处」（point.originalEvidence）的 HTML 中，
 * 前端 v-html 渲染后点击上抛，跳转物料价格库对应 tab。
 * .gwPriceView → 国网参考采购价格（tab=materialPriceLibrary）
 * .materialNewestPriceView → 历史项目领用物料单价（tab=historyPrice）
 * 用 <a href> 而非 <span>：workbenchView 的 a[href] 样式才会给出青绿下划线的可点击外观
 * （见 workbenchView/css/index.less「后端下发的链接需要看得出可点击」）；
 * 点击由 handleAuditHtmlActionClick 拦截并 preventDefault，不会真正跳转。
 * 数据由 mock/modules/materialPriceLibrary.ts 提供。
 */
const GW_PRICE_VIEW_LINK = '<a class="gwPriceView" href="javascript:void(0)">国网参考采购价格</a>'
const MATERIAL_NEWEST_PRICE_VIEW_LINK = '<a class="materialNewestPriceView" href="javascript:void(0)">历史项目领用物料单价</a>'

const createRule = (params: {
  detailId: string
  reviewConclude: string
  reviewOpinion: '0' | '1' | '2'
  ruleClassify: string
  ruleCode?: string
  ruleDesc?: string
  ruleId: string
  ruleLevel: '1' | '2' | '3'
  ruleName: string
}): MockRuleReview => {
  const reviewOpinionNameMap = {
    '0': '不通过',
    '1': '通过',
    '2': '待复核'
  }
  const resultText = reviewOpinionNameMap[params.reviewOpinion]
  // 价格类规则（协议库存、国网商城单价对比）才下发价格查看节点
  const withPriceView = String(params.ruleCode || '') === '10006'
  /**
   * 审核要点按规则单独编写，存放在 fixtures/aiSmartTaskAudit/ruleReviewPoints.ts；
   * 未配置 fixture 的规则退回通用模板，保证新增规则不会缺少 points。
   */
  const detailFixture = RULE_DETAIL_FIXTURES[params.detailId]
  const fallbackPointFixtures = [
    {
      pointName: `${params.ruleName}基础条件核验`,
      ruleDescription: `核验项目申报信息与支撑材料中涉及“${params.ruleName}”的关键字段是否完整、一致，并满足当前业务规则要求。`,
      originalEvidence: `项目申报表、可研报告及投资估算材料中与“${params.ruleName}”相关的字段和说明。`,
      reviewConclusion: resultText,
      conclusionDescription: params.reviewConclude
    },
    {
      pointName: `${params.ruleName}关联数据交叉核验`,
      ruleDescription: `结合关联业务数据和历史同类项目，对“${params.ruleName}”的申报值、参考值及差异情况进行交叉核验。`,
      originalEvidence: '项目申报清单、关联业务系统数据及近三年同类项目审核记录。',
      reviewConclusion: resultText,
      conclusionDescription: params.reviewConclude
    }
  ]
  const priceViewEvidence = [
    `<p>价格比对依据：${GW_PRICE_VIEW_LINK}（国网下发参考采购价）、${MATERIAL_NEWEST_PRICE_VIEW_LINK}（历史项目领用单价），可点击查看原始数据。</p>`,
    `<p>历史成交口径取自 ${MATERIAL_NEWEST_PRICE_VIEW_LINK}。</p>`
  ]
  const points = (detailFixture?.points?.length ? detailFixture.points : fallbackPointFixtures).map((point, index) => ({
    id: `${params.detailId}-point-${index + 1}`,
    proId: MOCK_PROJECT_ID,
    detailId: params.detailId,
    pointId: String(index + 1),
    pointName: point.pointName,
    ruleDescription: point.ruleDescription,
    originalEvidence: `${point.originalEvidence}${withPriceView ? priceViewEvidence[index] || '' : ''}`,
    reviewConclusion: point.reviewConclusion,
    conclusionDescription: point.conclusionDescription
  }))
  // 与线上一致：ruleDesc 是「规则名 + 逐条审核要点及其规则说明」的多行文本
  const ruleDescFromPoints = [
    params.ruleName,
    ...points.map((point) => `审核要点${point.pointId}：${point.pointName}：\n规则说明：${point.ruleDescription}`)
  ].join('\n')
  const reviewProcessText = detailFixture?.reviewProcess || `系统按规则要求核验“${params.ruleName}”，最终判断为${resultText}。`
  /**
   * fixture 里的 markdown 段落（表格等块级内容）必须与前面的 <p> 之间留空行，
   * 否则 markdown-it 会把它并入 HTML block，表格原样输出。
   */
  const reviewProcessMarkdown = detailFixture?.reviewProcessMarkdown ? `\n\n${detailFixture.reviewProcessMarkdown}\n\n` : ''
  // 协议库存单价对比规则：在审核结论 HTML 中下发 id=sourceDirectory 按钮，由 v-html 解析并点击跳转
  const withSourceDirectory = String(params.ruleCode || '') === '10006'
  const sourceDirectoryBtn = withSourceDirectory
    ? '<p>可跳转查看 <button id="sourceDirectory" type="button">同源目录</button> 进行物料对照。</p>'
    : ''

  const tables = [
    {
      columns: REVIEW_TABLE_COLUMNS,
      rows: [
        {
          source: '项目申报清单',
          currentValue: '12,680.00 元',
          referenceValue: '11,350.00 元',
          difference: '+11.72%',
          result: resultText
        },
        {
          source: '国网商城近期均价',
          currentValue: '12,680.00 元',
          referenceValue: '11,520.00 元',
          difference: '+10.07%',
          result: resultText
        }
      ],
      tableMeta: {
        title: `${params.ruleName}分析明细`
      }
    },
    {
      columns: REVIEW_TABLE_COLUMNS,
      rows: [
        {
          source: '历史成交均价',
          currentValue: '12,680.00 元',
          referenceValue: '11,800.00 元',
          difference: '+7.46%',
          result: resultText
        }
      ],
      tableMeta: {
        title: `${params.ruleName}补充对照`
      }
    }
  ]

  const escapeHtml = (value: unknown) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  const reviewProcessTables = tables
    .map((table) => {
      const visibleColumns = table.columns.filter((column) => !column.hide)
      const header = visibleColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
      const rows = table.rows.map((row) => `<tr>${visibleColumns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}</tr>`).join('')
      return `<table class="reviewTable"><caption>${escapeHtml(
        table.tableMeta.title
      )}</caption><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`
    })
    .join('')

  return {
    ...params,
    ruleCode: params.ruleCode || params.ruleId,
    ruleDesc: params.ruleDesc || ruleDescFromPoints,
    taskId: MOCK_TASK_ID,
    status: '1',
    startTime: RULE_START_TIME,
    finishTime: RULE_FINISH_TIME,
    message: null,
    reviewOpinionName: resultText,
    originalText: detailFixture?.originalText || PROJECT_ORIGINAL_TEXT,
    // Keep the API contract consistent: reviewMessage is JSON text.
    // 相似性规则（10001/30005）下发 top10 分析结果，其余规则下发线上同构的
    // {conclusion, reviewSummary, detailedReasoning:{reviewPoints, summary}}。
    reviewMessage:
      params.ruleCode === '30005'
        ? JSON.stringify(similarProjectsAnalysis30005)
        : params.ruleCode === '10001'
        ? JSON.stringify(similarProjectsAnalysis)
        : JSON.stringify(
            {
              conclusion: resultText,
              reviewSummary: params.reviewConclude,
              detailedReasoning: {
                reviewPoints: points.map((point) => ({
                  pointId: point.pointId,
                  pointName: point.pointName,
                  ruleDescription: point.ruleDescription,
                  originalEvidence: point.originalEvidence,
                  reviewConclusion: point.reviewConclusion,
                  conclusionDescription: point.conclusionDescription
                })),
                summary: reviewProcessText
              }
            },
            null,
            2
          ),
    reviewProcess: `<p>${reviewProcessText}</p>${reviewProcessMarkdown}${reviewProcessTables}${sourceDirectoryBtn}`,
    // 模拟接口以字符串返回 ReviewTable[]（可能含转义引号场景由前端 parse 处理）
    reviewTable: JSON.stringify(tables),
    points
  }
}

const RULES_BY_CLASSIFY: Record<string, MockRuleReview[]> = {
  ECONOMY: [
    createRule({
      detailId: 'mock-detail-price-001',
      ruleId: 'PRICE-001',
      ruleCode: '10006',
      ruleClassify: 'ECONOMY',
      ruleLevel: '1',
      ruleName: '协议库存、国网商城单价对比',
      reviewOpinion: '0',
      reviewConclude: `申报单价较协议库存最近一期成交价高 11.72%，同时高于国网商城同规格物料近期均价 10.07%，超过系统设置的 8% 价格偏差阈值，建议补充询价依据并重新核定申报单价。\n\n**主要偏差物料**\n\n${MARKDOWN_TABLE_SAMPLE}`
    }),
    createRule({
      detailId: 'mock-detail-price-002',
      ruleId: 'PRICE-002',
      ruleClassify: 'ECONOMY',
      ruleLevel: '1',
      ruleName: '协议库存、国网商城单价对比及历史成交价交叉验证',
      reviewOpinion: '2',
      reviewConclude: '当前物料存在规格描述不完整的情况，系统无法唯一匹配商城商品，已转人工复核。'
    }),
    createRule({
      detailId: 'mock-detail-price-003',
      ruleId: 'PRICE-003',
      ruleClassify: 'ECONOMY',
      ruleLevel: '1',
      ruleName: '采购数量合理性',
      reviewOpinion: '1',
      reviewConclude: '采购数量与项目建设规模、设备台数及备品备件比例相匹配。'
    }),
    createRule({
      detailId: 'mock-detail-price-004',
      ruleId: 'PRICE-004',
      ruleClassify: 'ECONOMY',
      ruleLevel: '2',
      ruleName: '历史成交价波动分析',
      reviewOpinion: '0',
      reviewConclude: '近三年同类物料成交价总体平稳，本次申报价出现明显上浮，暂未发现能够解释该涨幅的原材料或运输成本依据。'
    }),
    createRule({
      detailId: 'mock-detail-price-005',
      ruleId: 'PRICE-005',
      ruleClassify: 'ECONOMY',
      ruleLevel: '2',
      ruleName: '供应商集中度分析',
      reviewOpinion: '1',
      reviewConclude: '候选供应商数量及历史成交分布合理，未发现单一供应商异常集中。'
    }),
    createRule({
      detailId: 'mock-detail-price-006',
      ruleId: 'PRICE-006',
      ruleClassify: 'ECONOMY',
      ruleLevel: '3',
      ruleName: '单位换算一致性校验',
      reviewOpinion: '2',
      reviewConclude: '申报清单使用“套”，商城基准使用“件”，换算关系需由业务人员确认后才能完成价格比较。'
    }),
    createRule({
      detailId: 'mock-detail-investment-001',
      ruleId: 'INVESTMENT-001',
      ruleClassify: 'ECONOMY',
      ruleLevel: '1',
      ruleName: '投资估算金额合理性检查',
      reviewOpinion: '1',
      reviewConclude: '项目投资估算金额处于同类项目合理区间内。'
    }),
    createRule({
      detailId: 'mock-detail-investment-002',
      ruleId: 'INVESTMENT-002',
      ruleClassify: 'ECONOMY',
      ruleLevel: '3',
      ruleName: '资金来源与年度计划一致性',
      reviewOpinion: '1',
      reviewConclude: '资金来源、年度投资计划与项目申报信息一致。'
    })
  ],
  NECESSITY: [
    createRule({
      detailId: 'mock-detail-info-001',
      ruleId: 'INFO-001',
      ruleClassify: 'NECESSITY',
      ruleLevel: '1',
      ruleName: '项目名称规范性校验',
      reviewOpinion: '1',
      reviewConclude: '项目名称包含建设地点、建设对象和改造内容，命名符合规范。'
    }),
    createRule({
      detailId: 'mock-detail-info-002',
      ruleId: 'INFO-002',
      ruleCode: '10001',
      ruleClassify: 'NECESSITY',
      ruleLevel: '2',
      ruleName: '建设规模与投资金额匹配性',
      reviewOpinion: '0',
      reviewConclude: '单位建设规模对应投资额高于同地区近三年同类项目中位值，建议补充工程量测算说明。'
    }),
    createRule({
      detailId: 'mock-detail-info-30005',
      ruleId: 'INFO-30005',
      ruleCode: '30005',
      ruleClassify: 'NECESSITY',
      ruleLevel: '2',
      ruleName: '历史项目相似性分析',
      reviewOpinion: '2',
      reviewConclude: '已完成当前项目与历史项目的多维度相似性分析，建议结合差异维度进行人工复核。'
    }),
    createRule({
      detailId: 'mock-detail-info-003',
      ruleId: 'INFO-003',
      ruleClassify: 'NECESSITY',
      ruleLevel: '3',
      ruleName: '计划实施年度一致性',
      reviewOpinion: '1',
      reviewConclude: '申报年度、计划开工时间和资金需求年度一致。'
    })
  ],
  COMPLIANCE: [
    createRule({
      detailId: 'mock-detail-compliance-001',
      ruleId: 'COMPLIANCE-001',
      ruleClassify: 'COMPLIANCE',
      ruleLevel: '1',
      ruleName: '采购方式适用性检查',
      reviewOpinion: '1',
      reviewConclude: '拟采用的采购方式与项目金额及物料类别相匹配。'
    }),
    createRule({
      detailId: 'mock-detail-compliance-002',
      ruleId: 'COMPLIANCE-002',
      ruleClassify: 'COMPLIANCE',
      ruleLevel: '2',
      ruleName: '前置审批资料完整性',
      reviewOpinion: '2',
      reviewConclude: '可研批复已上传，初设批复仍在流转中，需要人工确认是否允许先行申报。'
    }),
    createRule({
      detailId: 'mock-detail-compliance-003',
      ruleId: 'COMPLIANCE-003',
      ruleClassify: 'COMPLIANCE',
      ruleLevel: '3',
      ruleName: '敏感供应商关联检查',
      reviewOpinion: '1',
      reviewConclude: '未发现申报单位、经办人与候选供应商之间存在已知关联关系。'
    }),
    createRule({
      detailId: 'mock-detail-document-001',
      ruleId: 'DOCUMENT-001',
      ruleClassify: 'COMPLIANCE',
      ruleLevel: '1',
      ruleName: '项目申报附件完整性检查',
      reviewOpinion: '0',
      reviewConclude: '缺少初步设计批复文件，请补充上传后再提交审核。'
    }),
    createRule({
      detailId: 'mock-detail-document-002',
      ruleId: 'DOCUMENT-002',
      ruleClassify: 'COMPLIANCE',
      ruleLevel: '2',
      ruleName: '附件版本一致性检查',
      reviewOpinion: '2',
      reviewConclude: '可研报告与投资估算表版本号不一致，建议确认最终有效版本。'
    }),
    // 线上大模型规则示例（LLM_*）：审核要点为「建议书 ↔ 估算书」逐项语义比对，
    // 要点结论允许与规则整体结论不同（要点1 通过、规则整体 待复核）。
    createRule({
      detailId: 'mock-detail-compliance-cya001',
      ruleId: 'LLM-CYA001',
      ruleCode: 'LLM_CYA001',
      ruleClassify: 'COMPLIANCE',
      ruleLevel: '2',
      ruleName: '建议书与估算书一致性校验',
      reviewOpinion: '2',
      reviewConclude:
        '建议书设备材料名称与估算书明细基本对应，但存在多处重复且“终端标识牌”无单列项；核心工序中“终端与主站联调消缺”“旧终端报废处置”语义覆盖不完整，需人工核实。'
    })
  ]
}

const getAllRules = () => Object.values(RULES_BY_CLASSIFY).flat()

const findRule = (detailId: string) => getAllRules().find((item) => item.detailId === detailId)

const buildAuditSummary = () => {
  const rules = getAllRules()
  const unresolvedRules = rules.filter((item) => item.reviewOpinion !== '1')
  const hasFailed = rules.some((item) => item.reviewOpinion === '0')
  const hasPending = rules.some((item) => item.reviewOpinion === '2')
  const auditResult = hasFailed ? '0' : hasPending ? '2' : '1'

  return {
    auditConclude:
      auditResult === '1'
        ? '所有模拟审核规则均已通过。'
        : `模拟审核共发现 ${unresolvedRules.length} 项需要处理的内容，其中包含价格偏差、资料完整性及单位换算等问题，建议完成复核后再提交。`,
    auditResult,
    reviewTime: '2026-07-12 10:30:00',
    ruleLevelFindNumList: ['1', '2', '3'].map((ruleLevel) => ({
      findNum: unresolvedRules.filter((item) => item.ruleLevel === ruleLevel).length,
      ruleLevel,
      ruleLevelName: ruleLevel === '1' ? '发现问题数' : ruleLevel === '2' ? '发现隐患数' : '发现异常数'
    }))
  }
}

Object.entries(COMMON_CODE_MAP).forEach(([code, data]) => {
  Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${code}(?:&|$)`), 'get', () => success(clone(data)))
})

Mock.mock(/ai-audit-task-manage\/getTaskPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const filtered = TASK_ROWS.filter((row) => {
    const matchEjdw =
      !Array.isArray(body.ejdwList) ||
      !body.ejdwList.length ||
      body.ejdwList.some((value: unknown) => [row.ejdwCode, row.ejdw].includes(String(value)))
    const matchProjectCode =
      !Array.isArray(body.xmbmList) || !body.xmbmList.length || body.xmbmList.some((value: unknown) => includesText(row.xmbm, value))

    return (
      includesText(row.taskName, body.taskName) &&
      includesText(row.jhssnd, body.jhssnd) &&
      matchesList(row.proType, body.proTypeList) &&
      (!body.yjdw || [row.yjdwCode, row.yjdw].includes(String(body.yjdw))) &&
      matchEjdw &&
      matchProjectCode &&
      (!body.status || row.status === String(body.status)) &&
      (!body.docPreStatus || row.docPreStatus === String(body.docPreStatus)) &&
      (!body.isHis || row.isHis === String(body.isHis)) &&
      (!body.priority || row.priority === String(body.priority)) &&
      includesText(row.createTime, body.createTime)
    )
  })
  const rows = filtered.map(({ yjdwCode, ejdwCode, ...row }) => row)

  return success(pageResult(rows, body.page, body.limit))
})

Mock.mock(/xmAttributeConfig\/getXmInfo\?[^#]*xmId=mock-project-/, 'get', () => clone(getXmInfoResponse))

Mock.mock(/xmAttributeConfig\/getTabColumns\?[^#]*xmid=mock-project-/, 'get', () => clone(getTabColumnsResponse))

Mock.mock(/ai-audit-task-manage\/getXmAuditConclude(\?.*)?$/, 'get', () => success(buildAuditSummary()))

Mock.mock(/ai-audit-task-manage\/getAuditTaskIdByProId(\?.*)?$/, 'get', (options: MockOptions) => {
  const proId = getQueryValue(options.url, 'proId')
  return proId ? success({ taskId: MOCK_TASK_ID }) : fail('缺少项目ID')
})

Mock.mock(/ai-audit-task-manage\/listRuleReview(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ruleClassify = String(body.ruleClassify || '')
  const taskId = String(body.taskId || MOCK_TASK_ID)
  const reviewOpinions = new Set(
    String(body.reviewOpinions || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
  const source = ruleClassify ? RULES_BY_CLASSIFY[ruleClassify] || [] : getAllRules()
  const list = reviewOpinions.size ? source.filter((item) => reviewOpinions.has(item.reviewOpinion)) : source

  return success(
    list.map((item) => ({
      detailId: item.detailId,
      reviewConclude: item.reviewConclude,
      // 与线上一致：列表接口即下发 reviewMessage（相似项目 top10 的 JSON 文本），
      // smartTaskAudit / workbenchView 直接从列表项解析 top10，不必等详情接口。
      reviewMessage: item.reviewMessage,
      reviewOpinion: item.reviewOpinion,
      reviewOpinionName: item.reviewOpinionName,
      ruleCode: item.ruleCode,
      ruleDesc: item.ruleDesc,
      ruleId: item.ruleId,
      ruleLevel: item.ruleLevel,
      ruleName: item.ruleName,
      status: item.status,
      taskId
    }))
  )
})

Mock.mock(/ai-audit-task-manage\/getRuleReview(\?.*)?$/, 'get', (options: MockOptions) => {
  const detailId = getQueryValue(options.url, 'detailId')
  const rule = findRule(detailId)
  return rule ? success(clone(rule)) : fail(`未找到模拟评审详情：${detailId}`)
})

Mock.mock(/ai-audit-task-manage\/getProcessProgress(\?.*)?$/, 'get', (options: MockOptions) => {
  const taskId = getQueryValue(options.url, 'taskId')
  if (!taskId) return fail('缺少任务ID')

  return success({
    transcode: [
      {
        name: MOCK_OFFICE_SAMPLES.docx.fileName,
        startTime: '2026-07-12 09:30:00',
        finishTime: '2026-07-12 09:31:18',
        status: '3',
        statusName: '已完成'
      },
      {
        name: MOCK_OFFICE_SAMPLES.xlsx.fileName,
        startTime: '2026-07-12 09:30:05',
        finishTime: '2026-07-12 09:31:42',
        status: '3',
        statusName: '已完成'
      }
    ],
    extract: [
      {
        name: MOCK_OFFICE_SAMPLES.docx.fileName,
        startTime: '2026-07-12 09:31:20',
        finishTime: '2026-07-12 09:34:26',
        status: '2',
        statusName: '已完成'
      },
      {
        name: MOCK_OFFICE_SAMPLES.xlsx.fileName,
        startTime: '2026-07-12 09:31:44',
        finishTime: '2026-07-12 09:34:58',
        status: '2',
        statusName: '已完成'
      }
    ],
    aiAudit: getAllRules()
      .slice(0, 4)
      .map((rule, index) => ({
        name: rule.ruleName,
        startTime: `2026-07-12 09:${String(36 + index).padStart(2, '0')}:00`,
        finishTime: `2026-07-12 09:${String(38 + index).padStart(2, '0')}:30`,
        status: rule.status,
        statusName: rule.status === '2' ? '审核中' : '已完成'
      }))
  })
})

Mock.mock(/ai-audit-task-manage\/redoAuditRule(\?.*)?$/, 'post', (options: MockOptions) => {
  const detailId = getQueryValue(options.url, 'detailId')
  const rule = findRule(detailId)
  if (!rule) return fail(`未找到需要重新分析的模拟规则：${detailId}`)

  rule.status = '1'
  rule.reviewOpinion = '1'
  rule.reviewOpinionName = '通过'
  rule.reviewConclude = `模拟重新分析已完成：${rule.ruleName}的补充依据已满足审核要求。`
  rule.reviewProcess = '<p>重新读取补充材料并执行相同规则后，原异常项已消除。</p><p>重新分析结果：<strong>通过</strong>。</p>'
  // 审核要点结论随规则结论一并刷新，避免详情页出现「规则通过、要点不通过」的矛盾数据
  rule.points = rule.points.map((point) => ({
    ...point,
    reviewConclusion: '通过',
    conclusionDescription: `补充材料已覆盖“${point.pointName}”原有疑点，重新核验后该要点通过。`
  }))
  try {
    const message = JSON.parse(rule.reviewMessage)
    if (message?.detailedReasoning?.reviewPoints) {
      rule.reviewMessage = JSON.stringify(
        {
          ...message,
          conclusion: '通过',
          reviewSummary: rule.reviewConclude,
          detailedReasoning: {
            reviewPoints: rule.points.map(({ id: _id, proId: _proId, detailId: _detailId, ...point }) => point),
            summary: '重新读取补充材料并执行相同规则后，原异常项已消除。'
          }
        },
        null,
        2
      )
    }
  } catch {
    // 相似性规则等非 detailedReasoning 结构保持原样
  }

  try {
    const tables = JSON.parse(rule.reviewTable)
    if (Array.isArray(tables)) {
      rule.reviewTable = JSON.stringify(
        tables.map((table: any) => ({
          ...table,
          rows: Array.isArray(table.rows) ? table.rows.map((row: any) => ({ ...row, result: '通过' })) : []
        }))
      )
    }
  } catch {
    // 解析失败时保留原表，不影响重新分析主流程
  }

  return success({ detailId }, '重新分析任务已提交')
})

// ==================== 源文件 / 附件预览 ====================

interface MockAttach {
  id: string
  fjId: string
  uuid: string
  name: string
  size: number
  proId: string
  fjType?: string
  uploadUserId?: string
  uploadUserName?: string
}

const ATTACH_TYPE_PRESETS = [
  { fjId: 'FJ_XYKC', fjType: '协议库存成交记录' },
  { fjId: 'FJ_GWSC', fjType: '国网商城比价截图' },
  { fjId: 'FJ_XJYJ', fjType: '询价依据' },
  { fjId: 'FJ_BJQD', fjType: '报价清单' },
  { fjId: 'FJ_CGHT', fjType: '采购合同' },
  { fjId: 'FJ_XCZP', fjType: '现场照片' }
]

const createMockAttach = (params: { id: string; uuid: string; name: string; fjId: string; fjType: string; size?: number }): MockAttach => ({
  id: params.id,
  fjId: params.fjId,
  uuid: params.uuid,
  name: params.name,
  size: params.size ?? 128 * 1024,
  proId: MOCK_PROJECT_ID,
  fjType: params.fjType,
  uploadUserId: 'mock-user-001',
  uploadUserName: '模拟用户'
})

/** 按 detailId 定制附件列表；文件名扩展名决定 previewAttach 映射的本地样例 */
const ATTACHES_BY_DETAIL: Record<string, MockAttach[]> = {
  'mock-detail-price-001': [
    createMockAttach({
      id: '900001',
      uuid: 'mock-attach-price-001-xlsx',
      name: MOCK_OFFICE_SAMPLES.xlsx.fileName,
      fjId: 'FJ_XYKC',
      fjType: '协议库存成交记录',
      size: MOCK_OFFICE_SAMPLES.xlsx.size
    }),
    createMockAttach({
      id: '900002',
      uuid: 'mock-attach-price-001-pdf',
      name: MOCK_OFFICE_SAMPLES.pdf.fileName,
      fjId: 'FJ_GWSC',
      fjType: '国网商城比价截图',
      size: MOCK_OFFICE_SAMPLES.pdf.size
    }),
    createMockAttach({
      id: '900003',
      uuid: 'mock-attach-price-001-docx',
      name: MOCK_OFFICE_SAMPLES.docx.fileName,
      fjId: 'FJ_XJYJ',
      fjType: '询价依据',
      size: MOCK_OFFICE_SAMPLES.docx.size
    }),
    createMockAttach({
      id: '900004',
      uuid: 'mock-attach-price-001-et',
      name: MOCK_OFFICE_SAMPLES.et.fileName,
      fjId: 'FJ_BJQD',
      fjType: '报价清单',
      size: MOCK_OFFICE_SAMPLES.et.size
    }),
    createMockAttach({
      id: '900006',
      uuid: 'mock-attach-price-001-doc',
      name: MOCK_OFFICE_SAMPLES.doc.fileName,
      fjId: 'FJ_CGHT',
      fjType: '采购合同',
      size: MOCK_OFFICE_SAMPLES.doc.size
    }),
    // 不支持预览的类型，用于验证操作列禁用态
    createMockAttach({
      id: '900005',
      uuid: 'mock-attach-price-001-jpg',
      name: '现场核价照片.jpg',
      fjId: 'FJ_XCZP',
      fjType: '现场照片',
      size: 2048000
    })
  ],
  'mock-detail-price-002': [
    createMockAttach({
      id: '900011',
      uuid: 'mock-attach-price-002-pdf',
      name: MOCK_OFFICE_SAMPLES.pdf.fileName,
      fjId: 'FJ_XJYJ',
      fjType: '询价依据',
      size: MOCK_OFFICE_SAMPLES.pdf.size
    }),
    createMockAttach({
      id: '900012',
      uuid: 'mock-attach-price-002-xlsx',
      name: MOCK_OFFICE_SAMPLES.xlsx.fileName,
      fjId: 'FJ_GWSC',
      fjType: '国网商城比价截图',
      size: MOCK_OFFICE_SAMPLES.xlsx.size
    })
  ],
  'mock-detail-info-001': [
    createMockAttach({
      id: '900021',
      uuid: 'mock-attach-info-001-docx',
      name: MOCK_OFFICE_SAMPLES.docx.fileName,
      fjId: 'FJ_XJYJ',
      fjType: '询价依据',
      size: MOCK_OFFICE_SAMPLES.docx.size
    }),
    createMockAttach({
      id: '900022',
      uuid: 'mock-attach-info-001-pdf',
      name: MOCK_OFFICE_SAMPLES.pdf.fileName,
      fjId: 'FJ_CGHT',
      fjType: '采购合同',
      size: MOCK_OFFICE_SAMPLES.pdf.size
    }),
    createMockAttach({
      id: '900023',
      uuid: 'mock-attach-info-001-doc',
      name: MOCK_OFFICE_SAMPLES.doc.fileName,
      fjId: 'FJ_XJYJ',
      fjType: '询价依据',
      size: MOCK_OFFICE_SAMPLES.doc.size
    })
  ]
}

/** attachId（listAttach 的 id）→ 附件元数据，供 previewAttach 按 id 取文件名并映射样例 */
const MOCK_ATTACH_INDEX: Record<string, MockAttach> = {}
Object.values(ATTACHES_BY_DETAIL).forEach((list) => {
  list.forEach((item) => {
    MOCK_ATTACH_INDEX[String(item.id)] = item
  })
})

const buildDefaultAttaches = (detailId: string, ruleName: string): MockAttach[] => {
  const shortId = detailId.replace(/^mock-detail-/, '') || 'default'
  const list = [
    createMockAttach({
      id: `${detailId}-1`,
      uuid: `mock-attach-${shortId}-pdf`,
      name: `${ruleName}-支撑材料.pdf`,
      fjId: ATTACH_TYPE_PRESETS[0].fjId,
      fjType: ATTACH_TYPE_PRESETS[0].fjType,
      size: MOCK_OFFICE_SAMPLES.pdf.size
    }),
    createMockAttach({
      id: `${detailId}-2`,
      uuid: `mock-attach-${shortId}-xlsx`,
      name: `${ruleName}-数据明细.xlsx`,
      fjId: ATTACH_TYPE_PRESETS[3].fjId,
      fjType: ATTACH_TYPE_PRESETS[3].fjType,
      size: MOCK_OFFICE_SAMPLES.xlsx.size
    }),
    createMockAttach({
      id: `${detailId}-3`,
      uuid: `mock-attach-${shortId}-docx`,
      name: `${ruleName}-说明文档.docx`,
      fjId: ATTACH_TYPE_PRESETS[2].fjId,
      fjType: ATTACH_TYPE_PRESETS[2].fjType,
      size: MOCK_OFFICE_SAMPLES.docx.size
    })
  ]
  list.forEach((item) => {
    MOCK_ATTACH_INDEX[String(item.id)] = item
  })
  return list
}

const listMockAttaches = (detailId: string): MockAttach[] => {
  if (ATTACHES_BY_DETAIL[detailId]) {
    return clone(ATTACHES_BY_DETAIL[detailId])
  }

  const rule = findRule(detailId)
  if (rule) {
    return buildDefaultAttaches(detailId, rule.ruleName)
  }

  return []
}

const findMockAttachById = (attachId: string): MockAttach | undefined => {
  if (MOCK_ATTACH_INDEX[attachId]) return MOCK_ATTACH_INDEX[attachId]
  // 默认生成附件 id 形如 mock-detail-xxx-1，列表可能尚未触发索引
  return Object.values(MOCK_ATTACH_INDEX).find((item) => String(item.id) === attachId || String(item.uuid) === attachId)
}

Mock.mock(/ai-audit-task-manage\/listAttach(\?.*)?$/, 'get', (options: MockOptions) => {
  const detailId = getQueryValue(options.url, 'detailId')
  if (!detailId) return fail('缺少明细ID')

  const list = listMockAttaches(detailId)
  if (!list.length && !findRule(detailId)) {
    return fail(`未找到模拟附件列表：${detailId}`)
  }

  return success(list)
})

// 预览源文件：attachId = listAttach 返回的 id；直接返回真实样例二进制流（exportFile + responseType blob）
// 样例文件：public/mock-files/office-preview/*（源目录 C:\Users\13934\Downloads\file）
const previewAttachHandler = async (options: MockOptions) => {
  const attachId = getQueryValue(options.url, 'attachId')
  if (!attachId) return fail('缺少附件类型ID')

  // 正文 .attachView 可能只带 id，列表里未必有：按 id 后缀猜测扩展名，否则默认 pdf
  let attach = findMockAttachById(attachId)
  if (!attach) {
    // 确保默认列表已写入索引
    getAllRules().forEach((rule) => listMockAttaches(rule.detailId))
    attach = findMockAttachById(attachId)
  }

  const displayName = attach?.name || `${attachId}.pdf`
  // jpg 等不支持类型：返回假 PDF 头，让前端按扩展名拒绝或 OfficePreview 报错
  const ext = String(displayName).split('.').pop()?.toLowerCase()
  if (ext && !['pdf', 'doc', 'docx', 'xlsx', 'xls', 'et'].includes(ext)) {
    return fail(`暂不支持预览该文件类型：${ext}`)
  }

  try {
    const sample = resolveSampleByFileName(displayName)
    const blob = await loadOfficeSampleBlob(sample)
    return binaryResponse(blob, {
      contentType: sample.contentType,
      fileName: attach?.name || sample.fileName
    })
  } catch (error: unknown) {
    return fail(error instanceof Error ? error.message : '模拟预览文件加载失败')
  }
}

Mock.mock(/ai-audit-task-manage\/previewAttach(\?.*)?$/, 'get', previewAttachHandler)
Mock.mock(/ai-audit-task-manage\/previewAttach(\?.*)?$/, 'post', previewAttachHandler)
