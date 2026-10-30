/** 省级统筹目标值：仅由开发环境 mock/index.ts 加载，刷新页面恢复种子数据。 */
import Mock from 'mockjs'
import { fail, getQueryValue, pageResult, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import {
  ADJUST_TYPES,
  BUSICODE,
  CURRENT_YEAR,
  DATA_TYPES,
  DEPT_ID,
  MAINTAIN_COLUMNS,
  MENU_ID,
  PROJECT_TYPES,
  ROLE_ID,
  STATUS_NAMES,
  SUMMARY_COLUMNS,
  YEARS,
  applyControls,
  asList,
  assertEditable,
  candidateRows,
  clone,
  controlRows,
  createVersion,
  getState,
  maintainRows,
  normalizeProject,
  projectRowsByVersionIds,
  removeState,
  resetState,
  summaryRows,
  versions
} from './data'
import type { Row, VersionState } from './data'
import './files'

const ok = (data: unknown) => success(clone(data))
const paramsFor = (options: MockOptions): Row => ({
  ...Object.fromEntries(new URL(options.url, 'http://localhost').searchParams),
  ...parseBody(options)
})
const safe = (handler: (options: MockOptions) => unknown) => (options: MockOptions) => {
  try {
    return handler(options)
  } catch (error) {
    return fail((error as Error).message)
  }
}
const register = (path: string, method: string, handler: (options: MockOptions) => unknown) =>
  Mock.mock(new RegExp(`/sjtcmbztz/${path}(?:\\?.*)?$`), method, safe(handler))
const withVersion =
  (handler: (state: VersionState, params: Row) => unknown, writable = false) =>
  (options: MockOptions) => {
    const params = paramsFor(options)
    const state = getState(params.versionId || params.wfData?.VERSION_ID)
    if (writable) assertEditable(state)
    return handler(state, params)
  }

const BUTTONS = [
  'VERSION',
  'VERSION_ADD',
  'VERSION_EDIT',
  'VERSION_COMPARE',
  'VERSION_DELETE',
  'TARGETVALUE',
  'TARGETVALUE_MAINTAIN',
  'TARGETVALUE_VIEW',
  'PROCESS'
]
// UserRoleSelector 会优先使用 routeToMeta / menuMsg 的缓存业务码，未必请求 getMenuByUrl。
// URL 匹配时限定在本页，兼容缓存中的实际业务码，同时保留模拟业务码的直接调用。
const onProvinceTargetPage = () =>
  typeof location !== 'undefined' && /\/targetBudget\/provinceTarget(?:\/|[?#]|$)/.test(decodeURIComponent(location.pathname + location.hash))
const scopeToPage = (pattern: RegExp, key?: string, value?: string) => {
  const matches = pattern.test.bind(pattern)
  pattern.test = (url: string) => matches(url) && (onProvinceTargetPage() || Boolean(key && getQueryValue(url, key) === value))
  return pattern
}
Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*provinceTarget/, 'get', (options: MockOptions) =>
  ok({ id: MENU_ID, outsideMenu: BUSICODE, url: getQueryValue(options.url, 'url') })
)
Mock.mock(scopeToPage(/getRoleByBusicode\?(?:[^#]*&)?busicode=[^&#]+/, 'busicode', BUSICODE), 'get', (options: MockOptions) => [
  {
    id: ROLE_ID,
    role_id: ROLE_ID,
    code: 'SJTC_MBZ_ADMIN',
    spRoleCode: 'SJTC_MBZ_ADMIN',
    name: '省级统筹目标值管理员',
    rolename: '省级统筹目标值管理员',
    specialorgid: DEPT_ID,
    specialorgname: '发展策划部',
    specialorgcode: 'BM_FZCH',
    org_id: 'SJTC-PROVINCE',
    org_name: '省电力公司',
    busicode: getQueryValue(options.url, 'busicode')
  }
])
Mock.mock(scopeToPage(/sysMenu\/getButtonList(?:New)?(?:\?.*)?$/, 'menuCode', BUSICODE), 'get', () => ok(BUTTONS))
Mock.mock(scopeToPage(/sys\/menuConfig\/getConfigByMenuId\?[^#]*menuId=[^&#]+/, 'menuId', MENU_ID), 'get', () =>
  ok({
    status: '1',
    helpInfo: '草稿、审核驳回版本可维护。支持版本比对、总控值平衡调整、项目明细增删改、Excel 导入导出及附件上传。演示数据在刷新后恢复。'
  })
)
Mock.mock(scopeToPage(/sys\/menuConfig\/listFj\?[^#]*menuId=[^&#]+/, 'menuId', MENU_ID), 'get', () => ok([]))

const dictionaries: Record<string, Row[]> = {
  SYTC_MBZ_VER_STATUS: STATUS_NAMES.map((name, index) => ({ code: String(index + 1), name })),
  SJTCMBZ_DATA_TYPE: DATA_TYPES,
  SJTCMBZ_TZLX_COM: ADJUST_TYPES,
  NDCX: YEARS
}
for (const code of ['SYTC_MBZ_VER_STATUS', 'SJTCMBZ_DATA_TYPE', 'SJTCMBZ_TZLX_COM']) {
  Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${code}(?:&|$)`), 'get', () => ok(dictionaries[code]))
}
// 批量字典的 code 在 POST body 中，MockJS 无法据此决定是否透传。
// 在 URL 匹配阶段同时检查当前路由，其他页面仍走其原有字典接口。
const dictionaryUrl = scopeToPage(/process40\/getComCodeByCode\/?(?:\?.*)?$/)
Mock.mock(dictionaryUrl, 'post', (options: MockOptions) =>
  ok(Object.fromEntries(asList(parseBody(options).codes).map((code) => [code, dictionaries[code] || []])))
)

register('getVersionPage', 'post', (options) => {
  const params = parseBody(options)
  const rows = versions.filter(
    (row) =>
      (!params.nd || row.nd === String(params.nd)) &&
      (!params.status || row.status === Number(params.status)) &&
      (!params.versionName || row.versionName.includes(String(params.versionName).trim())) &&
      (!params.gkbmName || row.gkbmName.includes(String(params.gkbmName).trim()))
  )
  return ok(pageResult(rows, params.page, params.limit))
})
register('getInitData', 'get', () => ok({ wjhNum: 0, bmName: '发展策划部', gkbmId: DEPT_ID }))
// 联调时允许创建多个草稿，以便测试版本比对；必须返回数字 0（页面以 truthiness 判断）。
register('checkByUserDept', 'get', () => ok(0))
// getWjhNum 已由 goalValueVersion mock 提供，不重复覆盖共用校验。
register('createVersion', 'post', (options) => {
  const params = parseBody(options)
  const name = String(params.versionName || '').trim()
  if (!name || !String(params.remark || '').trim()) return fail('版本名称和备注不能为空')
  if (params.id) {
    const state = getState(params.id)
    assertEditable(state)
    Object.assign(state.version, {
      versionName: name,
      remark: String(params.remark),
      ...(params.tzsm !== undefined ? { tzsm: String(params.tzsm) } : {})
    })
    return ok(state.version)
  }
  const nd = String(params.nd || CURRENT_YEAR)
  if (!/^\d{4}$/.test(nd)) return fail('请选择有效年度')
  const sequence = versions.filter((row) => row.nd === nd).reduce((max, row) => Math.max(max, Number(row.versionNo.split('-').pop())), 0) + 1
  const row = {
    ...createVersion(nd, sequence),
    versionName: name,
    remark: String(params.remark),
    gkbmId: String(params.gkbmId || DEPT_ID),
    gkbmName: String(params.bmName || '发展策划部'),
    bmName: String(params.bmName || '发展策划部')
  }
  versions.unshift(row)
  return ok(row)
})
register('deleteVersion', 'post', (options) => {
  const ids = asList(parseBody(options).ids)
  if (!ids.length) return fail('请选择版本')
  ids.forEach((id) => assertEditable(getState(id)))
  ids.forEach((id) => {
    versions.splice(
      versions.findIndex((row) => row.id === id),
      1
    )
    removeState(id)
  })
  return ok(true)
})

register(
  'getDynamicColumn',
  'post',
  withVersion(() => ok(MAINTAIN_COLUMNS))
)
register(
  'getVersionDetail',
  'post',
  withVersion((state, params) => ok(maintainRows(state, params.dataType)))
)
register(
  'xmSum/getDynamicColumn',
  'post',
  withVersion(() => ok(SUMMARY_COLUMNS))
)
register(
  'xmSum/getPage',
  'post',
  withVersion((state) => ok(summaryRows(state)))
)
register(
  'xmDetail/getPage',
  'post',
  withVersion((state, params) => ok(pageResult(state.projects, params.page, params.limit)))
)
register('getXmDetailByVersionIds', 'post', (options) => {
  const params = parseBody(options)
  return ok(pageResult(projectRowsByVersionIds(params), params.page, params.limit))
})
register(
  'getZkzAndDfjData',
  'get',
  withVersion((state) => ok(controlRows(state)))
)
register(
  'getTzsmByVersionId',
  'get',
  withVersion((state) => ok(state.version.tzsm))
)
register('getProtypeByGkbmId', 'get', () =>
  ok(
    ['1', '2'].map((xmdl) => ({
      middleId: `category-${xmdl}`,
      name: PROJECT_TYPES.find((type) => type.xmdl === xmdl)!.xmdlName,
      children: PROJECT_TYPES.filter((type) => type.xmdl === xmdl).map((type) => ({ id: type.id, middleId: type.id, code: type.id, name: type.name }))
    }))
  )
)
register(
  'xmDetail/getXmDetailNew',
  'post',
  withVersion((state, params) => ok(pageResult(candidateRows(state, params), params.page, params.limit)))
)

register(
  'modifyZkzAndDfj',
  'post',
  withVersion((state, params) => {
    applyControls(state, params.datas)
    return ok(true)
  }, true)
)

const saveProjects = (options: MockOptions, add: boolean) => {
  const changes = parseBody(options)
  if (!Array.isArray(changes) || !changes.length) return fail('没有可保存的项目明细')
  const state = getState(changes[0].versionId)
  assertEditable(state)
  const projects = clone(state.projects)
  for (const change of changes) {
    if (change.versionId !== state.version.id) return fail('一次只能保存同一版本的项目')
    const index = projects.findIndex((row) => row.id === change.id)
    if (add) {
      if (projects.some((row) => row.xmbm === change.xmbm)) return fail('项目已加入清单，请勿重复确认')
      const candidate = candidateRows(state, { nd: change.nd, tzlx: change.tzlx }).find((row) => row.id === change.id)
      if (!candidate) return fail('待确认项目不存在')
      projects.push(normalizeProject({ ...candidate, ...change }))
    } else {
      if (index === -1) return fail('项目明细不存在')
      const original = projects[index]
      projects[index] = normalizeProject({ ...original, dnysTzh: change.dnysTzh, tzsm: change.tzsm, sfyap: change.sfyap })
    }
  }
  state.projects = projects
  return ok(true)
}
register('xmDetail/save', 'post', (options) => saveProjects(options, true))
register('xmDetail/update', 'post', (options) => saveProjects(options, false))
register('xmDetail/deleteXmDetail', 'post', (options) => {
  const ids = asList(parseBody(options).ids)
  if (!ids.length) return fail('请选择项目明细')
  const affected = ids.map((id) => {
    const version = versions.find((row) => id.startsWith(`${row.id}-SJTC-`))
    const state = getState(version?.id)
    assertEditable(state)
    if (!state.projects.some((row) => row.id === id)) throw new Error('项目明细不存在')
    return state
  })
  affected.forEach((state) => {
    state.projects = state.projects.filter((row) => !ids.includes(row.id))
  })
  return ok(true)
})
register(
  'saveData',
  'post',
  withVersion((state, params) => {
    // 当前页面目标值表只读，金额调整通过 modifyZkzAndDfj 和项目清单完成。
    if (params.saveDatas?.length) return fail('请通过目标总控值调整或项目明细清单修改金额')
    if (!String(params.tzsm || '').trim()) return fail('请输入调整说明')
    state.version.tzsm = String(params.tzsm)
    return ok(true)
  }, true)
)
register(
  'reset',
  'post',
  withVersion((state) => {
    resetState(state)
    return ok(true)
  }, true)
)
register(
  'checkFromWf',
  'post',
  withVersion(() => ok(true))
)
register(
  'initDataWhenAudit',
  'post',
  withVersion(() => ok({ pass: true, message: '' }))
)

const compareStates = (options: MockOptions) => {
  const ids = asList(getQueryValue(options.url, 'versionIds'))
  if (ids.length !== 2 || ids[0] === ids[1]) throw new Error('请选择两个不同的版本')
  return ids.map(getState)
}
register('getCompareColumn', 'post', (options) => {
  const states = compareStates(options)
  return ok([
    { field: 'xmdlName', title: '项目大类', width: 160 },
    { field: 'protypeName', title: '项目类型', width: 180 },
    ...states.map((state, index) => ({
      title: state.version.versionName,
      children: [
        { field: `zkz_${index}`, title: '目标总控值', needFormat: true, width: 180 },
        { field: `dfj_${index}`, title: '待分解', needFormat: true, width: 180 },
        { field: `dwSum_${index}`, title: '各单位目标值合计', needFormat: true, width: 200 }
      ]
    }))
  ])
})
register('getCompareData', 'post', (options) => {
  const [left, right] = compareStates(options).map(controlRows)
  return ok(
    left.map((row, index) => {
      const next: Row = { id: row.id, xmdlName: row.xmdlName, protypeName: row.protypeName }
      for (const [key, field] of Object.entries({ zkz: 'bcxgYsje', dfj: 'bcxgDfj', dwSum: 'bcxgDwSum' } as const)) {
        next[`${key}_0`] = row[field]
        next[`${key}_1`] = right[index][field]
        if (row[field] !== right[index][field]) next[`${key}_color`] = '1'
      }
      return next
    })
  )
})

Mock.mock(/workflow\/initWfJavascript\?[^#]*wfCode=SJTC_MBZTZ_SHLC(?:&|$)/, 'post', () =>
  ok({
    javascript: '/* 省级统筹本地审批演示 */',
    functionName: 'window.crAndFinFir ? window.crAndFinFir("[]") : window.finNode && window.finNode("[]")'
  })
)
for (const [path, status] of [
  ['submit', 2],
  ['reject', 4],
  ['pass', 3]
] as const) {
  register(
    path,
    'post',
    withVersion((state) => {
      if (path === 'submit') assertEditable(state)
      else if (state.version.status !== 2) return fail('只有已提交版本可以审核')
      state.version.status = status
      state.version.statusName = STATUS_NAMES[status - 1]
      if (status === 3) state.version.activeTime = new Date().toISOString()
      state.history.push({
        flowId: `sjtc-flow-${state.version.id}`,
        flowName: '省级统筹目标值调整',
        auditStatusName: state.version.statusName,
        nodename: path === 'submit' ? '提交审核' : '省级归口部门审核',
        creator: '模拟用户',
        createDep: state.version.gkbmName,
        auditor: path === 'submit' ? '' : '模拟审核人',
        auditDep: '财务资产部',
        auditTime: new Date().toISOString(),
        spjg: status === 3 ? 'Y' : status === 4 ? 'TH' : '',
        spyj: state.version.tzsm
      })
      return ok(true)
    })
  )
}
Mock.mock(
  /lcll\/getLcllByMbz\?[^#]*id=sjtc-mock-[^&#]+/,
  'get',
  safe((options) => ok(getState(getQueryValue(options.url, 'id')).history))
)
