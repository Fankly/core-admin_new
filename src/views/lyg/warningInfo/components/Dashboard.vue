<template>
  <div class="dashboard-page" v-show="isShowPage">
    <Header ref="headerRef" @filter-change="handleFilterChange" :IMPLEMENTATION_DEPTS="IMPLEMENTATION_DEPTS" />
    <main class="dashboard-main">
      <!-- District Active Filter Tag Bar -->
      <!-- <div class="district-bar">
        <button class="reset-btn" @click="handleFilterChange('district', '全市')"> 返回全市视图 </button>
      </div> -->

      <!-- Top Section Grid: 3 Modules Parallel (StageWarningRuleCard + LianyungangMap + BudgetOverview) -->
      <div class="top-grid">
        <!-- Module 1: 节点预警说明 -->
        <div class="grid-col-4">
          <StageWarningRuleCard :STAGE_RULES="STAGE_RULES" :selectedStage="selectedStage" />
        </div>

        <!-- Module 2: 连云港 3D 地图 -->
        <div class="grid-col-4">
          <LianyungangMap
            :districts="LIANYUNGANG_DISTRICTS"
            :label-formatter="districtLabelFormatter"
            @selectDistrict="handleChangeMap"
            @selectAll="handleSelectAll"
          />
        </div>

        <!-- Module 3: 市归口部门预警统计 - 横向堆积图 -->
        <div class="grid-col-4">
          <BudgetOverview :selectedStage="selectedStage" :deptsData="deptsData" />
        </div>
      </div>

      <!-- Bottom Section Grid: Warning List + Project Flow -->
      <div class="bottom-grid">
        <!-- Module 4: 预警项目明细 -->
        <div class="grid-col-4">
          <WarningProjectList :projectList="projectList" />
        </div>
        <!-- Module 5: 项目执行关键节点预警 -->
        <div class="grid-col-8">
          <ProjectProgressFlow
            :STAGES_DATA="STAGES_DATA"
            :activeStageKey="selectedStage?.yjhj || null"
            @selectStage="handleSelectStage"
            @open-detail="handleOpenDetail"
          />
        </div>
      </div>
    </main>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
  <WarningDetailModal ref="warningDetailModalRef" />
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import StageWarningRuleCard from './StageWarningRuleCard.vue'
import LianyungangMap from '@/views/lyg/components/LianyungangMap.vue'
import BudgetOverview from './BudgetOverview.vue'
import WarningProjectList from './WarningProjectList.vue'
import ProjectProgressFlow from './ProjectProgressFlow.vue'
import WarningDetailModal from './WarningDetailModal.vue'
import {
  IMPLEMENTATION_DEPTS,
  STAGES_DATA,
  LIANYUNGANG_DISTRICTS,
  STAGE_RULES,
  deptsData,
  projectList
} from '@/views/lyg/warningInfo/data/warningData'
import { getYjxmDetail, yjyzPage, getYjhjRegionTj, getYjhjTj, getYjhjSgbmTj } from '@/api/lyg/index'
import Header from '@/views/lyg/warningInfo/components/Header.vue'
import { ElMessage } from 'element-plus'
import { getDeptData } from '@/api/common'

const filters = ref<any>({ xmlx: 'CB', nd: new Date().getFullYear().toString() })
const userDialogRef = ref()
const headerRef = ref()
const userInfo = ref<any>()
const isShowPage = ref(false)
const mapLevel = ref<string>('CITY')
const cxjb = ref<string>('1')
const selectedStage = ref<any>()
const dwId = ref<string>('')
const dwIds = ref<string[]>([])
const deptLoading = ref<boolean>(false)
const warningDetailModalRef = ref()

// const handleFilterChange = (key: keyof FilterState, value: string) => {
//   filters.value[key] = value
//   showToast(`已切换区域筛选: ${value}`)
// }

const handleSelectStage = async (stage: any) => {
  // deptLoading.value = true
  selectedStage.value = stage
  const params = {
    dwId: dwId.value,
    cxjb: cxjb.value,
    mapLevel: mapLevel.value,
    yjhj: stage?.yjhj || '1',
    ...filters.value
  }
  // 各专业预警统计
  const yjTj = await getYjhjSgbmTj({ ...params })
  if (!yjTj.success) return ElMessage.error(yjTj.msg)
  deptsData.value = yjTj.data
  // deptLoading.value = false
}

const districtLabelFormatter = (district: any) => {
  const txCount = district?.txCount ?? '--'
  const yjCount = district?.yjCount ?? '--'
  const jgCount = district?.jgCount ?? '--'
  return `${district.name}\n提醒: ${txCount}\n预警: ${yjCount}\n警告: ${jgCount}`
}

const handleOpenDetail = (payload: { stage: any; yjlx: string }) => {
  warningDetailModalRef.value?.acceptParams({
    yjhj: payload.stage?.yjhj == '4' ? ['10', '11', '12'] : [payload.stage?.yjhj],
    yjhjReal: payload.stage?.yjhj,
    yjlx: payload.yjlx,
    dwId: dwId.value,
    cxjb: cxjb.value,
    mapLevel: mapLevel.value,
    ...filters.value
  })
}
const intParams = async (params: any) => {
  await nextTick()
  headerRef.value.getDataList({ ...params })
  await getMapData()
  await getXmCountData()
}

const handleFilterChange = async (value: any) => {
  filters.value = value
  await getMapData()
  await getXmCountData()
}

const handleChangeMap = async (value: any) => {
  dwId.value = value
  cxjb.value = '2'
  await getXmCountData()
  await getSsbmList([dwId.value])
}

const handleSelectAll = async () => {
  dwId.value = userInfo.value.org_id
  cxjb.value = '1'
  await getXmCountData()
  await getSsbmList(dwIds.value)
}

const getMapData = async () => {
  const params = {
    dwId: dwId.value,
    cxjb: cxjb.value,
    mapLevel: mapLevel.value,
    ...filters.value
  }

  // 地图
  const mapData = await getYjhjRegionTj({ ...params })
  if (mapData.success) {
    LIANYUNGANG_DISTRICTS.value.forEach((item: any) => {
      const cityData = mapData.data.find((d: any) => d.qkjejdwName == item.name)
      item.code = cityData.qkjejdw || ''
      item.txCount = cityData.txCount || 0
      item.yjCount = cityData.yjCount || 0
      item.jgCount = cityData.jgCount || 0
    })
    dwIds.value = LIANYUNGANG_DISTRICTS.value.map(({ code }: any) => code)
    await getSsbmList(dwIds.value)
  }
}

const getSsbmList = async (dwIds: any) => {
  const codes: any = await getDeptData({
    parentCode: 'CBZX',
    rootCode: dwIds.join(',') || '',
    objId: -1,
    level: 0
  })
  if (!codes.success) return ElMessage.error(codes.msg)
  IMPLEMENTATION_DEPTS.value = codes.data
}

const getXmCountData = async () => {
  try {
    const params = {
      dwId: dwId.value,
      cxjb: cxjb.value,
      mapLevel: mapLevel.value,
      ...filters.value
    }
    // 项目执行进度
    const process = await getYjhjTj({ ...params, mapLevel: mapLevel.value })
    if (process.success) {
      STAGES_DATA.value = process.data
      selectedStage.value = STAGES_DATA.value[0]
      // 初始化默认阶段的各专业预警统计
      await handleSelectStage(selectedStage.value)
    }
    // 项目立项预警说明
    const yzPage = await yjyzPage({})
    if (yzPage.success) {
      STAGE_RULES.value.forEach((item: any) => {
        if (item.type == 1) {
          const rulesData = yzPage.data.records.find((d: any) => d.yjhjName == item.title)
          item.yjsjzqTx = rulesData?.yjsjzqTx || 0
          item.yjsjzqYj = rulesData?.yjsjzqYj || 0
          item.yjsjzq = rulesData?.yjsjzq || 0
        }
        if (item.type == 3) {
          const rulesData = yzPage.data.records.filter((d: any) => d.yjhjName.includes('项目关闭'))
          item.tx = rulesData.map((d: any) => d.yjsjzqTx)
          item.yj = rulesData.map((d: any) => d.yjsjzqYj)
          item.jg = rulesData.map((d: any) => d.yjsjzq)
        }
      })
    }

    // 预警项目明细
    const project = await getYjxmDetail({ ...params })
    if (project.success) {
      projectList.value = project.data
    }
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

onMounted(async () => {
  isShowPage.value = false
  await userDialogRef.value?.getUser()
})

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      dwId.value = userInfo.value.org_id
      await intParams({ bmId: userInfo.value.specialorgid, dwId: dwId.value })
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.dashboard-page {
  width: 100%;
  height: 100%;
  color: #0f172a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: flex;
  flex-direction: column;
  background-image: url('@/views/lyg/overviewMap/images/page_background_1786606232173.png');
  background-size: 100% 100%;
}

.dashboard-main {
  flex: 1;
  width: 100%;
  margin: 0 auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* District Bar */
.district-bar {
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #00706b;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.district-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-bold {
  font-weight: 700;
}

.district-badge {
  background-color: #00706b;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}

.district-desc {
  color: #475569;
}

.reset-btn {
  background: none;
  border: none;
  color: #00706b;
  text-decoration: underline;
  font-weight: 600;
  cursor: pointer;
}

.reset-btn:hover {
  color: #00524e;
}

/* Grids */
.top-grid {
  height: 400px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 10px;
  align-items: stretch;
}

.bottom-grid {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 10px;
  align-items: stretch;
  overflow: hidden;
}

.grid-col-4 {
  width: 100%;
  height: 100%;
  overflow: hidden;
  grid-column: span 4 / span 4;
}

.grid-col-8 {
  width: 100%;
  height: 100%;
  overflow: hidden;
  grid-column: span 8 / span 8;
}

@media (max-width: 1024px) {
  .top-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
    flex: none;
    min-height: auto;
  }
  .grid-col-4,
  .grid-col-8 {
    grid-column: span 12 / span 12;
  }
}

/* Toast */
.toast-box {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  background-color: #0f172a;
  color: #ffffff;
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-check-icon {
  width: 16px;
  height: 16px;
  color: #34d399;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
