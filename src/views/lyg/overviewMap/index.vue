<template>
  <div class="dashboard-app-root" v-show="isShowPage">
    <Header ref="headerRef" @filter-change="handleFilterChange" />

    <main class="dashboard-main">
      <div class="hero-visual-stage">
        <!-- 3D Map Stage -->
        <div class="map-wrapper" v-loading="mapLoading">
          <LianyungangMap
            :districts="LIANYUNGANG_DISTRICTS"
            :label-formatter="districtLabelFormatter"
            @select-district="handleChangeMap"
            @select-all="handleSelectAll"
          />
        </div>

        <div class="floating-panel left-panel" v-loading="budgetLoading">
          <BudgetOverview :metrics="INITIAL_METRICS" />
        </div>

        <!-- Right Floating Panel: 地市前三名 & 市归口部门 -->
        <div class="floating-panel right-panel">
          <div class="right-top-chart" v-loading="topCitiesLoading">
            <TopCitiesChart :TOP_CITIES_COMPLETION="TOP_CITIES_COMPLETION" :title="topCitiesTitle" />
          </div>
          <div class="right-bottom-chart" v-loading="deptLoading">
            <DeptCompletionChart :MUNICIPAL_DEPTS_COMPLETION="MUNICIPAL_DEPTS_COMPLETION" />
          </div>
        </div>
      </div>

      <!-- Bottom Pipeline: 项目执行进度 -->
      <section class="bottom-progress-section" v-loading="progressLoading">
        <ProjectProgressFlow
          ref="progressFlowRef"
          :STAGES_DATA="STAGES_DATA"
          :active-stage-key="selectedStageKey"
          @select-card="selectCard"
          @select-stage="handleSelectStage"
          @filter-change="handleProgressFilterChange"
          :IMPLEMENTATION_DEPTS="IMPLEMENTATION_DEPTS"
          :PROJECT_TYPES="PROJECT_TYPES"
        />
      </section>
    </main>
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts" name="/lyg/overviewMap/index">
import { ref, computed, onMounted, nextTick } from 'vue'
import userDialog from '@/components/select/userDialog.vue'
import Header from '@/views/lyg/overviewMap/components/Header.vue'
import LianyungangMap from '@/views/lyg/components/LianyungangMap.vue'
import BudgetOverview from '@/views/lyg/overviewMap/components/BudgetOverview.vue'
import TopCitiesChart from '@/views/lyg/overviewMap/components/TopCitiesChart.vue'
import DeptCompletionChart from '@/views/lyg/overviewMap/components/DeptCompletionChart.vue'
import ProjectProgressFlow from '@/views/lyg/overviewMap/components/ProjectProgressFlow.vue'
import { StageKey } from '@/views/lyg/overviewMap/data/types'
import {
  INITIAL_METRICS,
  TOP_CITIES_COMPLETION,
  MUNICIPAL_DEPTS_COMPLETION,
  LIANYUNGANG_DISTRICTS,
  STAGES_DATA,
  IMPLEMENTATION_DEPTS,
  PROJECT_TYPES
} from '@/views/lyg/overviewMap/data/overviewData'

import { getSubProtypeTreeByXmlx, getMbzWczData, getRegionYszxgk, getDwYszxgkTop3, getDeptYszxgk, getCkjdXms } from '@/api/lyg/index'
import { ElMessage } from 'element-plus'
import { formatNumValue } from '@/utils/utils'
import { useRouter } from 'vue-router'
import { getDeptData } from '@/api/common'
import { getYjdwList } from '@/api/ai/smartTaskAudit'

// Global filter state
const filters = ref<any>({ xmlx: 'CB', nd: new Date().getFullYear().toString() })
const prevXmlx = ref<string>(filters.value.xmlx)
const progressFilters = ref<{ projectTypeList: string[]; ssbmList: string[] }>({ projectTypeList: [], ssbmList: [] })
const userDialogRef = ref()
const userInfo = ref<any>()
const isShowPage = ref(false)
const selectedStageKey = ref<StageKey | null>(null)
const dwId = ref<string>('')
const cxjb = ref<string>('1')
const dwIds = ref<string[]>([])
const yjdw = ref<string>('')
const isCityLevel = ref<boolean>(true)
const topCitiesTitle = computed(() => (isCityLevel.value ? '地市前三预算执行排行榜' : '区县预算执行排行榜'))

const headerRef = ref()
const progressFlowRef = ref()
const mapLevel = ref<string>('CITY')
const router = useRouter()

const mapLoading = ref(false)
const budgetLoading = ref(false)
const topCitiesLoading = ref(false)
const deptLoading = ref(false)
const progressLoading = ref(false)

const handleFilterChange = async (value: any) => {
  const xmlxChanged = value.xmlx !== prevXmlx.value
  filters.value = value
  if (xmlxChanged) {
    progressFilters.value.projectTypeList = []
    progressFlowRef.value?.resetProjectType()
  }
  prevXmlx.value = value.xmlx
  await getMapData()
  await getMbzData()
}

const handleChangeMap = async (value: any) => {
  dwId.value = value
  isCityLevel.value = false
  cxjb.value = '2'
  await getMbzData()
  await getSsbmList([dwId.value])
}

const handleSelectAll = async () => {
  dwId.value = userInfo.value.org_id
  isCityLevel.value = true
  cxjb.value = '1'
  await getMbzData()
  await getSsbmList(dwIds.value)
}

const districtLabelFormatter = (district: any) => {
  const mbz = district?.mbz ?? '--'
  const wcl = district?.wcl ?? '--'
  return `${district.name}\n目标值: ${mbz}万\n完成率: ${wcl}%`
}

const handleSelectStage = (stageKey: StageKey) => {
  selectedStageKey.value = selectedStageKey.value === stageKey ? null : stageKey
}

const handleProgressFilterChange = async (filterVal: { projectTypeList: string[]; ssbmList: string[] }) => {
  progressFilters.value = filterVal
  await refreshProgressData()
}

const refreshProgressData = async () => {
  progressLoading.value = true
  try {
    const params = {
      dwId: dwId.value,
      cxjb: cxjb.value,
      mapLevel: mapLevel.value,
      ...filters.value,
      projectTypeList: progressFilters.value.projectTypeList,
      ssbmList: progressFilters.value.ssbmList
    }
    const process = await getCkjdXms({ ...params })
    if (!process.success && process.data.length == 0) return ElMessage.error(process.msg)
    STAGES_DATA.value.forEach((item: any) => {
      const processData = process.data.find((d: any) => d.projectProgressName == item.title)
      if (processData) {
        item.currentCount = processData.xms
        item.cumulativeCount = processData.ljxms
      }
    })
  } finally {
    progressLoading.value = false
  }
}

const selectCard = (status: any) => {
  router.push({
    name: '/lyg/project/proInfo/index',
    params: {
      status: status,
      roleId: userInfo.value.role_id,
      roleCode: userInfo.value.code,
      dwId: userInfo.value.org_id,
      specialorgid: userInfo.value.specialorgid,
      spRoleId: userInfo.value.id,
      userInfo: JSON.stringify({ ...userInfo.value }),
      xmlx: filters.value.xmlx,
      zyear: filters.value.nd,
      qkjgkbmList: JSON.stringify(filters.value.qkjgkbmList ?? []),
      qkjxmlxbmList: JSON.stringify(progressFilters.value.projectTypeList ?? []),
      applyCenter: JSON.stringify(progressFilters.value.ssbmList ?? []),
      qkjyjdw: yjdw.value,
      qkjejdwList: JSON.stringify(dwIds.value ?? [])
    }
  })
}

const intParams = async (params: any) => {
  await nextTick()
  headerRef.value.getDataList({ ...params })
  await getMapData()
  await getMbzData()
}

onMounted(async () => {
  isShowPage.value = false
  await userDialogRef.value?.getUser()
})

const handlePorType = async () => {
  const res: any = await getSubProtypeTreeByXmlx({ xmlx: filters.value.xmlx })
  if (!res.success) return ElMessage.error(res.msg)
  PROJECT_TYPES.value = res.data
}

const getMapData = async () => {
  mapLoading.value = true
  try {
    const params = {
      dwId: dwId.value,
      cxjb: cxjb.value,
      mapLevel: mapLevel.value,
      ...filters.value
    }
    // 地图
    const mapData = await getRegionYszxgk({ ...params })
    if (!mapData.success && mapData.data.length == 0) return ElMessage.error(mapData.msg)
    LIANYUNGANG_DISTRICTS.value.forEach((item: any) => {
      const cityData = mapData.data.find((d: any) => d.regionName == item.name)
      item.code = cityData.regionCode
      item.mbz = formatNumValue(cityData.mbz.toString(), 2)
      item.wcl = formatNumValue(cityData.wcl.toString(), 2)
    })
    dwIds.value = LIANYUNGANG_DISTRICTS.value.map(({ code }: any) => code)
    await getSsbmList(dwIds.value)
  } finally {
    mapLoading.value = false
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

const getMbzData = async () => {
  const params = {
    dwId: dwId.value,
    cxjb: cxjb.value,
    mapLevel: mapLevel.value,
    ...filters.value
  }
  // 单位预算执行概览
  budgetLoading.value = true
  try {
    const res: any = await getMbzWczData({ ...params })
    if (!res.success) return ElMessage.error(res.msg)
    for (const key in INITIAL_METRICS) {
      if (['mbz', 'wcz', 'gsjlcmbz'].includes(key)) {
        INITIAL_METRICS[key] = formatNumValue(res.data[key].toString(), 2)
      } else if (['wcl', 'sgspjwcl', 'sndtqsgspjwcl', 'sndtqwcl'].includes(key)) {
        INITIAL_METRICS[key] = formatNumValue(res.data[key].toString(), 2)
      } else {
        INITIAL_METRICS[key] = res.data[key] || 0
      }
    }
  } finally {
    budgetLoading.value = false
  }

  // 地市前三预算执行排行榜
  topCitiesLoading.value = true
  try {
    const top3 = await getDwYszxgkTop3({ ...params })
    if (!top3.success) return ElMessage.error(top3.msg)
    TOP_CITIES_COMPLETION.value = top3.data
  } finally {
    topCitiesLoading.value = false
  }

  // 本市各专业排行榜
  deptLoading.value = true
  try {
    const dept = await getDeptYszxgk({ ...params })
    if (!dept.success) return ElMessage.error(dept.msg)
    MUNICIPAL_DEPTS_COMPLETION.value = dept.data
  } finally {
    deptLoading.value = false
  }

  // 项目执行进度
  await refreshProgressData()
  await handlePorType()
}

const getYjdw = async () => {
  let res: any = await getYjdwList({ bmId: userInfo.value.specialorgid, dwId: userInfo.value.org_id })
  if (res.success && res.data.length !== 0) {
    yjdw.value = res.data[0].code
  }
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true
      dwId.value = userInfo.value.org_id
      await getYjdw()
      await intParams({ bmId: userInfo.value.specialorgid, dwId: dwId.value })
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.dashboard-app-root {
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
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.district-focus-bar {
  background: rgba(240, 253, 250, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(153, 246, 228, 0.9);
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #00706b;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.focus-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.focus-title {
  font-weight: 700;
}

.focus-tag {
  background-color: #00706b;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}

.focus-desc {
  color: #334155;
  font-weight: 500;
}

.focus-reset-btn {
  color: #00706b;
  text-decoration: underline;
  font-weight: 700;
  background: transparent;
  border: none;
  cursor: pointer;
}

.focus-reset-btn:hover {
  color: #00524e;
}

.hero-visual-stage {
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  flex: 6 1 0;
  min-height: 0;
  box-sizing: border-box;
}

.map-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-panel {
  position: absolute;
  top: 10px;
  bottom: 16px;
  width: 420px;
  z-index: 20;
}

.left-panel {
  left: 16px;
}

.right-panel {
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.right-top-chart {
  flex: 0.6;
}

.right-bottom-chart {
  flex: 1.4;
  min-height: 210px;
}

@media (max-width: 1200px) {
  .hero-visual-stage {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 0 0 auto;
    min-height: 620px;
  }

  .floating-panel {
    position: static;
    width: 100%;
  }

  .bottom-progress-section {
    flex: 0 0 auto;
    min-height: auto;
  }
}

.bottom-progress-section {
  width: 100%;
  flex: 4 1 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}
</style>
