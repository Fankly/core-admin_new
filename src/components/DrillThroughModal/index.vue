<template>
  <vxe-modal
    v-model="visible"
    :title="title"
    :width="width"
    :height="height"
    transfer
    resize
    show-zoom
    fullscreen
    destroy-on-close
    :mask-closable="false"
    position="center"
  >
    <div class="drill-through-modal">
      <div class="operation-bar">
        <slot name="operation" />
        <el-button v-if="exportApi" type="primary" size="mini" plain @click="handleExport">导 出</el-button>
        <el-button size="mini" plain @click="visible = false">关 闭</el-button>
      </div>
      <div v-if="$slots.search" class="search-bar">
        <slot name="search" />
      </div>
      <div class="table-grid">
        <vxe-grid v-bind="gridOptions" />
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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { VxeGridProps } from 'vxe-table'
import { VxeGridPropTypes } from 'vxe-table'
import { Result } from '@/api/types'

interface DrillThroughModalProps {
  title: string
  width?: string | number
  height?: string | number
  searchApi: (params: Record<string, any>) => Promise<Result>
  exportApi?: (params: Record<string, any>) => Promise<Result>
  columns: VxeGridPropTypes.Columns
  defaultParams?: Record<string, any>
}

const props = withDefaults(defineProps<DrillThroughModalProps>(), {
  width: '1200',
  height: '680',
  defaultParams: () => ({})
})

const visible = ref(false)
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const _initialParams = ref<Record<string, any>>({})

const gridOptions = reactive<VxeGridProps>({
  border: true,
  columnConfig: { resizable: true },
  loading: false,
  headerAlign: 'center',
  align: 'center',
  showOverflow: true,
  height: '100%',
  rowConfig: { height: 32 },
  columns: [],
  data: []
})

const fetchData = async () => {
  if (!props.searchApi) {
    console.warn('searchApi必须填写!')
    return
  }
  gridOptions.loading = true
  try {
    const res = await props.searchApi({ page: page.value, limit: limit.value, ...props.defaultParams, ..._initialParams.value })
    if (res.success) {
      gridOptions.data = res.data?.records ?? []
      total.value = res.data?.total ?? 0
    } else {
      ElMessage.error(res.msg)
      gridOptions.data = []
      total.value = 0
    }
  } catch {
    ElMessage.error('查询失败')
    gridOptions.data = []
    total.value = 0
  } finally {
    gridOptions.loading = false
  }
}

const open = (initialParams?: Record<string, any>) => {
  _initialParams.value = initialParams ?? {}
  page.value = 1
  gridOptions.data = []
  gridOptions.columns = [{ type: 'seq', width: 60 }, ...props.columns]
  visible.value = true
  fetchData()
}

const handlePageChange = (val: number) => {
  page.value = val
  fetchData()
}

const handleSizeChange = (val: number) => {
  page.value = 1
  limit.value = val
  fetchData()
}

const handleExport = async () => {
  if (!props.exportApi) return
  gridOptions.loading = true
  try {
    const res = (await props.exportApi({ ...props.defaultParams, ..._initialParams.value })) as any
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

defineExpose({ open })
</script>

<style scoped lang="less">
.drill-through-modal {
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

    :deep(.vxe-grid) {
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-thumb {
        background: #e5e6eb;
        border-radius: 3px;
        &:hover {
          background: #c9cdd4;
        }
      }
    }
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
