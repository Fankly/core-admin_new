import Mock from 'mockjs'
import { getQueryValue, success } from '../helpers'
import type { MockOptions } from '../helpers'

interface MockAssetRow {
  equipcode: string
  materialname: string
  erpequipcode: string
  erpequipname: string
  iszzsb: string
  astnum: string
  astname: string
  erpzcmxl: string
  erpzcmxlmc: string
  asttime: string
  originalequipvalue: number
  netastvalue: number
  dydjName: string
  mcppd: string
  zcsx: string
  yglxmje: number
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const createAssetRow = (sequence: number): MockAssetRow => ({
  equipcode: `PMS-XQ-${String(sequence).padStart(3, '0')}`,
  materialname: ['10kV架空线路', '配电变压器', '环网柜', '低压台区'][sequence % 4],
  erpequipcode: `ERP-EQ-${String(sequence).padStart(5, '0')}`,
  erpequipname: ['架空线路设备', '配电变压器设备', '环网柜设备', '低压台区设备'][sequence % 4],
  iszzsb: sequence % 3 === 0 ? '1' : '0',
  astnum: `AST-XQ-${String(sequence).padStart(6, '0')}`,
  astname: `配网资产样例${sequence}`,
  erpzcmxl: `ZC-${String(1100 + sequence)}`,
  erpzcmxlmc: sequence % 2 ? '输电线路' : '配电设备',
  asttime: `202${5 + (sequence % 2)}-${String((sequence % 9) + 1).padStart(2, '0')}-15`,
  originalequipvalue: 86.5 + sequence * 12.75,
  netastvalue: 62.2 + sequence * 8.4,
  dydjName: sequence % 2 ? '10kV' : '0.4kV',
  mcppd: sequence % 2 ? '100%' : '98%',
  zcsx: sequence % 2 ? '公共资产' : '用户资产',
  yglxmje: sequence * 5.8
})

const lineStation = {
  pmsZyxlCode: 'XL-10KV-001',
  pmsDyxlCode: 'XL-04KV-001',
  pmsDytqCode: 'TQ-001',
  pmsZyxlName: '10kV城北线',
  pmsDyxlName: '0.4kV城北一线',
  pmsDytqName: '城北一号台区',
  pmsYjwl: '南京供电公司城北运检网格',
  pmsBdzName: '城北变电站',
  pmsPdbyqName: '城北一号配电变压器',
  pmsYjfl: '配网设备治理',
  pmsEjfl: '低压台区改造',
  pmsXmlb: '生产技改',
  pmsGzdx: '更换老旧线路及配电变压器，完善低压台区供电能力。',
  pmsWtyp: '现状设备运行年限较长，存在供电可靠性不足问题。',
  pmsWtms: '部分线路线径偏小，台区负载率较高，需要安排改造。'
}

const rows = [1, 2, 3, 4].map(createAssetRow)

Mock.mock(/xmSbzc\/getSbzcInfoByXmId(?:\?[^#]*)?$/, 'get', (options: MockOptions) => {
  const xmId = getQueryValue(options.url, 'xmId')
  return success({
    xmId,
    amount: 528.6,
    dnys: 186.2,
    rate: 42.18,
    lineStation: clone(lineStation),
    sbzcs: clone(rows)
  })
})
