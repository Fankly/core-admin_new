<script lang="ts">
export default {
  name: '/statistics/components/MainTable'
}
</script>

<script setup lang="ts">
import { defineProps, onMounted, reactive, ref, defineExpose, nextTick, watch } from 'vue'
import { InitParams } from '@/views/statistics/budgetStatisticsConfig.vue'
import { VxeColumnPropTypes } from 'vxe-table'
import { getPublicData } from '@/api/common'
import { ElMessage } from 'element-plus'

interface Props {
  mainTableData: any[]
  initParams: InitParams
  showExecutionFields?: boolean
  clickRowSelect?: boolean
}

const props = defineProps<Props>()

const publicList = ref([])
const mainTableRef = ref()
const mainLoading = ref(false)

const statusList = reactive([
  { label: '是', value: '1' },
  { label: '否', value: '0' }
])

const recList = reactive([
  { label: '启用', value: '1' },
  { label: '停用', value: '0' }
])

const formatterStatus: VxeColumnPropTypes.Formatter<any> = ({ cellValue }) => {
  const item = statusList.find((item: any) => item.value === cellValue)
  return item ? item.label : cellValue
}

const formatterRrc: VxeColumnPropTypes.Formatter<any> = ({ cellValue }) => {
  const item = recList.find((item: any) => item.value === cellValue)
  return item ? item.label : cellValue
}

const formatterStatMethod: VxeColumnPropTypes.Formatter<any> = ({ cellValue }) => {
  const item: any = publicList.value.find((item: any) => item.code === cellValue)
  return item ? item.name : cellValue
}

const clearCheckboxSelection = async () => {
  await mainTableRef.value?.clearCheckboxRow()
}

const cellClickHandle = async ({ row, column }: any) => {
  if (!props.clickRowSelect || column.type === 'checkbox') return
  await clearCheckboxSelection()
  await mainTableRef.value?.setCheckboxRow(row, true)
}

const getPublicDataList = async (code: string) => {
  let res = await getPublicData(code)
  if (res.success && res.data) {
    publicList.value = res.data
  } else {
    ElMessage.error(res.msg)
  }
}

const initParams = () => {
  getPublicDataList('YSTJPZ_TJFS')
}

onMounted(() => {
  initParams()
})

watch(
  () => props.mainTableData,
  async () => {
    if (!props.clickRowSelect) return
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
  <div class="table-box" :class="{ 'table-box--row-select': props.clickRowSelect }">
    <vxe-table
      :loading="mainLoading"
      ref="mainTableRef"
      :checkbox-config="props.clickRowSelect ? { trigger: 'row', highlight: true } : undefined"
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
      <vxe-column width="80" title="序号" field="dispOrder"></vxe-column>
      <vxe-column v-if="props.showExecutionFields" width="140" title="前台显示序号" field="subName"></vxe-column>
      <vxe-column width="280" title="名称" field="configName"></vxe-column>
      <vxe-column v-if="props.showExecutionFields" width="180" title="归口部门" field="gkbm"></vxe-column>
      <vxe-column v-if="props.showExecutionFields" width="180" title="预算来源" field="ysly"></vxe-column>
      <vxe-column v-if="props.showExecutionFields" width="180" title="承诺项目" field="cnxm"></vxe-column>
      <vxe-column v-if="props.showExecutionFields" width="220" title="承诺项目描述" field="cnxmms"></vxe-column>
      <vxe-column width="200" :formatter="formatterStatMethod" title="统计方式" field="statMethod"></vxe-column>
      <vxe-column width="200" :formatter="formatterRrc" title="状态" field="recState"></vxe-column>
      <vxe-column width="200" :formatter="formatterStatus" title="是否末级节点" field="isleaf"></vxe-column>
      <vxe-column width="200" title="是否显示" field="isDisplay" :formatter="formatterStatus"></vxe-column>
      <vxe-column width="200" title="年度" field="nd"></vxe-column>
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
}

.table-box--row-select {
  :deep(.vxe-body--row) {
    cursor: pointer;
  }
}
</style>
