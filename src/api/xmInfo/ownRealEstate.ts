import ServiceApi from '@/api/base/ServiceApi'
import { Result } from '@/api/types'

export type RealEstateRecord = Record<string, any>

const budget = ServiceApi.budget
const BASE_PATH = '/zyfc'

export interface OwnRealEstateParams {
  bmId: string // 部门ID
  dwId: string // 单位ID
  fcbh?: string // 房产编号
  fcmc?: string // 房产名称
  limit: number | string // 每页条数
  page: number | string // 当前页码
  roleCode: string // 角色编码
  roleId: string // 角色ID
  userId: string // 用户ID
}

export interface OwnRealEstateRowVO {
  bdcqzh: string // 不动产权证号
  bzymj: string // 被占用面积
  city: string // 市(地、州、盟)
  county: string // 区/县
  cqdw: string // 产权单位
  czmj: string // 出租面积
  dataId: string // 数据ID
  dscs: string // 地上层数
  dxcs: string // 地下层数
  fcbh: string // 房产编号
  fcdl: string // 房产大类
  fclx: string // 房产类型
  fcmc: string // 房产名称
  fcqdsj: string // 房产取得时间
  fcxl: string // 房产小类
  fczzrmc: string // 房产证载人名称
  fssbZcbm: string // 附属设备（配套设施）资产编码
  gkglbm: string // 归口管理部门
  id: string | number // 主键ID
  xmId?: string // 项目ID
  nd?: string // 年度
  jcnf: string // 建成年份
  jzmj: string // 建筑面积(平方米)
  lal: string // 经纬度
  ljnzj: string // 累计年租金（万元）
  ljzj: string //  累计折旧总值
  location: string // 具体位置
  ly: string // 来源
  province: string // 省(自治区、直辖市)
  qkjzybm: string // 全口径资源编码
  qztp: string // 权证图片
  qztpUuid: string // 权证图片
  remart: string //  备注
  rjl: string // 容积率
  sfyz: string // 是否有证
  sstd: string // 所属土地
  sstdbh: string // 所属土地编号
  ssxzmc: string // 所属线站名称
  ssxzsbbm: string // 所属线站设备编码
  street: string // 乡镇/街道
  swid: string // 实物ID
  sybgbz: string // 使用保管班组
  sybgdw: string // 使用保管单位
  sybgr: string // 使用保管人
  tzly: string // 投资来源
  wgtp: string // 外观图片
  wgtpUuid: string // 外观图片
  wzyy: string // 无证原因
  xmbmWbs: string // 项目编码(WBS)
  xzmj: string // 闲置面积
  ysymj: string // 已使用面积
  zcjz: string // 资产净值总值
  zckp: string // 资产卡片
  zcyt: string // 资产用途
  zcyz: string // 资产原值总值
  zczt: string // 资产状态
  zdt: string // 宗地图
  zjly: string // 资金来源
  zjzcs: string // 总建筑层数
  zymj: string // 自用面积
  zytdmj: string // 占用土地面积（平方米）
}

// 列表（按项目编码查询）
export interface OwnRealEstatePageData {
  records: OwnRealEstateRowVO[]
  total: number
  current?: number
  size?: number
}

export const pageOwnRealEstate = (
  OwnRealEstateParams: OwnRealEstateParams
): Promise<Result & { data: OwnRealEstatePageData | OwnRealEstateRowVO[] }> => {
  return budget.post(`${BASE_PATH}/page`, OwnRealEstateParams, undefined, false)
}

export interface RealEstateDetailParams {
  pageType: string // 页面类型
  xmId: string // 项目ID
}

// 详情
export const getOwnRealEstate = (pageType: string, xmId: string): Promise<Result & { data: OwnRealEstateRowVO }> => {
  return budget.get(`${BASE_PATH}/getByXmId?pageType=${pageType}&xmId=${xmId}`, {}, undefined, false)
}

// 新增/修改
export const addOwnRealEstate = (data: RealEstateRecord): Promise<Result & { data: OwnRealEstateRowVO }> => {
  return budget.post(`${BASE_PATH}/save`, data, undefined, false)
}

export interface RemoveOwnRealEstatesParams {
  createDeptId: string // 创建部门ID
  ids: string[] // 房产ID集合
  nd: string // 年度
  searchCode: string
  shxx: string
  uuid: string
}

// 删除
export const removeOwnRealEstates = (params: RemoveOwnRealEstatesParams): Promise<Result> => {
  return budget.delete(`${BASE_PATH}/delete`, params, false)
}

// 导入
export const importOwnRealEstates = (data: FormData): Promise<Result> => {
  return budget.post(`${BASE_PATH}/import`, data, undefined, false)
}

// 导出
export const exportOwnRealEstates = (params: OwnRealEstateParams): Promise<Result> => {
  return budget.exportFile(`${BASE_PATH}/export`, params, undefined, false)
}
