import ExcelJS from 'exceljs'
import Mock from 'mockjs'
import { binaryResponse, pageResult, parseBody, success } from '../helpers'
import type { MockOptions } from '../helpers'

/**
 * 物料价格库 mock：覆盖 src/api/ai/materialPriceLibrary 的 6 个接口。
 * 供审核工作台正文中的价格跳转联调（openPopPage 新标签页，pop=true）：
 * .gwPriceView → tab=materialPriceLibrary（国网参考采购价格）
 * .materialNewestPriceView → tab=historyPrice（历史项目领用物料单价）
 */

// 单价类型字典：historyPrice 搜索项 enum 走 getPublicData('AI_MAT_PRICE_HIS_TYPE_COM')
const UNIT_PRICE_TYPES = [
  { id: '1', code: '1', name: '移动加权平均价', sort: 1 },
  { id: '2', code: '2', name: '计划价', sort: 2 },
  { id: '3', code: '3', name: '协议库存价', sort: 3 },
  { id: '4', code: '4', name: '集中采购价', sort: 4 }
]

// 物料主数据：两个 tab 共用，便于与审核结论中的价格偏差结论相互对照
const MATERIALS = [
  { code: '500123401', desc: '柱上真空断路器 ZW32-12/630-20 户外', unit: '台', price: 12680, float: 0.1172 },
  { code: '500123402', desc: '跌落式熔断器 RW12-12/200A', unit: '只', price: 268.5, float: 0.0342 },
  { code: '500123403', desc: '交联聚乙烯绝缘电缆 YJV22-8.7/15kV-3×240', unit: 'm', price: 486.2, float: -0.0215 },
  { code: '500123404', desc: '油浸式配电变压器 S13-M-400/10', unit: '台', price: 58600, float: 0.0568 },
  { code: '500123405', desc: '环网柜 HXGN-12 四进四出', unit: '台', price: 74200, float: 0.082 },
  { code: '500123406', desc: '钢芯铝绞线 JL/G1A-240/30', unit: 'km', price: 42800, float: 0.0136 },
  { code: '500123407', desc: '复合绝缘子 FXBW4-10/70', unit: '只', price: 96.8, float: -0.0408 },
  { code: '500123408', desc: '低压综合配电箱 JP-400/0.4kV', unit: '台', price: 8650, float: 0.0294 },
  { code: '500123409', desc: '预制混凝土电杆 φ190×12m 非预应力', unit: '根', price: 1420, float: 0.0075 },
  { code: '500123410', desc: '防坠落装置 导轨式 不锈钢 12m', unit: '套', price: 3260, float: 0.1035 },
  { code: '500123411', desc: '智能电能表 单相费控 5(60)A', unit: '只', price: 168.4, float: -0.0126 },
  { code: '500123412', desc: '故障指示器 架空型 带通信模块', unit: '组', price: 2180, float: 0.0463 },
  { code: '500123413', desc: '接地电阻柜 10kV 中性点小电阻', unit: '面', price: 33500, float: 0.0208 }
]

const PROJECTS = [
  { pspid: 'JS2026-LYG-0001', post1: '连云港输电运检中心220kV海蔷4917线等线路防坠落装置修理' },
  { pspid: 'JS2026-LYG-0002', post1: '连云港赣榆区10kV城头线配电线路绝缘化改造' },
  { pspid: 'JS2026-LYG-0003', post1: '连云港东海县110kV牛山变电站主变增容工程' }
]

const includesText = (value: unknown, keyword: unknown) => {
  const text = String(keyword ?? '').trim()
  if (!text) return true
  return String(value ?? '').includes(text)
}

const matchesList = (value: unknown, list: unknown) => {
  if (!Array.isArray(list) || !list.length) return true
  return list.some((item) => includesText(value, item))
}

const pad = (value: number, length = 3) => String(value).padStart(length, '0')

interface MockMaterialPriceRow extends Record<string, string | number> {
  id: string
  materialCode: string
  materialDescription: string
  measurementUnit: string
  purchasePrice: number
  priceFloatPercent: number
  updateDate: string
  updateTime: string
}

/** 国网参考采购价格：主数据一条一行，再按季度下发追加历史批次，凑出可翻页的数据量 */
const PRICE_LIBRARY_ROWS: MockMaterialPriceRow[] = MATERIALS.flatMap((material, index) => {
  const batches = [
    { date: '2026-07-01', time: '2026-07-01 08:30:00', ratio: 1 },
    { date: '2026-04-01', time: '2026-04-01 08:30:00', ratio: 0.968 }
  ]
  return batches.map((batch, batchIndex) => ({
    id: `mock-mpl-${pad(index * 2 + batchIndex + 1)}`,
    materialCode: material.code,
    materialDescription: material.desc,
    measurementUnit: material.unit,
    purchasePrice: Number((material.price * batch.ratio).toFixed(2)),
    priceFloatPercent: Number((material.float * batch.ratio).toFixed(4)),
    updateDate: batch.date,
    updateTime: batch.time
  }))
})

interface MockMaterialPriceHistoryRow extends Record<string, string | number> {
  id: string
  matnr: string
  maktx: string
  unitPriceType: string
  unitPriceTypeCode: string
  unitPrice: number
  unit: string
  pspid: string
  post1: string
  mblnr: string
  mjahr: string
  createTime: string
}

/** 历史项目领用物料单价：每个项目领用主数据的一个子集，单价围绕参考价上下浮动 */
const PRICE_HISTORY_ROWS: MockMaterialPriceHistoryRow[] = PROJECTS.flatMap((project, projectIndex) =>
  MATERIALS.filter((_, index) => index % PROJECTS.length === projectIndex).flatMap((material, index) =>
    [0, 1].map((round) => {
      const seq = projectIndex * 100 + index * 10 + round + 1
      const type = UNIT_PRICE_TYPES[(projectIndex + index + round) % UNIT_PRICE_TYPES.length]
      const ratio = 1 + ((seq % 7) - 3) / 100
      return {
        id: `mock-mph-${pad(seq, 4)}`,
        matnr: material.code,
        maktx: material.desc,
        unitPriceType: type.name,
        unitPriceTypeCode: type.code,
        unitPrice: Number((material.price * ratio).toFixed(2)),
        unit: material.unit,
        pspid: project.pspid,
        post1: project.post1,
        mblnr: `49${pad(seq, 8)}`,
        mjahr: round === 0 ? '2026' : '2025',
        createTime: round === 0 ? `2026-0${(index % 6) + 3}-15` : `2025-1${index % 2}-08`
      }
    })
  )
)

const filterPriceLibraryRows = (params: Record<string, any>) =>
  PRICE_LIBRARY_ROWS.filter(
    (row) =>
      (Array.isArray(params.materialCodeList) && params.materialCodeList.length
        ? matchesList(row.materialCode, params.materialCodeList)
        : includesText(row.materialCode, params.materialCode)) && includesText(row.materialDescription, params.materialDescription)
  )

const filterPriceHistoryRows = (params: Record<string, any>) =>
  PRICE_HISTORY_ROWS.filter(
    (row) =>
      (Array.isArray(params.matnrList) && params.matnrList.length ? matchesList(row.matnr, params.matnrList) : includesText(row.matnr, params.matnr)) &&
      (Array.isArray(params.pspidList) && params.pspidList.length ? matchesList(row.pspid, params.pspidList) : includesText(row.pspid, params.pspid)) &&
      (Array.isArray(params.mblnrList) && params.mblnrList.length ? matchesList(row.mblnr, params.mblnrList) : includesText(row.mblnr, params.mblnr)) &&
      includesText(row.maktx, params.maktx) &&
      includesText(row.post1, params.post1) &&
      includesText(row.mjahr, params.mjahr) &&
      (!params.unitPriceType || [row.unitPriceTypeCode, row.unitPriceType].includes(String(params.unitPriceType)))
  )

const buildSheet = async (sheetName: string, columns: Array<{ header: string; key: string; width: number }>, rows: Record<string, any>[]) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  worksheet.columns = columns
  worksheet.addRows(rows)
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  return workbook.xlsx.writeBuffer()
}

Mock.mock(/commonCode\/getData\?[^#]*code=AI_MAT_PRICE_HIS_TYPE_COM(?:&|$)/, 'get', () => success(UNIT_PRICE_TYPES.map((item) => ({ ...item }))))

// 国网参考采购价格-分页查询
Mock.mock(/material-price-library\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  return success(pageResult(filterPriceLibraryRows(params), params.page, params.limit))
})

// 国网参考采购价格-导入（前端以 res.data 作为成功提示文案）
Mock.mock(/material-price-library\/importData(\?.*)?$/, 'post', () => success(`导入成功，共解析 ${PRICE_LIBRARY_ROWS.length} 条物料价格数据`, '导入成功'))

// 国网参考采购价格-导出
Mock.mock(/material-price-library\/exportData(\?.*)?$/, 'post', async (options: MockOptions) => {
  const rows = filterPriceLibraryRows(parseBody(options)).map((row) => ({
    ...row,
    priceFloatPercent: `${(Number(row.priceFloatPercent) * 100).toFixed(2)}%`
  }))
  const buffer = await buildSheet(
    '国网参考采购价格',
    [
      { header: '物料编码', key: 'materialCode', width: 18 },
      { header: '物料描述', key: 'materialDescription', width: 46 },
      { header: '计量单位', key: 'measurementUnit', width: 12 },
      { header: '采购价格(元)', key: 'purchasePrice', width: 16 },
      { header: '价格浮动百分比', key: 'priceFloatPercent', width: 16 },
      { header: '下发日期', key: 'updateDate', width: 14 },
      { header: '下发时间', key: 'updateTime', width: 22 }
    ],
    rows
  )
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '物料价格库.xlsx'
  })
})

// 历史项目领用物料单价-分页查询
Mock.mock(/material-price-history\/getPage(\?.*)?$/, 'post', (options: MockOptions) => {
  const params = parseBody(options)
  const rows = filterPriceHistoryRows(params).map(({ unitPriceTypeCode, ...row }) => row)
  return success(pageResult(rows, params.page, params.limit))
})

// 历史项目领用物料单价-导出
Mock.mock(/material-price-history\/exportData(\?.*)?$/, 'post', async (options: MockOptions) => {
  const rows = filterPriceHistoryRows(parseBody(options))
  const buffer = await buildSheet(
    '历史项目领用物料单价',
    [
      { header: '物料编码', key: 'matnr', width: 18 },
      { header: '物料描述', key: 'maktx', width: 46 },
      { header: '单价类型', key: 'unitPriceType', width: 18 },
      { header: '单价(元)', key: 'unitPrice', width: 14 },
      { header: '计量单位', key: 'unit', width: 12 },
      { header: '项目定义', key: 'pspid', width: 20 },
      { header: '项目描述', key: 'post1', width: 48 },
      { header: '物料凭证编号', key: 'mblnr', width: 18 },
      { header: '年度', key: 'mjahr', width: 10 },
      { header: '创建日期', key: 'createTime', width: 14 }
    ],
    rows
  )
  return binaryResponse(buffer, {
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: '历史项目领用物料单价.xlsx'
  })
})

// 历史项目领用物料单价-同步数据（前端以 res.data 作为成功提示文案）
Mock.mock(/material-price-history\/syncData(\?.*)?$/, 'post', () => success(`同步完成，本次更新 ${PRICE_HISTORY_ROWS.length} 条领用单价记录`, '同步成功'))

console.log('[Mock] materialPriceLibrary module loaded')
