<template>
  <div class="review-flow-setting">
    <el-drawer
      ref="drawerRef"
      v-model="isShowDrawer"
      :title="prop.title"
      size="450px"
      :show-close="false"
      :close-on-click-modal="true"
      @open="handleOpen"
      @close="handleClose"
    >
      <el-tabs class="review-flow-setting__tabs" v-model="tabMsg" type="border-card">
        <el-tab-pane label="查询条件" name="1">
          <el-table class="review-flow-setting__table" v-loading="loading" ref="tableRef" border :data="pageData" height="100%">
            <el-table-column label="字段名称" prop="name" align="center" />
            <el-table-column label="是否展示" align="center">
              <template #default="{ row }">
                <el-switch :disabled="row.sfmrzs || submitting" v-model="row.link" />
              </template>
            </el-table-column>
            <template #empty>
              <div class="review-flow-setting__empty">暂无可配置条件</div>
            </template>
          </el-table>
        </el-tab-pane>
        <div class="review-flow-setting__footer">
          <el-button plain type="primary" size="mini" :loading="submitting" :disabled="loading || submitting" @click="submitHandle">确 定</el-button>
          <el-button plain type="primary" size="mini" :disabled="loading || submitting" @click="isShowDrawer = false">关 闭</el-button>
        </div>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup lang="ts" name="ReviewFlowQuerySetting">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getSearchColumn, updateSearchColumn } from '@/api/service/requirement'

const prop = defineProps({
  title: {
    type: String,
    default: '高级设置'
  },
  searchCode: {
    type: String,
    default: 'LHHS-LZQK'
  }
})

const emit = defineEmits(['showModal'])

const isShowDrawer = ref(false)
const tabMsg = ref('1')
const pageData = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const drawerRef = ref()
const tableRef = ref()
const savedVisibleIds = ref('')
const cachedPageData = ref<any[]>([])
const hasLoadedConfig = ref(false)

const clonePageData = (data: any[]) => data.map((item) => ({ ...item }))

const getVisibleIds = () =>
  JSON.stringify(
    pageData.value
      .filter((item: any) => item.link)
      .map((item: any) => `${item.id}`)
      .sort()
  )

const handleOpen = () => {
  tabMsg.value = '1'
  if (hasLoadedConfig.value) {
    pageData.value = clonePageData(cachedPageData.value)
    savedVisibleIds.value = getVisibleIds()
    return
  }
  searchConfigHandle()
}

const handleClose = () => {
  pageData.value = clonePageData(cachedPageData.value)
  savedVisibleIds.value = getVisibleIds()
}

const submitHandle = async () => {
  if (loading.value || submitting.value) return
  const dynamciSearchData = pageData.value.filter((item: any) => item.link).map((item: any) => item.id)
  const currentVisibleIds = getVisibleIds()
  if (currentVisibleIds === savedVisibleIds.value) {
    isShowDrawer.value = false
    return
  }

  submitting.value = true
  try {
    const searchDataRes = await updateSearchColumn({
      searchCode: prop.searchCode,
      searchType: '1',
      ids: dynamciSearchData
    })

    if (searchDataRes.success) {
      ElMessage.success('操作成功!')
      cachedPageData.value = clonePageData(pageData.value)
      hasLoadedConfig.value = true
      savedVisibleIds.value = currentVisibleIds
      emit('showModal')
      isShowDrawer.value = false
    } else {
      ElMessage.error(searchDataRes.msg)
    }
  } finally {
    submitting.value = false
  }
}

const searchConfigHandle = async () => {
  loading.value = true
  try {
    const searchResData = await getSearchColumn({
      searchCode: prop.searchCode,
      searchType: '1'
    })
    if (searchResData.success) {
      pageData.value = clonePageData(searchResData.data || [])
      cachedPageData.value = clonePageData(pageData.value)
      hasLoadedConfig.value = true
      savedVisibleIds.value = getVisibleIds()
    } else {
      ElMessage.error(searchResData.msg)
    }
  } finally {
    loading.value = false
  }
}

defineExpose({
  drawerRef,
  tableRef,
  isShowDrawer
})
</script>

<style scoped lang="less">
:deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--el-bg-color-page, #f5f7fa);
}

:deep(.el-tabs) {
  flex: 1;
  min-width: auto;
  min-height: auto;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin: 0;
  background: var(--el-fill-color-lighter, #fafafa);
}

:deep(.el-tab-pane) {
  flex: 1;
  min-width: auto;
  min-height: auto;
}

:deep(.el-tabs__content) {
  flex: 1;
  min-width: auto;
  min-height: auto;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--el-bg-color, #ffffff);
}

:deep(.el-button) {
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}

:deep(.el-table th.el-table__cell) {
  color: var(--el-text-color-primary, #303133);
  font-weight: 600;
  background: var(--el-fill-color-lighter, #fafafa);
}

:deep(.el-table__row) {
  transition: background-color 0.16s ease;
}

:deep(.el-table__row:hover > td.el-table__cell) {
  background: var(--el-fill-color-light, #f5f7fa);
}

.review-flow-setting {
  &__tabs {
    height: 100%;
    border: 1px solid var(--el-border-color-lighter, #ebeef5);
    border-radius: 4px;
    overflow: hidden;
    animation: review-flow-setting-fade-in 0.18s ease;
  }

  &__table {
    flex: 1;
    min-height: 0;
  }

  &__empty {
    display: flex;
    min-height: 120px;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary, #909399);
    font-size: 13px;
  }

  &__footer {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 12px;
    margin-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter, #ebeef5);

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }
}

@keyframes review-flow-setting-fade-in {
  from {
    opacity: 0.72;
  }

  to {
    opacity: 1;
  }
}
</style>
