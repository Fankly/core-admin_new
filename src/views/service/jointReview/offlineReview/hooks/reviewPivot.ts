// 评审分析 - 透视（交叉表）聚合 + 穿透明细
// 说明：后端取数/保存接口尚未接入，MOCK_ROWS 为前端确定性生成的演示数据（项目级明细，
// 字段与《穿透.xlsx》列一一对应）；接口就绪后把 MOCK_ROWS 换成接口返回的明细即可，
// buildPivot / filterRecords / DETAIL_COLUMNS 均无需改动。

/** 透视字段：id 与页面 fieldGroups、明细数据的键一一对应 */
export interface PivotField {
  id: string
  label: string
}

/** 明细行：维度取值 + 金额指标（万元）+ 穿透列，键为字段 id */
export type ReviewRow = Record<string, string | number>

/** 穿透明细列定义（对齐《穿透.xlsx》列顺序与格式） */
export interface DetailColumn {
  field: string
  label: string
  width: number
  /** 金额列：右对齐 + 千分位两位小数 */
  amount?: boolean
  /** 序号列：取行号 */
  seq?: boolean
  /** 长文本列：换行展示 */
  wrap?: boolean
}

export const DETAIL_COLUMNS: DetailColumn[] = [
  { field: 'seq', label: '序号', width: 56, seq: true },
  { field: 'batchName', label: '评审批次名称', width: 150 },
  { field: 'd5', label: '会议名称', width: 190 },
  { field: 'dept', label: '专业部门', width: 110 },
  { field: 'projectName', label: '项目名称', width: 260, wrap: true },
  { field: 'projectCode', label: '项目编码', width: 130 },
  { field: 'd3', label: '项目类型', width: 120 },
  { field: 'd4', label: '预算事项', width: 130 },
  { field: 'year', label: '实施年份', width: 86 },
  { field: 'd1', label: '一级单位', width: 130 },
  { field: 'd2', label: '二级单位', width: 130 },
  { field: 'necessity', label: '必要性', width: 240, wrap: true },
  { field: 'content', label: '项目实施内容', width: 240, wrap: true },
  { field: 'm1', label: '申报金额(万元)', width: 120, amount: true },
  { field: 'm2', label: '首次纳会金额(万元)', width: 135, amount: true },
  { field: 'm3', label: '审定金额(万元)', width: 120, amount: true },
  { field: 'm4', label: '核减金额(万元)', width: 120, amount: true },
  { field: 'opinionMajor', label: '专业线上预审意见', width: 230, wrap: true },
  { field: 'opinionDev', label: '发展线上预审意见', width: 230, wrap: true },
  { field: 'opinionFin', label: '财务线上预审意见', width: 230, wrap: true },
  { field: 'opinionYjy', label: '经研院线上预审意见', width: 230, wrap: true },
  { field: 'conclusionFin', label: '财务部线下会审结论', width: 150 },
  { field: 'remarkFin', label: '财务部线下会审意见', width: 230, wrap: true },
  { field: 'conclusionDev', label: '发展部线下会审结论', width: 150 },
  { field: 'remarkDev', label: '发展部线下会审意见', width: 230, wrap: true },
  { field: 'finalOpinion', label: '终评意见', width: 105 },
  { field: 'preArrange', label: '是否预安排', width: 100 }
]

// ============ 演示数据（接口接入后整体删除） ============
const PRIMARY_UNITS = ['省公司本部', '甲市供电公司', '乙市供电公司', '丙市供电公司']
const SUB_UNITS = ['检修分公司', '营销服务中心', '建设部', '物资部']
const PROJECT_TYPES = ['电网基建', '生产技改', '零星购置', '营销投入']
const MATTERS = ['线路工程', '变电工程', '配网改造', '设备购置']
const MEETINGS = ['2026年第一批综合计划评审会', '2026年第二批综合计划评审会', '2026年第三批综合计划评审会']
const BATCHES = ['第一批次', '第二批次', '第三批次']
const BATCH_NAMES = ['2026年成本项目评审第一批', '2026年成本项目评审第二批', '2026年成本项目评审第三批']
const DEPTS = ['设备管理部', '发展策划部', '营销部', '物资部']
const VOLTAGES = ['10kV', '110kV', '220kV', '500kV']
const ACTIONS = ['防舞动修理', '间隔棒加装', '老旧设备更换', '隐患治理']
const PASS_OPINIONS = [
  '经审查，该项目必要性充足、方案可行、项目规模(工程量)合理、佐证材料完整，予以通过。',
  '经审查，该项目类型正确，申报材料规范、项目不存在重复立项，予以通过。',
  '经审查，该项目符合财务合规性要求，予以通过。',
  '经审查，该项目可研投资估算已核，予以通过。'
]
const OFFLINE_CONCLUSIONS = ['通过', '退回修改', '暂缓安排']
const OFFLINE_REMARKS = ['补充估算书，完善投资明细后重新报送。', '投资估算与项目规模匹配，同意安排。', '需补充工程量清单及佐证材料。']
/** 每个「一级单位 × 项目类型 × 评审批次」组合下的项目数 */
const PROJECTS_PER_COMBO = 2

/** FNV-1a：组合键映射到 0~1，保证同一组合每次生成相同金额（刷新不跳数） */
const hashRatio = (key: string) => {
  let hash = 2166136261
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 10000) / 10000
}

const round2 = (value: number) => Math.round(value * 100) / 100
const pick = <T>(list: T[], ratio: number) => list[Math.min(list.length - 1, Math.floor(ratio * list.length))]
const pad = (value: number, length: number) => String(value).padStart(length, '0')

/** 生成项目编码：形如 B110D2267I17。字母位由哈希决定，数字位取全局序号（保证编码唯一） */
const buildProjectCode = (key: string, index: number) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const seq = pad(index, 4)
  let code = 'B110'
  for (let i = 0; i < 4; i += 1) {
    code += letters[Math.floor(hashRatio(`${key}#code${i}`) * letters.length)]
    code += seq[i]
  }
  return code
}

/** 生成演示明细：一级单位 × 项目类型 × 评审批次 × 2 个项目 = 96 条 */
const buildMockRows = (): ReviewRow[] => {
  const rows: ReviewRow[] = []
  PRIMARY_UNITS.forEach((unit, unitIndex) => {
    PROJECT_TYPES.forEach((type, typeIndex) => {
      BATCHES.forEach((batch, batchIndex) => {
        for (let projectIndex = 0; projectIndex < PROJECTS_PER_COMBO; projectIndex += 1) {
          const key = `${unit}-${type}-${batch}-${projectIndex}`
          // 金额口径：审定 ≤ 首次纳会 ≤ 申报，核减 = 申报 - 审定
          const declared = round2(180 + hashRatio(`${key}#declared`) * 2820)
          const qualified = round2(declared * (0.72 + hashRatio(`${key}#qualified`) * 0.24))
          const approved = round2(qualified * (0.8 + hashRatio(`${key}#approved`) * 0.18))
          const voltage = pick(VOLTAGES, hashRatio(`${key}#voltage`))
          const lineNo = 100 + Math.floor(hashRatio(`${key}#line`) * 900)
          const length = round2(3 + hashRatio(`${key}#length`) * 60)
          const towers = 20 + Math.floor(hashRatio(`${key}#tower`) * 160)
          const clamps = 10 + Math.floor(hashRatio(`${key}#clamp`) * 300)
          rows.push({
            d1: unit,
            d2: SUB_UNITS[(unitIndex + typeIndex) % SUB_UNITS.length],
            d3: type,
            d4: MATTERS[(typeIndex + batchIndex) % MATTERS.length],
            d5: MEETINGS[batchIndex],
            d6: batch,
            batchName: BATCH_NAMES[batchIndex],
            projectCode: buildProjectCode(key, rows.length),
            projectName: `国网江苏${unit}${voltage}${lineNo}线等线路${pick(ACTIONS, hashRatio(`${key}#action`))}`,
            dept: DEPTS[typeIndex % DEPTS.length],
            year: '2026',
            necessity: `该线路位于舞动区域，近两年覆冰舞动跳闸 ${
              1 + Math.floor(hashRatio(`${key}#trip`) * 3)
            } 次，按运行规程应采取加装相间间隔棒等措施进行治理。`,
            content: `${voltage}${lineNo}线，${length}km/${towers}基，加装相间间隔棒 ${clamps} 支，同步更换锈蚀金具。`,
            m1: declared,
            m2: qualified,
            m3: approved,
            m4: round2(declared - approved),
            opinionMajor: PASS_OPINIONS[0],
            opinionDev: PASS_OPINIONS[1],
            opinionFin: PASS_OPINIONS[2],
            opinionYjy: PASS_OPINIONS[3],
            conclusionFin: pick(OFFLINE_CONCLUSIONS, hashRatio(`${key}#conclusionFin`)),
            remarkFin: pick(OFFLINE_REMARKS, hashRatio(`${key}#remarkFin`)),
            conclusionDev: pick(OFFLINE_CONCLUSIONS, hashRatio(`${key}#conclusionDev`)),
            remarkDev: pick(OFFLINE_REMARKS, hashRatio(`${key}#remarkDev`)),
            finalOpinion: pick(OFFLINE_CONCLUSIONS, hashRatio(`${key}#final`)),
            preArrange: hashRatio(`${key}#preArrange`) > 0.7 ? '是' : '否'
          })
        }
      })
    })
  })
  return rows
}

export const MOCK_ROWS: ReviewRow[] = buildMockRows()

// ============ 透视聚合 ============
/** 合计组/合计行的键 */
export const TOTAL_KEY = '__total__'
/** 维度取值分隔符：用不可见字符，避免取值本身含分隔符时串位 */
const SEP = '\u0000'
const EMPTY = '—'

export interface PivotDimCell {
  /** 展示值（空值显示为 —） */
  value: string
  /** 原始值：穿透筛选用，不能用展示值 */
  raw: string
  /** 纵向合并行数；0 表示被上方同值单元格合并（不渲染该单元格） */
  span: number
}

export interface PivotRow {
  dims: PivotDimCell[]
  /** cells[列组下标][指标下标] */
  cells: number[][]
}

export interface PivotGroup {
  key: string
  label: string
  /** 列维度原始取值（合计组为空数组） */
  values: string[]
}

export interface PivotFilter {
  id: string
  label: string
  value: string
}

export interface PivotResult {
  /** 行维度列标题（无行维度时为 ['合计']） */
  rowTitles: string[]
  /** 列维度标题（用于结果摘要展示） */
  colTitles: string[]
  /** 行/列维度字段：穿透筛选按 id 取值 */
  rowDims: PivotField[]
  colDims: PivotField[]
  metrics: PivotField[]
  /** 列组：列维度组合 + 合计；无列维度时只有合计组 */
  groups: PivotGroup[]
  /** 是否有列维度（决定表头是否双层） */
  hasColumnDims: boolean
  rows: PivotRow[]
  /** 底部合计行；无行维度时为 null（结果本身只有一行合计） */
  total: { cells: number[][] } | null
  recordCount: number
}

/** 按维度取值逐列比较排序，保证行/列顺序稳定 */
const sortKeys = (keys: string[]) =>
  keys.sort((a, b) => {
    const left = a.split(SEP)
    const right = b.split(SEP)
    for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
      const result = String(left[i] ?? '').localeCompare(String(right[i] ?? ''), 'zh-Hans-CN')
      if (result) return result
    }
    return 0
  })

/** 收集明细中出现的维度组合键（去重 + 排序） */
const collectKeys = (records: ReviewRow[], dims: PivotField[]) => {
  const keys = new Set<string>()
  records.forEach((record) => keys.add(dims.map((dim) => String(record[dim.id] ?? '')).join(SEP)))
  return sortKeys(Array.from(keys))
}

const samePrefix = (left: PivotDimCell[], right: PivotDimCell[], col: number) => {
  for (let i = 0; i <= col; i += 1) {
    if (left[i].value !== right[i].value) return false
  }
  return true
}

/** 行维度纵向合并：同前缀的连续行合并，被合并的单元格 span 置 0 交给上方 rowspan 覆盖 */
const applyRowSpans = (rows: PivotRow[], dimCount: number) => {
  for (let col = 0; col < dimCount; col += 1) {
    let start = 0
    while (start < rows.length) {
      let end = start + 1
      while (end < rows.length && samePrefix(rows[start].dims, rows[end].dims, col)) end += 1
      rows[start].dims[col].span = end - start
      for (let i = start + 1; i < end; i += 1) rows[i].dims[col].span = 0
      start = end
    }
  }
}

/**
 * 按拖拽配置生成交叉表数据：行维度 → 行，列维度 → 列分组，金额指标 → 数值
 * 无列维度时只有「合计」一列组；无行维度时只有一行「合计」
 */
export const buildPivot = (records: ReviewRow[], rowDims: PivotField[], colDims: PivotField[], metrics: PivotField[]): PivotResult => {
  const rowKeys = collectKeys(records, rowDims)
  const colKeys = collectKeys(records, colDims)
  const groups: PivotGroup[] = colDims.length
    ? colKeys
        .map((key) => ({ key, label: key.split(SEP).join(' / ') || EMPTY, values: key.split(SEP) }))
        .concat({ key: TOTAL_KEY, label: '合计', values: [] })
    : [{ key: TOTAL_KEY, label: '合计', values: [] }]

  const sums = new Map<string, number[]>()
  const bump = (rowKey: string, groupKey: string, record: ReviewRow) => {
    const mapKey = `${rowKey}${SEP}${groupKey}`
    const cell = sums.get(mapKey) || metrics.map(() => 0)
    metrics.forEach((metric, index) => {
      cell[index] += Number(record[metric.id] || 0)
    })
    sums.set(mapKey, cell)
  }

  records.forEach((record) => {
    const rowKey = rowDims.map((dim) => String(record[dim.id] ?? '')).join(SEP)
    const colKey = colDims.map((dim) => String(record[dim.id] ?? '')).join(SEP)
    // 每个行组合 + 底部合计行各累计一次
    ;[rowKey, TOTAL_KEY].forEach((key) => {
      bump(key, TOTAL_KEY, record)
      if (colDims.length) bump(key, colKey, record)
    })
  })

  const cellsOf = (rowKey: string) => groups.map((group) => (sums.get(`${rowKey}${SEP}${group.key}`) || metrics.map(() => 0)).map(round2))

  // 无行维度：结果只有一行「合计」，不再重复出底部合计行
  if (!rowDims.length) {
    return {
      rowTitles: ['合计'],
      colTitles: colDims.map((dim) => dim.label),
      rowDims,
      colDims,
      metrics,
      groups,
      hasColumnDims: colDims.length > 0,
      rows: [{ dims: [{ value: '合计', raw: '', span: 1 }], cells: cellsOf(TOTAL_KEY) }],
      total: null,
      recordCount: records.length
    }
  }

  const rows: PivotRow[] = rowKeys.map((key) => {
    const values = key.split(SEP)
    return {
      dims: rowDims.map((dim, index) => ({ value: values[index] || EMPTY, raw: values[index] || '', span: 1 })),
      cells: cellsOf(key)
    }
  })
  applyRowSpans(rows, rowDims.length)

  return {
    rowTitles: rowDims.map((dim) => dim.label),
    colTitles: colDims.map((dim) => dim.label),
    rowDims,
    colDims,
    metrics,
    groups,
    hasColumnDims: colDims.length > 0,
    rows,
    total: { cells: cellsOf(TOTAL_KEY) },
    recordCount: records.length
  }
}

// ============ 穿透明细 ============
/**
 * 按筛选条件取穿透明细：全部条件与运算，空条件返回全部
 * 入参 filters 来自被点击单元格：行维度取值（合计行不带）+ 列维度取值（合计列不带）
 */
export const filterRecords = (records: ReviewRow[], filters: PivotFilter[]) =>
  records.filter((record) => filters.every((filter) => String(record[filter.id] ?? '') === filter.value))

/**
 * 由被点击的单元格生成穿透筛选条件：
 * - 行：合计行（row 为 null）不加条件，否则按该行各维度取值筛选
 * - 列：合计列（group.values 为空）不加条件，否则按该列维度取值筛选
 * 注意合计列不能退化成「取值 = 空串」的条件，否则一笔明细都匹配不到
 */
export const buildDrillFilters = (rowDims: PivotField[], colDims: PivotField[], row: PivotRow | null, group: PivotGroup): PivotFilter[] => {
  const filters: PivotFilter[] = []
  if (row && rowDims.length) {
    rowDims.forEach((dim, index) => {
      const cell = row.dims[index]
      if (cell) filters.push({ id: dim.id, label: dim.label, value: cell.raw })
    })
  }
  if (group.values.length) {
    colDims.forEach((dim, index) => filters.push({ id: dim.id, label: dim.label, value: group.values[index] ?? '' }))
  }
  return filters
}
