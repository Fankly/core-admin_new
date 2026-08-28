<template>
  <div class="table">
    <vxe-grid
      ref="gridRef"
      v-bind="gridOptions"
      @cell-click="$emit('cell-click', $event)"
      @checkbox-change="$emit('checkbox-change')"
      @checkbox-all="$emit('checkbox-all')"
    >
      <template #taskName_default="{ row }">
        <span class="task-name-link" @click.stop="$emit('open-detail', row)">{{ row.taskName || '-' }}</span>
      </template>
    </vxe-grid>
  </div>
  <ColSetting ref="colRef" :grid-ref="gridRef" :col-setting="colSetting" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PropType } from 'vue'
import type { VxeGridInstance } from 'vxe-table'
import ColSetting from '@/components/base/vxeColSetting.vue'
import type { SmartTaskAuditGridOptions, SmartTaskAuditRow } from '../types'

const props = defineProps({
  gridOptions: {
    type: Object as PropType<SmartTaskAuditGridOptions>,
    required: true
  }
})

defineEmits(['cell-click', 'checkbox-change', 'checkbox-all', 'open-detail'])

const gridRef = ref<VxeGridInstance>()
const colRef = ref<InstanceType<typeof ColSetting>>()

const colSetting = ref(
  (props.gridOptions.columns || [])
    .filter((item: any) => item.field)
    .map((item: any) => ({
      ...item,
      prop: item.prop || item.field,
      visible: typeof item.visible === 'undefined' ? true : item.visible
    }))
)

defineExpose({
  getCheckboxRecords: () => gridRef.value?.getCheckboxRecords() || [],
  clearCheckboxRow: () => gridRef.value?.clearCheckboxRow(),
  setCheckboxRow: (row: SmartTaskAuditRow, checked: boolean) => gridRef.value?.setCheckboxRow(row, checked),
  openColSetting: () => colRef.value?.openColSetting()
})
</script>

<style scoped lang="less">
.table {
  flex: 1;
  min-height: 0;
}

.task-name-link {
  color: var(--el-color-primary);
  cursor: pointer;
}

.task-name-link:hover {
  text-decoration: underline;
}
</style>
