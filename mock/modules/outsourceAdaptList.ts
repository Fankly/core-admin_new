/**
 * 外包适配清单 mock
 *
 * 注意：getMenuByUrl / getRoleByBusicode / getButtonList 必须按判别值收窄，
 * 避免 mockjs 命中后无法透传真实后端。
 */
import Mock from 'mockjs'
import { fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// ==================== 登录 / 按钮权限链路 ====================
// userDialog：getMenuByUrl → getRoleByBusicode → getButtonList → setPermissions

/** 本页 outsideMenu / menuCode（开发态 mock 专用） */
const BUSICODE = 'OUTSOURCE-ADAPT-LIST'
const BUTTONS = ['ADD', 'EDIT', 'DELETE']

const buildRole = () => ({
  id: `sprole-${BUSICODE}`,
  name: '财务预算专职',
  code: 'SCWYSZZ',
  role_id: 'role-outsource-adapt',
  specialorgid: 'bm-001',
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  org_id: 'DW001',
  org_name: '国网江苏省电力有限公司',
  namecode: 'mock_outsource_admin',
  busicode: BUSICODE
})

// 菜单：只拦 url 含 outsourceAdaptList 的请求
Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*outsourceAdaptList/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ outsideMenu: BUSICODE, url })
})

// 角色：按 busicode 收窄
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', () => [buildRole()])

// 按钮权限：新增 / 编辑 / 删除
Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success(clone(BUTTONS)))

// ==================== 业务大类 / 小类公共代码（级联） ====================

const BIZ_CAT_CODE = 'OUTSOURCE_RULE_KB_BIZ_CAT'

const MAJOR_CATS = [
  { code: 'YJ', name: '运检业务' },
  { code: 'YX', name: '营销业务' },
  { code: 'XX', name: '信息通信' },
  { code: 'AQ', name: '安全监察' }
]

const SUB_CATS: Record<string, Array<{ code: string; name: string }>> = {
  YJ: [
    { code: 'YJ01', name: '输电运维' },
    { code: 'YJ02', name: '变电运维' },
    { code: 'YJ03', name: '配电运维' }
  ],
  YX: [
    { code: 'YX01', name: '用电检查' },
    { code: 'YX02', name: '业扩报装' }
  ],
  XX: [
    { code: 'XX01', name: '网络运维' },
    { code: 'XX02', name: '系统开发' }
  ],
  AQ: [
    { code: 'AQ01', name: '安全督查' },
    { code: 'AQ02', name: '应急管理' }
  ]
}

// 大类：getPublicData(OUTSOURCE_RULE_KB_BIZ_CAT)
// 小类：getCommonCodeByParentCode 在 budgetChanges mock 中按 body.code 分支处理，避免重复注册互覆盖
Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${BIZ_CAT_CODE}(?:&|$)`), 'get', () => success(clone(MAJOR_CATS)))

// ==================== 业务数据 ====================

const resolveMajorName = (code: string) => MAJOR_CATS.find((item) => item.code === code)?.name || code
const resolveSubName = (major: string, sub: string) => {
  const list = SUB_CATS[major] || []
  return list.find((item) => item.code === sub)?.name || sub
}

type Row = {
  id: string
  seqNo: string
  bizMajorCat: string
  bizMajorCatName: string
  bizSubCat: string
  bizSubCatName: string
  prohibitedBiz: string
  allowedAuxBiz: string
}

let idSeed = 100
const createId = () => `OAL${++idSeed}`

const seedRows = (): Row[] => {
  const rows: Row[] = []
  let seq = 1
  MAJOR_CATS.forEach((major) => {
    ;(SUB_CATS[major.code] || []).forEach((sub) => {
      rows.push({
        id: createId(),
        seqNo: String(seq++),
        bizMajorCat: major.code,
        bizMajorCatName: major.name,
        bizSubCat: sub.code,
        bizSubCatName: sub.name,
        prohibitedBiz: `${major.name}-${sub.name}核心业务禁止整体外包`,
        allowedAuxBiz: `${sub.name}相关的辅助性、支持性工作可外包`
      })
    })
  })
  return rows
}

let tableData: Row[] = seedRows()

// 分页查询
Mock.mock(/outsource-rule-kb(?:-range)?\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const major = String(body.bizMajorCat || '').trim()
  const sub = String(body.bizSubCat || '').trim()
  let list = clone(tableData)
  if (major) {
    list = list.filter(
      (item) => item.bizMajorCat.includes(major) || item.bizMajorCatName.includes(major)
    )
  }
  if (sub) {
    list = list.filter((item) => item.bizSubCat.includes(sub) || item.bizSubCatName.includes(sub))
  }
  const page = body.page ?? body.current ?? 1
  const limit = body.limit ?? body.size ?? 20
  return success(pageResult(list, page, limit))
})

// 保存
Mock.mock(/outsource-rule-kb(?:-range)?\/save(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const seqNo = String(body.seqNo || '').trim()
  const bizMajorCat = String(body.bizMajorCat || '').trim()
  const bizSubCat = String(body.bizSubCat || '').trim()
  const prohibitedBiz = String(body.prohibitedBiz || '').trim()
  const allowedAuxBiz = String(body.allowedAuxBiz || '').trim()

  if (!seqNo || !bizMajorCat || !bizSubCat || !prohibitedBiz || !allowedAuxBiz) {
    return fail('请完整填写必填项')
  }

  const next: Row = {
    id: body.id ? String(body.id) : createId(),
    seqNo,
    bizMajorCat,
    bizMajorCatName: resolveMajorName(bizMajorCat),
    bizSubCat,
    bizSubCatName: resolveSubName(bizMajorCat, bizSubCat),
    prohibitedBiz,
    allowedAuxBiz
  }

  if (body.id) {
    const idx = tableData.findIndex((item) => item.id === String(body.id))
    if (idx < 0) return fail('记录不存在')
    tableData[idx] = next
  } else {
    tableData.unshift(next)
  }
  return success(true, '保存成功')
})

// 删除
Mock.mock(/outsource-rule-kb(?:-range)?\/remove(\?.*)?$/, 'post', (options: MockOptions) => {
  let ids: string[] = []
  try {
    const parsed = options.body ? JSON.parse(options.body) : []
    ids = Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    ids = []
  }
  if (ids.length === 0) return fail('请选择要删除的数据')
  const before = tableData.length
  tableData = tableData.filter((item) => !ids.includes(item.id))
  if (tableData.length === before) return fail('未找到可删除数据')
  return success(true, '删除成功')
})
