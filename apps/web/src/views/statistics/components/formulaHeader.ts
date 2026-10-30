import { h } from 'vue'
import { ElTooltip } from 'element-plus'
import type { VxeGridPropTypes } from 'vxe-table'
import { getFormulaByField } from '../budgetExecutionAnalysis/indicatorFormula'

// 与专业归口明细的同比/环比表格一致，悬停表头文字展示公式。
export const applyFormulaHeaderTooltips = (columns: VxeGridPropTypes.Columns) => {
  columns.forEach((column) => {
    if (column.children?.length) {
      applyFormulaHeaderTooltips(column.children)
      return
    }

    const formula = getFormulaByField(column.field)
    if (!formula) return

    column.slots = {
      ...column.slots,
      header: () =>
        h(
          ElTooltip,
          { effect: 'dark', placement: 'top', content: formula },
          {
            default: () => h('span', { style: 'display: inline-flex; align-items: center; gap: 2px' }, [column.title || column.field])
          }
        )
    }
  })
}
