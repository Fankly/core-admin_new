import { BaseMethod, ServiceKey } from './BaseMethod'

const createServiceApi = (service: ServiceKey) => new BaseMethod(service)

export const budgetApi = createServiceApi('budget')
export const fullProcessApi = createServiceApi('fullProcess')
export const otherOperatingCoseApi = createServiceApi('otherOperatingCose')
export const projectApi = createServiceApi('project')
export const targetBudgetApi = createServiceApi('targetBudget')
export const lygBudgetApi = createServiceApi('targetBudget')
export const zgsExpenseApi = createServiceApi('zgsExpense')

export default {
  budget: budgetApi,
  otherOperatingCose: otherOperatingCoseApi,
  fullProcess: fullProcessApi,
  project: projectApi,
  targetBudget: targetBudgetApi,
  lygBudget: lygBudgetApi,
  zgsExpense: zgsExpenseApi
}
