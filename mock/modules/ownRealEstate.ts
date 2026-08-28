import ExcelJS from 'exceljs'
import Mock from 'mockjs'
import { binaryResponse, fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const BUSICODE = 'OWN-REAL-ESTATE'
const BUTTONS = ['ADD', 'EDIT', 'DELETE', 'IMPORT', 'EXPORT']
const SP_ROLE_ID = `sprole-${BUSICODE}`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const buildRole = () => ({
  id: SP_ROLE_ID,
  name: '房产台账管理员',
  code: 'OWN_REAL_ESTATE_ADMIN',
  role_id: 'role-own-real-estate',
  specialorgid: 'BM-OWN-001',
  specialorgname: '实物资产管理部',
  specialorgcode: 'BM_SWZC',
  org_id: 'DW001',
  org_name: '国网江苏省电力有限公司',
  namecode: 'mock_own_real_estate_admin',
  busicode: BUSICODE
})

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*ownRealEstate/i, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ outsideMenu: BUSICODE, url })
})

Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [buildRole()])

const buttonPermissionHandler = () => success(clone(BUTTONS))

// 动态路由可能已缓存真实 outsideMenu，因此除 menuCode 外再按本页角色收窄。
Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', buttonPermissionHandler)
Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?[^#]*spRoleId=${SP_ROLE_ID}(?:&|$)`), 'get', buttonPermissionHandler)

interface MockRealEstateRow extends Record<string, string | number | null | undefined> {
  id: string
  xmId: string
  fcbh: string
  fcmc: string
}

const SITE_OPTIONS = [
  {
    city: '南京市',
    county: '鼓楼区',
    street: '中央门街道',
    location: '中山北路251号',
    lal: '118.7721,32.0864',
    cqdw: '国网南京供电公司',
    station: '南京供电公司本部'
  },
  {
    city: '苏州市',
    county: '姑苏区',
    street: '平江街道',
    location: '干将东路88号',
    lal: '120.6352,31.3117',
    cqdw: '国网苏州供电公司',
    station: '苏州供电公司本部'
  },
  {
    city: '无锡市',
    county: '梁溪区',
    street: '广益街道',
    location: '广瑞路12号',
    lal: '120.3196,31.6001',
    cqdw: '国网无锡供电公司',
    station: '无锡供电公司本部'
  },
  {
    city: '常州市',
    county: '天宁区',
    street: '青龙街道',
    location: '竹林北路18号',
    lal: '119.9824,31.8128',
    cqdw: '国网常州供电公司',
    station: '常州供电公司本部'
  },
  {
    city: '扬州市',
    county: '邗江区',
    street: '新盛街道',
    location: '文昌西路66号',
    lal: '119.3771,32.3912',
    cqdw: '国网扬州供电公司',
    station: '扬州供电公司本部'
  },
  {
    city: '南通市',
    county: '崇川区',
    street: '钟秀街道',
    location: '工农路218号',
    lal: '120.8944,31.9802',
    cqdw: '国网南通供电公司',
    station: '南通供电公司本部'
  },
  {
    city: '徐州市',
    county: '云龙区',
    street: '大龙湖街道',
    location: '昆仑大道9号',
    lal: '117.2841,34.2044',
    cqdw: '国网徐州供电公司',
    station: '徐州供电公司本部'
  },
  {
    city: '盐城市',
    county: '亭湖区',
    street: '毓龙街道',
    location: '建军中路52号',
    lal: '120.1635,33.3477',
    cqdw: '国网盐城供电公司',
    station: '盐城供电公司本部'
  }
]

const ESTATE_OPTIONS = [
  { name: '生产调度综合楼', category: '房屋', subCategory: '办公用房', type: '生产办公', purpose: '生产经营' },
  { name: '变电运检综合楼', category: '房屋', subCategory: '生产用房', type: '运检用房', purpose: '生产经营' },
  { name: '物资周转仓库', category: '房屋', subCategory: '仓储用房', type: '仓库', purpose: '仓储' },
  { name: '职工培训中心', category: '房屋', subCategory: '教育用房', type: '培训中心', purpose: '教育培训' },
  { name: '供电服务中心', category: '房屋', subCategory: '营业用房', type: '营业厅', purpose: '客户服务' }
]

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

const createMockRow = (sequence: number, id = `RE-${1000 + sequence}`): MockRealEstateRow => {
  const index = sequence - 1
  const site = SITE_OPTIONS[index % SITE_OPTIONS.length]
  const estate = ESTATE_OPTIONS[index % ESTATE_OPTIONS.length]
  const certified = index % 5 !== 4
  const floorArea = 2800 + (index % 9) * 735
  const selfUsedArea = Math.round(floorArea * (0.62 + (index % 3) * 0.06))
  const rentedArea = index % 4 === 0 ? Math.round(floorArea * 0.12) : 0
  const occupiedArea = index % 7 === 0 ? Math.round(floorArea * 0.03) : 0
  const idleArea = Math.max(0, floorArea - selfUsedArea - rentedArea - occupiedArea)
  const originalValue = floorArea * (4200 + (index % 6) * 380)
  const depreciation = Math.round(originalValue * (0.18 + (index % 5) * 0.05))
  const year = 2008 + (index % 16)
  const month = (index % 12) + 1
  const totalFloors = 4 + (index % 9)
  const undergroundFloors = index % 3 === 0 ? 1 : 0

  return {
    id,
    xmId: `XM-${id}`,
    nd: '2026',
    searchCode: `SC-${pad(sequence, 4)}`,
    shxx: '已审核',
    uuid: `uuid-own-real-estate-${pad(sequence, 4)}`,
    dataId: `DATA-${pad(sequence, 5)}`,
    qkjzybm: `QKJ-ZYFC-${pad(sequence, 6)}`,
    swid: `SW-${pad(sequence, 6)}`,
    cqdw: site.cqdw,
    sstdbh: `TD-${pad((sequence % 18) + 1, 4)}`,
    sstd: `${site.city}${site.county}生产经营用地`,
    fcbh: `ZYFC-2026-${pad(sequence, 4)}`,
    fcmc: `${site.city.replace('市', '')}${estate.name}`,
    province: '江苏省',
    city: site.city,
    county: site.county,
    street: site.street,
    location: site.location,
    lal: site.lal,
    ly: index % 3 === 0 ? '投资建设' : index % 3 === 1 ? '资产划转' : '历史形成',
    tzly: index % 2 === 0 ? '中央预算内投资' : '企业自筹',
    zjly: index % 2 === 0 ? '资本金' : '自有资金',
    fcqdsj: `${year}-${pad(month)}-${pad((index % 25) + 1)}`,
    fcdl: estate.category,
    fcxl: estate.subCategory,
    fclx: estate.type,
    jzmj: String(floorArea),
    zytdmj: String(Math.round(floorArea * 1.42)),
    rjl: (1.1 + (index % 8) * 0.12).toFixed(2),
    dscs: String(totalFloors),
    dxcs: String(undergroundFloors),
    zjzcs: String(totalFloors + undergroundFloors),
    jcnf: String(year - 1),
    wgtp: `${id}-appearance.jpg`,
    wgtpUuid: `${id}-appearance-uuid`,
    sfyz: certified ? '1' : '0',
    bdcqzh: certified ? `苏（${year}）${site.city.replace('市', '')}不动产权第${pad(sequence, 6)}号` : '',
    fczzrmc: certified ? site.cqdw : '',
    qztp: certified ? `${id}-certificate.jpg` : '',
    qztpUuid: certified ? `${id}-certificate-uuid` : '',
    zdt: certified ? `${id}-parcel-map.pdf` : '',
    wzyy: certified ? '' : '历史形成资产，权证补办资料正在整理',
    ysymj: String(selfUsedArea + rentedArea + occupiedArea),
    zymj: String(selfUsedArea),
    czmj: String(rentedArea),
    bzymj: String(occupiedArea),
    xzmj: String(idleArea),
    ljnzj: rentedArea ? (rentedArea * 0.0065).toFixed(2) : '0',
    zckp: `${id}-asset-card.pdf`,
    zcyz: originalValue.toFixed(2),
    ljzj: depreciation.toFixed(2),
    zcjz: (originalValue - depreciation).toFixed(2),
    zczt: index % 8 === 7 ? '待处置' : '在用',
    zcyt: estate.purpose,
    sybgdw: site.cqdw,
    sybgbz: index % 2 === 0 ? '综合管理班' : '设备运维班',
    sybgr: ['王强', '李敏', '张伟', '陈静'][index % 4],
    gkglbm: '实物资产管理部',
    ssxzsbbm: `XZSB-${pad(sequence, 5)}`,
    ssxzmc: site.station,
    xmbmWbs: `WBS-2026-${pad(sequence, 5)}`,
    fssbZcbm: `FSSB-${pad(sequence, 5)}`,
    remart: index % 6 === 0 ? '已完成年度盘点，账实相符' : ''
  }
}

let tableData: MockRealEstateRow[] = Array.from({ length: 36 }, (_, index) => createMockRow(index + 1))
tableData[0].xmId = 'mock-project-001'
tableData[0].fcbh = 'ZYFC-MOCK-001'
tableData[0].fcmc = '集中修改项目自有房产样例'
tableData[0].remart = '集中修改页面 Mock 联调数据'
const detailProjectRow = createMockRow(37, 'RE-XQ-002')
detailProjectRow.xmId = '365532842'
detailProjectRow.fcbh = 'ZYFC-XM-365532842'
detailProjectRow.fcmc = '主网设备检修项目自有房产'
detailProjectRow.remart = '项目详情页 Mock 联调数据'
tableData.push(detailProjectRow)
let idSeed = 1000 + tableData.length

const filterRows = (params: Record<string, any>) => {
  const fcbh = String(params.fcbh || '')
    .trim()
    .toLowerCase()
  const fcmc = String(params.fcmc || '')
    .trim()
    .toLowerCase()
  return tableData.filter((item) => {
    const matchesCode = !fcbh || String(item.fcbh).toLowerCase().includes(fcbh)
    const matchesName = !fcmc || String(item.fcmc).toLowerCase().includes(fcmc)
    return matchesCode && matchesName
  })
}

Mock.mock(/\/zyfc\/page(?:\?[^#]*)?$/, 'get', (options: MockOptions) => {
  const page = getQueryValue(options.url, 'page') || 1
  const limit = getQueryValue(options.url, 'limit') || 20
  const rows = filterRows({
    fcbh: getQueryValue(options.url, 'fcbh'),
    fcmc: getQueryValue(options.url, 'fcmc')
  })
  return success(pageResult(clone(rows), page, limit))
})

Mock.mock(/\/zyfc\/getByXmId(?:\?[^#]*)?$/, 'get', (options: MockOptions) => {
  const xmId = getQueryValue(options.url, 'xmId')
  if (!xmId) return fail('缺少项目ID')
  const row = tableData.find((item) => item.xmId === xmId)
  return row ? success(clone(row)) : fail('未找到自有房产记录')
})

Mock.mock(/\/zyfc\/save(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const fcbh = String(body.fcbh || '').trim()
  const fcmc = String(body.fcmc || '').trim()
  if (!fcbh || !fcmc) return fail('房产编号和房产名称不能为空')

  const id = body.id === null || body.id === undefined ? '' : String(body.id)
  const xmId = body.xmId === null || body.xmId === undefined ? '' : String(body.xmId)
  const rowIndex = tableData.findIndex((item) => (id && item.id === id) || (xmId && item.xmId === xmId))
  const duplicated = tableData.some((item, index) => index !== rowIndex && item.fcbh === fcbh)
  if (duplicated) return fail(`房产编号 ${fcbh} 已存在`)

  const nextId = rowIndex >= 0 ? tableData[rowIndex].id : `RE-${++idSeed}`
  const defaults = rowIndex >= 0 ? tableData[rowIndex] : createMockRow(idSeed - 999, nextId)
  const next: MockRealEstateRow = {
    ...defaults,
    ...body,
    id: nextId,
    xmId: rowIndex >= 0 ? tableData[rowIndex].xmId : `XM-${nextId}`,
    fcbh,
    fcmc
  }

  if (rowIndex >= 0) tableData.splice(rowIndex, 1, next)
  else tableData.unshift(next)
  return success(clone(next), rowIndex >= 0 ? '保存成功' : '新增成功')
})

Mock.mock(/\/zyfc\/delete(?:\?[^#]*)?$/, 'delete', (options: MockOptions) => {
  const body = parseBody(options)
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : []
  if (!ids.length) return fail('请选择要删除的房产记录')

  const before = tableData.length
  tableData = tableData.filter((item) => !ids.includes(item.id))
  return tableData.length < before ? success(true, '删除成功') : fail('未找到可删除的房产记录')
})

Mock.mock(/\/zyfc\/import(?:\?[^#]*)?$/, 'post', () => {
  const id = `RE-${++idSeed}`
  const row = createMockRow(idSeed - 999, id)
  row.fcbh = `ZYFC-IMP-${pad(idSeed - 1000, 4)}`
  row.fcmc = `批量导入房产样例${pad(idSeed - 1000, 2)}`
  row.ly = '批量导入'
  tableData.unshift(row)
  return success({ imported: 1, failed: 0 }, '导入成功')
})

Mock.mock(/\/zyfc\/export(?:\?[^#]*)?$/, 'post', async (options: MockOptions) => {
  const rows = filterRows(parseBody(options))
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('自有房产')
  worksheet.columns = [
    { header: '房产编号', key: 'fcbh', width: 20 },
    { header: '房产名称', key: 'fcmc', width: 24 },
    { header: '产权单位', key: 'cqdw', width: 28 },
    { header: '所在城市', key: 'city', width: 14 },
    { header: '具体位置', key: 'location', width: 28 },
    { header: '建筑面积（平方米）', key: 'jzmj', width: 20 },
    { header: '资产原值', key: 'zcyz', width: 18 },
    { header: '资产净值', key: 'zcjz', width: 18 },
    { header: '资产状态', key: 'zczt', width: 14 }
  ]
  worksheet.addRows(clone(rows))
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  const result = binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  result.headers['content-disposition'] = 'attachment; filename=own-real-estate.xlsx'
  return result
})
