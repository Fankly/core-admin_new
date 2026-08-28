<template>
  <MaterialPage :toolbar="MaterialTaskToolbar" :search="MaterialTaskSearch" :config="MATERIAL_TASK_PAGE_CONFIG">
    <template #taskName_default="{ row }">
      <span class="task-name-link" @click="openTaskDetail(row)">{{ row.taskName || '-' }}</span>
    </template>
    <template #default="{ currentUserRole }">
      <MaterialTaskDetailModal ref="detailModalRef" :current-user-role="currentUserRole" />
    </template>
  </MaterialPage>
</template>

<script setup lang="ts" name="/suzhou/materialTask/index">
import { ref } from 'vue'
import MaterialPage from '@/views/suzhou/common/components/MaterialPage.vue'
import MaterialTaskToolbar from '@/views/suzhou/materialTask/modules/materialTaskToolbar.vue'
import MaterialTaskSearch from '@/views/suzhou/materialTask/modules/materialTaskSearch.vue'
import MaterialTaskDetailModal from '@/views/suzhou/materialTask/modules/materialTaskDetailModal.vue'
import { MATERIAL_TASK_PAGE_CONFIG } from '@/views/suzhou/materialTask/config'
import type { MaterialTaskRow } from '@/views/suzhou/common/types/material'
import { ElMessage } from 'element-plus'

const detailModalRef = ref<InstanceType<typeof MaterialTaskDetailModal>>()

const openTaskDetail = (row: MaterialTaskRow) => {
  detailModalRef.value?.open(row)
}
</script>

<style scoped>
.task-name-link {
  color: var(--el-color-primary);
  cursor: pointer;
}

.task-name-link:hover {
  text-decoration: underline;
}
</style>
