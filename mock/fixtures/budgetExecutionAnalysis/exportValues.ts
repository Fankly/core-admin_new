export type BudgetMockValues = Record<string, string | number | null | undefined>

// 传输边界保留 null / ''，由前端补零及计算比率；Mock 不预先格式化。
export const BUDGET_EXPORT_CASES: Array<{ id: string; name: string; values: BudgetMockValues; empty?: null | ''; hidden?: boolean; aggregateOverride?: number | null }> = [
  { id: 'null', name: '导出校验：null 空值', values: {}, empty: null },
  { id: 'empty', name: '导出校验：空字符串', values: {}, empty: '' },
  { id: 'zero', name: '导出校验：零分母', values: { MBZ: 0, PHMBZ: '0.0000', WCZ: 10, LXZ: 5, XMSL: 0 } },
  { id: 'valid-zero', name: '导出校验：有效零值', values: { MBZ: 100, PHMBZ: 100, WCZ: 0, LXZ: 0, JYL: 0 } },
  { id: 'missing-rate', name: '导出校验：空比率但引用值完整', values: { MBZ: 100, PHMBZ: 200, WCZ: 50, WCL: null, JYL: '' } },
  { id: 'missing-denominator', name: '导出校验：空分母', values: { MBZ: null, PHMBZ: null, WCZ: 10, WCL: 0 } },
  { id: 'missing-total', name: '导出校验：汇总返回空值', values: { MBZ: 100, PHMBZ: 200, WCZ: 10, LXZ: 20 }, aggregateOverride: null },
  { id: 'stale-total', name: '导出校验：汇总返回旧值', values: { MBZ: 100, PHMBZ: 200, WCZ: 10, LXZ: 20 }, aggregateOverride: 999 },
  { id: 'small', name: '导出校验：小额有效分母', values: { MBZ: '0.00004', PHMBZ: '0.00008', WCZ: '0.00002', DFJ: '-0.00002', LXZ: '0.00001' } },
  {
    id: 'negative',
    name: '导出校验：负数及高精度金额',
    values: { MBZ: '123456789.987654', PHMBZ: '123456789.987654', WCZ: '-1234.567891', JYL: '-1.234567' }
  },
  { id: 'sum-a', name: '合计明细 A', values: { MBZ: 100, PHMBZ: 120, MBZ_NEW: 150, DFJ: 5, WCZ: 25, LXZ: 60 } },
  { id: 'sum-b', name: '合计明细 B', values: { MBZ: 200, PHMBZ: 240, MBZ_NEW: 300, DFJ: 10, WCZ: 100, LXZ: 120 } },
  { id: 'visible', name: '隐藏节点校验：已显示明细', values: { MBZ: 30, PHMBZ: 30, WCZ: 6 } },
  { id: 'hidden', name: '隐藏节点校验：未显示但参与统计', values: { MBZ: 17, PHMBZ: 17, WCZ: 4 }, hidden: true }
]
