<template>
  <vxe-modal
    v-model="isShowModal"
    class-name="view-annual-key-task-modal"
    destroy-on-close
    position="center"
    resize
    show-zoom
    title="查看年度重点任务"
    width="90%"
    height="82%"
    :loading="tableLoading"
    @close="handleClose"
  >
    <div class="view-content">
      <div class="view-toolbar">
        <div class="view-actions">
          <el-button type="danger" plain :disabled="!selectedRows.length || deleting" :loading="deleting" @click="handleDelete">删 除</el-button>
          <el-button plain :disabled="deleting" @click="handleClose">关 闭</el-button>
        </div>
        <span class="selection-tip" v-if="selectedRows.length">已选 {{ selectedRows.length }} 条</span>
      </div>
      <div class="view-table-wrapper">
        <vxe-table
          ref="tableRef"
          :loading="tableLoading"
          :checkbox-config="checkboxConfig"
          @checkbox-change="checkboxChangeHandle"
          @checkbox-all="checkboxChangeHandle"
          align="center"
          header-align="center"
          height="100%"
          :row-config="{ height: 36, isHover: true }"
          :border="true"
          :data="tableData"
          :column-config="{ resizable: true }"
        >
          <vxe-column type="checkbox" width="60"></vxe-column>
          <vxe-column field="glbm" title="管理部门" min-width="160"></vxe-column>
          <vxe-column field="nd" title="年度" min-width="120"></vxe-column>
          <vxe-column field="zdrwbm" title="重点任务编码" min-width="180"></vxe-column>
          <vxe-column field="zyfl" title="专业分类" min-width="160"></vxe-column>
          <vxe-column field="zyflZdrw" title="专业分类重点任务" min-width="220"></vxe-column>
        </vxe-table>
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
defineOptions({ name: "ViewAnnualKeyTaskModal" })
import { ref, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import VXETable from 'vxe-table'
import { getAlreadyLinkNdzdrw, deleteAlreadyLinkNdzdrw } from '@/api/sys/proCategory'

interface AcceptParams {
  protypeId: string
}

interface NdZdrwRow {
  id: string
  glbm?: string
  nd?: string
  zdrwbm?: string
  zyfl?: string
  zyflZdrw?: string
}

const emit = defineEmits(['saveDataAfter'])

const tableRef = ref()
const isShowModal = ref(false)
const tableLoading = ref(false)
const deleting = ref(false)
const tableData = shallowRef<NdZdrwRow[]>([])
const selectedRows = ref<NdZdrwRow[]>([])
const protypeId = ref('')

const checkboxConfig = {
  trigger: 'row',
  highlight: true
}

const checkboxChangeHandle = () => {
  selectedRows.value = tableRef.value?.getCheckboxRecords() || []
}

const loadList = async () => {
  tableLoading.value = true
  selectedRows.value = []
  try {
    const res = await getAlreadyLinkNdzdrw({ protypeId: protypeId.value })
    if (!res.success) throw new Error(res.msg || '已关联年度重点任务加载失败')
    tableData.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    const e = error as Error
    ElMessage.error(e.message || '已关联年度重点任务加载失败，请稍后重试')
    tableData.value = []
  } finally {
    tableLoading.value = false
  }
}

const acceptParams = (params: AcceptParams) => {
  protypeId.value = params.protypeId
  isShowModal.value = true
  loadList()
}

const handleDelete = async () => {
  if (!selectedRows.value.length) return
  const ids = selectedRows.value.map((row) => String(row.id)).filter(Boolean)
  if (!ids.length) {
    ElMessage.warning('所选数据缺少ID，无法删除')
    return
  }
  try {
    const type = await VXETable.modal.confirm('是否确认删除所选年度重点任务关联?', '提示', {
      confirmButtonText: '是',
      cancelButtonText: '否',
      showClose: false
    })
    if (type !== 'confirm') return
    deleting.value = true
    const res = await deleteAlreadyLinkNdzdrw({ ids })
    if (!res.success) throw new Error(res.msg || '删除失败')
    ElMessage.success('删除成功')
    await loadList()
    emit('saveDataAfter')
  } catch (error) {
    const e = error as Error
    if (e.message !== 'cancel') {
      ElMessage.error(e.message || '删除失败，请稍后重试')
    }
  } finally {
    deleting.value = false
  }
}

const handleClose = () => {
  tableData.value = []
  selectedRows.value = []
  protypeId.value = ''
  isShowModal.value = false
}

defineExpose({ acceptParams })
</script>

<style scoped lang="less">
.view-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.view-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  padding-bottom: 12px;
}

.view-actions {
  display: flex;
  align-items: center;
  gap: 10px;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.selection-tip {
  color: var(--el-text-color-secondary, #64748b);
  font-size: 13px;
}

.view-table-wrapper {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

:deep(.vxe-modal--content) {
  display: flex;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
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

    &.row--checked,
    &.row--current {
      background-color: rgba(0, 112, 107, 0.1) !important;
    }
  }

  .vxe-cell--checkbox .vxe-checkbox--icon {
    transition: color 0.18s ease;
  }

  .vxe-cell--checkbox:hover .vxe-checkbox--icon {
    color: var(--color-primary, var(--el-color-primary, #00706b));
  }
}
</style>
