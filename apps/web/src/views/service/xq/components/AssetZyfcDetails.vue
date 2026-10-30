<template>
  <div class="real-estate-details">
    <el-alert v-if="loadError" class="estate-alert" type="error" :closable="false" show-icon :title="loadError" />

    <vxe-grid
      class="estate-grid"
      :loading="loading"
      :data="tableData"
      :columns="tableColumns"
      :column-config="{ resizable: true }"
      :row-config="{ height: 32 }"
      empty-text="暂无自有房产信息"
      show-header-overflow
      show-overflow
      auto-resize
      border
      stripe
      align="center"
      header-align="center"
      height="100%"
      :pager-config="pagerConfig"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "AssetZyfcDetails" })
import { computed, reactive, ref, watch } from 'vue'
import { getOwnRealEstate } from '@/api/xmInfo/ownRealEstate'
import type { OwnRealEstateRowVO } from '@/api/xmInfo/ownRealEstate'
import { createOwnRealEstateDetailColumns } from '@/views/xmInfo/ownRealEstate/tableColumns'

interface Props {
  selectData?: Record<string, any> | null
  globalParams?: Record<string, any> | null
  initialData?: Record<string, any> | null
  opType?: string
  pageType: string
}

const props = withDefaults(defineProps<Props>(), {
  selectData: null,
  globalParams: null,
  initialData: null,
  opType: 'VIEW'
})

const loading = ref(false)
const loadError = ref('')
const tableData = ref<OwnRealEstateRowVO[]>([])
const tableColumns = createOwnRealEstateDetailColumns()

const getProjectId = (source?: Record<string, any> | null) =>
  source?.xmId || source?.xmid || source?.XMID || source?.proId || source?.PRO_ID || source?.ID || source?.id || ''

const projectId = computed(() => String(getProjectId(props.globalParams) || getProjectId(props.selectData) || getProjectId(props.initialData)).trim())

const requestPageType = computed(() => props.pageType)

const pagerConfig = reactive({
  enabled: true,
  currentPage: 1,
  pageSize: 20,
  total: 0,
  pageSizes: [10, 20, 50, 100],
  layouts: ['Total', 'PrevPage', 'JumpNumber', 'NextPage', 'Sizes']
})

const normalizeTotal = (data: unknown, rows: OwnRealEstateRowVO[]) => {
  const total = Number((data as { total?: number | string } | null)?.total)
  return Number.isFinite(total) && !Array.isArray(data) && total >= 0 ? total : rows.length
}

const normalizeRows = (data: unknown): OwnRealEstateRowVO[] => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []

  const record = data as OwnRealEstateRowVO & { records?: OwnRealEstateRowVO[] }
  if (Array.isArray(record.records)) return record.records
  return Object.keys(record).length ? [record] : []
}

let requestSequence = 0

const loadRealEstate = async () => {
  const sequence = ++requestSequence
  const xmId = projectId.value

  if (!xmId) {
    tableData.value = []
    pagerConfig.total = 0
    loadError.value = ''
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const result = await getOwnRealEstate(requestPageType.value, xmId, pagerConfig.currentPage, pagerConfig.pageSize)
    if (!result.success) throw new Error(result.msg || '自有房产信息加载失败')
    if (sequence === requestSequence) {
      const rows = normalizeRows(result.data)
      tableData.value = rows
      pagerConfig.total = normalizeTotal(result.data, rows)
    }
  } catch (error) {
    if (sequence !== requestSequence) return
    tableData.value = []
    pagerConfig.total = 0
    loadError.value = error instanceof Error ? error.message : '自有房产信息加载失败，请稍后重试'
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

const handlePageChange = ({ currentPage, pageSize }: { currentPage: number; pageSize: number }) => {
  pagerConfig.currentPage = pageSize !== pagerConfig.pageSize ? 1 : currentPage
  pagerConfig.pageSize = pageSize
  loadRealEstate()
}

watch(
  [projectId, requestPageType],
  () => {
    pagerConfig.currentPage = 1
    loadRealEstate()
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
@primary-color: #00706b;
@primary-hover-fill: #e6f4f3;
@table-header: #dff3f0;
@table-stripe: #f7fcfb;
@border-soft: #e2e8f0;
@text-regular: #475569;

.real-estate-details {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-color: #ffffff;
}

.estate-alert {
  flex-shrink: 0;
  margin-bottom: 10px;
  border-radius: 6px;
}

.estate-grid {
  flex: 1 1 0;
  width: 100%;
  height: 0;
  min-width: 0;
  min-height: 0;

  :deep(.vxe-table) {
    color: @text-regular;
    --vxe-font-color: @text-regular;
    --vxe-table-header-font-color: @primary-color;
    --vxe-table-header-background-color: @table-header;
    --vxe-table-header-font-weight: 600;
    --vxe-table-border-color: @border-soft;
    --vxe-table-row-hover-background-color: @primary-hover-fill;
    --vxe-table-row-striped-background-color: @table-stripe;
  }

  :deep(.vxe-table--header-wrapper),
  :deep(.vxe-table--header),
  :deep(.vxe-header--column) {
    background-color: @table-header !important;
  }

  :deep(.vxe-header--column) {
    min-height: 44px;
    color: @primary-color !important;
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.vxe-body--column) {
    color: @text-regular;
    font-size: 13px;
  }

  :deep(.vxe-body--row.row--stripe) {
    background-color: @table-stripe !important;
  }

  :deep(.vxe-body--row.row--hover),
  :deep(.vxe-body--row.row--hover.row--stripe) {
    background-color: @primary-hover-fill !important;
  }

  :deep(.vxe-body--row.row--stripe .vxe-body--column),
  :deep(.vxe-body--row.row--hover .vxe-body--column) {
    background-color: transparent !important;
  }

  :deep(.vxe-table--empty-content) {
    color: #64748b;
    font-size: 13px;
  }
}
</style>
