<script lang="ts">
export default {
  name: '/goalValue/customGoalValue/components/MainTable'
}
</script>

<script setup lang="ts">
import { defineProps, reactive, ref, defineExpose, nextTick, watch } from 'vue'
import { VxeColumnPropTypes } from 'vxe-table'

interface Props {
  mainTableData: any[]
}

const props = defineProps<Props>()

const mainTableRef = ref()
const mainLoading = ref(false)

const yesNoList = reactive([
  { label: '是', value: '1' },
  { label: '否', value: '0' }
])

const recList = reactive([
  { label: '启用', value: '1' },
  { label: '停用', value: '0' }
])

const normalizeYesNo = (value: any) => {
  if (typeof value === 'boolean') return value ? '1' : '0'
  return String(value)
}

const formatterYesNo: VxeColumnPropTypes.Formatter<any> = ({ cellValue }) => {
  const item = yesNoList.find((item: any) => item.value === normalizeYesNo(cellValue))
  return item ? item.label : cellValue
}

const formatterRec: VxeColumnPropTypes.Formatter<any> = ({ cellValue }) => {
  const item = recList.find((item: any) => item.value === String(cellValue))
  return item ? item.label : cellValue
}

const clearCheckboxSelection = async () => {
  await mainTableRef.value?.clearCheckboxRow()
}

const cellClickHandle = async ({ row, column }: any) => {
  if (column.type === 'checkbox') return
  await clearCheckboxSelection()
  await mainTableRef.value?.setCheckboxRow(row, true)
}

watch(
  () => props.mainTableData,
  async () => {
    await nextTick()
    await clearCheckboxSelection()
  }
)

defineExpose({
  mainTableRef,
  mainLoading
})
</script>

<template>
  <div class="table-box">
    <vxe-table
      :loading="mainLoading"
      ref="mainTableRef"
      :checkbox-config="{ trigger: 'row', highlight: true }"
      @cell-click="cellClickHandle"
      :show-overflow="true"
      :row-config="{ height: 32, isCurrent: false }"
      :data="props.mainTableData"
      align="center"
      height="100%"
      border
      resizable
    >
      <vxe-column width="80" type="checkbox"></vxe-column>
      <vxe-column width="80" title="序号" field="sort"></vxe-column>
      <vxe-column width="280" title="名称" field="name"></vxe-column>
      <vxe-column width="160" :formatter="formatterRec" title="状态" field="sfqy"></vxe-column>
      <vxe-column width="160" :formatter="formatterYesNo" title="是否子公司" field="sfzgs"></vxe-column>
      <vxe-column width="160" :formatter="formatterYesNo" title="是否末级节点" field="leaf"></vxe-column>
      <vxe-column width="120" title="年度" field="nd"></vxe-column>
    </vxe-table>
  </div>
</template>

<style scoped lang="less">
.table-box {
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;

  :deep(.vxe-body--row) {
    cursor: pointer;
  }
}
</style>
