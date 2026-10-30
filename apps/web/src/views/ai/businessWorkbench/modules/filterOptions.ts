import type { FilterOption, LevelFilter, StatusFilter } from '../types'

const withAllOption = <T extends string>(options: FilterOption<T>[]): FilterOption<T>[] => {
  return [{ value: 'all' as T, label: '全部' }, ...options]
}

export const allLevelOptions: FilterOption<LevelFilter>[] = [{ value: 'all', label: '全部' }]

export const allStatusOptions = withAllOption<StatusFilter>([])

export const jointReviewStatusOptions = withAllOption<StatusFilter>([
  { value: 'pending', label: '待开始' },
  { value: 'reviewing', label: '评审中' },
  { value: 'completed', label: '已结束' }
])
