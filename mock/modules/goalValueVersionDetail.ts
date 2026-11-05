/**
 * 目标值维护：页签、动态列、懒加载树、保存、Excel 导入导出和版本流转。
 * 与版本列表共享状态；明细按版本、年度、组织和页签隔离，刷新页面后重置。
 */
import { Decimal } from 'decimal.js'
import ExcelJS from 'exceljs'
import Mock from 'mockjs'
import { binaryResponse, fail, getQueryValue, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'
import { SP_ORG_ID, versions } from './goalValueVersion'

const tabs = [
  { code: '0', name: '省公司（可控）', totalField: 'mbz' as const },
  { code: '1', name: '子公司', totalField: 'zgsMbz' as const },
  { code: '2', name: '省公司（不可控）', totalField: 'sgsMbzBkk' as const }
]
const units = [
  { code: 'GV-DW-01', name: '南京供电公司' },
  { code: 'GV-DW-02', name: '苏州供电公司' }
]
const categories = [
  { code: '01', name: '设备运维', children: ['输电设备检修', '变电设备检修'] },
  { code: '02', name: '生产服务', children: ['配电运维服务', '营销服务'] }
]
const getTab = (code: string) => {
  const tab = tabs.find((item) => item.code === code)
  if (!tab) throw new Error('目标值页签不存在')
  return tab
}

const getColumns = (isZgs: string, editable = true) => {
  getTab(isZgs)
  const unitNames = isZgs === '1' ? ['综合服务公司', '建设公司', '直属子公司（只读）'] : [...units.map((item) => item.name), '省本部（只读）']
  return ['项目类别', '目标总控值', '待分解', ...unitNames].map((name, index) => ({
    columnKey: ['name', 'mbz', 'ylz', 'GV-DW-01', 'GV-DW-02', 'GV-DW-03'][index],
    columnValue: name,
    dataType: index === 0 ? 'string' : 'number',
    dwDetailId: null,
    eidt: editable && [1, 3, 4].includes(index),
    fixed: index === 0,
    hidden: false,
    needSum: index > 0,
    sumRow: index > 0
  }))
}
const valueKeys = getColumns('0')
  .slice(1)
  .map((column) => column.columnKey)
const editableKeys = getColumns('0')
  .filter((column) => column.eidt)
  .map((column) => column.columnKey)

interface DetailRow {
  id: string
  parentId: string
  code: string
  name: string
  cj: string
  leaf: boolean // 页面约定：true 表示还有子节点，可继续懒加载。
  [key: string]: string | boolean
}

const sum = (rows: DetailRow[], key: string) => rows.reduce((value, row) => value.add(String(row[key])), new Decimal(0)).toFixed(6)
const recalculate = (rows: DetailRow[]) => {
  rows
    .filter((row) => !row.leaf)
    .forEach((row) => {
      row.ylz = new Decimal(String(row.mbz)).sub(String(row['GV-DW-01'])).sub(String(row['GV-DW-02'])).sub(String(row['GV-DW-03'])).toFixed(6)
    })
  // 子级在前、父级在后汇总，保证未展开的分支也计入合计。
  rows
    .filter((row) => row.leaf)
    .reverse()
    .forEach((row) => {
      const children = rows.filter((item) => item.parentId === row.id)
      valueKeys.forEach((key) => (row[key] = sum(children, key)))
    })
}

const createRows = (total: string): DetailRow[] => {
  const node = (code: string, name: string, parentId: string, cj: string, leaf: boolean): DetailRow => ({
    id: `gv-${code}`,
    parentId,
    code,
    name,
    cj,
    leaf,
    ...Object.fromEntries(valueKeys.map((key) => [key, '0.000000']))
  })
  const rows = [node('all', '成本项目合计', '0', '1', true)]
  const portion = new Decimal(total).div(4).toDecimalPlaces(6)
  categories.forEach((category, group) => {
    const parent = node(category.code, category.name, 'gv-all', '2', true)
    rows.push(parent)
    category.children.forEach((name, index) => {
      const row = node(`${category.code}${index + 1}`, name, parent.id, '3', false)
      const amount = group === 1 && index === 1 ? new Decimal(total).sub(portion.mul(3)) : portion
      row.mbz = amount.toFixed(6)
      row['GV-DW-01'] = amount.mul('0.35').toFixed(6)
      row['GV-DW-02'] = amount.mul('0.25').toFixed(6)
      row['GV-DW-03'] = amount.mul('0.15').toFixed(6)
      rows.push(row)
    })
  })
  recalculate(rows)
  return rows
}

const details = new WeakMap<(typeof versions)[number], Map<string, DetailRow[]>>()
const getContext = (options: MockOptions) => {
  const query = (key: string) => getQueryValue(options.url, key)
  const version = versions.find((row) => row.versionId === query('versionId') && row.nd === query('nd'))
  if (!version) throw new Error('该年度下的版本不存在')
  if (query('specialorgid') !== SP_ORG_ID) throw new Error('请选择目标值版本管理演示角色')
  const tab = getTab(query('isZgs'))
  const key = JSON.stringify([version.versionId, version.nd, query('specialorgid'), tab.code])
  if (!details.has(version)) details.set(version, new Map())
  const versionDetails = details.get(version)!
  if (!versionDetails.has(key)) versionDetails.set(key, createRows(version[tab.totalField]))
  return { key, version, tab, rows: versionDetails.get(key)!, versionDetails }
}
type DetailContext = ReturnType<typeof getContext>

const handleDetail =
  (handler: (context: DetailContext, options: MockOptions) => unknown, writable = false) =>
  async (options: MockOptions) => {
    try {
      const context = getContext(options)
      if (writable && !['1', '2'].includes(context.version.status)) return fail('激活或过期版本不允许修改')
      return await handler(context, options)
    } catch (error) {
      return fail((error as Error).message)
    }
  }

// 共用接口仅拦截本模块的字典和演示组织，不影响正式组织的目标值页面。
Mock.mock(/commonCode\/getData\?(?:[^#]*&)?code=MBZ_TAB_TYPE(?:&|$)/, 'get', () => success(tabs.map(({ code, name }) => ({ code, name }))))
Mock.mock(new RegExp(`mbz/getDynamicColumn\\?(?:[^#]*&)?specialorgid=${SP_ORG_ID}(?:&|$)`), 'get', (options: MockOptions) => {
  try {
    return success(getColumns(getQueryValue(options.url, 'isZgs'), getQueryValue(options.url, 'edit') === 'EDIT'))
  } catch (error) {
    return fail((error as Error).message)
  }
})

Mock.mock(
  /\/mbz\/version\/detail\/getData(?:\?.*)?$/,
  'get',
  handleDetail(({ rows }, options) => {
    const parentId = getQueryValue(options.url, 'parentId')
    return success(rows.filter((row) => row.parentId === parentId).map((row) => ({ ...row })))
  })
)

// 先校验整批，再写入；前端传来的待分解必须与总控值减去所有单位金额一致。
const applyEdits = (context: DetailContext, changes: any) => {
  if (!Array.isArray(changes) || changes.length === 0) throw new Error('没有可保存的目标值数据')
  const rows = context.rows.map((row) => ({ ...row }))
  for (const change of changes) {
    const row = rows.find((item) => item.id === change.id && item.code === change.code && !item.leaf)
    if (!row) throw new Error('仅支持修改项目明细行')
    if (!Array.isArray(change.dwValues) || change.dwValues.length === 0) throw new Error('缺少目标值金额')
    for (const value of change.dwValues) {
      if (!editableKeys.includes(value.dwId)) throw new Error('不允许修改只读金额列')
      const amount = String(value.ysje ?? '0').trim() || '0'
      if (!/^-?\d+(?:\.\d{1,6})?$/.test(amount)) throw new Error('金额必须是最多六位小数的有效数字')
      row[value.dwId] = new Decimal(amount).toFixed(6)
    }
    recalculate(rows)
    if (change.dfjz !== undefined && !new Decimal(change.dfjz).eq(String(row.ylz))) throw new Error('待分解金额与单位分解金额不一致')
  }
  context.versionDetails.set(context.key, rows)
  context.version[context.tab.totalField] = String(rows[0].mbz)
  return success(true)
}

Mock.mock(
  /\/mbz\/version\/detail\/save(?:\?.*)?$/,
  'post',
  handleDetail((context, options) => applyEdits(context, parseBody(options)), true)
)

const workbookResponse = async (isZgs: string, rows: DetailRow[], template = false) => {
  const columns = getColumns(isZgs)
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('目标值维护')
  sheet.columns = [
    { key: 'code', header: '项目编码', width: 16 },
    ...columns.map((column) => ({ key: column.columnKey, header: column.columnValue, width: 24 }))
  ]
  sheet.addRows(
    rows
      .filter((row) => !row.leaf)
      .map((row) => ({
        code: row.code,
        name: row.name,
        ...Object.fromEntries(valueKeys.map((key) => [key, template ? null : Number(row[key])]))
      }))
  )
  sheet.getRow(1).font = { bold: true }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  valueKeys.forEach((key) => (sheet.getColumn(key).numFmt = '#,##0.000000'))
  const result = binaryResponse(await workbook.xlsx.writeBuffer(), {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  result.headers['content-disposition'] = `attachment; filename=${template ? 'goal-value-template' : 'goal-value-detail'}.xlsx`
  return result
}

Mock.mock(
  /\/mbz\/version\/detail\/export(?:\?.*)?$/,
  'post',
  handleDetail(({ tab, rows }) => workbookResponse(tab.code, rows))
)
Mock.mock(new RegExp(`mbz/getImportTemplate\\?(?:[^#]*&)?specialorgid=${SP_ORG_ID}(?:&|$)`), 'post', async (options: MockOptions) => {
  try {
    return await workbookResponse(getQueryValue(options.url, 'isZgs'), createRows('0'), true)
  } catch (error) {
    return fail((error as Error).message)
  }
})

Mock.mock(
  /\/mbz\/version\/detail\/import(?:\?.*)?$/,
  'post',
  handleDetail(async (context, options) => {
    const file = options.body instanceof FormData ? options.body.get('file') : null
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx')) throw new Error('演示导入仅支持下载的 .xlsx 模板或导出文件')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())
    const sheet = workbook.worksheets[0]
    const columns = getColumns(context.tab.code)
    const headers = ['项目编码', ...columns.map((column) => column.columnValue)]
    if (!sheet || headers.some((header, index) => sheet.getRow(1).getCell(index + 1).text !== header)) throw new Error('文件表头与当前页签模板不一致')
    const changes: any[] = []
    sheet.eachRow((excelRow, index) => {
      if (index === 1) return
      const row = context.rows.find((item) => item.code === excelRow.getCell(1).text && !item.leaf)
      if (!row) throw new Error(`第 ${index} 行项目编码不存在`)
      const dwValues = columns
        .filter((column) => column.eidt)
        .flatMap((column) => {
          const cell = excelRow.getCell(columns.indexOf(column) + 2)
          return cell.value === null ? [] : [{ dwId: column.columnKey, ysje: cell.text }]
        })
      if (dwValues.length) changes.push({ id: row.id, code: row.code, dwValues })
    })
    return applyEdits(context, changes)
  }, true)
)

// 版本通知的单位和接收人，同时支持版本页的“通知接收人员设置”。
Mock.mock(new RegExp(`process46/getYjdw\\?(?:[^#]*&)?specialorgid=${SP_ORG_ID}(?:&|$)`), 'get', () => success(units.map((unit) => ({ ...unit }))))
Mock.mock(new RegExp(`process46/getEjdw\\?(?:[^#]*&)?specialorgid=${SP_ORG_ID}(?:&|$)`), 'get', (options: MockOptions) => {
  const parent = units.find((unit) => unit.code === getQueryValue(options.url, 'parentId'))
  return success(parent ? [{ code: `${parent.code}-BM`, name: `${parent.name}财务部` }] : [])
})
let receiverSequence = 2
const receivers = units.map((unit, index) => ({
  id: `gv-receiver-${index + 1}`,
  yjdw: unit.code,
  ejdw: `${unit.code}-BM`,
  userId: `gv-user-${index + 1}`,
  username: `演示接收人${index + 1}`
}))
Mock.mock(/\/mbz\/notify\/receiver\/list(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  return success(receivers.filter((row) => row.yjdw === params.yjdw && row.ejdw === params.ejdw).map((row) => ({ ...row })))
})
Mock.mock(/\/mbz\/notify\/receiver\/save(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const rows = parseBody(options)
  if (!Array.isArray(rows) || !rows.length) return fail('没有可保存的接收人')
  if (rows.some((row) => !row.userId || !row.username || !units.some((unit) => unit.code === row.yjdw && row.ejdw === `${unit.code}-BM`)))
    return fail('请填写正确的接收人和单位')
  if (rows.some((row) => row.id && !receivers.some((item) => item.id === row.id))) return fail('接收人记录不存在')
  rows.forEach((row) => {
    const receiver = receivers.find((item) => item.id === row.id)
    if (receiver) Object.assign(receiver, row)
    else receivers.push({ ...row, id: `gv-receiver-${++receiverSequence}` })
  })
  return success(true)
})
Mock.mock(/\/mbz\/notify\/receiver\/remove\/[^/?#]+(?:\?.*)?$/, 'delete', (options: MockOptions) => {
  const id = decodeURIComponent(options.url.split('?')[0].split('/').pop() || '')
  const index = receivers.findIndex((receiver) => receiver.id === id)
  if (index === -1) return fail('接收人记录不存在')
  receivers.splice(index, 1)
  return success(true)
})
Mock.mock(/\/mbz\/version\/notify(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const version = versions.find((row) => row.versionId === params.versionId)
  if (!version) return fail('版本不存在')
  if (!['1', '2'].includes(version.status)) return fail('激活或过期版本不允许通知')
  if (
    !Array.isArray(params.userIdList) ||
    !params.userIdList.length ||
    params.userIdList.some((id: string) => !receivers.some((row) => row.userId === id))
  )
    return fail('请选择有效的待办接收人')
  version.status = '2'
  return success(true)
})
Mock.mock(/\/mbz\/version\/activate(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const version = versions.find((row) => row.versionId === getQueryValue(options.url, 'versionId') && row.nd === getQueryValue(options.url, 'nd'))
  if (!version) return fail('该年度下的版本不存在')
  if (!['1', '2'].includes(version.status)) return fail('仅初始或通知状态的版本可激活')
  versions.filter((row) => row.nd === version.nd && row.status === '3').forEach((row) => (row.status = '4'))
  version.status = '3'
  version.activateTime = new Date().toISOString()
  return success(true)
})
