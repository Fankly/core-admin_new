/** 预算事项基础数据页面 mock（列表、字典和财务审核依据附件）。 */
import ExcelJS from 'exceljs'
import Mock from 'mockjs'
import { binaryResponse, fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const BUSICODE = 'MATTER-YSSX-ZSJ'
const BUTTONS = ['ADD', 'EDIT', 'DELETE', 'EXPORT']

const buildRole = () => ({
  id: `sprole-${BUSICODE}`,
  name: '预算事项管理员',
  code: 'SCWYSZZ',
  role_id: 'role-matter-basic',
  specialorgid: 'bm-001',
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  org_id: 'DW001',
  org_name: '国网江苏省电力有限公司',
  namecode: 'mock_matter_basic_admin',
  busicode: BUSICODE
})

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*matter\/yssxzsj/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ outsideMenu: BUSICODE, url })
})
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [buildRole()])
Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success(clone(BUTTONS)))

const GKBM_LIST = [
  { id: 'gkbm-001', code: 'gkbm-001', name: '财务部' },
  { id: 'gkbm-002', code: 'gkbm-002', name: '发展策划部' },
  { id: 'gkbm-003', code: 'gkbm-003', name: '设备管理部' }
]

const PROJECT_TYPES = [
  {
    id: 'PT01',
    middleId: 'PT01',
    name: '基建项目',
    children: [
      { id: 'PT0101', middleId: 'PT0101', name: '电网基建' },
      { id: 'PT0102', middleId: 'PT0102', name: '小型基建' }
    ]
  },
  {
    id: 'PT02',
    middleId: 'PT02',
    name: '技改项目',
    children: [
      { id: 'PT0201', middleId: 'PT0201', name: '配网技改' },
      { id: 'PT0202', middleId: 'PT0202', name: '变电技改' }
    ]
  },
  { id: 'PT03', middleId: 'PT03', name: '营销项目', children: [] }
]

const YJFL_LIST = [
  { id: 'yj-001', code: 'YJ01', name: '项目建设' },
  { id: 'yj-002', code: 'YJ02', name: '生产运维' },
  { id: 'yj-003', code: 'YJ03', name: '科技创新' }
]
const EJFL_MAP: Record<string, Array<{ id: string; code: string; name: string }>> = {
  'yj-001': [
    { id: 'ej-001', code: 'EJ01', name: '电网建设' },
    { id: 'ej-002', code: 'EJ02', name: '配套工程' }
  ],
  'yj-002': [
    { id: 'ej-003', code: 'EJ03', name: '设备运检' },
    { id: 'ej-004', code: 'EJ04', name: '安全生产' }
  ],
  'yj-003': [{ id: 'ej-005', code: 'EJ05', name: '数字化建设' }]
}
const SJFL_MAP: Record<string, Array<{ id: string; code: string; name: string }>> = {
  'ej-001': [{ id: 'sj-001', code: 'SJ01', name: '输电线路建设' }],
  'ej-002': [{ id: 'sj-002', code: 'SJ02', name: '变电站建设' }],
  'ej-003': [{ id: 'sj-003', code: 'SJ03', name: '日常检修' }],
  'ej-004': [{ id: 'sj-004', code: 'SJ04', name: '安全设施' }],
  'ej-005': [{ id: 'sj-005', code: 'SJ05', name: '信息系统建设' }]
}

const createRow = (sequence: number, overrides: Record<string, any> = {}) => {
  const yjfl = YJFL_LIST[(sequence - 1) % YJFL_LIST.length]
  const ejfl = (EJFL_MAP[yjfl.id] || [])[0]
  const sjfl = ejfl ? (SJFL_MAP[ejfl.id] || [])[0] : undefined
  const projectType = PROJECT_TYPES[(sequence - 1) % PROJECT_TYPES.length]
  return {
    id: `mock-matter-${String(sequence).padStart(3, '0')}`,
    zyssxbm: `YSSX-2026-${String(sequence).padStart(4, '0')}`,
    zyssxmc: `${projectType.name}预算事项示例${sequence}`,
    nd: '2026',
    zgkbmId: GKBM_LIST[(sequence - 1) % GKBM_LIST.length].code,
    zgkbmName: GKBM_LIST[(sequence - 1) % GKBM_LIST.length].name,
    xmlx: projectType.id,
    xmlxName: projectType.name,
    yjfl: yjfl.code,
    yjflName: yjfl.name,
    ejfl: ejfl?.code || '',
    ejflName: ejfl?.name || '',
    sjfl: sjfl?.code || '',
    sjflName: sjfl?.name || '',
    yslxctId: `ct-${String(sequence).padStart(3, '0')}`,
    remark: '开发环境预算事项示例数据',
    status: '1',
    isDispatch: sequence % 2 ? '1' : '0',
    sfaqsc: '1',
    aqscfylx: '',
    zyfjftrtjfw: '1',
    ysly: '1',
    sfxysgksp: '1',
    cwpsyd: '按年度预算安排执行',
    jhlx: '1',
    gkcsId: 'gkcs-001',
    createTime: '2026-01-15 10:00:00',
    ...overrides
  }
}

let tableData = Array.from({ length: 12 }, (_, index) => createRow(index + 1))
let idSeed = tableData.length

const filterRows = (params: Record<string, any>) => {
  const text = (value: any) =>
    String(value || '')
      .trim()
      .toLowerCase()
  const code = text(params.zyssxbm)
  const name = text(params.zyssxmc)
  const sjfls = Array.isArray(params.sjfls) ? params.sjfls.map(String) : []
  const xmlxs = Array.isArray(params.xmlxs) ? params.xmlxs.map(String) : []
  return tableData.filter((row) => {
    return (
      (!code || row.zyssxbm.toLowerCase().includes(code)) &&
      (!name || row.zyssxmc.toLowerCase().includes(name)) &&
      (!params.nd || String(row.nd) === String(params.nd)) &&
      (!params.zgkbmId || row.zgkbmId === params.zgkbmId) &&
      (!params.yjfl || row.yjfl === params.yjfl) &&
      (!params.ejfl || row.ejfl === params.ejfl) &&
      (!sjfls.length || sjfls.includes(row.sjfl)) &&
      (!xmlxs.length || xmlxs.includes(row.xmlx))
    )
  })
}

Mock.mock(/yssxBasic\/getPage(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(pageResult(clone(filterRows(body)), body.page, body.limit))
})

Mock.mock(/yssxBasic\/save(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const required = ['zyssxbm', 'zyssxmc', 'nd', 'zgkbmId', 'xmlx']
  if (required.some((key) => !String(body[key] || '').trim())) return fail('请完整填写预算事项必填信息')
  const existingIndex = body.id ? tableData.findIndex((item) => item.id === String(body.id)) : -1
  const existing = existingIndex >= 0 ? tableData[existingIndex] : undefined
  const next = createRow(existingIndex >= 0 ? existingIndex + 1 : ++idSeed, {
    ...existing,
    ...body,
    id: existing?.id || `mock-matter-${String(idSeed).padStart(3, '0')}`,
    zgkbmName: GKBM_LIST.find((item) => item.code === body.zgkbmId)?.name || body.zgkbmName || '',
    xmlxName: PROJECT_TYPES.flatMap((item) => [item, ...(item.children || [])]).find((item) => item.id === body.xmlx)?.name || body.xmlxName || ''
  })
  if (existingIndex >= 0) tableData.splice(existingIndex, 1, next)
  else tableData.unshift(next)
  return success(clone(next), existing ? '修改成功' : '新增成功')
})

Mock.mock(/yssxBasic\/delete(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : []
  if (!ids.length) return fail('请选择要删除的预算事项')
  const before = tableData.length
  tableData = tableData.filter((item) => !ids.includes(item.id))
  return tableData.length === before ? fail('未找到可删除的预算事项') : success(true, '删除成功')
})

Mock.mock(/yssxBasic\/getById(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const row = tableData.find((item) => item.id === String(body.yssxId || body.id || ''))
  return row ? success(clone(row)) : fail('未找到预算事项')
})

Mock.mock(/yssxBasic\/export(?:\?.*)?$/, 'post', async (options: MockOptions) => {
  const rows = filterRows(parseBody(options))
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('预算事项基础数据')
  worksheet.columns = [
    { header: '预算事项编码', key: 'zyssxbm', width: 22 },
    { header: '预算事项名称', key: 'zyssxmc', width: 30 },
    { header: '年度', key: 'nd', width: 10 },
    { header: '省归口部门', key: 'zgkbmName', width: 18 },
    { header: '项目类型', key: 'xmlxName', width: 18 },
    { header: '一级分类', key: 'yjflName', width: 18 },
    { header: '二级分类', key: 'ejflName', width: 18 },
    { header: '三级分类', key: 'sjflName', width: 18 },
    { header: '状态', key: 'status', width: 10 }
  ]
  worksheet.addRows(clone(rows))
  worksheet.getRow(1).font = { bold: true }
  const result = binaryResponse(await workbook.xlsx.writeBuffer(), {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '预算事项基础数据.xlsx'
  })
  return result
})

// 页面和编辑弹窗使用的级联字典。
Mock.mock(/protypeTree\/getSubProtypeTree(?:\?.*)?$/, 'get', () => success(clone(PROJECT_TYPES)))
Mock.mock(/protypeTree\/getProtypeTreeByGkbm(?:\?.*)?$/, 'get', () => success(clone(PROJECT_TYPES)))
Mock.mock(/commonCode\/getGkbmInProvince(?:\?.*)?$/, 'post', () => success(clone(GKBM_LIST)))
Mock.mock(/commonCode\/getGkcsByGkbm(?:\?.*)?$/, 'get', () =>
  success([
    { code: 'gkcs-001', name: '预算管理处' },
    { code: 'gkcs-002', name: '财务资产处' }
  ])
)
Mock.mock(/process40\/getRootComCode(?:\?.*)?$/, 'post', () => success(clone(YJFL_LIST)))
Mock.mock(/process40\/getComCodeByParent(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(clone(EJFL_MAP[String(body.parentId)] || SJFL_MAP[String(body.parentId)] || []))
})
Mock.mock(/yssxBasic\/getYESJFL(?:\?.*)?$/, 'get', (options: MockOptions) => {
  const code = getQueryValue(options.url, 'searchDataCode')
  const parent = getQueryValue(options.url, 'parentCode')
  if (code === 'YJFL') return success(clone(YJFL_LIST))
  if (code === 'EJFL') return success(clone(EJFL_MAP[parent] || []))
  return success(clone(SJFL_MAP[parent] || []))
})
Mock.mock(/processYssxctgl\/getList(?:\?.*)?$/, 'get', () =>
  success([
    { id: 'ct-001', ctmc: '电网建设项目' },
    { id: 'ct-002', ctmc: '生产运维项目' },
    { id: 'ct-003', ctmc: '数字化建设项目' }
  ])
)
Mock.mock(/process40\/getComCodeByCode(?:\?.*)?$/, 'post', () =>
  success({
    DDXTSJFLDZGX: [{ code: 'SJ01,1', name: '输电线路建设' }],
    AQSCFYLX_COM: [{ code: 'AQ01', name: '安全生产费用' }],
    XMLB_YSLY: [
      { code: '1', name: '财政资金' },
      { code: '2', name: '企业自筹' }
    ],
    XMLB_JHLX: [
      { code: '1', name: '年度计划' },
      { code: '2', name: '专项计划' }
    ]
  })
)
Mock.mock(/commonCode\/pageCommonCode(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const keyword = String(body.name || body.code || '').toLowerCase()
  const list = tableData.map((item) => ({ code: item.zyssxbm, name: item.zyssxmc }))
  const filtered = keyword ? list.filter((item) => item.code.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword)) : list
  return success(pageResult(filtered, body.page || body.current, body.limit || body.size))
})

interface MatterAttachment {
  id: string
  uuid: string
  fjmc: string
  filesize: string
  instime: string
}

const attachmentMap: Record<string, MatterAttachment[]> = {
  'mock-matter-001': [
    {
      id: 'mock-attachment-001',
      uuid: 'mock-attachment-uuid-001',
      fjmc: '财务审核依据示例.pdf',
      filesize: '1.24MB',
      instime: '2026-01-15 10:20:00'
    }
  ]
}

Mock.mock(/yssxBasic\/getPsydAndfjByYssxId(\?.*)?$/, 'get', (options: MockOptions) => {
  const yssxId = getQueryValue(options.url, 'yssxId')
  return success({ attachments: clone(attachmentMap[yssxId] || []) })
})

Mock.mock(/yssxBasic\/uploadAttach(\?.*)?$/, 'post', (options: MockOptions) => {
  const yssxIds = getQueryValue(options.url, 'yssxIds').split(',').filter(Boolean)
  const fileNames = getQueryValue(options.url, 'fileNames').split(',').filter(Boolean)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  yssxIds.forEach((yssxId) => {
    const rows = attachmentMap[yssxId] || (attachmentMap[yssxId] = [])
    fileNames.forEach((fileName, index) => {
      rows.push({
        id: `mock-attachment-${Date.now()}-${index}`,
        uuid: `mock-attachment-uuid-${Date.now()}-${index}`,
        fjmc: fileName,
        filesize: '-',
        instime: now
      })
    })
  })

  return success(true, '附件上传成功')
})

Mock.mock(/yssxBasic\/deleteAttach(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const yssxIds: string[] = Array.isArray(body.ids) ? body.ids.map(String) : []
  const uuid = String(body.uuid || '')

  yssxIds.forEach((yssxId) => {
    const rows = attachmentMap[yssxId]
    if (!rows) return
    attachmentMap[yssxId] = rows.filter((row) => row.uuid !== uuid)
  })

  return success(true, '附件删除成功')
})
