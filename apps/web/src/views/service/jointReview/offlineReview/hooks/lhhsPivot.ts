// 评审分析 - 后端接口对接层（/lhhsPivot/*）
// 说明：左侧字段目录、透视结果、穿透明细、两个导出全部走后端；
// 点「确定」时把「主表勾选的会议 id」+「拖拽得到的 rowDims / colDims / metrics」传给后端。
// 表头树 / 数据行的 key 规则见接口文档 2.4、2.5：
//   - 无列维度时值列 field = 指标编码（sbys）
//   - 有列维度时值列 field = c{列序号}_{指标编码}（c0_sbys）
//   - 合计列组 field = t_{指标编码}，其父节点 field = t_total
// 本文件只做「接口入参组装 + 返回结构展平」，不参与任何金额重算（合计由后端给）。

import { formatNumValue } from '@/utils/utils'
import {
  exportCtData,
  exportPivotData,
  getCtColumns,
  getPivotCtData,
  getPivotData,
  getPivotFields
} from '@/api/service/IhhsMeeting/offlineReview/lhhsPivot'

/** 合计列组父节点标识（接口文档 2.4） */
export const TOTAL_GROUP_FIELD = 't_total'
/** 合计行首列文字（接口文档 2.4：合计行第一列固定为「合计」，其余行维度列为空串） */
const TOTAL_ROW_TEXT = '合计'

// ============ 字段目录（/lhhsPivot/getFields 下发） ============

/** 字段面板项：与页面拖拽区使用的结构一致 */
export interface PivotFieldItem {
  /** 字段编码：请求参数直接用（rowDims / colDims / metrics） */
  id: string
  label: string
  type: 'dimension' | 'metric'
}

/** 指标名称兜底：接口样例里 metrics 只给了编码数组（文档结构表写的是对象数组），缺名称时按编码取 */
const METRIC_NAME_FALLBACK: Record<string, string> = {
  sbys: '申报金额(万元)',
  scnhje: '首次纳会金额(万元)',
  sdje: '审定金额(万元)',
  hshj: '核减金额(万元)'
}

/**
 * 获取字段目录：维度字段 + 金额指标，全部由后端下发（面板顺序即接口返回顺序）
 * `available = false` 的字段取值恒为空，按文档建议不展示，避免用户拖出空表
 */
export const loadPivotFields = async () => {
  const res: any = await getPivotFields({})
  if (!res?.success) throw new Error(res?.msg || '字段目录加载失败')
  const data = res.data ?? {}

  const dimensions: PivotFieldItem[] = (data.dimensions ?? [])
    .filter((item: any) => item?.available !== false)
    .map((item: any) => ({
      id: item.code,
      label: item.name || item.code,
      type: 'dimension' as const
    }))

  const metrics: PivotFieldItem[] = (data.metrics ?? [])
    .filter((item: any) => typeof item === 'string' || item?.available !== false)
    .map((item: any) => {
      // 兼容两种返回：{code, name} 对象 或 纯编码字符串
      const code = typeof item === 'string' ? item : item?.code
      const name = typeof item === 'string' ? '' : item?.name
      return {
        id: code,
        label: name || METRIC_NAME_FALLBACK[code] || code,
        type: 'metric' as const
      }
    })

  return { dimensions, metrics }
}

// ============ 请求参数 ============

/** 透视分析入参 */
export interface PivotQuery {
  meetingIds: string[]
  rowDims: string[]
  colDims: string[]
  metrics: string[]
}

/** 穿透明细入参 */
export interface DrillQuery {
  meetingIds: string[]
  rowDimValues: Record<string, string>
  colDimValues: Record<string, string>
  page: number
  limit: number
}

/** 会议范围归一：主表勾选一个时传的是单个 meetingId，多个时传数组，统一成数组交给后端 */
export const normalizeMeetingIds = (value?: string | string[] | null): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  return value ? [String(value)] : []
}

// ============ 表头树展平（多级表头） ============

export interface PivotHeadNode {
  field: string
  title: string
  needFormat?: boolean
  width?: number
  visible?: boolean
  children?: PivotHeadNode[]
}

/** 维度「编码 → 取值编码」映射：行维度在数据行的 _dimCodes，列维度在 colDimCodes[列叶子字段] */
export type DimCodeMap = Record<string, string>

/**
 * 数据行：key 由后端给（维度编码 / c{n}_{指标} / t_{指标}）
 * 另带一个 `_dimCodes`（本行的行维度取值编码，**仅供穿透回传，不渲染**）
 */
export type PivotDataRow = Record<string, string | number | null | DimCodeMap>

export interface PivotHeaderCell {
  title: string
  colspan: number
  rowspan: number
  /** 分组表头（有子列）：表头统一居中，这里保留类型标记供后续按类型做样式 */
  isGroup: boolean
  /** 金额叶子表头：同上，仅作类型标记 */
  isAmount: boolean
}

export interface PivotLeafColumn {
  field: string
  title: string
  /** 金额列：需格式化（千分位 + 2 位小数） */
  needFormat: boolean
  /** 列维度各层祖先取值，下标与 colDims 对齐（合计列组为空串） */
  dimValues: string[]
  isTotal: boolean
}

export interface PivotTable {
  /** 表头各行（自顶向下），单元格已算好 colspan / rowspan */
  headerRows: PivotHeaderCell[][]
  /** 取数列（叶子节点），数据行按此顺序取值 */
  leaves: PivotLeafColumn[]
}

/** 子树叶子数：即该表头节点横向占的列数 */
const countLeaves = (node: PivotHeadNode): number => (node.children?.length ? node.children.reduce((sum, child) => sum + countLeaves(child), 0) : 1)

/** 子树高度：叶子为 0，用于推表头行数 */
const treeHeight = (node: PivotHeadNode): number => (node.children?.length ? 1 + Math.max(...node.children.map(treeHeight)) : 0)

/**
 * 把后端表头树展平成可渲染的表格结构：
 * 表头行数 = 树高 + 1；叶子节点纵向撑满剩余表头行（与项目里手写表头的老写法一致）
 */
export const buildPivotTable = (head: PivotHeadNode[] = []): PivotTable => {
  const levels = head.length ? Math.max(...head.map(treeHeight)) + 1 : 0
  const headerRows: PivotHeaderCell[][] = Array.from({ length: levels }, () => [])
  const leaves: PivotLeafColumn[] = []

  const walk = (node: PivotHeadNode, level: number, dimValues: string[], parentIsTotal: boolean) => {
    const children = node.children ?? []
    const isTotal = parentIsTotal || node.field === TOTAL_GROUP_FIELD
    headerRows[level]?.push({
      title: node.title,
      colspan: countLeaves(node),
      rowspan: children.length ? 1 : levels - level,
      isGroup: !!children.length,
      isAmount: !children.length && !!node.needFormat
    })
    if (!children.length) {
      leaves.push({ field: node.field, title: node.title, needFormat: !!node.needFormat, dimValues, isTotal })
      return
    }
    // 合计列组不参与列维度过滤，其下层不记录维度取值（留空串占位，保持下标与 colDims 对齐）
    children.forEach((child) => walk(child, level + 1, [...dimValues, isTotal ? '' : node.title], isTotal))
  }

  head.forEach((node) => walk(node, 0, [], false))
  return { headerRows, leaves }
}

// ============ 数据行展平 ============

export interface PivotBodyCell {
  text: string
  isDim: boolean
  /** 纵向合并行数；0 表示被上方同值单元格合并（该行不渲染此格） */
  span: number
}

export interface PivotBodyRow {
  cells: PivotBodyCell[]
  isTotal: boolean
  /** 后端原始数据行：穿透取值用，不能用格式化后的文本 */
  raw: PivotDataRow
}

/** 合计行判定：首列「合计」且其余行维度列为空串（接口文档 2.4） */
export const isTotalRow = (rowDims: string[], row: PivotDataRow) =>
  rowDims.length > 0 && String(row[rowDims[0]] ?? '') === TOTAL_ROW_TEXT && rowDims.slice(1).every((dim) => !row[dim])

/** 金额列格式化，其余原样展示（维度值为空时显示空，交由后端决定是否给「(空白)」） */
const formatCellText = (leaf: PivotLeafColumn, value: PivotDataRow[string]) => {
  if (value === undefined || value === null || value === '') return ''
  // _dimCodes 与维度值同处一个 map，但它不是取数列，这里兜底忽略对象值
  if (typeof value === 'object') return ''
  return leaf.needFormat ? formatNumValue(value as number | string, 2) : String(value)
}

/**
 * 行维度取值编码：后端给在 `_dimCodes`（合计行是空 map）
 * 取数接口没提供编码时该键缺失，退化为按名称（与后端「按名称分组」口径一致）
 */
export const pickRowDimCodes = (row: PivotDataRow): DimCodeMap => (row._dimCodes as DimCodeMap) ?? {}

/** 列维度取值编码：后端给在 `colDimCodes[列叶子字段]`（合计列、平铺模式都是空 map） */
export const pickColDimCodes = (colDimCodes: Record<string, DimCodeMap> | undefined, leafField: string): DimCodeMap => colDimCodes?.[leafField] ?? {}

/** 某个行维度在该行上的分组键：优先用取值编码，缺失时用名称 */
const rowDimGroupKey = (row: PivotDataRow, dim: string) => pickRowDimCodes(row)[dim] ?? String(row[dim] ?? '')

/**
 * 组装表体：按叶子列顺序取值格式化，行维度列做同值纵向合并（合计行不参与合并、也不被合并）
 * 合并条件必须同时满足「显示文本相同 + 取值编码相同」：
 * 后端按取值编码分组，编码不同、名称相同的两行是两个实体（各自金额独立），
 * 若只比文本会把它们并成一个合并格，看上去像重复数据。
 */
export const buildBodyRows = (table: PivotTable, rows: PivotDataRow[], rowDims: string[]): PivotBodyRow[] => {
  const bodyRows: PivotBodyRow[] = rows.map((raw) => ({
    raw,
    isTotal: isTotalRow(rowDims, raw),
    cells: table.leaves.map((leaf) => ({
      text: formatCellText(leaf, raw[leaf.field]),
      isDim: rowDims.includes(leaf.field),
      span: 1
    }))
  }))

  const dimColumns = table.leaves.map((leaf, index) => ({ index, field: leaf.field })).filter((item) => rowDims.includes(item.field))

  dimColumns.forEach(({ index, field }) => {
    let start = 0
    while (start < bodyRows.length) {
      if (bodyRows[start].isTotal) {
        start += 1
        continue
      }
      let end = start + 1
      while (
        end < bodyRows.length &&
        !bodyRows[end].isTotal &&
        bodyRows[end].cells[index].text === bodyRows[start].cells[index].text &&
        rowDimGroupKey(bodyRows[end].raw, field) === rowDimGroupKey(bodyRows[start].raw, field)
      ) {
        end += 1
      }
      bodyRows[start].cells[index].span = end - start
      for (let rowIndex = start + 1; rowIndex < end; rowIndex += 1) bodyRows[rowIndex].cells[index].span = 0
      start = end
    }
  })

  return bodyRows
}

// ============ 接口调用 ============

const pivotParams = (params: PivotQuery) => ({
  meetingIds: params.meetingIds,
  rowDims: params.rowDims,
  colDims: params.colDims,
  metrics: params.metrics
})

/** 透视分析：返回表头树 + 数据行 + 列维度取值编码（穿透用） */
export const loadPivotData = async (params: PivotQuery) => {
  const res: any = await getPivotData(pivotParams(params))
  if (!res?.success) throw new Error(res?.msg || '透视分析失败')
  return {
    head: (res.data?.head ?? []) as PivotHeadNode[],
    rows: (res.data?.data ?? []) as PivotDataRow[],
    // 列叶子字段 → 该列的列维度取值编码（合计列 / 平铺模式都是空 map）
    colDimCodes: (res.data?.colDimCodes ?? {}) as Record<string, DimCodeMap>
  }
}

/** 明细穿透：分页返回明细行 */
export const loadDrillPage = async (params: DrillQuery) => {
  const res: any = await getPivotCtData(params)
  if (!res?.success) throw new Error(res?.msg || '穿透明细查询失败')
  const data = res.data ?? {}
  return {
    records: (data.records ?? []) as Record<string, any>[],
    total: Number(data.total ?? 0),
    current: Number(data.current ?? params.page),
    size: Number(data.size ?? params.limit)
  }
}

/**
 * blob 下载：导出失败时后端返回的是 JSON 而非 xlsx（接口文档 3.4），
 * 需先按 blob.type 判断再取出 msg，否则用户会下到一个内容是报错信息的坏 xlsx
 */
const downloadBlob = async (res: any, fallbackName: string) => {
  const blob: Blob = res instanceof Blob ? res : res?.data
  if (!(blob instanceof Blob)) throw new Error(res?.msg || '导出失败')

  if ((blob.type || '').includes('json')) {
    const text = await blob.text()
    let msg = '导出失败'
    try {
      msg = JSON.parse(text)?.msg || msg
    } catch {
      // 非 JSON 内容时保留默认提示
    }
    throw new Error(msg)
  }

  // 文件名优先取响应头，取不到时用文档给出的默认名
  const disposition: string = (res?.headers ?? {})['content-disposition'] ?? ''
  const headerName = disposition ? decodeURI(decodeURI(disposition.split(';')[1]?.split('=')[1] ?? '')) : ''

  const url = window.URL.createObjectURL(blob)
  const dom = document.createElement('a')
  dom.href = url
  dom.download = headerName || fallbackName
  document.body.appendChild(dom)
  dom.click()
  document.body.removeChild(dom)
  window.URL.revokeObjectURL(url)
}

/** 导出透视分析结果（交叉表，表头与页面一致） */
export const downloadPivotExport = async (params: PivotQuery) => {
  const res = await exportPivotData(pivotParams(params))
  await downloadBlob(res, '联合会审评审数据透视分析.xlsx')
}

/** 导出穿透明细（后端固定 13 列，不含长文本列；page / limit 不用传） */
export const downloadDrillExport = async (params: Omit<DrillQuery, 'page' | 'limit'>) => {
  const res = await exportCtData({
    meetingIds: params.meetingIds,
    rowDimValues: params.rowDimValues,
    colDimValues: params.colDimValues
  })
  await downloadBlob(res, '明细穿透.xlsx')
}

// ============ 穿透明细列定义（/lhhsPivot/getCtColumns 下发） ============
// 列集合、顺序、标题、是否金额列全部由后端给（与 exportCtData 的 13 列同一处定义），
// 前端不再写死列名——后端改列时页面与导出自动同步。
// 后端只给列定义不给列宽，所以宽度/换行这类纯展示参数在本地按列编码兜底。

export interface DrillColumn {
  /** 字段名：明细记录里用它取值 */
  field: string
  label: string
  width: number
  /** 金额列：右对齐 + 千分位两位小数 */
  amount?: boolean
  /** 长文本列：换行展示 */
  wrap?: boolean
}

/** 列宽/换行兜底（键为列编码），未命中的用默认宽度；后端只给列定义，宽度是纯展示参数 */
const DRILL_COLUMN_STYLE: Record<string, { width: number; wrap?: boolean }> = {
  pspcName: { width: 150 },
  meetingName: { width: 190 },
  yjdwName: { width: 130 },
  ejdwName: { width: 130 },
  yssxmc: { width: 130 },
  protypeName: { width: 120 },
  xmbm: { width: 130 },
  xmmc: { width: 260, wrap: true },
  sbys: { width: 120 },
  scnhje: { width: 135 },
  sdje: { width: 120 },
  hshj: { width: 120 },
  hsyj: { width: 105 },
  // 后增维度：项目评审状态（取值形如「待联合会审」「省联合会审中」「联合会审通过」）
  xmReviewStatus: { width: 130 }
}
const DRILL_COLUMN_DEFAULT_WIDTH = 140

/** 获取穿透明细列定义 */
export const loadDrillColumns = async (): Promise<DrillColumn[]> => {
  const res: any = await getCtColumns({})
  if (!res?.success) throw new Error(res?.msg || '穿透明细列定义加载失败')
  return ((res.data ?? []) as any[])
    .filter((item: any) => item?.available !== false)
    .map((item: any) => ({
      field: item.code,
      label: item.name || item.code,
      amount: !!item.needFormat,
      ...(DRILL_COLUMN_STYLE[item.code] ?? { width: DRILL_COLUMN_DEFAULT_WIDTH })
    }))
}

/** 明细单元格文本：金额格式化，其余原样（空值显示 —，与页面既有观感一致） */
export const formatDrillCell = (row: Record<string, any>, column: DrillColumn) => {
  const value = row[column.field]
  if (value === undefined || value === null || value === '') return '—'
  return column.amount ? formatNumValue(value, 2) : value
}
