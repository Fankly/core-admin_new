export type RealEstateFieldType = 'text' | 'number' | 'date' | 'textarea' | 'boolean'

export interface RealEstateField {
  prop: string
  label: string
  group: string
  type: RealEstateFieldType
  width: number
  visible?: boolean
  required?: boolean
  readonly?: boolean
}

const field = (
  prop: string,
  label: string,
  group: string,
  options: Partial<Omit<RealEstateField, 'prop' | 'label' | 'group'>> = {}
): RealEstateField => ({
  prop,
  label,
  group,
  type: 'text',
  width: 160,
  ...options
})

export const realEstateFields: RealEstateField[] = [
  field('fcbh', '房产编号', '基本信息', { required: true, visible: true, width: 170 }),
  field('fcmc', '房产名称', '基本信息', { required: true, visible: true, width: 190 }),
  field('fcdl', '房产大类', '基本信息', { visible: true }),
  field('fclx', '房产类型', '基本信息', { visible: true }),
  field('fcxl', '房产小类', '基本信息'),
  field('swid', '实物ID', '基本信息'),
  field('dataId', '数据ID', '基本信息'),
  field('qkjzybm', '全口径资源编码', '基本信息', { visible: true, width: 190 }),
  field('xmbmWbs', '项目编码（WBS）', '基本信息', { visible: true, width: 190 }),
  field('ly', '来源', '基本信息'),
  field('zczt', '资产状态', '基本信息', { visible: true }),
  field('zcyt', '资产用途', '基本信息', { visible: true }),

  field('province', '省（自治区、直辖市）', '位置与权属', { visible: true, width: 190 }),
  field('city', '市（地、州、盟）', '位置与权属', { visible: true, width: 170 }),
  field('county', '区/县', '位置与权属', { visible: true }),
  field('street', '乡镇/街道', '位置与权属'),
  field('location', '具体位置', '位置与权属', { visible: true, width: 220 }),
  field('lal', '经纬度', '位置与权属'),
  field('cqdw', '产权单位', '位置与权属', { visible: true, width: 180 }),
  field('fczzrmc', '房产证载人名称', '位置与权属', { width: 190 }),
  field('bdcqzh', '不动产权证号', '位置与权属', { visible: true, width: 190 }),
  field('sfyz', '是否有证', '位置与权属', { type: 'boolean', visible: true, width: 110 }),
  field('wzyy', '无证原因', '位置与权属', { type: 'textarea', width: 220 }),
  field('sstd', '所属土地', '位置与权属'),
  field('sstdbh', '所属土地编号', '位置与权属', { width: 180 }),

  field('fcqdsj', '房产取得时间', '规模与建筑', { type: 'date', visible: true, width: 150 }),
  field('jcnf', '建成年份', '规模与建筑', { type: 'number' }),
  field('jzmj', '建筑面积（平方米）', '规模与建筑', { type: 'number', visible: true, width: 170 }),
  field('zytdmj', '占用土地面积（平方米）', '规模与建筑', { type: 'number', width: 190 }),
  field('zjzcs', '总建筑层数', '规模与建筑', { type: 'number' }),
  field('dscs', '地上层数', '规模与建筑', { type: 'number' }),
  field('dxcs', '地下层数', '规模与建筑', { type: 'number' }),
  field('rjl', '容积率', '规模与建筑', { type: 'number' }),
  field('zymj', '自用面积', '规模与建筑', { type: 'number', visible: true }),
  field('ysymj', '已使用面积', '规模与建筑', { type: 'number', visible: true }),
  field('xzmj', '闲置面积', '规模与建筑', { type: 'number', visible: true }),
  field('czmj', '出租面积', '规模与建筑', { type: 'number' }),
  field('bzymj', '被占用面积', '规模与建筑', { type: 'number' }),

  field('zcyz', '资产原值总值', '价值信息', { type: 'number', visible: true, width: 160 }),
  field('zcjz', '资产净值总值', '价值信息', { type: 'number', visible: true, width: 160 }),
  field('ljzj', '累计折旧总值', '价值信息', { type: 'number', width: 160 }),
  field('ljnzj', '累计年租金（万元）', '价值信息', { type: 'number', width: 170 }),
  field('zjly', '资金来源', '价值信息'),
  field('tzly', '投资来源', '价值信息'),

  field('gkglbm', '归口管理部门', '管理信息', { visible: true, width: 180 }),
  field('sybgdw', '使用保管单位', '管理信息', { visible: true, width: 180 }),
  field('sybgbz', '使用保管班组', '管理信息'),
  field('sybgr', '使用保管人', '管理信息'),
  field('ssxzmc', '所属线站名称', '管理信息', { width: 180 }),
  field('ssxzsbbm', '所属线站设备编码', '管理信息', { width: 190 }),
  field('fssbZcbm', '附属设备资产编码', '管理信息', { width: 190 }),

  field('qztp', '权证图片', '资料与备注'),
  field('qztpUuid', '权证图片UUID', '资料与备注'),
  field('wgtp', '外观图片', '资料与备注'),
  field('wgtpUuid', '外观图片UUID', '资料与备注'),
  field('zdt', '宗地图', '资料与备注'),
  field('zckp', '资产卡片', '资料与备注'),
  field('remart', '备注', '资料与备注', { type: 'textarea', width: 220 })
]

export const formatRealEstateValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return value.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
  return String(value)
}
