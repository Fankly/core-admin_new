<template>
  <div v-show="isShowPage" class="rental-requirement-collection" v-loading="loading">
    <!-- Process Flow Section -->
    <div class="process-flow">
      <template v-for="step in processSteps" :key="step.appId">
        <ProcessStep :step="step" />
      </template>
    </div>

    <!-- Search Section -->
    <SearchSection @search="handleSearch" />

    <!-- Data Table Section -->
    <DataTable :columns="tableColumns" :data="tableData" @action-click="handleTableAction" />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle"></userDialog>
</template>

<script lang="ts">
export default {
  name: '/fy/cockpit/index'
}
</script>

<script setup lang="ts">
import { getCurrentInstance, onMounted, ref } from 'vue'
import { getProcessSteps, getTableConfig, getTableData } from '@/views/fy/cockpit/process/api'
import DataTable from '@/views/fy/cockpit/process/components/DataTable.vue'
import ProcessStep from '@/views/fy/cockpit/process/components/ProcessStep.vue'
import SearchSection from '@/views/fy/cockpit/process/components/SearchSection.vue'
import userDialog from '@/components/select/userDialog.vue'
import baseService from '@/service/baseService'
import { useStore } from 'vuex'
import { useUser } from '@/hooks/useUser'
import { useRoute } from 'vue-router'

const userInfo = ref<any>({})
const userDialogRef = ref()
const flag = ref('')
const store = useStore()
const route = useRoute()

// 获取当前实例以访问 $message 和 $router
const instance = getCurrentInstance()
if (!instance) {
  throw new Error('getCurrentInstance() returned null')
}
const proxy = instance.proxy

// 响应式数据
const loading = ref(false)
const isShowPage = ref(false)
interface ProcessStepAction {
  id: string
  name: string
  url: string
  hasPermision: boolean
  outsideMenu: string
}

interface IProcessStep {
  appIcon: string
  icon: string
  appId: string
  appName: string
  menus: ProcessStepAction[]
  userInfo: any
}

const processSteps = ref<IProcessStep[]>([])
interface TableColumn {
  key: string
  label: string
  type?: string
  action?: string
  actionText?: string
}
const tableColumns = ref<TableColumn[]>([])
interface TableDataItem {
  code: string
  name: string
  projectType: string
  primaryUnit: string
  secondaryUnit: string
}
const tableData = ref<TableDataItem[]>([])
const currentSearchTerm = ref('')

const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value.isQuery
    userInfo.value = { ...userDialogRef.value.userMsg }
    if (isQuery) {
      isShowPage.value = true

      const flagData = await baseService.post(
        `/workflow/cbxqsh/getFqzz?spOrgId=${userInfo.value.specialorgid}`
      )
      if (flagData.success && flagData.data) {
        flag.value = flagData.data
        store.commit('setZlGlobalInfo', {
          deptId: userInfo.value.specialorgid,
          deptName: userInfo.value.specialorgname,
          dwId: userInfo.value.org_id,
          dwName: userInfo.value.org_name,
          roleId: userInfo.value.role_id,
          roleCode: userInfo.value.code,
          spRoleId: userInfo.value.id,
          specialorgcode: userInfo.value.specialorgcode,
          fqzzFlag: flag.value
        })
        const xqGlobalInfo = store.getters.getZlGlobalInfo
        userInfo.value = {
          ...(xqGlobalInfo as any)
        }
        userInfo.value.id = userDialogRef.value.userMsg.id
        await initializeData()
      }
    }
  } catch (e) {
    console.error(e)
  }
}

// 初始化数据
const initializeData = async () => {
  loading.value = true
  try {
    // 并行加载所有数据
    const [stepsRes, configRes] = await Promise.all([getProcessSteps(), getTableConfig()])

    if (stepsRes.code) {
      stepsRes.data.forEach((item: any) => {
        item.userInfo = userInfo.value
      })
      processSteps.value = stepsRes.data
    }

    if (configRes.code) {
      tableColumns.value = configRes.data.columns
    }
  } catch (error) {
    console.error('数据加载失败:', error)
    proxy?.$message({
      message: '数据加载失败，请刷新页面重试',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}
// 处理搜索
const handleSearch = async (searchTerm: any) => {
  try {
    loading.value = true
    currentSearchTerm.value = searchTerm

    const result = await getTableData({ search: searchTerm, userInfo: userInfo.value })

    if (result.code) {
      tableData.value = result.data.list

      if (result.data.list.length === 0) {
        proxy?.$message({
          message: '未找到相关项目',
          type: 'info'
        })
      } else {
        proxy?.$message({
          message: `找到 ${result.data.list.length} 条相关项目`,
          type: 'success'
        })
      }
    }
  } catch (error) {
    console.error('搜索失败:', error)
    proxy?.$message({
      message: '搜索失败，请重试',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 处理表格操作
const handleTableAction = (action: any, item: any) => {
  if (action === 'progress_query') {
    handleProgressQuery(item)
  }
}

// 处理进度查询
const handleProgressQuery = (item: any) => {
  proxy?.$router.push({
    path: `/progressQuery/${item.xmbm}`,
    query: {
      name: item.xmmc,
      xmId: item.xmId
    }
  })
}

// 组件挂载时初始化数据
onMounted(async () => {
  const isRoel = await useUser('getZlGlobalInfo')
  if (isRoel && route.params.formJsc) {
    const zlGlobalInfo = store.getters.getZlGlobalInfo
    isShowPage.value = true
    userInfo.value = {
      ...(zlGlobalInfo as any)
    }
    await initializeData()
  } else {
    await userDialogRef.value.getUser()
  }
})
</script>

<style scoped>
.rental-requirement-collection {
  padding: 10px;
  width: 100%;
  height: 100%;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: visible;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6f4ff 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
  gap: 10px;
  box-sizing: border-box;
}

.rental-requirement-collection::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      circle at 20% 20%,
      color-mix(in srgb, var(--color-primary) 5%, transparent) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 80%,
      color-mix(in srgb, var(--color-primary) 3%, transparent) 0%,
      transparent 50%
    );
  pointer-events: none;
  z-index: 1;
}

.process-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  flex-shrink: 0;
  overflow: visible;
  position: relative;
  z-index: 50;
  gap: 10px;
  height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .process-flow {
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 10px;
  }
}
</style>
