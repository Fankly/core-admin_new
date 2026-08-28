import { RouteRecordRaw } from 'vue-router'

export const workflow: Array<RouteRecordRaw> = [
  {
    path: '/workflow/todoTasks',
    component: () => import('@/views/workflow/todoTasks.vue'),
    meta: { title: '待办事宜', icon: 'icon-home', isNavigationMenu: true }
  },
  {
    path: '/workflow/workflowDb',
    component: () => import('@/views/workflow/workflowDb.vue'),
    meta: { title: '待办通知', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/targetValue/targetValueDb',
    component: () => import('@/views/workflow/targetValue/targetValueDb.vue'),
    meta: { title: '待办通知', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/deal',
    component: () => import('@/views/workflow/components/workflowDeal.vue'),
    meta: { title: '流程处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/fy/deal',
    component: () => import('@/views/workflow/fy/workflowDeal.vue'),
    meta: { title: '其他运营费用-流程处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/fy/view',
    component: () => import('@/views/workflow/fy/workflowView.vue'),
    meta: { title: '其他运营费用-流程查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xm/deal',
    component: () => import('@/views/workflow/xm/workflowDeal.vue'),
    meta: { title: '项目储备审核流程处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xm/dealNew',
    component: () => import('@/views/workflow/xm/workflowDealNew.vue'),
    meta: { title: '项目储备审核流程处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xm/view',
    component: () => import('@/views/workflow/xm/workflowView.vue'),
    meta: { title: '项目储备审核流程查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/ysbg/deal',
    component: () => import('@/views/workflow/ysbg/workflowDeal.vue'),
    meta: { title: '项目预算变更审核流程处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/ysbg/view',
    component: () => import('@/views/workflow/ysbg/workflowView.vue'),
    meta: { title: '项目预算变更审核流程查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/zl/deal',
    component: () => import('@/views/workflow/zl/workflowDeal.vue'),
    meta: { title: '项目流程处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/zl/view',
    component: () => import('@/views/workflow/zl/workflowView.vue'),
    meta: { title: '项目流程查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/view',
    component: () => import('@/views/workflow/components/workflowView.vue'),
    meta: { title: '流程查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/lslx/dealYs',
    component: () => import('@/views/workflow/lslx/workflowDealYs.vue'),
    meta: { title: '一上上报核定处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/lslx/viewYs',
    component: () => import('@/views/workflow/lslx/workflowViewYs.vue'),
    meta: { title: '一上上报核定查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/lslx/dealEs',
    component: () => import('@/views/workflow/lslx/workflowDealEs.vue'),
    meta: { title: '二上上报核定处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/lslx/viewEs',
    component: () => import('@/views/workflow/lslx/workflowViewEs.vue'),
    meta: { title: '二上上报核定查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/lslx/dealZgkbmYs',
    component: () => import('@/views/workflow/lslx/workflowDealZgkbmYs.vue'),
    meta: { title: '一上省专业部门上报核定处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/lslx/viewZgkbmYs',
    component: () => import('@/views/workflow/lslx/workflowViewZgkbmYs.vue'),
    meta: { title: '一上省专业部门上报核定查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xmgbdk/deal',
    component: () => import('@/views/workflow/xmgbdk/workflowDeal.vue'),
    meta: { title: '项目关闭打开处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xmgbdk/view',
    component: () => import('@/views/workflow/xmgbdk/workflowView.vue'),
    meta: { title: '项目关闭打开查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xjjz/deal',
    component: () => import('@/views/workflow/xjjz/workflowDeal.vue'),
    meta: { title: '项目续建结转处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xjjz/view',
    component: () => import('@/views/workflow/xjjz/workflowView.vue'),
    meta: { title: '项目续建结转查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/syqzcydtx/view',
    component: () => import('@/views/workflow/syqzcydtx/workflowView.vue'),
    meta: { title: '使用权资产异动提醒', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/cityTarget/view',
    component: () => import('@/views/workflow/cityTarget/workflowView.vue'),
    meta: { title: '市级统筹目标值平衡调整查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/cityTarget/deal',
    component: () => import('@/views/workflow/cityTarget/workflowDeal.vue'),
    meta: { title: '市级统筹目标值平衡调整处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/targetBudget/provinceTarget/deal',
    component: () => import('@/views/workflow/targetBudget/provinceTarget/workflowDeal.vue'),
    meta: { title: '省级统筹目标值平衡调整处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/targetBudget/provinceTarget/view',
    component: () => import('@/views/workflow/targetBudget/provinceTarget/workflowView.vue'),
    meta: { title: '市级统筹目标值平衡调整查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xm/newDeal',
    component: () => import('@/views/workflow/xm/workflowNewDeal.vue'),
    meta: { title: '项目储备审核流程处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/xm/newView',
    component: () => import('@/views/workflow/xm/workflowNewView.vue'),
    meta: { title: '项目储备审核流程查看', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/deptData/workflowDeal',
    component: () => import('@/views/workflow/deptData/workflowDeal.vue'),
    meta: { title: '专业归口预算执行查询', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/suzhou/materialTask',
    component: () => import('@/views/toDo/suzhou/materialTask/index.vue'),
    meta: { title: '物料判定任务待办处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/sfhs/workflowDeal',
    name: '/workflow/sfhs/workflowDeal',
    component: () => import('@/views/workflow/sfhs/workflowDeal.vue'),
    meta: { title: '市级联合会审评审报告审核流程', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/workflow/suzhou/taskMaterial',
    component: () => import('@/views/toDo/suzhou/taskMaterial/index.vue'),
    meta: { title: '物料判定任务下发处理', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/workflow/cqyj/workflowDeal',
    name: '/workflow/cqyj/workflowDeal',
    component: () => import('@/views/workflow/cqyj/workflowDeal.vue'),
    meta: { title: '超期预警', icon: 'icon-search', isNavigationMenu: false }
  }
]
