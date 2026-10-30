import type { AssetKind } from '@/api/xmInfo/equipmentAssets'
import type { AssetField, AssetKindConfig } from './types'

const field = (prop: string, label: string, group: string, options: Omit<AssetField, 'prop' | 'label' | 'group'> = {}): AssetField => ({
  prop,
  label,
  group,
  type: 'text',
  width: 160,
  ...options
})

const pmsFields: AssetField[] = [
  field('pmsid', 'PMS项目ID', '项目与资产'),
  field('prjcode', '国网项目编码', '项目与资产', { required: true, visible: true, width: 190 }),
  field('equipcode', 'PMS设备编号', '设备信息', { visible: true, width: 180 }),
  field('materialname', 'PMS设备名称', '设备信息', { required: true, visible: true, width: 180 }),
  field('materialtype', '设备类型', '设备信息', { visible: true }),
  field('manufacturer', '生产厂家', '设备信息', { visible: true, width: 180 }),
  field('astnum', 'ERP资产编号', '项目与资产', { visible: true, width: 180 }),
  field('psrid', '设备ID', '项目与资产', { width: 190 }),
  field('originalequipvalue', '资产原值（万元）', '价值与时间', { type: 'number', visible: true, width: 160 }),
  field('netastvalue', '资产净值（万元）', '价值与时间', { type: 'number', visible: true, width: 160 }),
  field('astname', '资产名称', '项目与资产', { visible: true, width: 180 }),
  field('asttime', '资本化日期', '价值与时间', { type: 'date', visible: true }),
  field('zccjtime', '资产创建日期', '价值与时间', { type: 'date' }),
  field('erpzcmxl', 'ERP资产明细类', 'ERP与PMS'),
  field('erpequipcode', 'ERP设备编码', 'ERP与PMS'),
  field('erpequipname', 'ERP设备名称', 'ERP与PMS', { width: 180 }),
  field('dydj', '电压等级', '设备信息', { visible: true }),
  field('pmsAnlnr', 'PMS资产编号', 'ERP与PMS', { width: 180 }),
  field('pmsAstname', 'PMS资产名称', 'ERP与PMS', { width: 180 }),
  field('pmsZastnam', 'PMS资产原值', 'ERP与PMS', { width: 180 }),
  field('pmsZastnvl', 'PMS资产净值', 'ERP与PMS', { width: 180 }),
  field('pmsCapitDate', 'PMS资本化日期', '价值与时间', { type: 'date' }),
  field('erpUpdateTime', 'ERP更新标识', '价值与时间', { type: 'date' }),
  field('mcppd', '名称匹配度', '状态与标记'),
  field('iszzsb', '是否自主资产', '状态与标记', { type: 'boolean' }),
  field('zcsx', '资产属性', '状态与标记')
]

const sharedDeviceFields: AssetField[] = [
  field('objid', '来源对象ID', '项目与资产', { width: 190 }),
  field('prjid', '项目ID', '项目与资产', { required: true, visible: true, width: 190 }),
  field('astid', '资产ID', '项目与资产', { width: 190 }),
  field('proclassification', '专业分类', '设备信息', { visible: true }),
  field('equiptype', '设备类型', '设备信息', { visible: true }),
  field('equipcode', '设备编码', '设备信息', { visible: true, width: 180 }),
  field('equipname', '设备名称', '设备信息', { required: true, visible: true, width: 200 }),
  field('voltagelevel', '电压等级', '设备信息', { visible: true }),
  field('originalequipvalue', '设备原值（元）', '资产价值', { type: 'number', visible: true, width: 150 }),
  field('netastvalue', '资产净值（元）', '资产价值', { type: 'number', visible: true, width: 150 }),
  field('stationlinename', '站线名称', '站线与运维', { visible: true, width: 200 }),
  field('stationlinevoltlevel', '站线电压等级', '站线与运维', { width: 170 }),
  field('repairmaterials', '检修材料', '运行与检修', { type: 'textarea', width: 200 }),
  field('astnum', '资产编号', '项目与资产', { visible: true, width: 180 }),
  field('prjlibrary', '项目库', '项目与资产'),
  field('psrid', '设备资源ID', '项目与资产', { width: 190 }),
  field('equipdepreciationyears', '设备折旧年限', '资产价值'),
  field('stationlineid', '站线ID', '站线与运维', { width: 190 }),
  field('stationlinetype', '站线类型', '站线与运维'),
  field('stationlinecode', '站线编码', '站线与运维', { width: 180 }),
  field('bay', '间隔单元', '站线与运维'),
  field('bayname', '间隔单元名称', '站线与运维', { width: 180 }),
  field('isoutage', '是否停电', '运行与检修', { type: 'boolean' }),
  field('oamorgid', '运维单位ID', '站线与运维', { width: 190 }),
  field('oamorgname', '运维单位名称', '站线与运维', { visible: true, width: 200 }),
  field('defectquantity', '缺陷数量', '运行与检修', { type: 'number', visible: true }),
  field('stateevaluation', '状态评价', '运行与检修', { type: 'textarea' }),
  field('runcode', '运行编码', '运行与检修', { width: 180 }),
  field('equipfactory', '设备厂家', '设备信息', { width: 180 }),
  field('equipmodel', '设备型号', '设备信息', { width: 180 }),
  field('factorycode', '出厂编号', '设备信息', { width: 180 }),
  field('factorydate', '出厂日期', '设备信息'),
  field('operatedate', '投运日期', '运行与检修'),
  field('equipvolume', '设备容量', '设备信息', { type: 'number' }),
  field('equipstatus', '设备状态', '运行与检修', { visible: true }),
  field('astequiptype', '资产级设备类型', '资产级设备'),
  field('astequippsrid', '资产级设备资源ID', '资产级设备', { width: 210 }),
  field('equipastid', '资产级设备资产ID', '资产级设备', { width: 210 }),
  field('astequipcode', '所属资产级设备编码', '资产级设备', { width: 210 }),
  field('astequipname', '资产级设备名称', '资产级设备', { width: 200 })
]

const gjsbFields: AssetField[] = [
  field('astcreatetime', '资产创建时间', '项目与资产'),
  field('astname', '资产名称', '项目与资产', { width: 180 }),
  field('astnature', '资产性质', '项目与资产'),
  field('asttime', '资产投运时间', '项目与资产'),
  ...sharedDeviceFields,
  field('ifmatch', '是否匹配', '运行与检修', { type: 'boolean' }),
  field('isrural', '是否农网', '运行与检修', { type: 'boolean' })
]

const glsbFields: AssetField[] = [
  ...sharedDeviceFields,
  field('sfupd', '是否更新', '更新信息', { type: 'boolean' }),
  field('updoriginalequipvalue', '更新后设备原值', '更新信息'),
  field('updnetastvalue', '更新后资产净值', '更新信息'),
  field('gsdm', '公司代码', '更新信息')
]

export const assetKindConfigs: Record<AssetKind, AssetKindConfig> = {
  pmsEquip: {
    kind: 'pmsEquip',
    label: 'PMS设备资产',
    projectLabel: '项目编码',
    projectField: 'prjcode',
    fields: pmsFields
  },
  gjsb: {
    kind: 'gjsb',
    label: '运维设备资产',
    projectLabel: '项目ID',
    projectField: 'prjid',
    fields: gjsbFields
  },
  glsb: {
    kind: 'glsb',
    label: '检修设备资产',
    projectLabel: '项目ID',
    projectField: 'prjid',
    fields: glsbFields
  }
}

export const assetKinds: AssetKind[] = ['pmsEquip', 'gjsb', 'glsb']
