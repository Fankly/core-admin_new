import ExcelJS from 'exceljs'
import Mock from 'mockjs'
import { binaryResponse, fail, getQueryValue, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import {
  ADJUST_TYPES,
  MAINTAIN_COLUMNS,
  PROJECT_TYPES,
  SUMMARY_COLUMNS,
  applyControls,
  assertEditable,
  candidateRows,
  clone,
  getState,
  maintainRows,
  normalizeProject,
  projectRowsByVersionIds,
  summaryRows,
  versions
} from './data'
import type { Row, VersionState } from './data'

interface Column {
  key: string
  header: string
}
const DETAIL_COLUMNS: Column[] = [
  ['xmbm', '项目编码'],
  ['xmmc', '项目名称'],
  ['nd', '年度'],
  ['tzlx', '调整类型（1新增/2调整/3取消）'],
  ['xmlxName', '项目类型'],
  ['yjdwName', '一级单位'],
  ['ejdwName', '二级单位'],
  ['xmxzName', '项目性质'],
  ['jsksnd', '建设开始年度'],
  ['jsjsnd', '建设结束年度'],
  ['amount', '总预算（不含税）（万元）'],
  ['dnys', '当年预算'],
  ['dnysTzh', '当年预算（调整后）'],
  ['tzfd', '调整幅度'],
  ['tzsm', '调整说明'],
  ['kypfwh', '可研批复文号'],
  ['sfyap', '是否预安排（0否/1是）'],
  ['xmyxjName', '项目优先级'],
  ['remark', '备注']
].map(([key, header]) => ({ key, header }))
const CONTROL_COLUMNS = [
  { key: 'protypeId', header: '项目类型编码' },
  { key: 'protypeName', header: '项目类型' },
  { key: 'ysje', header: '目标总控值' }
]
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const AMOUNT_KEYS = new Set([
  'amount',
  'dnys',
  'dnysTzh',
  'tzfd',
  'ysje',
  'zkz',
  'dfj',
  'dwSum',
  'declareAmount',
  'currentBudget',
  'adjustedCurrentBudget',
  'adjustAmount'
])

const workbookBlob = async (columns: Column[], rows: Row[]) => {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('省级统筹目标值')
  sheet.columns = columns.map((column) => ({ ...column, width: column.key === 'xmmc' || column.key === 'tzsm' ? 44 : 24 }))
  sheet.addRows(
    rows.map((row) =>
      Object.fromEntries(
        columns.map(({ key }) => [
          key,
          (AMOUNT_KEYS.has(key) || key.startsWith('SJTC-DW-')) && row[key] !== '' && row[key] !== undefined ? Number(row[key]) : row[key]
        ])
      )
    )
  )
  sheet.getRow(1).font = { bold: true }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  columns
    .filter(({ key }) => AMOUNT_KEYS.has(key) || key.startsWith('SJTC-DW-'))
    .forEach(({ key }) => {
      sheet.getColumn(key).numFmt = '#,##0.000000'
    })
  return new Blob([await workbook.xlsx.writeBuffer()], { type: EXCEL_TYPE })
}

const readWorkbook = async (options: MockOptions, columns: Column[]): Promise<Row[]> => {
  const file = options.body instanceof FormData ? options.body.get('file') : null
  if (
    !(file instanceof Blob) ||
    !String((file as File).name || '')
      .toLowerCase()
      .endsWith('.xlsx')
  )
    throw new Error('演示导入支持本页下载的 .xlsx 模板或导出文件')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const sheet = workbook.worksheets[0]
  if (!sheet || columns.some((column, index) => sheet.getRow(1).getCell(index + 1).text !== column.header)) throw new Error('Excel 表头与模板不一致')
  const rows: Row[] = []
  sheet.eachRow((row, index) => {
    if (index === 1 || !row.getCell(1).text.trim()) return
    rows.push(Object.fromEntries(columns.map((column, cellIndex) => [column.key, row.getCell(cellIndex + 1).text.trim()])))
  })
  if (!rows.length) throw new Error('Excel 中没有可导入的数据')
  return rows
}

const register = (path: string, method: string, handler: (state: VersionState, options: MockOptions) => unknown, writable = false) => {
  Mock.mock(new RegExp(`/sjtcmbztz/${path}(?:\\?.*)?$`), method, async (options: MockOptions) => {
    try {
      const versionId = getQueryValue(options.url, 'versionId') || parseBody(options).versionId
      const state = getState(versionId)
      if (writable) assertEditable(state)
      return await handler(state, options)
    } catch (error) {
      return fail((error as Error).message)
    }
  })
}
const download = async (name: string, columns: Column[], rows: Row[]) =>
  binaryResponse(await workbookBlob(columns, rows), { fileName: `${name}.xlsx` })

register('getImportTemplate', 'post', (state) =>
  download(
    '目标总控值导入模板',
    CONTROL_COLUMNS,
    PROJECT_TYPES.map((type) => ({ protypeId: type.id, protypeName: type.name, ysje: state.controls[type.id] }))
  )
)
register('exportData', 'post', (state, options) =>
  download(
    '省级统筹目标总控值',
    MAINTAIN_COLUMNS.map((column) => ({ key: column.columnKey, header: column.columnValue })),
    maintainRows(state, getQueryValue(options.url, 'dataType'))
  )
)
register('xmSum/exportSum', 'post', (state) =>
  download(
    '项目调整幅度汇总',
    SUMMARY_COLUMNS.map((column) => ({ key: column.columnKey, header: column.columnValue })),
    summaryRows(state)
  )
)
register('xmDetail/exportXmDetail', 'post', (state) => download('项目明细清单', DETAIL_COLUMNS, state.projects))
Mock.mock(/\/sjtcmbztz\/exportXmDetailByVersionIds(?:\?.*)?$/, 'post', async (options: MockOptions) => {
  try {
    return await download(
      '多版本项目明细清单',
      [{ key: 'versionName', header: '版本名称' }, { key: 'versionNo', header: '版本编号' }, ...DETAIL_COLUMNS],
      projectRowsByVersionIds(parseBody(options))
    )
  } catch (error) {
    return fail((error as Error).message)
  }
})
register('xmDetail/getImportXmDetailTmplate', 'post', (state) => download('项目明细清单导入模板', DETAIL_COLUMNS, state.projects))
register('xmDetail/getXmDetailTemplateNew', 'post', (state, options) =>
  download('待确认项目清单', DETAIL_COLUMNS, candidateRows(state, parseBody(options)))
)

register(
  'importData',
  'post',
  async (state, options) => {
    applyControls(state, await readWorkbook(options, CONTROL_COLUMNS))
    return success(true)
  },
  true
)
register(
  'xmDetail/importXmDetail',
  'post',
  async (state, options) => {
    const rows = await readWorkbook(options, DETAIL_COLUMNS)
    const projects = clone(state.projects)
    const seen = new Set<string>()
    for (const row of rows) {
      if (seen.has(row.xmbm)) throw new Error(`项目编码重复：${row.xmbm}`)
      seen.add(row.xmbm)
      const index = projects.findIndex((project) => project.xmbm === row.xmbm)
      const original =
        index >= 0
          ? projects[index]
          : ADJUST_TYPES.flatMap((type) => candidateRows(state, { nd: row.nd, tzlx: type.code })).find(
              (project) => project.xmbm === row.xmbm && project.tzlx === row.tzlx
            )
      if (!original) throw new Error(`项目不存在：${row.xmbm}`)
      const next = normalizeProject({ ...original, dnysTzh: row.dnysTzh, tzsm: row.tzsm, sfyap: row.sfyap })
      if (index < 0) projects.push(next)
      else projects[index] = next
    }
    state.projects = projects
    return success(true)
  },
  true
)

register('getAttach', 'get', (state) => success(clone(state.attachments)))
register(
  'uploadAttach',
  'post',
  (state, options) => {
    const files = options.body instanceof FormData ? options.body.getAll('files') : []
    if (!files.length || files.some((file) => !(file instanceof Blob) || !file.size)) throw new Error('请选择有效附件')
    files.forEach((file, index) => {
      const uuid = `${state.version.id}-attach-${Date.now()}-${index}`
      state.attachments.push({
        id: uuid,
        uuid,
        versionId: state.version.id,
        attachName: (file as File).name,
        uploadUser: 'mock-user',
        uploadUserName: '模拟用户',
        uploadTime: new Date().toISOString()
      })
      state.files.set(uuid, file as Blob)
    })
    return success(true)
  },
  true
)
for (const operation of ['deleteAttach', 'downloadAttach']) {
  Mock.mock(new RegExp(`/sjtcmbztz/${operation}(?:\\?.*)?$`), 'post', async (options: MockOptions) => {
    try {
      const uuid = getQueryValue(options.url, 'uuid')
      const version = versions.find((row) => uuid.startsWith(`${row.id}-attach-`))
      const state = getState(version?.id)
      const attachment = state.attachments.find((row) => row.uuid === uuid)
      if (!attachment) throw new Error('附件不存在')
      if (operation === 'deleteAttach') {
        assertEditable(state)
        state.attachments = state.attachments.filter((row) => row.uuid !== uuid)
        state.files.delete(uuid)
        return success(true)
      }
      const blob = state.files.get(uuid) || (await workbookBlob(DETAIL_COLUMNS, state.projects))
      return binaryResponse(blob, { fileName: attachment.attachName })
    } catch (error) {
      return fail((error as Error).message)
    }
  })
}
