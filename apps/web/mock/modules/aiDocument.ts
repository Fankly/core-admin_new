import Mock from 'mockjs'
import { fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

// ==================== 静态字典 ====================

const PRIORITY_MAP: Record<string, string> = { '1': '高', '2': '中', '3': '低' }
const STATUS_MAP: Record<string, string> = { '1': '未开始', '2': '处理中', '3': '已完成', '4': '处理失败' }

const ATTACH_TYPES = [
  { fjId: 'FJ_KXSB', fjName: '可行性研究报告' },
  { fjId: 'FJ_LX', fjName: '立项报告' },
  { fjId: 'FJ_YS', fjName: '预算编制说明' },
  { fjId: 'FJ_SGT', fjName: '施工图设计文件' },
  { fjId: 'FJ_GS', fjName: '概算书' }
]

const YJDW_LIST = [
  { code: 'DW001', name: '国网江苏省电力有限公司' },
  { code: 'DW002', name: '国网南京供电公司' },
  { code: 'DW003', name: '国网苏州供电公司' },
  { code: 'DW004', name: '国网无锡供电公司' }
]

const PRO_TYPE_LIST = [
  { code: 'PT01', name: '基建项目' },
  { code: 'PT02', name: '技改项目' },
  { code: 'PT03', name: '大修项目' },
  { code: 'PT04', name: '零星购置' }
]

const YEAR_LIST = ['2024', '2025', '2026']

// ==================== 详情内容样例（贴近真实接口返回，用于验证预览区高度限制） ====================

// 真实接口的 content 是原始文本：以 \r\n 分段、含 **加粗** 标题，表格被压平成 |...| 行内形式。
// 这里构造一段足够长、覆盖标题/加粗/表格/长段落的文本，用于测试 Markdown 预览区滚动与高度上限。
const buildMarkdownContent = (xmmc: string, unit: string): string => {
  const tableRows = Array.from({ length: 30 }, (_, i) => {
    const idx = i + 1
    return `${idx}|500kV|${xmmc}|#${200 + idx}|长棒瓷质绝缘子|3|I型串`
  }).join('|')

  return [
    '？',
    xmmc,
    '可行性研究报告',
    `\`       \`项目名称：${xmmc}`,
    `项目单位：${unit}`,
    '编制单位：中国电力工程顾问集团华东电力设计院有限公司',
    '2026年03月',
    '**目   录**',
    '**1．项目概述\t1**',
    '1.1 编制依据\t1',
    '1.2 项目现状\t1',
    '**2．项目必要性\t3**',
    '**3．项目技术方案\t5**',
    '**4．项目经济性与财务合规性\t10**',
    '1．项目概述',
    '1.1 编制依据',
    '本项目依据国家电网公司相关技术规范及设备大修原则编制，旨在提升区域电网供电可靠性与本质安全水平。',
    '1.2 项目现状',
    `${xmmc}线路已运行近20年，近年发现部分长棒型瓷质绝缘子老化严重、伞裙破损、瓷体裂纹、红外检测出现局部过热、抽样检测不合格等缺陷，存在故障跳闸等安全隐患。根据公司要求，对于老化严重、抽样检测不合格的绝缘子进行批次更换。`,
    '1.6 主要技术经济指标',
    '总费用（含税）：565.19万元；总费用（不含税）：502.9万元。其中设备检修费535.7万元，占总投资94.78%；其他费用为29.49万元，占总投资5.22%。',
    '2．项目必要性',
    '2.1 安全性分析',
    '部分棒式瓷质绝缘子产生污秽导致的闪络，在污秽较为严重地段，污闪经常发生；绝缘子老化严重，表面龟裂，影响线路安全运行；棒式绝缘子存在断芯、掉串的现象，严重影响线路安全运行。',
    '3．项目技术方案',
    '3.4方案详细内容',
    `表3.4.1-1：${xmmc}绝缘子串更换清单表|序号|电压等级|线路名称|杆塔编号|绝缘子型号|更换绝缘子串数量|串型|:-:|:-:|:-:|:-:|:-:|:-:|:-:|${tableRows}`,
    '4．项目经济性与财务合规性',
    '根据《国家电网公司项目可研经济性与财务合规性评价指导意见》要求，本项目符合生产大修项目适用范围，符合财务合规性中的不增加固定资产原值规定。',
    '结论',
    '综上，本项目建设方案技术可行、经济合理，建议按计划推进后续设计与实施工作。'
  ].join('\r\n')
}

// 真实接口的 extractSchema 是一段 JSON 字符串，含 schema（抽取字段定义）与 markdown（原文）。
const buildExtractSchema = (xmmc: string, content: string): string => {
  return JSON.stringify({
    schema: [
      { code: 'projectName', name: '项目名称', type: 'string', desc: '' },
      { code: 'projectCom', name: '项目单位', type: 'string', desc: '' },
      { code: 'projectBackground', name: '项目背景', type: 'string', desc: '项目背景或者项目现状' },
      { code: 'existingProblems', name: '必要性', type: 'string', desc: '项目必要性' },
      { code: 'economyCompliance', name: '经济性与财务合规性', type: 'string', desc: '' },
      { code: 'technologyImplementPlan', name: '技术方案', type: 'string', desc: '项目技术方案' },
      { code: 'deploymentContent', name: '建设内容', type: 'string', desc: '建设内容或者检修内容或者实施内容' },
      { code: 'amount', name: '总投资（万元）', type: 'string', desc: '总投资不含税金额（万元）' },
      { code: 'allInvestTax', name: '总投资含税（万元）', type: 'string', desc: '总投资含税金额（万元）' }
    ],
    markdown: content
  })
}

// 提取结果 JSON：贴合 schema 字段，返回结构化抽取结果，用于测试 JSON 预览区高度上限与滚动。
const buildExtractJson = (xmmc: string, unit: string): string => {
  return JSON.stringify({
    projectName: xmmc,
    projectCom: unit,
    projectBackground:
      '本线路已运行近20年，近年发现部分长棒型瓷质绝缘子老化严重、伞裙破损、瓷体裂纹、红外检测出现局部过热、抽样检测不合格等缺陷，存在故障跳闸等安全隐患。',
    existingProblems: '部分棒式瓷质绝缘子产生污秽导致闪络；绝缘子老化严重，表面龟裂；棒式绝缘子存在断芯、掉串现象，严重影响线路安全运行。',
    economyCompliance: '本项目符合生产大修项目适用范围，符合财务合规性中不增加固定资产原值的规定。',
    technologyImplementPlan: '对老旧长棒型瓷质绝缘子串进行单改双，绝缘子采用复合玻璃绝缘子。',
    deploymentContent: '共计68基杆塔进行绝缘子串单改双、并安装防鸟装置，共需更换绝缘子串204串，同步加装双串防鸟罩204个。',
    amount: '502.9',
    allInvestTax: '565.19'
  })
}

// ==================== 生成分页数据源 ====================

interface AttachRow {
  id: string
  proId: string
  priority: string
  priorityName: string
  content: string
  wordCount: string
  transcodeJobId: string | null
  transcodeJobStatus: string | null
  transcodeStatus: string
  transcodeStatusName: string
  transcodeStartTime: number | null
  transcodeEndTime: number | null
  transcodeFinishTime: number | null
  transcodeMessage: string | null
  extractSchema: string | null
  extractJson: string | null
  extractStatus: string
  extractStatusName: string
  extractStartTime: number | null
  extractEndTime: number | null
  extractFinishTime: number | null
  extractMessage: string | null
  createTime: number | null
  attachName: string
  fjId: string
  fjName: string
  xmbm: string
  xmmc: string
  proType: string
  proTypeName: string
  jhssnd: string
  nd: string
  yjdw: string
  yjdwName: string
}

const pad = (num: number) => String(num).padStart(2, '0')
// 真实接口时间为 epoch 毫秒；formatTimestamp 支持 13 位时间戳。
const BASE_TIME = new Date('2026-03-01 08:00:00').getTime()
const epoch = (dayOffset: number, minuteOffset: number) => BASE_TIME + dayOffset * 86400000 + minuteOffset * 60000

const ATTACH_ROWS: AttachRow[] = Array.from({ length: 46 }, (_, i) => {
  const idx = i + 1
  const attachType = ATTACH_TYPES[i % ATTACH_TYPES.length]
  const yjdw = YJDW_LIST[i % YJDW_LIST.length]
  const proType = PRO_TYPE_LIST[i % PRO_TYPE_LIST.length]
  const year = YEAR_LIST[i % YEAR_LIST.length]
  const priority = String((i % 3) + 1)
  const transcodeStatus = String((i % 4) + 1)
  const extractStatus = String(((i + 2) % 4) + 1)
  const xmmc = `国网江苏宿迁本部输电运检中心500kV堡安${5253 + idx}线绝缘子修理`
  const unit = yjdw.name

  const transcodeDone = transcodeStatus === '3'
  const extractDone = extractStatus === '3'
  const content = transcodeDone ? buildMarkdownContent(xmmc, unit) : ''

  const row: AttachRow = {
    id: `${390798305 + idx}`,
    proId: `${390798309 + idx}`,
    priority,
    priorityName: PRIORITY_MAP[priority],
    content,
    wordCount: transcodeDone ? String(4800 + idx * 37) : '0',
    transcodeJobId: null,
    transcodeJobStatus: null,
    transcodeStatus,
    transcodeStatusName: STATUS_MAP[transcodeStatus],
    transcodeStartTime: transcodeStatus === '1' ? null : epoch(i, 1),
    transcodeEndTime: transcodeDone || transcodeStatus === '4' ? epoch(i, 3) : null,
    transcodeFinishTime: transcodeDone || transcodeStatus === '4' ? epoch(i, 3) : null,
    transcodeMessage: transcodeStatus === '4' ? `转码失败：第 ${idx} 页图片解析异常，OCR 引擎返回空结果，请检查原始附件清晰度。` : null,
    extractSchema: transcodeDone ? buildExtractSchema(xmmc, content) : null,
    extractJson: extractDone ? buildExtractJson(xmmc, unit) : null,
    extractStatus,
    extractStatusName: STATUS_MAP[extractStatus],
    extractStartTime: extractStatus === '1' ? null : epoch(i, 4),
    extractEndTime: extractDone || extractStatus === '4' ? epoch(i, 5) : null,
    extractFinishTime: extractDone || extractStatus === '4' ? epoch(i, 5) : null,
    extractMessage: extractStatus === '4' ? `提取失败：未能从文本中识别到有效的投资估算表结构（任务 ${idx}）。` : null,
    createTime: epoch(i, 0),
    attachName: `${xmmc}-${attachType.fjName}.pdf`,
    fjId: attachType.fjId,
    fjName: attachType.fjName,
    xmbm: `XM${year}${pad(proType.code.length)}${String(10000 + idx)}`,
    xmmc,
    proType: proType.code,
    proTypeName: proType.name,
    jhssnd: year,
    nd: year,
    yjdw: yjdw.code,
    yjdwName: yjdw.name
  }
  return row
})

// ==================== 项目列表数据源（新建任务弹窗） ====================

const PROJECT_ROWS = Array.from({ length: 32 }, (_, i) => {
  const idx = i + 1
  const yjdw = YJDW_LIST[i % YJDW_LIST.length]
  const proType = PRO_TYPE_LIST[i % PRO_TYPE_LIST.length]
  const year = YEAR_LIST[i % YEAR_LIST.length]
  const xmmc = `${yjdw.name.replace('国网', '').replace('有限公司', '').replace('供电公司', '')}${proType.name}（${idx}期）`
  return {
    xmId: `${390810000 + idx}`,
    proId: `${390810000 + idx}`,
    xmbm: `XM${year}P${String(20000 + idx)}`,
    xmmc,
    proType: proType.code,
    proTypeName: proType.name,
    jhssnd: year,
    yjdw: yjdw.code,
    yjdwName: yjdw.name,
    ejdw: `${yjdw.code}-01`,
    ejdwName: `${yjdw.name.replace('公司', '')}城区分公司`,
    flowStatus: 'FS_APPROVED',
    flowStatusName: '已批复',
    amount: Number((500 + idx * 26.8).toFixed(2))
  }
})

// ==================== 拦截规则 ====================

const includesAll = (value: string, keyword?: string) => !keyword || String(value || '').includes(keyword)
const matchArray = (value: string, list?: string[]) => !list || !list.length || list.includes(value)

// 项目附件任务分页列表
Mock.mock(/ai\/xmAttachTask\/page(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const filtered = ATTACH_ROWS.filter((row) => {
    return (
      includesAll(row.xmbm, body.xmbm) &&
      includesAll(row.xmmc, body.xmmc) &&
      includesAll(row.attachName, body.attachName) &&
      includesAll(row.jhssnd, body.jhssnd) &&
      matchArray(row.proType, body.proTypes) &&
      (!body.yjdw || row.yjdw === body.yjdw) &&
      (!body.attachType || row.fjId === body.attachType) &&
      (!body.priority || row.priority === body.priority) &&
      (!body.transcodeStatus || row.transcodeStatus === body.transcodeStatus) &&
      (!body.extractStatus || row.extractStatus === body.extractStatus)
    )
  })
  return success(pageResult(filtered, body.current, body.size))
})

// 项目附件任务详情
Mock.mock(/ai\/xmAttachTask\/getInfo(\?.*)?$/, 'get', (options: MockOptions) => {
  const id = getQueryValue(options.url, 'id')
  const row = ATTACH_ROWS.find((item) => item.id === id) || ATTACH_ROWS[0]
  return success({ ...row, attachId: row.id })
})

// 修改优先级
Mock.mock(/ai\/xmAttachTask\/modifyPriority(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids: string[] = body.attachIds || []
  const priority: string = body.priority || ''
  if (!ids.length || !priority) return fail('缺少附件ID或优先级')
  ATTACH_ROWS.forEach((row) => {
    if (ids.includes(row.id)) {
      row.priority = priority
      row.priorityName = PRIORITY_MAP[priority] || priority
    }
  })
  return success(true, '优先级修改成功')
})

// 重新执行预处理任务
Mock.mock(/ai\/xmAttachTask\/redoPreDeal(\?.*)?$/, 'post', (options: MockOptions) => {
  const id = getQueryValue(options.url, 'id')
  const row = ATTACH_ROWS.find((item) => item.id === id)
  if (!row) return fail('任务不存在')
  row.transcodeStatus = '2'
  row.transcodeStatusName = STATUS_MAP['2']
  row.extractStatus = '1'
  row.extractStatusName = STATUS_MAP['1']
  return success(true, '任务已提交重新执行')
})

// 根据项目创建附件预处理任务
Mock.mock(/ai\/xmAttachTask\/addProjectTasks(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const proIdList: string[] = Array.isArray(body) ? body : (body as any).value || []
  if (!proIdList.length) return fail('请选择项目')
  return success({ createdCount: proIdList.length }, `已创建 ${proIdList.length} 个预处理任务`)
})

// 新建任务弹窗-项目分页列表
Mock.mock(/ai-audit-task-manage\/getXmPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const filtered = PROJECT_ROWS.filter((row) => {
    return (
      includesAll(row.xmmc, body.xmmc) &&
      includesAll(row.jhssnd, body.jhssnd) &&
      matchArray(row.proType, body.proTypeList) &&
      (!body.yjdw || row.yjdw === body.yjdw) &&
      (!body.xmbmList || !body.xmbmList.length || body.xmbmList.some((code: string) => row.xmbm.includes(code)))
    )
  })
  return success(pageResult(filtered, body.page, body.limit))
})

// ==================== 页面依赖的公共接口 ====================

// 年度树
Mock.mock(/comPz\/getNdTreeNode(\?.*)?$/, 'post', () => {
  return success(YEAR_LIST.map((year) => ({ yearCode: year, yearName: `${year}年`, code: year, name: `${year}年` })))
})

// 一级单位
Mock.mock(/commonCode\/getYjdwFromCm(\?.*)?$/, 'get', () => {
  return success(YJDW_LIST.map((item) => ({ code: item.code, name: item.name })))
})

// 项目类型（子类型树）
Mock.mock(/protypeTree\/getSubProtypeTree(\?.*)?$/, 'get', () => {
  return success(
    PRO_TYPE_LIST.map((item) => ({
      middleId: item.code,
      name: item.name,
      children: []
    }))
  )
})
