import Mock from 'mockjs'
import { fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

// 开发环境演示数据。节点 ID 固定，便于复现“展开 → 查询 → 再次展开”。
const BUSICODE = 'MOCK-XMYSYLB'
const PROJECT_TYPES = [
  { id: 'YSYL-01', name: '电网基建', protypeId: 'PT01' },
  { id: 'YSYL-02', name: '生产技改', protypeId: 'PT02' }
]
const PACKAGES = [
  { id: 'XMB-001', code: 'XMB-JJ', name: '电网基建项目包', ysylId: 'YSYL-01' },
  { id: 'XMB-002', code: 'XMB-JG', name: '生产技改项目包', ysylId: 'YSYL-02' }
]
// 单位编码与 budgetChanges.ts 已注册的公共单位接口保持一致。
const UNITS = [
  { code: 'DW001', name: '国网江苏省电力有限公司', children: ['发展策划部', '设备管理部'] },
  { code: 'DW002', name: '国网南京供电公司', children: ['项目管理中心', '运维检修部'] },
  { code: 'DW003', name: '国网苏州供电公司', children: ['建设管理部', '数字化工作部'] }
]

interface FixtureRow extends Record<string, any> {
  id: string
  parentId: string
  nodeType: string
  name: string
  ancestors: string[]
}

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*xmysylb/i, 'get', (options: MockOptions) =>
  success({ outsideMenu: BUSICODE, url: getQueryValue(options.url, 'url') })
)
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [
  {
    id: 'sprole-xmysylb',
    name: '项目预算执行查询（Mock）',
    code: 'XMYSYLB_QUERY',
    role_id: 'role-xmysylb',
    specialorgid: 'BM-XMYSYLB',
    org_id: 'DW001',
    org_name: UNITS[0].name
  }
])
Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success(['EXPAND', 'EXPORT']))

const buildRows = (params: Record<string, any>): FixtureRow[] => {
  const rows: FixtureRow[] = []
  const context = {
    nd: String(params.nd || new Date().getFullYear()),
    ydStart: String(params.ydStart || '1'),
    ydEnd: String(params.ydEnd || new Date().getMonth() + 1)
  }
  const add = (id: string, name: string, nodeType: string, parent?: FixtureRow, extra: Record<string, any> = {}) => {
    const row: FixtureRow = {
      ...context,
      ...(parent || {}),
      ...extra,
      id,
      name,
      nodeType,
      parentId: parent?.id || '0',
      leaf: nodeType === '6' ? '1' : '0',
      ancestors: parent ? [...parent.ancestors, parent.id] : []
    }
    rows.push(row)
    return row
  }
  let sequence = 0
  PROJECT_TYPES.forEach((type) => {
    const typeRow = add(type.id, type.name, '2', undefined, { ysylId: type.id, protype: type.protypeId, xmlx: type.id })
    const packages = [...PACKAGES.filter((item) => item.ysylId === type.id), { id: '', code: '', name: '未归集项目包', ysylId: type.id }]
    packages.forEach((pkg) => {
      // 未归集分支完全不设置 xmbId，覆盖“没有就不传”的场景。
      const packageRow = add(`${type.id}/${pkg.id || 'NO-PACKAGE'}`, pkg.name, '3', typeRow, {
        xmbmc: pkg.code,
        ...(pkg.id ? { xmbId: pkg.id } : {})
      })
      UNITS.forEach((unit) => {
        const unitRow = add(`${packageRow.id}/${unit.code}`, unit.name, '4', packageRow, { yjdw: unit.code })
        unit.children.forEach((name, index) => {
          const ejdw = `${unit.code}-0${index + 1}`
          const childRow = add(`${unitRow.id}/${ejdw}`, name, '5', unitRow, { ejdw })
          for (let i = 1; i <= 6; i += 1) {
            sequence += 1
            const xmbm = `MOCK-XM-${String(sequence).padStart(4, '0')}`
            const ysje = 100 + sequence * 10
            add(`${childRow.id}/${xmbm}`, `${type.name}示例项目${i}`, '6', childRow, {
              xmbm,
              subName: xmbm,
              YSJE: ysje,
              ZXJE: ysje * 0.6,
              SYJE: ysje * 0.4,
              // 穿透明细固定表头字段（对齐 xmysylb.vue 的 drilldownColumns）
              xmmc: `${type.name}示例项目${i}`,
              gwxmbm: `GW${String(sequence).padStart(8, '0')}`,
              proType: type.name,
              xmbmc: pkg.name,
              yjdwName: unit.name,
              ejdwName: name,
              ssbm: name,
              dntzjh: ysje * 1.2,
              dnys: ysje,
              dncwzc: ysje * 0.6,
              ndyswcl: 60,
              xmxzName: i % 2 ? '新建' : '续建',
              yjflName: '一级分类示例',
              ejflName: '二级分类示例',
              sjflName: '三级分类示例',
              cnx1: `承诺项-${type.protypeId}`,
              yqljtzjh: ysje * 2,
              amount: ysje * 2.5,
              yqljcwzc: ysje * 1.5,
              xmljwcl: 60,
              ispackname: pkg.id ? '是' : '否',
              saptime: `${context.nd}-0${(i % 9) + 1}-15`
            })
          }
        })
      })
    })
  })
  return rows
}

const matchesFilters = (row: FixtureRow, params: Record<string, any>) => {
  const types = Array.isArray(params.ysylIds) ? params.ysylIds : []
  return (!types.length || types.includes(row.ysylId)) && ['xmbmc', 'xmbId', 'yjdw', 'ejdw'].every((key) => !params[key] || row[key] === params[key])
}

const toResponseRow = (row: FixtureRow, projects: FixtureRow[]) => {
  const { ancestors, ...data } = row
  const details = projects.filter((project) => project.id === row.id || project.ancestors.includes(row.id))
  const sum = (key: string) => Number(details.reduce((total, project) => total + project[key], 0).toFixed(6))
  return { ...data, YSJE: sum('YSJE'), ZXJE: sum('ZXJE'), SYJE: sum('SYJE') }
}

Mock.mock(/\/xmysyl\/getYsylTree(?:\?[^#]*)?$/, 'get', (options: MockOptions) =>
  success(PROJECT_TYPES.map((item) => ({ ...item, nd: getQueryValue(options.url, 'nd'), leaf: true, children: [] })))
)

Mock.mock(/\/xmysyl\/getXmb(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const { ysylIds } = parseBody(options)
  return success(PACKAGES.filter((item) => !Array.isArray(ysylIds) || !ysylIds.length || ysylIds.includes(item.ysylId)))
})

Mock.mock(/\/xmysyl\/getDynamicColumn(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  return success([
    { field: 'name', title: params.id ? '项目名称' : '项目类型 / 项目包 / 单位 / 项目', minWidth: 340 },
    { field: 'subName', title: '项目编码', minWidth: 180 },
    {
      title: `${params.nd || new Date().getFullYear()}年 ${params.ydStart || 1}—${params.ydEnd || 12}月（万元）`,
      children: [
        { field: 'YSJE', title: '预算金额', minWidth: 150 },
        { field: 'ZXJE', title: '执行金额', minWidth: 150 },
        { field: 'SYJE', title: '剩余金额', minWidth: 150 }
      ]
    }
  ])
})

Mock.mock(/\/xmysyl\/getData(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const rows = buildRows(params)
  const projects = rows.filter((row) => row.nodeType === '6' && matchesFilters(row, params))
  const parentId = String(params.parentId ?? '0')
  return success(
    rows
      .filter((row) => row.parentId === parentId && projects.some((project) => project.id === row.id || project.ancestors.includes(row.id)))
      .map((row) => toResponseRow(row, projects))
  )
})

Mock.mock(/\/xmysyl\/getCtData(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const rows = buildRows(params)
  const clickedRow = rows.find((row) => row.id === params.id && row.nodeType === String(params.nodeType))
  if (!clickedRow || !['4', '5', '6'].includes(clickedRow.nodeType)) return fail('缺少有效的穿透行 id / nodeType')
  const codes = String(params.xmbms || '')
    .split(/[\s,，;；]+/)
    .filter(Boolean)
  // 依据点击节点确定明细范围，穿透页只额外筛选项目编码。
  const projects = rows.filter(
    (row) =>
      row.nodeType === '6' && (row.id === clickedRow.id || row.ancestors.includes(clickedRow.id)) && (!codes.length || codes.includes(row.xmbm))
  )
  return success(
    pageResult(
      projects.map((row) => toResponseRow(row, projects)),
      params.page,
      params.limit
    )
  )
})
