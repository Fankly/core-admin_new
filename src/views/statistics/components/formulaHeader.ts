import { h } from 'vue'
import { ElTooltip } from 'element-plus'
import type { VxeGridPropTypes } from 'vxe-table'
import { createFormulaTitleMap, getFormulaByField } from '../budgetExecutionAnalysis/indicatorFormula'
import type { BudgetExecutionFormulaContext } from '../budgetExecutionAnalysis/indicatorFormula'

// 与专业归口明细的同比/环比表格一致，悬停表头文字展示公式。
export const applyFormulaHeaderTooltips = (columns: VxeGridPropTypes.Columns, context?: BudgetExecutionFormulaContext) => {
  const leafColumns: VxeGridPropTypes.Columns = []
  const columnTitles = createFormulaTitleMap(columns)
  const collectColumns = (list: VxeGridPropTypes.Columns) => {
    list.forEach((column) => {
      if (column.children?.length) {
        collectColumns(column.children)
        return
      }
      leafColumns.push(column)
    })
  }
  collectColumns(columns)

  leafColumns.forEach((column) => {
    const formula = getFormulaByField(column.field, columnTitles, context)
    if (!formula) return

    column.slots = {
      ...column.slots,
      header: () =>
        h(
          ElTooltip,
          { effect: 'dark', placement: 'top', content: formula },
          {
            default: () => h('span', { style: 'display: inline-flex; align-items: center; gap: 2px' }, [column.title])
          }
        )
    }
  })
}
