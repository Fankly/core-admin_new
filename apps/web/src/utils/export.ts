import ExcelJS from 'exceljs'
import { ElMessage, ElNotification } from 'element-plus'

/**
 * el-table 前端自定义导出
 * @param headerList 表头
 * @param dataList 表格数据 一一对应
 * @param fileName 文件名
 */
export const exportXlsx = (headerList: any, dataList: any[], fileName: any) => {
  if (dataList.length != 0) {
    ElNotification({
      title: '温馨提示',
      message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
      type: 'info',
      duration: 3000
    })
    const workbook = new ExcelJS.Workbook()
    const sheet1 = workbook.addWorksheet('sheet1')
    sheet1.addRow(headerList)
    dataList.forEach((row: any) => {
      const values = Object.values(row)
      sheet1.addRow(values)
    })
    sheet1.columns.forEach((item, index) => {
      item.alignment = { vertical: 'middle', horizontal: 'center' } //单元格居中
      item.width = 20 //宽度
    })
    sheet1.getRow(1).font = { bold: true }

    workbook.xlsx.writeBuffer().then((buffer) => {
      const file = new Blob([buffer], { type: 'application/octet-stream' })
      const dom = document.createElement('a')
      const url = window.URL.createObjectURL(file)
      dom.href = url
      dom.download = `${decodeURI(decodeURI(fileName))}`
      document.body.appendChild(dom)
      dom.click()
      document.body.removeChild(dom)
      window.URL.revokeObjectURL(url)
    })
  } else {
    ElMessage.warning('暂无数据，请勿重复点击！')
  }
}

interface ApiExportHandleOptions {
  useResponseFileName?: boolean
}

/**
 *  api导出
 * @param params api入参
 * @param fileName 文件名
 * @param api apiName
 * @param options 导出选项
 */
export const apiExportHandle = async (params: any, fileName: string, api: (params: any) => Promise<any>, options: ApiExportHandleOptions = {}) => {
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  const res: any = await api(params)
  const blob = res
  const dom = document.createElement('a')
  const url = window.URL.createObjectURL(blob)
  dom.href = url
  let filename = `${fileName}.xlsx` // 文件名
  if (options.useResponseFileName !== false && res.headers && res.headers['content-disposition']) {
    filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
  }
  dom.download = `${decodeURI(decodeURI(filename))}`
  document.body.appendChild(dom)
  dom.click()
  document.body.removeChild(dom)
  window.URL.revokeObjectURL(url)
}

/**
 * vxe-table 前端自定义导出
 * @param $table TableRef
 * @param fileName 文件名
 * @param data 数据
 */
export const vxeExportHandle = ($table: any, fileName: string, data: any[]) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })

      worksheet.eachRow((row: any, rowNumber: any) => {
        // 非末级当前行加粗
        if (newArr[rowNumber - 3]?.leaf) {
          row.eachCell((cell: any) => {
            cell.font = {
              ...cell.font,
              bold: true
            }
          })
        }
      })
    }
  })
}

// ─── 公式配置 ───
// type='ratio'：result = valueField / targetField * 100（如 完成率=完成值/目标值*100）
//              若 subtract=true：result = (targetField - valueField) / targetField * 100
//              （如 分解率=(目标值-待分解)/目标值*100，注意分子相减顺序：target 在前）
// type='diff'： result = currentField - compareField（如 同比比率=本期完成率-对比期完成率）
// matchMode='suffix'（默认）：key 为后缀，按 `{proTypeId}_{suffix}` 分组匹配（适用于 detailDeptData、TbhbDeptModal 动态列）
// matchMode='exact'：key 为完整字段名，精确匹配（适用于 TbhbDeptSumModal 静态列）
// skipField：ratio 模式下，当该字段对应行数据为 0/'-'/空 时跳过公式写入
export interface FormulaItem {
  type: 'ratio' | 'diff'
  valueField?: string
  targetField?: string
  currentField?: string
  compareField?: string
  matchMode?: 'suffix' | 'exact'
  skipField?: string
  // ratio 模式下置 true：分子由 valueField/targetField 改为 (targetField - valueField)
  // 用于"目标值−待分解"等"减法再除"语义；不设则保持原 value/target 形态
  subtract?: boolean
}
export type FormulaConfig = Record<string, FormulaItem>

// ─── SUM 公式配置（用于分组层小计行、合计层目标值/完成值等的求和公式）───
// 每个 SumRangeSpec 描述一行需要写 SUM 的行（小计/合计），以及它对哪些明细行区间求和。
// detailRanges 为多区间（小计行在 Excel 里夹在分组之间，单一连续区间会把别的小计行也加进去）。
// 行索引均为 data 数组的 0-based 下标；内部会按 headerRowCount 换算为 Excel 行号。
export interface SumRangeSpec {
  rowIndex: number // data 数组中本行（小计/合计）的下标
  detailRanges: [number, number][] // 对哪些明细行区间求和（每个 [start, end] 均为 0-based 闭区间）
}
export interface SumFormulaConfig {
  fields: string[] // 要写 SUM 公式的叶子列 field
  items: SumRangeSpec[] // 每个小计/合计行的求和描述
}

// 递归展平多级表头，得到叶子列列表（1-based 列序号与 field 的映射）
const flattenLeafColumns = (cols: any[]): any[] => {
  const result: any[] = []
  const walk = (list: any[]) => {
    if (!Array.isArray(list)) return
    list.forEach((col: any) => {
      if (col.children && col.children.length !== 0) {
        walk(col.children)
      } else {
        result.push(col)
      }
    })
  }
  walk(cols)
  return result
}

// 1-based 列序号 → Excel 列字母（支持超过 Z 列，如 AA、AB…）
const colNumberToLetter = (col: number): string => {
  let letter = ''
  let n = col
  while (n > 0) {
    const rem = (n - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}

// 是否跳过率列公式写入。当前恒不跳过——所有行都写 IFERROR 公式，
// 分母为 0 / "-" / 空 / null 时由 Excel 的 fullCalcOnLoad 兜底成 "-"。
// 若需重新启用按值跳过，在此恢复旧判定：
//   const val = row[field]
//   return val === 0 || val === '0' || val === '-' || val === '' || val == null
const shouldSkipFormula = (_row: any, _field: string): boolean => false

// ─── 公式写入核心逻辑（vxeExportGkHandle 与 vxeExportFormulaHandle 共用）───
// suffix 模式：key 为后缀，按 `{proTypeId}_{suffix}` 分组匹配
// exact 模式：key 为完整 field 名，精确匹配
const writeFormulas = (worksheet: any, visibleCols: any[], data: any[], formulaConfig: FormulaConfig) => {
  if (!data || data.length === 0) return
  const leafCols = flattenLeafColumns(visibleCols)
  // field → 1-based 列序号
  const fieldToCol: Record<string, number> = {}
  leafCols.forEach((col: any, idx: number) => {
    if (col.field) fieldToCol[col.field] = idx + 1
  })
  // 按 proTypeId 分组：{ proTypeId: { suffix: colNumber } }
  const groupByProType: Record<string, Record<string, number>> = {}
  leafCols.forEach((col: any, idx: number) => {
    const field = String(col.field || '')
    if (!field || !field.includes('_')) return
    const parts = field.split('_')
    const proTypeId = parts[0]
    const suffix = parts.slice(1).join('_')
    if (!groupByProType[proTypeId]) groupByProType[proTypeId] = {}
    groupByProType[proTypeId][suffix] = idx + 1
  })
  const headerRowCount = worksheet.rowCount - data.length
  data.forEach((row: any, dataIdx: number) => {
    const excelRow = headerRowCount + dataIdx + 1
    for (const key in formulaConfig) {
      const cfg = formulaConfig[key]
      const isExact = cfg.matchMode === 'exact'
      if (isExact) {
        // ── exact 模式：key 为完整 field 名 ──
        const rateCol = fieldToCol[key]
        if (!rateCol) continue
        if (cfg.type === 'ratio') {
          const valueCol = fieldToCol[cfg.valueField!]
          const targetCol = fieldToCol[cfg.targetField!]
          if (!valueCol || !targetCol) continue
          const skipField = cfg.skipField || cfg.targetField!
          if (shouldSkipFormula(row, skipField)) continue
          const v = colNumberToLetter(valueCol)
          const t = colNumberToLetter(targetCol)
          const r = colNumberToLetter(rateCol)
          const numerator = cfg.subtract ? `(${t}${excelRow}-${v}${excelRow})` : `${v}${excelRow}`
          const cell = worksheet.getCell(`${r}${excelRow}`)
          cell.value = { formula: `IFERROR(${numerator}/${t}${excelRow}*100,"-")` }
          cell.numFmt = '#,##0.00'
        } else {
          // diff
          const curCol = fieldToCol[cfg.currentField!]
          const cmpCol = fieldToCol[cfg.compareField!]
          if (!curCol || !cmpCol) continue
          const c = colNumberToLetter(curCol)
          const m = colNumberToLetter(cmpCol)
          const r = colNumberToLetter(rateCol)
          const cell = worksheet.getCell(`${r}${excelRow}`)
          cell.value = { formula: `IFERROR(${c}${excelRow}-${m}${excelRow},"-")` }
          cell.numFmt = '#,##0.00'
        }
      } else {
        // ── suffix 模式：key 为后缀，按 proTypeId 分组 ──
        for (const proTypeId in groupByProType) {
          const cols = groupByProType[proTypeId]
          const rateCol = cols[key]
          if (!rateCol) continue
          if (cfg.type === 'ratio') {
            const valueCol = cols[cfg.valueField!]
            const targetCol = cols[cfg.targetField!]
            if (!valueCol || !targetCol) continue
            const skipField = cfg.skipField || cfg.targetField!
            if (shouldSkipFormula(row, `${proTypeId}_${skipField}`)) continue
            const v = colNumberToLetter(valueCol)
            const t = colNumberToLetter(targetCol)
            const r = colNumberToLetter(rateCol)
            const numerator = cfg.subtract ? `(${t}${excelRow}-${v}${excelRow})` : `${v}${excelRow}`
            const cell = worksheet.getCell(`${r}${excelRow}`)
            cell.value = { formula: `IFERROR(${numerator}/${t}${excelRow}*100,"-")` }
            cell.numFmt = '#,##0.00'
          } else {
            // diff
            const curCol = cols[cfg.currentField!]
            const cmpCol = cols[cfg.compareField!]
            if (!curCol || !cmpCol) continue
            const c = colNumberToLetter(curCol)
            const m = colNumberToLetter(cmpCol)
            const r = colNumberToLetter(rateCol)
            const cell = worksheet.getCell(`${r}${excelRow}`)
            cell.value = { formula: `IFERROR(${c}${excelRow}-${m}${excelRow},"-")` }
            cell.numFmt = '#,##0.00'
          }
        }
      }
    }
  })
  worksheet.workbook.calcProperties = { fullCalcOnLoad: true }
}

// ─── SUM 公式写入（分组小计 / 合计行的目标值、完成值等值列）───
// 对 sumConfig.items 中的每个 SumRangeSpec，把指定 fields 列的单元格覆盖为
//   =SUM(<区间1>) + SUM(<区间2>) + ...   （多区间时）
//   =SUM(<区间1>)                         （单区间时）
// 区间以 Excel 行号表达；空 detailRanges 跳过该行。
// 列字母与 Excel 行号复用 writeFormulas 同一套换算（1-based 列号、headerRowCount + idx + 1）。
const writeSumFormulas = (worksheet: any, visibleCols: any[], data: any[], sumConfig: SumFormulaConfig, xsws = 2) => {
  if (!data || data.length === 0) return
  const leafCols = flattenLeafColumns(visibleCols)
  const fieldToCol: Record<string, number> = {}
  leafCols.forEach((col: any, idx: number) => {
    if (col.field) fieldToCol[col.field] = idx + 1
  })
  const headerRowCount = worksheet.rowCount - data.length
  sumConfig.items.forEach((spec: SumRangeSpec) => {
    if (typeof spec.rowIndex !== 'number' || spec.rowIndex < 0 || spec.rowIndex >= data.length) return
    const validRanges = (spec.detailRanges || []).filter((r) => Array.isArray(r) && r.length === 2 && r[0] >= 0 && r[1] >= r[0] && r[1] < data.length)
    if (validRanges.length === 0) return
    const excelTargetRow = headerRowCount + spec.rowIndex + 1
    sumConfig.fields.forEach((field: string) => {
      const colNum = fieldToCol[field]
      if (!colNum) return
      const letter = colNumberToLetter(colNum)
      const sums = validRanges.map((r) => `SUM(${letter}${headerRowCount + r[0] + 1}:${letter}${headerRowCount + r[1] + 1})`)
      const formula = sums.length === 1 ? sums[0] : sums.join('+')
      const cell = worksheet.getCell(`${letter}${excelTargetRow}`)
      cell.value = { formula }
      cell.numFmt = `#,##0.${'0'.repeat(xsws)}`
    })
  })
  worksheet.workbook.calcProperties = { fullCalcOnLoad: true }
}

// ─── 行内（横向）SUM 公式配置（同行右侧科目列汇总到汇总列，如 成本小计 = 检修+研究+其他+…）───
// 每个 InlineSumSpec 描述一个"汇总列"：targetField 是该汇总列的 field；
// sourceFields 是它要相加的明细科目列 field。导出时把该列每行单元格
//   =SUM(<源列1字母><行号>,<源列2字母><行号>,...)
// （SUM 自动忽略文本/空单元格，避免 "-" 等占位符导致 #VALUE!）
// sources 为空 / 源列不在当前叶子列中 → 跳过该 spec。
export interface InlineSumSpec {
  targetField: string
  sourceFields: string[]
}
export type InlineSumConfig = InlineSumSpec[]

// ─── 行内（横向）SUM 公式选项 ───
// config：要写入的汇总列配置列表
// rowFilter：可选行过滤谓词，返回 false 的行不写公式（保留原值）。
//   业务侧用于跳过分组小计/合计/待分解等聚合行——这些行的汇总值由后端给出，
//   不应被横向求和公式覆盖。谓词接收 (row, dataIdx)，dataIdx 为 data 数组下标。
export interface InlineSumOptions {
  config: InlineSumConfig
  rowFilter?: (row: any, dataIdx: number) => boolean
}

// ─── 排名公式配置（导出时给排名列注入 RANK 公式，基于完成率列自动算名次）───
// 每个 RankSpec 描述一个"排名列"：
//   field     排名列的 field，如 'cbxSpm'(省排名) / 'cbxGdgspm'(分组排名)
//   rateField 完成率列的 field，作为排序基准，如 'subtotalWcl'（仅用于定位列位置，
//             排名时不直接读其 JS 值——该列常为导出公式列，row 里无对应 JS 值）
//   rateCalc  完成率现算函数：从 row 的真实数据字段算出完成率数值。省排名（global）预计算
//             名次时用它而非 row[rateField]（后者在屏幕 data 里可能不存在）。返回非数字/null
//             视为该行完成率无效、不参与排名。
//   scope     'global'=省排名（参与判定的明细行全局一起排，不按小计段/dwType 分组；
//             仅参与判定通过的行赋名次，其余留空）
//             'segment'=分组排名（所有明细行在本组段内赋名次）
//   参与判定（仅 global 模式生效，二选一；都不给则全部明细行参与）：
//   - rankFieldHasValue=true：以「本排名字段 row[field] 有值且非 0」为准参与（后端给了该行
//     非 0 省排名才参与，数据驱动而非单位类型硬编码；优于 dwTypeFilter）
//   - dwTypeFilter：只对 dwType === 此值的明细行写公式，其它明细行留空（兼容旧用法）
export interface RankSpec {
  field: string
  rateField: string
  scope: 'global' | 'segment'
  dwTypeFilter?: string
  rankFieldHasValue?: boolean
  rateCalc?: (row: any) => number | null
}
export interface RankFormulaConfig {
  specs: RankSpec[]
}

// ─── 行内（横向）SUM 公式写入（成本小计等"汇总列"对同行右侧科目列求和）───
// 对每个 InlineSumSpec，把 targetField 列的每个数据行单元格覆盖为
//   =SUM(<源列1><行号>,<源列2><行号>,...)
// 用 SUM 而非 A+B+C：SUM 会自动忽略文本/空单元格（后端常把无效值写成 "-"，用 + 链接会得到 #VALUE!）。
// 列字母与 Excel 行号复用 writeSumFormulas 同一套换算。
// 若某源列不在 visibleCols 的叶子列里（后端动态列没返回该科目），该 spec 整体跳过；
// 若 targetField 不在叶子列里，该 spec 同样跳过。
// rowFilter 返回 false 的行不写公式（保留原值），用于跳过分组/合计等聚合行。
const writeInlineSumFormulas = (worksheet: any, visibleCols: any[], data: any[], inlineSumOptions: InlineSumOptions, xsws = 2) => {
  if (!data || data.length === 0) return
  const { config: inlineSumConfig, rowFilter } = inlineSumOptions
  if (!Array.isArray(inlineSumConfig) || inlineSumConfig.length === 0) return
  const leafCols = flattenLeafColumns(visibleCols)
  const fieldToCol: Record<string, number> = {}
  leafCols.forEach((col: any, idx: number) => {
    if (col.field) fieldToCol[String(col.field)] = idx + 1
  })
  const headerRowCount = worksheet.rowCount - data.length
  inlineSumConfig.forEach((spec: InlineSumSpec) => {
    const targetCol = fieldToCol[spec.targetField]
    if (!targetCol) return
    const sourceCols = (spec.sourceFields || []).map((f) => fieldToCol[f]).filter((c): c is number => typeof c === 'number' && c > 0)
    if (sourceCols.length === 0) return
    const targetLetter = colNumberToLetter(targetCol)
    const sourceLetters = sourceCols.map((c) => colNumberToLetter(c))
    data.forEach((row: any, dataIdx: number) => {
      if (rowFilter && !rowFilter(row, dataIdx)) return // 聚合行保持原值
      const excelRow = headerRowCount + dataIdx + 1
      // 用 SUM(单元格1,单元格2,...) 而非 A+B+C：SUM 会自动忽略文本/空单元格
      // （后端常把无效值写成 "-"，用 + 链接会得到 #VALUE!）
      const formula = `SUM(${sourceLetters.map((l) => `${l}${excelRow}`).join(',')})`
      const cell = worksheet.getCell(`${targetLetter}${excelRow}`)
      cell.value = { formula }
      cell.numFmt = `#,##0.${'0'.repeat(xsws)}`
    })
  })
  worksheet.workbook.calcProperties = { fullCalcOnLoad: true }
}

// ─── 排名写入（基于完成率列算名次）───
// 行分类：与 buildSumConfig 同一套判定（dwType === '-1' = 聚合行；dwName '合计'/'待分解' = 末两行）
// 段定义：每个 dwType='-1' 的「小计行」之后到下一个聚合行之前的连续明细行区间。
//   该段内所有明细行 dwType 相同（addDataMergeData 按 dwType 分组）。
// 写入方式：
//   分组排名（每行在本组段内排名，段内连续）：写 RANK 公式 =IFERROR(RANK($W{R},$W{segStart}:$W{segEnd},0),"")
//   省排名（跨全部参与明细行全局排，不按小计段/dwType 分组）：
//     参与排名的明细行可能散落在不同小计段，中间夹着未参与行与聚合行，无法用单一连续 Excel 区域做
//     RANK 区间（会纳入中间无关行），故前端按完成率降序预计算名次（standard competition ranking：1,1,3）
//     直接写死数值；完成率无效（空/"-"/非数字）或未通过参与判定的行留空。
// RANK 第三参 0=降序（完成率最高=第 1 名）；RANK 自动忽略非数字单元格（subtotalWcl 为 "-" 的行不参与计数）；
//   并列名次用 standard competition ranking（1,1,3）。
// 聚合行（小计/合计/待分解）与未通过参与判定的明细行：覆盖为空字符串，原 raw 文本值会被清空。
const writeRankFormulas = (worksheet: any, visibleCols: any[], data: any[], rankFormulaConfig: RankFormulaConfig) => {
  if (!data || data.length === 0) return
  const { specs } = rankFormulaConfig
  if (!Array.isArray(specs) || specs.length === 0) return
  const leafCols = flattenLeafColumns(visibleCols)
  const fieldToCol: Record<string, number> = {}
  leafCols.forEach((col: any, idx: number) => {
    if (col.field) fieldToCol[String(col.field)] = idx + 1
  })
  const headerRowCount = worksheet.rowCount - data.length
  const isAggregate = (r: any) => String(r?.dwType ?? '') === '-1'
  const isTotal = (r: any) => isAggregate(r) && String(r?.dwName ?? '') === '合计'
  const isDfj = (r: any) => isAggregate(r) && String(r?.dwName ?? '') === '待分解'
  const isSubtotal = (r: any) => isAggregate(r) && !isTotal(r) && !isDfj(r)
  const isDetail = (r: any) => !isAggregate(r)

  // 计算每个明细行所属段的 Excel 行区间 [segStartExcel, segEndExcel]
  // 与 buildSumConfig 切段同源：小计行 i 的明细段 = [i+1, j-1]（j 为下一个聚合行下标）
  const segOfRow: ({ start: number; end: number } | null)[] = new Array(data.length).fill(null)
  for (let i = 0; i < data.length; i++) {
    if (!isSubtotal(data[i])) continue
    let j = i + 1
    while (j < data.length && isDetail(data[j])) j++
    if (j - 1 >= i + 1) {
      const startExcel = headerRowCount + (i + 1) + 1
      const endExcel = headerRowCount + (j - 1) + 1
      for (let k = i + 1; k <= j - 1; k++) segOfRow[k] = { start: startExcel, end: endExcel }
    }
  }

  specs.forEach((spec) => {
    const rankCol = fieldToCol[spec.field]
    const rateCol = fieldToCol[spec.rateField]
    if (!rankCol || !rateCol) return
    const R = colNumberToLetter(rankCol)
    const W = colNumberToLetter(rateCol)
    // 省排名参与判定：是否该明细行参与省排名（仅 global 模式有效）
    // - rankFieldHasValue=true：本排名字段 row[field] 有值且非 0 才参与（后端给了该行非 0 省排名才参与）
    // - dwTypeFilter：仅 dwType===filter 的明细行参与（兼容旧用法）
    // 二者优先 rankFieldHasValue；都不给则全部明细行参与。
    const joinsProvinceRank = (row: any): boolean => {
      if (spec.scope !== 'global') return true
      if (spec.rankFieldHasValue) {
        const v = row?.[spec.field]
        if (v === null || v === undefined || v === '') return false
        const s = String(v).trim()
        if (s === '' || s === '-') return false
        const n = Number(v)
        if (!Number.isFinite(n) || n === 0) return false
        return true
      } else if (spec.dwTypeFilter !== undefined) {
        return String(row?.dwType ?? '') === spec.dwTypeFilter
      }
      return true
    }
    // 省排名（global）：参与排名的明细行可能散落在不同小计段，中间夹着未参与行与聚合行，
    // 无法用单一连续 Excel 区域做 RANK 区间（会纳入中间无关行的完成率计数）。
    // 故前端按完成率降序预计算名次（standard competition ranking：1,1,3），直接写死数值。
    // 完成率用 rateCalc 从 row 真实字段现算（rateField 常为导出公式列，row 里无 JS 值）。
    const calcRate = (row: any): number | null => {
      if (spec.rateCalc) {
        const v = spec.rateCalc(row)
        return typeof v === 'number' && Number.isFinite(v) ? v : null
      }
      const rv = row?.[spec.rateField]
      if (rv === null || rv === undefined || rv === '') return null
      const s = String(rv).trim()
      if (s === '' || s === '-') return null
      const n = Number(rv)
      return Number.isFinite(n) ? n : null
    }
    const rankByRowIdx: (number | null)[] = new Array(data.length).fill(null)
    if (spec.scope === 'global') {
      const joinIdxs: number[] = []
      data.forEach((row: any, idx: number) => {
        if (isDetail(row) && joinsProvinceRank(row)) {
          const rate = calcRate(row)
          if (rate !== null) joinIdxs.push(idx)
        }
      })
      // 降序按完成率排序，赋 standard competition ranking 名次
      joinIdxs.sort((a, b) => (calcRate(data[b]) ?? -Infinity) - (calcRate(data[a]) ?? -Infinity))
      let prevRate: number | null = null
      let prevRank = 0
      let count = 0
      joinIdxs.forEach((idx) => {
        const rate = calcRate(data[idx])
        count++
        if (prevRate === null || rate !== prevRate) {
          prevRank = count
          prevRate = rate
        }
        rankByRowIdx[idx] = prevRank
      })
    }
    data.forEach((row: any, idx: number) => {
      const excelRow = headerRowCount + idx + 1
      const cell = worksheet.getCell(`${R}${excelRow}`)
      // 聚合行（小计/合计/待分解）：留空
      if (isAggregate(row)) {
        cell.value = ''
        return
      }
      if (spec.scope === 'global') {
        // 省排名：直接写预计算的名次数值（完成率无效或未参与的行 rankByRowIdx 为 null → 留空）
        const rank = rankByRowIdx[idx]
        cell.value = rank === null ? '' : rank
        if (rank !== null) cell.numFmt = '0'
        return
      }
      // 分组排名（segment）：在本组段内用 RANK 公式（段内连续，由 Excel 实时算）
      const seg = segOfRow[idx]
      if (!seg) {
        cell.value = ''
        return
      }
      cell.value = { formula: `IFERROR(RANK(${W}${excelRow},${W}${seg.start}:${W}${seg.end},0),"")` }
      cell.numFmt = '0' // 排名为整数
    })
  })
  worksheet.workbook.calcProperties = { fullCalcOnLoad: true }
}

export const vxeExportGkHandle = ($table: any, fileName: string | undefined, data: any[] | undefined, xsws = 2, formulaConfig?: FormulaConfig) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })

      // 取可见列 field，用于按列判断是否原样导出
      const visibleCols: any[] = $table.getColumns?.() || []
      const isRawField = (colNumber: number) => {
        const field = String(visibleCols[colNumber - 1]?.field || '')
        return field === 'rownumber' || /pm/i.test(field)
      }

      worksheet.eachRow((row: any, rowNumber: any) => {
        row.eachCell((cell: any) => {
          // rownumber 列与 field 含 Pm 的列原样导出，仅保留边框
          if (!isRawField(cell.col)) {
            // 千分位/纯数字字符串还原为数值，便于 Excel 计算
            if (typeof cell.value === 'string' && cell.value.trim() !== '' && !cell.value.includes('(')) {
              const cleaned = cell.value.replace(/,/g, '').trim()
              if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
                cell.value = Number(cleaned)
              }
            }
            if (typeof cell.value === 'number') {
              cell.numFmt = `#,##0.${'0'.repeat(xsws)}`
            }
            if (typeof cell.value === 'string' && cell.value.includes('(%')) {
              cell.value = cell.value.replace(/\(/g, '\n(')
              cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle', horizontal: 'center' }
            }
          }
          cell.border = {
            top: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            left: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            bottom: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            right: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            }
          }
        })
      })

      // 率列写入 Excel 公式（xx率 = xx值/目标值*100）
      if (formulaConfig && data && data.length > 0) {
        writeFormulas(worksheet, visibleCols, data, formulaConfig)
      }
    }
  })
}

/**
 * vxe-table 前端自定义导出(带样式)
 * @param $table TableRef
 * @param fileName 文件名
 * @param data 数据
 */
export const vxeExportStyle = ($table: any, fileName: string, data: any[]) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
          const { mbzGkjb } = newArr[cellNumber - 3]
          cell.font.color = {
            argb: mbzGkjb == '1' ? 'ff4c52' : mbzGkjb == '2' ? 'fcb900' : mbzGkjb == '3' ? '11c26d' : ''
          }
        }
      })
      worksheet.eachRow((row: any, rowNumber: any) => {
        // 非末级当前行加粗
        if (newArr[rowNumber - 3]?.leaf) {
          row.eachCell((cell: any) => {
            cell.font = {
              ...cell.font,
              bold: true
            }
          })
        }
      })
    }
  })
}

const getExportData = (newArr: any[], data: any[], cj: number, $table: any) => {
  data.forEach((item) => {
    const flag = $table.isTreeExpandByRow(item)
    newArr.push({
      name: item?.name,
      cj: cj,
      leaf: item?.leaf,
      mbzGkjb: item.mbzGkjb
    })
    if (item.leaf && item.children && flag) {
      getExportData(newArr, item.children, cj + 1, $table)
    }
  })
  return newArr
}

/**
 *  api导出(各个类型文件)
 * @param params api入参
 * @param fileName 文件名包括后缀
 * @param api apiName
 */
export const apiExporFile = async (params: any, fileName: string, api: (params: any) => Promise<any>) => {
  ElNotification({
    title: '温馨提示',
    message: '如果数据庞大会导致下载缓慢哦，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  const res: any = await api(params)
  const blob = res
  const dom = document.createElement('a')
  const url = window.URL.createObjectURL(blob)
  dom.href = url
  let filename = `${fileName}`
  if (res.headers && res.headers['content-disposition']) {
    filename = res.headers['content-disposition'].split(';')[1].split('=')[1]
  }
  dom.download = `${decodeURI(decodeURI(filename))}`
  document.body.appendChild(dom)
  dom.click()
  document.body.removeChild(dom)
  window.URL.revokeObjectURL(url)
}

/**
 * vxe-table 同比/环比导出：按列类型决定小数位与对齐
 * - 率列（title 含「率」）固定 2 位小数、居中
 * - 其余数值列按 xsws 位小数、沿用列 align（值列右对齐）
 * - 文本列居中、原样导出
 * @param $table TableRef
 * @param fileName 文件名
 * @param data 数据
 * @param xsws 数值列小数位
 */
export const vxeExportTbhbHandle = ($table: any, fileName: string | undefined, data: any[] | undefined, xsws = 2) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const visibleCols: any[] = $table.getColumns?.() || []
      // 列级配置：是否原样、小数位、对齐方式
      const colConfigs = visibleCols.map((col: any) => {
        const field = String(col?.field || '')
        const title = String(col?.title || '')
        const isRaw = field === 'rownumber' || /pm/i.test(field)
        const isText = !field || /(code|id|name|type|rownumber)$/i.test(field)
        const isRate = title.indexOf('率') !== -1
        const digits = isRate ? 2 : xsws
        const align = isText ? 'center' : col?.align || 'center'
        return { isRaw, isText, isRate, digits, align }
      })
      const getColConfig = (colNumber: number) =>
        colConfigs[colNumber - 1] || { isRaw: false, isText: false, isRate: false, digits: xsws, align: 'center' }

      worksheet.eachRow((row: any, rowNumber: any) => {
        row.eachCell((cell: any) => {
          const cfg = getColConfig(cell.col)
          if (!cfg.isRaw) {
            // 千分位/纯数字字符串还原为数值，便于 Excel 计算
            if (typeof cell.value === 'string' && cell.value.trim() !== '' && !cell.value.includes('(')) {
              const cleaned = cell.value.replace(/,/g, '').trim()
              if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
                cell.value = Number(cleaned)
              }
            }
            if (typeof cell.value === 'number' && !cfg.isText) {
              cell.numFmt = `#,##0.${'0'.repeat(cfg.digits)}`
            }
            if (typeof cell.value === 'string' && cell.value.includes('(%')) {
              cell.value = cell.value.replace(/\(/g, '\n(')
              cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle', horizontal: 'center' }
            } else if (!cell.alignment || !cell.alignment.horizontal) {
              cell.alignment = { ...cell.alignment, vertical: 'middle', horizontal: cfg.align }
            }
          }
          cell.border = {
            top: { style: 'thin', color: { argba: 'FFFF0000' } },
            left: { style: 'thin', color: { argba: 'FFFF0000' } },
            bottom: { style: 'thin', color: { argba: 'FFFF0000' } },
            right: { style: 'thin', color: { argba: 'FFFF0000' } }
          }
        })
      })
    }
  })
}

/**
 * 统一导出方法：融合 vxeExportGkHandle + vxeExportTbhbHandle，并支持率列写入 Excel 公式。
 * - tbhbMode=false（默认）：所有数值列统一 xsws 位小数、红色边框（同 vxeExportGkHandle）
 * - tbhbMode=true：按列 title 判断率/文本/值列，率列固定 2 位居中、值列按 xsws 右对齐（同 vxeExportTbhbHandle）
 * - formulaConfig：率列公式配置，支持 ratio（值/目标*100）和 diff（当前-对比）两种公式
 *   - matchMode='suffix'（默认）：key 为后缀，按 `{proTypeId}_{suffix}` 分组匹配
 *   - matchMode='exact'：key 为完整字段名，精确匹配
 * @param $table TableRef
 * @param fileName 文件名
 * @param data 数据
 * @param xsws 数值列小数位
 * @param formulaConfig 率列公式配置
 * @param options { tbhbMode?: boolean }
 * @param sumConfig 纵向 SUM 配置（分组小计/合计行对明细行区间求和）
 * @param inlineSumOptions 横向 SUM 选项（汇总列对同行右侧科目列求和，如 成本小计 = 检修+研究+其他+…）；
 *   含 rowFilter 可跳过分组/合计等聚合行（保留原值）
 * @param rankFormulaConfig 排名公式配置（排名列基于完成率列在本组段内 RANK，省排名仅对 dwTypeFilter 行赋名次）
 */
export const vxeExportFormulaHandle = (
  $table: any,
  fileName: string | undefined,
  data: any[] | undefined,
  xsws = 2,
  formulaConfig?: FormulaConfig,
  options?: { tbhbMode?: boolean },
  sumConfig?: SumFormulaConfig,
  inlineSumOptions?: InlineSumOptions,
  rankFormulaConfig?: RankFormulaConfig
) => {
  const tbhbMode = options?.tbhbMode === true
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      // 树形缩进（与 vxeExportGkHandle 一致）
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })

      const visibleCols: any[] = $table.getColumns?.() || []

      // 列级配置
      const colConfigs = visibleCols.map((col: any) => {
        const field = String(col?.field || '')
        const title = String(col?.title || '')
        const isRaw = field === 'rownumber' || /pm/i.test(field)
        const isText = !field || /(code|id|name|type|rownumber)$/i.test(field)
        const isRate = tbhbMode && title.indexOf('率') !== -1
        const digits = isRate ? 2 : xsws
        const align = isText ? 'center' : col?.align || 'center'
        return { isRaw, isText, isRate, digits, align }
      })
      const getColConfig = (colNumber: number) =>
        colConfigs[colNumber - 1] || { isRaw: false, isText: false, isRate: false, digits: xsws, align: 'center' }

      worksheet.eachRow((row: any, rowNumber: any) => {
        row.eachCell((cell: any) => {
          const cfg = getColConfig(cell.col)
          if (!cfg.isRaw) {
            // 千分位/纯数字字符串还原为数值
            if (typeof cell.value === 'string' && cell.value.trim() !== '' && !cell.value.includes('(')) {
              const cleaned = cell.value.replace(/,/g, '').trim()
              if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
                cell.value = Number(cleaned)
              }
            }
            if (typeof cell.value === 'number' && !cfg.isText) {
              cell.numFmt = `#,##0.${'0'.repeat(cfg.digits)}`
            }
            if (typeof cell.value === 'string' && cell.value.includes('(%')) {
              cell.value = cell.value.replace(/\(/g, '\n(')
              cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle', horizontal: 'center' }
            } else if (tbhbMode && (!cell.alignment || !cell.alignment.horizontal)) {
              cell.alignment = { ...cell.alignment, vertical: 'middle', horizontal: cfg.align }
            }
          }
          cell.border = {
            top: { style: 'thin', color: { argba: 'FFFF0000' } },
            left: { style: 'thin', color: { argba: 'FFFF0000' } },
            bottom: { style: 'thin', color: { argba: 'FFFF0000' } },
            right: { style: 'thin', color: { argba: 'FFFF0000' } }
          }
        })
      })

      // 率列写入 Excel 公式
      if (formulaConfig && data && data.length > 0) {
        writeFormulas(worksheet, visibleCols, data, formulaConfig)
      }
      // 分组小计 / 合计行的值列写入 SUM 公式
      if (sumConfig && data && data.length > 0) {
        writeSumFormulas(worksheet, visibleCols, data, sumConfig, xsws)
      }
      // 行内（横向）汇总列对同行右侧科目列求和（如 成本小计 = 检修+研究+其他+…）
      if (inlineSumOptions && data && data.length > 0) {
        writeInlineSumFormulas(worksheet, visibleCols, data, inlineSumOptions, xsws)
      }
      // 排名列写入 RANK 公式（省排名/分组排名，基于完成率列自动算名次）
      if (rankFormulaConfig && data && data.length > 0) {
        writeRankFormulas(worksheet, visibleCols, data, rankFormulaConfig)
      }
    }
  })
}

export const vxeExportSixHandle = ($table: any, fileName: string, data: any[]) => {
  ElNotification({
    title: '温馨提示',
    message: '如果需导出全部数据请点击一键展开，请您耐心等待！',
    type: 'info',
    duration: 3000
  })
  $table.exportData({
    type: 'xlsx',
    filename: fileName,
    sheetName: fileName,
    original: false,
    useStyle: true,
    sheetMethod: function ({ options, worksheet }: any) {
      const nameCol = worksheet.getColumn('A')
      const newArr: any[] = []
      getExportData(newArr, data as any, 1, $table)
      nameCol.eachCell({ includeEmpty: false }, (cell: any, cellNumber: number) => {
        if (cell.address !== 'A1' && cell.address !== 'A2') {
          if (newArr[cellNumber - 3]?.cj > 1) {
            cell.value = '    '.repeat(newArr[cellNumber - 3].cj - 1) + newArr[cellNumber - 3].name
          }
        }
      })

      worksheet.eachRow((row: any, rowNumber: any) => {
        row.eachCell((cell: any) => {
          if (typeof cell.value === 'number') {
            cell.numFmt = '0.000000'
          }
          if (typeof cell.value === 'string' && cell.value.includes('(%')) {
            cell.value = cell.value.replace(/\(/g, '\n(')
            cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'middle', horizontal: 'center' }
          }
          cell.border = {
            top: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            left: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            bottom: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            },
            right: {
              style: 'thin',
              color: {
                argba: 'FFFF0000'
              }
            }
          }
        })
      })
    }
  })
}
