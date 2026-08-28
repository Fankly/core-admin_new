/**
 * 集中修改（/service/xq/CentralizedModification）mock
 *
 * 覆盖该页全链路：登录角色 → 菜单/按钮 → 动态查询列与表头 → 需求列表/待确认列表
 * → 修改弹窗 → 关联事项 / 创建部门修改 / 类型确认 / 流程履历 → 提交（直接 + 工作流）。
 *
 * 复用关系（避免重复注册）：
 *  - 二级单位联动 bizOrgTree/getYjdw、getEjdw 由 budgetChanges 提供（单位编码对齐）
 *  - 二三级分类联动 commonCode/getCommonCodeByParentCode 由 budgetChanges 提供
 *  - 修改弹窗动态表单 xmAttributeConfig/getXmInfo、getTabColumns 由 aiSmartTaskAudit
 *    按 xmId=mock-project- 前缀提供（列表行 id 统一用该前缀直接命中）
 *  - getFqzz 在 budgetChanges 有一个宽泛正则，本页用更窄的 spOrgId 收窄到市公司角色
 *  - sys/appMenu/list 走 shared/appMenu 分发器登记 appNo=XQK
 */
import Mock from 'mockjs'
import { binaryResponse, getQueryValue, pageResult, parseBody, success } from '../../helpers'
import type { MockOptions } from '../../helpers'
import { registerAppMenu } from '../../shared/appMenu'
import {
  COMMON_CODE_MAP,
  PROTYPE_TREE,
  SEARCH_COLUMNS,
  TABLE_COLUMNS,
  TBC_ROWS,
  XQ_APP_NO,
  XQ_BUSICODE,
  XQ_BUTTONS,
  XQ_DW_ID,
  XQ_MENU_ID,
  XQ_ROWS,
  XQ_SEARCH_CODE,
  XQ_SP_ORG_ID,
  XQ_WF_CODE,
  buildBmListByEjdw,
  buildOpLogRows,
  buildProcessRows,
  buildSettingRows,
  buildTbcProtypeList,
  buildXqRole,
  buildYssxList
} from './data'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const includesText = (value: unknown, keyword: unknown) =>
  !keyword || String(value || '').toLowerCase().includes(String(keyword).toLowerCase())

// ==================== 登录 / 角色链路（判别值写进正则收窄） ====================
// userDialog: getMenuByUrl → getRoleByBusicode → getButtonList → setPermissions

Mock.mock(/sys\/menu\/getMenuByUrl\?[^#]*CentralizedModification/, 'get', (options: MockOptions) => {
  const url = getQueryValue(options.url, 'url')
  return success({ outsideMenu: XQ_BUSICODE, url })
})

Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${XQ_BUSICODE}(?:&|$)`), 'get', () => [buildXqRole()])

Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${XQ_BUSICODE}(?:&|$)`), 'get', () => success(clone(XQ_BUTTONS)))

// 应用菜单：appNo=XQK（操作 / 查询两类）。通过分发器登记，不与 LHHSK 互相覆盖
registerAppMenu(XQ_APP_NO, (label) => {
  const base = clone(XQ_ROWS[0])
  const menu = (name: string, sort: number, permissions: string) => ({
    id: `menu-xq-${sort}`,
    name,
    url: '/service/xq/CentralizedModification',
    outsideMenu: XQ_BUSICODE,
    sort,
    type: 1,
    isShow: 1,
    isFrame: 0,
    openStyle: 0,
    permissions,
    pid: '0',
    createDate: '2026-01-01',
    creator: null,
    frameSrc: null,
    icon: null,
    parentName: null,
    updateDate: 1742451385000,
    updater: null,
    ...base
  })
  return label === '2'
    ? [menu('查询-项目名称', 1, 'TYPEQUERY')]
    : [
        menu('修改', 1, 'EDIT'),
        menu('删除', 2, 'DELETE'),
        menu('关联事项', 3, 'GLSX'),
        menu('创建部门修改', 4, 'CJBMXG'),
        menu('业扩项目退回', 5, 'YKXMTH'),
        menu('提交', 6, 'SUBMITS'),
        menu('导出', 7, 'EXPORT'),
        menu('流程履历', 8, 'PROCESS')
      ]
})

// 发起组织标志：收窄到本页部门 spOrgId=bm-xqk-01（budgetChanges 的宽泛正则覆盖不到这里）
Mock.mock(new RegExp(`workflow/cbxqsh/getFqzz\\?[^#]*spOrgId=${XQ_SP_ORG_ID}(?:&|$)`), 'post', () => success('CITY'))

// ==================== 引导 / 帮助中心 ====================

Mock.mock(new RegExp(`sysRemind/getRemindFlagByUserId\\?[^#]*moduleKey=CentralizedModification(?:&|$)`), 'get', () =>
  success(true)
)
Mock.mock(/sysRemind\/close(\?.*)?$/, 'post', () => success(true, '操作成功'))
Mock.mock(/sysRemind\/iknow(\?.*)?$/, 'post', () => success(true, '操作成功'))

// 帮助中心：按 menuId 收窄（仅本页菜单 id）
Mock.mock(new RegExp(`sys/menuConfig/getConfigByMenuId\\?[^#]*menuId=${XQ_MENU_ID}(?:&|$)`), 'get', () =>
  success({ helpInfo: '集中修改帮助：在此页面可对需求库中的项目进行集中修改、关联事项与提交审批。', status: '1' })
)
Mock.mock(new RegExp(`sys/menuConfig/listFj\\?[^#]*menuId=${XQ_MENU_ID}(?:&|$)`), 'get', () =>
  success([{ fjmc: '集中修改操作手册.pdf', uuid: 'help-xq-jzxg-pdf' }])
)
Mock.mock(/xmAttributeConfig\/downloadAttach\?[^#]*uuid=help-xq-jzxg-pdf/, 'get', () =>
  binaryResponse(new Blob(['集中修改操作手册（mock）'], { type: 'application/pdf' }), { fileName: '集中修改操作手册.pdf' })
)

// ==================== 公共代码字典 ====================

// 批量公共代码（DynamicForm 与 searchConfigHandle 走 POST /commonCode/getCommonCode）
// 该接口被多个 xq 弹窗共用；按 code 返回字典，未知 code 返回空 codes，不破坏调用方渲染
Mock.mock(/commonCode\/getCommonCode\/?(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const codes: string[] = Array.isArray(body.codes) ? body.codes : []
  const data = codes.map((code) => ({ comCode: code, codes: clone(COMMON_CODE_MAP[code] || []) }))
  return success(data)
})

// 单个公共代码（getPublicData → GET /commonCode/getData?code=xx）：仅本页用到的 code
Object.entries(COMMON_CODE_MAP).forEach(([code, data]) => {
  Mock.mock(new RegExp(`commonCode/getData\\?[^#]*code=${code}(?:&|$)`), 'get', () => success(clone(data)))
})

// 项目类型树（xmlx 树选择，GET /protypeTree/getAllProtypeTreeNew）
Mock.mock(/protypeTree\/getAllProtypeTreeNew(\?.*)?$/, 'get', () => success(clone(PROTYPE_TREE)))

// 项目类型子树（DynamicForm 的 PRO_TYPE 字段走 /protypeTree/getProtypeTreeNoMiddle）
Mock.mock(/protypeTree\/getProtypeTreeNoMiddle(\?.*)?$/, 'post', () => success(clone(PROTYPE_TREE)))

// 市归口部门 / 规模包（修改弹窗 YJDW 变更时联动）
Mock.mock(/commonCode\/getSgbm\/?(\?.*)?$/, 'post', () =>
  success([{ code: 'CTBM-NJ', name: '南京市公司归口' }, { code: 'CTBM-SZ', name: '苏州市公司归口' }])
)
Mock.mock(/commonCode\/getGmb\/?(\?.*)?$/, 'post', () =>
  success([{ code: 'GMB-2026', name: '2026年规模包' }, { code: 'GMB-2025', name: '2025年规模包' }])
)

// ==================== 动态查询列 / 表头 / 高级设置 ====================

Mock.mock(new RegExp(`xmSearchConfig/getDynamicSearchColumn\\?[^#]*searchCode=${XQ_SEARCH_CODE}(?:&|$)`), 'get', () =>
  success(clone(SEARCH_COLUMNS))
)

Mock.mock(new RegExp(`xmSearchConfig/getDynamicTableByUser\\?[^#]*searchCode=${XQ_SEARCH_CODE}(?:&|$)`), 'get', () =>
  success(clone(TABLE_COLUMNS))
)

Mock.mock(new RegExp(`xmSearchConfig/getSearchColumn\\?[^#]*searchCode=${XQ_SEARCH_CODE}(?:&|$)`), 'get', (options: MockOptions) => {
  const searchType = getQueryValue(options.url, 'searchType')
  return success(clone(buildSettingRows(searchType)))
})

// updateSearchColumn 由 jointReview/flowQuery.ts 宽泛注册（任意 searchCode 都返回成功），这里不重复注册

// ==================== 需求明细列表（getXqlrPage） ====================

const filterXqRows = (body: Record<string, any>) => {
  return XQ_ROWS.filter((row) => {
    const matchZt = !Array.isArray(body.zt) || !body.zt.length || body.zt.includes(row.zt)
    return (
      matchZt &&
      includesText(row.xmmc, body.xmmc) &&
      includesText(row.xmbm, body.xmbms) &&
      (!body.nd || row.nd === String(body.nd)) &&
      (!body.xmlx || row.xmlx === String(body.xmlx)) &&
      (!body.yjdw || row.yjdw === String(body.yjdw)) &&
      (!body.ejdw || row.ejdw === String(body.ejdw))
    )
  })
}

Mock.mock(/xmAttributeConfig\/getXqlrPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const rows = filterXqRows(body)
  return success(pageResult(clone(rows), body.page, body.limit))
})

// ==================== 待确认需求明细（getTbcPage / 类型确认） ====================

Mock.mock(/xmAttributeConfig\/getTbcPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const rows = TBC_ROWS.filter(
    (row) => includesText(row.xmmc, body.xmmc) && includesText(row.xmbm, body.xmbm)
  )
  return success(pageResult(clone(rows), body.page || body.pageSec, body.limit || body.limitSec))
})

Mock.mock(/xmAttributeConfig\/getTbcxmlxListByxmId(\?.*)?$/, 'post', (options: MockOptions) => {
  const xmId = getQueryValue(options.url, 'xmId')
  return success(clone(buildTbcProtypeList(xmId)))
})

Mock.mock(/xmAttributeConfig\/confimXmlx(\?.*)?$/, 'post', (options: MockOptions) => {
  const protypeId = getQueryValue(options.url, 'protypeId')
  const xmId = getQueryValue(options.url, 'xmId')
  const idx = TBC_ROWS.findIndex((row) => row.id === xmId)
  if (idx !== -1) TBC_ROWS.splice(idx, 1)
  return success({ protypeId, xmId }, '类型确认成功')
})

// ==================== 修改弹窗：保存 / 取码 / 部门 / 附件 ====================

Mock.mock(/xmAttributeConfig\/saveXmInfo(\?.*)?$/, 'post', () => success(true, '保存成功'))
Mock.mock(/xmAttributeConfig\/saveXmInfoTmp(\?.*)?$/, 'post', () => success(true, '暂存成功'))

Mock.mock(/xmAttributeConfig\/getXmbm(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(`CB${body.nd || new Date().getFullYear()}${String(body.seqNo || Date.now()).slice(-5)}`)
})

Mock.mock(/xmAttributeConfig\/updateCreateDept(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids: string[] = Array.isArray(body.ids) ? body.ids : []
  return success({ updated: ids.length }, '部门修改成功')
})

Mock.mock(/xmAttributeConfig\/getBmByEjdw(\?.*)?$/, 'get', (options: MockOptions) => {
  const ejdw = getQueryValue(options.url, 'ejdw')
  return success(clone(buildBmListByEjdw(ejdw)))
})

Mock.mock(/xmAttributeConfig\/uploadAttach(\?.*)?$/, 'post', () =>
  success({ uuid: `attach-${Date.now()}`, attachName: 'mock-附件.pdf' }, '附件上传成功')
)

// ==================== 关联事项（Matter.vue） ====================

Mock.mock(/yssxBasic\/getYssxBasicList(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  return success(clone(buildYssxList(String(body.nd || ''), String(body.protypeId || ''))))
})

Mock.mock(/xmAttributeConfig\/linkYssx(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const yssxId = String(body.yssxId || '')
  const xmIds: string[] = Array.isArray(body.xmIds) ? body.xmIds : String(body.xmIds || '').split(',').filter(Boolean)
  XQ_ROWS.forEach((row) => {
    if (!xmIds.includes(row.id)) return
    row.yssx_new_id = yssxId
    row.yssx = `${row.nd}年关联事项`
  })
  return success(true, '关联成功')
})

// ==================== 删除 / 退回 / 导出 ====================

Mock.mock(/xmAttributeConfig\/deleteXm(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids: string[] = Array.isArray(body.xmIds) ? body.xmIds : []
  ids.forEach((id) => {
    const idx = XQ_ROWS.findIndex((row) => row.id === id)
    if (idx !== -1) XQ_ROWS.splice(idx, 1)
  })
  return success(true, '删除成功')
})

Mock.mock(/xmAttributeConfig\/ykxmBack(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const ids: string[] = Array.isArray(body.xmIds) ? body.xmIds : []
  XQ_ROWS.forEach((row) => {
    if (!ids.includes(row.id)) return
    row.zt = 'Q01'
    row.ztName = '需求审批驳回'
  })
  return success(true, '退回成功')
})

Mock.mock(/xmAttributeConfig\/exportXm(\?.*)?$/, 'post', () =>
  binaryResponse(new Blob(['项目编码,项目名称,申报预算\nCB202600001,示例项目,520.00\n'], { type: 'text/csv' }), {
    fileName: '需求明细导出.csv'
  })
)

// ==================== 提交：直接提交 / 工作流 / 预审 / 校验 ====================

const idsFromBody = (body: any): string[] => {
  if (Array.isArray(body)) return body.map(String)
  if (Array.isArray(body.ids)) return body.ids.map(String)
  return []
}

Mock.mock(/xmAttributeConfig\/submit(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids = idsFromBody(parseBody(options))
  XQ_ROWS.forEach((row) => {
    if (!ids.includes(row.id)) return
    row.zt = 'A01'
    row.ztName = '需求审批中'
  })
  return success(true, '提交成功')
})

// 预审（preAudit）：根据所提交项目的 preAuditLevel 组合决定返回值。
// - 全集均为 null/undefined → 空 data（pass，不弹窗）
// - 任一项目 preAuditLevel==='1' → block（不可提交）
// - 任一项目 preAuditLevel==='2'（且无 level 1） → warn（弹 confirmPreAuditWarn）
// 需要从 mock 的 XQ_ROWS 中取 preAuditLevel/preAuditMsg（运行时字段，不经过 xmSearchConfig 表头配置）。
// 项目 id 前缀固定为 mock-project-，可直接从 XQ_ROWS 命中。
Mock.mock(/pre-audit-task\/preAudit(\?.*)?$/, 'post', (options: MockOptions) => {
  const ids: string[] = idsFromBody(parseBody(options))
  if (ids.length === 0) return success(null)

  const rows = XQ_ROWS.filter((row) => ids.includes(row.id))
  const levels = rows
    .map((row) => (row as any).preAuditLevel)
    .filter((level: any) => level != null)

  // 无预审标记 → pass（但返回 null 会被 runPreAudit 判为 pass，适配 success(null)）
  if (levels.length === 0) return success(null)

  if (levels.includes('1')) {
    return success({
      ruleLevel: '1',
      msg: rows
        .filter((row) => (row as any).preAuditLevel === '1')
        .map((row) => (row as any).preAuditMsg || `项目 ${row.xmbm} 预审校验不通过`)
        .join('|')
    })
  }

  // ruleLevel 2/3: warn
  const warnRows = rows.filter((row) => (row as any).preAuditLevel === '2')
  if (warnRows.length === 0) return success(null)
  return success(
    warnRows.map((row) => ({
      ruleLevel: (row as any).preAuditLevel,
      msg: (row as any).preAuditMsg || `项目【${row.xmmc}】存在预审提示|请确认是否仍需提交该数据`
    }))
  )
})

// 提交前校验（checkWhenSubmitXm）：success 嵌套
Mock.mock(/gss\/checkWhenSubmitXm(\?.*)?$/, 'post', () => success({ success: true, msg: '', data: null }))

// 是否跳过联合会审（isNeedCheck）：flag=1 + 空 msg → 直接走工作流
Mock.mock(/workflow\/cbxqsh\/isNeedCheck(\?.*)?$/, 'post', () => success({ flag: '1', msg: '' }))

// 流程最后一步业务处理（finishHandleOperations）
Mock.mock(/workflow\/cbxqsh\/finishHandleOperations(\?.*)?$/, 'post', () => success(true, '提交成功'))

// 集中修改提交（submitCbxqsh → /workflow/cbxqsh/submitWf）
Mock.mock(/workflow\/cbxqsh\/submitWf(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const wfData = body.wfData || {}
  const ids = String(wfData.XMIDS || '').split(',').filter(Boolean)
  XQ_ROWS.forEach((row) => {
    if (!ids.includes(row.id)) return
    row.zt = 'A01'
    row.ztName = '需求审批中'
  })
  return success(true, '提交成功')
})

// 工作流初始化脚本（initWfJavascript）：返回极简 JS，直接回调下一步处理人
Mock.mock(/workflow\/initWfJavascript(\?.*)?$/, 'post', () => {
  const js = `
    (function(){
      var next = '张华/财务预算专职';
      if (typeof window.crAndFinFir === 'function') { window.crAndFinFir(next); }
      else if (typeof window.finNode === 'function') { window.finNode(next); }
    })();
  `
  const fn = '/* no-op functionName */'
  return success({ javascript: js, functionName: fn })
})

// 获取下一步处理人（getNextPersionAndPathFromStart）
Mock.mock(/workflow\/getNextPersionAndPathFromStart(\?.*)?$/, 'post', () =>
  success('张华/财务预算专职')
)

// ==================== 流程履历（workflowProcess.vue） ====================

Mock.mock(/lcll\/getLcll(\?.*)?$/, 'get', (options: MockOptions) => {
  const id = getQueryValue(options.url, 'id')
  return success({ records: clone(buildProcessRows(id)), total: 4, current: 1, size: 20 })
})

Mock.mock(/xmMainLog\/getMainOpLog(\?.*)?$/, 'post', (options: MockOptions) => {
  const body = parseBody(options)
  const rows = buildOpLogRows(String(body.xmId || ''))
  return success({ records: clone(rows), total: rows.length, current: body.page || 1, size: body.limit || 20 })
})

// 工作流轨迹图（getWfTracking → window.open(res.data)）
Mock.mock(/workflow\/getWfTracking(\?.*)?$/, 'post', () => success('about:blank'))
