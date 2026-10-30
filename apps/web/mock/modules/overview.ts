import Mock from 'mockjs'
import ExcelJS from 'exceljs'
import { binaryResponse, fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const MENU_URL = '/service/overview/index'
const BUSICODE = 'XMZL-OVERVIEW'

// 新路径的页面入口：菜单 → 角色 → 按钮权限，均限定在总览页内。
Mock.mock(/sys\/menu\/getMenuByUrl\?(?:[^#]*&)?url=(?:\/|%2[fF])service(?:\/|%2[fF])overview(?:\/|%2[fF])index(?:&|$)/, 'get', () =>
  success({ id: 'menu-overview', name: '总览', outsideMenu: BUSICODE, url: MENU_URL })
)
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${BUSICODE}(?:&|$)`), 'get', (options: MockOptions) => [
  {
    id: 'sprole-overview-01',
    name: '省公司总览查询人员',
    code: 'SCWYSZZ',
    role_id: 'role-overview-01',
    specialorgid: 'bm-overview-01',
    specialorgname: '财务预算专职',
    specialorgcode: 'BM_CWZC',
    org_id: 'DW001',
    org_name: '国网江苏省电力有限公司',
    userId: getQueryValue(options.url, 'userId'),
    busicode: BUSICODE
  }
])
// 总览筛选、阶段穿透及下载目前不依赖按钮权限码。
Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${BUSICODE}(?:&|$)`), 'get', () => success([]))

// 组织权限：选择权限后按所选 dwId 返回 orgFlag / dwsxId，前端据此限定组织类型切换。
// 演示映射：省级单位 DW001（默认角色单位）展示全部；DW002 起的地市公司只展示地市公司；
// ZS 开头的直属单位与 BM 开头的部门本部只展示直属单位及本部。
// 本地验证受限范围时，把上方 getRoleByBusicode mock 的 org_id 改成 DW002 / ZS001 / BM001 即可。
Mock.mock(/\/xmzl\/getOrgFlag(?:\?[^#]*)?$/, 'get', (options: MockOptions) => {
  const dwId = String(getQueryValue(options.url, 'dwId') || '')
  if (!dwId) return fail('单位 dwId 不能为空', 400)
  let scope = { orgFlag: 'PROVINCE', dwsxId: '' }
  if (/^ZS/.test(dwId) || /^BM/.test(dwId)) scope = { orgFlag: 'CITY', dwsxId: 'GSSX_ZSDW' }
  else if (/^DW/.test(dwId) && dwId !== 'DW001') scope = { orgFlag: 'CITY', dwsxId: 'GSSX_GDGS' }
  return success(scope)
})

// 公共代码（组织类型 / 占比曲线默认项 / 排序选项）：页面改用 POST /commonCode/getCommonCode 一次批量取回，
// 演示数据登记在 mock/modules/centralizedModification/data.ts 的 COMMON_CODE_MAP；
// 本地验证其它阶段时在该表增删 XMZL_RATIO_COM / XMZL_STAGE_SORT_COM 的 code 即可。

// 仅用于开发演示：金额为万元，数量为项目项数；总览、阶段详情与穿透由同一组明细汇总。
const stages = [
  { code: '01', name: '需求储备库', statuses: ['待提交', '审核中', '已入库'] },
  { code: '02', name: '联合会审', statuses: ['待会审', '会审中', '已会审'] },
  { code: '03', name: '项目储备库', statuses: ['待入库', '已入库'] },
  { code: '04', name: '立项执行', statuses: ['待立项', '已立项', '执行中'] }
]

const cities = ['南京', '苏州', '无锡', '徐州', '常州', '南通', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁']
// 直属单位演示数据保持 35 家左右，用于本地验证分类较多时横轴标签全量显示。
// 柱状图横轴名称与后端返回的简称口径一致，均不超过 5 个字。
const directUnits = [
  '电科院',
  '经研院',
  '建设公司',
  '检修公司',
  '信通公司',
  '超高压公司',
  '送变电公司',
  '特高压公司',
  '设计院',
  '监理公司',
  '造价咨询',
  '调控中心',
  '供服中心',
  '客服中心',
  '营销中心',
  '计量中心',
  '物资公司',
  '招标中心',
  '交易中心',
  '规划中心',
  '大数据中心',
  '网安中心',
  '应急中心',
  '综合能源',
  '电动汽车',
  '新能源',
  '抽蓄公司',
  '财务共享',
  '审计中心',
  '法务中心',
  '综合服务',
  '融媒体中心',
  '管培中心',
  '技培中心',
  '离退休中心'
]
const units = [
  ...cities.map((name, index) => ({ code: `DW${String(index + 2).padStart(3, '0')}`, name, searchType: 1 })),
  ...directUnits.map((name, index) => ({ code: `ZS${String(index + 1).padStart(3, '0')}`, name, searchType: 2 }))
]
// 省专业归口部门编码与 mock/modules/jointReview 的 getGkbmInProvince（gkbm-001 起）对齐，
// 保证总览页「省专业归口」下拉选中的编码能命中这里的演示明细；前三个部门名称也与该接口一致。
const specialties = ['财务部', '发展策划部', '设备管理部', '建设部', '营销部', '数字化部'].map((name, index) => ({
  code: `gkbm-${String(index + 1).padStart(3, '0')}`,
  name
}))
// 项目类型演示数据按真实口径收敛为四类。后两类名称自带预算类型，因此每条记录
// 按项目类型固定归属省级 / 市域统筹，保证两个饼图与两块排名的筛选结果相互自洽。
const projectTypes = [
  { code: 'XMLX01', name: '检修运维成本', provinceBudget: false },
  { code: 'XMLX02', name: '研究开发专项', provinceBudget: true },
  { code: 'XMLX03', name: '其他运营费用-省级统筹', provinceBudget: true },
  { code: 'XMLX04', name: '其他运营费用-市级统筹', provinceBudget: false }
]

interface StatisticRecord {
  unitCode: string
  specialtyCode: string
  stageIndex: number
  statusIndex: number
  xmlxId: string
  provinceBudget: boolean
  month: number
  amount: number
  num: number
}

const buildRecords = (year: string, month?: string | number): StatisticRecord[] =>
  units
    .flatMap((unit, unitIndex) =>
      specialties.flatMap((specialty, specialtyIndex) =>
        stages.map((stage, stageIndex) => {
          const seed = Number(year) + unitIndex * 7 + specialtyIndex * 3 + stageIndex * 5
          const num = 3 + (seed % 20)
          // 项目类型与预算类型同源：省级统筹类项目只落在省级统筹、市级统筹类只落在市域统筹，
          // 避免按预算类型筛选排名时出现「其他运营费用-市级统筹」等自相矛盾的行。
          const projectType = projectTypes[(unitIndex + specialtyIndex + stageIndex) % projectTypes.length]
          return {
            unitCode: unit.code,
            specialtyCode: specialty.code,
            stageIndex,
            statusIndex: seed % stage.statuses.length,
            xmlxId: projectType.code,
            provinceBudget: projectType.provinceBudget,
            month: ((unitIndex + specialtyIndex * 2 + stageIndex) % 12) + 1,
            amount: num * (specialtyIndex + 2),
            num
          }
        })
      )
    )
    .filter((record) => month === undefined || month === '' || record.month === Number(month))

const sumRecords = (records: StatisticRecord[]) =>
  records.reduce((total, record) => ({ amount: total.amount + record.amount, num: total.num + record.num }), { amount: 0, num: 0 })
const percent = (value: number, total: number) => (total ? Number(((value / total) * 100).toFixed(2)) : 0)
const statistics = (records: StatisticRecord[], total: { amount: number; num: number }) => {
  const values = sumRecords(records)
  return { ...values, amountZb: percent(values.amount, total.amount), numZb: percent(values.num, total.num) }
}

const validateQuery = (params: Record<string, unknown>, requiresUnit = true) => {
  if (typeof params.jhssnd !== 'string' || !/^\d{4}$/.test(params.jhssnd)) return '计划实施年度 jhssnd 必须为四位年份'
  if (requiresUnit && (typeof params.dwId !== 'string' || !params.dwId.trim())) return '当前单位 dwId 不能为空'
  if (params.yd !== undefined && params.yd !== '' && (!Number.isInteger(Number(params.yd)) || Number(params.yd) < 1 || Number(params.yd) > 12)) {
    return '月度 yd 必须为空或 1 至 12 的整数'
  }
  return ''
}

// 命中演示单位编码时查询该单位；其他角色单位编码按全省演示范围处理，不模拟真实权限。
const scopeRecords = (records: StatisticRecord[], dwId: string) =>
  units.some((unit) => unit.code === dwId) ? records.filter((record) => record.unitCode === dwId) : records

/** 组织类型 searchType：1 地市公司、2 直属单位，空值或 0 表示全省（不限单位类型）。 */
const filterUnitsBySearchType = (searchType: unknown) =>
  searchType === undefined || searchType === null || searchType === '' || Number(searchType) === 0
    ? units
    : units.filter((unit) => unit.searchType === Number(searchType))

/** 多选筛选值：接口约定为编码数组，这里兼容单个字符串；未传 / 空数组表示不筛选。 */
const toCodeList = (value: unknown): string[] =>
  (Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [] : [value])
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)

/**
 * 项目单位 / 省专业归口筛选（chooseYjdws / chooseZybms）：
 * 一级单位按 unitCode、省专业归口按 specialtyCode 精确匹配；两者同时传入时取交集。
 */
const filterRecordsByOrg = (records: StatisticRecord[], params: Record<string, any>): StatisticRecord[] => {
  const yjdws = new Set(toCodeList(params.chooseYjdws))
  const zybms = new Set(toCodeList(params.chooseZybms))
  if (!yjdws.size && !zybms.size) return records
  return records.filter((record) => (!yjdws.size || yjdws.has(record.unitCode)) && (!zybms.size || zybms.has(record.specialtyCode)))
}

const buildGroups = (groups: { code: string; name: string }[], records: StatisticRecord[], field: 'unitCode' | 'specialtyCode') =>
  groups.flatMap((group) => {
    const groupRecords = records.filter((record) => record[field] === group.code)
    if (!groupRecords.length) return []
    const total = sumRecords(groupRecords)
    return [
      {
        ...group,
        ...total,
        datas: stages.map((stage, stageIndex) => ({
          ...statistics(
            groupRecords.filter((record) => record.stageIndex === stageIndex),
            total
          ),
          jdbm: stage.code,
          jdmc: stage.name,
          sortCode: stageIndex + 1,
          yjdw: field === 'unitCode' ? group.code : ''
        }))
      }
    ]
  })

/** 点击穿透演示：按一级单位编码派生固定顺序的二级单位，便于核对返回顺序与前端展示一致。 */
const childUnitsOf = (parentCode: string) => {
  const parent = units.find((unit) => unit.code === parentCode)
  if (!parent) return []
  return ['一部', '二部', '三部'].map((suffix, index) => ({
    code: `${parent.code}-${index + 1}`,
    name: `${parent.name}${suffix}`,
    searchType: parent.searchType
  }))
}

/** 点击穿透演示：按专业编码派生固定顺序的下级专业。 */
const childSpecialtiesOf = (parentCode: string) => {
  const parent = specialties.find((specialty) => specialty.code === parentCode)
  if (!parent) return []
  return ['子专业一', '子专业二', '子专业三'].map((suffix, index) => ({
    code: `${parent.code}-${index + 1}`,
    name: `${parent.name}${suffix}`
  }))
}

Mock.mock(/\/xmzl\/getDataByJd(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const error = validateQuery(params)
  if (error) return fail(error, 400)
  // 项目单位 / 省专业归口先过滤，汇总、分组与占比都按同一口径统计。
  const records = filterRecordsByOrg(scopeRecords(buildRecords(params.jhssnd, params.yd), params.dwId), params)
  const total = sumRecords(records)
  const childJd = stages.map((stage, stageIndex) => {
    const stageRecords = records.filter((record) => record.stageIndex === stageIndex)
    const stageTotal = sumRecords(stageRecords)
    return {
      ...statistics(stageRecords, total),
      jdbm: stage.code,
      jdmc: stage.name,
      sort: stageIndex + 1,
      childJd: stage.statuses.map((name, statusIndex) => ({
        ...statistics(
          stageRecords.filter((record) => record.statusIndex === statusIndex),
          stageTotal
        ),
        jdbm: `${stage.code}-${statusIndex + 1}`,
        jdmc: name,
        sort: statusIndex + 1,
        childJd: []
      }))
    }
  })
  const data = { sumAmount: total.amount, sumNum: total.num, childJd }
  return success(data)
})

Mock.mock(/\/xmzl\/getDataByDw(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const error = validateQuery(params)
  if (error) return fail(error, 400)
  const records = filterRecordsByOrg(scopeRecords(buildRecords(params.jhssnd, params.yd), params.dwId), params)
  return success(buildGroups(filterUnitsBySearchType(params.searchType), records, 'unitCode'))
})

Mock.mock(/\/xmzl\/getDataByZybm(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const error = validateQuery(params, false)
  if (error) return fail(error, 400)
  return success(buildGroups(specialties, filterRecordsByOrg(buildRecords(params.jhssnd, params.yd), params), 'specialtyCode'))
})

// 点击一级单位柱形后的二级单位：按 ctdw 取所点单位记录（不带阶段参数，统计全部阶段）；
// 记录按原顺序轮转到派生的二级单位，保证下级合计与所点一级单位一致。
Mock.mock(/\/xmzl\/getDataByDwCt(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const error = validateQuery(params)
  if (error) return fail(error, 400)
  const parentCode = String(params.ctdw ?? '')
  const children = childUnitsOf(parentCode)
  if (!children.length) return fail('单位编码 ctdw 无效', 400)
  const records = filterRecordsByOrg(scopeRecords(buildRecords(params.jhssnd, params.yd), params.dwId), params).filter(
    (record) => record.unitCode === parentCode
  )
  const childRecords = records.map((record, index) => ({ ...record, unitCode: children[index % children.length].code }))
  return success(buildGroups(children, childRecords, 'unitCode'))
})

// 点击专业柱形后的下级专业：与按专业统计同源，按专业编码 ctbm 筛选（不带阶段参数，统计全部阶段）后拆分到派生专业。
Mock.mock(/\/xmzl\/getDataByZybmCt(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const error = validateQuery(params, false)
  if (error) return fail(error, 400)
  const parentCode = String(params.ctbm ?? '')
  const children = childSpecialtiesOf(parentCode)
  if (!children.length) return fail('专业编码 ctbm 无效', 400)
  const records = filterRecordsByOrg(buildRecords(params.jhssnd, params.yd), params).filter((record) => record.specialtyCode === parentCode)
  const childRecords = records.map((record, index) => ({ ...record, specialtyCode: children[index % children.length].code }))
  return success(buildGroups(children, childRecords, 'specialtyCode'))
})

const buildBudgetBreakdown = (records: StatisticRecord[]) => {
  const total = sumRecords(records)
  const city = statistics(
    records.filter((record) => !record.provinceBudget),
    total
  )
  const province = statistics(
    records.filter((record) => record.provinceBudget),
    total
  )
  return {
    sjtcJe: province.amount,
    sjtcJeZb: province.amountZb,
    sjtcSl: province.num,
    sjtcSlZb: province.numZb,
    sytcJe: city.amount,
    sytcJeZb: city.amountZb,
    sytcSl: city.num,
    sytcSlZb: city.numZb,
    sumJe: total.amount,
    sumSl: total.num
  }
}

const buildRanking = (
  groups: { code: string; name: string }[],
  records: StatisticRecord[],
  field: 'unitCode' | 'specialtyCode' | 'xmlxId',
  orderBy?: 1 | 2
) => {
  const rows = groups.flatMap((group, index) => {
    const groupRecords = records.filter((record) => record[field] === group.code)
    return groupRecords.length ? [{ id: group.code, name: group.name, ...sumRecords(groupRecords), dispOrder: index + 1 }] : []
  })
  // orderBy 与真实接口一致：1 按金额、2 按数量降序，dispOrder 跟随返回顺序；缺省保持基础顺序。
  if (orderBy === undefined) return rows
  const field0 = orderBy === 1 ? 'amount' : 'num'
  return rows
    .slice()
    .sort((a, b) => Number(b[field0]) - Number(a[field0]))
    .map((row, index) => ({ ...row, dispOrder: index + 1 }))
}

// 预算类型：yslx 取 1（省级统筹）或 2（市域统筹），与 projectTypes 同级供阶段详情与宽表复用。
const budgetTypes = [
  { code: 'SJTC', name: '省级统筹', yslx: 1, provinceBudget: true },
  { code: 'SYTC', name: '市域统筹', yslx: 2, provinceBudget: false }
]

// 四个阶段复用相同接口；单位、月份、阶段、项目类型与预算类型先筛选，再汇总四块详情，保证金额与数量口径一致。
const mockStageDetail = <T>(
  path: string,
  toData: (records: StatisticRecord[], orderBy: 1 | 2 | undefined) => T
) => {
  Mock.mock(new RegExp(`/xmzl/${path}(?:\\?[^#]*)?$`), 'post', (options: MockOptions) => {
    const params = parseBody(options)
    const byUnit = path.endsWith('ByDw')
    const error = validateQuery(params, byUnit)
    if (error) return fail(error, 400)
    const stageIndex = stages.findIndex((stage) => stage.code === params.jdbm)
    if (stageIndex < 0) return fail('阶段编码 jdbm 必须为有效的最外层阶段编码', 400)
    if (params.xmlxId && !projectTypes.some((type) => type.code === params.xmlxId)) return fail('项目类型 xmlxId 无效', 400)
    const orderByNumber = Number(params.orderBy)
    if (params.orderBy !== undefined && params.orderBy !== '' && orderByNumber !== 1 && orderByNumber !== 2)
      return fail('排序方式 orderBy 仅支持 1（金额）或 2（数量）', 400)
    const orderBy = orderByNumber === 1 || orderByNumber === 2 ? (orderByNumber as 1 | 2) : undefined
    // 预算类型 yslx 只由前端传给两块排名；未传时按全部预算类型统计。
    const hasYslx = params.yslx !== undefined && params.yslx !== null && params.yslx !== ''
    const yslx = Number(params.yslx)
    if (hasYslx && yslx !== 1 && yslx !== 2) return fail('预算类型 yslx 仅支持 1（省级统筹）或 2（市域统筹）', 400)
    const provinceBudget = hasYslx ? yslx === 1 : null
    // searchZybm 只由项目类型排名承接：按所点单位编码（按单位）或专业编码（按专业）筛选记录。
    const isXmlxRanking = path.startsWith('getGlXmlxpmBy')
    const searchZybm = String(params.searchZybm ?? '').trim()
    const records = buildRecords(params.jhssnd, params.yd)
    const scoped = filterRecordsByOrg(byUnit ? scopeRecords(records, params.dwId) : records, params)
    const unitCodes = new Set(filterUnitsBySearchType(params.searchType).map((unit) => unit.code))
    return success(
      toData(
        scoped.filter(
          (record) =>
            record.stageIndex === stageIndex &&
            (provinceBudget === null || record.provinceBudget === provinceBudget) &&
            (!byUnit || unitCodes.has(record.unitCode)) &&
            (!params.xmlxId || record.xmlxId === params.xmlxId) &&
            (!isXmlxRanking || !searchZybm || (byUnit ? record.unitCode === searchZybm : record.specialtyCode === searchZybm))
        ),
        orderBy
      )
    )
  })
}

for (const dimension of ['Dw', 'Zybm']) {
  // 单位排名按单位编码汇总，省专业排名按专业编码汇总；点击柱形后 searchZybm 也按同一维度匹配。
  const groups = dimension === 'Dw' ? units : specialties
  const groupField = dimension === 'Dw' ? 'unitCode' : 'specialtyCode'
  mockStageDetail(`getGlDataBy${dimension}`, buildBudgetBreakdown)
  mockStageDetail(`getGlXmlxDataBy${dimension}`, (records) =>
    buildRanking(projectTypes, records, 'xmlxId').map((row) => ({ xmlxId: row.id, xmlxName: row.name, amount: row.amount, num: row.num }))
  )
  mockStageDetail(`getGlDwpmBy${dimension}`, (records, orderBy) => buildRanking(groups, records, groupField, orderBy))
  mockStageDetail(`getGlXmlxpmBy${dimension}`, (records, orderBy) => buildRanking(projectTypes, records, 'xmlxId', orderBy))
}

/** 宽表查询与导出共用的参数校验：返回错误文案，校验通过返回空字符串。 */
const validateWideQuery = (params: Record<string, any>, byUnit: boolean) => {
  const error = validateQuery(params, byUnit)
  if (error) return error
  if (!stages.some((stage) => stage.code === params.jdbm)) return '阶段编码 jdbm 必须为有效的最外层阶段编码'
  return ''
}

/** 宽表记录构造：与阶段详情同源，顺序为「单位/专业顺序 → 项目类型顺序 → 预算类型顺序」，空缺组合不补造。 */
const buildWideRows = (params: Record<string, any>, byUnit: boolean) => {
  const stageIndex = stages.findIndex((stage) => stage.code === params.jdbm)
  const groups = byUnit ? filterUnitsBySearchType(params.searchType) : specialties
  const groupField = byUnit ? 'unitCode' : 'specialtyCode'
  const records = buildRecords(params.jhssnd, params.yd)
  const scoped = filterRecordsByOrg(byUnit ? scopeRecords(records, params.dwId) : records, params)
  const stageRecords = scoped.filter((record) => record.stageIndex === stageIndex)
  return groups.flatMap((group) => {
    const groupRecords = stageRecords.filter((record) => record[groupField] === group.code)
    return projectTypes.flatMap((type) =>
      budgetTypes.flatMap((budget) => {
        const cells = groupRecords.filter((record) => record.xmlxId === type.code && record.provinceBudget === budget.provinceBudget)
        if (!cells.length) return []
        return [
          {
            dw: group.code,
            dwName: group.name,
            xmlx: type.code,
            xmlxName: type.name,
            yslx: budget.code,
            yslxName: budget.name,
            ...sumRecords(cells)
          }
        ]
      })
    )
  })
}

// 阶段宽表：与阶段详情同源，按「单位/专业 + 项目类型 + 预算类型」平铺，并按 page/limit 分页返回。
const mockWideTable = (path: string) => {
  Mock.mock(new RegExp(`/xmzl/${path}(?:\\?[^#]*)?$`), 'post', (options: MockOptions) => {
    const params = parseBody(options)
    const byUnit = path.endsWith('ByDw')
    const error = validateWideQuery(params, byUnit)
    if (error) return fail(error, 400)
    const page = Number(params.page)
    const limit = Number(params.limit)
    if (!Number.isInteger(page) || page < 1) return fail('页码 page 必须为正整数', 400)
    if (!Number.isInteger(limit) || limit < 1) return fail('每页条数 limit 必须为正整数', 400)
    return success(pageResult(buildWideRows(params, byUnit), page, limit))
  })
}
for (const dimension of ['Dw', 'Zybm']) mockWideTable(`getGlkbBy${dimension}`)

// 阶段宽表导出：与查询同筛选、不传 page/limit，一次性导出全部匹配记录（金额与数量两列都给）。
const mockWideTableExport = (path: string) => {
  Mock.mock(new RegExp(`/xmzl/${path}(?:\\?[^#]*)?$`), 'post', async (options: MockOptions) => {
    const params = parseBody(options)
    const byUnit = path.endsWith('ByDw')
    const error = validateWideQuery(params, byUnit)
    if (error) return fail(error, 400)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(byUnit ? '按单位' : '按专业')
    worksheet.columns = [
      { header: byUnit ? '单位' : '专业', key: 'dwName', width: 28 },
      { header: '项目类型', key: 'xmlxName', width: 20 },
      { header: '预算类型', key: 'yslxName', width: 16 },
      { header: '金额（万元）', key: 'amount', width: 18 },
      { header: '数量', key: 'num', width: 12 }
    ]
    worksheet.addRows(buildWideRows(params, byUnit))
    worksheet.getRow(1).font = { bold: true }
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    const buffer = await workbook.xlsx.writeBuffer()
    return binaryResponse(buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
  })
}
for (const dimension of ['Dw', 'Zybm']) mockWideTableExport(`exportGlkbBy${dimension}`)

// 卡片穿透：阶段编码取主阶段（01），子阶段编码形如 01-2；同一组明细保证金额与汇总一致。
const budgetSources = ['年度预算', '专项预算', '调整预算']
const toCtRow = (record: StatisticRecord, year: string) => {
  const unit = units.find((item) => item.code === record.unitCode)
  const specialty = specialties.find((item) => item.code === record.specialtyCode)
  const stage = stages[record.stageIndex]
  const unitName = unit?.name ?? record.unitCode
  const specialtyName = specialty?.name ?? record.specialtyCode
  const code = `XM${year}${stage.code}${record.unitCode}${record.specialtyCode}`
  return {
    amount: record.amount,
    // 省专业归口部门名称本身已带「部」，二级单位展示为「一级单位 + 部门」，不再补后缀。
    ejdw: `${unitName}${specialtyName}`,
    flowStatus: `${stage.code}0${record.statusIndex + 1}`,
    flowStatusName: stage.statuses[record.statusIndex],
    jhssnd: year,
    xmbm: code,
    xmid: code,
    xmmc: `${unitName}${stage.name}${specialtyName}项目`,
    yjdw: unitName,
    ysly: budgetSources[(Number(year) + record.statusIndex + record.stageIndex) % budgetSources.length],
    zgkbm: specialtyName,
    zgkbmId: specialty?.code ?? record.specialtyCode
  }
}

// 预算事项演示数据：穿透到事项把同一组明细按事项汇总，事项 id 再用于二次穿透项目明细。
const budgetSubjects = [
  { name: '输变电工程', focus: '主干网架完善' },
  { name: '配电网建设', focus: '城乡配网升级' },
  { name: '技改大修', focus: '设备更新改造' },
  { name: '营销服务提升', focus: '供电服务优化' },
  { name: '数字化建设', focus: '数字赋能转型' },
  { name: '安全劳保', focus: '安全水平提升' },
  { name: '零星购置', focus: '生产运营保障' },
  { name: '科研开发', focus: '技术创新攻关' }
]
const toSubjectId = (index: number) => `YSSX${String(index + 1).padStart(2, '0')}`
// 事项分配：按「单位序号 + 流程状态序号」稳定映射，保证事项汇总金额与项目明细一致。
const subjectIndexOf = (record: StatisticRecord) =>
  (units.findIndex((unit) => unit.code === record.unitCode) + record.statusIndex) % budgetSubjects.length

// 事项行构造：与项目明细同源，按预算事项汇总金额与数量；合计穿透不传 jdbm 时统计全部阶段。
const buildSxRows = (params: Record<string, any>) => {
  const [stageCode] = String(params.jdbm ?? '').split('-')
  const records = filterRecordsByOrg(scopeRecords(buildRecords(params.jhssnd, params.yd), params.dwId), params).filter(
    (record) => !stageCode || record.stageIndex === stages.findIndex((stage) => stage.code === stageCode)
  )
  return budgetSubjects.flatMap((subject, index) => {
    const cells = records.filter((record) => subjectIndexOf(record) === index)
    if (!cells.length) return []
    const specialty = specialties[index % specialties.length]
    const type = projectTypes[index % projectTypes.length]
    // 预算类型跟随项目类型，与明细记录同源，避免事项列表里两列互相矛盾。
    const budget = budgetTypes.find((item) => item.provinceBudget === type.provinceBudget) ?? budgetTypes[0]
    return [
      {
        yssxId: toSubjectId(index),
        yssxName: subject.name,
        zdtxName: subject.focus,
        gkbmName: specialty.name,
        xmlxName: type.name,
        yslxName: budget.name,
        ...sumRecords(cells)
      }
    ]
  })
}

Mock.mock(/\/xmzl\/getCtData(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const error = validateQuery(params)
  if (error) return fail(error, 400)
  const page = Number(params.page)
  const limit = Number(params.limit)
  if (!Number.isInteger(page) || page < 1) return fail('页码 page 必须为正整数', 400)
  if (!Number.isInteger(limit) || limit < 1) return fail('每页条数 limit 必须为正整数', 400)
  const [stageCode, statusCode] = String(params.jdbm ?? '').split('-')
  // 合计穿透不传 jdbm（-2），按全部阶段查询；传了但不合法时报错。
  const stageIndex = stageCode ? stages.findIndex((stage) => stage.code === stageCode) : -2
  if (stageIndex === -1) return fail('阶段编码 jdbm 无效', 400)
  const statusIndex = statusCode ? Number(statusCode) - 1 : -1
  if (statusCode && !(statusIndex >= 0 && statusIndex < stages[stageIndex < 0 ? 0 : stageIndex].statuses.length))
    return fail('子阶段编码 jdbm 无效', 400)
  // 二次穿透携带预算事项 id 数组（兼容单个字符串）时只返回这些事项名下的项目，与事项列表汇总同源。
  const yssxIds = new Set((Array.isArray(params.yssxId) ? params.yssxId : params.yssxId ? [params.yssxId] : []).map((id: unknown) => String(id)))
  const records = filterRecordsByOrg(scopeRecords(buildRecords(params.jhssnd, params.yd), params.dwId), params).filter(
    (record) =>
      (stageIndex < 0 || record.stageIndex === stageIndex) &&
      (statusIndex < 0 || record.statusIndex === statusIndex) &&
      (!yssxIds.size || yssxIds.has(toSubjectId(subjectIndexOf(record))))
  )
  const rows = records.map((record) => toCtRow(record, params.jhssnd))
  const start = (page - 1) * limit
  return success({ total: rows.length, records: rows.slice(start, start + limit) })
})

Mock.mock(/\/xmzl\/getCtDataToSx(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const error = validateQuery(params)
  if (error) return fail(error, 400)
  const [stageCode] = String(params.jdbm ?? '').split('-')
  if (stageCode && !stages.some((stage) => stage.code === stageCode)) return fail('阶段编码 jdbm 无效', 400)
  const page = Number(params.page)
  const limit = Number(params.limit)
  if (!Number.isInteger(page) || page < 1) return fail('页码 page 必须为正整数', 400)
  if (!Number.isInteger(limit) || limit < 1) return fail('每页条数 limit 必须为正整数', 400)
  const rows = buildSxRows(params)
  const start = (page - 1) * limit
  return success({ total: rows.length, records: rows.slice(start, start + limit) })
})

// 事项导出：与查询同筛选、不传 page/limit，一次性导出全部匹配事项（金额与数量两列都给）。
Mock.mock(/\/xmzl\/exportCtDataToSx(?:\?[^#]*)?$/, 'post', async (options: MockOptions) => {
  const params = parseBody(options)
  const error = validateQuery(params)
  if (error) return fail(error, 400)
  const [stageCode] = String(params.jdbm ?? '').split('-')
  if (stageCode && !stages.some((stage) => stage.code === stageCode)) return fail('阶段编码 jdbm 无效', 400)

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('预算事项')
  worksheet.columns = [
    { header: '预算事项', key: 'yssxName', width: 24 },
    { header: '重点投向', key: 'zdtxName', width: 20 },
    { header: '项目类型', key: 'xmlxName', width: 16 },
    { header: '预算类型', key: 'yslxName', width: 12 },
    { header: '归口部门', key: 'gkbmName', width: 16 },
    { header: '金额（万元）', key: 'amount', width: 18 },
    { header: '数量', key: 'num', width: 10 }
  ]
  worksheet.addRows(buildSxRows(params))
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
})

// 总览阶段配置页：独立菜单与业务编码，角色复用总览查询人员。
const CONFIG_MENU_URL = '/service/overview/config'
const CONFIG_BUSICODE = 'XMZL-OVERVIEW-CONFIG'

Mock.mock(/sys\/menu\/getMenuByUrl\?(?:[^#]*&)?url=(?:\/|%2[fF])service(?:\/|%2[fF])overview(?:\/|%2[fF])config(?:&|$)/, 'get', () =>
  success({ id: 'menu-overview-config', name: '总览阶段配置', outsideMenu: CONFIG_BUSICODE, url: CONFIG_MENU_URL })
)
Mock.mock(new RegExp(`getRoleByBusicode\\?[^#]*busicode=${CONFIG_BUSICODE}(?:&|$)`), 'get', (options: MockOptions) => [
  {
    id: 'sprole-overview-config-01',
    name: '省公司总览配置人员',
    code: 'SCWYSZZ',
    role_id: 'role-overview-config-01',
    specialorgid: 'bm-overview-01',
    specialorgname: '财务预算专职',
    specialorgcode: 'BM_CWZC',
    org_id: 'DW001',
    org_name: '国网江苏省电力有限公司',
    userId: getQueryValue(options.url, 'userId'),
    busicode: CONFIG_BUSICODE
  }
])
Mock.mock(new RegExp(`sysMenu/getButtonList\\?[^#]*menuCode=${CONFIG_BUSICODE}(?:&|$)`), 'get', () => success([]))

// 配置演示数据与上方阶段/子阶段编码保持一致；预算类型、省级联合核算等取值以后端字典为准，演示数据留空。
let configSeq = 0
let configStore = stages.flatMap((stage, stageIndex) =>
  stage.statuses.map((status, statusIndex) => ({
    id: String(++configSeq),
    jdbm: stage.code,
    jdmc: stage.name,
    jdpx: stageIndex + 1,
    zjdbm: `${stage.code}-${statusIndex + 1}`,
    zjdmc: status,
    zjdpx: statusIndex + 1,
    yslx: '',
    flowStatus: `${stage.code}0${statusIndex + 1}`,
    dec: '',
    des: `${stage.name}「${status}」的项目`,
    sjlhhs: ''
  }))
)

type XmzlConfig = (typeof configStore)[number]

Mock.mock(/\/xmzl\/config\/getConfig(?:\?[^#]*)?$/, 'post', () => success(configStore.map((config) => ({ ...config }))))

Mock.mock(/\/xmzl\/config\/saveOrUpdateConfig(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  let list: unknown
  try {
    list = JSON.parse(options.body || '[]')
  } catch {
    return fail('请求体必须为配置数组', 400)
  }
  if (!Array.isArray(list) || !list.length) return fail('请求体必须为非空的配置数组', 400)
  const configs = list as XmzlConfig[]
  const invalid = configs.findIndex((config) => !String(config.jdbm ?? '').trim() || !String(config.jdmc ?? '').trim())
  if (invalid > -1) return fail(`第 ${invalid + 1} 条配置缺少阶段编码或阶段名称`, 400)
  const missing = configs.find(
    (config) =>
      config.id !== undefined && config.id !== null && config.id !== '' && !configStore.some((item) => String(item.id) === String(config.id))
  )
  if (missing) return fail(`配置 ${missing.id} 不存在，可能已被删除`, 400)
  configs.forEach((config) => {
    const index = configStore.findIndex((item) => String(item.id) === String(config.id))
    // 修改按整行覆盖，未提交的字段视为清空。
    if (index > -1) configStore[index] = { ...config, id: configStore[index].id }
    else configStore.push({ ...config, id: String(++configSeq) })
  })
  return success('保存成功')
})

Mock.mock(/\/xmzl\/config\/deleteConfig(?:\?[^#]*)?$/, 'post', (options: MockOptions) => {
  const ids = parseBody(options).ids
  if (!Array.isArray(ids) || !ids.length) return fail('ids 不能为空', 400)
  const idSet = new Set(ids.map(String))
  configStore = configStore.filter((config) => !idSet.has(String(config.id)))
  return success(null, '删除成功')
})
