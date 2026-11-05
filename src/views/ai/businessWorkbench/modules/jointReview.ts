import type { WorkbenchModule } from '../types'
import { allLevelOptions, jointReviewStatusOptions } from './filterOptions'

export const jointReviewModule: WorkbenchModule = {
  id: 'review',
  cardType: 'jointReview',
  config: {
    id: 'review',
    appNo: 'CITY_LHHS',
    title: '联合会审',
    icon: 'users',
    color: 'tw-text-emerald-600',
    bgColor: 'tw-bg-emerald-50/70 tw-border-emerald-200/50',
    menus: []
  },
  listConfig: {
    title: '我的评审会议',
    unitLabel: '场会议',
    searchPlaceholder: '搜索会议名称...',
    emptyTitle: '未找到匹配的评审会议',
    showLevelFilter: true,
    levelOptions: allLevelOptions,
    statusOptions: jointReviewStatusOptions
  }
}
