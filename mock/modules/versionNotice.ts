/**
 * 版本发布通知 mock。
 *
 * 已注册接口：
 * - POST versionNotice/page       分页查询版本通知（首页系统公告与「版本发布通知」列表页共用）
 * - GET  versionNotice/checkUnread 查询当前登录用户的未读版本通知（无未读时 data 为 null）
 * - POST versionNotice/read        标记通知已读（配合 checkUnread，读过后不再返回该通知）
 */
import Mock from 'mockjs'
import { getQueryValue, parseBody, pageResult, success } from '../helpers'
import type { MockOptions } from '../helpers'

interface VersionNotice {
  id: string
  versionNo: string
  versionTitle: string
  releaseDate: string
  versionContent: string
  noticeTime: string
  noticeExpireTime: string
  status: string
  statusName: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

// 模拟一条已发布的未读版本通知，字段与版本发布通知列表保持一致
const unreadNotice: VersionNotice = {
  id: '202610220000000001',
  versionNo: 'V1.00.053',
  versionTitle: '项目过程管控平台 2026年10月版本发布通知',
  releaseDate: '2026-10-25 00:00:00 ~ 2026-10-25 06:00:00',
  versionContent:
    '<p>各位同事：</p><p>平台将于 <strong>2026年10月25日 00:00 ~ 06:00</strong> 进行版本升级，届时系统暂停服务，请提前保存工作内容。</p><p>本次升级主要内容：</p><ul><li>优化项目储备库查询性能；</li><li>新增版本发布通知功能；</li><li>修复若干已知问题。</li></ul><p>如给您带来不便，敬请谅解。</p>',
  noticeTime: '2026-10-22 09:00:00',
  noticeExpireTime: '2026-10-31 23:59:59',
  status: '1',
  statusName: '已发布',
  createUser: '系统管理员',
  createTime: '2026-10-22 09:00:00',
  updateUser: '系统管理员',
  updateTime: '2026-10-22 09:00:00'
}

// 已读通知 id 集合，模拟“查询未读 → 标记已读 → 再次查询为空”的完整流程
const readNoticeIds = new Set<string>()

// 查询当前登录用户的未读版本通知
Mock.mock(/\/api\/versionNotice\/checkUnread(?:\?.*)?$/, 'get', () => {
  if (readNoticeIds.has(unreadNotice.id)) return success(null)
  return success(clone(unreadNotice))
})

// 标记版本通知已读（真实接口在 query 上传递 noticeId）
Mock.mock(/\/api\/versionNotice\/read(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const noticeId = getQueryValue(options.url, 'noticeId')
  if (noticeId) readNoticeIds.add(noticeId)
  return success(true)
})

// 版本通知列表：首页「系统公告」只取已发布（status=1）数据；其余状态供「版本发布通知」列表页展示/检索
const NOTICES: VersionNotice[] = [
  clone(unreadNotice),
  {
    id: '202610200000000002',
    versionNo: 'V1.00.052',
    versionTitle: '预算执行分析模块功能优化通知',
    releaseDate: '2026-10-20 22:00:00 ~ 2026-10-21 02:00:00',
    versionContent: '<p>各位同事：</p><p>预算执行分析模块已完成优化升级，新增预算执行率趋势图表与导出功能。</p>',
    noticeTime: '2026-10-20 09:00:00',
    noticeExpireTime: '2026-11-20 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-10-20 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-10-20 09:00:00'
  },
  {
    id: '202609180000000003',
    versionNo: 'V1.00.051',
    versionTitle: '项目储备库查询性能优化通知',
    releaseDate: '2026-09-18 22:00:00 ~ 2026-09-19 02:00:00',
    versionContent: '<p>各位同事：</p><p>项目储备库列表查询与明细导出性能已优化，查询速度明显提升。</p>',
    noticeTime: '2026-09-18 09:00:00',
    noticeExpireTime: '2026-10-18 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-09-18 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-09-18 09:00:00'
  },
  {
    id: '202609010000000004',
    versionNo: 'V1.00.050',
    versionTitle: '系统安全加固升级通知',
    releaseDate: '2026-09-05 00:00:00 ~ 2026-09-05 06:00:00',
    versionContent: '<p>各位同事：</p><p>平台将进行安全加固升级，升级期间请勿进行重要业务操作。</p>',
    noticeTime: '2026-09-01 09:00:00',
    noticeExpireTime: '2026-09-30 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-09-01 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-09-01 09:00:00'
  },
  {
    id: '202608150000000005',
    versionNo: 'V1.00.049',
    versionTitle: '联合会审流程调整通知',
    releaseDate: '2026-08-20 22:00:00 ~ 2026-08-21 02:00:00',
    versionContent: '<p>各位同事：</p><p>联合会审流程节点调整，新增多人会签环节，请在办业务注意流程变化。</p>',
    noticeTime: '2026-08-15 09:00:00',
    noticeExpireTime: '2026-09-15 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-08-15 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-08-15 09:00:00'
  },
  {
    id: '202608010000000006',
    versionNo: 'V1.00.048',
    versionTitle: '主数据管理规范更新通知',
    releaseDate: '2026-08-10 22:00:00 ~ 2026-08-11 02:00:00',
    versionContent: '<p>各位同事：</p><p>主数据管理规范已更新，新增单位性质与行业分类字段维护要求。</p>',
    noticeTime: '2026-08-01 09:00:00',
    noticeExpireTime: '2026-08-31 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-08-01 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-08-01 09:00:00'
  },
  {
    id: '202607150000000007',
    versionNo: 'V1.00.047',
    versionTitle: '报表导出中心上线通知',
    releaseDate: '2026-07-20 22:00:00 ~ 2026-07-21 02:00:00',
    versionContent: '<p>各位同事：</p><p>报表导出中心已上线，支持大数据量报表后台导出与下载记录查询。</p>',
    noticeTime: '2026-07-15 09:00:00',
    noticeExpireTime: '2026-08-15 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-07-15 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-07-15 09:00:00'
  },
  {
    id: '202607010000000008',
    versionNo: 'V1.00.046',
    versionTitle: '预算编制流程优化通知',
    releaseDate: '2026-07-05 22:00:00 ~ 2026-07-06 02:00:00',
    versionContent: '<p>各位同事：</p><p>预算编制流程已优化，支持多版本并行编制与一键切换。</p>',
    noticeTime: '2026-07-01 09:00:00',
    noticeExpireTime: '2026-07-31 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-07-01 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-07-01 09:00:00'
  },
  {
    id: '202606150000000009',
    versionNo: 'V1.00.045',
    versionTitle: '消息中心功能上线通知',
    releaseDate: '2026-06-20 22:00:00 ~ 2026-06-21 02:00:00',
    versionContent: '<p>各位同事：</p><p>消息中心已上线，待办、通知、公告统一在消息中心展示。</p>',
    noticeTime: '2026-06-15 09:00:00',
    noticeExpireTime: '2026-07-15 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-06-15 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-06-15 09:00:00'
  },
  {
    id: '202606010000000010',
    versionNo: 'V1.00.044',
    versionTitle: '系统日常维护通知',
    releaseDate: '2026-06-05 00:00:00 ~ 2026-06-05 04:00:00',
    versionContent: '<p>各位同事：</p><p>平台将进行例行维护，期间系统短暂不可用，请提前安排工作。</p>',
    noticeTime: '2026-06-01 09:00:00',
    noticeExpireTime: '2026-06-30 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-06-01 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-06-01 09:00:00'
  },
  {
    id: '202605150000000011',
    versionNo: 'V1.00.043',
    versionTitle: '合同管理模块升级通知',
    releaseDate: '2026-05-20 22:00:00 ~ 2026-05-21 02:00:00',
    versionContent: '<p>各位同事：</p><p>合同管理模块升级完成，新增合同台账与付款计划跟踪功能。</p>',
    noticeTime: '2026-05-15 09:00:00',
    noticeExpireTime: '2026-06-15 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-05-15 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-05-15 09:00:00'
  },
  {
    id: '202605010000000012',
    versionNo: 'V1.00.042',
    versionTitle: '移动端适配优化通知',
    releaseDate: '2026-05-05 22:00:00 ~ 2026-05-06 02:00:00',
    versionContent: '<p>各位同事：</p><p>平台移动端适配已优化，常用页面支持手机端访问与审批。</p>',
    noticeTime: '2026-05-01 09:00:00',
    noticeExpireTime: '2026-05-31 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-05-01 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-05-01 09:00:00'
  },
  {
    id: '202604150000000013',
    versionNo: 'V1.00.041',
    versionTitle: '数据字典维护功能上线通知',
    releaseDate: '2026-04-20 22:00:00 ~ 2026-04-21 02:00:00',
    versionContent: '<p>各位同事：</p><p>数据字典维护功能已上线，支持业务字典在线维护与版本管理。</p>',
    noticeTime: '2026-04-15 09:00:00',
    noticeExpireTime: '2026-05-15 23:59:59',
    status: '1',
    statusName: '已发布',
    createUser: '系统管理员',
    createTime: '2026-04-15 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-04-15 09:00:00'
  },
  {
    id: '202611010000000014',
    versionNo: 'V1.00.054',
    versionTitle: '11月版本功能规划（草稿）',
    releaseDate: '',
    versionContent: '<p>计划中的11月版本功能规划，尚未发布。</p>',
    noticeTime: '',
    noticeExpireTime: '',
    status: '0',
    statusName: '草稿',
    createUser: '系统管理员',
    createTime: '2026-10-25 10:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-10-25 10:00:00'
  },
  {
    id: '202603010000000015',
    versionNo: 'V1.00.040',
    versionTitle: '季度数据结转通知（已撤回）',
    releaseDate: '2026-03-31 22:00:00 ~ 2026-04-01 04:00:00',
    versionContent: '<p>各位同事：</p><p>该通知内容有误已撤回，结转时间另行通知。</p>',
    noticeTime: '2026-03-01 09:00:00',
    noticeExpireTime: '2026-03-31 23:59:59',
    status: '2',
    statusName: '已撤回',
    createUser: '系统管理员',
    createTime: '2026-03-01 09:00:00',
    updateUser: '系统管理员',
    updateTime: '2026-03-05 10:00:00'
  }
]

// 分页查询：支持列表页的 versionNo/versionTitle 模糊、status 精确检索，按通知生效时间倒序
const filterNotice = (query: Record<string, any>) =>
  NOTICES.filter((item) => {
    if (query.status !== undefined && query.status !== null && String(query.status) !== '' && String(item.status) !== String(query.status))
      return false
    if (query.versionNo && !item.versionNo.includes(String(query.versionNo).trim())) return false
    if (query.versionTitle && !item.versionTitle.includes(String(query.versionTitle).trim())) return false
    return true
  })

Mock.mock(/\/api\/versionNotice\/page(?:\?.*)?$/, 'post', (options: MockOptions) => {
  const query = parseBody(options)
  const records = filterNotice(query)
    .map(clone)
    .sort((a, b) => (a.noticeTime < b.noticeTime ? 1 : a.noticeTime > b.noticeTime ? -1 : 0))
  return success(pageResult(records, query.page, query.limit))
})
