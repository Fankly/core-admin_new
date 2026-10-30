<template>
  <vxe-modal
    destroy-on-close
    :loading="loading"
    position="center"
    title="关联方案"
    v-model="isShowModal"
    width="720"
    height="520"
    show-zoom
    show-footer
    resize
    @close="handleCancel"
  >
    <template #default>
      <div class="scheme-table-wrapper">
        <vxe-table
          ref="tableRef"
          :loading="tableLoading"
          :radio-config="radioConfig"
          @cell-click="cellClickHandle"
          @radio-change="radioChangeHandle"
          align="center"
          header-align="center"
          height="100%"
          :row-config="{ height: 36, isHover: true }"
          :border="true"
          :data="tableData"
          :column-config="{ resizable: true }"
        >
          <vxe-column type="radio" width="60"></vxe-column>
          <vxe-column field="code" title="方案编码" min-width="180"></vxe-column>
          <vxe-column field="name" title="方案名称" min-width="260"></vxe-column>
        </vxe-table>
      </div>
    </template>
    <template #footer>
      <div class="operation">
        <el-button type="primary" plain :loading="loading" @click="handleSubmit">确认关联</el-button>
        <el-button type="danger" plain :disabled="loading" @click="handleCancel">取 消</el-button>
      </div>
    </template>
  </vxe-modal>
</template>

<script setup lang="ts">
defineOptions({ name: "LinkSchemeModal" })
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'
import { linkProtype } from '@/api/sys/proCategory'
import { configGetPage } from '@/api/xmInfo/stageConfig'

interface AcceptParams {
  ids: string[]
}

interface SchemeRow {
  id: string
  code?: string
  name?: string
}

const emit = defineEmits(['saveDataAfter'])

const tableRef = ref()
const isShowModal = ref(false)
const loading = ref(false)
const tableLoading = ref(false)
const tableData = ref<SchemeRow[]>([])
const parameter = ref<AcceptParams>({
  ids: []
})
const selectedRow = ref<SchemeRow | null>(null)

const radioConfig = {
  trigger: 'row',
  highlight: true
}

const cellClickHandle = ({ row }: any) => {
  tableRef.value?.setRadioRow(row)
  selectedRow.value = row
}

const radioChangeHandle = ({ row }: any) => {
  selectedRow.value = row
}

const loadSchemeList = async () => {
  tableLoading.value = true
  try {
    const res = await configGetPage({ page: 1, limit: 1000 })
    if (!res.success) throw new Error(res.msg || '方案列表加载失败')
    tableData.value = Array.isArray(res.data?.records) ? res.data.records : []
    selectedRow.value = null
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message || '方案列表加载失败，请稍后重试')
    tableData.value = []
  } finally {
    tableLoading.value = false
  }
}

const acceptParams = (params: AcceptParams) => {
  parameter.value = {
    ids: [...params.ids]
  }
  isShowModal.value = true
  loadSchemeList()
}

const handleSubmit = async () => {
  if (!selectedRow.value) {
    ElMessage.warning('请选择一个方案')
    return
  }
  try {
    const type = await VXETable.modal.confirm('是否确认关联所选方案?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否',
      showClose: false
    })
    if (type !== 'confirm') return
    loading.value = true
    const res = await linkProtype({
      ids: parameter.value.ids,
      onechartDataIds: [selectedRow.value.id]
    })
    if (res.success) {
      ElMessage.success('关联成功!')
      handleCancel()
      emit('saveDataAfter')
    } else {
      throw new Error(res.msg || '关联方案失败')
    }
  } catch (error) {
    const e = error as Error
    if (e.message !== 'cancel') {
      ElMessage.error(e.message || '关联方案失败，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  tableData.value = []
  selectedRow.value = null
  isShowModal.value = false
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="less">
.scheme-table-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.operation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

:deep(.vxe-table) {
  border-radius: 6px;
  overflow: hidden;

  .vxe-table--body-wrapper {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 112, 107, 0.32) transparent;

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 112, 107, 0.26);
      border-radius: 999px;

      &:hover {
        background: rgba(0, 112, 107, 0.42);
      }
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .vxe-header--column {
    font-weight: 600;
    background: linear-gradient(180deg, rgba(0, 112, 107, 0.08), rgba(0, 112, 107, 0.03)), var(--el-fill-color-lighter, #fafafa);
  }

  .vxe-body--row {
    &.row--hover,
    &:hover {
      background-color: rgba(0, 112, 107, 0.05) !important;
    }

    &.row--radio,
    &.row--current {
      background-color: rgba(0, 112, 107, 0.1) !important;
    }
  }

  .vxe-cell--radio .vxe-radio--icon {
    transition: color 0.18s ease;
  }

  .vxe-cell--radio:hover .vxe-radio--icon {
    color: var(--color-primary, var(--el-color-primary, #00706b));
  }
}

:deep(.vxe-modal--content) {
  display: flex;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}
</style>
