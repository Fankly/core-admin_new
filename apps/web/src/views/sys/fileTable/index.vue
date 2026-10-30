<!--发文文件查看-->
<template>
  <div class="container" v-if="isShowPage">
    <ProTable
      @search="resetTable"
      @reset="resetTable"
      @row-click="handleClickRow"
      :pagination="true"
      :data-callback="callBackHandle"
      :request-api="getPageList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      guide-module-key="id"
      ref="proTableRef"
      stripe
      :loading="loading"
      :tool-button="['setting']"
      height="100%"
    />
  </div>
  <userDialog ref="userDialogRef" @loadCompany="getRoleHandle" />
</template>

<script setup lang="ts">
defineOptions({ name: "/sys/fileTable/index" })
import userDialog from '@/components/select/userDialog.vue'
import { onMounted, ref, nextTick, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import ProTable from '@/components/ProTablePage/index.vue'
import { getAttachByDirectory } from '@/api/sys/fileShare'

// ========== 响应式状态 ==========
const userDialogRef = ref()
const isShowPage = ref(false)
const proTableRef = ref<any>(null)
const loading = ref(false)

// ========== 表格列配置 ==========
const tableColumns = reactive<any[]>([
  { type: 'selection', width: 50 },
  { type: 'index', width: 50, label: '序号' },
  { prop: 'attachName', label: '文件标题' },
  { prop: 'majorName', label: '专业', width: 120 },
  { prop: 'wjzh', label: '发文字号', width: 300 },
  { prop: 'fwsj', label: '发文时间', width: 150 }
])

// ========== 表格相关 ==========
const resetTable = () => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

const handleClickRow = (row: any) => {
  nextTick(() => {
    proTableRef.value?.clearSelection()
    proTableRef.value?.element?.toggleRowSelection(row)
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = async (params: any) => {
  loading.value = true
  try {
    return await getAttachByDirectory({ ...params })
  } catch (e) {
    console.error(e)
    return { data: { list: [], total: 0 } }
  } finally {
    loading.value = false
  }
}

// ========== 角色权限 ==========
const getRoleHandle = async () => {
  try {
    const isQuery = userDialogRef.value?.isQuery
    if (isQuery) {
      isShowPage.value = true
    } else {
      ElMessage.warning('无权限访问')
    }
  } catch (e) {
    console.error(e)
  }
}

// ========== 生命周期 ==========
onMounted(async () => {
  await userDialogRef.value?.getUser()
})
</script>
<style scoped lang="less">
.container {
  padding: 10px;
  width: 100%;
  height: 100%;
}
</style>
