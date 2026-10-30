<!-- 历史项目领用物料扩展汇总 - 单价明细弹窗 -->
<template>
  <vxe-modal
    :model-value="visible"
    :title="dialogTitle"
    :destroy-on-close="true"
    :show-footer="false"
    show-zoom
    resize
    esc-closable
    position="center"
    width="1100"
    height="660"
    class-name="price-detail-modal-ext"
    @hide="handleHide"
    @show="handleShow"
  >
    <div class="price-detail-modal-ext__body">
      <RangeVxeTable
        ref="tableRef"
        class="pde-vxe-table"
        stripe
        row-key="id"
        row-click-mode="none"
        :border="true"
        :pagination="true"
        :request-auto="false"
        :request-api="getPageList"
        :data-callback="callBackHandle"
        :columns="tableColumns"
        :tool-button="false"
        :loading="loading"
        :init-param="initParam"
      />
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
defineOptions({ name: "PriceDetailDialogExt" })
import { computed, nextTick, reactive, ref } from 'vue'
import type { VxeGridProps } from 'vxe-table'
import RangeVxeTable from '@/components/RangeVxeTable/index.vue'
import { formatNumValue } from '@/utils/utils'
import { getPageExtDetail } from '@/api/ai/materialPriceLibrary'

const props = defineProps<{
  modelValue: boolean
  matnr: string
  maktx?: string
  zkzbm?: string
  unitPriceType: number
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const tableRef = ref<any>(null)
const loading = ref(false)

const visible = computed(() => props.modelValue)

// 单价类型映射：0:最新 1:最低 2:最高
const unitPriceTypeMap: Record<number, string> = { 0: '最新', 1: '最低', 2: '最高' }
const unitPriceTypeName = computed(() => unitPriceTypeMap[props.unitPriceType] ?? '-')

const dialogTitle = computed(() => `物料明细 - ${props.matnr || '-'} - ${unitPriceTypeName.value}单价`)

const initParam = computed(() => ({
  matnr: props.matnr,
  zkzbm: props.zkzbm,
  unitPriceType: props.unitPriceType
}))

const getPageList = (param: any) => {
  loading.value = true
  return getPageExtDetail(param).finally(() => {
    loading.value = false
  })
}

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const handleShow = async () => {
  await nextTick()
  tableRef.value?.getTableList()
}

const handleHide = () => {
  emit('update:modelValue', false)
}

/** vxe-grid 列 */
const tableColumns = reactive<NonNullable<VxeGridProps['columns']>>([
  { type: 'seq', title: '序号', width: 60 },
  { field: 'mjahr', title: '凭证年度', width: 100, align: 'center', headerAlign: 'center' },
  { field: 'mblnr', title: '物料凭证编号', width: 160, align: 'center', headerAlign: 'center' },
  { field: 'pspid', title: '项目定义', width: 160, align: 'center', headerAlign: 'center' },
  { field: 'post1', title: '项目描述', width: 280 },
  {
    field: 'menge',
    title: '数量',
    width: 120,
    align: 'center',
    headerAlign: 'center'
  },
  {
    field: 'unitPrice',
    title: '单价(元)',
    width: 150,
    align: 'right',
    headerAlign: 'center',
    formatter: ({ cellValue }: any) => (cellValue == null || cellValue === '' ? '-' : formatNumValue(String(cellValue), 2))
  },
  { field: 'unit', title: '计量单位', width: 120, align: 'center', headerAlign: 'center' },
  { field: 'createTime', title: '凭证创建日期', width: 140, align: 'center', headerAlign: 'center' },
  {
    field: 'unitPriceType',
    title: '单价类型',
    width: 110,
    align: 'center',
    headerAlign: 'center'
  }
])
</script>

<style scoped lang="less">
@import '../css/index.less';

.price-detail-modal-ext__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #f5fbfb;
}
</style>

<style lang="less">
.price-detail-modal-ext .vxe-modal--box {
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
}

.price-detail-modal-ext .vxe-modal--header {
  min-height: 50px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #fcffff;
}

.price-detail-modal-ext .vxe-modal--body,
.price-detail-modal-ext .vxe-modal--content {
  padding: 0;
  overflow: hidden;
  background-color: #f5fbfb;
}

.price-detail-modal-ext .vxe-modal--content {
  height: 100%;
}
</style>
