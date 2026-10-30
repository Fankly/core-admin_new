import baseService from '@/service/baseService'
import type { Result } from '@/api/types'

/**
 * 项目总览图（swagger tag：项目总览图）
 * 接口文档：http://192.168.9.41:8001/budget-process/swagger-ui.html?urls.primaryName=项目模块相关
 * 所有接口均为 POST（writeJob 为 GET），路径前缀 /xmzl。
 */

export type StatisticValue = number | string

/** 统计口径：1 按单位，2 按专业 */
export type SearchBy = 1 | 2 | '1' | '2'
/** 单位类型：1 地市公司，2 直属单位；空值表示全省（不限单位类型） */
export type SearchType = '' | 1 | 2 | '1' | '2'
/** 预算类型：1 省级统筹，2 市域统筹 */
export type Yslx = 1 | 2 | '1' | '2'
/** 排名接口排序方式：1 按金额，2 按数量，跟随统计方式 */
export type OrderBy = 1 | 2 | '1' | '2'

/**
 * 公共请求参数（XmzlBaseDto）
 * 其中 bmxz / cropId / orgFlag 后端标注「前端忽略」，由服务端自行取值，前端无需传；
 * dwId / bmId / roleId / roleCode 由前端按当前角色传入。
 */
export interface XmzlBaseParams {
  userId?: string // 选择权限的用户id，随角色上下文传给后端
  dwId?: string // 用户单位id
  bmId?: string // 用户部门id
  roleId?: string // 用户角色id
  roleCode?: string // 用户角色编码
  jhssnd?: string // 计划年度
  nd?: string // 月度日期中的年度；未选择月度时传空字符串
  yd?: string | number // 月度日期中的月份（1 至 12）；未选择月度时传空字符串
  searchBy?: SearchBy // 1按单位 2按专业
  history?: boolean // 是否查询历史数据
  /** 项目单位筛选：所选一级单位编码列表（下拉选项取 bizOrgTree/getYjdw），空数组表示全部单位 */
  chooseYjdws?: string[]
  /** 省专业归口筛选：所选省归口部门编码列表（下拉选项取 commonCode/getGkbmInProvince），空数组表示全部 */
  chooseZybms?: string[]
}

/** 按单位/按专业统计、概览-项目类型 的请求参数（GetDataByDwDto） */
export interface GetDataByDwParams extends XmzlBaseParams {
  searchType?: SearchType // 1地市公司 2直属单位，空值表示全省
}

/** 单位排名/类型排名 的请求参数（GetDataPmByDwDto） */
export interface GetDataPmByDwParams extends GetDataByDwParams {
  xmlxId?: string // 项目类型id
  orderBy?: OrderBy // 排序方式：1 金额 2 数量
}

/**
 * 按单位统计点击穿透参数：点击柱形后按所点单位 ctdw 查询二级单位，不带角色 userId / roleCode。
 * 不传阶段编码 jdbm，二级单位按全部阶段统计。
 */
export interface GetDataByDwCtParams {
  bmId: string
  /** 项目单位筛选：所选一级单位编码列表，空数组表示全部 */
  chooseYjdws?: string[]
  /** 省专业归口筛选：所选省归口部门编码列表，空数组表示全部 */
  chooseZybms?: string[]
  ctdw: string // 所点击的一级单位编码
  dwId: string
  jhssnd: string
  nd: string
  roleId: string
  searchBy: SearchBy
  searchType?: SearchType
  yd: string | number
  yslx: string // 预算类型，总览未筛选时传空字符串
}

/**
 * 按专业统计点击穿透参数：点击专业柱形后按所点专业 ctbm 查询下级专业。
 * 不传阶段编码 jdbm，下级专业按全部阶段统计。
 */
export interface GetDataByZybmCtParams {
  bmId: string
  /** 项目单位筛选：所选一级单位编码列表，空数组表示全部 */
  chooseYjdws?: string[]
  /** 省专业归口筛选：所选省归口部门编码列表，空数组表示全部 */
  chooseZybms?: string[]
  ctbm: string // 所点击的专业部门编码
  dwId: string
  jhssnd: string
  nd: string
  roleId: string
  searchBy: SearchBy
  yd: string | number
}

/** 数据穿透 的请求参数（GetCtDataDto） */
export interface GetCtDataParams extends XmzlBaseParams {
  ctDwId?: string // 单位id或专业部门id
  jdbm?: string // 阶段编码
  xmlxId?: string // 项目类型id
  page?: number | string // 当前页
  /** 预算事项id列表：事项列表多选「查看」时传数组；「查看全部项目」不传，表示不限预算事项。 */
  yssxId?: string[]
  limit?: number | string // 每页数据条数
}

/** 阶段详情 的请求参数（GetGlDataDto）：在按单位/按专业参数上追加最外层阶段编码 */
export interface GetGlParams extends GetDataByDwParams {
  jdbm?: string // 阶段编码，取最外层阶段
}

/** 阶段详情排名 的请求参数（GetGlPmDto）：追加阶段编码、预算类型与项目类型 */
export interface GetGlPmParams extends GetDataPmByDwParams {
  jdbm?: string // 阶段编码，取最外层阶段
  yslx?: Yslx // 预算类型：1 省级统筹，2 市域统筹
  /** 项目类型排名筛选：点击单位/专业排名柱形后传所点行 id（单位编码或专业编码）。 */
  searchZybm?: string
}

/** 兼容旧调用方的别名 */
export type OverviewParams = XmzlBaseParams
export type UnitOverviewParams = GetDataByDwParams
export type CtDataParams = GetCtDataParams

/* ------------------------------------------------------------------ *
 * 响应结构
 * ------------------------------------------------------------------ */

export type OverviewResult<T> = Omit<Result, 'data'> & { data: T }

/** 各阶段统计（GetDwDataChildVo） */
export interface StageStatistics {
  amount: StatisticValue // 金额（万元）
  amountZb: StatisticValue // 金额占比
  jdbm: string // 阶段编码
  jdmc: string // 阶段名称
  num: StatisticValue // 数量
  numZb: StatisticValue // 数量占比
}

/** 按单位/按专业统计的子项（GetDwDataChildVo，含排序码与一级单位） */
export interface GroupStageStatistics extends StageStatistics {
  sortCode: StatisticValue // 排序码
  yjdw: string // 一级单位
}

/** 按单位/按专业统计（GetDwDataVo） */
export interface GroupStatistics {
  amount: StatisticValue // 金额（万元）
  code: string // 一级单位编码
  name: string // 一级单位名称
  num: StatisticValue // 数量
  datas: GroupStageStatistics[] // 各阶段数据
}

/** 总览上部分数据的子阶段（GetDataByJdVo） */
export interface SummaryStageStatistics extends StageStatistics {
  childJd: SummaryStageStatistics[] // 子阶段
  sort: StatisticValue // 排序
}

/** 总览上部分数据（GetDataByJdVo2） */
export interface OverviewSummaryData {
  sumNum: StatisticValue // 数量合计
  sumAmount: StatisticValue // 金额合计（万元）
  childJd: SummaryStageStatistics[] // 阶段统计数据
}

/** 概览-预算类型占比（GetGlVo） */
export interface OverviewGlData {
  sjtcJe: StatisticValue // 省级统筹金额
  sjtcJeZb: StatisticValue // 省级统筹金额占比
  sjtcSl: StatisticValue // 省级统筹数量
  sjtcSlZb: StatisticValue // 省级统筹数量占比
  sytcJe: StatisticValue // 市域统筹金额
  sytcJeZb: StatisticValue // 市域统筹金额占比
  sytcSl: StatisticValue // 市域统筹数量
  sytcSlZb: StatisticValue // 市域统筹数量占比
  sumJe: StatisticValue // 合计金额
  sumSl: StatisticValue // 合计数量
}

/** 概览-排名（GetGlByPmVo） */
export interface OverviewRankData {
  id: string // 单位/项目类型id
  name: string // 单位/项目类型名称
  amount: StatisticValue // 金额
  num: StatisticValue // 数量
  dispOrder: StatisticValue // 展示顺序
}

/** 概览-项目类型数据（XmlxDatasVo） */
export interface OverviewXmlxData {
  xmlxId: string // 项目类型id
  xmlxName: string // 项目类型名称
  amount: StatisticValue // 金额
  num: StatisticValue // 数量
}

/** 数据穿透明细（GetCtDataVo） */
export interface CtDataResult {
  amount: StatisticValue // 预算金额（万元）
  ejdw: string // 二级单位
  flowStatus: string // 流程状态
  flowStatusName: string // 流程状态名称
  jhssnd: string // 计划年度
  xmbm: string // 项目编码
  xmid: string // 项目ID
  xmmc: string // 项目名称
  yjdw: string // 一级单位
  ysly: string // 预算类型
  zgkbm: string // 省归口部门
  zgkbmId: string // 省归口部门ID
}

/** 数据穿透分页对象（IPage<GetCtDataVo>），项目明细与事项穿透共用 */
export interface CtPageData<T = CtDataResult> {
  current?: StatisticValue
  size?: StatisticValue
  total?: StatisticValue // 总条数
  pages?: StatisticValue
  records?: T[]
  /** 接口文档未固定包体，兼容其它常见分页字段命名 */
  totalCount?: StatisticValue
  count?: StatisticValue
  list?: T[]
  rows?: T[]
}

/** 穿透返回：接口固定为分页对象，同时兼容直接返回数组的形态 */
export type CtDataResultData = CtPageData | CtDataResult[]

/** 事项穿透返回：分页对象或直接返回数组的形态 */
export type CtSxDataResultData = CtPageData<CtDataToSxResult> | CtDataToSxResult[]

/** 当前权限的组织范围（GET /xmzl/getOrgFlag 返回） */
export interface OrgFlagData {
  /** 单位性质：PROVINCE 表示省级单位，此时展示全部组织类型。 */
  orgFlag: string
  /** 单位属性编码：GSSX_GDGS 地市公司；GSSX_JGBB / GSSX_ZSDW 直属单位及本部。 */
  dwsxId: string
}

/* ------------------------------------------------------------------ *
 * 接口
 * ------------------------------------------------------------------ */

// 当前选择权限的组织范围：选择完权限后按所选的 dwId 查询，决定组织类型可选项
export const getOrgFlag = (dwId: string): Promise<OverviewResult<OrgFlagData>> => {
  return baseService.get('/xmzl/getOrgFlag', { dwId })
}

// 总览上部分数据
export const getDataByJd = (params: XmzlBaseParams): Promise<OverviewResult<OverviewSummaryData>> => {
  return baseService.post('/xmzl/getDataByJd', params)
}

// 按单位统计
export const getDataByDw = (params: GetDataByDwParams): Promise<OverviewResult<GroupStatistics[]>> => {
  return baseService.post('/xmzl/getDataByDw', params)
}

// 按专业统计
export const getDataByZybm = (params: XmzlBaseParams): Promise<OverviewResult<GroupStatistics[]>> => {
  return baseService.post('/xmzl/getDataByZybm', params)
}

// 按单位统计点击穿透：所点击一级单位的下级单位
export const getDataByDwCt = (params: GetDataByDwCtParams): Promise<OverviewResult<GroupStatistics[]>> => {
  return baseService.post('/xmzl/getDataByDwCt', params)
}

// 按专业统计点击穿透：所点击专业下的下级数据
export const getDataByZybmCt = (params: GetDataByZybmCtParams): Promise<OverviewResult<GroupStatistics[]>> => {
  return baseService.post('/xmzl/getDataByZybmCt', params)
}

// 数据穿透
export const getCtData = (params: GetCtDataParams): Promise<OverviewResult<CtDataResultData>> => {
  return baseService.post('/xmzl/getCtData', params)
}

// 数据穿透导出
export const exportCtData = async (params: GetCtDataParams): Promise<Blob> => {
  const result = await baseService.export('/xmzl/exportCtData', params)
  if (!(result instanceof Blob)) throw new Error(result.msg || '项目明细导出失败')
  if (result.type.includes('json')) {
    const error = JSON.parse(await result.text())
    throw new Error(error.msg || '项目明细导出失败')
  }
  if (!result.size) throw new Error('导出文件为空，请重试')
  return result
}

// 概览-按单位
export const getGlDataByDw = (params: GetGlParams): Promise<OverviewResult<OverviewGlData>> => {
  return baseService.post('/xmzl/getGlDataByDw', params)
}

// 概览-按专业
export const getGlDataByZybm = (params: GetGlParams): Promise<OverviewResult<OverviewGlData>> => {
  return baseService.post('/xmzl/getGlDataByZybm', params)
}

// 概览-单位排名-按单位
export const getGlDwpmByDw = (params: GetGlPmParams): Promise<OverviewResult<OverviewRankData[]>> => {
  return baseService.post('/xmzl/getGlDwpmByDw', params)
}

// 概览-单位排名-按专业
export const getGlDwpmByZybm = (params: GetGlPmParams): Promise<OverviewResult<OverviewRankData[]>> => {
  return baseService.post('/xmzl/getGlDwpmByZybm', params)
}

// 概览-项目类型-按单位
export const getGlXmlxDataByDw = (params: GetGlParams): Promise<OverviewResult<OverviewXmlxData[]>> => {
  return baseService.post('/xmzl/getGlXmlxDataByDw', params)
}

// 概览-项目类型-按专业
export const getGlXmlxDataByZybm = (params: GetGlParams): Promise<OverviewResult<OverviewXmlxData[]>> => {
  return baseService.post('/xmzl/getGlXmlxDataByZybm', params)
}

// 概览-类型排名-按单位
export const getGlXmlxpmByDw = (params: GetGlPmParams): Promise<OverviewResult<OverviewRankData[]>> => {
  return baseService.post('/xmzl/getGlXmlxpmByDw', params)
}

// 概览-类型排名-按专业
export const getGlXmlxpmByZybm = (params: GetGlPmParams): Promise<OverviewResult<OverviewRankData[]>> => {
  return baseService.post('/xmzl/getGlXmlxpmByZybm', params)
}

export interface XmzlConfig {
  id?: StatisticValue
  jdbm?: string // 阶段编码
  jdmc?: string // 阶段名称
  jdpx?: StatisticValue // 阶段排序
  zjdbm?: string // 子阶段编码
  zjdmc?: string // 子阶段名称
  zjdpx?: StatisticValue // 子阶段排序
  yslx?: string // 预算类型
  flowStatus?: string // 流程状态
  dec?: string // 说明
  des?: string // 描述
  sjlhhs?: string // 省级联合核算
}

// 删除配置
export const deleteConfig = (ids: StatisticValue[]): Promise<OverviewResult<null>> => {
  return baseService.post('/xmzl/config/deleteConfig', { ids })
}

// 获取配置列表
export const getConfig = (): Promise<OverviewResult<XmzlConfig[]>> => {
  return baseService.post('/xmzl/config/getConfig', {})
}

// 保存配置
export const saveOrUpdateConfig = (config: XmzlConfig[]): Promise<OverviewResult<string>> => {
  return baseService.post('/xmzl/config/saveOrUpdateConfig', config)
}

export interface GlkbParams extends GetGlParams {
  limit: number | string // 每页数据条数
  page: number | string // 当前页
  orderBy?: OrderBy // 排序方式：1 金额 2 数量
  yslx?: string // 预算类型
  zgkbmIds?: string[] // 省归口部门id列表
}

export interface GlkbRecord {
  amount: StatisticValue // 金额
  dw: string // 单位（按专业为专业部门）
  dwName: string // 单位名称（按专业为专业部门名称）
  num: StatisticValue // 数量
  xmlx: string // 项目类型
  xmlxName: string // 项目类型名称
  yslx: string // 预算类型
  yslxName: string // 预算类型名称
}

/** 宽表分页对象（IPage<GlkbRecord>），按单位与按专业宽表共用 */
export interface GlkbPageData {
  current: StatisticValue
  size: StatisticValue
  total: StatisticValue
  pages: StatisticValue
  records: GlkbRecord[]
}

/** 宽表导出 的请求参数：与宽表查询同参，由后端导出全部匹配记录，不传分页 page / limit */
export type GlkbExportParams = Omit<GlkbParams, 'page' | 'limit'>

// 概览-按单位-宽表
export const getGlkbByDw = (params: GlkbParams): Promise<OverviewResult<GlkbPageData>> => {
  return baseService.post('/xmzl/getGlkbByDw', params)
}

// 概览-按专业-宽表
export const getGlkbByZybm = (params: GlkbParams): Promise<OverviewResult<GlkbPageData>> => {
  return baseService.post('/xmzl/getGlkbByZybm', params)
}

// 概览-按单位-宽表导出
export const exportGlkbByDw = async (params: GlkbExportParams): Promise<Blob> => {
  const result = await baseService.export('/xmzl/exportGlkbByDw', params)
  if (!(result instanceof Blob)) throw new Error(result.msg || '概览宽表导出失败')
  if (result.type.includes('json')) {
    const error = JSON.parse(await result.text())
    throw new Error(error.msg || '概览宽表导出失败')
  }
  if (!result.size) throw new Error('导出文件为空，请重试')
  return result
}

// 概览-按专业-宽表导出
export const exportGlkbByZybm = async (params: GlkbExportParams): Promise<Blob> => {
  const result = await baseService.export('/xmzl/exportGlkbByZybm', params)
  if (!(result instanceof Blob)) throw new Error(result.msg || '概览宽表导出失败')
  if (result.type.includes('json')) {
    const error = JSON.parse(await result.text())
    throw new Error(error.msg || '概览宽表导出失败')
  }
  if (!result.size) throw new Error('导出文件为空，请重试')
  return result
}

/** 穿透到事项的预算事项明细（按事项汇总金额与数量，yssxId 多选后作为数组再次穿透项目明细） */
export interface CtDataToSxResult {
  amount: StatisticValue // 预算金额（万元）
  gkbmName: string // 归口部门
  num: StatisticValue // 数量
  xmlxName: string // 项目类型
  yslxName: string // 预算类型
  yssxId: string // 预算事项id
  yssxName: string // 预算事项
  zdtxName: string // 重点投向
}

/** 穿透到事项 的请求参数（GetCtDataDto）：预算事项 id 由列表多选返回，二次穿透项目明细时才随 getCtData 传入 */
export type GetCtDataToSxParams = Omit<GetCtDataParams, 'yssxId'>

// 穿透到事项
export const getCtDataToSx = (params: GetCtDataToSxParams): Promise<OverviewResult<CtSxDataResultData>> => {
  return baseService.post('/xmzl/getCtDataToSx', params)
}

// 穿透到事项导出
export const exportCtDataToSx = async (params: GetCtDataToSxParams): Promise<Blob> => {
  const result = await baseService.export('/xmzl/exportCtDataToSx', params)
  if (!(result instanceof Blob)) throw new Error(result.msg || '事项明细导出失败')
  if (result.type.includes('json')) {
    const error = JSON.parse(await result.text())
    throw new Error(error.msg || '事项明细导出失败')
  }
  if (!result.size) throw new Error('导出文件为空，请重试')
  return result
}
