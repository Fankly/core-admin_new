import { RowVO } from '@/views/service/approval/batch/types'

export interface Params {
  opType: 'ADD' | 'EDIT'
  title: string
  selectedData?: RowVO
}
