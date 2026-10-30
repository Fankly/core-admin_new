import { getParamValueMulti } from '@/api/common'
import { getCropLimitInfo } from '@/api/lkyptzl'
import { BudgetExecutionFormulaContext, resolveBudgetExecutionUnitType } from './indicatorFormula'

export const loadBudgetExecutionFormulaContext = async (
  reportType: BudgetExecutionFormulaContext['reportType'],
  dwId: string,
  dwList: Array<{ nodeType: string }>
): Promise<BudgetExecutionFormulaContext> => {
  const paramCode = reportType === 'yap' ? 'YSZXYL_START_YAP_YD' : 'YSZXYL_START_YD'
  const nodeTypes = dwList.map((item) => item.nodeType)
  const [params, permission] = await Promise.all([getParamValueMulti([paramCode]), getCropLimitInfo({ dwId, isUpLimit: true })])
  if (!params.success || !params.data || !Object.prototype.hasOwnProperty.call(params.data, paramCode)) {
    throw new Error('导出计算口径加载失败，请重新查询')
  }
  if (!permission.success || !['PROVINCE', 'CITY', 'COUNTY', 'ZSDW'].includes(permission.data?.cropFlag)) {
    throw new Error('导出单位维度加载失败，请重新查询')
  }
  const unitType = resolveBudgetExecutionUnitType(permission.data.cropFlag, nodeTypes)
  return { reportType, extended: params.data[paramCode] === '2', unitType }
}
