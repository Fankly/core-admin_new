<template>
  <vxe-modal
    v-model="isShowModal"
    :loading="loading"
    destroy-on-close
    resize
    show-zoom
    position="center"
    title="出入库明细"
    width="80%"
    height="600px"
    @close="handleClose"
  >
    <div class="material-task-ck-tk-detail">
      <div class="table">
        <vxe-grid ref="gridRef" v-bind="gridOptions"></vxe-grid>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
defineOptions({ name: "materialTaskCkTkDetail" })
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import { getCkTkDetail } from '@/api/suzhou/materialTask'

interface CkTkDetailRow {
  pspid?: string
  post1Xm?: string
  posid?: string
  post1?: string
  bukrs?: string
  prctr?: string
  gjahr?: string
  belnr?: string
  buzei?: string
  budat?: string
  matnr?: string
  maktx?: string
  menge?: string
  msehl?: string
  wrbtr?: string
  zjxs?: string
  zjxszc?: string
  ebeln?: string
  ebelp?: string
  hkont?: string
  txt20?: string
  aufnr?: string
  [key: string]: any
}

interface OpenParams {
  pspid: string
  matnr: string
}

const isShowModal = ref(false)
const loading = ref(false)
const gridRef = ref()
const currentParams = ref<OpenParams>({ pspid: '', matnr: '' })

const gridOptions = reactive<VxeGridProps<CkTkDetailRow>>({
  border: true,
  stripe: true,
  height: '100%',
  showOverflow: true,
  showHeaderOverflow: true,
  headerAlign: 'center',
  align: 'center',
  rowConfig: {
    height: 32
  },
  columnConfig: {
    resizable: true
  },
  columns: [
    { type: 'seq', width: 60, title: '序号' },
    { field: 'pspid', title: '项目定义', width: 140 },
    { field: 'post1Xm', title: '项目定义描述', minWidth: 200 },
    { field: 'posid', title: 'WBS元素', width: 140 },
    { field: 'post1', title: 'WBS描述', minWidth: 200 },
    { field: 'matnr', title: '物料编码', width: 140 },
    { field: 'maktx', title: '物料描述', minWidth: 200 },
    { field: 'menge', title: '数量', width: 100 },
    { field: 'msehl', title: '单位', width: 80 },
    { field: 'wrbtr', title: '金额', width: 120 },
    { field: 'zjxs', title: '进项税', width: 100 },
    { field: 'zjxszc', title: '转出进项税额', width: 120 },
    { field: 'budat', title: '过账日期', width: 120 },
    { field: 'gjahr', title: '会计年度', width: 100 },
    { field: 'belnr', title: '会计凭证编号', width: 140 },
    { field: 'buzei', title: '行项目', width: 80 },
    { field: 'bukrs', title: '公司代码', width: 100 },
    { field: 'prctr', title: '利润中心', width: 100 },
    { field: 'ebeln', title: '采购凭证号', width: 140 },
    { field: 'ebelp', title: '采购凭证项目号', width: 120 },
    { field: 'hkont', title: '总账科目', width: 120 },
    { field: 'txt20', title: '科目名称', minWidth: 160 },
    { field: 'aufnr', title: '单号', width: 140 }
  ],
  data: []
})

const getTableData = async () => {
  loading.value = true
  try {
    const res = await getCkTkDetail({
      pspid: currentParams.value.pspid,
      matnr: currentParams.value.matnr
    })
    if (!res.success) throw new Error(res.msg || '查询出入库明细失败')
    gridOptions.data = res.data || []
  } catch (error) {
    ElMessage.error((error as Error).message)
  } finally {
    loading.value = false
  }
}

const resetData = () => {
  gridOptions.data = []
  currentParams.value = { pspid: '', matnr: '' }
}

const handleClose = () => {
  isShowModal.value = false
  resetData()
}

const open = async (params: OpenParams) => {
  currentParams.value = { pspid: params.pspid, matnr: params.matnr }
  gridOptions.data = []
  isShowModal.value = true
  await getTableData()
}

defineExpose({
  open
})
</script>

<style scoped lang="less">
.material-task-ck-tk-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;

  .table {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}
</style>
