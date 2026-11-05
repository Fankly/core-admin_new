/** 需求录入（/service/xq/Requirement）的页面入口与表单 mock。 */
import Mock from 'mockjs'
import { getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'
import { getRequirementMatterRows } from './matterBasic'
import { XQ_ROWS } from './centralizedModification/data'

const BUSICODE = 'XQK-XQLR'
const YEAR = String(new Date().getFullYear())
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const role = {
  id: 'sprole-xqlr-01',
  name: '需求录入人员',
  code: 'SCWYSZZ',
  role_id: 'role-xqlr-01',
  specialorgid: 'bm-xqk-01',
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  org_id: 'dw-xqk-01',
  org_name: '国网南京供电公司',
  namecode: 'mock_xqlr_user',
  busicode: BUSICODE
}

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*\/Requirement(?:&|$)/, 'get', (options: MockOptions) =>
  success({ outsideMenu: BUSICODE, url: getQueryValue(options.url, 'url') })
)
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [clone(role)])
Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success(['ADD', 'SAVE', 'SUBMIT']))

const tree = [
  { id: YEAR, name: YEAR, nd: YEAR, hasChildren: true },
  { id: 'PT01', name: '基建项目', nd: YEAR, hasChildren: false },
  { id: 'PT02', name: '技改项目', nd: YEAR, hasChildren: false },
  { id: 'PT03', name: '营销项目', nd: YEAR, hasChildren: false }
]

Mock.mock(/protypeTree\/getProtypeTreeByGkbmId(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const { parentId } = parseBody(options)
  return success(clone(parentId === '-1' ? tree.slice(0, 1) : parentId === YEAR ? tree.slice(1) : []))
})

Mock.mock(/yssxBasic\/getFromXqlr(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const keyword = (value: unknown, search: unknown) => !search || String(value).includes(String(search))
  const rows = getRequirementMatterRows().filter((row) =>
    keyword(row.zyssxbm, body.zyssxbm) &&
    keyword(row.zyssxmc, body.zyssxmc) &&
    (!body.zgkbmId || row.zgkbmId === body.zgkbmId) &&
    (!body.ysly || row.ysly === body.ysly) &&
    (!body.parentId || body.parentId === YEAR || row.xmlx === body.parentId)
  ).map((row) => ({ ...row, yslyName: '省级统筹', xmlxName: row.xmlxName }))
  return success(pageResult(rows, body.page, body.limit))
})

const steps = [
  {
    stepId: 'xqlr-basic', stepName: '基本信息', stepType: '2',
    columns: [
      { prop: 'XMMC', label: '项目名称', type: 'input', required: true, rules: { required: true, message: '请输入项目名称', trigger: 'blur' } },
      { prop: 'ND', label: '申报年度', type: 'input', required: true, defaultValue: YEAR, rules: { required: true, message: '请输入申报年度', trigger: 'blur' } },
      { prop: 'YJDW', label: '一级单位', type: 'select', options: [{ code: 'DW001', name: '国网江苏省电力有限公司' }, { code: 'DW002', name: '国网南京供电公司' }] },
      { prop: 'XMBM', label: '项目编码', type: 'input', disabled: true }
    ]
  },
  {
    stepId: 'xqlr-declare', stepName: '申报信息', stepType: '3',
    columns: [
      { prop: 'SQJE', label: '申报金额（万元）', type: 'number' },
      { prop: 'XMNR', label: '项目内容', type: 'textarea' }
    ]
  },
  { stepId: 'xqlr-attach', stepName: '附件信息', stepType: '4', columns: [
    { prop: 'BZ', label: '备注', type: 'textarea' }
  ] }
]

Mock.mock(/xmAttributeConfig\/getTabColumns\?[^#]*yssxId=mock-matter-/, 'get', () => success(clone(steps)))
Mock.mock(/xmAttributeConfig\/checkByStep(?:\?.*)?$/, 'post', () => success(true))

let nextId = 1
const saveRequirement = (options: MockOptions) => {
  const body = parseBody(options)
  const data = body.datas || {}
  if (!data.yssxId) return success(true, '保存成功')
  const id = String(body.id || `mock-entry-${String(nextId++).padStart(3, '0')}`)
  const index = XQ_ROWS.findIndex((row) => row.id === id)
  const base = index >= 0 ? XQ_ROWS[index] : XQ_ROWS[0]
  const matter = getRequirementMatterRows().find((item) => item.id === data.yssxId)
  const row = {
    ...clone(base), id, xmid: id, yssxId: data.yssxId,
    xmmc: data.XMMC || base.xmmc || '新建需求', xmbm: data.XMBM || (index >= 0 ? base.xmbm : id),
    nd: String(data.ND || base.nd || YEAR), amount: Number(data.SQJE ?? base.amount) || 0,
    xmlx: data.protypeId || matter?.xmlx || base.xmlx,
    xmlxName: matter?.xmlxName || base.xmlxName,
    yssx: matter?.zyssxmc || base.yssx,
    yssx_new_id: data.yssxId,
    zt: 'Q00', ztName: '需求草稿'
  }
  if (index >= 0) XQ_ROWS.splice(index, 1, row)
  else XQ_ROWS.unshift(row)
  return success({ id, num: XQ_ROWS.filter((row) => row.zt === 'Q00').length }, '保存成功')
}

Mock.mock(/xmAttributeConfig\/saveXmInfo(?:\?.*)?$/, 'post', saveRequirement)
Mock.mock(/xmAttributeConfig\/saveXmInfoTmp(?:\?.*)?$/, 'post', saveRequirement)
Mock.mock(/xmAttributeConfig\/getXqlrNum(?:\?.*)?$/, 'get', () => success(XQ_ROWS.filter((row) => row.zt === 'Q00').length))
Mock.mock(/xmAttributeConfig\/getWfCodeByXmId\?[^#]*id=mock-entry-/, 'get', () => success('WF_NEWCBXQSHLC'))
