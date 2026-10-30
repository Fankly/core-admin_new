import type { WorkbenchModule } from '../types'
import { allLevelOptions, allStatusOptions } from './filterOptions'

export const projectReserveModule: WorkbenchModule = {
  id: 'opinion',
  cardType: 'projectReserve',
  config: {
    id: 'opinion',
    appNo: 'CITY_XMCBK',
    title: '项目储备库',
    icon: 'archive',
    color: 'tw-text-amber-600',
    bgColor: 'tw-bg-amber-50/70 tw-border-amber-200/50',
    menus: []
  },
  listConfig: {
    title: '储备库项目',
    unitLabel: '个项目',
    searchPlaceholder: '搜索项目名称...',
    emptyTitle: '未找到匹配的项目',
    showLevelFilter: true,
    levelOptions: allLevelOptions,
    statusOptions: allStatusOptions
  }
}
