<template>
  <div class="table">
    <vxe-grid
      ref="gridRef"
      v-bind="gridOptions"
      @cell-click="$emit('cell-click', $event)"
      @checkbox-change="$emit('checkbox-change')"
      @checkbox-all="$emit('checkbox-all')"
    ></vxe-grid>
  </div>
  <ColSetting ref="colRef" :grid-ref="gridRef" :col-setting="colSetting" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { VxeGridInstance } from 'vxe-table'
import ColSetting from '@/components/base/vxeColSetting.vue'
import type { AttachTaskGridOptions, AttachTaskRow } from '../types'

const props = defineProps({
  gridOptions: {
    type: Object as PropType<AttachTaskGridOptions>,
    required: true
  }
})

defineEmits(['cell-click', 'checkbox-change', 'checkbox-all'])

const gridRef = ref<VxeGridInstance>()
const colRef = ref<InstanceType<typeof ColSetting>>()

const colSetting = computed(() => {
  return (props.gridOptions.columns || [])
    .filter((item: any) => item.field)
    .map((item: any) => {
      item.prop = item.prop || item.field
      if (typeof item.visible === 'undefined') item.visible = true
      return item
    })
})

defineExpose({
  getCheckboxRecords: () => gridRef.value?.getCheckboxRecords() || [],
  clearCheckboxRow: () => gridRef.value?.clearCheckboxRow(),
  setCheckboxRow: (row: AttachTaskRow, checked: boolean) => gridRef.value?.setCheckboxRow(row, checked),
  openColSetting: () => colRef.value?.openColSetting()
})
</script>

<style scoped lang="less">
.table {
  flex: 1;
  min-height: 0;
}
</style>
