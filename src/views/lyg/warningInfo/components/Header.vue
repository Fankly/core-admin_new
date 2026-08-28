<template>
  <header class="app-header">
    <div class="header-content">
      <!-- Title Area -->
      <div class="title-area">
        <div class="icon-wrapper">
          <svg
            class="header-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span class="ping-badge">
            <span class="ping-animate"></span>
            <span class="ping-dot"></span>
          </span>
        </div>

        <h1 class="header-title">项目全过程预警中心-连云港</h1>
      </div>

      <!-- Filter Controls -->
      <div class="filter-controls">
        <!-- 项目大类 -->
        <div class="filter-item">
          <span class="filter-label">项目大类:</span>
          <el-select v-model="filters.xmlx" style="width: 80px" @change="handlePorType">
            <el-option v-for="t in XMDL_TYPES" :key="t.code" :label="t.name" :value="t.code" />
          </el-select>
        </div>

        <!-- 项目类型 -->
        <div class="filter-item">
          <span class="filter-label">项目类型:</span>
          <ElTreeSelect
            v-model="filters.projectTypeList"
            clearable
            :data="PROJECT_TYPES"
            :props="projectTypeProps"
            :multiple="true"
            :show-checkbox="true"
            :collapse-tags="true"
            :check-on-click-node="false"
            node-key="middleId"
            placeholder="请选择"
          />
        </div>

        <!-- 市归口部门 -->
        <div class="filter-item">
          <span class="filter-label">市归口部门:</span>
          <el-select v-model="filters.qkjgkbmList" clearable multiple collapseTags style="width: 200px">
            <el-option v-for="t in MUNICIPAL_DEPTS" :key="t.code" :label="t.name" :value="t.code" />
          </el-select>
        </div>

        <!-- 实施部门 -->
        <div class="filter-item">
          <span class="filter-label">实施部门:</span>
          <el-select v-model="filters.ssbmList" clearable multiple collapseTags style="width: 160px">
            <el-option v-for="t in IMPLEMENTATION_DEPTS" :key="t.code" :label="t.name" :value="t.code" />
          </el-select>
        </div>

        <!-- 年月 -->
        <div class="filter-item">
          <span class="filter-label">年度:</span>
          <el-date-picker
            style="width: 120px"
            v-model="filters.nd"
            clearable
            format="YYYY"
            value-format="YYYY"
            type="year"
            placeholder="请输入年份"
          />
        </div>
        <div class="filter-item">
          <el-button @click="handleSearch" size="mini" type="primary">查 询</el-button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { XMDL_TYPES, PROJECT_TYPES, MUNICIPAL_DEPTS } from '@/views/lyg/warningInfo/data/warningData'
import { getSsbmCodesList } from '@/api/common'
import { ElMessage } from 'element-plus'
import { getSgbm } from '@/api/service/requirement'
import { getYjdwList } from '@/api/ai/smartTaskAudit'
import ElTreeSelect from '@/components/ElTreeSelect/index'
import { getSubProtypeTreeByXmlx } from '@/api/lyg/index'

interface FilterState {
  xmlx: string
  nd: string
  qkjgkbmList: string[]
  projectTypeList: any[]
  ssbmList: string[]
}
interface DataVo {
  IMPLEMENTATION_DEPTS: any[]
}
const filters = ref<FilterState>({
  projectTypeList: [],
  qkjgkbmList: [],
  ssbmList: [],
  nd: new Date().getFullYear().toString(),
  xmlx: 'CB'
})

const props = defineProps<DataVo>()

const emit = defineEmits(['filterChange'])

const projectTypeProps = {
  label: 'name',
  children: 'children',
  value: 'middleId'
}

const handleSearch = () => {
  emit('filterChange', filters.value)
}

const getDataList = async (params: any) => {
  const codes: any = await getSsbmCodesList({ ...params, codes: ['LYG_ZBXM_ZCBLX_COM'] })
  if (!codes.success) return ElMessage.error(codes.msg)
  XMDL_TYPES.value = codes.data[0].codes
  await getSgkbmList({ ...params })
  await handlePorType()
}

const getSgkbmList = async (params: any) => {
  const yjdw = await getYjdwList({ ...params })
  const yjdwId = yjdw.data[0].code
  const gkbm: any = await getSgbm({ ...params, YJDW: yjdwId, parentCode: yjdwId })
  if (gkbm.success && gkbm.data.length !== 0) {
    MUNICIPAL_DEPTS.value.push(...gkbm.data)
  }
}

const handlePorType = async () => {
  filters.value.projectTypeList = []
  const res: any = await getSubProtypeTreeByXmlx({ xmlx: filters.value.xmlx })
  if (!res.success) return ElMessage.error(res.msg)
  PROJECT_TYPES.value = res.data
}

defineExpose({
  getDataList
})
</script>

<style scoped>
.app-header {
  /* background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);*/
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 40;
  width: 100%;
}
.header-content {
  width: 100%;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
}

.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: #00706b;
  color: #fff;
  box-shadow: 0 4px 10px rgba(0, 112, 107, 0.25);
}

.header-icon {
  width: 20px;
  height: 20px;
  color: #ccfbf1;
}

.ping-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  width: 10px;
  height: 10px;
}

.ping-animate {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #34d399;
  opacity: 0.75;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.ping-dot {
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #34d399;
}

@keyframes ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0;
}

.filter-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-item:hover {
  border-color: #2dd4bf;
}

.filter-icon {
  width: 14px;
  height: 14px;
  color: #64748b;
}

.filter-label {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  white-space: nowrap;
}

.filter-select {
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  border: none;
  outline: none;
  cursor: pointer;
  padding-right: 4px;
}

.filter-select.highlight {
  color: #00706b;
  font-weight: 700;
}
</style>
