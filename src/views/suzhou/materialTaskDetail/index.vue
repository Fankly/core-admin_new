<template>
  <MaterialPage :toolbar="MaterialTaskDetailToolbar" :search="MaterialTaskDetailSearch" :config="MATERIAL_TASK_DETAIL_PAGE_CONFIG">
    <template #fileNameList_default="{ row }">
      <div class="file-name-list">
        <template v-if="getFileItems(row).length">
          <el-tooltip
            v-for="(item, index) in getFileItems(row)"
            :key="`${item.fileId || item.fileName}-${index}`"
            :content="item.fileName"
            placement="top"
            :open-delay="300"
          >
            <a class="file-name-link" href="javascript:void(0)" @click.prevent="handlePreviewFile(item, row)">
              {{ item.fileName }}
            </a>
          </el-tooltip>
        </template>
        <span v-else>-</span>
      </div>
    </template>
    <template #default>
      <MaterialFilePreview ref="filePreviewRef" />
    </template>
  </MaterialPage>
</template>

<script setup lang="ts" name="/suzhou/materialTaskDetail/index">
import { ref } from 'vue'
import MaterialPage from '@/views/suzhou/common/components/MaterialPage.vue'
import MaterialTaskDetailToolbar from '@/views/suzhou/materialTaskDetail/modules/materialTaskDetailToolbar.vue'
import MaterialTaskDetailSearch from '@/views/suzhou/materialTaskDetail/modules/materialTaskDetailSearch.vue'
import MaterialFilePreview from '@/views/suzhou/materialTaskDetail/modules/materialFilePreview.vue'
import { getFileItems, type MaterialFileItem } from '@/views/suzhou/materialTaskDetail/utils/filePreview'
import { MATERIAL_TASK_DETAIL_PAGE_CONFIG } from '@/views/suzhou/materialTaskDetail/config'
import type { MaterialTaskDetailRow } from '@/views/suzhou/common/types/material'

const filePreviewRef = ref<InstanceType<typeof MaterialFilePreview>>()

const handlePreviewFile = (item: MaterialFileItem, row: MaterialTaskDetailRow) => {
  filePreviewRef.value?.handlePreviewFile(item, row)
}
</script>

<style scoped>
.file-name-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  line-height: 1.4;
  text-align: left;
  box-sizing: border-box;
}

/* el-tooltip 根节点也要占满列宽，否则 ellipsis 不生效 */
.file-name-list :deep(.el-tooltip),
.file-name-list :deep(.el-only-child__content) {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.file-name-link {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  color: var(--el-color-primary);
  cursor: pointer;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-sizing: border-box;
}

.file-name-link:hover {
  text-decoration: underline;
}
</style>
