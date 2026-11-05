import Decimal from 'decimal.js'

export type Row = Record<string, any>
export const CURRENT_YEAR = new Date().getFullYear()
export const BUSICODE = 'MOCK-PROVINCE-TARGET'
export const MENU_ID = 'menu-mock-province-target'
export const DEPT_ID = 'GK001'
export const ROLE_ID = 'role-mock-province-target'
export const STATUS_NAMES = ['草稿', '已提交', '审核通过', '审核驳回', '已过期']
export const ADJUST_TYPES = [
  { code: '1', name: '新增' },
  { code: '2', name: '调整' },
  { code: '3', name: '取消' }
]
export const DATA_TYPES = [
  { code: '1', name: '调整前' },
  { code: '2', name: '调整后' },
  { code: '3', name: '调整幅度' }
]
export const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((year) => ({ code: String(year), name: String(year) }))
export const PROJECT_TYPES = [
  { id: 'PT1', name: '变电站建设', xmdl: '1', xmdlName: '基建', control: 1000, unitTotal: 400 },
  { id: 'PT2', name: '线路改造', xmdl: '1', xmdlName: '基建', control: 1000, unitTotal: 500 },
  { id: 'PT4', name: '设备更新', xmdl: '2', xmdlName: '技改', control: 700, unitTotal: 300 },
  { id: 'PT5', name: '系统升级', xmdl: '2', xmdlName: '技改', control: 800, unitTotal: 350 }
]
export const UNITS = [
  { code: 'SJTC-DW-01', name: '南京供电公司' },
  { code: 'SJTC-DW-02', name: '苏州供电公司' }
]
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
export const amount = (value: Decimal.Value = 0) => new Decimal(value).toFixed(6)
export const sum = (rows: Row[], key: string) => rows.reduce((total, row) => total.plus(row[key] || 0), new Decimal(0)).toFixed(6)
export const asList = (value: unknown): string[] => (Array.isArray(value) ? value : String(value ?? '').split(',')).map(String).filter(Boolean)

export const createVersion = (nd: string, sequence: number): Row => ({
  id: `sjtc-mock-${nd}-${sequence}`,
  nd,
  status: 1,
  statusName: '草稿',
  versionNo: `SJTC-${nd}-${String(sequence).padStart(3, '0')}`,
  versionName: `${nd}年省级统筹目标调整版本${sequence}`,
  mbz: amount(3500),
  gkbmId: DEPT_ID,
  gkbmName: '发展策划部',
  bmId: DEPT_ID,
  bmName: '发展策划部',
  dwId: 'SJTC-PROVINCE',
  remark: '省级统筹目标值联调数据',
  tzsm: '根据年度项目实施进度调整预算，保持各项目大类目标总控值平衡。',
  activeTime: '',
  createUserName: '模拟用户',
  createTime: `${nd}-07-${String((sequence % 28) + 1).padStart(2, '0')} 09:00:00`
})

export const versions = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].flatMap((year) =>
  Array.from({ length: year === CURRENT_YEAR ? 24 : 6 }, (_, index) => {
    const row = createVersion(String(year), index + 1)
    row.status = (index % 5) + 1
    row.statusName = STATUS_NAMES[row.status - 1]
    if (row.status === 3 || row.status === 5) row.activeTime = `${year}-08-01 10:00:00`
    return row
  })
)

export interface VersionState {
  version: Row
  controls: Record<string, string>
  projects: Row[]
  attachments: Row[]
  files: Map<string, Blob>
  history: Row[]
}

const states = new Map<string, VersionState>()

export const makeProject = (version: Row, typeIndex: number, sequence: number, tzlx: string, candidate = false): Row => {
  const type = PROJECT_TYPES[typeIndex]
  const unit = UNITS[sequence % UNITS.length]
  const dnys = tzlx === '1' ? 0 : tzlx === '2' ? 100 : 50
  const adjusted = tzlx === '1' ? 120 : tzlx === '2' ? 130 : 0
  const xmbm = `SJTC-${version.nd}-${type.id}-${candidate ? 'WQR' : 'XM'}-${sequence}`
  return {
    id: `${version.id}-${xmbm}`,
    versionId: version.id,
    nd: version.nd,
    xmbm,
    xmmc: `${unit.name}${type.name}${candidate ? '储备' : ''}项目${sequence}`,
    tzlx,
    xmlx: type.id,
    protypeId: type.id,
    xmlxName: type.name,
    yjdwId: unit.code,
    yjdwName: unit.name,
    ejdwName: `${unit.name.replace('供电公司', '')}城区供电中心`,
    xmxzName: tzlx === '1' ? '新建' : '续建',
    jsksnd: version.nd,
    jsjsnd: String(Number(version.nd) + 1),
    amount: amount(500 + typeIndex * 100),
    dnys: amount(dnys),
    dnysTzh: amount(adjusted),
    tzfd: amount(adjusted - dnys),
    tzsm: `${ADJUST_TYPES.find((item) => item.code === tzlx)?.name}项目年度预算`,
    kypfwh: `苏电发展〔${version.nd}〕${100 + sequence}号`,
    sfyap: tzlx === '1' ? '1' : '0',
    xmyxjName: sequence % 2 ? '优先' : '一般',
    remark: '省级统筹目标值模拟项目',
    flowStatus: tzlx === '1' ? '320' : '600'
  }
}

const initialProjects = (version: Row) =>
  PROJECT_TYPES.flatMap((_, index) => ADJUST_TYPES.map((type, sequence) => makeProject(version, index, sequence + 1, type.code)))

export const getState = (versionId: unknown): VersionState => {
  const version = versions.find((row) => row.id === String(versionId))
  if (!version) throw new Error('版本不存在')
  if (!states.has(version.id)) {
    const sequence = Number(String(version.versionNo).split('-').pop())
    // 同一大类内平衡调整，确保版本比对既有差异也保持总额一致。
    const offset = ((sequence - 1) % 4) * 10
    states.set(version.id, {
      version,
      controls: Object.fromEntries(PROJECT_TYPES.map((type, index) => [type.id, amount(type.control + (index % 2 ? -offset : offset))])),
      projects: initialProjects(version),
      attachments: [
        {
          id: `${version.id}-attach-1`,
          uuid: `${version.id}-attach-1`,
          versionId: version.id,
          attachName: '项目预算调整清单.xlsx',
          uploadUser: 'mock-user',
          uploadUserName: '模拟用户',
          uploadTime: version.createTime
        }
      ],
      files: new Map(),
      history:
        version.status === 1
          ? []
          : [
              {
                flowId: `sjtc-flow-${version.id}`,
                flowName: '省级统筹目标值调整',
                auditStatusName: version.statusName,
                nodename: '省级归口部门审核',
                creator: '模拟用户',
                createDep: version.gkbmName,
                auditor: '模拟审核人',
                auditDep: '财务资产部',
                auditTime: version.createTime,
                spjg: version.status === 3 ? 'Y' : version.status === 4 ? 'TH' : '',
                spyj: version.status === 4 ? '请补充调整说明后重新提交' : '预算调整审核'
              }
            ]
    })
  }
  return states.get(version.id)!
}

export const projectRowsByVersionIds = (params: Row): Row[] => {
  const versionIds = [...new Set(asList(params.versionIds))]
  if (!versionIds.length) throw new Error('请至少选择一个版本')
  return versionIds.flatMap((versionId) => {
    const state = getState(versionId)
    return state.projects.map((row) => ({
      ...row,
      versionId: state.version.id,
      versionName: state.version.versionName,
      versionNo: state.version.versionNo
    }))
  })
}

export const removeState = (id: string) => states.delete(id)
export const resetState = (state: VersionState) => {
  state.controls = Object.fromEntries(PROJECT_TYPES.map((type) => [type.id, amount(type.control)]))
  state.projects = initialProjects(state.version)
}

export const assertEditable = (state: VersionState) => {
  if (![1, 4].includes(state.version.status)) throw new Error('仅草稿和审核驳回版本允许修改')
}

export const controlRows = (state: VersionState) => {
  const numericKeys = ['tzqYsje', 'tzqDfj', 'tzqDwSum', 'bcsqYsje', 'bcsqDfj', 'bcsqDwSum', 'bcxgYsje', 'bcxgDfj', 'bcxgDwSum']
  const details = PROJECT_TYPES.map((type) => {
    const delta = sum(
      state.projects.filter((row) => row.protypeId === type.id),
      'tzfd'
    )
    const afterUnits = new Decimal(type.unitTotal).plus(delta)
    const afterControl = state.controls[type.id]
    return {
      id: type.id,
      xmdl: type.xmdl,
      xmdlName: type.xmdlName,
      protypeId: type.id,
      protypeName: type.name,
      tzqYsje: amount(type.control),
      tzqDfj: amount(type.control - type.unitTotal),
      tzqDwSum: amount(type.unitTotal),
      bcsqYsje: amount(0),
      bcsqDfj: amount(new Decimal(delta).negated()),
      bcsqDwSum: delta,
      bcxgYsje: afterControl,
      bcxgDfj: amount(new Decimal(afterControl).minus(afterUnits)),
      bcxgDwSum: amount(afterUnits)
    }
  })
  const summary = (rows: Row[], xmdl: string, name: string): Row => ({
    id: `summary-${name}`,
    xmdl,
    xmdlName: name,
    protypeId: '',
    protypeName: '',
    ...Object.fromEntries(numericKeys.map((key) => [key, sum(rows, key)]))
  })
  return [
    ...details.slice(0, 2),
    summary(details.slice(0, 2), '', '基建小计'),
    ...details.slice(2),
    summary(details.slice(2), '', '技改小计'),
    summary(details, '-1', '合计')
  ]
}

export const applyControls = (state: VersionState, changes: Row[]) => {
  if (!Array.isArray(changes) || !changes.length) throw new Error('没有可保存的总控值数据')
  const controls = { ...state.controls }
  for (const row of changes) {
    const value = new Decimal(row.ysje)
    if (!(row.protypeId in controls) || !value.isFinite() || value.lt(0)) throw new Error('项目类型或目标总控值无效')
    controls[row.protypeId] = amount(value)
  }
  const rows = controlRows({ ...state, controls })
  if (rows.some((row) => new Decimal(row.bcxgDfj).lt(0))) throw new Error('调整后待分解金额不得小于 0')
  if (rows.filter((row) => !row.protypeId).some((row) => !new Decimal(row.bcxgYsje).eq(row.tzqYsje)))
    throw new Error('各大类小计和合计的目标总控值必须保持平衡')
  state.controls = controls
  state.version.mbz = rows[rows.length - 1].bcxgYsje
}

export const MAINTAIN_COLUMNS = [
  { columnKey: 'ysly', columnValue: '项目大类', fixed: true },
  { columnKey: 'name', columnValue: '项目类型', fixed: true },
  { columnKey: 'dataType', columnValue: '数据类型' },
  ...[
    { key: 'zkz', name: '目标总控值' },
    { key: 'dfj', name: '待分解' },
    { key: 'dwSum', name: '各单位目标值合计' },
    ...UNITS.map((unit) => ({ key: unit.code, name: unit.name }))
  ].map((item) => ({ columnKey: item.key, columnValue: item.name, needSum: true, color: true, eidt: false }))
]

export const maintainRows = (state: VersionState, selected: unknown = ''): Row[] => {
  const controls = controlRows(state)
  const rows = PROJECT_TYPES.flatMap((type) => {
    const control = controls.find((row) => row.protypeId === type.id)!
    const before: Row = { zkz: control.tzqYsje, dfj: control.tzqDfj, dwSum: control.tzqDwSum }
    const after: Row = { zkz: control.bcxgYsje, dfj: control.bcxgDfj, dwSum: control.bcxgDwSum }
    UNITS.forEach((unit, index) => {
      before[unit.code] = amount(new Decimal(type.unitTotal).mul(index === 0 ? '0.6' : '0.4'))
      after[unit.code] = amount(
        new Decimal(before[unit.code]).plus(
          sum(
            state.projects.filter((row) => row.protypeId === type.id && row.yjdwId === unit.code),
            'tzfd'
          )
        )
      )
    })
    const range = Object.fromEntries(Object.keys(before).map((key) => [key, amount(new Decimal(after[key]).minus(before[key]))]))
    return DATA_TYPES.map((dataType, index) => ({
      id: type.id,
      protypeId: type.id,
      name: type.name,
      ysly: type.xmdlName,
      dataType: dataType.name,
      edit: 0,
      ...[before, after, range][index]
    }))
  })
  DATA_TYPES.forEach((dataType) => {
    rows.push({
      id: '-1',
      protypeId: '',
      name: '合计',
      ysly: '',
      dataType: dataType.name,
      edit: 0,
      ...Object.fromEntries(
        MAINTAIN_COLUMNS.filter((column) => 'needSum' in column).map((column) => [
          column.columnKey,
          sum(
            rows.filter((row) => row.dataType === dataType.name && row.id !== '-1'),
            column.columnKey
          )
        ])
      )
    })
  })
  const selectedTypes = asList(selected)
  return selectedTypes.length
    ? rows.filter((row) => selectedTypes.some((code) => DATA_TYPES.find((type) => type.code === code || type.name === code)?.name === row.dataType))
    : rows
}

export const SUMMARY_COLUMNS = [
  { columnKey: 'adjustType', columnValue: '调整类型' },
  { columnKey: 'projectCount', columnValue: '项目数量' },
  ...[
    { key: 'declareAmount', name: '总预算合计（不含税）（万元）' },
    { key: 'currentBudget', name: '当年预算合计' },
    { key: 'adjustedCurrentBudget', name: '当年预算（调整后）合计' },
    { key: 'adjustAmount', name: '调整差额' }
  ].map((item) => ({ columnKey: item.key, columnValue: item.name, needSum: true }))
]

export const summaryRows = (state: VersionState) =>
  [...ADJUST_TYPES, { code: '', name: '合计' }].map((type) => {
    const rows = state.projects.filter((row) => !type.code || row.tzlx === type.code)
    return {
      adjustType: type.name,
      projectCount: rows.length,
      declareAmount: sum(rows, 'amount'),
      currentBudget: sum(rows, 'dnys'),
      adjustedCurrentBudget: sum(rows, 'dnysTzh'),
      adjustAmount: sum(rows, 'tzfd')
    }
  })

export const candidateRows = (state: VersionState, params: Row): Row[] => {
  const version = { ...state.version, nd: String(params.nd || state.version.nd) }
  const tzlx = String(params.tzlx || '1')
  if (!ADJUST_TYPES.some((item) => item.code === tzlx)) throw new Error('调整类型无效')
  const rows = PROJECT_TYPES.flatMap((_, typeIndex) =>
    Array.from({ length: 6 }, (_, index) => makeProject(version, typeIndex, index + 1, tzlx, true))
  )
  return rows.filter(
    (row) =>
      !state.projects.some((project) => project.xmbm === row.xmbm) &&
      (!params.bmId || asList(state.version.gkbmId).includes(String(params.bmId))) &&
      (!asList(params.xmlxs).length || asList(params.xmlxs).includes(row.protypeId)) &&
      (!asList(params.xmbms).length || asList(params.xmbms).includes(row.xmbm)) &&
      (!asList(params.flowStatus).length || asList(params.flowStatus).includes(row.flowStatus))
  )
}

export const normalizeProject = (row: Row): Row => {
  const type = PROJECT_TYPES.find((item) => item.id === row.protypeId || item.id === row.xmlx || item.name === row.xmlxName)
  if (!type) throw new Error('项目类型不存在')
  if (!row.xmbm || !row.xmmc || !ADJUST_TYPES.some((item) => item.code === String(row.tzlx))) throw new Error('项目编码、名称或调整类型无效')
  const total = new Decimal(row.amount || 0)
  const before = new Decimal(row.tzlx === '1' ? 0 : row.dnys || 0)
  const after = new Decimal(row.tzlx === '3' ? 0 : row.dnysTzh || 0)
  if (![total, before, after].every((value) => value.isFinite() && value.gte(0)) || after.gt(total))
    throw new Error('当年预算（调整后）不得超过总预算，预算金额必须为非负数')
  return {
    ...row,
    protypeId: type.id,
    xmlx: type.id,
    xmlxName: type.name,
    amount: amount(total),
    dnys: amount(before),
    dnysTzh: amount(after),
    tzfd: amount(after.minus(before)),
    sfyap: row.tzlx === '1' ? String(row.sfyap || '0') : '0'
  }
}
