import type { BudgetExecutionFormulaContext } from './indicatorFormula'

const MOTHER_COMPONENTS = ['GSSX_JGBB', 'GSSX_GDGS', 'GSSX_ZSDW']
const BUDGET_SOURCE_INDICATORS = new Set(['MBZ', 'PHMBZ', 'DFJ', 'MBZ_NEW', 'NDDFJ'])
const SUM_INDICATORS = new Set([
  ...BUDGET_SOURCE_INDICATORS,
  'LXZ',
  'WCZ',
  'YJQNWCZ',
  'YJJY',
  'PHTZFD',
  'YFJ',
  'XMSL',
  'GBSL',
  'YKGXMSL',
  'YZTBXMSL',
  'HTQDXMSL',
  'ZFWHTJE',
  'ZWZHTJE',
  'ZFWZBJE',
  'ZWZZBJE',
  'YGBXMSFYS'
])

// 报表口径：母公司的金额、数量均为机关本部 + 供电公司 + 直属单位（分公司）。
// 包括后端单独提供的目标值、待分解等；比率由汇总后的分子、分母计算，不相加。
export const getProvinceSumFields = (field: string, context: BudgetExecutionFormulaContext): string[] => {
  if (context.unitType !== 'SGS') return []
  const match = field.match(/^(ORGID_)?(GSSX_MGS|GSSX_SGS)(;(?:CURRENT;|LAST;)?INDICATORID_|_)(.+)$/)
  if (!match) return []
  const [, prefix = '', unit, separator, code] = match
  if (!SUM_INDICATORS.has(code)) return []
  let refs: string[] = []
  if (unit === 'GSSX_MGS') refs = MOTHER_COMPONENTS
  else if (context.extended && BUDGET_SOURCE_INDICATORS.has(code)) refs = ['GSSX_MGS', 'GSSX_ZGS']
  else refs = [...MOTHER_COMPONENTS, 'GSSX_ZGS']
  return refs.map((ref) => `${prefix}${ref}${separator}${code}`)
}
