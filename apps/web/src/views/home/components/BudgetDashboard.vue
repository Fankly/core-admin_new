<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HeaderSection from './HeaderSection.vue'
import ModuleCard from './ModuleCard.vue'
import MessagePanel from './MessagePanel.vue'
import NoticeModal from './NoticeModal.vue'
import type { ModuleItem, MaintenanceNotice } from '../types'
import { getAppListPageData } from '@/api/sys/appManager' // ← 加这行
import { ElMessage } from 'element-plus'

// Image assets
import cityGridBg from '@/assets/images/home/city_grid_bg_1786505250145.jpg'
import bgTargetValue from '@/assets/images/home/target_bright_1786508116433.jpg'
import bgBudgetPackage from '@/assets/images/home/package_bright_1786508127517.jpg'
import bgDemandPool from '@/assets/images/home/demand_bright_1786508140872.jpg'
import bgJointReview from '@/assets/images/home/review_bright_1786508150639.jpg'
import bgProjectReserve from '@/assets/images/home/reserve_bright_1786508167046.jpg'
import bgBudgetPrep from '@/assets/images/home/prep_bright_1786508183865.jpg'
import bgLifecycleTracking from '@/assets/images/home/tracking_bright_1786508196186.jpg'
import bgExecutionAnalysis from '@/assets/images/home/analysis_bright_1786508207931.jpg'

// Lucide Icons
import { Target, Package, Layers, UserCheck, Archive, FileSpreadsheet, Activity, BarChart3 } from '@lucide/vue'

// Modal State
const isNoticeModalOpen = ref(false)

const openNoticeModal = () => {
  isNoticeModalOpen.value = true
}

const closeNoticeModal = () => {
  isNoticeModalOpen.value = false
}

// System maintenance notices list
const maintenanceNotices = ref<MaintenanceNotice[]>([
  {
    id: 1,
    title: '核心预算数据库架构升级与维护通知',
    time: '2026-08-15 02:00 ~ 06:00（预计 4 小时）',
    date: '08-15 02:00',
    level: '重要检修',
    levelBg: 'bpm-notice-tag-amber',
    scope: '项目预算编制、需求申报提交、预算调整审批',
    content:
      '对核心关系型数据库集群进行节点扩容与只读节点优化，并更新底层的分布式索引结构。检修期间全系统提供只读查询服务，数据新增与变更修改暂停，请各部门提前完成预算申报提交。',
    contact: '运维支持团队 (分机 8088)',
    unread: true
  },
  {
    id: 2,
    title: 'ERP / 财务主数据同步接口例行维护公示',
    time: '2026-08-18 01:00 ~ 03:00（预计 2 小时）',
    date: '08-18 01:00',
    level: '例行检修',
    levelBg: 'bpm-notice-tag-blue',
    scope: '基础数据同步、跨系统凭证穿透与成本中心更新',
    content:
      '对 ERP 财务中间件及跨系统 API 接口升级安全补丁并优化传输链路。维护期间系统主体功能不受影响，跨系统主数据同步可能会产生 15~30 分钟的短暂延迟。',
    contact: '数据组技术支持 (分机 8092)',
    unread: true
  },
  {
    id: 3,
    title: '业务驾驶舱与多维计算引擎版本更新公告',
    time: '2026-08-22 03:00 ~ 05:00（预计 2 小时）',
    date: '08-22 03:00',
    level: '优化更新',
    levelBg: 'bpm-notice-tag-emerald',
    scope: '执行分析驾驶舱、多维穿透看板、数据导出',
    content: '部署全新一代多维预算计算引擎，全面提升大批量项目执行率穿透分析的渲染速度。检修期间驾驶舱数据可能存在短时间闪烁，核心业务不受影响。',
    contact: 'BI产品研发组 (分机 8105)',
    unread: true
  }
])

// 8 Modules Definition
const topModules = ref<ModuleItem[]>([
  {
    key: 'targetValue',
    name: '目标指标管理',
    centerName: '战略目标中枢',
    dimensionLabel: '预算维度',
    dimensionType: 'budget',
    layer: 'strategic',
    description: '制定年度及季度财务与业务指标分解，全程监控目标偏差与绩效对齐',
    icon: Target,
    count: 12,
    records: [],
    statusText: '12项指标全监控',
    bgImage: bgTargetValue
  },
  {
    key: 'budgetPackage',
    name: '预算包管理',
    centerName: '总包额度中枢',
    dimensionLabel: '预算维度',
    dimensionType: 'budget',
    layer: 'strategic',
    description: '定义 CAPEX/OPEX 及专项包额度分配、调剂权限与归口管控规则',
    icon: Package,
    count: 8,
    records: [],
    statusText: '总包额度 ¥8.56亿',
    bgImage: bgBudgetPackage
  }
])

const bottomModules = ref<ModuleItem[]>([
  {
    key: 'demandPool',
    name: '需求资源库管理',
    centerName: '需求响应中枢',
    dimensionLabel: '项目维度',
    dimensionType: 'project',
    layer: 'pipeline',
    step: '01',
    description: '各业务部门申报需求集中入库、资源初步核算与优先级智能化排队',
    icon: Layers,
    count: 64,
    records: [],
    statusText: '64项申报待筛选',
    bgImage: bgDemandPool
  },
  {
    key: 'jointReview',
    name: '联合会审管理',
    centerName: '联合表决中枢',
    dimensionLabel: '项目维度',
    dimensionType: 'project',
    layer: 'pipeline',
    step: '02',
    description: '跨部门专家会审、可行性打分、合规性审计及在线联合表决',
    icon: UserCheck,
    count: 18,
    records: [],
    statusText: '18项目排期会审中',
    bgImage: bgJointReview
  },
  {
    key: 'projectReserve',
    name: '项目储备库管理',
    centerName: '储备排期中枢',
    dimensionLabel: '项目维度',
    dimensionType: 'project',
    layer: 'pipeline',
    step: '03',
    description: '会审通过项目分级储备 (A/B/C)、准备度评估与成熟度排期出库',
    icon: Archive,
    count: 42,
    records: [],
    statusText: 'A级储备15个',
    bgImage: bgProjectReserve
  },
  {
    key: 'budgetPrep',
    name: '项目预算编制与调整',
    centerName: '编制管控中枢',
    dimensionLabel: '项目维度',
    dimensionType: 'project',
    layer: 'pipeline',
    step: '04',
    description: '细化 WBS 清单预算编制、基线确定与中期预算追加调整审批',
    icon: FileSpreadsheet,
    count: 142,
    records: [],
    statusText: '预算完成率 94%',
    bgImage: bgBudgetPrep
  },
  {
    key: 'lifecycleTracking',
    name: '项目全过程跟踪管控',
    centerName: '过程穿透中枢',
    dimensionLabel: '项目维度',
    dimensionType: 'project',
    layer: 'pipeline',
    step: '05',
    description: '里程碑推进、合同与支付穿透、变更风险预警及实时进度跟踪',
    icon: Activity,
    count: 142,
    records: [],
    statusText: '5项风险高亮预警',
    bgImage: bgLifecycleTracking
  },
  {
    key: 'executionAnalysis',
    name: '预算执行洞察分析',
    centerName: '多维分析中枢',
    dimensionLabel: '项目维度',
    dimensionType: 'project',
    layer: 'pipeline',
    step: '06',
    description: '执行率多维穿透分析、偏差因果诊断与支出趋势智能预测',
    icon: BarChart3,
    count: 12,
    records: [],
    statusText: '执行偏差率 -2.3%',
    bgImage: bgExecutionAnalysis
  }
])

const emit = defineEmits<{
  (e: 'click-cockpit'): void
  (e: 'click-module', module: ModuleItem): void
}>()

// 应用列表数据
const getAppList = async () => {
  const res = await getAppListPageData({ page: 1, limit: 100 })
  if (res.success) {
    const homeList = (res.data.records || [])
      .filter((item: any) => item.appNo?.startsWith('HOME_'))
      .sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
    // 前2条匹配到 topModules
    homeList.slice(0, 2).forEach((item: any, index: number) => {
      if (topModules.value[index]) {
        topModules.value[index].name = item.appName
        topModules.value[index].records = item
      }
    })
    // 第3条到最后匹配到 bottomModules
    homeList.slice(2).forEach((item: any, index: number) => {
      if (bottomModules.value[index]) {
        bottomModules.value[index].name = item.appName
        bottomModules.value[index].records = item
      }
    })
    console.log('topModules', topModules.value)
    console.log('bottomModules', bottomModules.value)
  } else {
    ElMessage.error(res.msg)
  }
}

onMounted(() => {
  getAppList()
})
</script>

<template>
  <div class="bpm-app-container">
    <!-- Background Bright City Grid Image Layer -->
    <div class="bpm-bg-city-grid" :style="{ backgroundImage: `url(${cityGridBg})` }"></div>
    <!-- Soft Light Gradient & Grid Overlay -->
    <div class="bpm-bg-gradient-overlay"></div>
    <div class="bpm-bg-grid-lines"></div>

    <!-- Main Container -->
    <main class="bpm-main-content">
      <!-- Header Section -->
      <HeaderSection
        title="项目过程管控平台"
        :notice-count="maintenanceNotices.length"
        @click-cockpit="emit('click-cockpit')"
        @click-notice="openNoticeModal"
      />

      <!-- Content Layout: 8 Modules Split into Top 2 & Bottom 6 -->
      <div class="bpm-modules-wrapper">
        <!-- Top Section: First 2 Modules + Right Message Panel -->
        <div class="bpm-top-grid">
          <div class="bpm-top-spacer"></div>

          <!-- Center 2 Modules -->
          <div class="bpm-top-center-modules">
            <ModuleCard v-for="mod in topModules" :key="mod.key" :module="mod" @click-card="(m: any) => emit('click-module', m)" />
          </div>

          <!-- Right Side: Message Panel -->
          <div class="bpm-right-message-wrapper">
            <MessagePanel :total-notice-count="maintenanceNotices.length" @open-notice="openNoticeModal" />
          </div>
        </div>

        <!-- Bottom Section: Remaining 6 Modules -->
        <div class="bpm-bottom-grid">
          <ModuleCard v-for="mod in bottomModules" :key="mod.key" :module="mod" @click-card="(m: any) => emit('click-module', m)" />
        </div>
      </div>
    </main>

    <!-- Notice Modal -->
    <NoticeModal :is-open="isNoticeModalOpen" :notices="maintenanceNotices" @close="closeNoticeModal" />
  </div>
</template>
