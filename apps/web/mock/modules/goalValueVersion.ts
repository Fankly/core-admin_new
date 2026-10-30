/**
 * /goalValue/version：版本管理、角色和按钮权限 mock。
 * 年度选项复用 aiDocument 的 comPz/getNdTreeNode；数据在刷新页面后重置。
 */
import Mock from 'mockjs'
import { fail, getQueryValue, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

const BUSICODE = 'GOAL-VALUE-VERSION'
const MENU_ID = 'menu-goal-value-version'
const SP_ROLE_ID = 'sprole-goal-value-version'
export const SP_ORG_ID = 'BM-GOAL-VALUE-001'
// 调整此数组即可验证按钮权限；同时适用于角色入口和 versionParams 跳转入口。
const BUTTONS = ['ADD', 'VIEW', 'EDIT', 'DELETE', 'BBBD', 'MBZWH', 'SZNDMBZ', 'TZJSRYSZ']
const CURRENT_YEAR = new Date().getFullYear()

// 公共接口按本页 URL / 业务码收窄，避免拦截其他菜单的权限请求。
Mock.mock(/sys\/menu\/getMenuByUrl\?(?:[^#]*&)?url=(?:\/|%2F)goalValue(?:\/|%2F)version(?:&|$)/i, 'get', (options: MockOptions) =>
  success({ id: MENU_ID, outsideMenu: BUSICODE, url: getQueryValue(options.url, 'url') })
)

Mock.mock(new RegExp(`getRoleByBusicode\\?(?:[^#]*&)?busicode=${BUSICODE}(?:&|$)`), 'get', () => [
  {
    id: SP_ROLE_ID,
    name: '目标值版本管理员',
    code: 'GOAL_VALUE_VERSION_ADMIN',
    info: '目标值版本管理演示角色',
    role_id: 'role-goal-value-version',
    rolename: '目标值版本管理员',
    spRoleCode: 'GOAL_VALUE_VERSION_ADMIN',
    specialorgid: SP_ORG_ID,
    specialorgname: '财务资产部',
    org_id: 'DW-GOAL-VALUE-001',
    org_name: '省电力公司',
    systemId: 'budget-process',
    systemName: '预算全过程管理',
    busicode: BUSICODE
  }
])

Mock.mock(new RegExp(`sysMenu/getButtonList(?:New)?\\?(?:[^#]*&)?menuCode=${BUSICODE}(?:&|$)`), 'get', () => success([...BUTTONS]))

Mock.mock(new RegExp(`sys/menuConfig/getConfigByMenuId\\?(?:[^#]*&)?menuId=${MENU_ID}(?:&|$)`), 'get', () =>
  success({ status: '1', helpInfo: '可按年度、版本名称和状态查询版本；初始和通知状态支持修改、删除。选择一条版本可设置年度目标值。' })
)
Mock.mock(new RegExp(`sys/menuConfig/listFj\\?(?:[^#]*&)?menuId=${MENU_ID}(?:&|$)`), 'get', () => success([]))

// 本地 fixture 自持类型，避免依赖完整业务仓库中的页面接口文件。
interface VersionRow {
  versionId: string
  versionNo: string
  versionName: string
  nd: string
  status: string
  sfyap: string
  sfnd: string
  createDate: string
  creator: string
  creatorName: string
  remake: string
  mbz: string
  sgsMbzBkk: string
  zgsMbz: string
  activateTime: string
}

const pad = (value: number) => String(value).padStart(2, '0')
const createVersion = (nd: string, sequence: number): VersionRow => ({
  versionId: `goal-value-${nd}-${sequence}`,
  versionNo: `V${String(sequence).padStart(3, '0')}`,
  versionName: `${nd}年度目标值版本${pad(sequence)}`,
  nd,
  status: '1',
  sfyap: '0',
  sfnd: '0',
  mbz: (120000 + sequence * 1250.5).toFixed(6),
  sgsMbzBkk: (35000 + sequence * 320.25).toFixed(6),
  zgsMbz: (18000 + sequence * 180.75).toFixed(6),
  activateTime: '',
  createDate: `${nd}-01-${pad(((sequence - 1) % 28) + 1)} 09:00:00`,
  creator: 'mock-goal-value-user',
  creatorName: '模拟管理员',
  remake: '目标值版本管理演示数据'
})

// 当前年超过一页，覆盖四种状态、年度目标值和预安排展示。
export const versions: VersionRow[] = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].flatMap((year) =>
  Array.from({ length: year === CURRENT_YEAR ? 24 : 8 }, (_, index) => {
    const sequence = index + 1
    const row = createVersion(String(year), sequence)
    row.status = String((index % 4) + 1)
    row.sfyap = index % 5 === 0 ? '1' : '0'
    row.sfnd = sequence === 3 ? '1' : '0'
    if (row.status === '3' || row.status === '4') row.activateTime = `${year}-02-${pad(sequence)} 10:00:00`
    return row
  })
)

Mock.mock(/\/mbz\/version\/page(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const name = String(params.versionName || '').trim()
  const rows = versions.filter(
    (row) =>
      (!params.nd || row.nd === String(params.nd)) &&
      (!params.status || row.status === String(params.status)) &&
      (!name || row.versionName.includes(name))
  )
  return success(pageResult(rows, params.page, params.limit))
})

// 创建前的省级统筹校验：演示场景没有未激活的调整数据。
Mock.mock(/\/sjtcmbztz\/getWjhNum(?:\?.*)?$/, 'get', () => success(''))

Mock.mock(/\/mbz\/version\/add(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const nd = String(params.nd || '')
  const versionName = String(params.versionName || '').trim()
  if (!/^\d{4}$/.test(nd)) return fail('请选择年度')
  if (!versionName) return fail('请输入版本名称')
  if (!['0', '1'].includes(String(params.sfyap))) return fail('请选择是否预安排')

  const sequence = versions.filter((row) => row.nd === nd).reduce((max, row) => Math.max(max, Number(row.versionNo.slice(1))), 0) + 1
  const row = createVersion(nd, sequence)
  row.versionName = versionName
  row.sfyap = String(params.sfyap)
  row.remake = String(params.remake || '')
  row.createDate = new Date().toISOString()
  versions.unshift(row)
  return success(row)
})

Mock.mock(/\/mbz\/version\/edit(?:\?.*)?$/, 'put', (options: MockOptions) => {
  const params = parseBody(options)
  const row = versions.find((item) => item.versionId === params.versionId)
  if (!row) return fail('版本不存在')
  if (!['1', '2'].includes(row.status)) return fail('仅“初始”和“通知”状态支持编辑')
  const versionName = String(params.versionName || '').trim()
  if (!versionName) return fail('请输入版本名称')
  if (!['0', '1'].includes(String(params.sfyap))) return fail('请选择是否预安排')
  row.versionName = versionName
  row.sfyap = String(params.sfyap)
  row.remake = String(params.remake || '')
  return success(row)
})

Mock.mock(/\/mbz\/version\/remove\/[^/?#]+(?:\?.*)?$/, 'delete', (options: MockOptions) => {
  const versionId = decodeURIComponent(options.url.split('?')[0].split('/').pop() || '')
  const index = versions.findIndex((row) => row.versionId === versionId)
  if (index === -1) return fail('版本不存在')
  if (!['1', '2'].includes(versions[index].status)) return fail('仅“初始”和“通知”状态支持删除')
  versions.splice(index, 1)
  return success(true)
})

// 同一年度仅保留一个年度目标值版本，查询时返回更新后的标记。
Mock.mock(/\/mbz\/version\/setSfnd\/?(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const versionId = getQueryValue(options.url, 'versionId')
  const nd = getQueryValue(options.url, 'nd')
  const sfnd = getQueryValue(options.url, 'sfnd')
  const row = versions.find((item) => item.versionId === versionId && item.nd === nd)
  if (!row) return fail('该年度下的版本不存在')
  if (!['0', '1'].includes(sfnd)) return fail('请选择年度目标值')
  if (sfnd === '1') versions.filter((item) => item.nd === nd).forEach((item) => (item.sfnd = '0'))
  row.sfnd = sfnd
  return success(true)
})
