import { RouteRecordRaw } from 'vue-router'

export const whiteList: Array<RouteRecordRaw> = [
  {
    path: '/budget-process/process-26-1',
    component: () => import('@/views/budget-process/process-26-1.vue'),
    meta: { title: '招投标及时性异常', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-27-1',
    component: () => import('@/views/budget-process/process-27-1.vue'),
    meta: { title: '合同签订异常', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-28-1',
    component: () => import('@/views/budget-process/process-28-1.vue'),
    meta: { title: '开工、竣工及时性', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-28-2',
    component: () => import('@/views/budget-process/process-28-2.vue'),
    meta: { title: '物资整领整退、物资退库率高', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-28-3',
    component: () => import('@/views/budget-process/process-28-3.vue'),
    meta: { title: '物资超欠供情况', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-28-4',
    component: () => import('@/views/budget-process/process-28-4.vue'),
    meta: { title: '预算调整差异大、频次高', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-29-1',
    component: () => import('@/views/budget-process/process-29-1.vue'),
    meta: { title: '项目决算与增资信息', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-30-1',
    component: () => import('@/views/budget-process/process-30-1.vue'),
    meta: { title: '资金支付及时性', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-30-2',
    component: () => import('@/views/budget-process/process-30-2.vue'),
    meta: { title: '服务入账规范性', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-30-3',
    component: () => import('@/views/budget-process/process-30-3.vue'),
    meta: { title: '超合同支付、收款方不一致', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-31-1',
    component: () => import('@/views/budget-process/process-31-1.vue'),
    meta: { title: '决算及时性', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-31-2',
    component: () => import('@/views/budget-process/process-31-2.vue'),
    meta: { title: '暂估转资及时性', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-31-3',
    component: () => import('@/views/budget-process/process-31-3.vue'),
    meta: { title: '正式转资及时性', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/process-31-4',
    component: () => import('@/views/budget-process/process-31-4.vue'),
    meta: { title: '暂估增资合理性', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/monitorDetails',
    name: '/budget-process/monitorDetails',
    component: () => import('@/views/budget-process/components/monitorDetails.vue'),
    meta: { title: '事项预算执行项目明细(穿透)', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/ExecutionMonitorProcess',
    name: '/budget-process/ExecutionMonitorProcess',
    component: () => import('@/views/budget-process/components/ExecutionMonitorProcess.vue'),
    meta: { title: '事项预算执行项目明细(穿透)', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/budget-process/monitorProcess',
    name: '/budget-process/monitorProcess',
    component: () => import('@/views/budget-process/components/monitorProcess.vue'),
    meta: { title: '事项预算执行监控表(穿透)', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/goalValue/versionDetail',
    name: '/goalValue/versionDetail',
    component: () => import('@/views/goalValue/versionDetail.vue'),
    meta: { title: '目标总控值版本明细', icon: 'icon-home', isNavigationMenu: false }
  },
  {
    path: '/progressQuery/:code',
    component: () => import('@/views/service/xq/progressQuery.vue'),
    meta: { title: '进度查询', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/lkyptzl/drillDown',
    name: '/service/lkyptzl/drillDown',
    component: () => import('@/views/service/lkyptzl/drillDown.vue'),
    meta: { title: '两库一平台总览（穿透页面）', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/goalValue/versionCompare',
    name: '/goalValue/versionCompare',
    component: () => import('@/views/goalValue/versionCompare.vue'),
    meta: { title: '版本比对', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/ywpt/reportReview',
    name: '/service/ywpt/reportReview',
    component: () => import('@/views/service/ywpt/reportReview.vue'),
    meta: { title: '联合会审评审报告项目明细', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/ywpt/projectManifest',
    name: '/service/ywpt/projectManifest',
    component: () => import('@/views/service/ywpt/projectManifest.vue'),
    meta: { title: '联合会审专家评审项目明细', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/ywpt/projectManifestLeader',
    name: '/service/ywpt/projectManifestLeader',
    component: () => import('@/views/service/ywpt/projectManifestLeader.vue'),
    meta: { title: '联合会审组长终审项目明细', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/metrics/Configuration',
    name: '/metrics/Configuration',
    component: () => import('@/views/metrics/Configuration.vue'),
    meta: { title: '按单位配置', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/metrics/configData/budgetStatisticsConfig',
    name: '/metrics/configData/budgetStatisticsConfig',
    component: () => import('@/views/metrics/configData/budgetStatisticsConfig.vue'),
    meta: { title: '按类型配置', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/jointReview/expertReview/projectManifest',
    name: '/service/jointReview/expertReview/projectManifest',
    component: () => import('@/views/service/jointReview/expertReview/projectManifest.vue'),
    meta: { title: '线上预审', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/jointReview/offlineReview/projectManifest',
    name: '/service/jointReview/offlineReview/projectManifest',
    component: () => import('@/views/service/jointReview/offlineReview/projectManifest.vue'),
    meta: { title: '线下会审', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/jointReview/offlineReviewReturn/projectManifest',
    name: '/service/jointReview/offlineReviewReturn/projectManifest',
    component: () => import('@/views/service/jointReview/offlineReviewReturn/projectManifest.vue'),
    meta: { title: '线上会审退回', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/xscs',
    name: '/service/xmcs/xscs',
    component: () => import('@/views/service/xmcs/xscs.vue'),
    meta: { title: '406号文测算', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decs',
    name: '/service/xmcs/decs',
    component: () => import('@/views/service/xmcs/decs.vue'),
    meta: { title: '基本-定额测算', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsDl',
    name: '/service/xmcs/decsDl',
    component: () => import('@/views/service/xmcs/decsDl.vue'),
    meta: { title: '电缆-定额测算', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsJk',
    name: '/service/xmcs/decsJk',
    component: () => import('@/views/service/xmcs/decsJk.vue'),
    meta: { title: '架空-定额测算', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsYx',
    name: '/service/xmcs/decsYx',
    component: () => import('@/views/service/xmcs/decsYx.vue'),
    meta: { title: '营销-定额测算', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsPwCc',
    name: '/service/xmcs/decsPwCc',
    component: () => import('@/views/service/xmcs/decsPwCc.vue'),
    meta: { title: '配网-安装拆除', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsPwDPdgc',
    name: '/service/xmcs/decsPwDPdgc',
    component: () => import('@/views/service/xmcs/decsPwDPdgc.vue'),
    meta: { title: '配网-设备检修', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsPwGc',
    name: '/service/xmcs/decsPwGc',
    component: () => import('@/views/service/xmcs/decsPwGc.vue'),
    meta: { title: '配网-工程', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsPwJzxsJcl',
    name: '/service/xmcs/decsPwJzxsJcl',
    component: () => import('@/views/service/xmcs/decsPwJzxsJcl.vue'),
    meta: { title: '配网-建筑修缮【价差0】', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsPwJzxsJcas',
    name: '/service/xmcs/decsPwJzxsJcas',
    component: () => import('@/views/service/xmcs/decsPwJzxsJcas.vue'),
    meta: { title: '配网-建筑修缮【价差按时】', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsPwDl',
    name: '/service/xmcs/decsPwDl',
    component: () => import('@/views/service/xmcs/decsPwDl.vue'),
    meta: { title: '配网-电缆', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/decsPwJk',
    name: '/service/xmcs/decsPwJk',
    component: () => import('@/views/service/xmcs/decsPwJk.vue'),
    meta: { title: '配网-架空', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/finance/dashboard',
    name: '/finance/dashboard',
    component: () => import('@/views/finance/dashboard/index.vue'),
    meta: { title: '财务看板', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/finance/reserveApproval',
    name: '/finance/reserveApproval',
    component: () => import('@/views/finance/reserveApproval/index.vue'),
    meta: { title: '储备审批', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/finance/reserveApprovalDetail',
    name: '/finance/reserveApprovalDetail',
    component: () => import('@/views/finance/reserveApprovalDetail/index.vue'),
    meta: { title: '储备审批详情', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/service/xmcs/csqrReview',
    name: '/service/xmcs/csqrReview',
    component: () => import('@/views/service/xmcs/csqrReview.vue'),
    meta: { title: '测算审核详情', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/reviewDeatil/index',
    name: '/reviewDeatil/index',
    component: () => import('@/views/ai/reviewWorkBench/reviewDeatil/index.vue'),
    meta: { title: '评审详情', icon: 'icon-search', isNavigationMenu: false }
  },
  {
    path: '/ai/workbenchView/documentPreview',
    name: '/ai/workbenchView/documentPreview',
    component: () => import('@/views/ai/workbenchView/DocumentPreviewView.vue'),
    meta: { title: '文档预览', icon: 'icon-search', isNavigationMenu: false }
  }
]
