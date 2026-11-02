import { RowVo } from '@/views/service/budget/changes/components/budgetChangeHistory/interface'
export interface CheckedData {
  checkedData: RowVo | RowVo[] | null
  isEdit: boolean
}
