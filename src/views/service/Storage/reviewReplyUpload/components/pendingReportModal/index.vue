<template>
  <vxe-modal
    v-model="visible"
    :title="title"
    width="1200"
    height="680"
    transfer
    resize
    show-zoom
    fullscreen
    destroy-on-close
    :mask-closable="false"
    position="center"
    @close="close"
  >
    <div class="pending-report-modal">
      <div class="operation-bar">
        <slot name="operation" :selected-list="selectedRows" />
        <el-button v-if="exportApi" type="primary" size="mini" plain @click="handleExport">导 出</el-button>
        <el-button size="mini" plain @click="close">关 闭</el-button>
      </div>
      <div v-if="$slots.search" class="search-bar">
        <slot name="search" />
      </div>
      <div class="table-grid">
        <vxe-grid
          ref="gridRef"
          v-bind="gridOptions"
          @current-change="handleCurrentChange"
          @checkbox-change="handleCheckboxChange"
          @checkbox-all="handleCheckboxChange"
        />
      </div>
      <div class="pagination-bar">
        <el-pagination
          background
          :current-page="page"
          :page-sizes="[20, 50, 100, 200]"
          :page-size="limit"
          :total="parseInt(total + '')"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </vxe-modal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridInstance, VxeGridProps, VxeGridPropTypes } from 'vxe-table'
import type { Result } from '@/api/types'

interface PendingReportModalProps {
  title?: string
  searchApi: (params: Record<string, any>) => Promise<Result>
  exportApi?: (params: Record<string, any>) => Promise<Result>
  columns: VxeGridPropTypes.Columns
  defaultParams?: Record<string, any>
  /** 是否显示复选框多选，默认 false（单行 current 选中） */
  showCheckbox?: boolean
}

const props = withDefaults(defineProps<PendingReportModalProps>(), {
  title: '待省专业上传评审报告',
  defaultParams: () => ({}),
  showCheckbox: false
})

const emit = defineEmits(['selectionChange'])

const visible = ref(false)
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const selectedRows = ref<any[]>([])
const gridRef = ref<VxeGridInstance>()
const initialParams = ref<Record<string, any>>({})

const gridOptions = reactive<VxeGridProps>({
  border: true,
  columnConfig: { resizable: true },
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  // 多选：取消 current 行高亮，改用 checkbox 选中行高亮；单选：保留 current 高亮
  rowConfig: { height: 32, isCurrent: !props.showCheckbox, isHover: true },
  checkboxConfig: {
    highlight: props.showCheckbox,
    // 开启 trigger:row 后点击整行即可勾选/取消复选框
    trigger: 'row'
  },
  columns: [],
  data: []
})

const clearSelection = async () => {
  selectedRows.value = []
  emit('selectionChange', [])
  await gridRef.value?.clearCurrentRow?.()
  await gridRef.value?.clearCheckboxRow?.()
}

const fetchData = async () => {
  if (!props.searchApi) {
    console.warn('searchApi必须填写!')
    return
  }
  gridOptions.loading = true
  try {
    const res = await props.searchApi({ page: page.value, limit: limit.value, ...props.defaultParams, ...initialParams.value })
    if (res.success) {
      gridOptions.data = res.data?.records ?? []
      total.value = res.data?.total ?? 0
      await clearSelection()
    } else {
      ElMessage.error(res.msg)
      gridOptions.data = []
      total.value = 0
      await clearSelection()
    }
  } catch {
    ElMessage.error('查询失败')
    gridOptions.data = []
    total.value = 0
    await clearSelection()
  } finally {
    gridOptions.loading = false
  }
}

const buildColumns = () => {
  const cols: VxeGridPropTypes.Columns = []
  if (props.showCheckbox) {
    cols.push({ type: 'checkbox', width: 50 })
  }
  cols.push({ type: 'seq', width: 60 }, ...props.columns)
  return cols
}

const open = (params?: Record<string, any>) => {
  visible.value = true
  initialParams.value = params ?? {}
  page.value = 1
  gridOptions.data = []
  gridOptions.columns = []
  gridOptions.columns = buildColumns()
  void fetchData()
}

const refresh = () => fetchData()

const close = () => {
  gridOptions.data = []
  gridOptions.columns = []
  visible.value = false
}

const handleCurrentChange = ({ row }: any) => {
  // 多选模式下由 checkbox-change 同步选中数据（含点击行触发复选）
  if (props.showCheckbox) return
  selectedRows.value = row ? [row] : []
  emit('selectionChange', selectedRows.value)
}

const handleCheckboxChange = () => {
  if (!props.showCheckbox) return
  const records = gridRef.value?.getCheckboxRecords?.() ?? []
  selectedRows.value = records
  emit('selectionChange', selectedRows.value)
}

const handlePageChange = (val: number) => {
  page.value = val
  void fetchData()
}

const handleSizeChange = (val: number) => {
  page.value = 1
  limit.value = val
  void fetchData()
}

const handleExport = async () => {
  if (!props.exportApi) return
  gridOptions.loading = true
  try {
    const res = (await props.exportApi({ ...props.defaultParams, ...initialParams.value })) as any
    let blob: Blob
    if (res instanceof Blob) {
      blob = res
    } else if (res?.data instanceof Blob) {
      blob = res.data
    } else {
      ElMessage.error(res?.msg ?? '导出失败')
      return
    }
    const disposition = res?.headers?.['content-disposition']
    let filename = '导出.xlsx'
    if (disposition) {
      const match = disposition.split(';')[1]?.split('=')[1]
      if (match) filename = decodeURI(decodeURI(match))
    }
    const dom = document.createElement('a')
    const url = window.URL.createObjectURL(blob)
    dom.href = url
    dom.download = filename
    document.body.appendChild(dom)
    dom.click()
    document.body.removeChild(dom)
    window.URL.revokeObjectURL(url)
  } catch {
    ElMessage.error('导出失败')
  } finally {
    gridOptions.loading = false
  }
}

defineExpose({ open, refresh, close })
</script>

<style scoped lang="less">
.pending-report-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f2f3f5;

  .operation-bar {
    display: flex;
    gap: 5px;
    align-items: center;
    padding-bottom: 10px;
    background: #fff;

    :deep(.vxe-button) {
      border-radius: 2px;
    }
  }

  .search-bar {
    background: #fff;
    border-bottom: 1px solid #e5e6eb;
  }

  .table-grid {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #fff;
  }

  .pagination-bar {
    display: flex;
    justify-content: flex-end;
    background: #fff;

    :deep(.el-pagination) {
      .el-pager li {
        background: #f4f5f7 !important;
        border-radius: 2px;
        margin: 0 4px;

        &.active {
          background: #00706b !important;
          color: #fff !important;
        }
      }

      .btn-prev,
      .btn-next {
        background: #f4f5f7 !important;
        border-radius: 2px;

        &:hover {
          color: #00706b;
        }
      }
    }
  }
}
</style>
