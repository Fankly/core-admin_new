<template>
  <vxe-modal resize show-zoom v-model="isShowModal" destroy-on-close :title="modalTitle" fullscreen width="80%" @close="handleClose">
    <div class="warning-detail-modal">
      <RangeVxeTableStyle
        ref="tableRef"
        :columns="tableColumns"
        :request-api="getPageList"
        :request-auto="true"
        :pagination="true"
        :page-size="100"
        :init-param="initParam"
        :data-callback="callBackHandle"
        :loading="loading"
        row-click-mode="none"
        row-key="id"
      >
        <template #tableHeader>
          <el-button @click="handleExport" size="small" type="primary" plain>导 出</el-button>
        </template>
      </RangeVxeTableStyle>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts" name="WarningDetailModal">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import RangeVxeTableStyle from '@/components/RangeVxeTableStyle/index.vue'
import { getYjxmKeyNodeDetail, exportYjxmKeyNodeDetail } from '@/api/lyg/index'
import { apiExportHandle } from '@/utils/export'
import { getDetailColumns, getExportFileName, getModalTitle } from '@/views/lyg/warningInfo/data/warningDetailColumns'

const tableRef = ref<any>(null)
const isShowModal = ref(false)
const loading = ref(false)
const modalTitle = ref('')
const exportFileName = ref('预警明细')
const exportParams = ref<Record<string, any>>({})

const initParam = reactive<Record<string, any>>({})
const tableColumns = ref<any[]>([])

const callBackHandle = (data: any) => {
  loading.value = false
  return data
}

const getPageList = (params: any) => {
  loading.value = true
  exportParams.value = { ...params }
  return getYjxmKeyNodeDetail({ ...params })
}

const handleExport = () => {
  apiExportHandle({ ...exportParams.value }, exportFileName.value, exportYjxmKeyNodeDetail)
}

const handleClose = () => {
  isShowModal.value = false
}

const acceptParams = async (params: {
  yjhjReal: string
  yjlx: string
  dwId?: string
  cxjb?: string
  mapLevel?: string
  xmlx?: string
  nd?: string
  [key: string]: any
}) => {
  const { yjhjReal, yjlx, ...rest } = params
  modalTitle.value = getModalTitle(yjhjReal, yjlx)
  exportFileName.value = getExportFileName(yjhjReal, yjlx)
  tableColumns.value = getDetailColumns(yjhjReal, yjlx)

  Object.keys(initParam).forEach((key) => delete initParam[key])
  initParam.yjhjReal = yjhjReal
  initParam.yjlx = yjlx
  Object.assign(initParam, rest)

  isShowModal.value = true
  await nextTick()
}

defineExpose({ acceptParams })
</script>

<style scoped>
.warning-detail-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
}
</style>
