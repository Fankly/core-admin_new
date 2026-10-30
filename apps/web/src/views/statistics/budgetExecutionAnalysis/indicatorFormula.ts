// 指标计算公式映射，口径需与后端计算逻辑保持一致，修改后端计算时请同步本文件。
// 口径参考位置（project-process/renren-admin）：
// - 完成率：BudgetStatisticsService / BudgetStatisticsYdService / XmmbzYapService
// - 扩展版指标：BudgetStatisticsExtService / XmmbzYapExtService
// 注意：结余率（JYL）、预计结余（YJJY）等数据绑定类指标后端未内置计算公式，口径明确后再补充。
export const INDICATOR_FORMULAS: Record<string, string> = {
  WCL: '完成率（%）= 完成值 ÷ 目标值 × 100%',
  LXL: '立项率（按金额）（%）= 立项值 ÷ 目标值 × 100%',
  XMZBL: '项目招标率（按数量）（%）= 已招投标项目数量 ÷ 项目数量 × 100%。',
  XMHTQDL: '项目合同签订率（按数量）（%）= 合同签订项目数量 ÷ 项目数量 × 100%。',
  XMKGL: '项目开工率（按数量）（%）= 已开工项目数量 ÷ 项目数量 × 100%。',
  GBL: '关闭率（按项目数量）（%）= 关闭数量 ÷ 项目数量 × 100%',
  // 同比/环比两项后端在 BudgetStaticsTbHbService.buildData 中计算：金额=本期完成值−上期完成值，比率=本期完成率−上期完成率。
  TBHBJE: '同比/环比金额 = 本期完成值 − 上期完成值',
  TBHBL: '同比/环比比率 = 本期完成率 − 上期完成率'
}

// 动态列兼容「单位code_指标code」及「ORGID_单位code;INDICATORID_指标code」，单位 code 本身可能含下划线，
// 故按已知指标 code 做后缀匹配，避免简单 split 出错。
// 同比/环比的 TBHBJE/TBHBL 后端用 getFieldNotAddStart 生成「单位code;INDICATORID_TBHBJE」，
// 动态列用 getField 生成「ORGID_单位code;INDICATORID_TBHBJE」，两者均以「;INDICATORID_<code>」结尾。
export const getIndicatorCodeByField = (field?: string): string | undefined => {
  if (!field) return undefined
  return Object.keys(INDICATOR_FORMULAS).find((code) => field === code || field.endsWith(`_${code}`) || field.endsWith(`;INDICATORID_${code}`))
}

export const getFormulaByField = (field?: string): string | undefined => {
  const code = getIndicatorCodeByField(field)
  return code ? INDICATOR_FORMULAS[code] : undefined
}

// 导出时写入单元格的 Excel 公式：refs 为同一「分组前缀」下引用的指标代码，
// 引用列不存在时（该指标组合未展示）该列仍导出静态值。口径与上方文字公式保持一致。
// 输入单元格保存原始数值，显示精度与后端计算精度分别处理。
export interface BudgetExecutionFormulaContext {
  reportType: 'budget' | 'yap'
  extended: boolean
  unitType: 'SGS' | 'DW' | 'BM'
}

export const resolveBudgetExecutionUnitType = (cropFlag: string, nodeTypes: string[]): BudgetExecutionFormulaContext['unitType'] => {
  // 与 DwUtil.getDwData/getDwDataExt 一致，混选时成本中心优先，未选时按当前单位权限。
  if (nodeTypes.includes('BM')) return 'BM'
  if (nodeTypes.some((type) => ['CITY', 'COUNTY', 'ZSDW'].includes(type))) return 'DW'
  return cropFlag === 'PROVINCE' ? 'SGS' : 'DW'
}

export interface IndicatorCellFormula {
  // ratio：refs 为 [分子, 分母] 的指标代码，按 multiplier 缩放后舍入 scale 位；
  // diff：refs 为 [本期, 上期] 的指标代码，公式为「本期 − 上期」按 scale 位舍入，与后端 BigDecimal.subtract 口径一致。
  kind: 'ratio' | 'diff'
  refs: [string, string]
  multiplier: number
  scale: number
}

const INDICATOR_CELL_FORMULAS: Record<string, Pick<IndicatorCellFormula, 'refs'>> = {
  WCL: { refs: ['WCZ', 'MBZ'] },
  LXL: { refs: ['LXZ', 'MBZ'] },
  XMZBL: { refs: ['YZTBXMSL', 'XMSL'] },
  XMHTQDL: { refs: ['HTQDXMSL', 'XMSL'] },
  XMKGL: { refs: ['YKGXMSL', 'XMSL'] },
  GBL: { refs: ['GBSL', 'XMSL'] },
  // 同比/环比两项后端在 BudgetStaticsTbHbService.buildData 计算，refs 复用同一指标 code，
  // 由 getIndicatorCellFormula 注入 CURRENT/LAST 期间标记区分本期与上期。
  TBHBJE: { refs: ['WCZ', 'WCZ'] },
  TBHBL: { refs: ['WCL', 'WCL'] }
}

export const getIndicatorCellFormula = (field: string, context: BudgetExecutionFormulaContext): IndicatorCellFormula | undefined => {
  const code = getIndicatorCodeByField(field)
  if (!code || (!context.extended && code !== 'WCL')) return undefined
  // 同比环比金额/比率为两期相减，与单位维度无关，单位行、合计行均按本期−上期计算。
  if (code === 'TBHBJE' || code === 'TBHBL') {
    const baseRefs = INDICATOR_CELL_FORMULAS[code].refs
    return {
      kind: 'diff',
      // refs[0] 加 CURRENT 标记 → 本期，refs[1] 加 LAST 标记 → 上期，与 DwUtil.getTbhbField 命名一致。
      refs: [`${baseRefs[0]}`, `${baseRefs[1]}`],
      multiplier: 1,
      scale: context.extended ? 2 : 4
    }
  }
  // 同比环比在单位和指标之间插入期间标记，合计仍使用平衡目标及小数比率。
  const unitField = field.replace(/;(CURRENT|LAST);/, ';')
  const isTotal = unitField === `total_${code}` || unitField === `ORGID_total;INDICATORID_${code}`
  // 成本中心只有预算执行扩展版的完成率、立项率，以及合计列参与后端现算。
  if (!isTotal && context.unitType === 'BM' && !(context.extended && context.reportType === 'budget' && ['WCL', 'LXL'].includes(code))) {
    return undefined
  }
  const refs: [string, string] = [...INDICATOR_CELL_FORMULAS[code].refs]
  if (['WCL', 'LXL'].includes(code) && (isTotal || (context.extended && context.reportType === 'yap' && context.unitType === 'DW'))) {
    refs[1] = 'PHMBZ'
  }
  return {
    kind: 'ratio',
    refs,
    multiplier: isTotal && ['WCL', 'LXL', 'GBL'].includes(code) ? 1 : 100,
    scale: context.extended ? 2 : 4
  }
}
