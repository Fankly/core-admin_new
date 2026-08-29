import ExcelJS from 'exceljs'
import Mock from 'mockjs'
import { binaryResponse, fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const BUSICODE = 'ANNUAL-KEY-TASK'
const BUTTONS = ['ADD', 'EDIT', 'VIEW', 'DELETE', 'IMPORT', 'EXPORT']
const SP_ROLE_ID = `sprole-${BUSICODE}`
const CURRENT_YEAR = String(new Date().getFullYear())

interface MockAnnualKeyTaskRow extends Record<string, string | number | undefined> {
  glbm: string
  id: string
  insUser: string
  instime: string
  nd: string
  updTime: string
  updUser: string
  zyfl: string
  zyflZdrw: string
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const buildRole = () => ({
  id: SP_ROLE_ID,
  name: '年度重点任务管理员',
  code: 'ANNUAL_KEY_TASK_ADMIN',
  role_id: 'role-annual-key-task',
  specialorgid: 'BM-TASK-001',
  specialorgname: '项目管理部',
  specialorgcode: 'BM_XMGL',
  org_id: 'DW001',
  org_name: '国网江苏省电力有限公司',
  namecode: 'mock_annual_key_task_admin',
  busicode: BUSICODE
})

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*annualKeyTask/i, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ outsideMenu: BUSICODE, url })
})

Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [buildRole()])
Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success(clone(BUTTONS)))
Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?[^#]*spRoleId=${SP_ROLE_ID}(?:&|$)`), 'get', () => success(clone(BUTTONS)))

const zyflOptions = ['发展策划', '设备管理', '营销服务', '数字化', '财务资产']
const taskOptions = ['投资计划刚性执行', '项目储备质量提升', '重点工程进度督办', '预算执行偏差治理', '问题整改闭环管理', '年度任务复盘评估']
const glbmOptions = ['项目管理部', '发展策划部', '设备管理部', '营销部', '财务资产部']
const userOptions = ['王强', '李敏', '张伟', '陈静', '赵磊']

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

const createMockRow = (sequence: number, id = `ZDRW-${1000 + sequence}`): MockAnnualKeyTaskRow => {
  const index = sequence - 1
  const month = (index % 9) + 1
  return {
    id,
    nd: CURRENT_YEAR,
    zyfl: zyflOptions[index % zyflOptions.length],
    zyflZdrw: `${taskOptions[index % taskOptions.length]}${pad(Math.floor(index / taskOptions.length) + 1)}`,
    glbm: glbmOptions[index % glbmOptions.length],
    insUser: userOptions[index % userOptions.length],
    instime: `2026-${pad(month)}-${pad((index % 20) + 1)} 09:30:00`,
    updUser: userOptions[(index + 2) % userOptions.length],
    updTime: `2026-${pad(Math.min(month + 1, 12))}-${pad((index % 20) + 1)} 15:20:00`
  }
}

let tableData: MockAnnualKeyTaskRow[] = Array.from({ length: 32 }, (_, index) => createMockRow(index + 1))
let idSeed = 1000 + tableData.length

const filterRows = (params: Record<string, any>) => {
  const nd = String(params.nd || '')
    .trim()
    .toLowerCase()
  const zyfl = String(params.zyfl || '')
    .trim()
    .toLowerCase()
  const zyflZdrw = String(params.zyflZdrw || '')
    .trim()
    .toLowerCase()
  const zdrwbms = Array.isArray(params.zdrwbms) ? params.zdrwbms.map((item: unknown) => String(item).trim()).filter(Boolean) : []

  return tableData.filter((item) => {
    const matchesNd = !nd || String(item.nd).toLowerCase().includes(nd)
    const matchesZyfl = !zyfl || String(item.zyfl).toLowerCase().includes(zyfl)
    const matchesZyflZdrw = !zyflZdrw || String(item.zyflZdrw).toLowerCase().includes(zyflZdrw)
    const matchesCodes = !zdrwbms.length || zdrwbms.includes(item.id)
    return matchesNd && matchesZyfl && matchesZyflZdrw && matchesCodes
  })
}

Mock.mock(/\/ndzdrw\/getPage(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const rows = filterRows(body)
  return success(pageResult(clone(rows), body.page || 1, body.limit || 20))
})

Mock.mock(/\/protypeConfig\/linkNdzdrw(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const getArray = (key: string) => (Array.isArray(body[key]) ? body[key].map((item: unknown) => String(item).trim()).filter(Boolean) : [])
  const ids = getArray('ids')
  const ndzdrwIds = getArray('ndzdrwIds')
  const nd = String(body.nd || '').trim()

  if (!ids.length || !nd || !ndzdrwIds.length) {
    return fail('关联年度重点任务参数不完整')
  }
  return success({ ids, nd, ndzdrwIds }, '关联年度重点任务成功')
})

Mock.mock(/\/ndzdrw\/save(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const nd = String(body.nd || '').trim()
  const zyfl = String(body.zyfl || '').trim()
  const zyflZdrw = String(body.zyflZdrw || '').trim()
  const glbm = String(body.glbm || '').trim()

  if (!nd || !zyfl || !zyflZdrw || !glbm) {
    return fail('年度、专业分类、专业分类重点任务和管理部门不能为空')
  }

  const id = body.id === null || body.id === undefined ? '' : String(body.id)
  const rowIndex = tableData.findIndex((item) => id && item.id === id)
  const nextId = rowIndex >= 0 ? tableData[rowIndex].id : `ZDRW-${++idSeed}`
  const defaults = rowIndex >= 0 ? tableData[rowIndex] : createMockRow(idSeed - 999, nextId)
  const now = '2026-08-19 16:30:00'
  const next: MockAnnualKeyTaskRow = {
    ...defaults,
    ...body,
    id: nextId,
    nd,
    zyfl,
    zyflZdrw,
    glbm,
    insUser: String(defaults.insUser || '当前用户'),
    instime: String(defaults.instime || now),
    updUser: '当前用户',
    updTime: now
  }

  if (rowIndex >= 0) tableData.splice(rowIndex, 1, next)
  else tableData.unshift(next)
  return success(clone(next), rowIndex >= 0 ? '保存成功' : '新增成功')
})

Mock.mock(/\/ndzdrw\/delete(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : []
  if (!ids.length) return fail('请选择要删除的年度重点任务')

  const before = tableData.length
  tableData = tableData.filter((item) => !ids.includes(item.id))
  return tableData.length < before ? success(true, '删除成功') : fail('未找到可删除的年度重点任务')
})

Mock.mock(/\/ndzdrw\/importData(?:\?[^#]*)?$/, 'post', () => {
  const id = `ZDRW-${++idSeed}`
  const row = createMockRow(idSeed - 999, id)
  row.zyflZdrw = `导入年度重点任务${pad(idSeed - 1000, 3)}`
  row.insUser = '导入用户'
  row.updUser = '导入用户'
  tableData.unshift(row)
  return success({ imported: 1, failed: 0 }, '导入成功')
})

Mock.mock(/\/ndzdrw\/export(?:\?[^#]*)?$/, 'post', async (options: MockOptions) => {
  const rows = filterRows(parseBody(options))
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('年度重点任务')
  worksheet.columns = [
    { header: '年度', key: 'nd', width: 10 },
    { header: '重点任务编码', key: 'id', width: 18 },
    { header: '专业分类', key: 'zyfl', width: 18 },
    { header: '管理部门', key: 'glbm', width: 18 },
    { header: '专业分类重点任务', key: 'zyflZdrw', width: 32 }
  ]
  worksheet.addRows(clone(rows))
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '年度重点任务管理.xlsx'
  })
})
