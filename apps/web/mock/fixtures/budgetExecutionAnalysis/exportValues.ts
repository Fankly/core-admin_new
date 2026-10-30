import Decimal from 'decimal.js'

type Values = Record<string, string | number | null | undefined>

// 主表、同比和环比共用；保留接口空值，不在 mock 中提前格式化为零。
export const BUDGET_EXPORT_CASES: Array<{ id: string; name: string; values: Values; last?: Values; expectedRate: number | string }> = [
  { id: 'null', name: '导出校验：空值', values: { MBZ: null, PHMBZ: null, WCZ: null, WCL: null, DFJ: null, LXZ: null }, expectedRate: '-' },
  { id: 'empty', name: '导出校验：空字符串', values: { MBZ: '', PHMBZ: '', WCZ: '', WCL: '', DFJ: '', LXZ: '' }, expectedRate: '-' },
  { id: 'absent', name: '导出校验：缺失字段', values: {}, expectedRate: '-' },
  { id: 'dash', name: '导出校验：横线占位', values: { MBZ: '-', PHMBZ: '-', WCZ: '-', WCL: '-', DFJ: '-', LXZ: '-' }, expectedRate: '-' },
  { id: 'zero', name: '导出校验：零分母', values: { MBZ: 0, PHMBZ: '0.00', WCZ: 10, WCL: 0 }, expectedRate: '-' },
  { id: 'numerator', name: '导出校验：空分子', values: { MBZ: 100, PHMBZ: 100, WCZ: null, WCL: null }, expectedRate: 0 },
  { id: 'denominator', name: '导出校验：空分母', values: { MBZ: null, PHMBZ: null, WCZ: 10, WCL: 0 }, expectedRate: '-' },
  {
    id: 'small', name: '导出校验：小额有效分母',
    values: { MBZ: '0.00004', PHMBZ: '0.00004', WCZ: '0.00002', WCL: 50, DFJ: '-0.00002' }, expectedRate: 50
  },
  {
    id: 'last', name: '导出校验：仅对比期分母为空',
    values: { MBZ: 200, PHMBZ: 200, WCZ: 50, WCL: 25 },
    last: { MBZ: null, PHMBZ: null, WCZ: 10, WCL: 0 }, expectedRate: 25
  }
]

export const createBudgetExportMockRows = (parentId: string) =>
  BUDGET_EXPORT_CASES.map(({ id, name, values }) => ({
    id: `EXPORT-${id}`, parentId, name, leaf: '1', subName: '', gkbm: '0012', ysly: '', cnxm: '', cnxmms: '', ...values
  }))

export const comparisonField = (period: 'CURRENT' | 'LAST', code: string) => `ORGID_DW001;${period};INDICATORID_${code}`

export const createBudgetComparisonMockRows = (rows: Record<string, any>[], searchType: string, indicators: string[]) =>
  rows.map((row) => {
    const result: Record<string, any> = { ...row }
    const fixture = BUDGET_EXPORT_CASES.find(({ id }) => row.id === `EXPORT-${id}`)
    const last: Values = {}
    indicators.forEach((code) => {
      const current = row[code]
      const empty = current == null || current === '' || current === '-'
      last[code] = fixture?.last
        ? fixture.last[code]
        : empty || code === 'WCL'
        ? current
        : new Decimal(current).mul(searchType === '2' ? 0.91 : 0.82).toString()
      result[comparisonField('CURRENT', code)] = current
      result[comparisonField('LAST', code)] = last[code]
    })
    // 同环比金额、率差不含除法；缺少任一期数值时返回空值，由导出补零。
    const difference = (code: string) => {
      const current = row[code]
      const previous = last[code]
      if ([current, previous].some((value) => value == null || value === '' || value === '-')) return null
      return new Decimal(current).sub(previous!).toString()
    }
    result['ORGID_DW001;INDICATORID_TBHBJE'] = difference('WCZ')
    result['ORGID_DW001;INDICATORID_TBHBL'] = difference('WCL')
    return result
  })
