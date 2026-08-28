<template>
  <div class="template-file-table">
    <div class="template-file-table__tools">
      <div class="left">
        <el-button v-if="hasPermission('UPLOAD')" type="primary" plain :disabled="selectedRows.length === 0" @click="emit('open-upload')">
          模板文件上传
        </el-button>
      </div>
      <div class="right">
        <div class="right-type">
          <span>展示类型：</span>
          <el-select :model-value="searchType" style="width: 130px" @change="handleSearchTypeChange">
            <el-option v-for="item in searchTypeList" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </div>
        <ToolbarButtons :tool-button="['help']" @help-click="emit('open-help')" />
      </div>
    </div>

    <div class="template-file-table__content">
      <vxe-table
        ref="tableRef"
        :checkbox-config="{ trigger: 'row', highlight: true }"
        @cell-click="cellClickHandle"
        @checkbox-change="checkChangeHandle"
        @checkbox-all="checkChangeAllHandle"
        align="center"
        :loading="loading"
        show-overflow
        show-header-overflow
        header-align="center"
        height="100%"
        :row-config="{ height: 32 }"
        :border="true"
        :data="rows"
        :column-config="{ resizable: true }"
      >
        <vxe-column
          v-for="(column, index) in TEMPLATE_FILE_TABLE_COLUMNS"
          :key="column.field || `${column.type}-${index}`"
          :type="column.type"
          :width="column.width"
          :field="column.field"
          :title="column.title"
        />
      </vxe-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import ToolbarButtons from '@/components/ToolbarButtons/index.vue'
import { TEMPLATE_FILE_TABLE_COLUMNS } from '../constants'
import type { SearchTypeOption, TemplateFileRow } from '../types'
import { nextTick, ref, watch } from 'vue'
import { usePermission } from '@/hooks/usePermission'

const props = defineProps<{
  loading: boolean
  rows: TemplateFileRow[]
  searchType: string
  searchTypeList: SearchTypeOption[]
}>()

const emit = defineEmits<{
  (event: 'selection-change', value: TemplateFileRow[]): void
  (event: 'update:searchType', value: string): void
  (event: 'search-type-change'): void
  (event: 'open-upload'): void
  (event: 'open-help'): void
}>()

const { hasPermission } = usePermission()
const tableRef = ref<any>()
const selectedRows = ref<TemplateFileRow[]>([])

const syncSelection = (rows: TemplateFileRow[]) => {
  selectedRows.value = rows
  emit('selection-change', rows)
}

const clearSelection = async () => {
  selectedRows.value = []
  emit('selection-change', [])
  await nextTick()
  await tableRef.value?.clearCheckboxRow()
}

const handleSearchTypeChange = (value: string) => {
  emit('update:searchType', value)
  emit('search-type-change')
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await tableRef.value?.clearCheckboxRow()
  await tableRef.value?.setCheckboxRow(row, true)
  syncSelection([row])
}

const checkChangeHandle = ({ records }: any) => {
  syncSelection(records)
}

const checkChangeAllHandle = ({ records }: any) => {
  syncSelection(records)
}

watch(
  () => props.rows,
  async () => {
    await clearSelection()
  }
)
</script>

<style scoped lang="less">
.template-file-table {
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background-color: var(--el-bg-color, #fff);
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  &__tools {
    height: 32px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    .left {
      flex: 1;
      min-width: 120px;
    }

    .right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      min-width: 0;
    }

    .right-type {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }
  }

  &__content {
    flex: 1;
    min-height: 0;
    min-width: 0;
  }
}
</style>
