import { RowVo } from '@/views/service/continueCarryOver/interface'

export interface SelectData {
  code: string
  id: null | string
  name: string
  note: null | string
  unicode: null | string
}

export interface Params {
  checkedData: RowVo[]
  searchData: null | (() => void)
  proTypeId: string
}
