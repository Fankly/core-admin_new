import type { VxeGridProps } from 'vxe-table'
import { formatRealEstateValue, realEstateFields } from './config'

export type EstateTableColumn = NonNullable<VxeGridProps['columns']>[number]

const realEstateFieldMap = new Map(realEstateFields.map((item) => [item.prop, item]))

const createEstateColumn = (prop: string, title?: string, width?: number): EstateTableColumn => {
  const item = realEstateFieldMap.get(prop)
  return {
    field: prop,
    title: title || item?.label || prop,
    width: width || item?.width || 160,
    visible: true,
    formatter: ({ cellValue }: any) => formatRealEstateValue(cellValue)
  }
}

const createEstateGroup = (title: string, children: EstateTableColumn[]): EstateTableColumn => ({
  title,
  children
})

const centerEstateGroupHeaders = (column: EstateTableColumn): EstateTableColumn => {
  const children = (column as EstateTableColumn & { children?: EstateTableColumn[] }).children
  if (!Array.isArray(children)) return column
  return {
    ...column,
    headerAlign: 'center',
    children: children.map(centerEstateGroupHeaders)
  }
}

export const createRealEstateDataColumns = (): EstateTableColumn[] => [
  createEstateColumn('dataId', 'ID', 120),
  createEstateColumn('qkjzybm'),
  createEstateColumn('swid'),
  createEstateColumn('cqdw'),
  createEstateGroup('房产基本信息', [
    createEstateColumn('sstdbh'),
    createEstateColumn('sstd'),
    createEstateColumn('fcbh'),
    createEstateColumn('fcmc'),
    createEstateGroup('地址信息', [
      createEstateColumn('province'),
      createEstateColumn('city'),
      createEstateColumn('county'),
      createEstateColumn('street'),
      createEstateColumn('location'),
      createEstateColumn('lal')
    ]),
    createEstateColumn('ly'),
    createEstateColumn('tzly'),
    createEstateColumn('zjly'),
    createEstateColumn('fcqdsj'),
    createEstateColumn('fcdl'),
    createEstateColumn('fcxl'),
    createEstateColumn('fclx'),
    createEstateColumn('jzmj'),
    createEstateColumn('zytdmj'),
    createEstateColumn('rjl'),
    createEstateColumn('dscs'),
    createEstateColumn('dxcs', '底下层数'),
    createEstateColumn('zjzcs'),
    createEstateColumn('jcnf'),
    createEstateColumn('wgtp')
  ]),
  createEstateGroup('权证信息', [
    createEstateColumn('sfyz'),
    createEstateGroup('有证', [createEstateColumn('bdcqzh'), createEstateColumn('fczzrmc'), createEstateColumn('qztp'), createEstateColumn('zdt')]),
    createEstateColumn('wzyy')
  ]),
  createEstateGroup('使用情况(平方米)', [
    createEstateColumn('ysymj'),
    createEstateColumn('zymj'),
    createEstateColumn('czmj'),
    createEstateColumn('bzymj'),
    createEstateColumn('xzmj')
  ]),
  createEstateGroup('出租情况', [createEstateColumn('ljnzj', '累计年租金(万元)')]),
  createEstateGroup('资产汇总信息', [
    createEstateColumn('zckp'),
    createEstateColumn('zcyz'),
    createEstateColumn('ljzj'),
    createEstateColumn('zcjz'),
    createEstateColumn('zczt'),
    createEstateColumn('zcyt')
  ]),
  createEstateGroup('', [createEstateColumn('sybgdw'), createEstateColumn('sybgbz'), createEstateColumn('sybgr'), createEstateColumn('gkglbm')]),
  createEstateGroup('', [
    createEstateColumn('ssxzsbbm'),
    createEstateColumn('ssxzmc'),
    createEstateColumn('xmbmWbs'),
    createEstateColumn('fssbZcbm', '附属设备（配套设施）资产编码')
  ]),
  createEstateColumn('remart')
]

export const createOwnRealEstateTableColumns = (): VxeGridProps['columns'] => [
  { type: 'checkbox', width: 48, fixed: 'left' },
  createEstateGroup('自有房产', createRealEstateDataColumns()),
  { field: 'operation', title: '操作', width: 92, fixed: 'right', slots: { default: 'operation' } }
]

export const createOwnRealEstateDetailColumns = (): VxeGridProps['columns'] => createRealEstateDataColumns().map(centerEstateGroupHeaders)
