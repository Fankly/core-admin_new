// 联合会审 mock 共享数据与常量
// 三个清单页（专家预审 / 线下会审 / 线下会审退回）+ 入口页共用一份会议、项目、专家评审数据，
// 保证跨页面、跨接口的数据自洽（同一 meetingId / xmId 在不同接口里字段一致）。

// ==================== 业务标识（用于收窄全局登录链路的 mock 拦截范围） ====================

// 各入口页对应的 busicode（= 菜单 outsideMenu）。projectManifest 里硬编码的 menuCode 与之一致。
export const EXPERT_BUSICODE = 'XQC-LHHSXSSJCT' // 专家线上预审驾驶舱
export const OFFLINE_BUSICODE = 'XQC-LHHSSJTCZJPS' // 省级统筹终评（线下会审）
export const OFFLINE_RETURN_BUSICODE = 'XQC-LHHSSJTCZJPSTH' // 线下会审退回
/** 目标库审批等入口 busicode（getRoleByBusicode 单独收窄拦截） */
export const MBZKZPLXG_BUSICODE = 'MBZKZPLXG'

export const JOINT_REVIEW_BUSICODES = [EXPERT_BUSICODE, OFFLINE_BUSICODE, OFFLINE_RETURN_BUSICODE]
/** getRoleByBusicode 需要 mock 的 busicode（含非联合会审入口） */
export const ROLE_MOCK_BUSICODES = [...JOINT_REVIEW_BUSICODES, MBZKZPLXG_BUSICODE]

// 各页面按钮权限码（getButtonList 返回）
export const BUTTON_PERMISSIONS: Record<string, string[]> = {
  [EXPERT_BUSICODE]: ['IMPORT', 'EXPORT', 'FJEXPORT', 'XXEXPORT', 'HISTORY'],
  [OFFLINE_BUSICODE]: ['XXHS', 'TH', 'EXPORT', 'FJEXPORT', 'XXEXPORT', 'HISTORY'],
  [OFFLINE_RETURN_BUSICODE]: ['XXHS', 'TH']
}

// ==================== 组织 / 专家基础数据 ====================

export const MOCK_USER_ID = 'mock-user-001'
export const MOCK_ACCOUNT = 'mock_expert'

// 一级单位（getYjdwData 返回，note 为简称）
export const YJDW_LIST = [
  { id: 'DW001', code: 'DW001', name: '国网江苏省电力有限公司', note: '江苏' },
  { id: 'DW002', code: 'DW002', name: '国网南京供电公司', note: '南京' },
  { id: 'DW003', code: 'DW003', name: '国网苏州供电公司', note: '苏州' },
  { id: 'DW004', code: 'DW004', name: '国网无锡供电公司', note: '无锡' }
]

// 二级单位（getEjdwData 按 parentId 返回）
export const EJDW_MAP: Record<string, Array<{ id: string; code: string; name: string }>> = {
  DW001: [
    { id: 'DW001-01', code: 'DW001-01', name: '设备管理部' },
    { id: 'DW001-02', code: 'DW001-02', name: '财务部' }
  ],
  DW002: [{ id: 'DW002-01', code: 'DW002-01', name: '运维检修部' }],
  DW003: [{ id: 'DW003-01', code: 'DW003-01', name: '项目管理中心' }],
  DW004: [{ id: 'DW004-01', code: 'DW004-01', name: '建设管理部' }]
}

// 省专业归口部门（getGkbmInProvince 返回）
export const GKBM_LIST = [
  { id: 'gkbm-001', code: 'gkbm-001', name: '财务部' },
  { id: 'gkbm-002', code: 'gkbm-002', name: '发展策划部' },
  { id: 'gkbm-003', code: 'gkbm-003', name: '设备管理部' }
]

// 评审批次（lhhs/pspc/getList 返回，支持按年度联动筛选）
export const REVIEW_BATCHES = [
  { id: 'pspc-001', code: 'pspc-001', name: '2026年第一批', nd: '2026' },
  { id: 'pspc-002', code: 'pspc-002', name: '2026年第二批', nd: '2026' },
  { id: 'pspc-003', code: 'pspc-003', name: '2025年第四季度批次', nd: '2025' }
]

// 专家信息（getListPageDataByAccount 返回的单条专家）
export const MOCK_EXPERT = {
  id: 'expert-001',
  expertName: '张明远',
  major: 'CW', // 对应 MAJOR_COM 里的编码
  resume: '国网系统财务评审专家，长期从事电网工程投资概预算审核工作，累计参与联合会审百余次。',
  sex: '1'
}

// 评审概览（getPsgl 返回）
export const MOCK_OVERVIEW = {
  cypshysl: '36',
  xmsl: '1280',
  yqcs: '2',
  ljcyhypm: '3',
  ljpsxmpm: '5'
}

// 角色（getRoleByBusicode 返回裸数组，字段名对齐 userDialog / UserRoleSelector 的取值）
// specialorgcode 需为 BM_CWZC，与 aiAudit 默认可见部门一致，否则 AI 审核意见不展示
export const buildRole = (busicode: string) => ({
  id: `sprole-${busicode}`,
  name: '财务预算专职',
  code: 'SCWYSZZ',
  role_id: 'role-001',
  specialorgid: 'bm-001',
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  org_id: 'DW001',
  org_name: '国网江苏省电力有限公司',
  namecode: MOCK_ACCOUNT,
  busicode
})

// ==================== 公共代码字典（commonCode/getData?code=xx） ====================

export const COMMON_CODE_MAP: Record<string, Array<Record<string, any>>> = {
  // 评审意见（通用 / 各阶段）
  LHHS_REVIEW_OPINION_COM: [
    { code: '1', name: '通过' },
    { code: '0', name: '不通过' }
  ],
  LHHS_XSYSJD_REVIEW_OPINION_COM: [
    { code: '1', name: '通过' },
    { code: '0', name: '不通过' }
  ],
  LHHS_XXHSJD_REVIEW_OPINION_COM: [
    { code: '1', name: '通过' },
    { code: '0', name: '不通过' }
  ],
  LHHS_XXHSJD_FS_REVIEW_OPINION_COM: [
    { code: '1', name: '通过' },
    { code: '0', name: '不通过' },
    { code: '2', name: '退回' }
  ],
  // 专家规则人工复核意见（AiManualReviewModal；0 = 不采纳，意见说明必填）
  LHHS_EXPERT_RULE_REVIEW_OPINION_COM: [
    { code: '1', name: '采纳' },
    { code: '0', name: '不采纳' }
  ],
  // 线下会审结论
  LHHS_XXHS_JL_COM: [
    { code: '1', name: '同意' },
    { code: '0', name: '不同意' },
    { code: '2', name: '退回' }
  ],
  // 线下会审通过原因（按部门取 note）
  LHHS_XXHS_PASS_REASON_COM: [
    { code: 'DEVELOPMENT', name: '发展部通过', note: '经审查，项目符合发展规划及投资计划要求，同意通过。' },
    { code: 'FINANCE', name: '财务部通过', note: '经审查，项目预算编制合规、资金安排合理，同意通过。' }
  ],
  // 预审状态
  LHHS_YSZT: [
    { code: '0', name: '待预审' },
    { code: '1', name: '已预审' }
  ],
  // 会议状态
  LHHS_MEETING_STATUS: [
    { code: '00', name: '即将开始' },
    { code: '01', name: '评审中' },
    { code: '02', name: '已结束' }
  ],
  // 评审模式
  LHHS_PSMS: [
    { code: '01', name: '集中评审' },
    { code: '02', name: '分派评审' }
  ],
  // 项目计划实施年度
  ZLYS_XMJHSSND: [
    { code: '2026', name: '2026年' },
    { code: '2025', name: '2025年' },
    { code: '2024', name: '2024年' }
  ],
  // 省专业归口部门（部分旧页面仍通过公共代码读取）
  QMYS_ZZJG: GKBM_LIST.map(({ code, name }) => ({ code, name })),
  // 专业
  MAJOR_COM: [
    { code: 'CW', name: '财务' },
    { code: 'FZ', name: '发展' },
    { code: 'JS', name: '技术' }
  ],
  // 年度查询（联合会审驾驶舱年份筛选）
  NDCX: [
    { code: '2026', name: '2026年' },
    { code: '2025', name: '2025年' },
    { code: '2024', name: '2024年' }
  ]
}

// ==================== 会议数据 ====================

// 入口页（专家预审）会议卡片
export interface ExpertMeeting {
  meetingId: string
  meetingCode: string
  meetingName: string
  meetingStatus: string
  ysly: string
  yslyName: string
  totalCount: number
  thCount: number
  reviewedCount: number
  pendingReviewCount: number
  pspcId: string
  lhhsOneStartTime: string
  lhhsOneEndTime: string
  lhhsTwoStartTime: string
  lhhsTwoEndTime: string
  startTime: string
  endTime: string
  meetingAttachList: Array<{ attachName: string; name: string; uuid: string }>
}

export const EXPERT_MEETINGS: ExpertMeeting[] = [
  {
    meetingId: 'meeting-001',
    meetingCode: 'LHHS-2026-001',
    meetingName: '2026年第一批技改大修项目联合会审',
    meetingStatus: '01',
    ysly: '1',
    yslyName: '省级统筹',
    totalCount: 12,
    thCount: 1,
    reviewedCount: 5,
    pendingReviewCount: 6,
    pspcId: 'pspc-001',
    lhhsOneStartTime: '2026-07-01 09:00',
    lhhsOneEndTime: '2026-07-10 18:00',
    lhhsTwoStartTime: '2026-07-12 09:00',
    lhhsTwoEndTime: '2026-07-15 18:00',
    startTime: '2026-07-01 09:00',
    endTime: '2026-07-15 18:00',
    meetingAttachList: [{ attachName: '会议通知.pdf', name: '会议通知.pdf', uuid: 'attach-001' }]
  },
  {
    meetingId: 'meeting-002',
    meetingCode: 'LHHS-2026-002',
    meetingName: '2026年第二批基建项目联合会审',
    meetingStatus: '00',
    ysly: '2',
    yslyName: '单位自筹',
    totalCount: 8,
    thCount: 0,
    reviewedCount: 0,
    pendingReviewCount: 8,
    pspcId: 'pspc-002',
    lhhsOneStartTime: '2026-08-01 09:00',
    lhhsOneEndTime: '2026-08-10 18:00',
    lhhsTwoStartTime: '2026-08-12 09:00',
    lhhsTwoEndTime: '2026-08-15 18:00',
    startTime: '2026-08-01 09:00',
    endTime: '2026-08-15 18:00',
    meetingAttachList: []
  },
  {
    meetingId: 'meeting-003',
    meetingCode: 'LHHS-2025-020',
    meetingName: '2025年第四季度收尾项目联合会审',
    meetingStatus: '02',
    ysly: '1',
    yslyName: '省级统筹',
    totalCount: 15,
    thCount: 3,
    reviewedCount: 15,
    pendingReviewCount: 0,
    pspcId: 'pspc-003',
    lhhsOneStartTime: '2025-11-01 09:00',
    lhhsOneEndTime: '2025-11-10 18:00',
    lhhsTwoStartTime: '2025-11-12 09:00',
    lhhsTwoEndTime: '2025-11-15 18:00',
    startTime: '2025-11-01 09:00',
    endTime: '2025-11-15 18:00',
    meetingAttachList: []
  }
]

// 线下会审入口（pageSjtcMeetingInfo）会议行
export interface OfflineMeeting {
  meetingId: string
  meetingName: string
  meetingCode: string
  status: string
  bmName: string
  psms: string
  pspcName: string
  meetingAddr: string
  organizer: string
  phone: string
  yslyName: string
  nd: string
  pspcId: string
  zgkbmId: string
  zgkbmName: string
  startTime: string
  endTime: string
  majorName: string
  xmNum: number
  sumJe: string
  zjNum: number
  lhhsOneStartTime: string
  lhhsOneEndTime: string
}

export const OFFLINE_MEETINGS: OfflineMeeting[] = EXPERT_MEETINGS.map((m, i) => ({
  meetingId: m.meetingId,
  meetingName: m.meetingName,
  meetingCode: m.meetingCode,
  status: m.meetingStatus,
  bmName: '财务部',
  psms: i === 0 ? '01' : '02',
  pspcName: `第${i + 1}批`,
  meetingAddr: '省公司三楼会议室',
  organizer: '李组织',
  phone: '025-8888000' + i,
  yslyName: m.yslyName,
  nd: m.startTime.slice(0, 4),
  pspcId: m.pspcId,
  zgkbmId: GKBM_LIST[i % GKBM_LIST.length].code,
  zgkbmName: GKBM_LIST[i % GKBM_LIST.length].name,
  startTime: m.lhhsTwoStartTime,
  endTime: m.lhhsTwoEndTime,
  majorName: '财务、发展、技术',
  xmNum: m.totalCount,
  sumJe: `${(m.totalCount * 386.5).toFixed(2)}`,
  zjNum: 6,
  lhhsOneStartTime: m.lhhsOneStartTime,
  lhhsOneEndTime: m.lhhsOneEndTime
}))

// ==================== 项目数据 ====================

export interface MockProject {
  xmId: string
  originXmId: string
  xmbm: string
  xmmc: string
  yssxmc: string
  jhssnd: string
  all_invest_tax: string
  amount: string
  ssnr: string
  byx: string
  pro_type_id: string
  isPack: string
  fscs: number
  xsysThcs: number
  xxhsThcs: number
  flowStatus: string
  yjdw: string
  // AI 智能审核标签
  aishResult: string
  aishResultName: string
  aishMessage: string
  sfaishxm: number
  // 评审回显
  review_opinion_code: string
  review_reason: string
  review_stage: string
  // 线下会审意见
  xxhsJlFz: string
  fzbReason: string
  xxhsJlCw: string
  cwbReason: string
  // 会审状态归属
  meetingId: string
  reviewStatus: string // 专家：0 待预审 / 1 已预审
  leaderReviewStatus: string // 会审：0 待会审 / 1 已会审
}

const PROJECT_CONTENT = {
  ssnr:
    '对本供电区域内配电自动化终端进行改造升级，更换老旧馈线终端 128 套，新增通信模块 96 套，' +
    '完成主站系统联调及现场验收，提升配网故障自愈能力与运行监测水平。',
  byx:
    '现有配电自动化终端服役年限已达 8 年以上，故障率逐年升高，通信中断频发，' +
    '已无法满足配网精益化运维要求，改造后可显著提升供电可靠性，具有较强的必要性。'
}

const buildProject = (index: number, meetingId: string): MockProject => {
  const seq = index + 1
  const unit = YJDW_LIST[index % YJDW_LIST.length]
  const fscs = index % 3 === 2 ? 1 : 0
  const aishResults = ['', '1', '2', '3']
  const aishResult = aishResults[index % aishResults.length]
  const aishResultName = aishResult === '1' ? '低风险' : aishResult === '2' ? '中风险' : aishResult === '3' ? '高风险' : ''
  return {
    xmId: `${meetingId}-xm-${String(seq).padStart(3, '0')}`,
    originXmId: `origin-xm-${String(seq).padStart(3, '0')}`,
    xmbm: `XM2026P${20000 + seq}`,
    xmmc: `${unit.note}公司配电自动化终端改造项目（${seq}）`,
    yssxmc: `${unit.note}配网技改预算事项`,
    jhssnd: '2026',
    all_invest_tax: `${(386.5 + seq).toFixed(2)}`,
    amount: `${(342.04 + seq).toFixed(2)}`,
    ssnr: PROJECT_CONTENT.ssnr,
    byx: PROJECT_CONTENT.byx,
    pro_type_id: 'PT02',
    isPack: '0',
    fscs,
    xsysThcs: index % 2,
    xxhsThcs: 0,
    flowStatus: 'A01',
    yjdw: unit.name,
    aishResult,
    aishResultName,
    aishMessage: aishResult === '3' ? '申报单价高于参考价 11.72%，存在价格偏差风险' : '',
    sfaishxm: index % 2 === 0 ? 1 : 0,
    review_opinion_code: '1',
    review_reason: '经审查，项目建设内容明确、投资测算合理，同意通过。',
    review_stage: '1',
    xxhsJlFz: '',
    fzbReason: '',
    xxhsJlCw: '',
    cwbReason: '',
    meetingId,
    reviewStatus: index < 6 ? '0' : '1',
    leaderReviewStatus: index < 6 ? '0' : '1'
  }
}

/**
 * 市级会审会议（评审工作台 type=2 使用）
 * meetingId 前缀 city-meeting-，与省级 meeting- 区分；
 * 进入 reviewDeatil 时 expertReview/pageXmInfo 按 meetingId 取项目。
 */
export type CityWorkbenchMeeting = {
  meetingId: string
  meetingCode: string
  meetingName: string
  status: '00' | '01' | '02'
  startTime: string
  endTime: string
  expertCount: number
  totalCount: number
  reviewedCount: number
  thCount: number
  pendingReviewCount: number
}

export const CITY_WORKBENCH_MEETINGS: CityWorkbenchMeeting[] = [
  {
    meetingId: 'city-meeting-001',
    meetingCode: 'SJHS-2026-003',
    meetingName: '南京供电公司2026年第一批成本性项目市级会审',
    status: '01',
    startTime: '2026-07-05 09:00',
    endTime: '2026-07-12 18:00',
    expertCount: 5,
    totalCount: 8,
    reviewedCount: 3,
    thCount: 1,
    pendingReviewCount: 4
  },
  {
    meetingId: 'city-meeting-002',
    meetingCode: 'SJHS-2026-004',
    meetingName: '苏州供电公司2026年配网技改市级联合会审',
    status: '00',
    startTime: '2026-08-10 09:00',
    endTime: '2026-08-18 18:00',
    expertCount: 4,
    totalCount: 6,
    reviewedCount: 0,
    thCount: 0,
    pendingReviewCount: 6
  },
  {
    meetingId: 'city-meeting-003',
    meetingCode: 'SJHS-2025-012',
    meetingName: '无锡供电公司2025年营销项目市级会审',
    status: '02',
    startTime: '2025-10-08 09:00',
    endTime: '2025-10-20 18:00',
    expertCount: 7,
    totalCount: 10,
    reviewedCount: 10,
    thCount: 2,
    pendingReviewCount: 0
  },
  {
    meetingId: 'city-meeting-004',
    meetingCode: 'SJHS-2026-006',
    meetingName: '常州供电公司2026年变电技改市级会审',
    status: '01',
    startTime: '2026-07-15 09:00',
    endTime: '2026-07-25 18:00',
    expertCount: 5,
    totalCount: 5,
    reviewedCount: 2,
    thCount: 0,
    pendingReviewCount: 3
  }
]

// 每个会议一组项目（省级 + 市级工作台）
const PROJECTS_BY_MEETING: Record<string, MockProject[]> = {}
EXPERT_MEETINGS.forEach((m) => {
  PROJECTS_BY_MEETING[m.meetingId] = Array.from({ length: m.totalCount }, (_, i) => buildProject(i, m.meetingId))
})
CITY_WORKBENCH_MEETINGS.forEach((m) => {
  PROJECTS_BY_MEETING[m.meetingId] = Array.from({ length: m.totalCount }, (_, i) => buildProject(i, m.meetingId))
})

export const getProjectsByMeeting = (meetingId: string): MockProject[] => PROJECTS_BY_MEETING[meetingId] || []

export const findProject = (xmId: string): MockProject | undefined => {
  for (const list of Object.values(PROJECTS_BY_MEETING)) {
    const hit = list.find((p) => p.xmId === xmId)
    if (hit) return hit
  }
  return undefined
}

// ==================== 专家评审意见 ====================

export interface ExpertReviewRow {
  reviewExpertName: string
  major: string
  reviewOpinion: string
  reviewOpinionCode: string
  reviewReason: string
  reviewTime: string
  reviewOpinionName: string
}

export const buildExpertReviews = (xmId: string): ExpertReviewRow[] => {
  const experts = [
    { name: '张明远', major: '财务', code: '1', reason: '预算编制合规，资金安排合理，同意通过。' },
    { name: '王建国', major: '技术', code: '1', reason: '技术方案可行，建设规模与需求匹配，同意通过。' },
    { name: '李慧敏', major: '发展', code: '0', reason: '建议补充与上级规划的衔接说明后再行审议。' }
  ]
  return experts.map((e, i) => ({
    reviewExpertName: e.name,
    major: e.major,
    reviewOpinion: e.code === '1' ? '通过' : '不通过',
    reviewOpinionCode: e.code,
    reviewReason: e.reason,
    reviewTime: `2026-07-1${i + 1} 10:${20 + i}:00`,
    reviewOpinionName: e.code === '1' ? '通过' : '不通过'
  }))
}

// 历史评审记录（pageXmHistoryReviewRecord）
export const buildHistoryRecords = (originXmId: string) => [
  {
    reviewExpertName: '张明远',
    reviewOpinion: '不通过',
    reviewReason: '首次评审：投资测算依据不足，退回补充。',
    reviewTime: '2026-07-05 14:30:00',
    reviewStageName: '线上预审',
    originXmId
  },
  {
    reviewExpertName: '张明远',
    reviewOpinion: '通过',
    reviewReason: '复审：补充材料齐全，同意通过。',
    reviewTime: '2026-07-11 09:15:00',
    reviewStageName: '线上预审',
    originXmId
  }
]

// ==================== 会议管理（lhhsMeeting/*） ====================

export const MEETING_EXPERTS = [
  {
    id: 'expert-001',
    expertName: '张明远',
    account: MOCK_ACCOUNT,
    isLeader: '1',
    sex: '1',
    phoneNo: '13800000001',
    mail: 'zhangmy@sgcc.com.cn',
    major: 'CW',
    majorName: '财务',
    yjdw: 'DW001',
    yjdwName: '国网江苏省电力有限公司'
  },
  {
    id: 'expert-002',
    expertName: '王建国',
    account: 'wangjg',
    isLeader: '0',
    sex: '1',
    phoneNo: '13800000002',
    mail: 'wangjg@sgcc.com.cn',
    major: 'JS',
    majorName: '技术',
    yjdw: 'DW002',
    yjdwName: '国网南京供电公司'
  },
  {
    id: 'expert-003',
    expertName: '李慧敏',
    account: 'lihm',
    isLeader: '0',
    sex: '2',
    phoneNo: '13800000003',
    mail: 'lihm@sgcc.com.cn',
    major: 'FZ',
    majorName: '发展',
    yjdw: 'DW003',
    yjdwName: '国网苏州供电公司'
  }
]

// 会议管理列表行（字段对齐 lhhsMeeting/index.vue 表格列）
export const buildMeetingManageList = () =>
  OFFLINE_MEETINGS.map((m) => ({
    ...m,
    statusName: m.status === '00' ? '即将开始' : m.status === '01' ? '评审中' : '已结束',
    major: 'CW,FZ,JS',
    majorName: m.majorName,
    sumJe: Number(m.sumJe),
    xmNum: String(m.xmNum),
    zjNum: String(m.zjNum)
  }))

const unitCodeByName = (name: string) => YJDW_LIST.find((item) => item.name === name)?.code || 'DW001'

// 待/已纳入会审项目行（PendingTrialModal / ReViewModal）
export const buildMeetingProjectRows = (meetingId: string) =>
  getProjectsByMeeting(meetingId).map((p, index) => ({
    id: `${p.xmId}-link`,
    xmId: p.xmId,
    originXmId: p.originXmId,
    meetingId: p.meetingId,
    meetingCode: OFFLINE_MEETINGS.find((m) => m.meetingId === meetingId)?.meetingCode || '',
    meetingName: OFFLINE_MEETINGS.find((m) => m.meetingId === meetingId)?.meetingName || '',
    xmbm: p.xmbm,
    xmmc: p.xmmc,
    isPackName: p.isPack === '1' ? '是' : '否',
    proType: '技改项目',
    ysly: '省级统筹',
    yjdw: unitCodeByName(p.yjdw),
    yjdwName: p.yjdw,
    ejdw: '',
    ejdwName: '',
    applyCenter: '',
    amount: p.amount,
    all_invest_tax: p.all_invest_tax,
    jhssnd: p.jhssnd,
    jhssndName: `${p.jhssnd}年`,
    zdtxName: '',
    zgkbm: '财务部',
    zgkbmId: 'gkbm-001',
    yssxmc: p.yssxmc,
    remark: '',
    yjfl: '技改',
    ejfl: '配网技改',
    sjfl: '',
    fzrbh: '',
    xmssr: '',
    ssnr: p.ssnr,
    major: 'CW',
    majorName: '财务',
    selected: index % 3 === 0
  }))

// 待纳入会审专家（与已纳入错开，保证两侧都有数据）
export const PENDING_MEETING_EXPERTS = [
  {
    id: 'expert-101',
    expertName: '赵启明',
    account: 'zhaoqm',
    isLeader: '0',
    sex: '1',
    phoneNo: '13900000011',
    mail: 'zhaoqm@sgcc.com.cn',
    major: 'CW',
    majorName: '财务',
    yjdw: 'DW001',
    yjdwName: '国网江苏省电力有限公司'
  },
  {
    id: 'expert-102',
    expertName: '陈晓燕',
    account: 'chenxy',
    isLeader: '0',
    sex: '2',
    phoneNo: '13900000012',
    mail: 'chenxy@sgcc.com.cn',
    major: 'FZ',
    majorName: '发展',
    yjdw: 'DW004',
    yjdwName: '国网无锡供电公司'
  }
]

// ==================== 驾驶舱统计（lhhsStat/*） ====================

export const STAT_DW_NAMES = YJDW_LIST.map((item) => item.note)
export const STAT_DW_IDS = YJDW_LIST.map((item) => item.id)

export const buildOverviewStat = () => ({
  expertCount: 86,
  meetingCount: 36,
  xmStatData: {
    dhs: 128,
    hsz: 256,
    dpf: 64,
    hgsh: 48,
    hstg: 720,
    hsbh: 64
  }
})

export const buildDwStatSeries = () => ({
  xAxisData: [...STAT_DW_NAMES],
  seriesDataList: [
    STAT_DW_NAMES.map((_, i) => 40 + i * 12),
    STAT_DW_NAMES.map((_, i) => 20 + i * 8)
  ],
  dwIdList: [...STAT_DW_IDS]
})

export const buildMeetingOverviewStat = () => ({
  hsz: 12,
  hstg: 48,
  hsbh: 6,
  dpf: 9,
  hgsh: 5
})

export const buildYssxRows = (count = 12) =>
  Array.from({ length: count }, (_, index) => {
    const seq = index + 1
    const unit = YJDW_LIST[index % YJDW_LIST.length]
    return {
      yssxId: `yssx-${String(seq).padStart(3, '0')}`,
      yssxName: `${unit.note}配网技改预算事项（${seq}）`,
      yssxmc: `${unit.note}配网技改预算事项（${seq}）`,
      yjdw: unit.name,
      yjdwName: unit.name,
      dwId: unit.id,
      xmsl: 8 + index,
      amount: (1200 + index * 86.5).toFixed(2),
      hstg: 5 + (index % 3),
      hsbh: index % 2,
      hsz: index % 4
    }
  })

export const buildYssxProjectRows = (count = 10) =>
  Array.from({ length: count }, (_, index) => {
    const seq = index + 1
    const unit = YJDW_LIST[index % YJDW_LIST.length]
    return {
      xmId: `stat-xm-${String(seq).padStart(3, '0')}`,
      xmbm: `XMSTAT2026${2000 + seq}`,
      xmmc: `${unit.note}公司统计穿透项目（${seq}）`,
      yssxmc: `${unit.note}配网技改预算事项`,
      yjdw: unit.name,
      amount: (300 + seq * 12.5).toFixed(2),
      all_invest_tax: (340 + seq * 12.5).toFixed(2),
      jhssnd: '2026',
      statusName: seq % 3 === 0 ? '会审通过' : '会审中'
    }
  })

// ==================== 联合会审驾驶舱菜单（sys/appMenu/list, appNo=LHHSK） ====================

export const APP_MENU_OPERATION = [
  {
    id: 'menu-op-expert',
    name: '专家线上预审',
    url: '/service/jointReview/expertReview/index',
    outsideMenu: EXPERT_BUSICODE,
    sort: 1,
    type: 1,
    isShow: 1,
    isFrame: 0,
    openStyle: 0,
    createDate: '2026-01-01',
    creator: null,
    frameSrc: null,
    icon: null,
    parentName: null,
    permissions: null,
    pid: '0'
  },
  {
    id: 'menu-op-offline',
    name: '线下会审',
    url: '/service/jointReview/offlineReview/index',
    outsideMenu: OFFLINE_BUSICODE,
    sort: 2,
    type: 1,
    isShow: 1,
    isFrame: 0,
    openStyle: 0,
    createDate: '2026-01-01',
    creator: null,
    frameSrc: null,
    icon: null,
    parentName: null,
    permissions: null,
    pid: '0'
  },
  {
    id: 'menu-op-meeting',
    name: '会审会议管理',
    url: '/service/jointReview/lhhsMeeting/index',
    outsideMenu: OFFLINE_BUSICODE,
    sort: 3,
    type: 1,
    isShow: 1,
    isFrame: 0,
    openStyle: 0,
    createDate: '2026-01-01',
    creator: null,
    frameSrc: null,
    icon: null,
    parentName: null,
    permissions: null,
    pid: '0'
  }
]

export const APP_MENU_SEARCH = [
  {
    id: 'menu-search-summary',
    name: '项目意见汇总',
    url: '/service/jointReview/xmOpinionSummary/index',
    outsideMenu: OFFLINE_BUSICODE,
    sort: 1,
    type: 1,
    isShow: 1,
    isFrame: 0,
    openStyle: 0,
    createDate: '2026-01-01',
    creator: null,
    frameSrc: null,
    icon: null,
    parentName: null,
    permissions: null,
    pid: '0'
  },
  {
    id: 'menu-search-flow',
    name: '会审流转情况',
    url: '/service/jointReview/reviewFlowQuery/index',
    outsideMenu: OFFLINE_BUSICODE,
    sort: 2,
    type: 1,
    isShow: 1,
    isFrame: 0,
    openStyle: 0,
    createDate: '2026-01-01',
    creator: null,
    frameSrc: null,
    icon: null,
    parentName: null,
    permissions: null,
    pid: '0'
  },
  {
    id: 'menu-search-return',
    name: '线下会审退回',
    url: '/service/jointReview/offlineReviewReturn/index',
    outsideMenu: OFFLINE_RETURN_BUSICODE,
    sort: 3,
    type: 1,
    isShow: 1,
    isFrame: 0,
    openStyle: 0,
    createDate: '2026-01-01',
    creator: null,
    frameSrc: null,
    icon: null,
    parentName: null,
    permissions: null,
    pid: '0'
  }
]

// ==================== 会审流转查询（lhhs/lzqk/*） ====================

export const FLOW_SEARCH_COLUMNS = [
  {
    code: 'meetingName',
    name: '会议名称',
    type: 'input',
    isShow: '1',
    sort: 1,
    defaultValue: '',
    dependOnColumn: '',
    dyff: '',
    dateType: '',
    valueFormat: ''
  },
  {
    code: 'meetingCode',
    name: '会议编号',
    type: 'input',
    isShow: '1',
    sort: 2,
    defaultValue: '',
    dependOnColumn: '',
    dyff: '',
    dateType: '',
    valueFormat: ''
  },
  {
    code: 'status',
    name: '会议状态',
    type: 'select',
    isShow: '1',
    sort: 3,
    defaultValue: '',
    dependOnColumn: '',
    dyff: '',
    options: COMMON_CODE_MAP.LHHS_MEETING_STATUS,
    dateType: '',
    valueFormat: ''
  },
  {
    code: 'nd',
    name: '年度',
    type: 'select',
    isShow: '1',
    sort: 4,
    defaultValue: '2026',
    dependOnColumn: '',
    dyff: '',
    options: COMMON_CODE_MAP.NDCX,
    dateType: '',
    valueFormat: ''
  }
]

export const FLOW_TABLE_COLUMNS = [
  { field: 'meeting_code', title: '会议编号', minWidth: 150 },
  { field: 'meeting_name', title: '会议名称', minWidth: 220 },
  { field: 'status_name', title: '会议状态', minWidth: 100 },
  { field: 'xm_num', title: '项目数量', minWidth: 100 },
  { field: 'hstg_num', title: '会审通过', minWidth: 100, isCt: true },
  { field: 'hsbh_num', title: '会审驳回', minWidth: 100, isCt: true },
  { field: 'dhs_num', title: '待会审', minWidth: 100, isCt: true },
  { field: 'organizer', title: '组织人', minWidth: 100 },
  { field: 'start_time', title: '开始时间', minWidth: 160 }
]

export const buildFlowQueryRows = () =>
  OFFLINE_MEETINGS.map((m) => ({
    meeting_id: m.meetingId,
    meeting_code: m.meetingCode,
    meeting_name: m.meetingName,
    status: m.status,
    status_name: m.status === '00' ? '即将开始' : m.status === '01' ? '评审中' : '已结束',
    xm_num: m.xmNum,
    hstg_num: Math.max(0, m.xmNum - 3),
    hsbh_num: 1,
    dhs_num: 2,
    organizer: m.organizer,
    start_time: m.startTime,
    end_time: m.endTime,
    nd: m.nd
  }))

export const buildFlowCtRows = (meetingId: string) =>
  getProjectsByMeeting(meetingId).map((p) => ({
    xmbm: p.xmbm,
    xmmc: p.xmmc,
    yjdw: p.yjdw,
    yssxmc: p.yssxmc,
    amount: p.amount,
    statusName: p.leaderReviewStatus === '1' ? '会审通过' : '待会审'
  }))
