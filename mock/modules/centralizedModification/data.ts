/**
 * 集中修改（/service/xq/CentralizedModification）mock 样例数据
 *
 * 字典编码刻意与 modules/budgetChanges.ts 对齐（单位 DW001~DW003、分类 01/0101/010101），
 * 这样二级单位、二三级分类的级联（bizOrgTree/getEjdw、commonCode/getCommonCodeByParentCode
 * 都注册在 budgetChanges 中）无需重复注册即可联动。
 *
 * 列表行 id 统一用 `mock-project-xxxx`：修改弹窗的 getXmInfo / getTabColumns
 * 已由 modules/aiSmartTaskAudit.ts 按该前缀提供完整动态表单 fixture，直接复用。
 */

/** 本页 outsideMenu / menuCode（开发态 mock 专用） */
export const XQ_BUSICODE = 'XQK-XQJZXG'

/** getAppMenu 的应用编码 */
export const XQ_APP_NO = 'XQK'

/** 列表查询配置编码（searchCode），与 DynamicReports 默认值一致 */
export const XQ_SEARCH_CODE = 'XQLR'

/** 本页角色所属部门 / 单位，用于收窄 getFqzz、getBqshFlag */
export const XQ_SP_ORG_ID = 'bm-xqk-01'
export const XQ_DW_ID = 'dw-xqk-01'

/** 提交走工作流时的流程编码（写在行数据 xqlr_wf_code 上） */
export const XQ_WF_CODE = 'XQ-CBXQSH-MOCK'

/** 按钮权限：与模板中的 v-permission 一一对应。
 *  SUBMIT / SUBMITS 是两套提交（复制提交 / 校验提交），按钮文案相同，
 *  这里只放 SUBMITS，避免页面出现两个「提 交」。 */
export const XQ_BUTTONS = ['EDIT', 'DELETE', 'GLSX', 'CJBMXG', 'YKXMTH', 'SUBMITS', 'EXPORT', 'PROCESS', 'TYPEQUERY']

export const XQ_MENU_ID = 'menu-xqk-jzxg'

export const buildXqRole = () => ({
  id: 'sprole-xqk-01',
  name: '需求库管理员（市公司）',
  code: 'SCWYSZZ',
  role_id: 'role-xqk-01',
  specialorgid: XQ_SP_ORG_ID,
  specialorgname: '财务预算专职',
  specialorgcode: 'BM_CWZC',
  org_id: XQ_DW_ID,
  org_name: '国网南京供电公司',
  namecode: 'mock_xqk_admin',
  busicode: XQ_BUSICODE
})

// ==================== 字典（与 budgetChanges 编码对齐） ====================

const CURRENT_YEAR = new Date().getFullYear()

export const YJDW_LIST = [
  { code: 'DW001', name: '国网江苏省电力有限公司' },
  { code: 'DW002', name: '国网南京供电公司' },
  { code: 'DW003', name: '国网苏州供电公司' }
]

/** 与 budgetChanges 的 UNITS[].children 保持一致 */
export const EJDW_LIST = [
  { code: 'DW001-01', name: '发展策划部', parent: 'DW001' },
  { code: 'DW001-02', name: '设备管理部', parent: 'DW001' },
  { code: 'DW002-01', name: '项目管理中心', parent: 'DW002' },
  { code: 'DW002-02', name: '运维检修部', parent: 'DW002' },
  { code: 'DW003-01', name: '建设管理部', parent: 'DW003' },
  { code: 'DW003-02', name: '数字化工作部', parent: 'DW003' }
]

export const YJFL_LIST = [
  { code: '01', name: '电网基建' },
  { code: '02', name: '生产技改' },
  { code: '03', name: '生产大修' },
  { code: '04', name: '数字化建设' }
]

export const ND_LIST = [
  { code: String(CURRENT_YEAR), name: `${CURRENT_YEAR}年` },
  { code: String(CURRENT_YEAR - 1), name: `${CURRENT_YEAR - 1}年` }
]

/** 需求状态：Q01/Q02/Q03 在表格里标红（见 useRequirementCartWorkbench 的 rowStyle） */
export const ZT_LIST = [
  { code: 'Q00', name: '需求草稿' },
  { code: 'Q01', name: '需求审批驳回' },
  { code: 'Q02', name: '会审驳回' },
  { code: 'A01', name: '需求审批中' },
  { code: 'A03', name: '需求审批通过' }
]

export const XMXZ_LIST = [
  { code: '01', name: '新建' },
  { code: '02', name: '扩建' },
  { code: '03', name: '改造' },
  { code: '04', name: '大修' }
]

export const XMJHLX_LIST = [
  { code: '01', name: '基建' },
  { code: '02', name: '技改' },
  { code: '03', name: '大修' },
  { code: '04', name: '信息化' }
]

/** 事项实施年度（Matter.vue 的 getPublicData('ZLYS_XMJHSSND')） */
export const XMJHSSND_LIST = ND_LIST

/** 批量查询公共代码（/commonCode/getCommonCode）的字典表 */
export const COMMON_CODE_MAP: Record<string, Array<{ code: string; name: string }>> = {
  NDCX: ND_LIST,
  XQLR_ZT: ZT_LIST,
  XMXZ: XMXZ_LIST,
  ZLYS_XMJHLX: XMJHLX_LIST,
  GWXMFL: YJFL_LIST
}

// ==================== 项目类型树（xmlx 树选择） ====================
// 走 /protypeTree/getAllProtypeTreeNew（真实接口，其他模块未 mock，避免互相覆盖）。
// 节点用 id/name/children，与 useRequirementCartWorkbench 里写死的 treeProps 一致。

export const PROTYPE_TREE = [
  {
    id: 'PT01',
    name: '基建项目',
    children: [
      { id: 'PT0101', name: '输变电工程' },
      { id: 'PT0102', name: '配电工程' }
    ]
  },
  {
    id: 'PT02',
    name: '技改项目',
    children: [
      { id: 'PT0201', name: '一次设备技改' },
      { id: 'PT0202', name: '二次设备技改' }
    ]
  },
  {
    id: 'PT03',
    name: '大修项目',
    children: [
      { id: 'PT0301', name: '线路大修' },
      { id: 'PT0302', name: '变电大修' }
    ]
  },
  {
    id: 'PT04',
    name: '信息化项目',
    children: [{ id: 'PT0401', name: '业务应用建设' }]
  }
]

export const PROTYPE_NAME_MAP: Record<string, string> = {
  PT01: '基建项目',
  PT0101: '输变电工程',
  PT0102: '配电工程',
  PT02: '技改项目',
  PT0201: '一次设备技改',
  PT0202: '二次设备技改',
  PT03: '大修项目',
  PT0301: '线路大修',
  PT0302: '变电大修',
  PT04: '信息化项目',
  PT0401: '业务应用建设'
}

/** 叶子类型 → 分类三级编码，与 budgetChanges 的 yjfl/ejfl/sjfl 编码规则一致 */
export const PROTYPE_CLASSIFY_MAP: Record<string, { yjfl: string; ejfl: string; sjfl: string; xmjhlx: string }> = {
  PT0101: { yjfl: '01', ejfl: '0101', sjfl: '010101', xmjhlx: '01' },
  PT0102: { yjfl: '01', ejfl: '0101', sjfl: '010101', xmjhlx: '01' },
  PT0201: { yjfl: '02', ejfl: '0201', sjfl: '020101', xmjhlx: '02' },
  PT0202: { yjfl: '02', ejfl: '0201', sjfl: '020101', xmjhlx: '02' },
  PT0301: { yjfl: '03', ejfl: '0301', sjfl: '030101', xmjhlx: '03' },
  PT0302: { yjfl: '03', ejfl: '0301', sjfl: '030101', xmjhlx: '03' },
  PT0401: { yjfl: '04', ejfl: '0401', sjfl: '040101', xmjhlx: '04' }
}

export const CLASSIFY_NAME_MAP: Record<string, string> = {
  '01': '电网基建',
  '0101': '输电工程',
  '010101': '输电线路工程',
  '02': '生产技改',
  '0201': '变电设备改造',
  '020101': '主变压器改造',
  '03': '生产大修',
  '0301': '输电线路大修',
  '030101': '杆塔及基础大修',
  '04': '数字化建设',
  '0401': '信息系统建设',
  '040101': '业务应用建设'
}

// ==================== 动态查询条件（xmSearchConfig/getDynamicSearchColumn, searchCode=XQLR） ====================
// useRequirementCartWorkbench.searchConfigHandle 的三种取值分支：
//   1) dyff + ggdm + 无 dependOnColumn → 批量 /commonCode/getCommonCode（codes 数组，按顺序回 codes 字段）
//   2) dyff + 无 ggdm + 无 dependOnColumn → 单独请求 dyff；code==='xmlx' 走 GET，其余走 POST
//   3) 有 dependOnColumn → 由 handleFieldChange 在父字段变化时联动请求（仅支持 ejdw/ejfl/sjfl）
// link=true 才会在模板里渲染。

export const SEARCH_COLUMNS = [
  { id: 'sc-01', code: 'xmmc', name: '项目名称', type: 'input', link: true, dyff: '', ggdm: '', dependOnColumn: '', multiple: false, sort: 1 },
  { id: 'sc-02', code: 'xmbms', name: '项目编码', type: 'inputText', link: true, dyff: '', ggdm: '', dependOnColumn: '', multiple: false, sort: 2 },
  {
    id: 'sc-03',
    code: 'nd',
    name: '年度',
    type: 'select',
    link: true,
    dyff: '/commonCode/getCommonCode',
    ggdm: 'NDCX',
    dependOnColumn: '',
    multiple: false,
    sort: 3
  },
  {
    id: 'sc-04',
    code: 'xmlx',
    name: '项目类型',
    type: 'treeSelect',
    link: true,
    // 无 ggdm 且 code==='xmlx' → 走 baseService.get(dyff)
    dyff: '/protypeTree/getAllProtypeTreeNew',
    ggdm: '',
    dependOnColumn: '',
    multiple: false,
    sort: 4
  },
  {
    id: 'sc-05',
    code: 'zt',
    name: '项目状态',
    type: 'select',
    link: true,
    dyff: '/commonCode/getCommonCode',
    ggdm: 'XQLR_ZT',
    dependOnColumn: '',
    multiple: true,
    sort: 5
  },
  {
    id: 'sc-06',
    code: 'xmxz',
    name: '项目性质',
    type: 'select',
    link: true,
    dyff: '/commonCode/getCommonCode',
    ggdm: 'XMXZ',
    dependOnColumn: '',
    multiple: false,
    sort: 6
  },
  {
    id: 'sc-07',
    code: 'yjdw',
    name: '一级单位',
    type: 'select',
    link: true,
    // 无 ggdm → POST dyff({bmId,dwId})；该接口由 budgetChanges mock 提供（UNITS）
    dyff: '/bizOrgTree/getYjdw',
    ggdm: '',
    dependOnColumn: '',
    multiple: false,
    sort: 7
  },
  {
    id: 'sc-08',
    code: 'ejdw',
    name: '二级单位',
    type: 'select',
    link: true,
    // 联动：handleFieldChange('yjdw') → POST dyff({YJDW,parentCode})
    dyff: '/bizOrgTree/getEjdw',
    ggdm: '',
    dependOnColumn: 'yjdw',
    multiple: false,
    sort: 8
  },
  {
    id: 'sc-09',
    code: 'yjfl',
    name: '一级分类',
    type: 'select',
    link: true,
    dyff: '/commonCode/getCommonCode',
    ggdm: 'GWXMFL',
    dependOnColumn: '',
    multiple: false,
    sort: 9
  },
  {
    id: 'sc-10',
    code: 'ejfl',
    name: '二级分类',
    type: 'select',
    link: true,
    // 联动：handleFieldChange('yjfl') → POST dyff({code: yjfl.ggdm, parentCode})
    dyff: '/commonCode/getCommonCodeByParentCode',
    ggdm: 'GWXMFL',
    dependOnColumn: 'yjfl',
    multiple: false,
    sort: 10
  },
  {
    id: 'sc-11',
    code: 'sjfl',
    name: '三级分类',
    type: 'select',
    link: true,
    dyff: '/commonCode/getCommonCodeByParentCode',
    ggdm: 'GWXMFL',
    dependOnColumn: 'ejfl',
    multiple: false,
    sort: 11
  }
]

// ==================== 动态列表列（xmSearchConfig/getDynamicTableByUser, searchCode=XQLR） ====================
// composable 取 columnKey → field、columnValue → title；amount 列自动右对齐并格式化。

export const TABLE_COLUMNS = [
  { id: 'tc-01', columnKey: 'xmbm', columnValue: '项目编码' },
  { id: 'tc-02', columnKey: 'xmmc', columnValue: '项目名称' },
  { id: 'tc-03', columnKey: 'ztName', columnValue: '项目状态' },
  { id: 'tc-04', columnKey: 'amount', columnValue: '申报预算（万元）' },
  { id: 'tc-05', columnKey: 'xmlxName', columnValue: '项目类型' },
  { id: 'tc-06', columnKey: 'yssx', columnValue: '关联事项' },
  { id: 'tc-07', columnKey: 'sjflName', columnValue: '三级分类' },
  { id: 'tc-08', columnKey: 'yjdwName', columnValue: '一级单位' },
  { id: 'tc-09', columnKey: 'ejdwName', columnValue: '二级单位' },
  { id: 'tc-10', columnKey: 'gkbm_name', columnValue: '归口部门' },
  { id: 'tc-11', columnKey: 'cbzxName', columnValue: '成本中心' },
  { id: 'tc-12', columnKey: 'zdtx', columnValue: '重点专项' },
  { id: 'tc-13', columnKey: 'lyxt_name', columnValue: '来源系统' },
  { id: 'tc-14', columnKey: 'cjr', columnValue: '创建人' },
  { id: 'tc-15', columnKey: 'createTime', columnValue: '创建时间' }
]

/** 高级设置抽屉（getSearchColumn）行结构：name / link / sfmrzs(禁用开关) */
export const buildSettingRows = (searchType: string) => {
  const source = String(searchType) === '2' ? TABLE_COLUMNS : SEARCH_COLUMNS
  return source.map((item: any, index) => ({
    id: item.id,
    code: item.code || item.columnKey,
    name: item.name || item.columnValue,
    link: true,
    // 前两项设为默认展示、开关禁用，便于验证 sfmrzs 逻辑
    sfmrzs: index < 2
  }))
}

// ==================== 需求明细列表行 ====================

const PROJECT_NAMES = [
  '500千伏东善桥变电站主变扩建工程',
  '南京地区配电自动化终端改造',
  '苏州园区输电线路综合在线监测',
  '无锡供电公司数字化仓储建设',
  '沿江高铁牵引站配套电网工程',
  '老旧变电站继电保护装置改造',
  '城市核心区电缆通道隐患治理',
  '新能源场站调度数据接入改造'
]

const LEAF_TYPES = Object.keys(PROTYPE_CLASSIFY_MAP)
const GKBM_LIST = ['发展策划部', '设备管理部', '营销部', '数字化工作部']
const LYXT_LIST = ['需求库', '营销业扩', 'PMS3.0']
const CREATORS = ['张华', '李敏', '王强', '赵磊']

const round = (value: number) => Number(value.toFixed(2))
const pad = (value: number, length = 4) => String(value).padStart(length, '0')

export interface XqRow {
  [key: string]: any
  id: string
  xmbm: string
  xmmc: string
}

const buildXqRow = (sequence: number): XqRow => {
  const index = sequence - 1
  const leaf = LEAF_TYPES[index % LEAF_TYPES.length]
  const classify = PROTYPE_CLASSIFY_MAP[leaf]
  const yjdw = YJDW_LIST[index % YJDW_LIST.length]
  const ejdwOptions = EJDW_LIST.filter((item) => item.parent === yjdw.code)
  const ejdw = ejdwOptions[index % ejdwOptions.length]
  const zt = ZT_LIST[index % ZT_LIST.length]
  const xmxz = XMXZ_LIST[index % XMXZ_LIST.length]
  const amount = round(320 + sequence * 27.35)
  // 每 5 条留 1 条未关联事项，用于验证「请先关联事项」拦截
  const hasYssx = sequence % 5 !== 0
  // 每 7 条留 1 条只读，用于验证「不允许修改」拦截
  const readOnly = sequence % 7 === 0

  return {
    id: `mock-project-${pad(sequence)}`,
    xmbm: `CB${CURRENT_YEAR}${pad(sequence, 5)}`,
    xmmc: `${PROJECT_NAMES[index % PROJECT_NAMES.length]}${sequence > PROJECT_NAMES.length ? `（${sequence}）` : ''}`,
    nd: sequence % 9 === 0 ? String(CURRENT_YEAR - 1) : String(CURRENT_YEAR),
    zt: zt.code,
    ztName: zt.name,
    amount,
    xmlx: leaf,
    xmlxName: PROTYPE_NAME_MAP[leaf],
    xmxz: xmxz.code,
    xmxzName: xmxz.name,
    xmjhlx: classify.xmjhlx,
    yjfl: classify.yjfl,
    yjflName: CLASSIFY_NAME_MAP[classify.yjfl],
    ejfl: classify.ejfl,
    ejflName: CLASSIFY_NAME_MAP[classify.ejfl],
    sjfl: classify.sjfl,
    sjflName: CLASSIFY_NAME_MAP[classify.sjfl],
    yjdw: yjdw.code,
    yjdwName: yjdw.name,
    ejdw: ejdw.code,
    ejdwName: ejdw.name,
    cbzxName: `${ejdw.name}成本中心`,
    gkbm_name: sequence % 2 === 0 ? '发展策划部' : '设备管理部',
    zdtx: sequence % 3 === 0 ? '数字化转型' : '',
    yssx: hasYssx ? `${CURRENT_YEAR}年${PROTYPE_NAME_MAP[leaf]}预算事项` : '',
    yssx_new_id: hasYssx ? `yssx-${pad(sequence)}` : '',
    lyxt_name: sequence % 4 === 0 ? '业扩报装' : '需求库',
    cjr: CREATORS[index % CREATORS.length],
    createTime: `${CURRENT_YEAR}-0${(index % 6) + 1}-${pad((index % 27) + 1, 2)} 09:${pad((index % 59) + 1, 2)}:00`,
    read_only: readOnly ? '1' : '0',
    create_dep_id: XQ_SP_ORG_ID,
    createDeptName: '财务预算专职',
    // 提交前置校验字段：市管部门 / 事项归口部门必须一致才允许批量提交
    ctbm: 'CTBM-NJ',
    sxgkbm: 'SXGKBM-FZ',
    sfxysgksp: '0',
    // 1 = 走工作流提交；0 = 直接提交（submit 接口）
    sfxyxqsh: sequence % 3 === 0 ? '0' : '1',
    sfgmb: '0',
    xqlr_wf_code: XQ_WF_CODE,
    // 联合会审退回评审结论：0 表示「不通过」，会触发重新走流程的确认弹窗
    xxhs_jl_cw: sequence % 11 === 0 ? 0 : 1,
    xxhs_jl_fz: 1,
    // 预审级别标记（null=无预审数据/通过，2=warn 弹提示，1=block 拦截提交）
    preAuditLevel:
      sequence % 9 === 2 ? '2' : (sequence % 9 === 3 ? '1' : null),
    preAuditMsg:
      sequence % 9 === 2
        ? '该项目预算金额超出年度计划|建议核实后提交'
        : (sequence % 9 === 3
          ? '该项目尚未完成归口部门备案|请先在专业系统中完成备案后再提交'
          : undefined)
  }
}

/** 需求明细行（内存态，支持删除 / 关联事项 / 提交后改状态） */
export const XQ_ROWS: XqRow[] = Array.from({ length: 42 }, (_, index) => buildXqRow(index + 1))

// ==================== 待确认需求明细行（xmAttributeConfig/getTbcPage） ====================
// 列固定写在 composable 的 secColumns 里，字段名需对齐：
// xmbm / xmmc / pack / amount / yjfl / ejfl / sjfl / yjdw / ejdw / applyCenter / createDeptName / creator

export interface TbcRow {
  [key: string]: any
  xmId: string
  xmbm: string
  xmmc: string
}

const buildTbcRow = (sequence: number): TbcRow => {
  const index = sequence - 1
  const leaf = LEAF_TYPES[index % LEAF_TYPES.length]
  const classify = PROTYPE_CLASSIFY_MAP[leaf]
  const yjdw = YJDW_LIST[index % YJDW_LIST.length]
  const ejdwOptions = EJDW_LIST.filter((item) => item.parent === yjdw.code)
  const ejdw = ejdwOptions[index % ejdwOptions.length]

  return {
    xmId: `mock-tbc-${pad(sequence)}`,
    id: `mock-tbc-${pad(sequence)}`,
    xmbm: `TBC${CURRENT_YEAR}${pad(sequence, 5)}`,
    xmmc: `${PROJECT_NAMES[(index + 3) % PROJECT_NAMES.length]}（待确认类型）`,
    pack: sequence % 4 === 0,
    amount: round(180 + sequence * 33.6),
    yjfl: CLASSIFY_NAME_MAP[classify.yjfl],
    ejfl: CLASSIFY_NAME_MAP[classify.ejfl],
    sjfl: CLASSIFY_NAME_MAP[classify.sjfl],
    yjdw: yjdw.name,
    ejdw: ejdw.name,
    applyCenter: `${ejdw.name}成本中心`,
    createDeptName: '财务预算专职',
    creator: CREATORS[index % CREATORS.length],
    // 候选项目类型（类型确认弹窗 getTbcxmlxListByxmId）
    xmlxOptions: [leaf, LEAF_TYPES[(index + 1) % LEAF_TYPES.length]]
  }
}

export const TBC_ROWS: TbcRow[] = Array.from({ length: 13 }, (_, index) => buildTbcRow(index + 1))

// ==================== 流程履历（lcll/getLcll） ====================

export const buildProcessRows = (xmId: string) => {
  const stages = [
    { flowName: '需求填报', nodename: '需求录入', spjg: 'Y', spyj: '资料齐全，提交审批' },
    { flowName: '部门审核', nodename: '归口部门审核', spjg: 'Y', spyj: '同意上报' },
    { flowName: '财务审核', nodename: '财务预算专职审核', spjg: 'TH', spyj: '投资估算依据不足，退回补充' },
    { flowName: '财务审核', nodename: '财务预算专职审核', spjg: 'Y', spyj: '已补充材料，同意' }
  ]
  return stages.map((stage, index) => ({
    ...stage,
    flowId: `flow-${xmId}-${index + 1}`,
    auditStatusName: stage.spjg === 'TH' ? '已退回' : '已通过',
    creator: CREATORS[index % CREATORS.length],
    createDep: '财务预算专职',
    auditor: CREATORS[(index + 1) % CREATORS.length],
    auditDep: index < 2 ? '归口部门' : '财务部',
    auditTime: `${CURRENT_YEAR}-0${index + 2}-${pad(index * 3 + 5, 2)} 14:${pad(index * 7 + 10, 2)}:00`
  }))
}

/** 关键操作日志（xmMainLog/getMainOpLog） */
export const buildOpLogRows = (xmId: string) => {
  const row = XQ_ROWS.find((item) => item.id === xmId)
  return [
    {
      xmid: xmId,
      operationType: '新增需求',
      flowStatusBefore: '',
      flowStatusAfter: '需求草稿',
      operatorName: row?.cjr || '张华',
      operationBudget: row?.amount || 0,
      operateTime: `${CURRENT_YEAR}-02-11 10:20:00`
    },
    {
      xmid: xmId,
      operationType: '修改申报预算',
      flowStatusBefore: '需求草稿',
      flowStatusAfter: '需求草稿',
      operatorName: row?.cjr || '张华',
      operationBudget: row?.amount || 0,
      operateTime: `${CURRENT_YEAR}-03-06 16:05:00`
    }
  ]
}

// ==================== 类型确认候选(getTbcxmlxListByxmId) ====================
// QueryProTypeModal 取 item.code 作为 value、item.name 作为 label

export const buildTbcProtypeList = (xmId: string) => {
  const row = TBC_ROWS.find((item) => item.id === xmId)
  const candidates = row?.xmlxOptions || LEAF_TYPES.slice(0, 2)
  return candidates.map((code: string) => ({ code, name: PROTYPE_NAME_MAP[code] || code }))
}

// ==================== 创建部门修改(getBmByEjdw) ====================
// CreateDeptEditModal 取 item.code / item.name 渲染下拉

export const buildBmListByEjdw = (ejdw: string) => {
  const base = ejdw || 'DW002-01'
  return [
    { id: `${base}-bm-01`, code: 'BM_CWZC', name: '财务预算专职' },
    { id: `${base}-bm-02`, code: 'BM_FZJH', name: '发展策划部' },
    { id: `${base}-bm-03`, code: 'BM_SBGL', name: '设备管理部' }
  ]
}

// ==================== 关联事项(Matter.vue getYssxBasicList) ====================
// Matter 取 item.yssxId 作为 value、item.yssxmc 作为 label

export const buildYssxList = (nd: string, protypeId: string) => {
  const typeName = PROTYPE_NAME_MAP[protypeId] || '通用'
  return Array.from({ length: 4 }, (_, index) => ({
    id: `yssx-${protypeId}-${pad(index + 1)}`,
    yssxId: `yssx-${protypeId}-${pad(index + 1)}`,
    nd,
    protypeId,
    yssxmc: `${nd}年${typeName}预算事项${index + 1}`,
    yssxbm: `YSSX-${nd}-${protypeId}-${pad(index + 1)}`,
    amount: round(500 + index * 120.5)
  }))
}
