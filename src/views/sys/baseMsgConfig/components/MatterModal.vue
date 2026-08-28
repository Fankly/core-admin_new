<template>
  <vxe-modal
    ref="modalRef"
    resize
    show-zoom
    v-model="isShowTable"
    :loading="loading"
    :destroy-on-close="true"
    title="重点投向选择"
    width="860"
    :height="700"
    :close-on-press-escape="false"
  >
    <proTable
      @row-click="rowClick"
      ref="proTableRef"
      :cell-style="columnStyle"
      :data-callback="dataCallbackHandle"
      :request-api="getDataList"
      :request-auto="true"
      :search-col="4"
      :columns="tableColumns"
      :init-param="parameter"
    >
      <template #tableHeader="scope">
        <el-button plain type="primary" size="mini" @click.stop="saveModal(scope.selectedList)"
          >确 定</el-button
        >
      </template>
    </proTable>
  </vxe-modal>
</template>

<script setup lang="ts" name="MatterModal">
import proTable from '@/components/ProTable/index.vue'
import { reactive, ref } from 'vue'
import { getPage } from '@/api/matter/matterYslxctgl'
const proTableRef = ref()
const isShowTable = ref(false)
const loading = ref(false)
const emit = defineEmits(['detail'])
// 保存数据
const saveModal = (selectedList: any[]) => {
  emit('detail', selectedList)
  isShowTable.value = false
}

interface AcceptParams {
  specialorgid: string
  roleCode: string
}

const parameter = ref<AcceptParams>({
  specialorgid: '',
  roleCode: ''
})

const acceptParams = (params: AcceptParams) => {
  isShowTable.value = true
  parameter.value = { ...parameter.value, ...params }
}

const rowClick = (row: any) => {
  proTableRef.value?.clearSelection()
  proTableRef.value?.element.toggleRowSelection(row)
}

const ztListData: any = ref([
  {
    code: '1',
    value: '启用'
  },
  {
    code: '0',
    value: '停用'
  }
])

const tableColumns = reactive<any>([
  { type: 'selection', width: 80 },
  {
    prop: 'id',
    label: '重点事项编码',
    width: '180',
    search: { el: 'input', order: 1 }
  },
  {
    prop: 'ctmc',
    label: '重点事项名称',
    search: { el: 'input', order: 2 }
  },
  {
    prop: 'zt',
    label: '状态',
    width: '120',
    search: { el: 'select' },
    enum: ztListData.value,
    fieldNames: { label: 'value', value: 'code' }
  }
])

const getDataList = (params: any) => {
  proTableRef.value?.clearSelection()
  return getPage(params)
}

const dataCallbackHandle = (data: any) => {
  loading.value = false
  return data
}

// 列颜色
const columnStyle = ({ row, column, rowIndex, columnIndex }: any) => {
  return 'cursor: pointer;'
}

defineExpose({
  acceptParams
})
</script>

<style scoped></style>
