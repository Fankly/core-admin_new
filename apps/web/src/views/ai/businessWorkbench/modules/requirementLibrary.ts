import type { WorkbenchModule } from '../types'
import { allLevelOptions, allStatusOptions } from './filterOptions'

export const requirementLibraryModule: WorkbenchModule = {
  id: 'create',
  cardType: 'requirementLibrary',
  config: {
    id: 'create',
    appNo: 'CITY_XQZYK',
    title: '需求资源库',
    icon: 'clipboard-list',
    color: 'tw-text-sggreen-600',
    bgColor: 'tw-bg-sggreen-50/70 tw-border-sggreen-200/50',
    menus: []
  },
  listConfig: {
    title: '我的项目清单',
    unitLabel: '个项目',
    searchPlaceholder: '搜索项目名称...',
    emptyTitle: '未找到匹配的项目',
    showLevelFilter: true,
    levelOptions: allLevelOptions,
    statusOptions: allStatusOptions
  }
}
