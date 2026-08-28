import type { OptionItem } from './types'

export const DETAIL_PERMISSION = 'DETAIL'
export const EDIT_PERMISSION = 'EDIT'
export const ADD_PERMISSION = 'ADD'

export const priorityOptions: OptionItem[] = [
  { code: '1', name: '高' },
  { code: '2', name: '中' },
  { code: '3', name: '低' }
]

export const statusOptions: OptionItem[] = [
  { code: '1', name: '未开始' },
  { code: '2', name: '处理中' },
  { code: '3', name: '已完成' },
  { code: '4', name: '处理失败' }
]

export const projectTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}
